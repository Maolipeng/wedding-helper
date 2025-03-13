"use client";

import React from 'react';
import { X, Save, Music, Clock, Settings } from 'lucide-react';

const SettingsDialog = ({ 
  isOpen, 
  onClose, 
  settings, 
  onSave 
}) => {
  const [tempSettings, setTempSettings] = React.useState({ ...settings });
  
  // 重置设置为当前值
  React.useEffect(() => {
    if (isOpen) {
      setTempSettings({ ...settings });
    }
  }, [isOpen, settings]);
  
  if (!isOpen) return null;
  
  const handleSave = () => {
    onSave(tempSettings);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold flex items-center">
            <Settings className="mr-2 text-gray-600" size={18} />
            婚礼助手设置
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5">
          <div className="space-y-5">
            <h4 className="font-medium text-gray-700 mb-3">自动化设置</h4>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <Music className="text-blue-600 mr-3" size={18} />
                <div>
                  <div className="font-medium">自动播放音乐</div>
                  <div className="text-sm text-gray-500">切换环节时自动播放该环节的音乐</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={tempSettings.autoPlayMusic}
                  onChange={(e) => setTempSettings({
                    ...tempSettings,
                    autoPlayMusic: e.target.checked
                  })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
              <div className="flex items-center">
                <Clock className="text-pink-500 mr-3" size={18} />
                <div>
                  <div className="font-medium">自动开始计时</div>
                  <div className="text-sm text-gray-500">切换环节时自动开始倒计时</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={tempSettings.autoStartTimer}
                  onChange={(e) => setTempSettings({
                    ...tempSettings,
                    autoStartTimer: e.target.checked
                  })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
              </label>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end space-x-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-lg hover:shadow-md flex items-center"
          >
            <Save size={16} className="mr-2" />
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;