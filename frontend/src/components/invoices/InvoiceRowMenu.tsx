import React, { RefObject } from 'react';
import Link from 'next/link';
import {
  RotateCcw,
  Trash2,
  Pencil,
  Download,
  Copy,
  CheckCircle2,
  CalendarClock,
} from 'lucide-react';
import { getExportPdfUrl } from '@/lib/api';

interface InvoiceRowMenuProps {
  invoice: any;
  menuPos: { top?: number; bottom?: number; right: number };
  menuRef: RefObject<HTMLDivElement | null>;
  isTrashView: boolean;
  onClose: () => void;
  onRestore: (id: string) => void;
  isRestoring: boolean;
  onPermanentDelete: (inv: any) => void;
  isPermanentDeleting: boolean;
  onClone: (id: string) => void;
  isCloning: boolean;
  onPay: (id: string) => void;
  isPaying: boolean;
  onAddToSubscriptions: (inv: any) => void;
  onSoftDelete: (inv: any) => void;
  isSoftDeleting: boolean;
}

export function InvoiceRowMenu({
  invoice,
  menuPos,
  menuRef,
  isTrashView,
  onClose,
  onRestore,
  isRestoring,
  onPermanentDelete,
  isPermanentDeleting,
  onClone,
  isCloning,
  onPay,
  isPaying,
  onAddToSubscriptions,
  onSoftDelete,
  isSoftDeleting,
}: InvoiceRowMenuProps) {
  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: menuPos.top !== undefined ? `${menuPos.top}px` : undefined,
        bottom: menuPos.bottom !== undefined ? `${menuPos.bottom}px` : undefined,
        right: `${menuPos.right}px`,
        zIndex: 60,
        maxHeight: 'calc(100vh - 32px)',
        overflowY: 'auto',
      }}
      className="w-60 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-1.5 text-left animate-in fade-in zoom-in-95 duration-150"
    >
      {isTrashView ? (
        <>
          <button
            type="button"
            onClick={() => onRestore(invoice.id)}
            disabled={isRestoring}
            className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors text-left cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Khôi phục hóa đơn</span>
          </button>
          <button
            type="button"
            onClick={() => onPermanentDelete(invoice)}
            disabled={isPermanentDeleting}
            className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa vĩnh viễn</span>
          </button>
        </>
      ) : (
        <>
          <Link
            href={`/invoices/${invoice.id}/edit`}
            onClick={onClose}
            className="flex items-center space-x-2.5 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Pencil className="w-4 h-4 text-slate-400" />
            <span>Chỉnh sửa hóa đơn</span>
          </Link>

          <a
            href={getExportPdfUrl(invoice.id)}
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
            className="flex items-center space-x-2.5 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>In / Tải PDF</span>
          </a>

          <button
            type="button"
            onClick={() => onClone(invoice.id)}
            disabled={isCloning}
            className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
          >
            <Copy className="w-4 h-4 text-slate-400" />
            <span>Nhân bản hóa đơn</span>
          </button>

          {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
            <button
              type="button"
              onClick={() => onPay(invoice.id)}
              disabled={isPaying}
              className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors text-left cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Xác nhận đã thanh toán</span>
            </button>
          )}

          {invoice.status === 'PAID' && (
            <button
              type="button"
              onClick={() => onAddToSubscriptions(invoice)}
              className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors text-left cursor-pointer"
            >
              <CalendarClock className="w-4 h-4 text-indigo-600" />
              <span>Thêm vào Trang Khách Hàng</span>
            </button>
          )}

          <div className="my-1 border-t border-slate-100" />

          <button
            type="button"
            onClick={() => onSoftDelete(invoice)}
            disabled={isSoftDeleting}
            className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Chuyển vào Thùng rác</span>
          </button>
        </>
      )}
    </div>
  );
}

