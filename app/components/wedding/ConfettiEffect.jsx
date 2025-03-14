"use client";

import React from 'react';

const ConfettiEffect = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* 庆祝信息 */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-center">
        <div className="text-3xl font-bold text-pink-500 animate-bounce">
          祝贺! 婚礼圆满完成! 
        </div>
      </div>
      
      {/* 彩色纸屑动画 - 使用纯CSS实现 */}
      {Array.from({ length: 50 }).map((_, index) => {
        const size = Math.random() * 10 + 5;
        const leftPos = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = Math.random() * 3 + 2;
        const color = [
          'bg-pink-500', 'bg-blue-400', 'bg-green-400', 
          'bg-yellow-400', 'bg-purple-400', 'bg-red-400'
        ][Math.floor(Math.random() * 6)];
        
        return (
          <div
            key={index}
            className={`absolute ${color} rounded-sm opacity-70`}
            style={{
              left: `${leftPos}%`,
              top: '-10px',
              width: `${size}px`,
              height: `${size}px`,
              animation: `fall ${duration}s ease-in forwards ${delay}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        );
      })}
      
      {/* 添加CSS动画 */}
      <style jsx>{`
        @keyframes fall {
          0% {
            top: -10px;
            transform: translateX(0) rotate(0deg);
            opacity: 0.7;
          }
          50% {
            opacity: 1;
            transform: translateX(${Math.random() > 0.5 ? 100 : -100}px) rotate(${Math.random() * 360}deg);
          }
          100% {
            top: 100vh;
            opacity: 0.7;
            transform: translateX(${Math.random() > 0.5 ? 200 : -200}px) rotate(${Math.random() * 720}deg);
          }
        }
      `}</style>
    </div>
  );
};

export default ConfettiEffect;