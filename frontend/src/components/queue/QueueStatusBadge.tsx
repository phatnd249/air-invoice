import React from 'react';
import { RotateCcw, Clock, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

interface QueueStatusBadgeProps {
  status: string;
  retryCount: number;
  maxRetries: number;
}

export function QueueStatusBadge({ status, retryCount, maxRetries }: QueueStatusBadgeProps) {
  switch (status) {
    case 'PENDING':
      return retryCount > 0 ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <RotateCcw className="w-3.5 h-3.5 animate-spin text-amber-600" />
          Đợi thử lại ({retryCount}/{maxRetries})
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          Đang chờ
        </span>
      );
    case 'PROCESSING':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
          Đang gửi tuần tự
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Thành công
        </span>
      );
    case 'FAILED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Đã dừng thử lại ({retryCount}/{maxRetries})
        </span>
      );
    default:
      return <span className="text-xs">{status}</span>;
  }
}

