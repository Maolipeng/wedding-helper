"use client";

import React from 'react';
import { MessageSquare, Edit } from 'lucide-react';

const StepScript = ({ script, onEdit }) => {
  return (
    <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-100">
      <div className="flex items-start">
        <MessageSquare className="text-pink-500 mt-1 mr-3 flex-shrink-0" />
        <div className="flex-grow">
          <div className="text-lg text-gray-700 leading-relaxed max-h-72 overflow-y-auto pr-2 whitespace-pre-wrap">
            {script}
          </div>
          <div className="mt-2 flex justify-end">
            <button
              onClick={onEdit}
              className="text-blue-500 hover:text-blue-700 flex items-center text-sm"
            >
              <Edit size={14} className="mr-1" />
              编辑台词
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepScript;