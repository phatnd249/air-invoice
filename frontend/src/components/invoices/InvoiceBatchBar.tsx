import React from 'react';
import { RotateCcw, Trash2, CreditCard, UserPlus } from 'lucide-react';
import { formatCurrency } from './types';

interface InvoiceBatchBarProps {
  selectedCount: number;
  totalSelectedAmount: number;
  unpaidCount: number;
  isTrashView: boolean;
  onBulkRestore: () => void;
  isBulkRestoring: boolean;
  onBulkDelete: () => void;
  isBulkDeleting: boolean;
  onOpenBulkPay: () => void;
  onOpenBulkSub: () => void;
  onClearSelection: () => void;
}

export function InvoiceBatchBar({
  selectedCount,
  totalSelectedAmount,
  unpaidCount,
  isTrashView,
  onBulkRestore,
  isBulkRestoring,
  onBulkDelete,
  isBulkDeleting,
  onOpenBulkPay,
  onOpenBulkSub,
  onClearSelection,
}: InvoiceBatchBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-6 py-3.5 rounded-2xl shadow-2xl flex flex-wrap items-center gap-3.5 animate-in fade-in slide-in-from-bottom-4 duration-200 border border-slate-700/80">
      <div className="flex items-center gap-2.5 text-sm font-semibold">
        <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-mono font-bold text-white">
          {selectedCount}
        </span>
        <span>Đã chọn {selectedCount} hóa đơn</span>
        <span className="text-slate-400 font-mono font-normal">
          ({formatCurrency(totalSelectedAmount)})
        </span>
      </div>

      <div className="h-4 w-px bg-slate-700 hidden sm:block" />

      {isTrashView ? (
        <>
          <button
            type="button"
            onClick={onBulkRestore}
            disabled={isBulkRestoring}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isBulkRestoring ? 'Đang khôi phục...' : `Khôi phục (${selectedCount})`}</span>
          </button>
          <button
            type="button"
            onClick={onBulkDelete}
            disabled={isBulkDeleting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isBulkDeleting ? 'Đang xóa...' : `Xóa vĩnh viễn (${selectedCount})`}</span>
          </button>
        </>
      ) : (
        <div className="flex items-center gap-2">
          {/* Nút Thanh Toán Nhiều */}
          <button
            type="button"
            onClick={onOpenBulkPay}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>
              Thanh toán ({unpaidCount > 0 ? unpaidCount : selectedCount})
            </span>
          </button>

          {/* Nút Chuyển Thành Khách Hàng Nhanh */}
          <button
            type="button"
            onClick={onOpenBulkSub}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-900/30 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Chuyển thành khách hàng ({selectedCount})</span>
          </button>

          {/* Nút Xóa Nhiều (Thùng rác) */}
          <button
            type="button"
            onClick={onBulkDelete}
            disabled={isBulkDeleting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-rose-700 text-slate-300 hover:text-white text-sm font-medium rounded-xl transition-all cursor-pointer border border-slate-700"
            title="Chuyển vào Thùng rác"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Thùng rác</span>
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onClearSelection}
        className="text-sm text-slate-400 hover:text-white transition-colors cursor-pointer px-2.5 py-1.5 ml-auto"
      >
        Bỏ chọn
      </button>
    </div>
  );
}

