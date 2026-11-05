import React from 'react';
import Link from 'next/link';
import { LayoutTemplate } from 'lucide-react';
import InvoiceTemplateRenderer from '@/components/InvoiceTemplateRenderer';
import { InvoiceDesignTemplate } from './types';
import { SAMPLE_INVOICE, SAMPLE_SETTINGS } from './constants';

interface InvoicePreviewModalProps {
  template: InvoiceDesignTemplate | null;
  onClose: () => void;
  onEdit: (tpl: InvoiceDesignTemplate) => void;
}

export function InvoicePreviewModal({
  template,
  onClose,
  onEdit,
}: InvoicePreviewModalProps) {
  if (!template) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: template.primaryColor || '#1e3a8a' }}
            >
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Xem Trước Mẫu: {template.name}
              </h3>
              <p className="text-xs text-slate-500">Mô phỏng đầy đủ dữ liệu thực tế</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-all text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-slate-100 flex-1">
          <div className="max-w-3xl mx-auto">
            <InvoiceTemplateRenderer
              invoice={SAMPLE_INVOICE}
              settings={SAMPLE_SETTINGS}
              designConfig={template}
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
          <span className="text-xs text-slate-500">Chuẩn in ấn A4 &amp; xuất Playwright PDF</span>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onEdit(template)}
              className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all cursor-pointer"
            >
              Chỉnh Sửa Thiết Kế
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
            >
              Đóng
            </button>
            <Link
              href={`/invoices/new?templateId=${template.code || template.id}`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              Tạo Hóa Đơn Với Mẫu Này
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
