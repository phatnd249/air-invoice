import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CreditCard, QrCode } from 'lucide-react';
import { BankAccountItem } from '@invoice/types';
import { POPULAR_BANKS } from './types';

interface BankModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAccount: BankAccountItem | null;
  onSave: (data: BankAccountItem) => void;
}

export function BankModal({
  isOpen,
  onClose,
  editingAccount,
  onSave,
}: BankModalProps) {
  const { register, handleSubmit, reset, watch } = useForm<BankAccountItem>();

  useEffect(() => {
    if (isOpen) {
      if (editingAccount) {
        reset(editingAccount);
      } else {
        reset({
          label: '',
          bankCode: 'Vietcombank',
          bankAccount: '',
          bankAccountName: '',
          qrTemplate: 'compact',
          isDefault: false,
        });
      }
    }
  }, [isOpen, editingAccount, reset]);

  const watchedBankModal = watch();
  const testQrUrl =
    watchedBankModal.bankCode && watchedBankModal.bankAccount
      ? `https://qr.sepay.vn/img?bank=${watchedBankModal.bankCode}&acc=${watchedBankModal.bankAccount}&template=compact&amount=500000&des=TEST%20SEPAY`
      : '';

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
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {editingAccount ? 'Chỉnh Sửa Tài Khoản Ngân Hàng' : 'Thêm Tài Khoản Ngân Hàng Mới'}
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
          <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên Gợi Nhớ / Nhãn Tài Khoản
              </label>
              <input
                type="text"
                placeholder="VD: Tài khoản chính Vietcombank, MB Bank thu tiền..."
                {...register('label', { required: true })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ngân Hàng (Bank Code) *
                </label>
                <select
                  {...register('bankCode', { required: true })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium cursor-pointer"
                >
                  {POPULAR_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số Tài Khoản / Alias *
                </label>
                <input
                  type="text"
                  placeholder="VD: SHYNNERI hoặc 0123456789"
                  {...register('bankAccount', { required: true })}
                  className="w-full px-3.5 py-2 text-sm font-mono font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên Chủ Tài Khoản (In Hoa Không Dấu) *
              </label>
              <input
                type="text"
                placeholder="VD: NGUYEN VAN A hoặc AI ROBOTIC"
                {...register('bankAccountName', { required: true })}
                className="w-full px-3.5 py-2 text-sm font-semibold uppercase border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="isDefaultAcc"
                {...register('isDefault')}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <label htmlFor="isDefaultAcc" className="text-xs font-medium text-slate-700 cursor-pointer">
                Đặt làm tài khoản nhận tiền mặc định cho hóa đơn mới
              </label>
            </div>

            {testQrUrl && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center space-x-4">
                <img src={testQrUrl} alt="VietQR Test" className="w-24 h-24 rounded-lg border bg-white p-1" />
                <div className="text-xs text-slate-600 space-y-1">
                  <span className="font-bold text-slate-900 block text-xs flex items-center space-x-1">
                    <QrCode className="w-3.5 h-3.5 text-blue-600" />
                    <span>Xem thử mã VietQR</span>
                  </span>
                  <div>
                    Ngân hàng: <strong>{watchedBankModal.bankCode}</strong>
                  </div>
                  <div>
                    Số TK: <strong className="font-mono text-blue-700">{watchedBankModal.bankAccount}</strong>
                  </div>
                  <div>
                    Chủ TK: <strong>{watchedBankModal.bankAccountName}</strong>
                  </div>
                </div>
              </div>
            )}
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
              {editingAccount ? 'Lưu Thay Đổi' : 'Thêm Tài Khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

