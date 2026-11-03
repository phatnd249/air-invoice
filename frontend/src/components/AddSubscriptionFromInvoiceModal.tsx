'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  CalendarClock,
  X,
  User,
  Mail,
  Phone,
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  ExternalLink,
  DollarSign,
  AlertCircle,
  XCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  onSuccess?: () => void;
}

export default function AddSubscriptionFromInvoiceModal({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [serviceName, setServiceName] = useState('');
  const [cycle, setCycle] = useState('1 tháng');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [viewState, setViewState] = useState<'FORM' | 'SUCCESS' | 'ERROR'>('FORM');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [createdSub, setCreatedSub] = useState<any>(null);

  // Tự động khởi tạo dữ liệu khi mở modal
  useEffect(() => {
    if (!invoice || !isOpen) return;

    setViewState('FORM');
    setSuccessMessage('');
    setErrorMessage('');
    setCreatedSub(null);

    const firstItem = invoice.items?.[0] || {};
    const pkgName = firstItem.name || 'Gói Dịch Vụ';
    setServiceName(pkgName);

    // Xác định chu kỳ mặc định từ tên hoặc mô tả gói
    const meta = `${pkgName} ${firstItem.metaInfo || ''} ${firstItem.description || ''}`.toLowerCase();
    let initialCycle = '1 tháng';
    let monthsToAdd = 1;

    if (meta.includes('năm') || meta.includes('12 tháng') || meta.includes('year')) {
      initialCycle = '1 năm';
      monthsToAdd = 12;
    } else if (meta.includes('quý') || meta.includes('3 tháng')) {
      initialCycle = '3 tháng';
      monthsToAdd = 3;
    } else if (meta.includes('6 tháng')) {
      initialCycle = '6 tháng';
      monthsToAdd = 6;
    }

    setCycle(initialCycle);

    // Xác định ngày bắt đầu từ thời điểm thanh toán thành công
    const paidHistory = invoice.histories?.find((h: any) => h.action === 'PAID');
    const startObj = paidHistory
      ? new Date(paidHistory.createdAt)
      : invoice.updatedAt
      ? new Date(invoice.updatedAt)
      : new Date();

    const startYmd = !isNaN(startObj.getTime())
      ? startObj.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    setStartDate(startYmd);

    // Tính ngày kết thúc
    const endObj = new Date(startObj);
    endObj.setMonth(endObj.getMonth() + monthsToAdd);
    const endYmd = !isNaN(endObj.getTime())
      ? endObj.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    setEndDate(endYmd);

    setNotes(`Hóa đơn #${invoice.invoiceNumber}`);
  }, [invoice, isOpen]);

  // Khi thay đổi chu kỳ hoặc ngày bắt đầu -> tự tính lại ngày kết thúc
  const handleCycleChange = (newCycle: string) => {
    setCycle(newCycle);
    if (!startDate) return;

    const start = new Date(startDate);
    if (isNaN(start.getTime())) return;

    const end = new Date(start);
    if (newCycle === '1 năm') {
      end.setFullYear(end.getFullYear() + 1);
    } else if (newCycle === '6 tháng') {
      end.setMonth(end.getMonth() + 6);
    } else if (newCycle === '3 tháng') {
      end.setMonth(end.getMonth() + 3);
    } else if (newCycle === '1 tháng') {
      end.setMonth(end.getMonth() + 1);
    }

    setEndDate(end.toISOString().split('T')[0]);
  };

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (!newStart) return;

    const start = new Date(newStart);
    if (isNaN(start.getTime())) return;

    const end = new Date(start);
    if (cycle === '1 năm') {
      end.setFullYear(end.getFullYear() + 1);
    } else if (cycle === '6 tháng') {
      end.setMonth(end.getMonth() + 6);
    } else if (cycle === '3 tháng') {
      end.setMonth(end.getMonth() + 3);
    } else if (cycle === '1 tháng') {
      end.setMonth(end.getMonth() + 1);
    }

    setEndDate(end.toISOString().split('T')[0]);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/subscriptions/from-invoice/${invoice.id}`, {
        startDate,
        endDate,
        cycle,
        notes,
      });
      return res.data;
    },
    onSuccess: (data: any) => {
      setViewState('SUCCESS');
      setSuccessMessage(data?.message || 'Đã thêm khách hàng vào Trang Khách Hàng thành công!');
      setCreatedSub(data?.subscription);
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      setViewState('ERROR');
      setErrorMessage(err.response?.data?.message || err.message || 'Không thể tạo thuê bao dịch vụ cho khách hàng.');
    },
  });

  if (!isOpen || !invoice) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const formatVNDate = (dateStr: string) => {
    if (!dateStr) return '---';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-2xl shadow-xs transition-colors ${
              viewState === 'SUCCESS'
                ? 'bg-emerald-50 text-emerald-600'
                : viewState === 'ERROR'
                ? 'bg-rose-50 text-rose-600'
                : 'bg-indigo-50 text-indigo-600'
            }`}>
              {viewState === 'SUCCESS' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : viewState === 'ERROR' ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <CalendarClock className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {viewState === 'SUCCESS'
                  ? 'Kích Hoạt Thuê Bao Thành Công'
                  : viewState === 'ERROR'
                  ? 'Lỗi Đăng Ký Thuê Bao'
                  : 'Thêm Vào Trang Khách Hàng'}
              </h3>
              <p className="text-xs text-slate-500">
                Đơn hàng <strong>#{invoice.invoiceNumber}</strong> &bull; {invoice.buyerName}
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

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* VIEW: THÀNH CÔNG */}
          {viewState === 'SUCCESS' && (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              {/* Card Thành công trực quan */}
              <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-emerald-900">
                      Đã lưu vào Trang Khách Hàng!
                    </h4>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider">
                      Đang hoạt động
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                    {successMessage}
                  </p>
                </div>
              </div>

              {/* Tóm tắt chi tiết gói thuê bao */}
              <div className="bg-slate-50/90 rounded-2xl border border-slate-200/80 p-4 space-y-2.5 text-xs">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-200/60 flex items-center justify-between">
                  <span>Thông tin thuê bao kích hoạt</span>
                  <span className="text-indigo-600 font-semibold lowercase">
                    {cycle}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-500 block text-xs">Khách hàng</span>
                    <span className="font-semibold text-slate-900 block truncate">{invoice.buyerName}</span>
                    {invoice.buyerEmail && (
                      <span className="text-xs text-slate-500 block truncate">{invoice.buyerEmail}</span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-500 block text-xs">Gói dịch vụ</span>
                    <span className="font-semibold text-indigo-700 block truncate">{serviceName}</span>
                    <span className="text-xs text-emerald-600 font-bold block">{formatCurrency(invoice.grandTotal)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-xs text-slate-500 block uppercase font-medium">Bắt đầu</span>
                      <span className="font-semibold text-slate-800">{formatVNDate(startDate)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <div>
                      <span className="text-xs text-slate-500 block uppercase font-medium">Hết hạn</span>
                      <span className="font-semibold text-indigo-600">{formatVNDate(endDate)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Đóng & Ở lại đây
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push('/subscriptions');
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Đi tới Trang Khách Hàng</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW: LỖI / THẤT BẠI */}
          {viewState === 'ERROR' && (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="p-4 bg-rose-50/90 rounded-2xl border border-rose-200/80 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-200">
                  <XCircle className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-rose-900">
                    Không thể thêm vào Khách Hàng
                  </h4>
                  <p className="text-xs text-rose-700 mt-1 leading-relaxed break-words">
                    {errorMessage}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-700">Gợi ý xử lý:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500">
                  <li>Kiểm tra lại thông tin ngày bắt đầu và kết thúc gói.</li>
                  <li>Khách hàng có thể cần có email hoặc số điện thoại hợp lệ.</li>
                  <li>Nếu dịch vụ đã tồn tại, bạn có thể chỉnh sửa trực tiếp tại Trang Khách Hàng.</li>
                </ul>
              </div>

              {/* Nút hành động khi lỗi */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => setViewState('FORM')}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Quay lại chỉnh sửa
                </button>
                <button
                  type="button"
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${mutation.isPending ? 'animate-spin' : ''}`} />
                  <span>{mutation.isPending ? 'Đang thử lại...' : 'Thử lại ngay'}</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW: FORM NHẬP LIỆU */}
          {viewState === 'FORM' && (
            <>
              {/* Thẻ tóm tắt thông tin hóa đơn */}
              <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Khách hàng:
                  </span>
                  <span className="font-semibold text-slate-900">{invoice.buyerName}</span>
                </div>
                {invoice.buyerEmail && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> Email:
                    </span>
                    <span className="font-medium text-slate-700">{invoice.buyerEmail}</span>
                  </div>
                )}
                {invoice.buyerPhone && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> Số điện thoại:
                    </span>
                    <span className="font-medium text-slate-700">{invoice.buyerPhone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Số tiền thanh toán:
                  </span>
                  <span className="font-bold text-emerald-600 font-mono">
                    {formatCurrency(invoice.grandTotal)}
                  </span>
                </div>
              </div>

              {/* Form điều chỉnh dịch vụ & chu kỳ */}
              <div className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gói dịch vụ áp dụng
                  </label>
                  <input
                    type="text"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800"
                    placeholder="VD: Starter, Grow, Hosting..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Chu kỳ gói
                    </label>
                    <select
                      value={cycle}
                      onChange={(e) => handleCycleChange(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-800"
                    >
                      <option value="1 tháng">1 tháng (30 ngày)</option>
                      <option value="3 tháng">3 tháng (1 quý)</option>
                      <option value="6 tháng">6 tháng</option>
                      <option value="1 năm">1 năm (12 tháng)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Thời gian bắt đầu (Kích hoạt)
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Thời gian kết thúc (Hạn gói)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ghi chú
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ghi chú thêm..."
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <CalendarClock className={`w-4 h-4 ${mutation.isPending ? 'animate-spin' : ''}`} />
                  <span>{mutation.isPending ? 'Đang thêm...' : 'Xác Nhận Thêm Vào Khách Hàng'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
