"use client";

import React, { useState, useEffect } from 'react';
import { Cog, Heart, Music, RotateCcw, AlertTriangle } from 'lucide-react';
import { defaultProgram } from '../lib/defaultProgram';
import {
  initMusicDB,
  saveMusicToDB,
  getAllMusicInfo,
  deleteMusicFromDB
} from '../lib/musicStorage';
import { loadPresetMusic } from '../lib/presetMusicStorage';
import { 
  initSyncService, 
  syncData, 
  fetchCloudData, 
  syncAllData 
} from '../lib/clientSyncService';

// 导入拆分组件
import MobileNav from './ui/MobileNav';
import ProgramProgress from './wedding/ProgramProgress';
import ProgramStep from './wedding/ProgramStep';
import StepsList from './wedding/StepsList';
import ProgramEditor from './editor/ProgramEditor';
import ScriptEditDialog from './ScriptEditDialog';
import SettingsDialog from './SettingsDialog';
import ConfettiEffect from './wedding/ConfettiEffect';
import { useToast } from './ui/Toast';
import { getAllTrimSettings, saveMusicTrimSettings } from '../lib/musicStorage'

// 默认设置
const DEFAULT_SETTINGS = {
  autoPlayMusic: true,   // 默认自动播放音乐
  autoStartTimer: true,  // 默认自动开始计时
  enableCloudSync: false // 默认不启用云同步
};

const WeddingHelper = () => {
  // 状态管理
  const [initialized, setInitialized] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [customProgram, setCustomProgram] = useState([]);
  const [uploadedMusic, setUploadedMusic] = useState([]);
  const [presetMusicLibrary, setPresetMusicLibrary] = useState([]);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // 司仪台词编辑相关状态
  const [scriptDialogOpen, setScriptDialogOpen] = useState(false);
  const [currentEditingStep, setCurrentEditingStep] = useState(null);

  // 设置相关状态
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0); // 用于重置组件状态的键
  // 添加重置确认对话框状态
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  // 获取 toast 函数
  const { toast } = useToast();
  const initializeUserId = () => {
    let userId = localStorage.getItem('wedding_client_id');
    
    // 如果没有本地用户ID，尝试从URL参数获取
    if (!userId) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlUserId = urlParams.get('userId');
      
      if (urlUserId) {
        // 如果URL中有用户ID，使用它
        userId = urlUserId;
        localStorage.setItem('wedding_client_id', userId);
      } else {
        // 生成新的用户ID
        userId = 'user_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('wedding_client_id', userId);
      }
    }
    
    return userId;
  };
  const fetchCloudData = async () => {
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
      
      // 将获取的数据应用到应用状态
      let hasAnyData = false;
      
      if (programData.success && programData.result && programData.result.length > 0) {
        setCustomProgram(programData.result);
        localStorage.setItem('weddingProgram', JSON.stringify(programData.result));
        hasAnyData = true;
      }
      
      if (settingsData.success && settingsData.result) {
        const cloudSettings = {
          ...settingsData.result,
          enableCloudSync: true  // 强制保持云同步启用
        };
        setSettings(cloudSettings);
        localStorage.setItem('weddingSettings', JSON.stringify(cloudSettings));
        hasAnyData = true;
      }
      
      if (presetsData.success && presetsData.result && presetsData.result.length > 0) {
        setPresetMusicLibrary(presetsData.result);
        localStorage.setItem('weddingPresetMusic', JSON.stringify(presetsData.result));
        hasAnyData = true;
      }
      
      if (trimData.success && trimData.result && trimData.result.length > 0) {
        // 应用裁剪设置到本地IndexedDB
        for (const trim of trimData.result) {
          try {
            // 解析musicId
            let musicId = trim.musicId;
            let isPreset = trim.isPreset;
            
            // 预设音乐ID需要特殊处理
            if (isPreset && musicId.startsWith('preset:')) {
              musicId = musicId.substring(7); // 去掉 "preset:" 前缀
            }
            
            // 保存到本地
            await saveMusicTrimSettings(musicId, {
              start: trim.start,
              end: trim.end
            }, isPreset);
          } catch (err) {
            console.error('保存裁剪设置失败:', err);
          }
        }
        hasAnyData = true;
      }
      
      return { success: hasAnyData };
    } catch (error) {
      console.error('获取云端数据失败:', error);
      return { success: false, error };
    }
  };
  // 添加重置数据的函数
  const handleResetData = () => {
    // 打开确认对话框
    setResetDialogOpen(true);
  };
  const loadAndSyncData = async () => {
    // 首先加载本地数据
    const { program, settings } = loadFromLocalStorage();
    setSettings(settings);

    // 检查是否启用云同步
    if (settings.enableCloudSync) {
      try {
        // 尝试从云端获取数据
        const cloudProgramResponse = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'fetchProgram' })
        });

        const cloudSettingsResponse = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'fetchSettings' })
        });

        // 处理婚礼程序数据
        if (cloudProgramResponse.ok) {
          const data = await cloudProgramResponse.json();
          if (data.success && data.result && data.result.length > 0) {
            // 使用云端数据
            setCustomProgram(data.result);
            localStorage.setItem('weddingProgram', JSON.stringify(data.result));
            console.log('已从云端恢复婚礼程序数据');
          } else {
            // 如果云端没有数据，使用本地数据
            setCustomProgram(program);
          }
        } else {
          setCustomProgram(program);
        }

        // 处理设置数据
        if (cloudSettingsResponse.ok) {
          const data = await cloudSettingsResponse.json();
          if (data.success && data.result) {
            // 使用云端设置，但确保云同步选项保持当前状态
            const cloudSettings = {
              ...data.result,
              enableCloudSync: settings.enableCloudSync
            };
            setSettings(cloudSettings);
            localStorage.setItem('weddingSettings', JSON.stringify(cloudSettings));
            console.log('已从云端恢复设置数据');
          }
        }
      } catch (error) {
        console.error('从云端获取数据失败:', error);
        // 如果从云端获取失败，回退到使用本地数据
        setCustomProgram(program);
      }
    } else {
      // 未启用云同步，直接使用本地数据
      setCustomProgram(program);
    }

    // 继续加载本地音乐和预设
    const loadPresets = async () => { /* 原有代码 */ };
    const loadUploadedMusic = async () => { /* 原有代码 */ };

    await Promise.all([loadPresets(), loadUploadedMusic()]);
    setInitialized(true);
  };

  // 实际执行重置的函数
  const confirmReset = async () => {
    try {
      // 清除本地存储中的所有相关数据
      localStorage.removeItem('weddingProgram');
      localStorage.removeItem('weddingSettings');
      localStorage.removeItem('weddingPresetMusic');

      // 如果启用了云同步，同时清除云端数据
      // if (settings.enableCloudSync) {
      //   try {
      //     const response = await fetch('/api/sync', {
      //       method: 'POST',
      //       headers: { 'Content-Type': 'application/json' },
      //       body: JSON.stringify({ action: 'clearData' })
      //     });

      //     if (!response.ok) {
      //       console.error('清除云端数据失败');
      //     }
      //   } catch (err) {
      //     console.error('请求清除云端数据失败:', err);
      //   }
      // }

      // 关闭对话框
      setResetDialogOpen(false);

      // 显示成功消息
      toast.success('数据已重置，页面将刷新以应用更改。', 2000);

      // 刷新页面以重新加载所有默认设置
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('重置数据失败:', error);
      toast.error('重置数据失败，请重试。');
      setResetDialogOpen(false);
    }
  };

  // 从本地存储加载数据或使用默认数据
  const loadFromLocalStorage = () => {
    if (typeof window !== 'undefined') {
      try {
        const savedProgram = localStorage.getItem('weddingProgram');
        const savedSettings = localStorage.getItem('weddingSettings');

        const result = {
          program: savedProgram ? JSON.parse(savedProgram) : defaultProgram,
          settings: savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS
        };

        return result;
      } catch (e) {
        console.error('无法从本地存储加载数据', e);
      }
    }
    return { program: defaultProgram, settings: DEFAULT_SETTINGS };
  };
  const loadPresets = async () => {
    try {
      const presets = await loadPresetMusic();
      setPresetMusicLibrary(presets);
      return presets;
    } catch (error) {
      console.error('加载预设音乐列表失败:', error);
      setPresetMusicLibrary([]);
      return [];
    }
  };
  const loadUploadedMusic = async () => {
    try {
      const musicList = await getAllMusicInfo();
      setUploadedMusic(musicList);
      return musicList;
    } catch (error) {
      console.error('加载上传音乐失败:', error);
      return [];
    }
  };

  // 初始化 - 在客户端加载时执行
  useEffect(() => {
    // 初始化 IndexedDB
    initMusicDB().then(() => {
      console.log('音乐数据库初始化成功');
    }).catch(err => {
      console.error('音乐数据库初始化失败:', err);
    });
    
    // 初始化用户ID
    initializeUserId();
  
    // 检查URL中是否包含userId参数
    const urlParams = new URLSearchParams(window.location.search);
    const urlUserId = urlParams.get('userId');
    
    if (urlUserId) {
      // 如果URL中包含userId，这表明用户正在尝试同步数据
      // 自动启用云同步并使用该userId
      localStorage.setItem('wedding_client_id', urlUserId);
      localStorage.setItem('enableCloudSync', 'true');
      
      // 显示正在同步通知
      toast.info('检测到数据同步请求，正在从云端获取数据...');
      
      // 加载本地默认值作为后备
      const { program: localProgram, settings: localSettings } = loadFromLocalStorage();
      // 将本地enableCloudSync设置为true
      const updatedSettings = { ...localSettings, enableCloudSync: true };
      setSettings(updatedSettings);
      
      // 先尝试从云端获取数据
      fetchCloudData().then(cloudData => {
        if (cloudData.success) {
          // 使用云端数据
          toast.success('云端数据同步成功！');
        } else {
          // 使用本地数据
          setCustomProgram(localProgram);
          toast.warning('未找到云端数据，使用本地数据');
        }
        
        // 继续加载音乐和预设
        loadPresets().then(() => {
          loadUploadedMusic().then(() => {
            setInitialized(true);
          });
        });
      }).catch(err => {
        console.error('获取云端数据失败:', err);
        // 失败时使用本地数据
        setCustomProgram(localProgram);
        
        // 继续加载音乐和预设
        loadPresets().then(() => {
          loadUploadedMusic().then(() => {
            setInitialized(true);
          });
        });
      });
    } else {
      // 正常初始化流程
      const { program, settings } = loadFromLocalStorage();
      setSettings(settings);
      setCustomProgram(program);
      
      Promise.all([loadPresets(), loadUploadedMusic()]).then(() => {
        setInitialized(true);
        
        // 如果启用了云同步，尝试从云端获取更新的数据
        if (settings.enableCloudSync) {
          fetchCloudData().then(cloudData => {
            if (cloudData.success) {
              // 使用云端数据更新本地数据
              toast.info('已从云端同步最新数据');
            }
          }).catch(err => {
            console.error('从云端获取数据失败:', err);
          });
        }
      });
    }
  }, []);
  // 添加设置变更监听，处理云同步状态变化
useEffect(() => {
  if (!initialized) return;

  try {
    // 检测是否刚刚开启了云同步
    const previousCloudSyncState = localStorage.getItem('enableCloudSync') === 'true';
    const cloudSyncJustEnabled = settings.enableCloudSync && !previousCloudSyncState;

    // 保存设置到本地
    localStorage.setItem('weddingSettings', JSON.stringify(settings));
    localStorage.setItem('enableCloudSync', settings.enableCloudSync ? 'true' : 'false');
    
    // 如果刚刚开启了云同步，尝试从云端恢复数据
    if (cloudSyncJustEnabled) {
      toast.info('正在从云端同步数据...', 2000);
      fetchCloudData().then(cloudData => {
        if (cloudData.success) {
          toast.success('云端数据同步成功！');
        } else {
          // 如果云端没有数据，则将本地数据同步到云端
          handleSyncNow().catch(err => {
            console.error('同步数据到云端失败:', err);
          });
        }
      }).catch(err => {
        console.error('从云端获取数据失败:', err);
        toast.error('从云端获取数据失败，请检查网络连接');
      });
    }
    // 如果云同步已启用但不是刚开启的，只同步设置到云端
    else if (settings.enableCloudSync) {
      syncData().catch(err => {
        console.error('同步设置失败:', err);
      });
    }
  } catch (e) {
    console.error('无法保存设置到本地存储', e);
  }
}, [settings, initialized]);

  // 初始化云同步服务
 // 初始化云同步服务
useEffect(() => {
  if (initialized && settings.enableCloudSync) {
    // 存储同步状态
    localStorage.setItem('enableCloudSync', 'true');
    
    // 检查数据库状态
    fetch('/api/db-status')
      .then(response => response.json())
      .then(status => {
        if (!status.success || !status.connected) {
          console.warn('数据库连接不可用，云同步可能不工作');
          toast.error('连接云服务失败，请检查网络');
          return;
        }
        
        // 执行初始同步
        syncData().catch(err => {
          console.error('数据同步失败:', err);
        });
        
        // 设置定期同步
        const intervalId = setInterval(() => {
          syncData().catch(err => {
            console.error('定期同步失败:', err);
          });
        }, 5 * 60 * 1000); // 每5分钟同步一次
        
        // 清理函数，组件卸载时清除定时器
        return () => clearInterval(intervalId);
      })
      .catch(err => {
        console.error('检查数据库状态失败:', err);
        toast.error('连接云服务失败，请检查网络');
      });
  } else if (initialized) {
    // 如果禁用云同步，更新 localStorage
    localStorage.setItem('enableCloudSync', 'false');
  }
}, [initialized, settings.enableCloudSync]);

  // 在首次加载时检查数据库状态
  useEffect(() => {
    if (initialized && settings.enableCloudSync) {
      // 检查数据库连接状态
      fetch('/api/db-status')
        .then(response => response.json())
        .then(data => {
          if (!data.success || !data.connected) {
            // 数据库连接失败，显示通知
            toast.error('云服务连接失败: ' + (data.message || '服务不可用'), 5000);

            // 自动禁用云同步
            if (settings.enableCloudSync) {
              setSettings({
                ...settings,
                enableCloudSync: false
              });
              localStorage.setItem('enableCloudSync', 'false');
              toast.info('已自动禁用云同步功能', 3000);
            }
          }
        })
        .catch(err => {
          console.error('检查数据库状态失败:', err);
        });
    }
  }, [initialized, settings.enableCloudSync]);

  // 保存到本地存储
  useEffect(() => {
    if (!initialized) return;

    try {
      localStorage.setItem('weddingProgram', JSON.stringify(customProgram));

      // 如果启用了云同步，则执行同步
      if (settings.enableCloudSync) {
        syncData().catch(err => {
          console.error('同步程序失败:', err);
        });
      }
    } catch (e) {
      console.error('无法保存流程到本地存储', e);
    }
  }, [customProgram, initialized, settings.enableCloudSync]);

  // 保存设置到本地存储
  useEffect(() => {
    if (!initialized) return;

    try {
      // 检测是否刚刚开启了云同步
      const previousCloudSyncState = localStorage.getItem('enableCloudSync') === 'true';
      const cloudSyncJustEnabled = settings.enableCloudSync && !previousCloudSyncState;

      // 保存设置到本地
      localStorage.setItem('weddingSettings', JSON.stringify(settings));
      localStorage.setItem('enableCloudSync', settings.enableCloudSync ? 'true' : 'false');

      // 如果刚刚开启了云同步，尝试从云端恢复数据
      if (cloudSyncJustEnabled) {
        toast.info('正在从云端同步数据...', 2000);
        // 调用上面新添加的loadAndSyncData函数，从云端获取数据
        loadAndSyncData();
      }
      // 如果云同步已启用但不是刚开启的，只同步设置到云端
      else if (settings.enableCloudSync) {
        syncData().catch(err => {
          console.error('同步设置失败:', err);
        });
      }
    } catch (e) {
      console.error('无法保存设置到本地存储', e);
    }
  }, [settings, initialized]);

 // 改进的立即同步函数，使用批量同步API
 const handleSyncNow = async () => {
  if (!settings.enableCloudSync) {
    toast.error('云端同步未启用，无法执行同步操作');
    return;
  }
  
  toast.info('正在同步数据到云端...', 2000);
  
  try {
    // 1. 获取所有裁剪设置
    const allTrimSettings = await getAllTrimSettings();
    
    // 2. 使用客户端同步服务
    const result = await syncAllData(
      customProgram,
      settings,
      presetMusicLibrary,
      allTrimSettings
    );
    
    if (result.success) {
      // 显示成功信息
      const stats = result.results;
      let successMessage = '数据已成功同步到云端！\n';
      
      if (stats.program) successMessage += '✓ 婚礼流程\n';
      if (stats.settings) successMessage += '✓ 应用设置\n';
      if (stats.presetMusic) successMessage += '✓ 预设音乐\n';
      if (stats.trimSettings > 0) {
        successMessage += `✓ 音频裁剪设置 (${stats.trimSettings}/${allTrimSettings.length})`;
      }
      
      toast.success(successMessage, 5000);
    } else {
      toast.error('同步失败: ' + (result.message || '未知错误'), 3000);
    }
    
    return true;
  } catch (error) {
    console.error('同步数据失败:', error);
    toast.error('同步失败: ' + (error.message || '未知错误'), 3000);
    throw error;
  }
};

  // 跳到下一个环节
  const nextStep = () => {
    if (currentStep < customProgram.length - 1) {
      setCurrentStep(currentStep + 1);
      setResetKey(prev => prev + 1); // 更新重置键，用于重置音乐和计时器组件

      // 如果是最后一步，显示庆祝动画
      if (currentStep === customProgram.length - 2) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }
  };

  // 切换到指定环节
  const switchToStep = (index) => {
    setCurrentStep(index);
    setResetKey(prev => prev + 1); // 更新重置键，用于重置音乐和计时器组件
  };

  // 自定义流程
  const handleCustomize = () => {
    setIsCustomizing(!isCustomizing);
  };

  // 处理司仪台词编辑
  const handleOpenScriptDialog = (index) => {
    setCurrentEditingStep(index);
    setScriptDialogOpen(true);
  };

  const handleSaveScript = (newScript) => {
    if (currentEditingStep !== null) {
      const updatedProgram = [...customProgram];
      updatedProgram[currentEditingStep] = {
        ...updatedProgram[currentEditingStep],
        script: newScript
      };
      setCustomProgram(updatedProgram);
    }
  };

  // 处理设置更新
  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
  };

  // 处理音乐播放状态变化
  const handleMusicPlayStateChange = (isPlaying) => {
    setIsMusicPlaying(isPlaying);
  };

  // 程序编辑器处理函数
  const handleProgramUpdate = (updatedProgram) => {
    setCustomProgram(updatedProgram);

    // 如果当前显示的环节索引超出了程序长度，调整它
    if (currentStep >= updatedProgram.length) {
      setCurrentStep(Math.max(0, updatedProgram.length - 1));
    }

    // 如果启用了云同步，则同步到云端
    if (settings.enableCloudSync) {
      syncData().catch(err => {
        console.error('同步程序失败:', err);
      });
    }
  };

  // 计算下一个环节的名称
  const getNextStepName = () => {
    if (currentStep < customProgram.length - 1) {
      return customProgram[currentStep + 1]?.name;
    }
    return '';
  };

  // 音乐库更新处理函数
  const handleMusicLibraryUpdate = {
    uploadedMusic: {
      add: async (files) => {
        const newMusicFiles = [];
        for (const file of files) {
          try {
            const savedMusic = await saveMusicToDB(file);
            newMusicFiles.push({
              id: savedMusic.id,
              name: file.name,
              type: file.type,
              dateAdded: new Date()
            });
          } catch (error) {
            console.error(`保存音乐文件 ${file.name} 失败:`, error);
          }
        }
        setUploadedMusic([...uploadedMusic, ...newMusicFiles]);
      },
      delete: async (musicId) => {
        try {
          await deleteMusicFromDB(musicId);
          setUploadedMusic(uploadedMusic.filter(music => music.id !== musicId));

          // 同时更新所有使用该音乐的环节
          const updatedProgram = customProgram.map(step => {
            if (step.musicSource === musicId && !step.isPreset) {
              return {
                ...step,
                music: '',
                musicSource: '',
                musicName: '请选择音乐',
                isPreset: false
              };
            }
            return step;
          });

          setCustomProgram(updatedProgram);
        } catch (error) {
          console.error('删除音乐失败:', error);
        }
      }
    },
    presetMusic: {
      update: (updatedList) => {
        setPresetMusicLibrary(updatedList);

        // 检查是否有环节使用了被删除的预设音乐，并更新它们
        const deletedPaths = presetMusicLibrary
          .filter(oldMusic => !updatedList.some(newMusic => newMusic.id === oldMusic.id))
          .map(music => music.path);

        if (deletedPaths.length > 0) {
          const updatedProgram = customProgram.map(step => {
            if (step.isPreset && deletedPaths.includes(step.music)) {
              return {
                ...step,
                music: '',
                musicSource: '',
                musicName: '请选择音乐',
                isPreset: false
              };
            }
            return step;
          });

          setCustomProgram(updatedProgram);
        }
      }
    }
  };

  if (!initialized) {
    return (
      <div className="flex justify-center items-center h-screen wedding-waves">
        <div className="text-center">
          <div className="inline-block mb-4">
            <Heart size={40} className="text-pink-500 animate-pulse" />
          </div>
          <p className="text-lg font-medium text-gray-700">正在准备您的婚礼助手...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white wedding-waves">
      {/* 移动端导航栏 */}
      <MobileNav
        isCustomizing={isCustomizing}
        onToggleCustomize={handleCustomize}
        onOpenSettings={() => setSettingsDialogOpen(true)}
        onResetData={handleResetData} // 添加这一行，传递重置数据函数
      />

      {isCustomizing ? (
        <ProgramEditor
          program={customProgram}
          uploadedMusic={uploadedMusic}
          presetMusicLibrary={presetMusicLibrary}
          onProgramUpdate={handleProgramUpdate}
          onMusicUpdate={handleMusicLibraryUpdate}
          onSettingsOpen={() => setSettingsDialogOpen(true)}
          onCancel={handleCustomize}
        />
      ) : (
        <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
          <div className="flex justify-between items-center mb-6 hidden md:flex">
            <h1 className="text-3xl font-bold gradient-text">婚礼助手</h1>
            <div className="flex space-x-3">
              <button
                onClick={handleResetData}
                className="bg-white shadow rounded-full p-2 text-gray-600 hover:text-red-500 hover:shadow-md transition-all duration-200"
                title="重置数据"
              >
                <RotateCcw size={20} />
              </button>
              <button
                onClick={() => setSettingsDialogOpen(true)}
                className="bg-white shadow rounded-full p-2 text-gray-600 hover:text-pink-500 hover:shadow-md transition-all duration-200"
                title="设置"
              >
                <Cog size={20} />
              </button>
              <button
                onClick={handleCustomize}
                className="bg-white shadow rounded-full py-2 px-4 text-gray-700 hover:text-pink-500 hover:shadow-md transition-all duration-200"
              >
                自定义流程与音乐
              </button>
            </div>
          </div>

          {/* 进度条 */}
          <ProgramProgress
            currentStep={currentStep}
            totalSteps={customProgram.length}
          />
          {/* 音乐播放状态指示器 - 新增 */}
          {isMusicPlaying && (
            <div className="flex items-center justify-center mb-4 text-sm text-gray-600 animate-pulse">
              <Music size={16} className="mr-2 text-pink-500" />
              <span>正在播放: {customProgram[currentStep]?.musicName || '音乐'}</span>
            </div>
          )}

          {/* 当前环节 */}
          <ProgramStep
            step={customProgram[currentStep] || {}}
            currentStep={currentStep}
            settings={settings}
            resetKey={resetKey}
            onPlayStateChange={handleMusicPlayStateChange}
            onScriptEdit={handleOpenScriptDialog}
            isLastStep={currentStep >= customProgram.length - 1}
            onNextStep={nextStep}
            nextStepName={getNextStepName()}
          />

          {/* 环节列表 */}
          <StepsList
            steps={customProgram}
            currentStep={currentStep}
            onStepSelect={switchToStep}
          />

          <div className="text-center text-gray-500 text-xs mb-6">
            <p>由❤️毛立鹏精心制作</p>
            <p className="mt-1">祝您的婚礼圆满成功</p>
          </div>
        </div>
      )}

      {/* 司仪台词编辑对话框 */}
      <ScriptEditDialog
        isOpen={scriptDialogOpen}
        onClose={() => setScriptDialogOpen(false)}
        script={currentEditingStep !== null ? customProgram[currentEditingStep]?.script : ''}
        stepName={currentEditingStep !== null ? customProgram[currentEditingStep]?.name : ''}
        onSave={handleSaveScript}
      />

      {/* 设置对话框 */}
      <SettingsDialog
        isOpen={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        onSyncNow={handleSyncNow}
      />
      {/* 重置确认对话框 */}
      {resetDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-start mb-4">
                <div className="bg-red-100 p-2 rounded-full mr-3">
                  <AlertTriangle className="text-red-500" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">确认重置数据？</h3>
                  <p className="text-gray-600">
                    这将清除所有已保存的婚礼流程、设置和预设音乐。此操作无法撤销。
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 mt-4 pt-4">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setResetDialogOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={confirmReset}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                  >
                    <RotateCcw size={16} className="mr-2" />
                    确认重置
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 庆祝动画效果 */}
      {showConfetti && <ConfettiEffect />}
    </div>
  );
};

export default WeddingHelper;