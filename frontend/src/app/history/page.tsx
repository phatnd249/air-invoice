'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  History,
  Search,
  RefreshCw,
  FileText,
  Send,
  CheckCircle2,
  Edit3,
  Ban,
  FilePlus,
  ShieldCheck,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface HistoryRecord {
  id: string;
  invoiceId: string;
  action: string;
  note: string | null;
  actor: string | null;
  createdAt: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    buyerName: string;
    buyerCompany: string | null;
    grandTotal: number;
    status: string;
  } | null;
}

const ACTION_MAP: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; badgeBg: string; textBg: string }
> = {
  CREATED: {
    label: 'Tạo mới',
    icon: FilePlus,
    color: 'text-indigo-600',
    badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    textBg: 'bg-indigo-50 text-indigo-600',
  },
  ISSUED: {
    label: 'Phát hành',
    icon: ShieldCheck,
    color: 'text-blue-600',
    badgeBg: 'bg-blue-50 border-blue-200 text-blue-700',
    textBg: 'bg-blue-50 text-blue-600',
  },
  SENT: {
    label: 'Gửi Email',
    icon: Send,
    color: 'text-purple-600',
    badgeBg: 'bg-purple-50 border-purple-200 text-purple-700',
    textBg: 'bg-purple-50 text-purple-600',
  },
  PAID: {
    label: 'Đã thanh toán',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    textBg: 'bg-emerald-50 text-emerald-600',
  },
  UPDATED: {
    label: 'Cập nhật',
    icon: Edit3,
    color: 'text-amber-600',
    badgeBg: 'bg-amber-50 border-amber-200 text-amber-700',
    textBg: 'bg-amber-50 text-amber-600',
  },
  CANCELLED: {
    label: 'Đã hủy',
    icon: Ban,
    color: 'text-rose-600',
    badgeBg: 'bg-rose-50 border-rose-200 text-rose-700',
    textBg: 'bg-rose-50 text-rose-600',
  },
};

const FILTER_TABS = [
  { id: 'ALL', label: 'Tất cả hoạt động' },
  { id: 'PAID', label: 'Thanh toán' },
  { id: 'SENT', label: 'Gửi email' },
  { id: 'ISSUED', label: 'Phát hành' },
  { id: 'CREATED', label: 'Tạo mới' },
  { id: 'UPDATED', label: 'Chỉnh sửa' },
  { id: 'CANCELLED', label: 'Hủy' },
];

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSec < 60) return 'Vừa xong';
  if (diffInSec < 3600) return `${Math.floor(diffInSec / 60)} phút trước`;
  if (diffInSec < 86400) return `${Math.floor(diffInSec / 3600)} giờ trước`;
  if (diffInSec < 604800) return `${Math.floor(diffInSec / 86400)} ngày trước`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');

  const { data: histories = [], isLoading, isFetching, refetch } = useQuery<HistoryRecord[]>({
    queryKey: ['invoice-histories', selectedAction, searchTerm],
    queryFn: async () => {
      const res = await api.get('/invoices/activities/all', {
        params: {
          action: selectedAction !== 'ALL' ? selectedAction : undefined,
          search: searchTerm || undefined,
        },
      });
      return res.data;
    },
  });

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const totalLogs = histories.length;
  const paidCount = histories.filter((h) => h.action === 'PAID').length;
  const sentCount = histories.filter((h) => h.action === 'SENT').length;
  const updateCount = histories.filter((h) => h.action === 'UPDATED').length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nhật Ký Lịch Sử Hoạt Động</h1>
          </div>
          <p className="text-sm text-slate-500">
            Theo dõi chi tiết tất cả các thao tác phát hành, thanh toán, gửi email và chỉnh sửa hóa đơn
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-all shadow-sm flex items-center space-x-2 text-sm font-medium"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng lượt thao tác</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalLogs}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lượt thanh toán</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{paidCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email đã gửi</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{sentCount}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <Send className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lượt điều chỉnh</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{updateCount}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Edit3 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Action Tabs */}
          <div className="flex items-center space-x-1 border-b md:border-b-0 pb-2 md:pb-0 overflow-x-auto">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedAction(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedAction === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo số HĐ, khách hàng, nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            />
          </div>
        </div>
      </div>

      {/* History Activity List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Hành động</th>
                <th className="px-6 py-4">Hóa đơn & Khách hàng</th>
                <th className="px-6 py-4">Chi tiết thao tác / Ghi chú</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs">Đang tải nhật ký lịch sử...</span>
                    </div>
                  </td>
                </tr>
              ) : histories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center">
                        <History className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium text-slate-600">Không có bản ghi lịch sử nào</p>
                      <p className="text-xs text-slate-400">
                        {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Các thao tác trên hóa đơn sẽ tự động được ghi nhận tại đây'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                histories.map((record) => {
                  const cfg = ACTION_MAP[record.action] || {
                    label: record.action,
                    icon: Clock,
                    color: 'text-slate-600',
                    badgeBg: 'bg-slate-50 border-slate-200 text-slate-700',
                    textBg: 'bg-slate-50 text-slate-600',
                  };
                  const Icon = cfg.icon;
                  const date = new Date(record.createdAt);

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Timestamp */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs font-semibold text-slate-900">
                          {formatTimeAgo(record.createdAt)}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {date.toLocaleString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Action Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badgeBg}`}
                        >
                          <Icon className="w-3.5 h-3.5 mr-1.5" />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Invoice & Buyer */}
                      <td className="px-6 py-4">
                        {record.invoice ? (
                          <div>
                            <Link
                              href={`/invoices/${record.invoice.id}`}
                              className="font-bold text-blue-600 hover:text-blue-800 font-mono text-xs flex items-center space-x-1"
                            >
                              <span>{record.invoice.invoiceNumber}</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                            <div className="text-xs text-slate-800 font-medium mt-0.5">
                              {record.invoice.buyerName}
                            </div>
                            {record.invoice.buyerCompany && (
                              <div className="text-[11px] text-slate-400 truncate max-w-xs">
                                {record.invoice.buyerCompany}
                              </div>
                            )}
                            <div className="text-xs font-semibold text-slate-900 mt-1">
                              {formatCurrency(record.invoice.grandTotal)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Hóa đơn đã bị xóa</span>
                        )}
                      </td>

                      {/* Note / Details */}
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {record.note || '---'}
                        </p>
                        {record.actor && (
                          <div className="text-[11px] text-slate-400 mt-1">
                            Bởi: <span className="font-semibold text-slate-600">{record.actor}</span>
                          </div>
                        )}
                      </td>

                      {/* Quick Action */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {record.invoice && (
                          <Link
                            href={`/invoices/${record.invoice.id}`}
                            className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-all"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Chi tiết</span>
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
