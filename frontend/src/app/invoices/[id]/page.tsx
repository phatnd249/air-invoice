'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, Printer, Send, FileText, CheckCircle2, Clock, QrCode } from 'lucide-react';
import Link from 'next/link';

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params?.id as string;

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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Đang tải thông tin hóa đơn...</div>;
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 font-medium">Không tìm thấy hóa đơn</p>
        <Link href="/invoices" className="text-blue-600 text-sm mt-2 inline-block">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-4">
          <Link
            href="/invoices"
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-slate-900">{invoice.invoiceNumber}</h1>
              <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                {invoice.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Mã thanh toán: <span className="font-mono font-semibold text-slate-700">{invoice.paymentCode || '---'}</span></p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg shadow-sm space-x-2 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>In Hóa Đơn</span>
          </button>
        </div>
      </div>

      {/* Invoice Sheet View (A4 Standard Classic Template) */}
      <div className="bg-white border border-slate-300 shadow-xl rounded-xl p-10 font-sans text-slate-800 text-sm leading-normal">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-[#2c3e50] pb-5 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#2c3e50] flex items-center space-x-2">
              <span>HÓA ĐƠN {invoice.invoiceNumber}</span>
              <span className="bg-[#e74c3c] text-white text-xs font-bold px-2 py-0.5 rounded">
                {invoice.status === 'ISSUED' ? 'Đã phát hành' : invoice.status === 'SENT' ? 'Đã gửi' : 'Chưa thanh toán'}
              </span>
            </h2>
          </div>
          <div className="text-sm text-slate-600">
            Ngày lập: <strong>{new Date(invoice.issueDate).toLocaleDateString('vi-VN')}</strong>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <span className="block text-xs font-bold uppercase text-slate-400 mb-1">Nhà cung cấp</span>
            <div className="font-bold text-slate-900">{settings?.companyName || 'CÔNG TY TNHH GIÁO DỤC AI ROBOTIC'}</div>
            <div className="text-slate-600 text-xs mt-0.5">{settings?.address || 'Số 10 Huỳnh Văn Nghệ, P. Trấn Biên, Đồng Nai'}</div>
            <div className="text-slate-600 text-xs mt-0.5">MST: {settings?.taxCode || '3603893101'}</div>
          </div>

          <div>
            <span className="block text-xs font-bold uppercase text-slate-400 mb-1">Khách hàng</span>
            <div className="font-bold text-slate-900">{invoice.buyerName}</div>
            {invoice.buyerCompany && <div className="text-slate-600 text-xs mt-0.5">{invoice.buyerCompany}</div>}
            {invoice.buyerAddress && <div className="text-slate-600 text-xs mt-0.5">{invoice.buyerAddress}</div>}
            {invoice.buyerTaxCode && <div className="text-slate-600 text-xs mt-0.5">MST: {invoice.buyerTaxCode}</div>}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full border-collapse mb-8">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-xs uppercase border-b-2 border-slate-300">
              <th className="py-2.5 px-3 text-left w-12">#</th>
              <th className="py-2.5 px-3 text-left">Dịch Vụ</th>
              <th className="py-2.5 px-3 text-right w-36">Thành Tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoice.items?.map((it: any, idx: number) => (
              <tr key={it.id || idx}>
                <td className="py-3 px-3 align-top text-slate-500">{idx + 1}</td>
                <td className="py-3 px-3 align-top">
                  <span className="font-bold text-[#2c3e50] block text-base">{it.name}</span>
                  {it.description && <span className="text-slate-600 block text-xs mt-0.5">{it.description}</span>}
                  {it.metaInfo && <span className="text-slate-400 block text-xs italic mt-0.5">{it.metaInfo}</span>}
                </td>
                <td className="py-3 px-3 align-top text-right font-medium text-base">
                  {formatCurrency(it.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer with QR and Totals */}
        <div className="flex justify-between items-start pt-6 border-t border-slate-100">
          <div className="text-center p-3 bg-slate-50 border border-slate-200 rounded-lg w-52">
            <div className="text-xs text-slate-500 mb-2 font-medium">Quét mã thanh toán</div>
            {invoice.qrDataUrl ? (
              <img
                src={invoice.qrDataUrl}
                alt="VietQR"
                className="w-44 h-auto mx-auto rounded shadow-sm"
              />
            ) : (
              <div className="w-44 h-44 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs mx-auto">
                <QrCode className="w-8 h-8" />
              </div>
            )}
          </div>

          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Tổng phụ:</span>
              <span className="font-medium">{formatCurrency(invoice.subTotal)}</span>
            </div>
            {invoice.hasVat && (
              <div className="flex justify-between">
                <span className="text-slate-600">VAT ({invoice.vatRate}%):</span>
                <span className="font-medium">{formatCurrency(invoice.vatAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-[#2c3e50] pt-3 border-t-2 border-[#2c3e50] mt-3">
              <span>TỔNG CỘNG:</span>
              <span>{formatCurrency(invoice.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
