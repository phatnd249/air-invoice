'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, FileText, CheckCircle2, Clock, Send, Eye, Trash2 } from 'lucide-react';

export default function InvoicesPage() {
  const { data: invoices, isLoading, refetch } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await api.get('/invoices');
      return res.data;
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 mr-1" /> Bản nháp
          </span>
        );
      case 'ISSUED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Đã phát hành
          </span>
        );
      case 'SENT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <Send className="w-3 h-3 mr-1" /> Đã gửi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Danh Sách Hóa Đơn</h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý, tạo mới, xuất PDF và gửi email hóa đơn cho khách hàng
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <Link
            href="/invoices/new"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Hóa Đơn Mới</span>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng hóa đơn</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{invoices?.length || 0}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Bản nháp</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {invoices?.filter((i: any) => i.status === 'DRAFT').length || 0}
            </p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Đã phát hành / Đã gửi</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {invoices?.filter((i: any) => i.status === 'ISSUED' || i.status === 'SENT').length || 0}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Số HĐ</th>
                <th className="py-3.5 px-4">Khách hàng / Công ty</th>
                <th className="py-3.5 px-4">Ngày lập</th>
                <th className="py-3.5 px-4">Mã Code</th>
                <th className="py-3.5 px-4 text-right">Tổng cộng</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Đang tải dữ liệu hóa đơn...
                  </td>
                </tr>
              ) : invoices?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-600 font-medium">Chưa có hóa đơn nào</p>
                    <p className="text-xs text-slate-400 mt-1">Bấm nút "Tạo Hóa Đơn Mới" để bắt đầu</p>
                  </td>
                </tr>
              ) : (
                invoices?.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-blue-600">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{inv.buyerName}</div>
                      {inv.buyerCompany && (
                        <div className="text-xs text-slate-500">{inv.buyerCompany}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {new Date(inv.issueDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-medium">
                        {inv.paymentCode || '---'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                        inv.grandTotal
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">{getStatusBadge(inv.status)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
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
