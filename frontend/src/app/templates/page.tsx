'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LayoutTemplate,
  Check,
  Eye,
  Plus,
  Sparkles,
  FileCheck,
  CheckCircle2,
  Sliders,
  Palette,
} from 'lucide-react';
import InvoiceTemplateRenderer, { TEMPLATES_CONFIG } from '@/components/InvoiceTemplateRenderer';

const SAMPLE_INVOICE = {
  invoiceNumber: 'HD-2026-0001',
  issueDate: '2026-06-25',
  dueDate: '2026-07-05',
  status: 'ISSUED',
  buyerName: 'Nguyễn Thành Đạt',
  buyerCompany: 'Công ty Cổ phần Dịch vụ Số Thành Đạt',
  buyerTaxCode: '0315894123',
  buyerAddress: '124 Điện Biên Phủ, Quận 1, TP. Hồ Chí Minh',
  buyerEmail: 'thanhdat@thanhdattax.com',
  hasVat: true,
  vatRate: 10,
  subTotal: 1320000,
  vatAmount: 132000,
  grandTotal: 1452000,
  qrDataUrl: 'https://qr.sepay.vn/img?bank=Vietcombank&acc=SHYNNERI&template=compact&amount=1452000&des=HD0001%20Hosting',
  items: [
    {
      id: '1',
      name: 'Hosting Wordpress - Gói Doanh Nghiệp Pro',
      description: 'Tên miền: thanhdattax.com • NVMe SSD 20GB • Băng thông không giới hạn',
      metaInfo: 'Thời hạn: 25/06/2026 - 25/06/2027',
      quantity: 1,
      unitPrice: 660000,
      amount: 660000,
    },
    {
      id: '2',
      name: 'Chứng chỉ bảo mật SSL EV Wildcard',
      description: 'Bảo mật giao dịch mã hóa 256-bit • Hỗ trợ đa tên miền con',
      metaInfo: 'Thời hạn: 25/06/2026 - 25/06/2027',
      quantity: 1,
      unitPrice: 660000,
      amount: 660000,
    },
  ],
};

const SAMPLE_SETTINGS = {
  companyName: 'CÔNG TY TNHH GIÁO DỤC AI ROBOTIC',
  address: 'Số 10 Huỳnh Văn Nghệ, P. Trấn Biên, Đồng Nai',
  taxCode: '3603893101',
  phone: '0812305046',
  email: 'contact@airobotics.edu.vn',
};

export default function TemplatesPage() {
  const [selectedPreviewTemplate, setSelectedPreviewTemplate] = useState<string>('standard-classic');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Palette className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Thư Viện Mẫu Hóa Đơn</h1>
          </div>
          <p className="text-sm text-slate-500">
            Các mẫu thiết kế hóa đơn đạt chuẩn in ấn A4, tích hợp mã VietQR SePay và xuất PDF Playwright
          </p>
        </div>

        <Link
          href="/invoices/new"
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Hóa Đơn Ngay</span>
        </Link>
      </div>

      {/* Grid 4 Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TEMPLATES_CONFIG.map((tpl, index) => {
          const isDefault = tpl.id === 'standard-classic';
          return (
            <div
              key={tpl.id}
              className={`bg-white rounded-2xl border-2 transition-all duration-300 shadow-sm hover:shadow-md p-6 flex flex-col justify-between relative overflow-hidden ${
                isDefault ? 'border-blue-600 ring-1 ring-blue-600/20' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Top Card Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: tpl.primaryColor }}
                  >
                    <LayoutTemplate className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                      <span>{tpl.name}</span>
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">{tpl.subName}</span>
                  </div>
                </div>

                {isDefault && (
                  <span className="bg-blue-600 text-white text-xs px-2.5 py-1 rounded-full font-semibold flex items-center space-x-1 shadow-sm">
                    <Check className="w-3 h-3" />
                    <span>Mặc định</span>
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                {tpl.description}
              </p>

              {/* Mini Preview Box */}
              <div
                onClick={() => {
                  setSelectedPreviewTemplate(tpl.id);
                  setIsPreviewModalOpen(true);
                }}
                className="cursor-pointer mb-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4 hover:bg-slate-100/80 transition-all group relative overflow-hidden"
              >
                <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                  <span className="font-semibold text-slate-800">Bản xem nhanh</span>
                  <span className="text-blue-600 group-hover:underline flex items-center space-x-1 text-[11px] font-medium">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem toàn màn hình</span>
                  </span>
                </div>

                {/* Color scheme pill bar */}
                <div className="flex items-center space-x-2 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tpl.primaryColor }}></span>
                    <span>Chính: {tpl.primaryColor}</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tpl.accentColor }}></span>
                    <span>Phụ: {tpl.accentColor}</span>
                  </div>
                </div>
              </div>

              {/* Specs & Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                  <span className="bg-slate-100 px-2 py-0.5 rounded font-mono">Khổ A4</span>
                  <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium">VietQR Ready</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedPreviewTemplate(tpl.id);
                      setIsPreviewModalOpen(true);
                    }}
                    className="p-2 text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg text-xs font-medium transition-all"
                    title="Xem mẫu đầy đủ"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <Link
                    href="/invoices/new"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                  >
                    <span>Dùng mẫu</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <LayoutTemplate className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Xem Trước Mẫu:{' '}
                    {TEMPLATES_CONFIG.find((t) => t.id === selectedPreviewTemplate)?.name}
                  </h3>
                  <p className="text-xs text-slate-500">Mô phỏng dữ liệu thực tế</p>
                </div>
              </div>

              {/* Template Switch Tabs */}
              <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200">
                {TEMPLATES_CONFIG.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedPreviewTemplate(t.id)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                      selectedPreviewTemplate === t.id
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.name.split(' ')[0]}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-all text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Render Sheet */}
            <div className="p-6 overflow-y-auto bg-slate-100 flex-1">
              <div className="max-w-3xl mx-auto">
                <InvoiceTemplateRenderer
                  invoice={SAMPLE_INVOICE}
                  settings={SAMPLE_SETTINGS}
                  overrideTemplateId={selectedPreviewTemplate}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
              <span className="text-xs text-slate-500">Chuẩn in ấn A4 & xuất Playwright PDF</span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  Đóng
                </button>
                <Link
                  href="/invoices/new"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                >
                  Tạo Hóa Đơn Với Mẫu Này
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
