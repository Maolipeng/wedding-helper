/**
 * 音乐存储服务 - 添加音频裁剪功能
 */

// IndexedDB数据库名称和版本
const DB_NAME = 'WeddingMusicDB';
const DB_VERSION = 2; // 版本升级为2，以添加新的存储对象
const MUSIC_STORE = 'musicFiles';
const TRIM_STORE = 'musicTrimSettings'; // 新增音频裁剪设置存储

// 初始化数据库
export const initMusicDB = () => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      console.error("您的浏览器不支持IndexedDB，无法保存上传的音乐");
      reject("浏览器不支持IndexedDB");
      return;
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error("无法打开数据库:", event.target.error);
      reject("无法打开数据库");
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // 创建音乐存储对象
      if (!db.objectStoreNames.contains(MUSIC_STORE)) {
        const musicStore = db.createObjectStore(MUSIC_STORE, { keyPath: 'id' });
        musicStore.createIndex('name', 'name', { unique: false });
      }
      
      // 创建音频裁剪设置存储对象
      if (!db.objectStoreNames.contains(TRIM_STORE)) {
        const trimStore = db.createObjectStore(TRIM_STORE, { keyPath: 'musicId' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };
  });
};

// 保存音乐文件到IndexedDB - 修复版
export const saveMusicToDB = async (musicFile) => {
  try {
    // 先读取文件，避免事务超时问题
    const fileData = await readFileAsArrayBuffer(musicFile);
    
    // 文件读取完成后再创建事务
    const db = await initMusicDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MUSIC_STORE], 'readwrite');
      const musicStore = transaction.objectStore(MUSIC_STORE);
      
      // 生成唯一ID
      const musicId = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
      
      // 保存到数据库
      const musicRecord = {
        id: musicId,
        name: musicFile.name,
        type: musicFile.type,
        data: fileData,
        dateAdded: new Date()
      };
      
      const request = musicStore.add(musicRecord);
      
      request.onsuccess = () => {
        resolve(musicRecord);
      };
      
      request.onerror = (event) => {
        reject("保存音乐文件失败: " + event.target.error);
      };
    });
  } catch (error) {
    console.error("保存音乐文件到数据库失败:", error);
    throw error;
  }
};

// 辅助函数：读取文件为ArrayBuffer
const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      resolve(reader.result);
    };
    
    reader.onerror = () => {
      reject("读取文件失败");
    };
    
    reader.readAsArrayBuffer(file);
  });
};

// 从IndexedDB获取所有音乐文件信息 (不包含文件数据)
export const getAllMusicInfo = async () => {
  try {
    const db = await initMusicDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MUSIC_STORE], 'readonly');
      const musicStore = transaction.objectStore(MUSIC_STORE);
      const request = musicStore.getAll();
      
      request.onsuccess = (event) => {
        // 只返回音乐信息，不包含实际数据
        const musicList = event.target.result.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type,
          dateAdded: item.dateAdded
        }));
        resolve(musicList);
      };
      
      request.onerror = (event) => {
        reject("获取音乐列表失败: " + event.target.error);
      };
    });
  } catch (error) {
    console.error("获取音乐列表失败:", error);
    return [];
  }
};

// 根据ID获取音乐文件并创建URL
export const getMusicURL = async (musicId) => {
  try {
    const db = await initMusicDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MUSIC_STORE], 'readonly');
      const musicStore = transaction.objectStore(MUSIC_STORE);
      const request = musicStore.get(musicId);
      
      request.onsuccess = (event) => {
        const musicRecord = event.target.result;
        if (musicRecord) {
          // 创建Blob并生成URL
          const blob = new Blob([musicRecord.data], { type: musicRecord.type });
          const url = URL.createObjectURL(blob);
          resolve(url);
        } else {
          reject(`未找到ID为${musicId}的音乐`);
        }
      };
      
      request.onerror = (event) => {
        reject("获取音乐失败: " + event.target.error);
      };
    });
  } catch (error) {
    console.error("获取音乐URL失败:", error);
    throw error;
  }
};

// 删除音乐文件
export const deleteMusicFromDB = async (musicId) => {
  try {
    const db = await initMusicDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MUSIC_STORE, TRIM_STORE], 'readwrite');
      const musicStore = transaction.objectStore(MUSIC_STORE);
      const trimStore = transaction.objectStore(TRIM_STORE);
      
      // 先删除音乐
      const musicRequest = musicStore.delete(musicId);
      
      musicRequest.onsuccess = () => {
        // 再删除对应的裁剪设置
        trimStore.delete(musicId);
        resolve(true);
      };
      
      musicRequest.onerror = (event) => {
        reject("删除音乐失败: " + event.target.error);
      };
    });
  } catch (error) {
    console.error("删除音乐失败:", error);
    throw error;
  }
};

// 保存音频裁剪设置
export const saveMusicTrimSettings = async (musicId, trimSettings) => {
  if (!trimSettings || typeof trimSettings !== 'object') {
    throw new Error('裁剪设置格式不正确');
  }
  
  try {
    const db = await initMusicDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TRIM_STORE], 'readwrite');
      const trimStore = transaction.objectStore(TRIM_STORE);
      
      // 保存设置
      const trimRecord = {
        musicId,
        start: trimSettings.start || 0,
        end: trimSettings.end || 0,
        dateModified: new Date()
      };
      
      const request = trimStore.put(trimRecord); // 使用put可以新增或更新
      
      request.onsuccess = () => {
        resolve(trimRecord);
      };
      
      request.onerror = (event) => {
        reject("保存裁剪设置失败: " + event.target.error);
      };
    });
  } catch (error) {
    console.error("保存裁剪设置失败:", error);
    throw error;
  }
};

// 获取音频裁剪设置
export const getMusicTrimSettings = async (musicId) => {
  try {
    const db = await initMusicDB();
    return new Promise((resolve, reject) => {
      // 检查数据库是否包含裁剪设置存储
      if (!db.objectStoreNames.contains(TRIM_STORE)) {
        resolve(null); // 如果存储不存在，返回null
        return;
      }
      
      const transaction = db.transaction([TRIM_STORE], 'readonly');
      const trimStore = transaction.objectStore(TRIM_STORE);
      const request = trimStore.get(musicId);
      
      request.onsuccess = (event) => {
        const trimRecord = event.target.result;
        if (trimRecord) {
          resolve({
            start: trimRecord.start,
            end: trimRecord.end
          });
        } else {
          resolve(null); // 没有找到设置
        }
      };
      
      request.onerror = (event) => {
        console.error("获取裁剪设置失败:", event.target.error);
        resolve(null); // 出错时返回null
      };
    });
  } catch (error) {
    console.error("获取裁剪设置失败:", error);
    return null;
  }
};