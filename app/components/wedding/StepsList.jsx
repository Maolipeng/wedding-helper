"use client";

import React from 'react';
import { Music } from 'lucide-react';

const StepsList = ({ steps, currentStep, onStepSelect }) => {
  return (
    <div className="wedding-card card-shadow p-5 overflow-hidden mb-8">
      <h3 className="font-bold mb-4 text-gray-800">婚礼全程流程</h3>
      <div className="flex flex-nowrap overflow-x-auto pb-2 -mx-2">
        {steps.map((step, index) => (
          <div
            key={step.id}
            onClick={() => onStepSelect(index)}
            className={`flex-shrink-0 mx-2 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
              currentStep === index
                ? 'bg-pink-100 border-2 border-pink-500 shadow-md transform -translate-y-1'
                : 'bg-white border border-gray-200 hover:border-blue-200 hover:bg-blue-50'
            }`}
          >
            <div className="text-sm font-medium">{index + 1}. {step.name}</div>
            <div className="text-xs text-gray-500 mt-1">{step.duration}分钟</div>
            {(step.music || step.musicSource) && (
              <div className="text-xs text-blue-500 mt-1 flex items-center">
                <Music size={10} className="mr-1" />
                <span className="truncate max-w-48">{step.musicName}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepsList;