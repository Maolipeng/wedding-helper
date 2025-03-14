"use client";

import React, { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

// 创建 Toast 上下文
const ToastContext = createContext(null);

// Toast 类型及其对应样式
const TOAST_TYPES = {
  success: {
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-500',
    icon: <CheckCircle className="text-green-500" size={20} />
  },
  error: {
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-500',
    icon: <AlertCircle className="text-red-500" size={20} />
  },
  info: {
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-500',
    icon: <Info className="text-blue-500" size={20} />
  }
};

// Toast 提供者组件
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // 添加新的 toast
  const addToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);
    
    return id; // 返回 ID，以便可以手动移除
  };

  // 移除特定 toast
  const removeToast = (id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  // 通过类型添加 toast 的快捷方式
  const toast = {
    success: (message, duration) => addToast(message, 'success', duration),
    error: (message, duration) => addToast(message, 'error', duration),
    info: (message, duration) => addToast(message, 'info', duration)
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// 使用 Toast 的钩子
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast 必须在 ToastProvider 内部使用');
  }
  return context;
};

// Toast 容器组件
const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2">
      {toasts.map(toast => (
        <Toast 
          key={toast.id} 
          toast={toast} 
          onClose={() => removeToast(toast.id)} 
        />
      ))}
    </div>
  );
};

// 单个 Toast 组件
const Toast = ({ toast, onClose }) => {
  const { id, message, type, duration } = toast;
  const { bgColor, textColor, borderColor, icon } = TOAST_TYPES[type] || TOAST_TYPES.info;

  // 自动关闭
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div 
      className={`flex items-center p-3 rounded-lg shadow-md ${bgColor} ${textColor} border-l-4 ${borderColor} min-w-[250px] max-w-xs animate-slideIn`}
      role="alert"
    >
      <div className="mr-3">
        {icon}
      </div>
      <div className="flex-grow text-sm">{message}</div>
      <button 
        onClick={onClose}
        className="ml-2 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

// 添加 CSS 动画
export const toastStyles = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .animate-slideIn {
    animation: slideIn 0.3s ease-out forwards;
  }
`;