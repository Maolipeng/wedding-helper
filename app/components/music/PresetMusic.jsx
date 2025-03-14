"use client";

import React from 'react';
import { Music, Folder } from 'lucide-react';

const PresetMusic = ({ presetMusicLibrary }) => {
  return (
    <div>
      <p className="text-sm text-gray-600 mb-4">
        预设音乐可以在"管理预设"标签中添加或修改
      </p>
      
      {presetMusicLibrary.length > 0 ? (
        <div className="mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {presetMusicLibrary.map((music, idx) => (
              <div key={music.id || idx} className="bg-white border border-gray-100 rounded-lg p-3 flex items-center shadow-sm hover:shadow-md transition-shadow">
                <div className={`rounded-full p-2 mr-3 ${
                  music.category ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Music className={`${
                    music.category ? 'text-blue-500' : 'text-gray-500'
                  }`} size={16} />
                </div>
                <div className="overflow-hidden">
                  <div className="font-medium truncate">{music.name}</div>
                  <div className="text-xs text-gray-500 truncate">{music.path}</div>
                  {music.category && (
                    <div className="text-xs text-blue-500 mt-1">
                      {music.category}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          <Folder size={40} className="mx-auto mb-4 opacity-20" />
          <p className="italic">未找到预设音乐</p>
          <p className="text-sm mt-2">请前往"管理预设"标签添加</p>
        </div>
      )}
    </div>
  );
};

export default PresetMusic;