"use client";

import React from 'react';
import { Calendar, HeartHandshake, MessageSquare, Heart, SkipForward } from 'lucide-react';
import TimerControl from '../TimerControl';
import StepScript from './StepScript';
import StepMusic from './StepMusic';

const ProgramStep = ({ 
  step, 
  currentStep,
  settings,
  resetKey,
  onPlayStateChange,
  onScriptEdit,
  isLastStep,
  onNextStep,
  nextStepName // 添加接收下一步名称的prop
}) => {
  // 获取当前环节的图标
  const getStepIcon = (stepName) => {
    const name = stepName?.toLowerCase() || '';
    if (name.includes('入场')) return <Calendar size={20} className="text-blue-500" />;
    if (name.includes('交换') || name.includes('戒指')) return <HeartHandshake size={20} className="text-pink-500" />;
    if (name.includes('致辞') || name.includes('宣言')) return <MessageSquare size={20} className="text-purple-500" />;
    // 默认图标
    return <Heart size={20} className="text-gray-500" />;
  };

  return (
    <div className="wedding-card card-shadow p-6 mb-8">
      <div className="flex items-center mb-4">
        <div className="bg-pink-100 p-2 rounded-full mr-3">
          {getStepIcon(step.name)}
        </div>
        <h2 className="text-2xl font-bold text-gray-800">
          {currentStep + 1}. {step.name}
        </h2>
      </div>
      
      <div className="mb-6">
        <TimerControl 
          initialSeconds={step.duration * 60 || 0} 
          onTimerEnd={() => {}}
          autoStart={settings.autoStartTimer}
          resetKey={resetKey}
        />
      </div>

      <StepScript 
        script={step.script} 
        onEdit={() => onScriptEdit(currentStep)} 
      />

      <StepMusic 
        step={step}
        settings={settings}
        onPlayStateChange={onPlayStateChange}
        resetKey={resetKey}
      />

      {!isLastStep ? (
        <button
          onClick={onNextStep}
          className="flex items-center justify-center w-full py-4 rounded-xl text-white font-bold text-lg transition-all duration-300 bg-gradient-to-r from-pink-500 to-blue-500 hover:shadow-lg hover:translate-y-px"
        >
          <SkipForward className="mr-2" />
          下一环节: {nextStepName || '下一步'}
        </button>
      ) : (
        <button
          disabled
          className="flex items-center justify-center w-full py-4 rounded-xl text-white font-bold text-lg bg-gray-300 cursor-not-allowed"
        >
          <SkipForward className="mr-2" />
          婚礼已结束
        </button>
      )}
    </div>
  );
};

export default ProgramStep;