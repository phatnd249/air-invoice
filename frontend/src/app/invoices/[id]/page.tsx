'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getExportPdfUrl } from '@/lib/api';
import {
  ArrowLeft,
  Printer,
  Send,
  Download,
  History,
  FilePlus,
  Edit3,
  Mail,
  ShieldCheck,
  Ban,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  LayoutTemplate,
  Trash2,
  Copy,
} from 'lucide-react';
import Link from 'next/link';
import InvoiceTemplateRenderer, { TEMPLATES_CONFIG } from '@/components/InvoiceTemplateRenderer';
import { INVOICE_TYPE_CONFIG, INVOICE_FORM_CONFIG, InvoiceType, InvoiceForm } from '@invoice/types';

interface HistoryItem {
  id: string;
  invoiceId: string;
  action: string;
  note: string | null;
  actor: string | null;
  createdAt: string;
}

const ACTION_MAP: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; badgeBg: string; textBg: string }
> = {
  CREATED: {
    label: 'Khởi tạo hóa đơn',
    icon: FilePlus,
    color: 'bg-emerald-500 text-white',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    textBg: 'text-emerald-600',
  },
  UPDATED: {
    label: 'Cập nhật thông tin',
    icon: Edit3,
    color: 'bg-amber-500 text-white',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    textBg: 'text-amber-600',
  },
  ISSUED: {
    label: 'Phát hành hóa đơn',
    icon: ShieldCheck,
    color: 'bg-blue-600 text-white',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    textBg: 'text-blue-600',
  },
  SENT: {
    label: 'Gửi email cho khách',
    icon: Mail,
    color: 'bg-purple-600 text-white',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    textBg: 'text-purple-600',
  },
  CANCELLED: {
    label: 'Hủy hóa đơn',
    icon: Ban,
    color: 'bg-rose-600 text-white',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    textBg: 'text-rose-600',
  },
  PAID: {
    label: 'Thanh toán thành công',
    icon: CheckCircle2,
    color: 'bg-teal-600 text-white',
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
    textBg: 'text-teal-600',
  },
};

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSec < 60) return 'Vừa xong';
  if (diffInSec < 3600) return `${Math.floor(diffInSec / 60)} phút trước`;
  if (diffInSec < 86400) return `${Math.floor(diffInSec / 3600)} giờ trước`;
  if (diffInSec < 604800) return `${Math.floor(diffInSec / 86400)} ngày trước`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'ISSUED':
      return <span className="bg-blue-100 text-blue-800 border border-blue-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">Đã phát hành</span>;
    case 'SENT':
      return <span className="bg-purple-100 text-purple-800 border border-purple-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">Đã gửi mail</span>;
    case 'PAID':
      return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">Đã thanh toán</span>;
    case 'CANCELLED':
      return <span className="bg-rose-100 text-rose-800 border border-rose-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">Đã hủy</span>;
    default:
      return <span className="bg-blue-100 text-blue-800 border border-blue-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">Đã phát hành</span>;
  }
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params?.id as string;
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [overrideTemplateId, setOverrideTemplateId] = useState<string | null>(null);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const res = await api.get(`/invoices/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/invoices/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      alert('Đã hủy hóa đơn thành công!');
    },
    onError: (err: any) => {
      alert('Lỗi khi hủy hóa đơn: ' + (err.response?.data?.message || err.message));
    },
  });

  const payMutation = useMutation({
    mutationFn: async (note?: string) => {
      return api.post(`/invoices/${id}/pay`, { note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      alert('Đã xác nhận thanh toán thành công!');
    },
    onError: (err: any) => {
      alert('Lỗi khi xác nhận thanh toán: ' + (err.response?.data?.message || err.message));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return api.delete(`/invoices/${id}`);
    },
    onSuccess: () => {
      alert('Đã xóa hóa đơn thành công!');
      router.push('/invoices');
    },
    onError: (err: any) => {
      alert('Lỗi khi xóa hóa đơn: ' + (err.response?.data?.message || err.message));
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async (tplId: string) => {
      return api.put(`/invoices/${id}`, { templateId: tplId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      alert('Đã đổi mẫu hóa đơn thành công!');
    },
    onError: (err: any) => {
      alert('Lỗi khi đổi mẫu: ' + (err.response?.data?.message || err.message));
    },
  });

  const cloneMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/invoices/${id}/clone`);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      const newId = res?.data?.id;
      if (newId) {
        router.push(`/invoices/${newId}`);
      }
    },
    onError: (err: any) => {
      alert('Lỗi nhân bản hóa đơn: ' + (err.response?.data?.message || err.message));
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-sm font-medium">Đang tải thông tin hóa đơn...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Không tìm thấy hóa đơn</h2>
        <p className="text-slate-500 text-sm mt-1">Hóa đơn này có thể đã bị xóa hoặc đường dẫn không chính xác.</p>
        <Link
          href="/invoices"
          className="mt-4 inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách hóa đơn</span>
        </Link>
      </div>
    );
  }

  const histories: HistoryItem[] = invoice.histories || [];
  const editCount = histories.filter((h) => h.action === 'UPDATED').length;
  const sendCount = histories.filter((h) => h.action === 'SENT').length;
  const activeTemplate = overrideTemplateId || invoice.templateId || 'standard-classic';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center space-x-4">
          <Link
            href="/invoices"
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3 flex-wrap gap-y-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{invoice.invoiceNumber}</h1>
              {getStatusBadge(invoice.status)}
              {invoice.invoiceType && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {INVOICE_TYPE_CONFIG[invoice.invoiceType as InvoiceType]?.label || invoice.invoiceType}
                </span>
              )}
              {invoice.invoiceForm && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {INVOICE_FORM_CONFIG[invoice.invoiceForm as InvoiceForm]?.shortLabel || invoice.invoiceForm}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
              <span>Mã thanh toán:</span>
              <span className="font-mono font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                {invoice.paymentCode || '---'}
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg shadow-sm space-x-1.5 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>In</span>
          </button>

          <button
            onClick={() => window.open(getExportPdfUrl(invoice.id), '_blank')}
            className="inline-flex items-center px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg shadow-sm space-x-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Tải PDF</span>
          </button>

          <button
            onClick={() => cloneMutation.mutate()}
            disabled={cloneMutation.isPending}
            className="inline-flex items-center px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg shadow-sm space-x-1.5 transition-all"
          >
            <Copy className="w-4 h-4" />
            <span>{cloneMutation.isPending ? 'Đang nhân bản...' : 'Nhân bản'}</span>
          </button>

          <button
            onClick={async () => {
              if (!invoice.buyerEmail) {
                alert('Hóa đơn này chưa có thông tin email người nhận.');
                return;
              }
              if (confirm(`Bạn có chắc muốn gửi email hóa đơn này tới: ${invoice.buyerEmail}?`)) {
                try {
                  setIsSendingMail(true);
                  await api.post(`/delivery/send-email/${invoice.id}`);
                  alert('Đã gửi email thành công!');
                  queryClient.invalidateQueries({ queryKey: ['invoice', id] });
                } catch (e: any) {
                  alert('Lỗi gửi mail: ' + (e.response?.data?.message || e.message));
                } finally {
                  setIsSendingMail(false);
                }
              }
            }}
            disabled={isSendingMail}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm space-x-1.5 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>{isSendingMail ? 'Đang gửi...' : 'Gửi Email'}</span>
          </button>

          {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
            <button
              onClick={() => {
                const note = prompt('Nhập ghi chú thanh toán (hoặc để trống):', 'Khách đã thanh toán chuyển khoản');
                if (note !== null) {
                  payMutation.mutate(note);
                }
              }}
              disabled={payMutation.isPending}
              className="inline-flex items-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm space-x-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{payMutation.isPending ? 'Đang xử lý...' : 'Xác Nhận Đã Thu Tiền'}</span>
            </button>
          )}

          {invoice.status !== 'CANCELLED' && (
            <button
              onClick={() => {
                if (confirm('CẢNH BÁO: Bạn có chắc chắn muốn HỦY hóa đơn này? Thao tác này sẽ được ghi vào lịch sử.')) {
                  cancelMutation.mutate();
                }
              }}
              disabled={cancelMutation.isPending}
              className="inline-flex items-center px-3.5 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-medium rounded-lg shadow-sm space-x-1.5 transition-all"
            >
              <Ban className="w-4 h-4" />
              <span>Hủy HĐ</span>
            </button>
          )}

          <button
            onClick={() => {
              if (
                confirm(
                  `CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN hóa đơn ${invoice.invoiceNumber}? Thao tác này sẽ xóa toàn bộ dữ liệu hóa đơn và lịch sử.`
                )
              ) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
            className="inline-flex items-center px-3.5 py-2 bg-white border border-slate-300 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-sm font-medium rounded-lg shadow-sm space-x-1.5 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa HĐ</span>
          </button>
        </div>
      </div>

      {/* Template Quick Switch Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
          <LayoutTemplate className="w-4 h-4 text-blue-600" />
          <span>Mẫu hiển thị:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {TEMPLATES_CONFIG.map((tpl) => {
            const isCurrent = activeTemplate === tpl.id;
            return (
              <button
                key={tpl.id}
                onClick={() => {
                  setOverrideTemplateId(tpl.id);
                  if (tpl.id !== invoice.templateId) {
                    updateTemplateMutation.mutate(tpl.id);
                  }
                }}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isCurrent
                    ? 'border-blue-600 bg-blue-50 text-blue-800 ring-1 ring-blue-600 font-semibold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: tpl.primaryColor }}
                />
                <span>{tpl.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Layout: 2 Columns */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column: Invoice Sheet Preview (col-span-8) */}
        <div className="xl:col-span-8">
          <InvoiceTemplateRenderer
            invoice={invoice}
            settings={settings}
            overrideTemplateId={activeTemplate}
          />
        </div>

        {/* Right Column: Timeline & Change History (col-span-4) */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Lịch sử thay đổi</h3>
                  <p className="text-xs text-slate-500">Nhật ký sự kiện hóa đơn</p>
                </div>
              </div>
              <span className="bg-indigo-50 text-indigo-700 font-semibold text-xs px-2.5 py-1 rounded-full border border-indigo-100">
                {histories.length} sự kiện
              </span>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="text-xs text-slate-500 flex items-center space-x-1 mb-1">
                  <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                  <span>Chỉnh sửa</span>
                </div>
                <div className="text-lg font-bold text-slate-800">{editCount} lần</div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="text-xs text-slate-500 flex items-center space-x-1 mb-1">
                  <Mail className="w-3.5 h-3.5 text-purple-500" />
                  <span>Đã gửi mail</span>
                </div>
                <div className="text-lg font-bold text-slate-800">{sendCount} lần</div>
              </div>
            </div>

            {/* Timeline Feed */}
            {histories.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Chưa có lịch sử nào được ghi nhận.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {histories.map((h, idx) => {
                  const conf = ACTION_MAP[h.action] || {
                    label: h.action,
                    icon: Clock,
                    color: 'bg-slate-600 text-white',
                    badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
                    textBg: 'text-slate-600',
                  };
                  const IconComp = conf.icon;
                  const isLatest = idx === 0;

                  return (
                    <div key={h.id || idx} className="relative group">
                      {/* Timeline Node Dot/Icon */}
                      <div
                        className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                          conf.color
                        } ring-4 ${isLatest ? 'ring-indigo-100' : 'ring-white'}`}
                      >
                        <IconComp className="w-3 h-3" />
                      </div>

                      {/* Event Content Card */}
                      <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 transition-all">
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${conf.badgeBg}`}
                          >
                            {conf.label}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400" title={new Date(h.createdAt).toLocaleString('vi-VN')}>
                            {getRelativeTime(h.createdAt)}
                          </span>
                        </div>

                        {/* Note / Diff */}
                        {h.note && (
                          <div className="text-xs text-slate-700 mt-1.5 bg-white p-2.5 rounded-lg border border-slate-100 font-mono text-[11px] leading-relaxed break-words">
                            {h.note}
                          </div>
                        )}

                        {/* Footer info: Actor & Exact Date */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-400">
                          <span className="flex items-center space-x-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{h.actor || 'Hệ thống'}</span>
                          </span>
                          <span className="text-[10px]">
                            {new Date(h.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
                            {new Date(h.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
