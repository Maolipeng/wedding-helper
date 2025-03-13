"use client";

import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const ScriptEditDialog = ({ 
  isOpen, 
  onClose, 
  script = '', 
  stepName = '',
  onSave 
}) => {
  const [editedScript, setEditedScript] = useState(script);
  
  // 当脚本内容改变时更新编辑框的内容
  useEffect(() => {
    setEditedScript(script);
  }, [script, isOpen]);
  
  // 如果对话框未显示，则不渲染内容
  if (!isOpen) return null;
  
  // 保存内容并关闭对话框
  const handleSave = () => {
    onSave(editedScript);
    onClose();
  };
  
  // 取消编辑
  const handleCancel = () => {
    setEditedScript(script); // 恢复原始内容
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold">
            编辑司仪台词: {stepName}
          </h3>
          <button 
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 flex-grow overflow-auto">
          <textarea
            value={editedScript}
            onChange={(e) => setEditedScript(e.target.value)}
            className="w-full h-64 p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-300 outline-none"
            placeholder="请输入司仪台词..."
          />
          
          <div className="mt-4">
            <h4 className="font-medium text-gray-700 mb-2">提示：</h4>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>在此处编辑完整的司仪台词内容</li>
              <li>可以添加提醒、注意事项或特殊指示</li>
              <li>按 Ctrl+Enter 快速保存</li>
            </ul>
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end space-x-3 bg-gray-50">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Save size={16} className="mr-2" />
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScriptEditDialog;