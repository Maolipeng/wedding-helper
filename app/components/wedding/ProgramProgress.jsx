"use client";

import React from 'react';

const ProgramProgress = ({ currentStep, totalSteps }) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;
  
  return (
    <div className="mb-8">
      <div className="bg-gray-100 h-2 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-pink-500 to-blue-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="mt-2 flex justify-between text-sm text-gray-500">
        <span>婚礼进行中</span>
        <span>{currentStep + 1} / {totalSteps}</span>
      </div>
    </div>
  );
};

export default ProgramProgress;