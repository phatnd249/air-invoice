import React from 'react';
import { Clock, RefreshCw, Play, Trash2 } from 'lucide-react';

interface QueueHeaderProps {
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  onRefreshAll: () => void;
  onProcessNow: () => void;
  isProcessing: boolean;
  onClearCompleted: () => void;
  isClearingCompleted: boolean;
  completedCount: number;
}

export function QueueHeader({
  autoRefresh,
  onToggleAutoRefresh,
  onRefreshAll,
  onProcessNow,
  isProcessing,
  onClearCompleted,
  isClearingCompleted,
  completedCount,
}: QueueHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Hàng Chờ Xử Lý Request (Queue Worker)
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Ghi nhận tất cả request từ các API, chạy tuần tự từng tin nhắn. Tự động thử lại sau vài phút nếu lỗi (tối đa 5 lần rồi dừng, vẫn lưu lại).
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-2.5">
        {/* Nút Auto Refresh */}
        <button
          type="button"
          onClick={onToggleAutoRefresh}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
            autoRefresh
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
          title={autoRefresh ? 'Tự động làm mới mỗi 6 giây' : 'Bật tự động làm mới'}
        >
          <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          <span>{autoRefresh ? 'Auto 6s: BẬT' : 'Auto: TẮT'}</span>
        </button>

        {/* Nút Refresh ngay */}
        <button
          type="button"
          onClick={onRefreshAll}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Làm mới</span>
        </button>

        {/* Nút Kích hoạt chạy ngay */}
        <button
          type="button"
          onClick={onProcessNow}
          disabled={isProcessing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isProcessing ? 'Đang kích hoạt...' : 'Xử lý ngay'}</span>
        </button>

        {/* Nút Dọn dẹp hoàn thành */}
        {completedCount > 0 && (
          <button
            type="button"
            onClick={onClearCompleted}
            disabled={isClearingCompleted}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-medium rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-slate-400" />
            <span>Dọn đã xong ({completedCount})</span>
          </button>
        )}
      </div>
    </div>
  );
}

