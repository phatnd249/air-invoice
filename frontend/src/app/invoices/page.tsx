'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getExportPdfUrl } from '@/lib/api';
import {
  Plus,
  Search,
  Filter,
  FileText,
  Send,
  Printer,
  Copy,
  Trash2,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Clock,
  QrCode,
  Download,
  Ban,
  ShieldCheck,
} from 'lucide-react';

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Lấy danh sách hóa đơn
  const { data: invoices, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await api.get('/invoices');
      return res.data;
    },
  });

  // Nhân bản (Clone) hóa đơn
  const cloneMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.post(`/invoices/${id}/clone`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      alert('Đã nhân bản hóa đơn thành công!');
    },
    onError: (err: any) => {
      alert('Lỗi nhân bản hóa đơn: ' + (err.response?.data?.message || err.message));
    },
  });

  // Xác nhận thanh toán
  const payMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      return api.post(`/invoices/${id}/pay`, { note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      alert('Đã xác nhận thanh toán thành công!');
    },
    onError: (err: any) => {
      alert('Lỗi xác nhận thanh toán: ' + (err.response?.data?.message || err.message));
    },
  });

  // Xóa hóa đơn
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      alert('Đã xóa hóa đơn thành công!');
    },
    onError: (err: any) => {
      alert('Lỗi xóa hóa đơn: ' + (err.response?.data?.message || err.message));
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ISSUED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck className="w-3 h-3 mr-1" /> Đã phát hành
          </span>
        );
      case 'SENT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Send className="w-3 h-3 mr-1" /> Đã gửi
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Đã thanh toán
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Ban className="w-3 h-3 mr-1" /> Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  const tabs = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'ISSUED', label: 'Đã phát hành' },
    { id: 'SENT', label: 'Đã gửi' },
    { id: 'PAID', label: 'Đã thanh toán' },
    { id: 'CANCELLED', label: 'Đã hủy' },
  ];

  // Lọc theo tìm kiếm và trạng thái
  const filteredInvoices = invoices?.filter((inv: any) => {
    const matchesSearch =
      inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.buyerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.buyerCompany?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.paymentCode?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'ALL' || inv.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Danh Sách Hóa Đơn</h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý, tạo mới, xuất PDF và gửi email hóa đơn cho khách hàng
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-all shadow-sm"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <Link
            href="/invoices/new"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Hóa Đơn Mới</span>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng hóa đơn</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{invoices?.length || 0}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Đã phát hành</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {invoices?.filter((i: any) => i.status === 'ISSUED').length || 0}
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Đã gửi mail / Thanh toán</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {invoices?.filter((i: any) => i.status === 'SENT' || i.status === 'PAID').length || 0}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1 border-b md:border-b-0 pb-2 md:pb-0 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedStatus === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo số HĐ, tên khách hàng, mã TT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Số Hóa Đơn</th>
                <th className="px-6 py-4">Khách Hàng</th>
                <th className="px-6 py-4">Mã TT (SePay)</th>
                <th className="px-6 py-4">Ngày Lập</th>
                <th className="px-6 py-4 text-right">Tổng Tiền</th>
                <th className="px-6 py-4 text-center">Trạng Thái</th>
                <th className="px-6 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Đang tải danh sách hóa đơn...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-slate-600">Không tìm thấy hóa đơn nào</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Thử thay đổi bộ lọc hoặc tạo một hóa đơn mới
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices?.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="text-blue-600 hover:text-blue-800 font-bold hover:underline"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{inv.buyerName}</div>
                      {inv.buyerCompany && (
                        <div className="text-xs text-slate-400 truncate max-w-xs">{inv.buyerCompany}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {inv.paymentCode ? (
                        <span className="font-mono text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {inv.paymentCode}
                        </span>
                      ) : (
                        <span className="text-slate-300">---</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(inv.issueDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="px-6 py-4 text-center">{getStatusBadge(inv.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Xem chi tiết"
                        >
                          <FileText className="w-4 h-4" />
                        </Link>

                        {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                          <button
                            onClick={() => {
                              const note = prompt(
                                `Xác nhận đã nhận đủ ${formatCurrency(inv.grandTotal)} cho hóa đơn ${inv.invoiceNumber}?\nNhập ghi chú (nếu có):`,
                                'Đã nhận thanh toán chuyển khoản'
                              );
                              if (note !== null) {
                                payMutation.mutate({ id: inv.id, note });
                              }
                            }}
                            disabled={payMutation.isPending}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Xác nhận đã thanh toán"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => window.open(getExportPdfUrl(inv.id), '_blank')}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Tải PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Bạn có muốn sao chép hóa đơn ${inv.invoiceNumber}?`)) {
                              cloneMutation.mutate(inv.id);
                            }
                          }}
                          disabled={cloneMutation.isPending}
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                          title="Sao chép (Clone)"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Bạn có chắc chắn muốn XÓA vĩnh viễn hóa đơn ${inv.invoiceNumber}? Thao tác này không thể hoàn tác.`
                              )
                            ) {
                              deleteMutation.mutate(inv.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Xóa hóa đơn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
