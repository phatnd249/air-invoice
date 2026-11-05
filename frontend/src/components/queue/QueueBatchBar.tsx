import React from 'react';
import { Trash2 } from 'lucide-react';

interface QueueBatchBarProps {
  selectedCount: number;
  onBulkDelete: () => void;
  isBulkDeleting: boolean;
  onClearSelection: () => void;
}

export function QueueBatchBar({
  selectedCount,
  onBulkDelete,
  isBulkDeleting,
  onClearSelection,
}: QueueBatchBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200 border border-slate-800">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-mono font-bold text-white">
          {selectedCount}
        </span>
        <span>Đã chọn {selectedCount} request</span>
      </div>
      <div className="h-4 w-px bg-slate-700" />
      <button
        type="button"
        onClick={onBulkDelete}
        disabled={isBulkDeleting}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>{isBulkDeleting ? 'Đang xóa...' : 'Xóa tất cả đã chọn'}</span>
      </button>
      <button
        type="button"
        onClick={onClearSelection}
        className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer px-2 py-1"
      >
        Bỏ chọn
      </button>
    </div>
  );
}

