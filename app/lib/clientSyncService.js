/**
 * 客户端同步服务
 * 
 * 通过API调用与后端通信，不直接使用Prisma代码
 */

import { getAllTrimSettings, saveMusicTrimSettings } from './musicStorage';

// 最后同步时间记录
let lastSyncTime = 0;

// 同步锁，防止并发同步
let syncInProgress = false;

// 初始化同步服务
export const initSyncService = async () => {
  if (typeof window === 'undefined') return;
  
  // 检查同步设置
  const enableSync = localStorage.getItem('enableCloudSync') === 'true';
  if (!enableSync) return;
  
  try {
    // 检查数据库状态
    const response = await fetch('/api/db-status');
    const status = await response.json();
    
    if (!status.success || !status.connected) {
      console.warn('数据库连接不可用，云同步可能不工作');
      return false;
    }
    
    // 执行初始同步
    await syncData();
    
    // 设置定期同步
    setInterval(() => {
      syncData();
    }, 5 * 60 * 1000); // 每5分钟同步一次
    
    return true;
  } catch (error) {
    console.error('初始化同步服务失败:', error);
    return false;
  }
};

// 同步所有数据
export const syncData = async (force = false) => {
  if (typeof window === 'undefined') return;
  
  // 检查同步设置
  const enableSync = localStorage.getItem('enableCloudSync') === 'true';
  if (!enableSync && !force) return;
  
  // 防止并发同步
  if (syncInProgress) return;
  
  try {
    syncInProgress = true;
    console.log('开始同步数据...');
    
    // 通过API调用同步设置
    await syncSettings();
    
    // 同步婚礼程序
    await syncWeddingProgram();
    
    // 同步音频裁剪设置
    await syncTrimSettings();
    
    // 同步预设音乐
    await syncPresetMusic();
    
    // 更新同步时间
    lastSyncTime = Date.now();
    localStorage.setItem('lastSyncTime', lastSyncTime.toString());
    
    console.log('数据同步完成');
    return true;
  } catch (error) {
    console.error('数据同步失败:', error);
    return false;
  } finally {
    syncInProgress = false;
  }
};

// 同步设置
const syncSettings = async () => {
  try {
    // 从localStorage获取设置
    const settingsStr = localStorage.getItem('weddingSettings');
    if (!settingsStr) return false;
    
    const localSettings = JSON.parse(settingsStr);
    
    // 通过API将设置同步到云端
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'syncSettings',
        data: localSettings
      })
    });
    
    return response.ok;
  } catch (error) {
    console.error('同步设置失败:', error);
    return false;
  }
};

// 同步婚礼程序
const syncWeddingProgram = async () => {
  try {
    // 从localStorage获取数据
    const programStr = localStorage.getItem('weddingProgram');
    if (!programStr) return false;
    
    const program = JSON.parse(programStr);
    
    // 通过API同步
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'syncProgram',
        data: program
      })
    });
    
    return response.ok;
  } catch (error) {
    console.error('同步婚礼程序失败:', error);
    return false;
  }
};

// 同步音频裁剪设置
const syncTrimSettings = async () => {
  try {
    // 获取所有裁剪设置
    const allTrimSettings = await getAllTrimSettings();
    
    // 如果没有裁剪设置，跳过
    if (!allTrimSettings || allTrimSettings.length === 0) {
      return true;
    }
    
    // 通过API同步每个裁剪设置
    let successCount = 0;
    for (const trim of allTrimSettings) {
      try {
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'syncTrim',
            data: {
              musicId: trim.musicId,
              settings: {
                start: trim.start,
                end: trim.end
              },
              isPreset: trim.isPreset
            }
          })
        });
        
        if (response.ok) {
          successCount++;
        }
      } catch (err) {
        console.error(`同步裁剪设置 ${trim.musicId} 失败:`, err);
      }
    }
    
    return successCount > 0;
  } catch (error) {
    console.error('同步音频裁剪设置失败:', error);
    return false;
  }
};

// 同步预设音乐
const syncPresetMusic = async () => {
  try {
    // 从localStorage获取预设音乐
    const presetsStr = localStorage.getItem('weddingPresetMusic');
    if (!presetsStr) return false;
    
    const presets = JSON.parse(presetsStr);
    
    // 通过API同步
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'syncPresets',
        data: presets
      })
    });
    
    return response.ok;
  } catch (error) {
    console.error('同步预设音乐失败:', error);
    return false;
  }
};

// 云端数据获取函数
export const fetchCloudData = async () => {
  try {
    // 获取婚礼程序
    const programResponse = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'fetchProgram' })
    });
    
    // 获取设置
    const settingsResponse = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'fetchSettings' })
    });
    
    // 获取预设音乐
    const presetsResponse = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'fetchPresets' })
    });
    
    // 获取裁剪设置
    const trimResponse = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'fetchTrimSettings' })
    });
    
    // 处理响应
    const [programData, settingsData, presetsData, trimData] = await Promise.all([
      programResponse.ok ? programResponse.json() : { success: false },
      settingsResponse.ok ? settingsResponse.json() : { success: false },
      presetsResponse.ok ? presetsResponse.json() : { success: false },
      trimResponse.ok ? trimResponse.json() : { success: false }
    ]);
    
    // 收集结果
    const results = {
      success: false,
      program: null,
      settings: null,
      presets: null,
      trimSettings: null
    };
    
    if (programData.success && programData.result && programData.result.length > 0) {
      results.program = programData.result;
      results.success = true;
    }
    
    if (settingsData.success && settingsData.result) {
      results.settings = settingsData.result;
      results.success = true;
    }
    
    if (presetsData.success && presetsData.result && presetsData.result.length > 0) {
      results.presets = presetsData.result;
      results.success = true;
    }
    
    if (trimData.success && trimData.result && trimData.result.length > 0) {
      results.trimSettings = trimData.result;
      results.success = true;
    }
    
    return results;
  } catch (error) {
    console.error('获取云端数据失败:', error);
    return { success: false, error };
  }
};

// 批量同步所有数据
export const syncAllData = async (
  program, 
  settings,
  presetMusic,
  trimSettings
) => {
  try {
    // 使用批量同步API
    const response = await fetch('/api/batch-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        program,
        settings,
        presetMusic,
        trimSettings
      })
    });
    
    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('批量同步失败:', error);
    throw error;
  }
};