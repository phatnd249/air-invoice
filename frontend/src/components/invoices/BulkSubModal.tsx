import React from 'react';
import { UserPlus, X } from 'lucide-react';

interface BulkSubModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInvoices: any[];
  bulkSubCycle: string;
  setBulkSubCycle: (val: string) => void;
  bulkSubNotes: string;
  setBulkSubNotes: (val: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function BulkSubModal({
  isOpen,
  onClose,
  selectedInvoices,
  bulkSubCycle,
  setBulkSubCycle,
  bulkSubNotes,
  setBulkSubNotes,
  onSubmit,
  isSubmitting,
}: BulkSubModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Chuyển Nhanh Thành Khách Hàng</h3>
              <p className="text-xs text-slate-500">
                Đăng ký dịch vụ cho <strong>{selectedInvoices.length}</strong> hóa đơn được chọn
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
          <div className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-200/80 text-xs text-indigo-900 leading-relaxed">
            Hệ thống sẽ tự động trích xuất thông tin khách hàng, gói dịch vụ và thời gian bắt đầu (tính từ ngày thanh toán) để tạo thuê bao trên <strong>Trang Khách Hàng</strong>.
          </div>

          {/* Danh sách tóm tắt */}
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {selectedInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-slate-900">{inv.buyerName}</span>
                  <span className="text-slate-400 text-[11px] block truncate max-w-xs">
                    {inv.items?.[0]?.name || 'Gói Dịch Vụ'}
                  </span>
                </div>
                <span className="font-mono text-slate-500 text-[11px]">#{inv.invoiceNumber}</span>
              </div>
            ))}
          </div>

          {/* Cấu hình chu kỳ */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chu kỳ gói dịch vụ áp dụng
            </label>
            <select
              value={bulkSubCycle}
              onChange={(e) => setBulkSubCycle(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-800"
            >
              <option value="auto">✨ Tự động nhận diện theo tên gói (Khuyên dùng)</option>
              <option value="1 tháng">1 tháng (30 ngày)</option>
              <option value="3 tháng">3 tháng (1 quý)</option>
              <option value="6 tháng">6 tháng</option>
              <option value="1 năm">1 năm (12 tháng)</option>
            </select>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ghi chú cho các thuê bao
            </label>
            <input
              type="text"
              value={bulkSubNotes}
              onChange={(e) => setBulkSubNotes(e.target.value)}
              placeholder="Ghi chú thêm..."
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800"
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
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer"
            >
              <UserPlus className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>
                {isSubmitting
                  ? 'Đang chuyển đổi...'
                  : `Chuyển Ngay (${selectedInvoices.length})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

