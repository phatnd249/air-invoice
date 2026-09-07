'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Building2,
  CreditCard,
  Save,
  Plus,
  Trash2,
  Check,
  Star,
  QrCode,
  Sliders,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Info,
  Edit2,
} from 'lucide-react';

const POPULAR_BANKS = [
  { code: 'Vietcombank', name: 'Vietcombank (VCB - Ngoại thương)' },
  { code: 'MBBank', name: 'MB Bank (Quân Đội)' },
  { code: 'Techcombank', name: 'Techcombank (TCB - Kỹ Thương)' },
  { code: 'ACB', name: 'ACB (Á Châu)' },
  { code: 'VPBank', name: 'VPBank (Việt Nam Thịnh Vượng)' },
  { code: 'TPBank', name: 'TPBank (Tiên Phong)' },
  { code: 'BIDV', name: 'BIDV (Đầu tư & Phát triển)' },
  { code: 'VietinBank', name: 'VietinBank (Công Thương)' },
  { code: 'Agribank', name: 'Agribank (Nông Nghiệp)' },
  { code: 'Sacombank', name: 'Sacombank (Sài Gòn Thương Tín)' },
  { code: 'HDBank', name: 'HDBank (Phát triển TP.HCM)' },
  { code: 'VIB', name: 'VIB (Quốc Tế)' },
  { code: 'MSB', name: 'MSB (Hàng Hải)' },
  { code: 'SeABank', name: 'SeABank (Đông Nam Á)' },
  { code: 'OCB', name: 'OCB (Phương Đông)' },
];

interface BankAccount {
  id: string;
  bankCode: string;
  bankAccount: string;
  bankAccountName: string;
  label?: string;
  qrTemplate?: string;
  isDefault?: boolean;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form chính cho thông tin chung
  const { register, handleSubmit, reset, watch } = useForm();

  // Form riêng cho popup thêm/sửa tài khoản ngân hàng
  const {
    register: registerBank,
    handleSubmit: handleBankSubmit,
    reset: resetBank,
    setValue: setBankValue,
    watch: watchBank,
  } = useForm<BankAccount>({
    defaultValues: {
      id: '',
      bankCode: 'Vietcombank',
      bankAccount: '',
      bankAccountName: '',
      label: '',
      qrTemplate: 'compact',
      isDefault: false,
    },
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

  useEffect(() => {
    if (settings) {
      reset(settings);
      if (settings.bankAccounts && Array.isArray(settings.bankAccounts)) {
        setBankAccounts(settings.bankAccounts);
      } else if (settings.bankCode && settings.bankAccount) {
        setBankAccounts([
          {
            id: 'acc-1',
            bankCode: settings.bankCode,
            bankAccount: settings.bankAccount,
            bankAccountName: settings.bankAccountName || 'AI ROBOTIC',
            label: 'Tài khoản chính',
            qrTemplate: 'compact',
            isDefault: true,
          },
        ]);
      }
    }
  }, [settings, reset]);

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.put('/settings', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      alert('Đã lưu toàn bộ cài đặt thành công!');
    },
    onError: (err: any) => {
      alert('Lỗi lưu cài đặt: ' + (err.response?.data?.message || err.message));
    },
  });

  const onSubmit = (formData: any) => {
    mutation.mutate({
      ...formData,
      bankAccounts,
      defaultVatRate: Number(formData.defaultVatRate) || 10,
      nextInvoiceNumber: Number(formData.nextInvoiceNumber) || 1,
    });
  };

  const handleOpenAddBank = () => {
    resetBank({
      id: 'acc-' + Date.now(),
      bankCode: 'Vietcombank',
      bankAccount: '',
      bankAccountName: settings?.companyName || 'AI ROBOTIC',
      label: 'Tài khoản mới',
      qrTemplate: 'compact',
      isDefault: bankAccounts.length === 0,
    });
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const handleOpenEditBank = (acc: BankAccount) => {
    resetBank(acc);
    setEditingAccount(acc);
    setIsModalOpen(true);
  };

  const handleSaveBankAccount = (data: BankAccount) => {
    let updated: BankAccount[] = [];
    if (editingAccount) {
      updated = bankAccounts.map((a) => (a.id === data.id ? { ...data } : a));
    } else {
      updated = [...bankAccounts, { ...data, id: data.id || 'acc-' + Date.now() }];
    }

    // Nếu đánh dấu là mặc định, bỏ mặc định ở các tài khoản khác
    if (data.isDefault) {
      updated = updated.map((a) => ({
        ...a,
        isDefault: a.id === data.id,
      }));
    } else if (!updated.some((a) => a.isDefault) && updated.length > 0) {
      updated[0].isDefault = true;
    }

    setBankAccounts(updated);
    setIsModalOpen(false);
  };

  const handleSetDefaultBank = (id: string) => {
    const updated = bankAccounts.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    setBankAccounts(updated);
  };

  const handleDeleteBank = (id: string) => {
    if (bankAccounts.length === 1) {
      alert('Bạn cần giữ lại ít nhất 1 tài khoản ngân hàng để sinh mã VietQR!');
      return;
    }
    if (confirm('Bạn có chắc muốn xóa tài khoản ngân hàng này?')) {
      let updated = bankAccounts.filter((a) => a.id !== id);
      if (!updated.some((a) => a.isDefault) && updated.length > 0) {
        updated[0].isDefault = true;
      }
      setBankAccounts(updated);
    }
  };

  const watchedBankModal = watchBank();
  const testQrUrl =
    watchedBankModal.bankCode && watchedBankModal.bankAccount
      ? `https://qr.sepay.vn/img?bank=${watchedBankModal.bankCode}&acc=${watchedBankModal.bankAccount}&template=compact&amount=500000&des=TEST%20SEPAY`
      : '';

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Đang tải cấu hình cài đặt...</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cài Đặt Hệ Thống</h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý thông tin doanh nghiệp, danh sách tài khoản chuyển khoản VietQR và quy tắc hóa đơn
          </p>
        </div>

        <button
          onClick={handleSubmit(onSubmit)}
          disabled={mutation.isPending}
          className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-sm space-x-2 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{mutation.isPending ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* 1. THÔNG TIN DOANH NGHIỆP */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-base pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span>Thông Tin Đơn Vị Cung Cấp (Người Bán)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Tên Doanh Nghiệp / Đơn Vị
              </label>
              <input
                {...register('companyName')}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-900"
                placeholder="VD: CÔNG TY TNHH GIÁO DỤC AI ROBOTIC"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Mã Số Thuế (MST)
              </label>
              <input
                {...register('taxCode')}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="3603893101"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Hotline / Số Điện Thoại
              </label>
              <input
                {...register('phone')}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="0900000000"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Email Liên Hệ
              </label>
              <input
                {...register('email')}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="contact@airobotics.edu.vn"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Logo URL (Tùy chọn)
              </label>
              <input
                {...register('logoUrl')}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="https://domain.com/logo.png"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Địa Chỉ Doanh Nghiệp
              </label>
              <input
                {...register('address')}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Số 10 Huỳnh Văn Nghệ, P. Trấn Biên, Đồng Nai"
              />
            </div>
          </div>
        </div>

        {/* 2. QUẢN LÝ NHIỀU TÀI KHOẢN CHUYỂN KHOẢN VIETQR */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-base">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span>Danh Sách Tài Khoản Chuyển Khoản & VietQR (SePay)</span>
            </div>

            <button
              type="button"
              onClick={handleOpenAddBank}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Tài Khoản Ngân Hàng</span>
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Bạn có thể thêm nhiều tài khoản để lựa chọn linh hoạt khi lập hóa đơn cho từng dịch vụ hoặc khách hàng khác nhau.
          </p>

          {/* Bank Accounts Grid */}
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
                      <span className="inline-flex items-center space-x-1 bg-blue-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                        <Star className="w-3 h-3 fill-white" />
                        <span>Mặc định</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultBank(acc.id)}
                        className="text-[11px] text-slate-500 hover:text-blue-600 hover:underline"
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
                      onClick={() => handleOpenEditBank(acc)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteBank(acc.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="Xóa tài khoản"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. CẤU HÌNH HÓA ĐƠN & THUẾ */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-base pb-3 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-blue-600" />
            <span>Quy Tắc Đánh Số Hóa Đơn & Thuế Mặc Định</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Tiền Tố Số HĐ (Prefix)
              </label>
              <input
                {...register('invoicePrefix')}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                placeholder="HD"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Số Hóa Đơn Tiếp Theo
              </label>
              <input
                type="number"
                {...register('nextInvoiceNumber')}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                placeholder="1"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Thuế Suất VAT Mặc Định (%)
              </label>
              <input
                type="number"
                {...register('defaultVatRate')}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="10"
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md space-x-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{mutation.isPending ? 'Đang lưu...' : 'Lưu Toàn Bộ Cài Đặt'}</span>
          </button>
        </div>
      </form>

      {/* POPUP THÊM / SỬA TÀI KHOẢN NGÂN HÀNG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingAccount ? 'Chỉnh Sửa Tài Khoản Ngân Hàng' : 'Thêm Tài Khoản Ngân Hàng Mới'}
                  </h3>
                  <p className="text-xs text-slate-500">Cấu hình thông tin sinh mã VietQR SePay</p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200 transition-all font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Gợi Nhớ / Nhãn Tài Khoản
                </label>
                <input
                  type="text"
                  placeholder="VD: Tài khoản chính Vietcombank, MB Bank thu tiền..."
                  {...registerBank('label', { required: true })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngân Hàng (Bank Code) *
                  </label>
                  <select
                    {...registerBank('bankCode', { required: true })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
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
                    {...registerBank('bankAccount', { required: true })}
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
                  {...registerBank('bankAccountName', { required: true })}
                  className="w-full px-3.5 py-2 text-sm font-semibold uppercase border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefaultAcc"
                  {...registerBank('isDefault')}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="isDefaultAcc" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Đặt làm tài khoản nhận tiền mặc định cho hóa đơn mới
                </label>
              </div>

              {/* Live VietQR Preview Tester */}
              {testQrUrl && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center space-x-4">
                  <img src={testQrUrl} alt="VietQR Test" className="w-24 h-24 rounded-lg border bg-white p-1" />
                  <div className="text-xs text-slate-600 space-y-1">
                    <span className="font-bold text-slate-900 block text-xs flex items-center space-x-1">
                      <QrCode className="w-3.5 h-3.5 text-blue-600" />
                      <span>Xem thử mã VietQR</span>
                    </span>
                    <div>Ngân hàng: <strong>{watchedBankModal.bankCode}</strong></div>
                    <div>Số TK: <strong className="font-mono text-blue-700">{watchedBankModal.bankAccount}</strong></div>
                    <div>Chủ TK: <strong>{watchedBankModal.bankAccountName}</strong></div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-white flex justify-end items-center space-x-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleBankSubmit(handleSaveBankAccount)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Lưu Tài Khoản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
