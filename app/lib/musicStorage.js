/**
 * 音乐存储服务 - 修复事务超时问题
 */

// IndexedDB数据库名称和版本
const DB_NAME = 'WeddingMusicDB';
const DB_VERSION = 1;
const MUSIC_STORE = 'musicFiles';

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
      const transaction = db.transaction([MUSIC_STORE], 'readwrite');
      const musicStore = transaction.objectStore(MUSIC_STORE);
      const request = musicStore.delete(musicId);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = (event) => {
        reject("删除音乐失败: " + event.target.error);
      };
    });
  } catch (error) {
    console.error("删除音乐失败:", error);
    throw error;
  }
};