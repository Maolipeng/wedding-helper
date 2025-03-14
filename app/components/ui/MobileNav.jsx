"use client";

import React from 'react';
import { Cog, Menu, X, Edit, ArrowLeft, RotateCcw } from 'lucide-react';

const MobileNav = ({ 
  isCustomizing, 
  onToggleCustomize, 
  onOpenSettings,
  onResetData // 新增: 重置数据函数
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  
  const toggleMenu = () => setMenuOpen(!menuOpen);
  
  const handleCustomizeClick = () => {
    toggleMenu();
    onToggleCustomize();
  };
  
  const handleSettingsClick = () => {
    toggleMenu();
    onOpenSettings();
  };
  
  const handleResetClick = () => {
    toggleMenu();
    onResetData();
  };
  
  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-30 bg-white shadow-sm p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold gradient-text">
            {isCustomizing ? '自定义婚礼流程' : '婚礼助手'}
          </h1>
          
          {isCustomizing ? (
            <button 
              onClick={onToggleCustomize}
              className="p-2 rounded-full bg-gray-100 text-gray-600"
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <button 
              onClick={toggleMenu}
              className="p-2 rounded-full bg-gray-100 text-gray-600"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </header>
      
      {/* Mobile Menu */}
      {menuOpen && !isCustomizing && (
        <div className="md:hidden fixed inset-0 z-20 bg-black bg-opacity-50" onClick={toggleMenu}>
          <div 
            className="absolute right-0 top-16 bg-white w-64 h-screen shadow-lg p-4"
            onClick={e => e.stopPropagation()}  
          >
            <ul className="space-y-2">
              <li>
                <button
                  onClick={handleCustomizeClick}
                  className="w-full py-3 px-4 flex items-center text-left rounded-lg hover:bg-gray-100"
                >
                  <Edit size={18} className="mr-3 text-blue-500" />
                  <span>自定义流程与音乐</span>
                </button>
              </li>
              <li>
                <button
                  onClick={handleSettingsClick}
                  className="w-full py-3 px-4 flex items-center text-left rounded-lg hover:bg-gray-100"
                >
                  <Cog size={18} className="mr-3 text-gray-600" />
                  <span>设置</span>
                </button>
              </li>
              <li>
                <button
                  onClick={handleResetClick}
                  className="w-full py-3 px-4 flex items-center text-left rounded-lg hover:bg-gray-100"
                >
                  <RotateCcw size={18} className="mr-3 text-red-500" />
                  <span>重置所有数据</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNav;