"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Sparkles } from 'lucide-react';
// 引入 Tauri API
import { invoke } from '@tauri-apps/api/core';

const ScriptEditDialog = ({ 
  isOpen, 
  onClose, 
  script = '', 
  stepName = '',
  onSave 
}) => {
  const [editedScript, setEditedScript] = useState(script);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  
  // 当脚本内容改变时更新编辑框的内容
  useEffect(() => {
    setEditedScript(script);
    setAiSuggestion('');
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
    setAiSuggestion('');
    onClose();
  };

  // 分析环节类型
  const getStepType = (stepName) => {
    const stepTypes = {
      entrance: ['入场', '到场', '迎宾'],
      exchange: ['交换', '戒指', '宣誓'],
      speech: ['致辞', '讲话', '宣言', '感言'],
      toast: ['敬酒', '干杯'],
      cake: ['蛋糕', '切蛋糕'],
      bouquet: ['抛花', '花球'],
      ending: ['结束', '完成', '谢幕']
    };
    
    // 确定环节类型
    let stepType = 'general';
    for (const [type, keywords] of Object.entries(stepTypes)) {
      if (keywords.some(keyword => stepName.includes(keyword))) {
        stepType = type;
        break;
      }
    }
    
    return stepType;
  };

  // 使用 Tauri 命令调用 DeepSeek API
  const generateWithTauriCommand = async (prompt) => {
    try {
      // 调用在 Rust 端定义的 generate_script 命令
      const generatedContent = await invoke('generate_script', { prompt });
      return generatedContent;
    } catch (error) {
      console.error('Tauri 命令调用失败:', error);
      throw new Error(`AI 生成遇到问题: ${error}`);
    }
  };
  
  // 处理AI辅助
  const handleAiHelp = async () => {
    setIsAiProcessing(true);
    
    try {
      // 获取当前环节类型
      const stepType = getStepType(stepName);
      
      // 构建提示词
      let prompt = '';
      if (!editedScript.trim()) {
        // 生成新台词的提示词
        prompt = `请为婚礼上的"${stepName}"环节撰写一段司仪台词。这是${getChineseStepType(stepType)}环节，需要你写一段约150-200字的正式、热情且符合中国婚礼氛围的台词。`;
      } else {
        // 增强现有台词的提示词
        prompt = `这是一段婚礼"${stepName}"环节的司仪台词，请在保留原内容的基础上改写或完善，使其更加优美、流畅且符合婚礼场合：\n\n${editedScript}`;
      }
      
      // 调用 Tauri 命令
      const generatedText = await generateWithTauriCommand(prompt);
      setAiSuggestion(generatedText);
    } catch (error) {
      console.error('AI生成失败:', error);
      alert('AI生成遇到问题: ' + error.message);
      
      // 使用备选内容
      const fallbackContent = generateFallbackScript(editedScript, stepName);
      setAiSuggestion(fallbackContent);
    } finally {
      setIsAiProcessing(false);
    }
  };
  
  // 获取中文环节类型描述
  const getChineseStepType = (type) => {
    const typeMap = {
      entrance: '入场',
      exchange: '交换戒指',
      speech: '致辞',
      toast: '敬酒',
      cake: '切蛋糕',
      bouquet: '抛花球',
      ending: '结束',
      general: '一般'
    };
    return typeMap[type] || '婚礼';
  };

  // 应用AI建议
  const applyAiSuggestion = () => {
    setEditedScript(aiSuggestion);
    setAiSuggestion('');
  };
  
  // 忽略AI建议
  const dismissAiSuggestion = () => {
    setAiSuggestion('');
  };
  
  // 本地备选生成函数 - 当API请求失败时使用
  const generateFallbackScript = (currentScript, stepName) => {
    const stepType = getStepType(stepName);
    
    // 如果脚本为空，根据环节类型生成基础脚本
    if (!currentScript.trim()) {
      switch (stepType) {
        case 'entrance':
          return `尊敬的各位来宾，非常感谢您在百忙之中抽空参加我们的婚礼。\n\n现在我们即将迎来${stepName}环节，请大家以热烈的掌声欢迎！这是今天最重要的时刻之一，让我们共同见证这感人的瞬间。`;
        
        case 'exchange':
          return `各位来宾，我们现在进入${stepName}环节。\n\n戒指是爱情的象征，代表着圆满、完整和永恒。从今天开始，这对新人将戴上彼此赠予的戒指，象征着他们的爱情将如同这戒指一般，没有尽头。让我们共同见证这神圣的一刻。`;
        
        case 'speech':
          return `亲爱的各位来宾，现在有请新人发表他们的爱情宣言和感言。\n\n在这个特别的日子里，新人想要表达对彼此的爱意，以及对在座各位的感谢。请大家安静，倾听他们的心声。`;
        
        case 'toast':
          return `各位尊敬的来宾，现在我们进入敬酒环节。\n\n新人将向各位来宾敬酒，表达他们的感谢之情。请大家准备好您的酒杯，共同举杯，祝福这对新人！干杯！`;
        
        case 'cake':
          return `女士们、先生们，现在我们进入甜蜜的蛋糕环节。\n\n蛋糕象征着甜蜜和美好，请新人一起切下这第一刀，预示着他们未来的生活将如同这蛋糕一样甜美。大家准备好相机，记录下这美好的瞬间！`;
        
        case 'bouquet':
          return `现在是浪漫的抛花球环节！请所有未婚的女士们来到舞台中央。\n\n传说接住花球的人将是下一个幸运的新娘。准备好了吗？新娘将在倒数后抛出花球。三、二、一！`;
        
        case 'ending':
          return `尊敬的各位来宾，我们的婚礼仪式已接近尾声。\n\n衷心感谢大家的光临和祝福，感谢您们与新人共同度过这难忘的时刻。婚礼虽然结束，但新人的爱情故事才刚刚开始。请继续享用美食，祝各位宾客生活愉快！`;
        
        default:
          return `尊敬的各位来宾，感谢您的到来。\n\n我们现在进入${stepName}环节。这是新人婚礼中的重要时刻，让我们一起见证并祝福他们。`;
      }
    }
    
    // 如果已有脚本，则增强它
    const enhancements = {
      entrance: `\n\n补充建议：\n欢迎各位来宾的到来，您的参与使这一天更加完美。今天是新人人生的重要里程碑，让我们共同见证他们迈向幸福的一步。请保持热烈的掌声，让喜悦洋溢在每个角落！`,
      
      exchange: `\n\n补充建议：\n这一刻所代表的不仅是戒指的交换，更是心与心的交汇。戒指象征着无尽的循环，正如新人的爱情，没有终点。请大家屏息静气，见证这神圣而美好的承诺时刻。`,
      
      speech: `\n\n补充建议：\n在这个充满爱意的场合，新人想要表达对生命中每个人的感激之情。他们的每一句话都承载着深深的情感，请大家以热烈的掌声鼓励他们。`,
      
      toast: `\n\n补充建议：\n举杯共饮，是中国传统婚礼中最具代表性的环节之一。这一杯酒不仅寓意着感谢，更象征着新人与各位来宾情谊的延续。让我们共同举杯，祝福新人百年好合，永结同心！`,
      
      cake: `\n\n补充建议：\n婚礼蛋糕的每一层都寓意着不同的祝福。最上层代表着新人的爱情之巅，而整个蛋糕则象征着他们将共同品尝生活的甜蜜和挑战。请新人一起切下第一刀，共同品尝这份甜蜜。`,
      
      bouquet: `\n\n补充建议：\n抛花球是西方婚礼中的传统环节，充满了欢乐和期待。花球代表着幸福的传递，谁接住了花球，谁就可能是下一个走进婚姻殿堂的幸运儿。准备好相机，记录下这精彩的瞬间！`,
      
      ending: `\n\n补充建议：\n虽然婚礼仪式即将结束，但新人的爱情故事才刚刚翻开新的篇章。感谢各位来宾的祝福和见证，您们的到来是对新人最好的礼物。请继续留下享用美食，分享这份喜悦。祝愿各位宾客平安喜乐，期待下次相聚！`,
      
      general: `\n\n补充建议：\n亲爱的来宾们，感谢您们在百忙之中抽空前来参加我们的婚礼。您的到来让这一天变得更加完美和难忘。让我们一起，为新人送上最诚挚的祝福，愿他们的爱情之路充满阳光和欢笑。`
    };
    
    return `${currentScript}${enhancements[stepType]}`;
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
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              台词内容
            </label>
            <button
              onClick={handleAiHelp}
              disabled={isAiProcessing}
              className={`flex items-center text-sm px-3 py-1.5 rounded-full transition-all ${
                isAiProcessing 
                  ? 'bg-gray-100 text-gray-400 cursor-wait' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
              title="通过DeepSeek-V3模型生成台词"
            >
              <Sparkles size={16} className="mr-1.5" />
              {isAiProcessing ? '思考中...' : 'AI帮我写'}
            </button>
          </div>
          
          <textarea
            value={editedScript}
            onChange={(e) => setEditedScript(e.target.value)}
            className="w-full h-64 p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-300 outline-none"
            placeholder="请输入司仪台词..."
          />
          
          {aiSuggestion && (
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-blue-600 flex items-center">
                  <Sparkles size={16} className="mr-1.5" />
                  DeepSeek-V3 AI建议的台词
                </h4>
                <div className="flex space-x-2">
                  <button 
                    onClick={dismissAiSuggestion}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    忽略
                  </button>
                  <button 
                    onClick={applyAiSuggestion}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    应用此建议
                  </button>
                  <button
                    onClick={handleAiHelp}
                    disabled={isAiProcessing}
                    className={`text-sm text-pink-600 hover:text-pink-800 ${isAiProcessing ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    重新生成
                  </button>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 whitespace-pre-wrap">
                {aiSuggestion}
              </div>
            </div>
          )}
          
          <div className="mt-4">
            <h4 className="font-medium text-gray-700 mb-2">提示：</h4>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>在此处编辑完整的司仪台词内容</li>
              <li>可以添加提醒、注意事项或特殊指示</li>
              <li>点击"AI帮我写"按钮，使用DeepSeek模型获取智能建议</li>
              <li>需要在Tauri应用的.env文件中配置DEEPSEEK_API_KEY</li>
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