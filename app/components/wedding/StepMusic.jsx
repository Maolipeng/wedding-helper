"use client";

import React from 'react';
import { Music } from 'lucide-react';
import MusicPlayer from '../MusicPlayer';

const StepMusic = ({ step, settings, onPlayStateChange, resetKey }) => {
  const hasMusic = step.music || step.musicSource;

  return (
    <div className="bg-blue-50 rounded-xl p-5 mb-6 border border-blue-100">
      <div className="flex items-center mb-3">
        <Music className="text-blue-500 mr-3" />
        <h3 className="font-semibold text-gray-800">
          音乐: <span className={step.music ? "" : "text-gray-400"}>
            {step.musicName || '无音乐'}
          </span>
        </h3>
      </div>
      
      {hasMusic ? (
        <div className="ml-8 mr-2">
          <MusicPlayer 
            musicSource={step.isPreset ? step.music : step.musicSource}
            isPreset={step.isPreset}
            onPlayStateChange={onPlayStateChange}
            autoPlay={settings.autoPlayMusic}
            resetKey={resetKey}
          />
          <div className="text-sm text-gray-500 mt-2">
            {settings.autoPlayMusic ? '切换环节时自动播放音乐' : '点击播放按钮控制音乐'}
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500 ml-8">
          此环节未设置音乐，请在自定义流程中添加
        </div>
      )}
    </div>
  );
};

export default StepMusic;