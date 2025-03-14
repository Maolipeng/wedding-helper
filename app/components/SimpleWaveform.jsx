"use client";

import React, { useState, useEffect, useRef } from 'react';

// 简化的音频波形组件
const SimpleWaveform = ({ audioUrl, duration = 0, currentTime = 0, onTimeUpdate }) => {
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  // 生成波形数据
  useEffect(() => {
    if (!audioUrl || !canvasRef.current) return;
    
    const generateWaveform = async () => {
      try {
        setIsLoading(true);
        
        // 使用更简单的方法生成波形 - 伪随机波形
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // 调整Canvas大小
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width || 800;
        canvas.height = rect.height || 100;
        
        const width = canvas.width;
        const height = canvas.height;
        
        // 清空画布
        ctx.clearRect(0, 0, width, height);
        
        // 绘制背景
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(0, 0, width, height);
        
        // 使用伪随机波形，但基于音频URL创建一致的图案
        const seedValue = Array.from(audioUrl).reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const pseudoRandom = (n) => {
          return (Math.sin(n + seedValue) * 10000) % 1;
        };
        
        // 绘制波形
        ctx.fillStyle = '#6b7280';
        
        // 创建波浪效果
        for (let i = 0; i < width; i++) {
          // 混合多个频率创建更自然的波形
          const y1 = Math.sin(i * 0.01 + seedValue) * 0.5;
          const y2 = Math.sin(i * 0.02 + seedValue * 2) * 0.3;
          const y3 = Math.sin(i * 0.04 + seedValue * 3) * 0.2;
          
          const combinedHeight = (y1 + y2 + y3) * height * 0.4;
          const barHeight = Math.max(2, Math.abs(combinedHeight));
          
          ctx.fillRect(
            i, 
            (height / 2) - (barHeight / 2), 
            1, 
            barHeight
          );
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("波形生成失败:", error);
        setIsLoading(false);
      }
    };
    
    generateWaveform();
  }, [audioUrl]);
  
  // 绘制播放进度
  useEffect(() => {
    if (!canvasRef.current || duration <= 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // 只重绘进度指示器部分，不重绘整个波形
    // 制作一个剪切区域，只在进度条周围重绘
    const progressPosition = (currentTime / duration) * width;
    
    // 清除进度指示器区域
    ctx.clearRect(progressPosition - 5, 0, 10, height);
    
    // 重绘该区域的波形
    // 仅为简单实现，实际使用中应保存波形数据以便重绘
    const seedValue = Array.from(audioUrl).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const i = Math.floor(progressPosition);
    
    ctx.fillStyle = '#6b7280';
    for (let x = i - 2; x <= i + 2; x++) {
      if (x >= 0 && x < width) {
        const y1 = Math.sin(x * 0.01 + seedValue) * 0.5;
        const y2 = Math.sin(x * 0.02 + seedValue * 2) * 0.3;
        const y3 = Math.sin(x * 0.04 + seedValue * 3) * 0.2;
        
        const combinedHeight = (y1 + y2 + y3) * height * 0.4;
        const barHeight = Math.max(2, Math.abs(combinedHeight));
        
        ctx.fillRect(
          x, 
          (height / 2) - (barHeight / 2), 
          1, 
          barHeight
        );
      }
    }
    
    // 绘制进度指示器
    ctx.fillStyle = '#ef4444';  // 红色
    ctx.fillRect(progressPosition - 1, 0, 2, height);
    
  }, [audioUrl, currentTime, duration]);
  
  // 处理点击事件，允许用户跳转到特定位置
  const handleClick = (e) => {
    if (!canvasRef.current || duration <= 0) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    if (onTimeUpdate) {
      onTimeUpdate(newTime);
    }
  };
  
  return (
    <div className="relative w-full h-full">
      <canvas 
        ref={canvasRef}
        className={`w-full h-full cursor-pointer ${isLoading ? 'opacity-50' : ''}`}
        onClick={handleClick}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="loading loading-bars loading-sm"></div>
        </div>
      )}
    </div>
  );
};

export default SimpleWaveform;