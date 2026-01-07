import React, { useState } from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, ShoppingCart, Truck, LogOut, Sofa, Store } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const menuItems = [
    {
      id: 'supplier',
      label: 'پنل تولیدی (تامین‌کننده)',
      icon: <Truck size={20} />,
      view: 'supplier' as ViewState,
    },
    {
      id: 'store',
      label: 'پنل نمایشگاه (فروشگاه)',
      icon: <Store size={20} />,
      view: 'store' as ViewState,
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-black text-white flex flex-col md:h-[calc(100vh-5rem)] shadow-2xl transition-all border-l border-gray-900">
      <div className="p-6 border-b border-gray-900">
        <h2 className="text-lg font-black flex items-center gap-2 text-white">
          <Sofa className="text-primary" />
          <span>منوی مدیریت</span>
        </h2>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.view)}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-300 ${
              currentView === item.view
                ? 'bg-primary text-white shadow-lg shadow-yellow-900/20 font-bold'
                : 'text-gray-400 hover:bg-gray-900 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-900">
        <button 
            onClick={() => onChangeView('landing')}
            className="w-full flex items-center gap-2 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-900 rounded-xl transition-colors font-bold text-sm"
        >
          <LogOut size={18} />
          <span>خروج / صفحه نخست</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;