"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Clock, AlertCircle } from 'lucide-react';

const TimerControl = ({ initialSeconds, onTimerEnd }) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAlmostDone, setIsAlmostDone] = useState(false);
  const timerRef = useRef(null);

  // 当初始时间改变时重置计时器
  useEffect(() => {
    setTimeLeft(initialSeconds);
    setIsPlaying(false);
    setIsAlmostDone(false);
    clearInterval(timerRef.current);
  }, [initialSeconds]);

  // 监控是否接近结束
  useEffect(() => {
    // 如果时间小于1分钟，显示警告
    if (timeLeft <= 60 && timeLeft > 0) {
      setIsAlmostDone(true);
    } else {
      setIsAlmostDone(false);
    }
  }, [timeLeft]);

  // 开始/暂停计时器
  const toggleTimer = () => {
    if (isPlaying) {
      clearInterval(timerRef.current);
    } else {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            if (onTimerEnd) onTimerEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    setIsPlaying(!isPlaying);
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // 格式化时间（分:秒）
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // 计算进度条百分比
  const progressPercent = Math.max(0, (timeLeft / initialSeconds) * 100);

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <Clock className={`mr-2 ${isAlmostDone ? 'text-red-500' : 'text-gray-500'}`} size={20} />
          <div className={`font-mono text-xl font-semibold ${isAlmostDone ? 'text-red-500' : 'text-gray-700'}`}>
            {formatTime(timeLeft)}
          </div>
          {isAlmostDone && (
            <div className="ml-2 text-red-500 flex items-center animate-pulse">
              <AlertCircle size={16} className="mr-1" />
              <span className="text-xs">即将结束</span>
            </div>
          )}
        </div>
        <button 
          onClick={toggleTimer}
          className={`rounded-full p-3 transition-all ${isPlaying 
            ? 'bg-pink-100 text-pink-500 hover:bg-pink-200' 
            : 'bg-blue-100 text-blue-500 hover:bg-blue-200'}`}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
      </div>

      {/* 进度条 */}
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${
            isAlmostDone 
              ? 'bg-red-500' 
              : 'bg-gradient-to-r from-blue-500 to-blue-400'
          }`}
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
      <div className="mt-1 flex justify-between text-xs text-gray-500">
        <span>{formatTime(timeLeft)} 剩余</span>
        <span>总计 {formatTime(initialSeconds)}</span>
      </div>
    </div>
  );
};

export default TimerControl;