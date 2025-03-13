/**
 * 预设音乐管理服务
 * 允许用户自定义预设音乐，并保存到localStorage
 */

// 加载预设音乐列表(从本地存储或默认配置)
export const loadPresetMusic = async () => {
    // 先检查本地存储中是否有自定义预设
    try {
      if (typeof window !== 'undefined') {
        const customPresets = localStorage.getItem('weddingPresetMusic');
        if (customPresets) {
          return JSON.parse(customPresets);
        }
      }
    } catch (error) {
      console.error('从本地存储加载预设音乐失败:', error);
    }
  
    // 如果本地没有，则加载默认预设
    try {
      const response = await fetch('/audio/music-list.json');
      if (response.ok) {
        const data = await response.json();
        // 保存到本地存储，供后续自定义使用
        if (typeof window !== 'undefined') {
          localStorage.setItem('weddingPresetMusic', JSON.stringify(data));
        }
        return data;
      } else {
        console.error('无法加载预设音乐列表');
        return [];
      }
    } catch (error) {
      console.error('加载预设音乐列表失败:', error);
      return [];
    }
  };
  
  // 保存预设音乐到本地存储
  export const savePresetMusic = (presetList) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('weddingPresetMusic', JSON.stringify(presetList));
        return true;
      }
    } catch (error) {
      console.error('保存预设音乐失败:', error);
    }
    return false;
  };
  
  // 添加新的预设音乐
  export const addPresetMusic = (presetList, newMusic) => {
    // 验证新音乐格式
    if (!newMusic.name || !newMusic.path) {
      throw new Error('音乐名称和路径不能为空');
    }
  
    // 检查是否已存在相同名称或路径的音乐
    const existingName = presetList.find(m => m.name === newMusic.name);
    const existingPath = presetList.find(m => m.path === newMusic.path);
  
    if (existingName) {
      throw new Error(`已存在名为"${newMusic.name}"的音乐`);
    }
  
    if (existingPath) {
      throw new Error(`已存在路径为"${newMusic.path}"的音乐`);
    }
  
    // 添加新音乐
    const updatedList = [...presetList, {
      ...newMusic,
      id: Date.now().toString()
    }];
  
    // 保存并返回更新后的列表
    savePresetMusic(updatedList);
    return updatedList;
  };
  
  // 更新预设音乐
  export const updatePresetMusic = (presetList, musicId, updatedMusic) => {
    const index = presetList.findIndex(m => m.id === musicId);
    if (index === -1) {
      throw new Error('未找到要更新的音乐');
    }
  
    // 检查是否与其他音乐重名(除了自己)
    const nameExists = presetList.some(m => 
      m.name === updatedMusic.name && m.id !== musicId
    );
    
    const pathExists = presetList.some(m => 
      m.path === updatedMusic.path && m.id !== musicId
    );
  
    if (nameExists) {
      throw new Error(`已存在名为"${updatedMusic.name}"的音乐`);
    }
  
    if (pathExists) {
      throw new Error(`已存在路径为"${updatedMusic.path}"的音乐`);
    }
  
    // 更新音乐
    const updatedList = [...presetList];
    updatedList[index] = {
      ...presetList[index],
      ...updatedMusic
    };
  
    // 保存并返回更新后的列表
    savePresetMusic(updatedList);
    return updatedList;
  };
  
  // 删除预设音乐
  export const deletePresetMusic = (presetList, musicId) => {
    const updatedList = presetList.filter(m => m.id !== musicId);
    
    // 保存并返回更新后的列表
    savePresetMusic(updatedList);
    return updatedList;
  };