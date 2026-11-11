import React, { RefObject } from 'react';
import Link from 'next/link';
import { FileText, Plus, Eye, MoreVertical } from 'lucide-react';
import { formatVietnamDateTime } from '@/lib/date';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { InvoiceRowMenu } from './InvoiceRowMenu';
import { formatCurrency } from './types';

interface InvoiceTableProps {
  invoices: any[];
  totalInvoicesCount: number;
  isLoading: boolean;
  selectedIds: string[];
  onToggleSelectAll: () => void;
  onToggleSelectRow: (id: string) => void;
  openMenuRow: string | null;
  setOpenMenuRow: (id: string | null) => void;
  menuPos: { top?: number; bottom?: number; right: number } | null;
  setMenuPos: (pos: { top?: number; bottom?: number; right: number } | null) => void;
  menuRef: RefObject<HTMLDivElement | null>;
  isTrashView: boolean;
  searchTerm: string;
  selectedStatus: string;
  selectedType: string;
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

export function InvoiceTable({
  invoices,
  totalInvoicesCount,
  isLoading,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectRow,
  openMenuRow,
  setOpenMenuRow,
  menuPos,
  setMenuPos,
  menuRef,
  isTrashView,
  searchTerm,
  selectedStatus,
  selectedType,
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
}: InvoiceTableProps) {
  const isAllSelected =
    invoices.length > 0 && invoices.every((inv) => selectedIds.includes(inv.id));
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-400 space-y-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-medium text-slate-500">Đang tải danh sách hóa đơn...</p>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="p-16 text-center space-y-3">
        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
          <FileText className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">Không tìm thấy hóa đơn nào</p>
          <p className="text-xs text-slate-500">
            {searchTerm || selectedStatus !== 'ALL' || selectedType !== 'ALL'
              ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
              : 'Bắt đầu bằng cách tạo hóa đơn mới đầu tiên'}
          </p>
        </div>
        {!(searchTerm || selectedStatus !== 'ALL' || selectedType !== 'ALL') && (
          <Link
            href="/invoices/new"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo hóa đơn ngay</span>
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isSomeSelected;
                  }}
                  onChange={onToggleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  title="Chọn tất cả hóa đơn trang này"
                />
              </th>
              <th className="py-3.5 px-4">Số Hóa Đơn</th>
              <th className="py-3.5 px-4">Khách Hàng / Đơn Vị</th>
              <th className="py-3.5 px-4 text-right">Tổng Tiền</th>
              <th className="py-3.5 px-4 text-center">Trạng Thái</th>
              <th className="py-3.5 px-4">Ngày Lập</th>
              <th className="py-3.5 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {invoices.map((inv) => {
              const isChecked = selectedIds.includes(inv.id);
              const isMenuOpen = openMenuRow === inv.id;

              return (
                <tr
                  key={inv.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isChecked ? 'bg-blue-50/50' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td className="py-3.5 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleSelectRow(inv.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                  </td>

                  {/* Số Hóa Đơn */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="font-bold text-blue-600 hover:text-blue-800 font-mono text-sm hover:underline cursor-pointer"
                      >
                        #{inv.invoiceNumber}
                      </Link>
                      {inv.isDraft && (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Nháp
                        </span>
                      )}
                    </div>
                    {inv.paymentCode && (
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        Mã: {inv.paymentCode}
                      </div>
                    )}
                  </td>

                  {/* Khách Hàng */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 text-sm">{inv.buyerName}</div>
                    {inv.buyerCompany && (
                      <div className="text-xs text-slate-500 truncate max-w-sm mt-0.5">
                        {inv.buyerCompany}
                      </div>
                    )}
                    {inv.buyerEmail && (
                      <div className="text-xs text-slate-400 truncate max-w-sm mt-0.5">
                        {inv.buyerEmail}
                      </div>
                    )}
                  </td>

                  {/* Tổng Tiền */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums text-sm">
                    {formatCurrency(inv.grandTotal)}
                  </td>

                  {/* Trạng Thái */}
                  <td className="py-3.5 px-4 text-center">
                    <InvoiceStatusBadge status={inv.status} />
                  </td>

                  {/* Ngày Lập */}
                  <td className="py-3.5 px-4 text-slate-600 text-xs">
                    <div>{formatVietnamDateTime(inv.issueDate || inv.createdAt)}</div>
                  </td>

                  {/* Thao Tác */}
                  <td className="py-3 px-4 text-right relative">
                    <div className="flex items-center justify-end space-x-1.5">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (openMenuRow === inv.id) {
                            setOpenMenuRow(null);
                            setMenuPos(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const menuEstimatedHeight = 330;
                            const spaceBelow = window.innerHeight - rect.bottom;
                            const openUpwards = spaceBelow < menuEstimatedHeight;

                            setMenuPos({
                              top: openUpwards ? undefined : rect.bottom + 4,
                              bottom: openUpwards ? window.innerHeight - rect.top + 4 : undefined,
                              right: window.innerWidth - rect.right,
                            });
                            setOpenMenuRow(inv.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Thao tác khác"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    {isMenuOpen && menuPos && (
                      <InvoiceRowMenu
                        invoice={inv}
                        menuPos={menuPos}
                        menuRef={menuRef}
                        isTrashView={isTrashView}
                        onClose={() => {
                          setOpenMenuRow(null);
                          setMenuPos(null);
                        }}
                        onRestore={(id) => {
                          onRestore(id);
                          setOpenMenuRow(null);
                          setMenuPos(null);
                        }}
                        isRestoring={isRestoring}
                        onPermanentDelete={(item) => {
                          onPermanentDelete(item);
                          setOpenMenuRow(null);
                          setMenuPos(null);
                        }}
                        isPermanentDeleting={isPermanentDeleting}
                        onClone={(id) => {
                          onClone(id);
                          setOpenMenuRow(null);
                          setMenuPos(null);
                        }}
                        isCloning={isCloning}
                        onPay={(id) => {
                          onPay(id);
                          setOpenMenuRow(null);
                          setMenuPos(null);
                        }}
                        isPaying={isPaying}
                        onAddToSubscriptions={(item) => {
                          onAddToSubscriptions(item);
                          setOpenMenuRow(null);
                          setMenuPos(null);
                        }}
                        onSoftDelete={(item) => {
                          onSoftDelete(item);
                          setOpenMenuRow(null);
                          setMenuPos(null);
                        }}
                        isSoftDeleting={isSoftDeleting}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer Summary */}
      {invoices.length > 0 && (
        <div className="px-6 py-3.5 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-sm text-slate-500">
          <span>
            Hiển thị <strong>{invoices.length}</strong> / <strong>{totalInvoicesCount}</strong> hóa đơn
          </span>
          <span className="font-mono tabular-nums font-medium">
            Tổng tiền trang này:{' '}
            <strong className="text-slate-900 font-bold">
              {formatCurrency(
                invoices.reduce((acc, it) => acc + (Number(it.grandTotal) || 0), 0)
              )}
            </strong>
          </span>
        </div>
      )}
    </>
  );
}

