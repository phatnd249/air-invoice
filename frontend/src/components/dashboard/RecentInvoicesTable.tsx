'use client';

import React from 'react';
import { Receipt, ArrowUpRight, ExternalLink, Eye } from 'lucide-react';
import Link from 'next/link';
import { formatVnd } from './DashboardKpiCards';

interface InvoiceItemSummary {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface RecentInvoiceItem {
  id: string;
  invoiceNumber: string;
  buyerName: string;
  buyerEmail?: string;
  buyerCompany?: string;
  grandTotal: number;
  status: string;
  issueDate: string;
  createdAt: string;
  shareToken?: string;
  items?: InvoiceItemSummary[];
}

interface RecentInvoicesTableProps {
  invoices: RecentInvoiceItem[];
}

export function RecentInvoicesTable({ invoices }: RecentInvoicesTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Đã thanh toán</span>
          </span>
        );
      case 'ISSUED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Đã phát hành</span>
          </span>
        );
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Đã gửi khách</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200 line-through">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Đã hủy</span>
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Hóa Đơn Mới Nhất</h3>
              <p className="text-xs text-slate-500">Các giao dịch phát hành gần đây</p>
            </div>
          </div>

          <Link
            href="/invoices"
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center"
          >
            Tất cả hóa đơn <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        </div>

        {invoices.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Chưa có hóa đơn nào được tạo
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                  <th className="py-2.5 px-3">Mã HĐ</th>
                  <th className="py-2.5 px-3">Khách Hàng</th>
                  <th className="py-2.5 px-3">Số Tiền</th>
                  <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                  <th className="py-2.5 px-3 text-right">Xem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Mã HĐ */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <Link href={`/invoices/${inv.id}`} className="hover:text-blue-600 hover:underline">
                        #{inv.invoiceNumber}
                      </Link>
                      <div className="text-[10px] text-slate-400 font-normal font-sans">
                        {new Date(inv.issueDate || inv.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </td>

                    {/* Khách hàng */}
                    <td className="py-3 px-3 max-w-[160px]">
                      <div className="font-semibold text-slate-800 truncate" title={inv.buyerName}>
                        {inv.buyerName}
                      </div>
                      {inv.items && inv.items[0] && (
                        <div className="text-[11px] text-slate-400 truncate" title={inv.items[0].name}>
                          {inv.items[0].name}
                        </div>
                      )}
                    </td>

                    {/* Số tiền */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatVnd(inv.grandTotal)}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {getStatusBadge(inv.status)}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {inv.shareToken && (
                          <Link
                            href={`/view/${inv.shareToken}`}
                            target="_blank"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Mở link xem online"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Chi tiết hóa đơn"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <Link
          href="/invoices/new"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
        >
          + Lập hóa đơn mới
        </Link>
        <Link href="/invoices" className="text-slate-400 hover:text-slate-600 text-[11px]">
          Xem toàn bộ danh sách →
        </Link>
      </div>
    </div>
  );
}
