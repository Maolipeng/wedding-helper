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
  
  // 音频处理
  const audioRef = useRef(null);
  const requestRef = useRef(null);
  const waveformCanvasRef = useRef(null);
  const progressCanvasRef = useRef(null);
  
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
      
      // 加载波形数据
      loadAudioWaveform(audioUrl, audioDuration);
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
  
  // 加载音频波形
  const loadAudioWaveform = async (url, audioDuration) => {
    try {
      setIsLoading(true);
      
      console.log("开始加载波形图...");
      
      // 创建音频上下文
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // 获取音频数据
      let audioBuffer;
      
      if (isPreset) {
        // 预设音乐使用XMLHttpRequest，更可靠地处理跨域问题
        audioBuffer = await new Promise((resolve, reject) => {
          const request = new XMLHttpRequest();
          request.open('GET', url, true);
          request.responseType = 'arraybuffer';
          
          request.onload = () => {
            audioContext.decodeAudioData(request.response)
              .then(buffer => resolve(buffer))
              .catch(err => reject(err));
          };
          
          request.onerror = () => {
            reject(new Error('Failed to load audio file'));
          };
          
          request.send();
        });
      } else {
        // 上传的音乐从URL获取
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      }
      
      // 绘制波形
      console.log("音频解码成功，开始绘制波形...");
      drawWaveform(audioBuffer);
      
      // 完成加载
      setIsLoading(false);
    } catch (error) {
      console.error("波形图加载失败:", error);
      // 加载失败时绘制默认波形
      console.log("加载失败，使用备用波形...");
      drawFallbackWaveform();
      setIsLoading(false);
    }
  };
  
  // 绘制波形图
  const drawWaveform = (audioBuffer) => {
    if (!waveformCanvasRef.current) {
      console.error("波形图Canvas引用不存在");
      return;
    }
    
    const canvas = waveformCanvasRef.current;
    const ctx = canvas.getContext('2d');
    // 动态设置canvas尺寸
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    const width = canvas.width;
    const height = canvas.height;
    
    // 清除画布
    ctx.clearRect(0, 0, width, height);
    
    // 获取音频数据
    const channelData = audioBuffer.getChannelData(0);
    const dataLength = channelData.length;
    
    console.log(`开始绘制波形，数据长度: ${dataLength}, Canvas宽度: ${width}`);
    
    // 计算采样步长
    const step = Math.max(1, Math.floor(dataLength / width));
    const amp = height / 2;
    
    // 设置画布背景
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = '#6b7280'; // 波形颜色 - 灰色
    
    // 绘制波形 - 更可靠的方法
    for (let i = 0; i < width; i++) {
      let min = 0;
      let max = 0;
      
      // 找出每个像素宽度内的最大和最小值
      for (let j = 0; j < step; j++) {
        const index = Math.min(dataLength - 1, i * step + j);
        const value = channelData[index];
        
        if (value < min) min = value;
        if (value > max) max = value;
      }
      
      // 确保有一定的高度 (即使是静音部分)
      const minHeight = height * 0.05;
      const waveHeight = Math.max(minHeight, Math.abs(max - min) * amp);
      
      // 在中心线绘制波形
      const y = (height / 2) - (waveHeight / 2);
      ctx.fillRect(i, y, 1, waveHeight);
    }
    
    console.log("波形绘制完成，更新选择区域");
    
    // 初始绘制选中区域
    updateSelectedArea();
  };
  
  // 绘制备用波形 - 使用正弦波形
  const drawFallbackWaveform = () => {
    if (!waveformCanvasRef.current) {
      console.error("波形图Canvas引用不存在");
      return;
    }
    
    const canvas = waveformCanvasRef.current;
    const ctx = canvas.getContext('2d');
    // 动态设置canvas尺寸
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    const width = canvas.width;
    const height = canvas.height;
    
    // 清除画布
    ctx.clearRect(0, 0, width, height);
    
    // 设置画布背景
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, width, height);
    
    // 绘制平滑的正弦波形而不是随机噪声
    ctx.fillStyle = '#6b7280';
    ctx.beginPath();
    
    const centerY = height / 2;
    const amplitude = height * 0.3;
    
    // 创建一个数组来生成看起来像音乐波形的模式
    const segments = [
      { freq: 0.02, amp: 0.8 },  // 低频高振幅
      { freq: 0.05, amp: 0.4 },  // 中频中振幅
      { freq: 0.1, amp: 0.2 }    // 高频低振幅
    ];
    
    for (let i = 0; i < width; i++) {
      let sample = 0;
      
      // 合并不同频率的正弦波
      segments.forEach(seg => {
        sample += Math.sin(i * seg.freq) * seg.amp;
      });
      
      // 归一化到 -1 到 1 范围
      sample /= segments.length * 0.8;
      
      // 计算高度并绘制
      const barHeight = sample * amplitude;
      ctx.fillRect(
        i,
        centerY - barHeight/2,
        1,
        Math.abs(barHeight)
      );
    }
    
    console.log("备用波形绘制完成");
    
    // 初始绘制选中区域
    updateSelectedArea();
  };
  
  // 更新选中区域
  const updateSelectedArea = () => {
    if (!progressCanvasRef.current || duration === 0) {
      console.log("无法更新选择区域：进度Canvas引用不存在或持续时间为0");
      return;
    }
    
    const canvas = progressCanvasRef.current;
    const ctx = canvas.getContext('2d');
    // 动态设置canvas尺寸
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    const width = canvas.width;
    const height = canvas.height;
    
    // 清除画布
    ctx.clearRect(0, 0, width, height);
    
    // 计算开始和结束位置
    const startX = Math.max(0, (startPoint / duration) * width);
    const endX = Math.min(width, (endPoint / duration) * width);
    const selectionWidth = Math.max(0, endX - startX);
    
    console.log(`更新选择区域: startX=${startX}, endX=${endX}, width=${width}, duration=${duration}`);
    
    // 绘制高亮选中区域
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'; // 蓝色半透明
    ctx.fillRect(startX, 0, selectionWidth, height);
    
    // 绘制非选中区域遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, startX, height);
    ctx.fillRect(endX, 0, width - endX, height);
    
    // 绘制选中区域边框
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, 0, selectionWidth, height);
    
    // 绘制起点和终点手柄
    const handleSize = 8;
    
    // 起点手柄
    ctx.fillStyle = '#3b82f6'; // 蓝色
    ctx.fillRect(startX - handleSize/2, 0, handleSize, height);
    
    // 终点手柄
    ctx.fillStyle = '#3b82f6'; // 蓝色
    ctx.fillRect(endX - handleSize/2, 0, handleSize, height);
    
    // 绘制当前播放位置
    if (isPlaying && currentTime >= 0) {
      const playheadX = (currentTime / duration) * width;
      ctx.fillStyle = '#ef4444'; // 红色
      ctx.fillRect(playheadX - 1, 0, 3, height);
      
      // 添加小圆点标记播放位置
      ctx.beginPath();
      ctx.arc(playheadX, height/2, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };
  
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
  
  // 当裁剪点变更时更新选中区域
  // 添加窗口大小变化监听
  useEffect(() => {
    const handleResize = () => {
      if (waveformCanvasRef.current) {
        drawWaveform(audioBuffer);
      }
      updateSelectedArea();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    updateSelectedArea();
  }, [startPoint, endPoint, currentTime, isPlaying, duration]);
  
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
  
  // 处理波形点击
  const handleWaveformClick = (e) => {
    if (!waveformCanvasRef.current || duration === 0) return;
    
    const canvas = waveformCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickPosition = x / rect.width; // 使用rect.width而不是canvas.width
    const timePosition = clickPosition * duration;
    
    console.log(`波形点击: x=${x}, position=${clickPosition}, time=${timePosition}`);
    
    // 设置当前时间
    setCurrentTime(timePosition);
    if (audioRef.current) {
      audioRef.current.currentTime = timePosition;
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
        
        {/* 波形图区域 */}
        <div className="relative w-full h-32 mb-4 cursor-pointer rounded-lg overflow-hidden bg-base-200" onClick={handleWaveformClick}>
          {/* 基础波形 */}
          <canvas 
            ref={waveformCanvasRef} 
            width={null} 
            height={128} 
            className="w-full h-full absolute top-0 left-0"
          />
          
          {/* 选择区域和播放头 */}
          <canvas 
            ref={progressCanvasRef} 
            width={null} 
            height={128} 
            className="w-full h-full absolute top-0 left-0"
          />
          
          {/* 波形加载状态提示 */}
          <div className="absolute top-2 left-2 text-xs text-base-content opacity-70">
            波形显示: {waveformCanvasRef.current ? "已加载" : "加载中..."}
          </div>
          
          {/* 当前播放时间指示 */}
          {isPlaying && (
            <div className="badge badge-sm badge-primary absolute top-2 right-2">
              {formatTime(currentTime)}
            </div>
          )}
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