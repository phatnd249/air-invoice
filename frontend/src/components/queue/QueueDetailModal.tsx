import React, { useState } from 'react';
import { Clock, X, AlertTriangle, Copy, Check, RotateCcw } from 'lucide-react';
import { formatVietnamDateTime } from '@/lib/date';
import { QueueJobItem, TYPE_CONFIG } from './types';
import { QueueStatusBadge } from './QueueStatusBadge';

interface QueueDetailModalProps {
  job: QueueJobItem | null;
  onClose: () => void;
  onRetry: (id: string) => void;
  isRetrying: boolean;
}

export function QueueDetailModal({
  job,
  onClose,
  onRetry,
  isRetrying,
}: QueueDetailModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!job) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/75">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Chi Tiết Request #{job.id.slice(0, 8)}
              </h3>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                API: <strong className="text-blue-600">{job.apiName || 'Hệ thống'}</strong> • {job.endpoint || ''}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 overflow-y-auto text-sm">
          {/* Meta Grid */}
          <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200/70">
            <div>
              <span className="text-slate-400 block text-xs">Trạng Thái:</span>
              <div className="mt-1">
                <QueueStatusBadge
                  status={job.status}
                  retryCount={job.retryCount}
                  maxRetries={job.maxRetries}
                />
              </div>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">Loại Tác Vụ:</span>
              <div className="font-semibold text-slate-800 mt-1">
                {TYPE_CONFIG[job.type]?.label || job.type}
              </div>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">Số Lần Thử Lại:</span>
              <div className="font-mono text-slate-800 mt-1 font-semibold">
                {job.retryCount} / {job.maxRetries} lần (Tối đa 5 lần)
              </div>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">Thời Gian Tạo:</span>
              <div className="font-mono text-slate-800 mt-1">
                {formatVietnamDateTime(job.createdAt)}
              </div>
            </div>
            {job.targetInfo && (
              <div className="col-span-2">
                <span className="text-slate-400 block text-xs">Đối Tượng / Người Nhận:</span>
                <div className="font-medium text-slate-900 mt-1">{job.targetInfo}</div>
              </div>
            )}
          </div>

          {/* Lỗi nếu có */}
          {job.errorMessage && (
            <div>
              <div className="text-slate-600 font-semibold mb-1.5 flex items-center gap-1.5 text-rose-600 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Chi Tiết Lỗi Ghi Nhận:</span>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-rose-800 font-mono text-xs whitespace-pre-wrap">
                {job.errorMessage}
              </div>
            </div>
          )}

          {/* Payload JSON */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-700 font-semibold text-sm">Dữ Liệu Gửi Lên (Payload):</span>
              <button
                type="button"
                onClick={() => copyToClipboard(JSON.stringify(job.payload, null, 2), 'payload')}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'payload' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'payload' ? 'Đã sao chép' : 'Sao chép JSON'}</span>
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-48 border border-slate-800">
              {JSON.stringify(job.payload, null, 2)}
            </pre>
          </div>

          {/* Result JSON (nếu có) */}
          {job.result && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-700 font-semibold text-sm">Kết Quả Phản Hồi (Result):</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(JSON.stringify(job.result, null, 2), 'result')}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'result' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'result' ? 'Đã sao chép' : 'Sao chép JSON'}</span>
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-40 border border-slate-800">
                {JSON.stringify(job.result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-slate-500 text-xs">
            Cập nhật lần cuối: {formatVietnamDateTime(job.updatedAt)}
          </span>

          <div className="flex items-center gap-2">
            {(job.status === 'FAILED' || job.status === 'PENDING') && (
              <button
                type="button"
                onClick={() => {
                  onRetry(job.id);
                  onClose();
                }}
                disabled={isRetrying}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs cursor-pointer transition-colors shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Thử lại ngay</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-xl text-xs cursor-pointer transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

