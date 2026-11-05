import React from 'react';
import { CreditCard, Plus, Star, Edit2, Trash2 } from 'lucide-react';
import { BankAccountItem } from '@invoice/types';

interface BanksTabProps {
  bankAccounts: BankAccountItem[];
  onOpenAdd: () => void;
  onOpenEdit: (acc: BankAccountItem) => void;
  onDelete: (id?: string) => void;
  onSetDefault: (id?: string) => void;
}

export function BanksTab({
  bankAccounts,
  onOpenAdd,
  onOpenEdit,
  onDelete,
  onSetDefault,
}: BanksTabProps) {
  return (
    <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
        <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-base">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <span>Danh Sách Tài Khoản Chuyển Khoản & VietQR (SePay)</span>
        </div>

        <button
          type="button"
          onClick={onOpenAdd}
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Tài Khoản Ngân Hàng</span>
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Thêm nhiều tài khoản để lựa chọn linh hoạt khi lập hóa đơn. Thay đổi được lưu tự động ngay khi thêm, sửa, xóa hoặc đổi tài khoản mặc định.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bankAccounts.map((acc, idx) => (
          <div
            key={acc.id || idx}
            className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
              acc.isDefault
                ? 'border-blue-600 bg-blue-50/30 ring-2 ring-blue-600/20 shadow-sm'
                : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                  <span>{acc.label || acc.bankCode}</span>
                </span>

                {acc.isDefault ? (
                  <span className="inline-flex items-center space-x-1 bg-blue-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                    <Star className="w-3 h-3 fill-white" />
                    <span>Mặc định</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSetDefault(acc.id)}
                    className="text-xs text-slate-500 hover:text-blue-600 hover:underline cursor-pointer"
                  >
                    Đặt làm mặc định
                  </button>
                )}
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                <div>
                  Ngân hàng: <strong className="text-slate-800">{acc.bankCode}</strong>
                </div>
                <div>
                  Số tài khoản:{' '}
                  <strong className="font-mono text-sm text-blue-700 font-bold">
                    {acc.bankAccount}
                  </strong>
                </div>
                <div>
                  Chủ tài khoản:{' '}
                  <strong className="text-slate-800 uppercase">{acc.bankAccountName}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200/70">
              <span className="text-[11px] text-slate-400 font-mono">
                Template: {acc.qrTemplate || 'compact'}
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => onOpenEdit(acc)}
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                  title="Chỉnh sửa"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(acc.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                  title="Xóa tài khoản"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

