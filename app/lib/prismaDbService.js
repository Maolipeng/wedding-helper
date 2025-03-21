/**
 * 基于 Prisma 的数据库服务
 * 
 * 提供与数据库的交互功能，用于云端同步数据
 */

import prisma from './prisma';

// 检查数据库连接状态
export const checkDbStatus = async () => {
  try {
    // 执行简单查询测试连接
    await prisma.$queryRaw`SELECT 1`;
    return { 
      enabled: true, 
      connected: true, 
      message: '数据库连接正常' 
    };
  } catch (error) {
    console.error('数据库连接测试失败:', error);
    return { 
      enabled: true, 
      connected: false, 
      message: '数据库连接失败', 
      error: error.message 
    };
  }
};

// 获取用户ID (在实际应用中应当从认证系统获取)
export const getUserId = () => {
  // 使用随机生成的client_id，存储在localStorage中
  if (typeof window !== 'undefined') {
    let clientId = localStorage.getItem('wedding_client_id');
    if (!clientId) {
      clientId = 'user_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('wedding_client_id', clientId);
    }
    return clientId;
  }
  return 'anonymous';
};

// 同步用户设置
export const syncSettings = async (settings) => {
  try {
    const userId = getUserId();
    
    await prisma.userSettings.upsert({
      where: { userId },
      update: { 
        settings,
        updatedAt: new Date()
      },
      create: {
        userId,
        settings
      }
    });
    
    return true;
  } catch (error) {
    console.error('同步用户设置失败:', error);
    return false;
  }
};

// 获取用户设置
export const fetchSettings = async () => {
  try {
    const userId = getUserId();
    
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId }
    });
    
    return userSettings?.settings || null;
  } catch (error) {
    console.error('获取用户设置失败:', error);
    return null;
  }
};

// 同步婚礼程序数据
export const syncWeddingProgram = async (program) => {
  try {
    const userId = getUserId();
    
    // 使用事务确保数据一致性
    return await prisma.$transaction(async (tx) => {
      // 获取或创建婚礼程序
      const weddingProgram = await tx.weddingProgram.upsert({
        where: {
          userId_name: {
            userId,
            name: '默认婚礼'
          }
        },
        update: {
          updatedAt: new Date()
        },
        create: {
          userId,
          name: '默认婚礼'
        }
      });
      
      // 删除现有的环节
      await tx.step.deleteMany({
        where: { programId: weddingProgram.id }
      });
      
      // 添加新的环节
      for (let i = 0; i < program.length; i++) {
        const step = program[i];
        await tx.step.create({
          data: {
            programId: weddingProgram.id,
            stepId: step.id.toString(),
            name: step.name,
            script: step.script || '',
            music: step.music || '',
            musicSource: step.musicSource || '',
            musicName: step.musicName || '',
            isPreset: step.isPreset || false,
            duration: step.duration,
            position: i
          }
        });
      }
      
      return true;
    });
  } catch (error) {
    console.error('同步婚礼程序失败:', error);
    return false;
  }
};

// 获取婚礼程序数据
export const fetchWeddingProgram = async () => {
  try {
    const userId = getUserId();
    
    // 获取婚礼程序及其环节
    const weddingProgram = await prisma.weddingProgram.findFirst({
      where: {
        userId,
        name: '默认婚礼'
      },
      include: {
        steps: {
          orderBy: {
            position: 'asc'
          }
        }
      }
    });
    
    if (!weddingProgram) {
      return null;
    }
    
    // 将数据转换为前端期望的格式
    return weddingProgram.steps.map(step => ({
      id: step.stepId,
      name: step.name,
      script: step.script,
      music: step.music,
      musicSource: step.musicSource,
      musicName: step.musicName,
      isPreset: step.isPreset,
      duration: step.duration
    }));
  } catch (error) {
    console.error('获取婚礼程序失败:', error);
    return null;
  }
};

// 同步音频裁剪设置
export const syncTrimSettings = async (musicId, trimSettings, isPreset) => {
  try {
    const userId = getUserId();
    
    // 确保musicId格式正确
    const storageId = isPreset ? `preset:${musicId}` : musicId;
    
    await prisma.musicTrimSettings.upsert({
      where: {
        userId_musicId: {
          userId,
          musicId: storageId
        }
      },
      update: {
        startTime: trimSettings.start || 0,
        endTime: trimSettings.end || 0,
        isPreset,
        updatedAt: new Date()
      },
      create: {
        userId,
        musicId: storageId,
        startTime: trimSettings.start || 0,
        endTime: trimSettings.end || 0,
        isPreset
      }
    });
    
    return true;
  } catch (error) {
    console.error('同步音频裁剪设置失败:', error);
    return false;
  }
};

// 获取音频裁剪设置
export const fetchTrimSettings = async () => {
  try {
    const userId = getUserId();
    
    const trimSettings = await prisma.musicTrimSettings.findMany({
      where: { userId }
    });
    
    return trimSettings.map(setting => ({
      musicId: setting.musicId,
      start: setting.startTime,
      end: setting.endTime,
      isPreset: setting.isPreset
    }));
  } catch (error) {
    console.error('获取音频裁剪设置失败:', error);
    return [];
  }
};

// 同步预设音乐
export const syncPresetMusic = async (presetList) => {
  try {
    const userId = getUserId();
    
    // 使用事务确保数据一致性
    return await prisma.$transaction(async (tx) => {
      // 删除现有的预设音乐
      await tx.presetMusic.deleteMany({
        where: { userId }
      });
      
      // 插入新的预设音乐
      for (const music of presetList) {
        await tx.presetMusic.create({
          data: {
            userId,
            musicId: music.id,
            name: music.name,
            path: music.path,
            category: music.category || ''
          }
        });
      }
      
      return true;
    });
  } catch (error) {
    console.error('同步预设音乐失败:', error);
    return false;
  }
};

// 获取预设音乐
export const fetchPresetMusic = async () => {
  try {
    const userId = getUserId();
    
    const presetMusic = await prisma.presetMusic.findMany({
      where: { userId }
    });
    
    return presetMusic.map(music => ({
      id: music.musicId,
      name: music.name,
      path: music.path,
      category: music.category
    }));
  } catch (error) {
    console.error('获取预设音乐失败:', error);
    return null;
  }
};

// 清除用户所有数据
export const clearUserData = async () => {
  try {
    const userId = getUserId();
    
    // 删除所有用户相关数据
    await prisma.$transaction([
      // 删除预设音乐
      prisma.presetMusic.deleteMany({
        where: { userId }
      }),
      
      // 删除音频裁剪设置
      prisma.musicTrimSettings.deleteMany({
        where: { userId }
      }),
      
      // 删除用户设置
      prisma.userSettings.deleteMany({
        where: { userId }
      }),
      
      // 删除婚礼程序（Steps将通过级联删除被删除）
      prisma.weddingProgram.deleteMany({
        where: { userId }
      })
    ]);
    
    return true;
  } catch (error) {
    console.error('清除用户数据失败:', error);
    return false;
  }
};