"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';
import { getMusicURL } from '../lib/musicStorage';

const MusicPlayer = ({ 
  musicSource, 
  isPreset = false, 
  onPlayStateChange,
  autoPlay = false,
  resetKey = 0
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const audioRef = useRef(null);
  const volumeControlRef = useRef(null);
  const progressBarRef = useRef(null);

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
    setIsPlaying(false);
    if (onPlayStateChange) onPlayStateChange(false);
    
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
        }
        
        setAudioUrl(url);
        audioRef.current.src = url;
        
        // 预加载音频
        audioRef.current.load();
        setIsLoading(false);
        
        // 如果设置了自动播放，则开始播放
        if (autoPlay) {
          setTimeout(() => {
            playAudio();
          }, 300); // 短暂延迟确保音频已加载
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
      }
    };
  }, [musicSource, isPreset, autoPlay, resetKey]);

  // 监听音频结束和进度
  useEffect(() => {
    const handleEnded = () => {
      setIsPlaying(false);
      if (onPlayStateChange) onPlayStateChange(false);
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audioRef.current.currentTime);
    };
    
    const handleLoadedMetadata = () => {
      setDuration(audioRef.current.duration);
    };
    
    if (audioRef.current) {
      audioRef.current.addEventListener('ended', handleEnded);
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
      }
    };
  }, [onPlayStateChange]);

  // 控制音量
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // 播放音频的函数
  const playAudio = () => {
    if (!audioRef.current || !audioUrl) return;
    
    audioRef.current.play()
      .then(() => {
        setIsPlaying(true);
        if (onPlayStateChange) onPlayStateChange(true);
      })
      .catch(error => {
        console.error("播放音乐失败:", error);
      });
  };
  
  // 暂停音频的函数
  const pauseAudio = () => {
    if (!audioRef.current || !audioUrl) return;
    
    audioRef.current.pause();
    setIsPlaying(false);
    if (onPlayStateChange) onPlayStateChange(false);
  };
  
  // 跳转到指定时间点
  const seekAudio = (e) => {
    if (!audioRef.current || !audioUrl || duration === 0) return;
    
    // 计算点击位置对应的时间
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clickPosition = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = clickPosition * duration;
    
    // 设置新的播放位置
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    
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
    
    // 更新当前时间显示（但不立即设置音频时间，提高性能）
    setCurrentTime(position * duration);
  };
  
  // 处理触摸结束，完成拖动
  const handleTouchEnd = (e) => {
    if (!isDragging || !audioRef.current || !audioUrl || duration === 0) return;
    
    const progressBar = progressBarRef.current;
    const rect = progressBar.getBoundingClientRect();
    const clientX = e.changedTouches[0].clientX;
    const position = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    
    // 设置最终的播放位置
    const newTime = position * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    
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

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="bg-gray-100 rounded-full p-2 animate-pulse">
          <Music size={16} className="text-gray-400" />
        </div>
        <span className="text-sm text-gray-400">加载中...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2 w-full max-w-md">
      {/* 播放进度条 */}
      {audioUrl && !isLoading && (
        <div className="w-full space-y-1">
          <div 
            ref={progressBarRef}
            className="relative w-full h-3 bg-gray-200 rounded-full cursor-pointer group touch-manipulation"
            onClick={seekAudio}
            onTouchStart={seekAudio}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-pink-500 rounded-full pointer-events-none"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            ></div>
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-pink-500 rounded-full shadow-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${duration > 0 ? (currentTime / duration) * 100 : 0}% - 8px)` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}
      
      {/* 控制按钮 */}
      <div className="flex items-center space-x-3">
        <button
          onClick={togglePlay}
          disabled={!audioUrl}
          className={`rounded-full p-3 transition-all ${
            isPlaying 
              ? 'bg-pink-100 text-pink-500 hover:bg-pink-200' 
              : 'bg-blue-100 text-blue-500 hover:bg-blue-200'
          } ${!audioUrl ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
        >
          {isPlaying ? <Pause size={isMobile ? 20 : 16} /> : <Play size={isMobile ? 20 : 16} />}
        </button>
        
        <div className="relative" ref={volumeControlRef}>
          <button
            onClick={handleVolumeButtonClick}
            disabled={!audioUrl}
            className={`rounded-full p-3 transition-all ${
              isMuted 
                ? 'bg-gray-100 text-gray-500' 
                : 'bg-gray-100 text-gray-700'
            } ${!audioUrl ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}
          >
            {isMuted ? <VolumeX size={isMobile ? 20 : 16} /> : <Volume2 size={isMobile ? 20 : 16} />}
          </button>
          
          {/* 移动端音量控制浮层 */}
          {isMobile && showVolumeControl && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white p-3 rounded-lg shadow-lg z-10 w-32">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full"
              />
            </div>
          )}
        </div>
        
        {/* 桌面端音量滑块 */}
        {!isMobile && (
          <div className="relative w-24 group">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className={`w-full ${!audioUrl ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              disabled={!audioUrl}
            />
            <div 
              className="absolute left-0 top-1/2 h-1.5 bg-gradient-to-r from-blue-500 to-pink-500 rounded-full transform -translate-y-1/2 pointer-events-none"
              style={{ width: `${volume * 100}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicPlayer;