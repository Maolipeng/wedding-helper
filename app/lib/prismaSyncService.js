/**
 * 数据同步服务 (Prisma版本)
 * 
 * 协调本地数据和云端数据的同步，基于用户设置执行同步操作
 */

import * as dbService from './prismaDbService';
import { getMusicTrimSettings, saveMusicTrimSettings } from './musicStorage';
import { defaultProgram } from './defaultProgram';

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
    // 执行初始同步
    await syncData();
    
    // 设置定期同步
    setInterval(() => {
      syncData();
    }, 5 * 60 * 1000); // 每5分钟同步一次
  } catch (error) {
    console.error('初始化同步服务失败:', error);
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
    
    // 同步用户设置
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
    
    // 将设置同步到云端
    await dbService.syncSettings(localSettings);
    
    // 检查是否需要从云端获取设置
    // 只有当本地没有设置时才从云端获取
    if (!localSettings) {
      const cloudSettings = await dbService.fetchSettings();
      if (cloudSettings) {
        localStorage.setItem('weddingSettings', JSON.stringify(cloudSettings));
      }
    }
    
    return true;
  } catch (error) {
    console.error('同步设置失败:', error);
    return false;
  }
};

// 同步婚礼程序
const syncWeddingProgram = async () => {
  try {
    // 从localStorage获取婚礼程序
    const programStr = localStorage.getItem('weddingProgram');
    let localProgram = programStr ? JSON.parse(programStr) : null;
    
    // 如果本地没有程序，尝试从云端获取
    if (!localProgram || localProgram.length === 0) {
      const cloudProgram = await dbService.fetchWeddingProgram();
      if (cloudProgram && cloudProgram.length > 0) {
        localStorage.setItem('weddingProgram', JSON.stringify(cloudProgram));
        return true;
      } else {
        // 如果云端也没有，使用默认程序
        localProgram = defaultProgram;
        localStorage.setItem('weddingProgram', JSON.stringify(defaultProgram));
      }
    }
    
    // 将本地程序同步到云端
    return await dbService.syncWeddingProgram(localProgram);
  } catch (error) {
    console.error('同步婚礼程序失败:', error);
    return false;
  }
};

// 同步音频裁剪设置
const syncTrimSettings = async () => {
  try {
    // 从IndexedDB获取本地裁剪设置
    // 这里需要特殊处理，因为裁剪设置存在IndexedDB中
    // 我们需要在云端同步它们，但IndexedDB无法直接导出所有设置
    
    // 同步从云端获取的设置到本地
    const cloudSettings = await dbService.fetchTrimSettings();
    if (cloudSettings && cloudSettings.length > 0) {
      for (const setting of cloudSettings) {
        // 检查是否为预设音乐，格式为 "preset:id"
        const isPreset = setting.isPreset;
        let musicId = setting.musicId;
        
        // 预设音乐ID需要特殊处理
        if (isPreset && musicId.startsWith('preset:')) {
          musicId = musicId.substring(7); // 去掉 "preset:" 前缀
        }
        
        // 尝试获取本地设置来比较
        const localSetting = await getMusicTrimSettings(musicId, isPreset);
        
        // 如果本地没有或云端更新，则同步到本地
        if (!localSetting || 
            localSetting.start !== setting.start || 
            localSetting.end !== setting.end) {
          await saveMusicTrimSettings(musicId, {
            start: setting.start,
            end: setting.end
          }, isPreset);
        }
      }
    }
    
    return true;
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
    let localPresets = presetsStr ? JSON.parse(presetsStr) : null;
    
    // 如果本地没有预设，尝试从云端获取
    if (!localPresets || localPresets.length === 0) {
      const cloudPresets = await dbService.fetchPresetMusic();
      if (cloudPresets && cloudPresets.length > 0) {
        localStorage.setItem('weddingPresetMusic', JSON.stringify(cloudPresets));
        return true;
      }
    } else {
      // 将本地预设同步到云端
      return await dbService.syncPresetMusic(localPresets);
    }
    
    return true;
  } catch (error) {
    console.error('同步预设音乐失败:', error);
    return false;
  }
};