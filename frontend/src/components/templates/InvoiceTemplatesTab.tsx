import React from 'react';
import Link from 'next/link';
import {
  LayoutTemplate,
  Check,
  FileText,
  Eye,
  Pencil,
  Copy,
  Trash2,
} from 'lucide-react';
import { InvoiceDesignTemplate } from './types';

interface InvoiceTemplatesTabProps {
  effectiveTemplates: InvoiceDesignTemplate[];
  onPreview: (tpl: InvoiceDesignTemplate) => void;
  onEdit: (tpl: InvoiceDesignTemplate) => void;
  onDuplicate: (tpl: InvoiceDesignTemplate) => void;
  onSetDefault: (id: string) => void;
  isSetDefaultPending: boolean;
  onDelete: (id: string, name?: string) => void;
}

export function InvoiceTemplatesTab({
  effectiveTemplates,
  onPreview,
  onEdit,
  onDuplicate,
  onSetDefault,
  isSetDefaultPending,
  onDelete,
}: InvoiceTemplatesTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {effectiveTemplates.map((tpl) => {
          const isDefault = tpl.isDefault;
          const pc = tpl.primaryColor || '#1e3a8a';

          return (
            <div
              key={tpl.id || tpl.code}
              className={`bg-white rounded-2xl border-2 transition-all duration-300 shadow-xs hover:shadow-md p-6 flex flex-col justify-between relative overflow-hidden ${
                isDefault ? 'border-blue-600 ring-1 ring-blue-600/20' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header card */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs flex-shrink-0"
                      style={{ backgroundColor: pc }}
                    >
                      <LayoutTemplate className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                        <span>{tpl.name}</span>
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: pc }}
                        />
                        <span className="font-mono text-[11px] text-slate-500 uppercase">{pc}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {tpl.fontFamily === 'sans' ? 'Phông Sans' : tpl.fontFamily === 'mono' ? 'Phông Mono' : 'Phông Serif'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isDefault && (
                    <span className="bg-blue-600 text-white text-[11px] px-2.5 py-1 rounded-full font-semibold flex items-center space-x-1 shadow-xs flex-shrink-0">
                      <Check className="w-3 h-3" />
                      <span>Mặc định</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 mb-4 leading-relaxed line-clamp-2">
                  {tpl.description}
                </p>

                {/* Features Badges */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-md font-medium border ${
                      tpl.showSignatures
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    {tpl.showSignatures ? '✍️ Có Khối Chữ Ký' : '🚫 Không Chữ Ký'}
                  </span>

                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-md font-medium border ${
                      tpl.showTaxCodeBadge
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    {tpl.showTaxCodeBadge ? '🏛️ Phụ Đề Thuế' : 'Tối Giản Thuế'}
                  </span>

                  <span className="text-xs px-2.5 py-0.5 rounded-md font-medium border bg-slate-50 text-slate-600 border-slate-200">
                    {tpl.qrLayout === 'stacked' ? 'QR Xếp Tầng' : 'QR Cạnh Nhau'}
                  </span>
                </div>

                {/* Interactive Preview Box */}
                <div
                  onClick={() => onPreview(tpl)}
                  className="cursor-pointer border border-slate-200/90 rounded-xl p-4 mb-4 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col items-center justify-center min-h-[140px] group"
                >
                  <FileText className="w-8 h-8 text-slate-400 group-hover:text-blue-600 transition-colors mb-2" />
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600">
                    Bấm để xem trước toàn bộ mẫu A4
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    {tpl.showSignatures ? 'Hiển thị đủ 2 chữ ký & ghi chú' : 'Đã tinh gọn chữ ký & phụ đề thuế'}
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => onPreview(tpl)}
                    className="p-2 text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg text-xs font-medium transition-all cursor-pointer"
                    title="Xem mẫu đầy đủ"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onEdit(tpl)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                    title="Chỉnh sửa thiết kế này"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Sửa Thiết Kế</span>
                  </button>

                  <button
                    onClick={() => onDuplicate(tpl)}
                    className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs transition-all cursor-pointer"
                    title="Nhân bản mẫu này"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {!isDefault && tpl.id && (
                    <button
                      onClick={() => onSetDefault(tpl.id!)}
                      disabled={isSetDefaultPending}
                      className="p-2 text-slate-500 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 rounded-lg text-xs transition-all cursor-pointer"
                      title="Đặt làm mặc định"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}

                  {!isDefault && tpl.id && tpl.code !== 'standard-classic' && (
                    <button
                      onClick={() => onDelete(tpl.id!, tpl.name || 'Mẫu thiết kế')}
                      className="p-2 text-slate-400 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-lg text-xs transition-all cursor-pointer"
                      title="Xóa mẫu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <Link
                  href={`/invoices/new?templateId=${tpl.code || tpl.id}`}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all whitespace-nowrap cursor-pointer"
                >
                  <span>Dùng mẫu</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
