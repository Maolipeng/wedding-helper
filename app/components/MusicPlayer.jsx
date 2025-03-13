"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';
import { getMusicURL } from '../lib/musicStorage';

const MusicPlayer = ({ 
  musicSource, 
  isPreset = false, 
  onPlayStateChange,
  autoPlay = false, // 新增: 自动播放选项
  resetKey = 0 // 新增: 重置键，当它改变时重新加载音乐
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);

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

  // 监听音频结束
  useEffect(() => {
    const handleEnded = () => {
      setIsPlaying(false);
      if (onPlayStateChange) onPlayStateChange(false);
    };
    
    if (audioRef.current) {
      audioRef.current.addEventListener('ended', handleEnded);
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleEnded);
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
    <div className="flex items-center space-x-3">
      <button
        onClick={togglePlay}
        disabled={!audioUrl}
        className={`rounded-full p-2 transition-all ${
          isPlaying 
            ? 'bg-pink-100 text-pink-500 hover:bg-pink-200' 
            : 'bg-blue-100 text-blue-500 hover:bg-blue-200'
        } ${!audioUrl ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>
      
      <button
        onClick={toggleMute}
        disabled={!audioUrl}
        className={`rounded-full p-2 transition-all ${
          isMuted 
            ? 'bg-gray-100 text-gray-500' 
            : 'bg-gray-100 text-gray-700'
        } ${!audioUrl ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}
      >
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      
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
    </div>
  );
};

export default MusicPlayer;