import React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, CalendarClock, Sparkles, ExternalLink } from 'lucide-react';
import { formatCurrency } from './types';

interface SinglePayResultModalProps {
  result: {
    isOpen: boolean;
    invoice?: any;
    emailResult?: any;
    zaloResult?: any;
  };
  onClose: () => void;
  onAddSub: (inv: any) => void;
}

export function SinglePayResultModal({ result, onClose, onAddSub }: SinglePayResultModalProps) {
  if (!result.isOpen || !result.invoice) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-slate-100 p-6 space-y-4">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-base font-bold text-slate-900">
            Xác Nhận Thanh Toán Thành Công!
          </h3>
          <p className="text-xs text-slate-500">
            Hóa đơn <strong className="text-slate-800">#{result.invoice.invoiceNumber}</strong> đã được chuyển sang tab <strong>Đã thanh toán</strong>
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Khách hàng:</span>
            <span className="font-semibold text-slate-800">{result.invoice.buyerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Số tiền:</span>
            <span className="font-bold text-emerald-600 font-mono">
              {formatCurrency(result.invoice.grandTotal)}
            </span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-200/60">
            <span className="text-slate-500">Email biên lai:</span>
            <span className="text-slate-700 font-medium">
              {result.emailResult?.queued ? 'Đang gửi ngầm' : 'Hoàn tất'}
            </span>
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              const inv = result.invoice;
              onClose();
              onAddSub(inv);
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <CalendarClock className="w-4 h-4" />
            <span>Thêm Khách Hàng Này Vào Trang Khách Hàng</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer text-center"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

interface BulkPayResultModalProps {
  result: {
    isOpen: boolean;
    count: number;
    totalAmount: number;
    message: string;
  };
  onClose: () => void;
}

export function BulkPayResultModal({ result, onClose }: BulkPayResultModalProps) {
  if (!result.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-slate-100 p-6 space-y-4">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-base font-bold text-slate-900">
            Thanh Toán Hàng Loạt Hoàn Tất!
          </h3>
          <p className="text-xs text-slate-500">{result.message}</p>
        </div>

        <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 text-center space-y-1">
          <span className="text-[11px] text-emerald-700 font-semibold block uppercase">
            Tổng giá trị đã xác nhận thu
          </span>
          <span className="text-xl font-bold font-mono text-emerald-800">
            {formatCurrency(result.totalAmount)}
          </span>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer text-center"
          >
            Xem Hóa Đơn Đã Thanh Toán
          </button>
        </div>
      </div>
    </div>
  );
}

interface BulkSubResultModalProps {
  result: {
    isOpen: boolean;
    count: number;
    total: number;
    errorsCount: number;
    message: string;
  };
  onClose: () => void;
}

export function BulkSubResultModal({ result, onClose }: BulkSubResultModalProps) {
  const router = useRouter();

  if (!result.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-slate-100 p-6 space-y-4">
        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <Sparkles className="w-7 h-7" />
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-base font-bold text-slate-900">
            Đã Lưu Vào Trang Khách Hàng!
          </h3>
          <p className="text-xs text-slate-500">{result.message}</p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex justify-between">
          <span>Khách hàng thành công:</span>
          <span className="font-bold text-indigo-700">{result.count}</span>
        </div>

        <div className="pt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center"
          >
            Ở lại trang này
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              router.push('/subscriptions');
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Tới Trang Khách Hàng</span>
          </button>
        </div>
      </div>
    </div>
  );
}

