import React from 'react';
import Link from 'next/link';
import { Download, RefreshCw, Plus } from 'lucide-react';

interface InvoiceHeaderProps {
  onExportBackup: () => void;
  onRefresh: () => void;
  isFetching: boolean;
}

export function InvoiceHeader({ onExportBackup, onRefresh, isFetching }: InvoiceHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản Lý Hóa Đơn</h1>
        <p className="text-sm text-slate-500 mt-1">
          Theo dõi, phát hành và kiểm soát dòng tiền thanh toán dịch vụ
        </p>
      </div>

      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={onExportBackup}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold text-sm transition-all shadow-xs cursor-pointer"
          title="Tải tệp sao lưu toàn bộ dữ liệu hóa đơn về máy tính"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Sao Lưu (Backup)</span>
        </button>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isFetching}
          className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 transition-all shadow-xs cursor-pointer"
          title="Làm mới dữ liệu"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
        </button>

        <Link
          href="/invoices/new"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Hóa Đơn Mới</span>
        </Link>
      </div>
    </div>
  );
}

