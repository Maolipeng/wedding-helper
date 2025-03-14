"use client";

import React, { useState } from 'react';
import { Music, Folder, Upload, Settings } from 'lucide-react';
import UploadedMusic from './UploadedMusic';
import PresetMusic from './PresetMusic';
import PresetMusicEditor from '../PresetMusicEditor';

const MusicLibrary = ({ 
  uploadedMusic, 
  presetMusicLibrary, 
  onMusicUpdate 
}) => {
  const [activeTab, setActiveTab] = useState('preset'); // 'preset', 'uploaded', 'manage'
  
  // 上传音乐文件处理
  const handleMusicUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    await onMusicUpdate.uploadedMusic.add(files);
  };
  
  // 删除上传的音乐处理
  const handleDeleteMusic = async (musicId) => {
    await onMusicUpdate.uploadedMusic.delete(musicId);
  };

  return (
    <div className="wedding-card card-shadow p-6 mb-8">
      <h3 className="font-bold text-xl mb-4 flex items-center">
        <Music className="mr-2 text-pink-500" />
        音乐库
      </h3>
      
      <div className="flex flex-wrap border-b border-gray-200 mb-6">
        <button 
          onClick={() => setActiveTab('preset')}
          className={`px-4 py-3 font-medium ${activeTab === 'preset' 
            ? 'border-b-2 border-pink-500 text-pink-500' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Folder className="inline-block mr-2" size={18} />
          预设音乐
        </button>
        <button 
          onClick={() => setActiveTab('uploaded')}
          className={`px-4 py-3 font-medium ${activeTab === 'uploaded' 
            ? 'border-b-2 border-pink-500 text-pink-500' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Upload className="inline-block mr-2" size={18} />
          上传音乐
        </button>
        <button 
          onClick={() => setActiveTab('manage')}
          className={`px-4 py-3 font-medium ${activeTab === 'manage' 
            ? 'border-b-2 border-pink-500 text-pink-500' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Settings className="inline-block mr-2" size={18} />
          管理预设
        </button>
      </div>
      
      {activeTab === 'uploaded' && (
        <UploadedMusic 
          uploadedMusic={uploadedMusic}
          onUpload={handleMusicUpload}
          onDelete={handleDeleteMusic}
        />
      )}
      
      {activeTab === 'preset' && (
        <PresetMusic 
          presetMusicLibrary={presetMusicLibrary}
        />
      )}
      
      {activeTab === 'manage' && (
        <PresetMusicEditor 
          presetList={presetMusicLibrary} 
          onUpdate={onMusicUpdate.presetMusic.update} 
        />
      )}
    </div>
  );
};

export default MusicLibrary;