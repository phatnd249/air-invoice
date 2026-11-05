import React, { RefObject } from 'react';
import { Search, Trash2, ArchiveRestore } from 'lucide-react';
import { INVOICE_TYPE_CONFIG } from '@invoice/types';

interface InvoiceFilterBarProps {
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  trashCount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedType: string;
  onSelectType: (type: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  isTrashView: boolean;
  onEmptyTrash: () => void;
  isEmptyingTrash: boolean;
}

export function InvoiceFilterBar({
  selectedStatus,
  onSelectStatus,
  trashCount,
  searchTerm,
  onSearchChange,
  selectedType,
  onSelectType,
  searchInputRef,
  isTrashView,
  onEmptyTrash,
  isEmptyingTrash,
}: InvoiceFilterBarProps) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Tabs Segment */}
        <div className="flex flex-wrap items-center bg-slate-100/80 p-1 rounded-xl gap-1">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'PAID', label: 'Đã thanh toán' },
            { id: 'ISSUED', label: 'Đã phát hành' },
            { id: 'SENT', label: 'Đã gửi' },
            { id: 'CANCELLED', label: 'Đã hủy' },
            {
              id: 'TRASH',
              label: `Thùng rác${trashCount > 0 ? ` (${trashCount})` : ''}`,
              isTrash: true,
            },
          ].map((tab) => {
            const isSelected = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isSelected
                    ? tab.isTrash
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
                      : 'bg-white text-slate-900 shadow-xs'
                    : tab.isTrash && trashCount > 0
                    ? 'text-rose-600 hover:text-rose-800'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.isTrash && <Trash2 className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar & Type Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm mã, khách hàng, email (Bấm '/' để gõ)..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={selectedType}
            onChange={(e) => onSelectType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer"
          >
            <option value="ALL">Tất cả loại hóa đơn</option>
            {Object.entries(INVOICE_TYPE_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cảnh báo Thùng rác nếu đang ở chế độ xem Thùng rác */}
      {isTrashView && (
        <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800">
          <div className="flex items-center space-x-2">
            <ArchiveRestore className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              Bạn đang xem <strong>Thùng rác</strong> ({trashCount} hóa đơn). Hóa đơn trong này không tính vào doanh thu.
            </span>
          </div>
          {trashCount > 0 && (
            <button
              type="button"
              onClick={onEmptyTrash}
              disabled={isEmptyingTrash}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors cursor-pointer self-start sm:self-auto shrink-0"
            >
              {isEmptyingTrash ? 'Đang dọn...' : 'Dọn sạch thùng rác'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

