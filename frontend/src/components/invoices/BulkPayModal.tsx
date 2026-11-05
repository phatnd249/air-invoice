import React from 'react';
import { CreditCard, X, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from './types';

interface BulkPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInvoices: any[];
  totalAmount: number;
  unpaidCount: number;
  bulkPayNote: string;
  setBulkPayNote: (val: string) => void;
  bulkPaySendEmail: boolean;
  setBulkPaySendEmail: (val: boolean) => void;
  bulkPaySendZalo: boolean;
  setBulkPaySendZalo: (val: boolean) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function BulkPayModal({
  isOpen,
  onClose,
  selectedInvoices,
  totalAmount,
  unpaidCount,
  bulkPayNote,
  setBulkPayNote,
  bulkPaySendEmail,
  setBulkPaySendEmail,
  bulkPaySendZalo,
  setBulkPaySendZalo,
  onSubmit,
  isSubmitting,
}: BulkPayModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Xác Nhận Thanh Toán Hàng Loạt</h3>
              <p className="text-xs text-slate-500">
                Áp dụng cho <strong>{selectedInvoices.length}</strong> hóa đơn được chọn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung */}
        <div className="p-6 space-y-4">
          {/* Tóm tắt số tiền */}
          <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-800 font-semibold block">
                Tổng số tiền thanh toán
              </span>
              <span className="text-xs text-emerald-600">
                {selectedInvoices.length} hóa đơn ({unpaidCount} chưa thanh toán)
              </span>
            </div>
            <div className="text-lg font-bold font-mono text-emerald-700">
              {formatCurrency(totalAmount)}
            </div>
          </div>

          {/* Danh sách hóa đơn tóm tắt */}
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {selectedInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-slate-900 font-mono">#{inv.invoiceNumber}</span>
                  <span className="text-slate-500 ml-2">{inv.buyerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-slate-800">
                    {formatCurrency(inv.grandTotal)}
                  </span>
                  {inv.status === 'PAID' ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-700 font-bold">
                      Đã trả
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 font-bold">
                      Chờ trả
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tùy chọn thông báo */}
          <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
            <label className="flex items-center space-x-2.5 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={bulkPaySendEmail}
                onChange={(e) => setBulkPaySendEmail(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <span>Tự động gửi <strong>Email biên lai thanh toán</strong> cho khách hàng</span>
            </label>

            <label className="flex items-center space-x-2.5 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={bulkPaySendZalo}
                onChange={(e) => setBulkPaySendZalo(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <span>Tự động gửi <strong>Tin nhắn Zalo</strong> xác nhận kích hoạt dịch vụ</span>
            </label>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ghi chú thanh toán
            </label>
            <input
              type="text"
              value={bulkPayNote}
              onChange={(e) => setBulkPayNote(e.target.value)}
              placeholder="Ghi chú đối soát..."
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-200 transition-all cursor-pointer"
            >
              <CheckCircle2 className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>
                {isSubmitting
                  ? 'Đang xử lý thanh toán...'
                  : `Xác Nhận Thanh Toán (${selectedInvoices.length})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

