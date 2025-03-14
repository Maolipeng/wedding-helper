"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Cog, Heart, Music, RotateCcw, AlertTriangle } from 'lucide-react';
import { defaultProgram } from '../lib/defaultProgram';
import {
  initMusicDB,
  saveMusicToDB,
  getAllMusicInfo,
  deleteMusicFromDB
} from '../lib/musicStorage';
import { loadPresetMusic } from '../lib/presetMusicStorage';

// 导入拆分组件
import MobileNav from './ui/MobileNav';
import ProgramProgress from './wedding/ProgramProgress';
import ProgramStep from './wedding/ProgramStep';
import StepsList from './wedding/StepsList';
import ProgramEditor from './editor/ProgramEditor';
import ScriptEditDialog from './ScriptEditDialog';
import SettingsDialog from './SettingsDialog';
import ConfettiEffect from './wedding/ConfettiEffect';

// 默认设置
const DEFAULT_SETTINGS = {
  autoPlayMusic: true,   // 默认自动播放音乐
  autoStartTimer: true   // 默认自动开始计时
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
  // 添加重置数据的函数
  const handleResetData = () => {
    // 打开确认对话框
    setResetDialogOpen(true);
  };

  // 实际执行重置的函数
  const confirmReset = () => {
    try {
      // 清除本地存储中的所有相关数据
      localStorage.removeItem('weddingProgram');
      localStorage.removeItem('weddingSettings');
      localStorage.removeItem('weddingPresetMusic');

      // 关闭对话框
      setResetDialogOpen(false);

      // 显示成功消息
      alert('数据已重置，页面将刷新以应用更改。');

      // 刷新页面以重新加载所有默认设置
      window.location.reload();
    } catch (error) {
      console.error('重置数据失败:', error);
      alert('重置数据失败，请重试。');
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

  // 初始化 - 在客户端加载时执行
  useEffect(() => {
    // 初始化 IndexedDB
    initMusicDB().then(() => {
      console.log('音乐数据库初始化成功');
    }).catch(err => {
      console.error('音乐数据库初始化失败:', err);
    });

    // 加载保存的婚礼流程和设置
    const { program, settings } = loadFromLocalStorage();
    setCustomProgram(program);
    setSettings(settings);

    // 加载预设音乐库
    const loadPresets = async () => {
      try {
        const presets = await loadPresetMusic();
        setPresetMusicLibrary(presets);
      } catch (error) {
        console.error('加载预设音乐列表失败:', error);
        setPresetMusicLibrary([]);
      }
    };

    // 从 IndexedDB 加载上传的音乐信息
    const loadUploadedMusic = async () => {
      try {
        const musicList = await getAllMusicInfo();
        setUploadedMusic(musicList);
      } catch (error) {
        console.error('加载上传音乐失败:', error);
      }
    };

    Promise.all([loadPresets(), loadUploadedMusic()]).then(() => {
      setInitialized(true);
    });
  }, []);

  // 保存到本地存储
  useEffect(() => {
    if (!initialized) return;

    try {
      localStorage.setItem('weddingProgram', JSON.stringify(customProgram));
    } catch (e) {
      console.error('无法保存流程到本地存储', e);
    }
  }, [customProgram, initialized]);

  // 保存设置到本地存储
  useEffect(() => {
    if (!initialized) return;

    try {
      localStorage.setItem('weddingSettings', JSON.stringify(settings));
    } catch (e) {
      console.error('无法保存设置到本地存储', e);
    }
  }, [settings, initialized]);

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
      />

      {/* 庆祝动画效果 */}
      {showConfetti && <ConfettiEffect />}
    </div>
  );
};

export default WeddingHelper;