'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api, getExportPdfUrl } from '@/lib/api';
import { Printer, Download, FileText, AlertCircle } from 'lucide-react';
import InvoiceTemplateRenderer from '@/components/InvoiceTemplateRenderer';

export default function PublicInvoiceViewPage() {
  const params = useParams();
  const token = params?.token as string;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-invoice', token],
    queryFn: async () => {
      const res = await api.get(`/delivery/public/${token}`);
      return res.data;
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow text-center">
          <FileText className="w-10 h-10 text-blue-600 animate-pulse mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Đang tải hóa đơn thanh toán...</p>
        </div>
      </div>
    );
  }

  if (isError || !data?.invoice) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <p className="text-rose-600 font-semibold text-lg mb-2">Hóa đơn không tồn tại</p>
          <p className="text-sm text-slate-500 leading-relaxed">
            Đường dẫn xem hóa đơn không hợp lệ hoặc đã bị gỡ bỏ. Vui lòng liên hệ bộ phận hỗ trợ khách hàng để được giải đáp.
          </p>
        </div>
      </div>
    );
  }

  const { invoice, settings } = data;

  const handleDownloadPdf = () => {
    window.open(getExportPdfUrl(invoice.id), '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Customer Action Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Hóa Đơn Thanh Toán Trực Tuyến</h2>
              <p className="text-xs text-slate-500">
                Mã hóa đơn: <span className="font-mono font-semibold text-slate-700">{invoice.invoiceNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={() => window.print()}
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-all space-x-2 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>In Hóa Đơn</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Tải File PDF</span>
            </button>
          </div>
        </div>

        {/* Invoice Paper Document Rendered by Chosen Template */}
        <InvoiceTemplateRenderer
          invoice={invoice}
          settings={settings}
          overrideTemplateId={invoice.templateId}
        />
      </div>
    </div>
  );
}
