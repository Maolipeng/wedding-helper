"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  SkipForward, MessageSquare, Music, Folder, Upload, Plus, Trash2, MoveUp, MoveDown,
  Calendar, Clock, HeartHandshake, Heart, ChevronRight, CheckCircle2, Settings, Edit, Maximize2
} from 'lucide-react';
import { defaultProgram } from '../lib/defaultProgram';
import { 
  initMusicDB, 
  saveMusicToDB, 
  getAllMusicInfo,
  getMusicURL,
  deleteMusicFromDB 
} from '../lib/musicStorage';
import { loadPresetMusic } from '../lib/presetMusicStorage';
import MusicPlayer from './MusicPlayer';
import TimerControl from './TimerControl';
import PresetMusicEditor from './PresetMusicEditor';
import ScriptEditDialog from './ScriptEditDialog';

const WeddingHelper = () => {
  // 状态管理
  const [initialized, setInitialized] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [customProgram, setCustomProgram] = useState([]);
  const [uploadedMusic, setUploadedMusic] = useState([]);
  const [presetMusicLibrary, setPresetMusicLibrary] = useState([]);
  const [activeTab, setActiveTab] = useState('preset'); // 'preset', 'uploaded', 'manage'
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // 司仪台词编辑相关状态
  const [scriptDialogOpen, setScriptDialogOpen] = useState(false);
  const [currentEditingStep, setCurrentEditingStep] = useState(null);

  // 计算完成进度
  const progress = useMemo(() => {
    if (customProgram.length === 0) return 0;
    return ((currentStep + 1) / customProgram.length) * 100;
  }, [currentStep, customProgram]);

  // 从本地存储加载数据或使用默认数据
  const loadFromLocalStorage = () => {
    if (typeof window !== 'undefined') {
      try {
        const savedProgram = localStorage.getItem('weddingProgram');
        
        if (savedProgram) {
          return {
            program: JSON.parse(savedProgram)
          };
        }
      } catch (e) {
        console.error('无法从本地存储加载数据', e);
      }
    }
    return { program: defaultProgram };
  };

  // 初始化 - 在客户端加载时执行
  useEffect(() => {
    // 初始化 IndexedDB
    initMusicDB().then(() => {
      console.log('音乐数据库初始化成功');
    }).catch(err => {
      console.error('音乐数据库初始化失败:', err);
    });

    // 加载保存的婚礼流程
    const { program } = loadFromLocalStorage();
    setCustomProgram(program);
    
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
      console.error('无法保存到本地存储', e);
    }
  }, [customProgram, initialized]);

  // 跳到下一个环节
  const nextStep = () => {
    if (currentStep < customProgram.length - 1) {
      setCurrentStep(currentStep + 1);

      // 如果是最后一步，显示庆祝动画
      if (currentStep === customProgram.length - 2) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }
  };

  // 自定义流程
  const handleCustomize = () => {
    setIsCustomizing(!isCustomizing);
  };

  // 更新自定义流程
  const updateProgram = (index, field, value) => {
    const updatedProgram = [...customProgram];
    updatedProgram[index] = {
      ...updatedProgram[index],
      [field]: value
    };
    setCustomProgram(updatedProgram);
  };

  // 添加新环节
  const addNewStep = () => {
    // 生成新的环节ID
    const maxId = Math.max(0, ...customProgram.map(step => step.id));
    const newId = maxId + 1;
    
    const newStep = {
      id: newId,
      name: '新环节',
      script: '请在此输入司仪台词',
      music: '',
      musicSource: '',
      musicName: '请选择音乐',
      isPreset: false,
      duration: 5
    };
    
    // 添加到现有程序末尾
    setCustomProgram([...customProgram, newStep]);
  };

  // 删除环节
  const deleteStep = (index) => {
    if (customProgram.length <= 1) {
      alert('至少保留一个环节');
      return;
    }

    const updatedProgram = [...customProgram];
    updatedProgram.splice(index, 1);
    setCustomProgram(updatedProgram);
    
    // 如果删除的是当前显示的环节，调整currentStep
    if (currentStep >= updatedProgram.length) {
      setCurrentStep(updatedProgram.length - 1);
    }
  };

  // 上移环节
  const moveStepUp = (index) => {
    if (index === 0) return; // 已经是第一个
    
    const updatedProgram = [...customProgram];
    const temp = updatedProgram[index];
    updatedProgram[index] = updatedProgram[index - 1];
    updatedProgram[index - 1] = temp;
    
    setCustomProgram(updatedProgram);
    
    // 如果移动的是当前显示的环节，调整currentStep
    if (currentStep === index) {
      setCurrentStep(index - 1);
    } else if (currentStep === index - 1) {
      setCurrentStep(index);
    }
  };

  // 下移环节
  const moveStepDown = (index) => {
    if (index === customProgram.length - 1) return; // 已经是最后一个
    
    const updatedProgram = [...customProgram];
    const temp = updatedProgram[index];
    updatedProgram[index] = updatedProgram[index + 1];
    updatedProgram[index + 1] = temp;
    
    setCustomProgram(updatedProgram);
    
    // 如果移动的是当前显示的环节，调整currentStep
    if (currentStep === index) {
      setCurrentStep(index + 1);
    } else if (currentStep === index + 1) {
      setCurrentStep(index);
    }
  };

  // 处理司仪台词编辑
  const handleOpenScriptDialog = (index) => {
    setCurrentEditingStep(index);
    setScriptDialogOpen(true);
  };

  const handleSaveScript = (newScript) => {
    if (currentEditingStep !== null) {
      updateProgram(currentEditingStep, 'script', newScript);
    }
  };

  // 上传音乐文件
  const handleMusicUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    const newMusicFiles = [];
    
    // 保存每个音乐文件到 IndexedDB
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
  };

  // 删除上传的音乐
  const handleDeleteMusic = async (musicId) => {
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
  };

  // 为环节选择音乐
  const selectMusicForStep = (index, musicSource, musicName, musicPath, isPreset) => {
    const updatedProgram = [...customProgram];
    updatedProgram[index] = {
      ...updatedProgram[index],
      music: musicPath,
      musicSource: musicSource,
      musicName: musicName,
      isPreset: isPreset
    };
    setCustomProgram(updatedProgram);
  };

  // 处理音乐播放状态变化
  const handleMusicPlayStateChange = (isPlaying) => {
    setIsMusicPlaying(isPlaying);
  };

  // 更新预设音乐库
  const handlePresetMusicUpdate = (updatedList) => {
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
  };

  // 获取当前环节的图标
  const getStepIcon = (stepName) => {
    const name = stepName.toLowerCase();
    if (name.includes('入场')) return <Calendar size={20} className="text-blue-500" />;
    if (name.includes('交换') || name.includes('戒指')) return <HeartHandshake size={20} className="text-pink-500" />;
    if (name.includes('致辞') || name.includes('宣言')) return <MessageSquare size={20} className="text-purple-500" />;
    // 默认图标
    return <Calendar size={20} className="text-gray-500" />;
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
    <div className="flex flex-col min-h-screen bg-white p-4 md:p-6 wedding-waves">
      {isCustomizing ? (
        <div className="w-full max-w-6xl mx-auto overflow-auto">
          <div className="flex items-center mb-8">
            <div className="mr-3">
              <button 
                onClick={handleCustomize} 
                className="bg-white rounded-full p-2 shadow-md text-gray-600 hover:text-pink-500"
                title="返回"
              >
                <ChevronRight className="transform rotate-180" size={20} />
              </button>
            </div>
            <h2 className="text-3xl font-bold gradient-text">自定义婚礼流程</h2>
          </div>
          
          <div className="mb-8 wedding-card card-shadow p-6">
            <h3 className="font-bold text-xl mb-4 flex items-center">
              <Music className="mr-2 text-pink-500" />
              音乐库
            </h3>
            
            <div className="flex border-b border-gray-200 mb-6">
              <button 
                onClick={() => setActiveTab('preset')}
                className={`px-6 py-3 font-medium ${activeTab === 'preset' 
                  ? 'border-b-2 border-pink-500 text-pink-500' 
                  : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Folder className="inline-block mr-2" size={18} />
                预设音乐
              </button>
              <button 
                onClick={() => setActiveTab('uploaded')}
                className={`px-6 py-3 font-medium ${activeTab === 'uploaded' 
                  ? 'border-b-2 border-pink-500 text-pink-500' 
                  : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Upload className="inline-block mr-2" size={18} />
                上传音乐
              </button>
              <button 
                onClick={() => setActiveTab('manage')}
                className={`px-6 py-3 font-medium ${activeTab === 'manage' 
                  ? 'border-b-2 border-pink-500 text-pink-500' 
                  : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Settings className="inline-block mr-2" size={18} />
                管理预设
              </button>
            </div>
            
            {activeTab === 'uploaded' && (
              <div>
                <div className="mb-6">
                  <label className="block mb-3">
                    <span className="inline-flex items-center bg-gradient-to-r from-pink-500 to-blue-500 text-white py-2 px-6 rounded-full cursor-pointer shadow-md hover:shadow-lg transition-all duration-200">
                      <Upload className="mr-2" size={18} />
                      上传本地音乐文件
                    </span>
                    <input 
                      type="file" 
                      accept="audio/*" 
                      onChange={handleMusicUpload} 
                      className="hidden" 
                      multiple 
                    />
                  </label>
                  <p className="text-sm text-gray-500">支持MP3, WAV等音频格式</p>
                </div>
                
                {uploadedMusic.length > 0 ? (
                  <div className="mt-2">
                    <h4 className="font-medium mb-3 text-gray-700">已上传的音乐：</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {uploadedMusic.map((music) => (
                        <div key={music.id} className="bg-white border border-gray-100 rounded-lg p-3 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center overflow-hidden">
                            <div className="bg-pink-100 rounded-full p-2 mr-3 flex-shrink-0">
                              <Music className="text-pink-500" size={16} />
                            </div>
                            <span className="text-sm font-medium truncate">{music.name}</span>
                          </div>
                          <button 
                            onClick={() => handleDeleteMusic(music.id)}
                            className="ml-2 text-gray-400 hover:text-red-500 flex-shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    <Music size={40} className="mx-auto mb-4 opacity-20" />
                    <p className="italic">尚未上传任何音乐</p>
                    <p className="text-sm mt-2">点击上方按钮添加</p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'preset' && (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  预设音乐可以在"管理预设"标签中添加或修改
                </p>
                
                {presetMusicLibrary.length > 0 ? (
                  <div className="mt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {presetMusicLibrary.map((music, idx) => (
                        <div key={music.id || idx} className="bg-white border border-gray-100 rounded-lg p-3 flex items-center shadow-sm hover:shadow-md transition-shadow">
                          <div className={`rounded-full p-2 mr-3 ${
                            music.category ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <Music className={`${
                              music.category ? 'text-blue-500' : 'text-gray-500'
                            }`} size={16} />
                          </div>
                          <div className="overflow-hidden">
                            <div className="font-medium truncate">{music.name}</div>
                            <div className="text-xs text-gray-500 truncate">{music.path}</div>
                            {music.category && (
                              <div className="text-xs text-blue-500 mt-1">
                                {music.category}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    <Folder size={40} className="mx-auto mb-4 opacity-20" />
                    <p className="italic">未找到预设音乐</p>
                    <p className="text-sm mt-2">请前往"管理预设"标签添加</p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'manage' && (
              <PresetMusicEditor 
                presetList={presetMusicLibrary} 
                onUpdate={handlePresetMusicUpdate} 
              />
            )}
          </div>
          
          <div className="wedding-card card-shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl flex items-center">
                <Calendar className="mr-2 text-blue-500" />
                婚礼流程环节
              </h3>
              <button 
                onClick={addNewStep}
                className="flex items-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-full shadow-md transition-all duration-200"
              >
                <Plus size={18} className="mr-1" />
                添加环节
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-50 text-gray-700">
                    <th className="p-3 text-left font-medium">操作</th>
                    <th className="p-3 text-left font-medium">环节</th>
                    <th className="p-3 text-left font-medium">司仪台词</th>
                    <th className="p-3 text-left font-medium">音乐</th>
                    <th className="p-3 text-left font-medium">时长(分钟)</th>
                  </tr>
                </thead>
                <tbody>
                  {customProgram.map((step, index) => (
                    <tr key={step.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => moveStepUp(index)}
                            disabled={index === 0}
                            className={`p-1.5 rounded-full ${index === 0 
                              ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                              : 'bg-blue-50 text-blue-500 hover:bg-blue-100'}`}
                            title="上移"
                          >
                            <MoveUp size={16} />
                          </button>
                          <button 
                            onClick={() => moveStepDown(index)}
                            disabled={index === customProgram.length - 1}
                            className={`p-1.5 rounded-full ${index === customProgram.length - 1 
                              ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                              : 'bg-blue-50 text-blue-500 hover:bg-blue-100'}`}
                            title="下移"
                          >
                            <MoveDown size={16} />
                          </button>
                          <button 
                            onClick={() => deleteStep(index)}
                            className="p-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                            title="删除"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={step.name}
                          onChange={(e) => updateProgram(index, 'name', e.target.value)}
                          className="w-full p-2 border rounded-lg"
                          placeholder="环节名称"
                        />
                      </td>
                      <td className="p-3 min-w-[280px]">
                        <div className="relative">
                          <div className="border rounded-lg p-3 bg-gray-50 min-h-[100px] max-h-[150px] overflow-y-auto whitespace-pre-wrap mb-2">
                            {step.script || <span className="text-gray-400">暂无台词内容</span>}
                          </div>
                          <button
                            onClick={() => handleOpenScriptDialog(index)}
                            className="text-blue-500 hover:text-blue-700 flex items-center text-sm"
                          >
                            <Maximize2 size={14} className="mr-1" />
                            展开编辑台词
                          </button>
                        </div>
                      </td>
                      <td className="p-3">
                        <select
                          value=""
                          onChange={(e) => {
                            // 解析选项值：source:index 格式
                            const [source, idxStr] = e.target.value.split(':');
                            const idx = idxStr;
                            
                            let selectedMusic;
                            if (source === 'preset') {
                              selectedMusic = presetMusicLibrary[idx];
                              if (selectedMusic) {
                                selectMusicForStep(
                                  index, 
                                  idx, 
                                  selectedMusic.name, 
                                  selectedMusic.path, 
                                  true
                                );
                              }
                            } else if (source === 'uploaded') {
                              selectedMusic = uploadedMusic.find(m => m.id === idx);
                              if (selectedMusic) {
                                selectMusicForStep(
                                  index, 
                                  selectedMusic.id, 
                                  selectedMusic.name, 
                                  '', 
                                  false
                                );
                              }
                            }
                          }}
                          className="w-full p-2 border rounded-lg mb-2"
                        >
                          <option value="">选择音乐</option>
                          {presetMusicLibrary.length > 0 && (
                            <optgroup label="预设音乐">
                              {presetMusicLibrary.map((music, idx) => (
                                <option key={`preset:${idx}`} value={`preset:${idx}`}>
                                  {music.name}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {uploadedMusic.length > 0 && (
                            <optgroup label="已上传音乐">
                              {uploadedMusic.map((music) => (
                                <option key={`uploaded:${music.id}`} value={`uploaded:${music.id}`}>
                                  {music.name}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-medium text-gray-700">
                            当前: <span className={step.music ? "text-blue-500" : "text-gray-400"}>{step.musicName || '无音乐'}</span>
                          </div>
                          {step.music && (
                            <button
                              onClick={() => selectMusicForStep(index, '', '无音乐', '', false)}
                              className="text-xs text-red-500 hover:text-red-600"
                            >
                              移除音乐
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={step.duration}
                          onChange={(e) => updateProgram(index, 'duration', parseInt(e.target.value) || 1)}
                          className="w-full p-2 border rounded-lg"
                          min="1"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex justify-end mb-8">
            <button
              onClick={handleCustomize}
              className="flex items-center bg-gradient-to-r from-pink-500 to-blue-500 text-white py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
            >
              <CheckCircle2 className="mr-2" size={20} />
              保存并返回
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold gradient-text">婚礼助手</h1>
            <button
              onClick={handleCustomize}
              className="bg-white shadow rounded-full py-2 px-4 text-gray-700 hover:text-pink-500 hover:shadow-md transition-all duration-200"
            >
              自定义流程与音乐
            </button>
          </div>

          {/* 进度条 */}
          <div className="mb-8">
            <div className="bg-gray-100 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 to-blue-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="mt-2 flex justify-between text-sm text-gray-500">
              <span>婚礼进行中</span>
              <span>{currentStep + 1} / {customProgram.length}</span>
            </div>
          </div>

          <div className="wedding-card card-shadow p-6 mb-8">
            <div className="flex items-center mb-4">
              <div className="bg-pink-100 p-2 rounded-full mr-3">
                {getStepIcon(customProgram[currentStep]?.name)}
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                {currentStep + 1}. {customProgram[currentStep]?.name}
              </h2>
            </div>
            
            <div className="mb-6">
              <TimerControl 
                initialSeconds={customProgram[currentStep]?.duration * 60 || 0} 
                onTimerEnd={() => {}} 
              />
            </div>

            <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-100">
              <div className="flex items-start">
                <MessageSquare className="text-pink-500 mt-1 mr-3 flex-shrink-0" />
                <div className="flex-grow">
                  <div className="text-lg text-gray-700 leading-relaxed max-h-72 overflow-y-auto pr-2 whitespace-pre-wrap">
                    {customProgram[currentStep]?.script}
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setCurrentEditingStep(currentStep);
                        setScriptDialogOpen(true);
                      }}
                      className="text-blue-500 hover:text-blue-700 flex items-center text-sm"
                    >
                      <Edit size={14} className="mr-1" />
                      编辑台词
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-5 mb-6 border border-blue-100">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <Music className="text-blue-500 mr-3" />
                  <h3 className="font-semibold text-gray-800">
                    音乐: <span className={customProgram[currentStep]?.music ? "" : "text-gray-400"}>
                      {customProgram[currentStep]?.musicName || '无音乐'}
                    </span>
                  </h3>
                </div>
                {(customProgram[currentStep]?.music || customProgram[currentStep]?.musicSource) && (
                  <MusicPlayer 
                    musicSource={
                      customProgram[currentStep]?.isPreset 
                        ? customProgram[currentStep]?.music 
                        : customProgram[currentStep]?.musicSource
                    }
                    isPreset={customProgram[currentStep]?.isPreset}
                    onPlayStateChange={handleMusicPlayStateChange}
                  />
                )}
              </div>
              <div className="text-sm text-gray-500 ml-8">
                {(customProgram[currentStep]?.music || customProgram[currentStep]?.musicSource)
                  ? '点击播放按钮控制音乐'
                  : '此环节未设置音乐，请在自定义流程中添加'
                }
              </div>
            </div>

            <button
              onClick={nextStep}
              disabled={currentStep >= customProgram.length - 1}
              className={`flex items-center justify-center w-full py-4 rounded-xl text-white font-bold text-lg transition-all duration-300 ${
                currentStep >= customProgram.length - 1
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500 to-blue-500 hover:shadow-lg hover:translate-y-px'
              }`}
            >
              <SkipForward className="mr-2" />
              下一环节: {currentStep < customProgram.length - 1 
                ? customProgram[currentStep + 1]?.name 
                : '婚礼已结束'}
            </button>
          </div>

          <div className="wedding-card card-shadow p-5 overflow-hidden mb-8">
            <h3 className="font-bold mb-4 text-gray-800">婚礼全程流程</h3>
            <div className="flex flex-nowrap overflow-x-auto pb-2 -mx-2">
              {customProgram.map((step, index) => (
                <div
                  key={step.id}
                  onClick={() => {
                    setCurrentStep(index);
                  }}
                  className={`flex-shrink-0 mx-2 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    currentStep === index
                      ? 'bg-pink-100 border-2 border-pink-500 shadow-md transform -translate-y-1'
                      : 'bg-white border border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  <div className="text-sm font-medium">{index + 1}. {step.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{step.duration}分钟</div>
                  {(step.music || step.musicSource) && (
                    <div className="text-xs text-blue-500 mt-1 flex items-center">
                      <Music size={10} className="mr-1" />
                      <span className="truncate max-w-48">{step.musicName}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center text-gray-500 text-xs mb-6">
            <p>由毛立鹏代码精心制作</p>
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

      {/* 庆祝动画效果，在最后一步完成时展示 */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none">
          {/* 这里可以添加庆祝动画元素 */}
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-center">
            <div className="text-3xl font-bold text-pink-500 animate-bounce">
              祝贺! 婚礼圆满完成! 
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeddingHelper;