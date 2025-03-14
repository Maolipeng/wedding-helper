"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Scissors, Play, Pause, Save, RotateCcw, X } from 'lucide-react';

const AudioTrimmer = ({
  audioUrl,
  isPreset,
  onSaveTrim,
  onClose,
  initialTrimPoints = { start: 0, end: 0 }
}) => {
  // 音频状态
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  // 裁剪点状态
  const [startPoint, setStartPoint] = useState(initialTrimPoints.start || 0);
  const [endPoint, setEndPoint] = useState(initialTrimPoints.end || 0);
  
  // 移动设备检测
  const [isMobile, setIsMobile] = useState(false);
  
  // 音频处理
  const audioRef = useRef(null);
  const requestRef = useRef(null);
  
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
  
  // 初始化音频
  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    const handleLoadedMetadata = () => {
      const audioDuration = audio.duration;
      setDuration(audioDuration);
      
      // 如果没有初始结束点，设置为音频总时长
      if (initialTrimPoints.end <= 0) {
        setEndPoint(audioDuration);
      } else {
        setEndPoint(Math.min(initialTrimPoints.end, audioDuration));
      }
      
      setIsLoading(false);
    };
    
    const handleError = (err) => {
      console.error("音频加载失败:", err);
      setIsLoading(false);
    };
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);
    
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
      audio.pause();
      
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [audioUrl, initialTrimPoints]);
  
  // 更新播放进度
  useEffect(() => {
    if (!isPlaying || !audioRef.current) return;
    
    const updatePlayhead = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
        
        // 检查是否达到结束点
        if (audioRef.current.currentTime >= endPoint) {
          audioRef.current.pause();
          audioRef.current.currentTime = startPoint;
          setIsPlaying(false);
          return;
        }
        
        requestRef.current = requestAnimationFrame(updatePlayhead);
      }
    };
    
    requestRef.current = requestAnimationFrame(updatePlayhead);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying, endPoint, startPoint]);
  
  // 播放/暂停
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // 设置当前时间到开始点
      audioRef.current.currentTime = startPoint;
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error("播放失败:", err));
    }
  };
  
  // 保存裁剪设置
  const handleSaveTrim = () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    
    onSaveTrim({ start: startPoint, end: endPoint }, true);
  };
  
  // 重置裁剪点
  const resetTrimPoints = () => {
    setStartPoint(0);
    setEndPoint(duration);
  };
  
  // 格式化时间
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // 处理进度条点击
  const handleProgressClick = (e) => {
    if (!audioRef.current || duration === 0) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickPosition = x / rect.width;
    const timePosition = clickPosition * duration;
    
    // 设置当前时间，限制在裁剪范围内
    if (timePosition >= startPoint && timePosition <= endPoint) {
      setCurrentTime(timePosition);
      if (audioRef.current) {
        audioRef.current.currentTime = timePosition;
      }
    }
  };
  
  if (isLoading) {
    return (
      <div className="card w-full bg-base-100 shadow-lg">
        <div className="card-body items-center text-center p-6">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-base-content">正在加载音频...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="card w-full bg-base-100 shadow-lg">
      <div className="card-body p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="card-title text-lg flex items-center">
            <Scissors className="mr-2 text-primary" size={20} /> 
            音频裁剪工具
          </h2>
          <button 
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        
        {/* 显示当前播放进度 */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-base-content opacity-70 mb-1">
            <span>当前位置: {formatTime(currentTime)}</span>
            <span>总时长: {formatTime(duration)}</span>
          </div>
          
          <div 
            className="w-full h-8 bg-base-300 rounded-lg cursor-pointer relative overflow-hidden"
            onClick={handleProgressClick}
          >
            {/* 裁剪区域显示 */}
            <div 
              className="absolute top-0 h-full bg-primary opacity-20"
              style={{ 
                left: `${(startPoint / duration) * 100}%`, 
                width: `${((endPoint - startPoint) / duration) * 100}%` 
              }}
            ></div>
            
            {/* 起始点标记 */}
            <div
              className="absolute top-0 h-full w-1 bg-primary"
              style={{ left: `${(startPoint / duration) * 100}%` }}
            ></div>
            
            {/* 结束点标记 */}
            <div
              className="absolute top-0 h-full w-1 bg-primary"
              style={{ left: `${(endPoint / duration) * 100}%` }}
            ></div>
            
            {/* 当前播放位置 */}
            {isPlaying && (
              <div
                className="absolute top-0 h-full w-1 bg-red-500"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              ></div>
            )}
            
            {/* 背景填充 */}
            <div className="absolute left-0 top-0 h-full w-full bg-base-300 -z-10"></div>
          </div>
        </div>
        
        {/* 裁剪控制 */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">起始点: {formatTime(startPoint)}</span>
            <span className="label-text-alt">拖动滑块设置起点</span>
          </label>
          <input 
            type="range" 
            min="0" 
            max={duration} 
            step="0.1" 
            value={startPoint}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (value < endPoint) {
                setStartPoint(value);
                if (audioRef.current) {
                  audioRef.current.currentTime = value;
                }
              }
            }}
            className="range range-accent"
          />
        </div>
        
        <div className="form-control w-full mt-3">
          <label className="label">
            <span className="label-text">结束点: {formatTime(endPoint)}</span>
            <span className="label-text-alt">拖动滑块设置终点</span>
          </label>
          <input 
            type="range" 
            min="0" 
            max={duration} 
            step="0.1" 
            value={endPoint}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (value > startPoint) {
                setEndPoint(value);
              }
            }}
            className="range range-primary range-sm" 
          />
        </div>
        
        {/* 裁剪信息 */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
          <div className="badge badge-lg badge-primary">
            裁剪长度: {formatTime(endPoint - startPoint)}
          </div>
          
          <div className="flex gap-2">
            <button 
              className="btn btn-sm btn-circle btn-outline"
              onClick={resetTrimPoints}
              title="重置裁剪点"
            >
              <RotateCcw size={16} />
            </button>
            
            <button 
              className={`btn btn-sm ${isPlaying ? 'btn-error' : 'btn-primary'}`}
              onClick={togglePlay}
            >
              {isPlaying ? (
                <><Pause size={16} /> 暂停</>
              ) : (
                <><Play size={16} /> 预览</>
              )}
            </button>
          </div>
        </div>
        
        <div className="card-actions justify-end mt-4">
          <button 
            className="btn btn-primary"
            onClick={handleSaveTrim}
          >
            <Save size={16} className="mr-2" />
            保存并播放
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioTrimmer;