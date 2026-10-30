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
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Tự động khởi tạo dữ liệu khi mở modal
  useEffect(() => {
    if (!invoice || !isOpen) return;

    setIsSuccess(false);
    setSuccessMessage('');

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
      setIsSuccess(true);
      setSuccessMessage(data?.message || 'Đã thêm khách hàng vào Trang Khách Hàng thành công!');
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    },
  });

  if (!isOpen || !invoice) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl shadow-xs">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Thêm Vào Trang Khách Hàng</h3>
              <p className="text-xs text-slate-500">
                Đăng ký dịch vụ thuê bao cho đơn <strong>#{invoice.invoiceNumber}</strong>
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
          {isSuccess ? (
            <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">Thành công!</h4>
                <p className="text-sm text-slate-600 mt-1 max-w-sm mx-auto">{successMessage}</p>
              </div>

              <div className="pt-3 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push('/subscriptions');
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Đi tới Trang Khách Hàng</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Thẻ tóm tắt thông tin hóa đơn */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
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
                  <CalendarClock className="w-4 h-4" />
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

