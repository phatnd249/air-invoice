import React from 'react';
import { Building2, Plus, Star, MapPin, Phone, CreditCard, Edit2, Trash2 } from 'lucide-react';
import { CompanyProfile, BankAccountItem } from '@invoice/types';

interface CompaniesTabProps {
  companies: CompanyProfile[];
  bankAccounts: BankAccountItem[];
  onOpenAdd: () => void;
  onOpenEdit: (comp: CompanyProfile) => void;
  onDelete: (id?: string) => void;
  onSetDefault: (id?: string) => void;
}

export function CompaniesTab({
  companies,
  bankAccounts,
  onOpenAdd,
  onOpenEdit,
  onDelete,
  onSetDefault,
}: CompaniesTabProps) {
  return (
    <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
        <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-base">
          <Building2 className="w-5 h-5 text-blue-600" />
          <span>Danh Sách Đơn Vị Cung Cấp (Người Bán)</span>
        </div>

        <button
          type="button"
          onClick={onOpenAdd}
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Đơn Vị Mới</span>
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Cấu hình một hoặc nhiều pháp nhân/chi nhánh xuất hóa đơn. Thay đổi được lưu tự động ngay khi thêm, sửa, xóa hoặc đổi đơn vị mặc định.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {companies.map((comp, idx) => {
          const linkedBank = bankAccounts.find((b) => b.id === comp.bankAccountId);
          return (
            <div
              key={comp.id || idx}
              className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                comp.isDefault
                  ? 'border-blue-600 bg-blue-50/20 ring-2 ring-blue-600/20 shadow-sm'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    {comp.logoUrl ? (
                      <img
                        src={comp.logoUrl}
                        alt="Logo"
                        className="w-9 h-9 object-contain rounded-lg border border-slate-200 bg-white p-0.5"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                        {comp.name ? comp.name.charAt(0).toUpperCase() : 'C'}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{comp.name}</h4>
                      <span className="text-xs font-mono text-slate-500">
                        MST: <strong className="text-slate-700">{comp.taxCode || 'Chưa cập nhật'}</strong>
                      </span>
                    </div>
                  </div>

                  {comp.isDefault ? (
                    <span className="inline-flex items-center space-x-1 bg-blue-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-xs shrink-0">
                      <Star className="w-3 h-3 fill-white" />
                      <span>Mặc định</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSetDefault(comp.id)}
                      className="text-xs text-slate-500 hover:text-blue-600 hover:underline shrink-0 cursor-pointer"
                    >
                      Đặt làm mặc định
                    </button>
                  )}
                </div>

                <div className="space-y-1 text-xs text-slate-600 pt-1 border-t border-slate-100">
                  {comp.address && (
                    <div className="flex items-start space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{comp.address}</span>
                    </div>
                  )}
                  {comp.phone && (
                    <div className="flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{comp.phone}</span>
                      {comp.email && <span className="text-slate-300">|</span>}
                      {comp.email && <span>{comp.email}</span>}
                    </div>
                  )}
                  {linkedBank && (
                    <div className="flex items-center space-x-1.5 text-blue-700 bg-blue-50/60 px-2 py-1 rounded-lg border border-blue-100/60 mt-1">
                      <CreditCard className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-medium text-xs">
                        TK liên kết: {linkedBank.bankCode} - {linkedBank.bankAccount}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 mt-3 border-t border-slate-200/70">
                <button
                  type="button"
                  onClick={() => onOpenEdit(comp)}
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                  title="Chỉnh sửa đơn vị"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(comp.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                  title="Xóa đơn vị"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

