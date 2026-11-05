import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Building2 } from 'lucide-react';
import { CompanyProfile, BankAccountItem } from '@invoice/types';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCompany: CompanyProfile | null;
  bankAccounts: BankAccountItem[];
  onSave: (data: CompanyProfile) => void;
}

export function CompanyModal({
  isOpen,
  onClose,
  editingCompany,
  bankAccounts,
  onSave,
}: CompanyModalProps) {
  const { register, handleSubmit, reset } = useForm<CompanyProfile>();

  useEffect(() => {
    if (isOpen) {
      if (editingCompany) {
        reset(editingCompany);
      } else {
        reset({
          name: '',
          taxCode: '',
          phone: '',
          email: '',
          logoUrl: '',
          address: '',
          bankAccountId: '',
          isDefault: false,
        });
      }
    }
  }, [isOpen, editingCompany, reset]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 cursor-default"
      >
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {editingCompany ? 'Chỉnh Sửa Đơn Vị Cung Cấp' : 'Thêm Đơn Vị Cung Cấp Mới'}
              </h3>
              <p className="text-xs text-slate-500">Thông tin sẽ được lưu tự động khi hoàn tất</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200 transition-all font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSave)}>
          <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên Doanh Nghiệp / Đơn Vị Phát Hành *
              </label>
              <input
                type="text"
                placeholder="VD: CÔNG TY TNHH GIÁO DỤC AI ROBOTIC"
                {...register('name', { required: true })}
                className="w-full px-3.5 py-2 text-sm font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã Số Thuế (MST)
                </label>
                <input
                  type="text"
                  placeholder="VD: 3603893101"
                  {...register('taxCode')}
                  className="w-full px-3.5 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hotline / Số Điện Thoại
                </label>
                <input
                  type="text"
                  placeholder="VD: 0900000000"
                  {...register('phone')}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Liên Hệ
                </label>
                <input
                  type="email"
                  placeholder="VD: contact@airobotics.edu.vn"
                  {...register('email')}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Logo URL (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="VD: https://domain.com/logo.png"
                  {...register('logoUrl')}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Địa Chỉ Doanh Nghiệp / Xuất Hóa Đơn
              </label>
              <input
                type="text"
                placeholder="VD: Số 10 Huỳnh Văn Nghệ, P. Trấn Biên, TP. Biên Hòa, Đồng Nai"
                {...register('address')}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tài Khoản Ngân Hàng Mặc Định Cho Đơn Vị Này
              </label>
              <select
                {...register('bankAccountId')}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="">-- Chọn tài khoản ngân hàng liên kết --</option>
                {bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.label ? `${acc.label} (${acc.bankCode} - ${acc.bankAccount})` : `${acc.bankCode} - ${acc.bankAccount}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="isDefaultComp"
                {...register('isDefault')}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <label htmlFor="isDefaultComp" className="text-xs font-medium text-slate-700 cursor-pointer">
                Đặt làm đơn vị cung cấp mặc định cho các hóa đơn mới
              </label>
            </div>
          </div>

          <div className="p-4 border-t border-slate-200 bg-white flex justify-end items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              {editingCompany ? 'Lưu Thay Đổi' : 'Thêm Đơn Vị'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

