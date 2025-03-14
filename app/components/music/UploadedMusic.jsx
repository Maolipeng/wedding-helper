"use client";

import React from 'react';
import { Upload, Music, Trash2 } from 'lucide-react';

const UploadedMusic = ({ uploadedMusic, onUpload, onDelete }) => {
  return (
    <div>
      <div className="mb-6">
        <label className="block mb-3">
          <span className="inline-flex items-center bg-gradient-to-r from-pink-500 to-blue-500 text-white py-2 px-6 rounded-full cursor-pointer shadow-md hover:shadow-lg transition-all duration-200">
            <Upload className="mr-2" size={18} />
            上传本地音乐文件
          </span>
          <input 
            type="file" 
            accept="audio/*" 
            onChange={onUpload} 
            className="hidden" 
            multiple 
          />
        </label>
        <p className="text-sm text-gray-500">支持MP3, WAV等音频格式</p>
      </div>
      
      {uploadedMusic.length > 0 ? (
        <div className="mt-2">
          <h4 className="font-medium mb-3 text-gray-700">已上传的音乐：</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {uploadedMusic.map((music) => (
              <div key={music.id} className="bg-white border border-gray-100 rounded-lg p-3 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center overflow-hidden">
                  <div className="bg-pink-100 rounded-full p-2 mr-3 flex-shrink-0">
                    <Music className="text-pink-500" size={16} />
                  </div>
                  <span className="text-sm font-medium truncate">{music.name}</span>
                </div>
                <button 
                  onClick={() => onDelete(music.id)}
                  className="ml-2 text-gray-400 hover:text-red-500 flex-shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          <Music size={40} className="mx-auto mb-4 opacity-20" />
          <p className="italic">尚未上传任何音乐</p>
          <p className="text-sm mt-2">点击上方按钮添加</p>
        </div>
      )}
    </div>
  );
};

export default UploadedMusic;