"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Music, Scissors, SkipForward, SkipBack } from 'lucide-react';
import { getMusicURL, saveMusicTrimSettings, getMusicTrimSettings } from '../lib/musicStorage';
import AudioTrimmer from './AudioTrimmer';
import SimpleWaveform from './SimpleWaveform';

const MusicPlayer = ({ 
  musicSource, 
  isPreset = false, 
  onPlayStateChange,
  autoPlay = false,
  resetKey = 0
}) => {
  // 播放状态
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // 资源状态
  const [audioUrl, setAudioUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 裁剪状态
  const [trimSettings, setTrimSettings] = useState({ start: 0, end: 0 });
  const [isTrimmed, setIsTrimmed] = useState(false);
  const [showTrimmer, setShowTrimmer] = useState(false);
  
  // UI状态
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Refs
  const audioRef = useRef(null);
  const volumeControlRef = useRef(null);
  const progressBarRef = useRef(null);
  const animationRef = useRef(null);

  // 检测是否为移动设备
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // 点击外部关闭音量控制
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (volumeControlRef.current && !volumeControlRef.current.contains(event.target)) {
        setShowVolumeControl(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // 初始化音频对象和加载音频源
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
    }

    // 清理之前的音频URL
    if (audioUrl && !isPreset) {
      URL.revokeObjectURL(audioUrl);
    }
    
    // 重置播放状态
    pauseAudio();
    
    // 加载新的音频源
    const loadAudio = async () => {
      if (!musicSource) return;
      
      try {
        setIsLoading(true);
        let url;
        
        if (isPreset) {
          // 预设音乐直接使用路径
          url = musicSource;
        } else {
          // 从IndexedDB获取音乐文件
          url = await getMusicURL(musicSource);
          
          // 获取裁剪设置
          const savedTrimSettings = await getMusicTrimSettings(musicSource);
          if (savedTrimSettings && 
              (savedTrimSettings.start > 0 || savedTrimSettings.end > 0)) {
            setTrimSettings(savedTrimSettings);
            setIsTrimmed(true);
          } else {
            setTrimSettings({ start: 0, end: 0 });
            setIsTrimmed(false);
          }
        }
        
        setAudioUrl(url);
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.load();
        }
        
        setIsLoading(false);
        
        // 如果设置了自动播放，则开始播放
        if (autoPlay) {
          setTimeout(() => {
            playAudio();
          }, 300);
        }
      } catch (error) {
        console.error('加载音频失败:', error);
        setIsLoading(false);
      }
    };
    
    loadAudio();
    
    // 清理函数
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      }
    };
  }, [musicSource, isPreset, autoPlay, resetKey]);

  // 音频事件监听器
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleEnded = () => {
      setIsPlaying(false);
      if (onPlayStateChange) onPlayStateChange(false);
      
      // 如果有裁剪设置，则回到裁剪开始位置
      if (isTrimmed && trimSettings.start > 0) {
        audio.currentTime = trimSettings.start;
      }
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      // 检查是否达到裁剪的结束点
      if (isTrimmed && 
          trimSettings.end > 0 && 
          audio.currentTime >= trimSettings.end) {
        audio.pause();
        audio.currentTime = trimSettings.start;
        setIsPlaying(false);
        if (onPlayStateChange) onPlayStateChange(false);
      }
    };
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      
      // 如果没有结束点设置，将其设置为音频总时长
      if (isTrimmed && trimSettings.end === 0) {
        setTrimSettings(prev => ({
          ...prev,
          end: audio.duration
        }));
      }
    };
    
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [onPlayStateChange, isTrimmed, trimSettings]);

  // 控制音量
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // 播放音频的函数
  const playAudio = () => {
    if (!audioRef.current || !audioUrl) return;
    
    // 如果有裁剪设置，则从裁剪开始点播放
    if (isTrimmed && trimSettings.start > 0) {
      audioRef.current.currentTime = trimSettings.start;
    }
    
    audioRef.current.play()
      .then(() => {
        setIsPlaying(true);
        if (onPlayStateChange) onPlayStateChange(true);
        
        // 启动时间更新动画
        startTimeUpdateAnimation();
      })
      .catch(error => {
        console.error("播放音乐失败:", error);
      });
  };
  
  // 暂停音频的函数
  const pauseAudio = () => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    setIsPlaying(false);
    if (onPlayStateChange) onPlayStateChange(false);
    
    // 停止动画
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };
  
  // 使用requestAnimationFrame更新时间
  const startTimeUpdateAnimation = () => {
    if (!audioRef.current) return;
    
    const updateTime = () => {
      setCurrentTime(audioRef.current.currentTime);
      animationRef.current = requestAnimationFrame(updateTime);
    };
    
    animationRef.current = requestAnimationFrame(updateTime);
  };
  
  // 跳转函数
  const jumpToTime = (time) => {
    if (!audioRef.current) return;
    
    let targetTime = time;
    
    // 如果有裁剪，限制在裁剪范围内
    if (isTrimmed) {
      if (time < trimSettings.start) targetTime = trimSettings.start;
      if (trimSettings.end > 0 && time > trimSettings.end) targetTime = trimSettings.end;
    }
    
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };
  
  // 快进/快退
  const jumpForward = () => {
    if (!audioRef.current) return;
    
    const newTime = audioRef.current.currentTime + 5;
    
    // 检查是否超出裁剪范围
    if (isTrimmed && trimSettings.end > 0 && newTime > trimSettings.end) {
      jumpToTime(trimSettings.start);
    } else {
      jumpToTime(newTime);
    }
  };
  
  const jumpBackward = () => {
    if (!audioRef.current) return;
    
    const newTime = audioRef.current.currentTime - 5;
    
    // 检查是否低于裁剪起点
    if (isTrimmed && newTime < trimSettings.start) {
      jumpToTime(trimSettings.start);
    } else {
      jumpToTime(Math.max(0, newTime));
    }
  };
  
  // 跳转到指定时间点
  const seekAudio = (e) => {
    if (!audioRef.current || !audioUrl || duration === 0) return;
    
    // 计算点击位置对应的时间
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clickPosition = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    
    // 如果有裁剪设置，则限制在裁剪范围内
    let newTime;
    if (isTrimmed && trimSettings.end > 0) {
      const trimRange = trimSettings.end - trimSettings.start;
      newTime = trimSettings.start + (clickPosition * trimRange);
    } else {
      newTime = clickPosition * duration;
    }
    
    // 设置新的播放位置
    jumpToTime(newTime);
    
    // 如果是触摸事件，标记开始拖动
    if (e.type.includes('touch')) {
      setIsDragging(true);
    }
  };
  
  // 处理拖动进度条
  const handleTouchMove = (e) => {
    if (!isDragging || !audioRef.current || !audioUrl || duration === 0) return;
    
    // 阻止页面滚动
    e.preventDefault();
    
    const progressBar = progressBarRef.current;
    const rect = progressBar.getBoundingClientRect();
    const clientX = e.touches[0].clientX;
    const position = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    
    // 计算时间位置（考虑裁剪范围）
    let newTime;
    if (isTrimmed && trimSettings.end > 0) {
      const trimRange = trimSettings.end - trimSettings.start;
      newTime = trimSettings.start + (position * trimRange);
    } else {
      newTime = position * duration;
    }
    
    // 更新当前时间显示
    setCurrentTime(newTime);
  };
  
  // 处理触摸结束，完成拖动
  const handleTouchEnd = (e) => {
    if (!isDragging) return;
    
    const progressBar = progressBarRef.current;
    const rect = progressBar.getBoundingClientRect();
    const clientX = e.changedTouches[0].clientX;
    const position = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    
    // 计算实际时间位置（考虑裁剪范围）
    let newTime;
    if (isTrimmed && trimSettings.end > 0) {
      const trimRange = trimSettings.end - trimSettings.start;
      newTime = trimSettings.start + (position * trimRange);
    } else {
      newTime = position * duration;
    }
    
    // 设置最终的播放位置
    jumpToTime(newTime);
    
    // 结束拖动状态
    setIsDragging(false);
  };

  // 播放/暂停切换
  const togglePlay = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  // 静音切换
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // 音量按钮点击
  const handleVolumeButtonClick = () => {
    if (isMobile) {
      setShowVolumeControl(!showVolumeControl);
    } else {
      toggleMute();
    }
  };

  // 音量调整
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };
  
  // 格式化时间（分:秒）
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return "0:00";
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // 打开音频裁剪工具
  const openTrimmer = () => {
    // 暂停当前播放
    pauseAudio();
    setShowTrimmer(true);
  };
  
  // 保存裁剪设置
  const handleSaveTrimSettings = async (newTrimSettings, playImmediately = false) => {
    // 非预设音乐才能保存裁剪设置
    if (!isPreset && musicSource) {
      try {
        // 保存裁剪设置到IndexedDB
        await saveMusicTrimSettings(musicSource, newTrimSettings);
        
        // 更新本地状态
        setTrimSettings(newTrimSettings);
        setIsTrimmed(true);
        
        // 将音频定位到裁剪开始位置
        if (audioRef.current) {
          audioRef.current.currentTime = newTrimSettings.start;
        }
        
        // 关闭裁剪工具
        setShowTrimmer(false);
        
        // 如果请求立即播放，则开始播放
        if (playImmediately) {
          setTimeout(() => playAudio(), 100);
        }
      } catch (error) {
        console.error('保存裁剪设置失败:', error);
        alert('保存裁剪设置失败，请重试');
      }
    } else {
      // 预设音乐只在当前会话中应用裁剪效果
      setTrimSettings(newTrimSettings);
      setIsTrimmed(true);
      
      // 将音频定位到裁剪开始位置
      if (audioRef.current) {
        audioRef.current.currentTime = newTrimSettings.start;
      }
      
      // 关闭裁剪工具
      setShowTrimmer(false);
      
      // 如果请求立即播放，则开始播放
      if (playImmediately) {
        setTimeout(() => playAudio(), 100);
      }
    }
  };

  // 计算进度条显示
  const calculateProgressPercentage = () => {
    if (duration === 0) return 0;
    
    if (isTrimmed && trimSettings.end > 0) {
      // 裁剪模式下的进度计算
      const trimStart = trimSettings.start;
      const trimEnd = trimSettings.end;
      const trimDuration = trimEnd - trimStart;
      
      if (currentTime < trimStart) return 0;
      if (currentTime > trimEnd) return 100;
      
      return ((currentTime - trimStart) / trimDuration) * 100;
    } else {
      // 普通模式下的进度计算
      return (currentTime / duration) * 100;
    }
  };
  
  // 显示的时间计算
  const displayCurrentTime = () => {
    if (isTrimmed) {
      // 裁剪模式显示相对时间
      const relativeTime = Math.max(0, currentTime - trimSettings.start);
      return formatTime(relativeTime);
    } else {
      return formatTime(currentTime);
    }
  };
  
  const displayDuration = () => {
    if (isTrimmed && trimSettings.end > 0) {
      return formatTime(trimSettings.end - trimSettings.start);
    } else {
      return formatTime(duration);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="rounded-full p-2 bg-base-200 animate-pulse">
          <Music size={16} className="text-base-content opacity-50" />
        </div>
        <span className="text-sm text-base-content opacity-50">加载中...</span>
      </div>
    );
  }

  if (showTrimmer && audioUrl) {
    return (
      <AudioTrimmer
        audioUrl={audioUrl}
        isPreset={isPreset}
        initialTrimPoints={trimSettings}
        onSaveTrim={handleSaveTrimSettings}
        onClose={() => setShowTrimmer(false)}
      />
    );
  }

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body p-4">
        {/* 播放进度条 */}
        {audioUrl && (
          <div className="w-full">
            <div className="flex justify-between text-xs text-base-content opacity-70 mb-1">
              <span>{displayCurrentTime()}</span>
              <span>{displayDuration()}</span>
            </div>
            
            <div 
              ref={progressBarRef}
              className="w-full h-10 bg-base-300 rounded-lg cursor-pointer relative overflow-hidden"
              onClick={seekAudio}
              onTouchStart={seekAudio}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* 使用简化波形组件 */}
              <div className="absolute inset-0">
                <SimpleWaveform 
                  audioUrl={audioUrl}
                  duration={duration}
                  currentTime={currentTime}
                  onTimeUpdate={jumpToTime}
                />
              </div>
              
              {/* 播放进度条 */}
              <div 
                className="absolute left-0 top-0 h-full bg-primary opacity-20 pointer-events-none"
                style={{ width: `${calculateProgressPercentage()}%` }}
              ></div>
              
              {/* 播放位置指示器 */}
              <div
                className="absolute top-0 h-full w-1 bg-primary pointer-events-none"
                style={{ left: `calc(${calculateProgressPercentage()}% - 1px)` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* 控制按钮 */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {/* 音量控制 */}
            <div className="relative" ref={volumeControlRef}>
              <button
                onClick={handleVolumeButtonClick}
                disabled={!audioUrl}
                className={`btn btn-circle btn-sm ${!audioUrl ? 'btn-disabled' : 'btn-ghost'}`}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              
              {/* 移动端音量控制浮层 */}
              {isMobile && showVolumeControl && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-base-100 p-3 rounded-lg shadow-lg z-10 w-32 border border-base-300">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="range range-xs range-primary w-full"
                  />
                </div>
              )}
            </div>
            
            {/* 桌面端音量滑块 */}
            {!isMobile && (
              <div className="w-16">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className={`range range-xs range-primary w-full ${!audioUrl ? 'range-disabled' : ''}`}
                  disabled={!audioUrl}
                />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {/* 后退按钮 */}
            <button 
              onClick={jumpBackward}
              disabled={!audioUrl} 
              className={`btn btn-circle btn-sm ${!audioUrl ? 'btn-disabled' : 'btn-ghost'}`}
            >
              <SkipBack size={18} />
            </button>
            
            {/* 播放/暂停按钮 */}
            <button
              onClick={togglePlay}
              disabled={!audioUrl}
              className={`btn btn-circle ${
                isPlaying ? 'btn-primary' : 'btn-outline btn-primary'
              } ${!audioUrl ? 'btn-disabled' : ''}`}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            
            {/* 前进按钮 */}
            <button 
              onClick={jumpForward}
              disabled={!audioUrl} 
              className={`btn btn-circle btn-sm ${!audioUrl ? 'btn-disabled' : 'btn-ghost'}`}
            >
              <SkipForward size={18} />
            </button>
          </div>
          
          {/* 裁剪按钮 */}
          <button
            onClick={openTrimmer}
            disabled={!audioUrl}
            className={`btn btn-circle btn-sm ${!audioUrl ? 'btn-disabled' : 'btn-outline'}`}
            title="裁剪音频"
          >
            <Scissors size={16} />
          </button>
        </div>
        
        {/* 裁剪信息提示 */}
        {isTrimmed && trimSettings.start > 0 && (
          <div className="flex items-center justify-center mt-1">
            <div className="badge badge-sm badge-primary gap-1">
              <Scissors size={10} />
              已裁剪: {formatTime(trimSettings.start)} - {formatTime(trimSettings.end)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicPlayer;