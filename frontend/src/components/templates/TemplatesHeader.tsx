import React from 'react';
import { LayoutTemplate, Plus } from 'lucide-react';
import { TemplateTabType } from './types';

interface TemplatesHeaderProps {
  activeTab: TemplateTabType;
  onOpenCreateDesignModal: () => void;
  onOpenCreateMsgModal: (channel: 'ZALO' | 'EMAIL') => void;
}

export function TemplatesHeader({
  activeTab,
  onOpenCreateDesignModal,
  onOpenCreateMsgModal,
}: TemplatesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <LayoutTemplate className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Cấu Hình Định Dạng & Mẫu Giao Diện
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Tùy chỉnh bố cục mẫu hóa đơn A4 chuẩn in ấn và mẫu tin nhắn tự động (Zalo / Email) gửi khách hàng.
            </p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div>
        {activeTab === 'a4' ? (
          <button
            onClick={onOpenCreateDesignModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-medium text-sm shadow-md shadow-indigo-200 hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thiết Kế Mẫu Mới (A4)</span>
          </button>
        ) : activeTab === 'vietqr' ? null : (
          <button
            onClick={() => onOpenCreateMsgModal(activeTab === 'zalo' ? 'ZALO' : 'EMAIL')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-medium text-sm shadow-md shadow-indigo-200 hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm Mẫu {activeTab === 'zalo' ? 'Zalo' : 'Email'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
