"use client";

import React, { useState } from 'react';
import { ChevronRight, CheckCircle2, Calendar, Cog, Plus } from 'lucide-react';
import MusicLibrary from '../music/MusicLibrary';
import StepItem from './StepItem';
import ScriptEditDialog from '../ScriptEditDialog';

const ProgramEditor = ({
  program,
  uploadedMusic,
  presetMusicLibrary,
  onProgramUpdate,
  onMusicUpdate,
  onSettingsOpen,
  onCancel
}) => {
  const [activeTab, setActiveTab] = useState('steps'); // 'steps', 'music'
  const [scriptDialogOpen, setScriptDialogOpen] = useState(false);
  const [currentEditingStep, setCurrentEditingStep] = useState(null);
  
  // 添加新环节
  const addNewStep = () => {
    // 生成新的环节ID
    const maxId = Math.max(0, ...program.map(step => step.id));
    const newId = maxId + 1;
    
    const newStep = {
      id: newId,
      name: '新环节',
      script: '请在此输入司仪台词',
      music: '',
      musicSource: '',
      musicName: '请选择音乐',
      isPreset: false,
      duration: 5
    };
    
    // 添加到现有程序末尾
    onProgramUpdate([...program, newStep]);
  };
  
  // 删除环节
  const deleteStep = (index) => {
    if (program.length <= 1) {
      alert('至少保留一个环节');
      return;
    }

    const updatedProgram = [...program];
    updatedProgram.splice(index, 1);
    onProgramUpdate(updatedProgram);
  };

  // 上移环节
  const moveStepUp = (index) => {
    if (index === 0) return; // 已经是第一个
    
    const updatedProgram = [...program];
    const temp = updatedProgram[index];
    updatedProgram[index] = updatedProgram[index - 1];
    updatedProgram[index - 1] = temp;
    
    onProgramUpdate(updatedProgram);
  };

  // 下移环节
  const moveStepDown = (index) => {
    if (index === program.length - 1) return; // 已经是最后一个
    
    const updatedProgram = [...program];
    const temp = updatedProgram[index];
    updatedProgram[index] = updatedProgram[index + 1];
    updatedProgram[index + 1] = temp;
    
    onProgramUpdate(updatedProgram);
  };

  // 更新环节字段
  const updateStepField = (index, field, value) => {
    const updatedProgram = [...program];
    updatedProgram[index] = {
      ...updatedProgram[index],
      [field]: value
    };
    onProgramUpdate(updatedProgram);
  };

  // 为环节选择音乐
  const selectMusicForStep = (index, musicSource, musicName, musicPath, isPreset) => {
    const updatedProgram = [...program];
    updatedProgram[index] = {
      ...updatedProgram[index],
      music: musicPath,
      musicSource: musicSource,
      musicName: musicName,
      isPreset: isPreset
    };
    onProgramUpdate(updatedProgram);
  };
  
  // 打开司仪台词编辑对话框
  const handleOpenScriptDialog = (index) => {
    setCurrentEditingStep(index);
    setScriptDialogOpen(true);
  };
  
  // 保存司仪台词
  const handleSaveScript = (newScript) => {
    if (currentEditingStep !== null) {
      updateStepField(currentEditingStep, 'script', newScript);
    }
    setScriptDialogOpen(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 overflow-auto">
      <div className="flex items-center mb-6">
        <div className="mr-3 hidden md:block">
          <button 
            onClick={onCancel} 
            className="bg-white rounded-full p-2 shadow-md text-gray-600 hover:text-pink-500"
            title="返回"
          >
            <ChevronRight className="transform rotate-180" size={20} />
          </button>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold gradient-text">自定义婚礼流程</h2>
      </div>
      
      {/* 标签页切换 */}
      <div className="mb-4 border-b border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('steps')}
            className={`py-2 px-4 font-medium ${
              activeTab === 'steps' 
                ? 'border-b-2 border-pink-500 text-pink-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="inline-block mr-2" size={18} />
            婚礼环节
          </button>
          <button
            onClick={() => setActiveTab('music')}
            className={`py-2 px-4 font-medium ${
              activeTab === 'music' 
                ? 'border-b-2 border-pink-500 text-pink-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            音乐库
          </button>
        </div>
      </div>
      
      {activeTab === 'steps' ? (
        <div className="wedding-card card-shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl flex items-center">
              <Calendar className="mr-2 text-blue-500" />
              婚礼流程环节
            </h3>
            <div className="flex space-x-3">
              <button
                onClick={onSettingsOpen}
                className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-full transition-all duration-200"
              >
                <Cog size={18} className="mr-1" />
                设置
              </button>
              <button 
                onClick={addNewStep}
                className="flex items-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-full shadow-md transition-all duration-200"
              >
                <Plus size={18} className="mr-1" />
                添加环节
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {program.map((step, index) => (
              <StepItem 
                key={step.id}
                step={step}
                index={index}
                isFirst={index === 0}
                isLast={index === program.length - 1}
                onDelete={() => deleteStep(index)}
                onMoveUp={() => moveStepUp(index)}
                onMoveDown={() => moveStepDown(index)}
                onUpdateField={(field, value) => updateStepField(index, field, value)}
                onSelectMusic={(musicSource, musicName, musicPath, isPreset) => 
                  selectMusicForStep(index, musicSource, musicName, musicPath, isPreset)
                }
                onEditScript={() => handleOpenScriptDialog(index)}
                presetMusicLibrary={presetMusicLibrary}
                uploadedMusic={uploadedMusic}
              />
            ))}
          </div>
        </div>
      ) : (
        <MusicLibrary 
          uploadedMusic={uploadedMusic}
          presetMusicLibrary={presetMusicLibrary}
          onMusicUpdate={onMusicUpdate}
        />
      )}
      
      <div className="flex justify-end mb-8">
        <button
          onClick={onCancel}
          className="flex items-center bg-gradient-to-r from-pink-500 to-blue-500 text-white py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
        >
          <CheckCircle2 className="mr-2" size={20} />
          保存并返回
        </button>
      </div>
      
      {/* 司仪台词编辑对话框 */}
      <ScriptEditDialog
        isOpen={scriptDialogOpen}
        onClose={() => setScriptDialogOpen(false)}
        script={currentEditingStep !== null ? program[currentEditingStep]?.script : ''}
        stepName={currentEditingStep !== null ? program[currentEditingStep]?.name : ''}
        onSave={handleSaveScript}
      />
    </div>
  );
};

export default ProgramEditor;