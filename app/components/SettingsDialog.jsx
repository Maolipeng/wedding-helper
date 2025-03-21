"use client";

import React, { useState } from 'react';
import { X, Save, Music, Clock, Settings, Database, RefreshCw, Link as LinkIcon } from 'lucide-react';

const SettingsDialog = ({ 
  isOpen, 
  onClose, 
  settings, 
  onSave,
  onSyncNow // 新增立即同步回调函数
}) => {
  const [tempSettings, setTempSettings] = React.useState({ ...settings });
  const [isSyncing, setIsSyncing] = useState(false); // 添加同步状态
  
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
  
  // 处理立即同步按钮点击
  const handleSyncNow = async () => {
    if (!tempSettings.enableCloudSync) {
      // 如果云同步未启用，提示用户
      alert('请先启用云端同步功能');
      return;
    }
    
    setIsSyncing(true);
    try {
      await onSyncNow();
      // 同步成功后延迟一下再取消加载状态，提供更好的视觉反馈
      setTimeout(() => setIsSyncing(false), 500);
    } catch (error) {
      setIsSyncing(false);
    }
  };
  
  // 处理分享用户ID
  const handleShareUserId = () => {
    const userId = localStorage.getItem('wedding_client_id');
    if (!userId) return;
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?userId=${userId}`;
    
    // 复制链接到剪贴板
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        alert('链接已复制到剪贴板，发送给其他设备以同步数据！');
      })
      .catch(err => {
        console.error('无法复制链接:', err);
        alert('请手动复制此链接: ' + shareUrl);
      });
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
            
            {/* 云端同步设置 */}
            <h4 className="font-medium text-gray-700 mb-3 pt-2 border-t border-gray-100">云端存储设置</h4>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center">
                <Database className="text-purple-500 mr-3" size={18} />
                <div>
                  <div className="font-medium">启用云端同步</div>
                  <div className="text-sm text-gray-500">将您的婚礼数据备份至云端</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={tempSettings.enableCloudSync}
                  onChange={(e) => setTempSettings({
                    ...tempSettings,
                    enableCloudSync: e.target.checked
                  })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>
            
            {/* 立即同步按钮 */}
            {tempSettings.enableCloudSync && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <p>立即将本地数据同步到云端</p>
                  </div>
                  <button
                    onClick={handleSyncNow}
                    disabled={isSyncing}
                    className={`flex items-center rounded-full px-3 py-1 text-sm ${
                      isSyncing 
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                  >
                    <RefreshCw size={14} className={`mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? '同步中...' : '立即同步'}
                  </button>
                </div>
                
                <div className="mt-3 text-xs text-gray-500">
                  <ul className="list-disc list-inside space-y-1">
                    <li>云端同步将保存婚礼流程和设置</li>
                    <li>音乐裁剪设置也会被同步</li>
                    <li>预设音乐库将被同步</li>
                    <li>上传的音乐文件仍保存在本地</li>
                  </ul>
                </div>
              </div>
            )}
            
            {/* 云端同步设置 - 用户ID共享部分 */}
            {tempSettings.enableCloudSync && (
              <div className="p-3 bg-indigo-50 rounded-lg mt-3">
                <h5 className="font-medium text-indigo-700 mb-2">多设备同步</h5>
                <p className="text-sm text-gray-600 mb-3">
                  要在其他设备上同步数据，请分享下方链接。打开链接后，其他设备将使用相同的云端数据。
                </p>
                <button
                  onClick={handleShareUserId}
                  className="w-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 py-2 px-3 rounded-lg text-sm flex items-center justify-center"
                >
                  <LinkIcon size={14} className="mr-2" />
                  复制设备同步链接
                </button>
              </div>
            )}
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