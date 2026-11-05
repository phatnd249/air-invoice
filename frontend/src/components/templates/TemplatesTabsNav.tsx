import React from 'react';
import { FileText, MessageSquare, Mail, Sparkles } from 'lucide-react';
import { TemplateTabType } from './types';

interface TemplatesTabsNavProps {
  activeTab: TemplateTabType;
  onTabChange: (tab: TemplateTabType) => void;
}

export function TemplatesTabsNav({ activeTab, onTabChange }: TemplatesTabsNavProps) {
  return (
    <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
      <button
        onClick={() => onTabChange('a4')}
        className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
          activeTab === 'a4'
            ? 'border-indigo-600 text-indigo-600 font-semibold'
            : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
        }`}
      >
        <FileText className="w-4 h-4" />
        <span>Mẫu Hóa Đơn A4</span>
      </button>

      <button
        onClick={() => onTabChange('zalo')}
        className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
          activeTab === 'zalo'
            ? 'border-blue-600 text-blue-600 font-semibold'
            : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
        }`}
      >
        <MessageSquare className="w-4 h-4" />
        <span>Mẫu Tin Nhắn Zalo</span>
      </button>

      <button
        onClick={() => onTabChange('email')}
        className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
          activeTab === 'email'
            ? 'border-indigo-600 text-indigo-600 font-semibold'
            : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
        }`}
      >
        <Mail className="w-4 h-4" />
        <span>Mẫu Email Gửi Khách</span>
      </button>

      <button
        onClick={() => onTabChange('vietqr')}
        className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
          activeTab === 'vietqr'
            ? 'border-purple-600 text-purple-600 font-semibold'
            : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
        }`}
      >
        <Sparkles className="w-4 h-4" />
        <span>Nội Dung CK (VietQR)</span>
      </button>
    </div>
  );
}
