"use client";

import React from 'react';
import { MoveUp, MoveDown, Trash2, Maximize2, Music } from 'lucide-react';

const StepItem = ({
  step,
  index,
  isFirst,
  isLast,
  onDelete,
  onMoveUp,
  onMoveDown,
  onUpdateField,
  onSelectMusic,
  onEditScript, // 新增：打开司仪台词编辑的函数
  presetMusicLibrary,
  uploadedMusic
}) => {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow transition-shadow">
      <div className="flex flex-col md:flex-row gap-4">
        {/* 操作按钮组 - 在手机上显示在顶部 */}
        <div className="flex md:flex-col justify-start space-x-2 md:space-x-0 md:space-y-2 order-1 md:order-none">
          <button 
            onClick={onMoveUp}
            disabled={isFirst}
            className={`p-1.5 rounded-full ${isFirst
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
              : 'bg-blue-50 text-blue-500 hover:bg-blue-100'}`}
            title="上移"
          >
            <MoveUp size={16} />
          </button>
          <button 
            onClick={onMoveDown}
            disabled={isLast}
            className={`p-1.5 rounded-full ${isLast
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
              : 'bg-blue-50 text-blue-500 hover:bg-blue-100'}`}
            title="下移"
          >
            <MoveDown size={16} />
          </button>
          <button 
            onClick={onDelete}
            className="p-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100"
            title="删除"
          >
            <Trash2 size={16} />
          </button>
        </div>
        
        {/* 环节信息 */}
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 第一列：环节名称和司仪台词 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                环节名称
              </label>
              <input
                type="text"
                value={step.name}
                onChange={(e) => onUpdateField('name', e.target.value)}
                className="w-full p-2 border rounded-lg"
                placeholder="环节名称"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                司仪台词
              </label>
              <div className="relative">
                <div className="border rounded-lg p-3 bg-gray-50 min-h-[100px] max-h-[150px] overflow-y-auto whitespace-pre-wrap mb-2">
                  {step.script || <span className="text-gray-400">暂无台词内容</span>}
                </div>
                <button
                  onClick={onEditScript} // 现在调用传入的编辑函数
                  className="text-blue-500 hover:text-blue-700 flex items-center text-sm"
                >
                  <Maximize2 size={14} className="mr-1" />
                  展开编辑台词
                </button>
              </div>
            </div>
          </div>
          
          {/* 第二列：音乐选择和时长 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                音乐选择
              </label>
              <select
                value=""
                onChange={(e) => {
                  // 解析选项值：source:index 格式
                  const [source, idxStr] = e.target.value.split(':');
                  const idx = idxStr;
                  
                  let selectedMusic;
                  if (source === 'preset') {
                    selectedMusic = presetMusicLibrary[idx];
                    if (selectedMusic) {
                      onSelectMusic(
                        idx, 
                        selectedMusic.name, 
                        selectedMusic.path, 
                        true
                      );
                    }
                  } else if (source === 'uploaded') {
                    selectedMusic = uploadedMusic.find(m => m.id === idx);
                    if (selectedMusic) {
                      onSelectMusic(
                        selectedMusic.id, 
                        selectedMusic.name, 
                        '', 
                        false
                      );
                    }
                  }
                }}
                className="w-full p-2 border rounded-lg mb-2"
              >
                <option value="">选择音乐</option>
                {presetMusicLibrary.length > 0 && (
                  <optgroup label="预设音乐">
                    {presetMusicLibrary.map((music, idx) => (
                      <option key={`preset:${idx}`} value={`preset:${idx}`}>
                        {music.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {uploadedMusic.length > 0 && (
                  <optgroup label="已上传音乐">
                    {uploadedMusic.map((music) => (
                      <option key={`uploaded:${music.id}`} value={`uploaded:${music.id}`}>
                        {music.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-gray-700">
                  当前: <span className={step.music ? "text-blue-500" : "text-gray-400"}>
                    {step.musicName || '无音乐'}
                  </span>
                </div>
                {step.music && (
                  <button
                    onClick={() => onSelectMusic('', '无音乐', '', false)}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    移除音乐
                  </button>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                环节时长 (分钟)
              </label>
              <input
                type="number"
                value={step.duration}
                onChange={(e) => onUpdateField('duration', parseInt(e.target.value) || 1)}
                className="w-full p-2 border rounded-lg"
                min="1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepItem;