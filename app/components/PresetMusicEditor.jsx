"use client";

import React, { useState } from 'react';
import { Music, Save, X, Edit2, Trash2, Plus, Check } from 'lucide-react';
import { 
  addPresetMusic, 
  updatePresetMusic, 
  deletePresetMusic 
} from '../lib/presetMusicStorage';

const PresetMusicEditor = ({ presetList, onUpdate }) => {
  const [editing, setEditing] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newMusic, setNewMusic] = useState({ name: '', path: '', category: '' });
  const [editMusic, setEditMusic] = useState({});
  const [error, setError] = useState('');

  // 添加新音乐
  const handleAddMusic = () => {
    try {
      if (!newMusic.name.trim() || !newMusic.path.trim()) {
        setError('音乐名称和路径不能为空');
        return;
      }
      
      // 确保路径以/audio/开头
      let path = newMusic.path.trim();
      if (!path.startsWith('/')) {
        path = '/' + path;
      }
      if (!path.startsWith('/audio/')) {
        path = '/audio/' + path.replace(/^\//, '');
      }
      
      const musicToAdd = {
        ...newMusic,
        name: newMusic.name.trim(),
        path: path,
        category: newMusic.category.trim() || '未分类'
      };
      
      const updatedList = addPresetMusic(presetList, musicToAdd);
      onUpdate(updatedList);
      setNewMusic({ name: '', path: '', category: '' });
      setIsAdding(false);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  // 更新音乐
  const handleUpdateMusic = () => {
    try {
      if (!editMusic.name.trim() || !editMusic.path.trim()) {
        setError('音乐名称和路径不能为空');
        return;
      }
      
      // 确保路径以/audio/开头
      let path = editMusic.path.trim();
      if (!path.startsWith('/')) {
        path = '/' + path;
      }
      if (!path.startsWith('/audio/')) {
        path = '/audio/' + path.replace(/^\//, '');
      }
      
      const musicToUpdate = {
        ...editMusic,
        name: editMusic.name.trim(),
        path: path,
        category: editMusic.category.trim() || '未分类'
      };
      
      const updatedList = updatePresetMusic(presetList, editing, musicToUpdate);
      onUpdate(updatedList);
      setEditing(null);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  // 删除音乐
  const handleDeleteMusic = (musicId) => {
    try {
      if (window.confirm('确定要删除这个预设音乐吗？')) {
        const updatedList = deletePresetMusic(presetList, musicId);
        onUpdate(updatedList);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // 开始编辑音乐
  const startEditing = (music) => {
    setEditing(music.id);
    setEditMusic({ ...music });
  };

  // 取消编辑
  const cancelEditing = () => {
    setEditing(null);
    setError('');
  };

  // 取消添加
  const cancelAdding = () => {
    setIsAdding(false);
    setNewMusic({ name: '', path: '', category: '' });
    setError('');
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <h3 className="font-bold text-xl mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <Music className="mr-2 text-blue-500" />
          预设音乐管理
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 py-1 px-3 rounded-full transition-colors"
          disabled={isAdding}
        >
          <Plus size={16} className="mr-1" />
          添加音乐
        </button>
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-lg flex items-center">
          <X size={16} className="mr-2" />
          {error}
        </div>
      )}

      {isAdding && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h4 className="font-medium text-blue-700 mb-3">添加新音乐</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                音乐名称 *
              </label>
              <input
                type="text"
                value={newMusic.name}
                onChange={(e) => setNewMusic({ ...newMusic, name: e.target.value })}
                placeholder="例如：婚礼进行曲"
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                音乐路径 *
              </label>
              <input
                type="text"
                value={newMusic.path}
                onChange={(e) => setNewMusic({ ...newMusic, path: e.target.value })}
                placeholder="例如：/audio/wedding-march.mp3"
                className="w-full p-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                路径应指向public目录下的音频文件
              </p>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分类
            </label>
            <input
              type="text"
              value={newMusic.category}
              onChange={(e) => setNewMusic({ ...newMusic, category: e.target.value })}
              placeholder="例如：仪式、背景音乐(可选)"
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={cancelAdding}
              className="py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleAddMusic}
              className="flex items-center py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save size={16} className="mr-2" />
              保存
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {presetList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Music size={40} className="mx-auto mb-4 opacity-20" />
            <p>当前没有预设音乐</p>
            <p className="text-sm mt-2">点击"添加音乐"按钮来创建</p>
          </div>
        ) : (
          presetList.map((music) => (
            <div 
              key={music.id || music.path} 
              className={`border rounded-lg p-3 ${
                editing === music.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100 hover:border-gray-200'
              }`}
            >
              {editing === music.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        音乐名称
                      </label>
                      <input
                        type="text"
                        value={editMusic.name}
                        onChange={(e) => setEditMusic({ ...editMusic, name: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        音乐路径
                      </label>
                      <input
                        type="text"
                        value={editMusic.path}
                        onChange={(e) => setEditMusic({ ...editMusic, path: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      分类
                    </label>
                    <input
                      type="text"
                      value={editMusic.category}
                      onChange={(e) => setEditMusic({ ...editMusic, category: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={cancelEditing}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      <X size={18} />
                    </button>
                    <button
                      onClick={handleUpdateMusic}
                      className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-lg"
                    >
                      <Check size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center overflow-hidden">
                    <div className={`rounded-full p-2 mr-3 flex-shrink-0 ${
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
                  <div className="flex space-x-2 ml-2">
                    <button
                      onClick={() => startEditing(music)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="编辑"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteMusic(music.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PresetMusicEditor;