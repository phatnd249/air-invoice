'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Building2,
  CreditCard,
  Save,
  Plus,
  Trash2,
  Star,
  QrCode,
  Sliders,
  Edit2,
  Phone,
  MapPin,
} from 'lucide-react';
import { CompanyProfile, BankAccountItem } from '@invoice/types';

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

type SettingsTabId = 'companies' | 'banks' | 'rules';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { toast, confirm } = useToast();

  const [activeTab, setActiveTab] = useState<SettingsTabId>('companies');
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>([]);

  // State modal công ty
  const [editingCompany, setEditingCompany] = useState<CompanyProfile | null>(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  // State modal ngân hàng
  const [editingAccount, setEditingAccount] = useState<BankAccountItem | null>(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  const settingsTabs: { id: SettingsTabId; label: string; icon: React.ElementType }[] = [
    { id: 'companies', label: 'Đơn vị cung cấp', icon: Building2 },
    { id: 'banks', label: 'Tài khoản & VietQR', icon: QrCode },
    { id: 'rules', label: 'Đánh số & VAT', icon: Sliders },
  ];

  // Form quy tắc (prefix, số tiếp theo, VAT)
  const rulesForm = useForm({
    defaultValues: {
      invoicePrefix: '',
      nextInvoiceNumber: 0,
      defaultVatRate: 10,
    },
  });

  // Form modal đơn vị cung cấp
  const {
    register: registerCompany,
    handleSubmit: handleCompanySubmit,
    reset: resetCompany,
  } = useForm<CompanyProfile>({
    defaultValues: {
      id: '',
      name: '',
      taxCode: '',
      address: '',
      phone: '',
      email: '',
      logoUrl: '',
      bankAccountId: '',
      isDefault: false,
    },
  });

  // Form modal ngân hàng
  const {
    register: registerBank,
    handleSubmit: handleBankSubmit,
    reset: resetBank,
    watch: watchBank,
  } = useForm<BankAccountItem>({
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
      rulesForm.reset({
        invoicePrefix: settings.invoicePrefix || 'HD',
        nextInvoiceNumber: settings.nextInvoiceNumber || 1,
        defaultVatRate: settings.defaultVatRate ?? 10,
      });

      // Danh sách công ty
      if (settings.companies && Array.isArray(settings.companies) && settings.companies.length > 0) {
        setCompanies(settings.companies);
      } else {
        setCompanies([
          {
            id: 'comp-' + Date.now(),
            name: settings.companyName || 'CÔNG TY TNHH GIÁO DỤC AI ROBOTIC',
            taxCode: settings.taxCode || '3603893101',
            address: settings.address || 'Số 10 Huỳnh Văn Nghệ, P. Trấn Biên, TP. Biên Hòa, Đồng Nai',
            phone: settings.phone || '0900000000',
            email: settings.email || 'contact@airobotics.edu.vn',
            logoUrl: settings.logoUrl || '',
            isDefault: true,
          },
        ]);
      }

      // Danh sách ngân hàng
      if (settings.bankAccounts && Array.isArray(settings.bankAccounts) && settings.bankAccounts.length > 0) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const saveSettings = useMutation({
    mutationFn: (payload: any) => api.put('/settings', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const persist = async (payload: any, successMsg: string) => {
    try {
      await saveSettings.mutateAsync(payload);
      toast('success', successMsg);
    } catch (err: any) {
      toast('error', 'Lưu thất bại', err.response?.data?.message || err.message);
    }
  };

  // --- XỬ LÝ CÔNG TY / ĐƠN VỊ CUNG CẤP (tự lưu) ---
  const autoSaveCompanies = (updated: CompanyProfile[]) => {
    setCompanies(updated);
    persist({ companies: updated }, 'Đã lưu danh sách đơn vị cung cấp');
  };

  const handleOpenAddCompany = () => {
    resetCompany({
      id: 'comp-' + Date.now(),
      name: '',
      taxCode: '',
      address: '',
      phone: '',
      email: '',
      logoUrl: '',
      bankAccountId: bankAccounts[0]?.id || '',
      isDefault: companies.length === 0,
    });
    setEditingCompany(null);
    setIsCompanyModalOpen(true);
  };

  const handleOpenEditCompany = (comp: CompanyProfile) => {
    resetCompany(comp);
    setEditingCompany(comp);
    setIsCompanyModalOpen(true);
  };

  const handleSaveCompany = (data: CompanyProfile) => {
    let updated: CompanyProfile[] = [];
    if (editingCompany) {
      updated = companies.map((c) => (c.id === data.id ? { ...data } : c));
    } else {
      updated = [...companies, { ...data, id: data.id || 'comp-' + Date.now() }];
    }

    if (data.isDefault) {
      updated = updated.map((c) => ({
        ...c,
        isDefault: c.id === data.id,
      }));
    } else if (!updated.some((c) => c.isDefault) && updated.length > 0) {
      updated[0].isDefault = true;
    }

    setIsCompanyModalOpen(false);
    autoSaveCompanies(updated);
  };

  const handleSetDefaultCompany = (id: string) => {
    const updated = companies.map((c) => ({
      ...c,
      isDefault: c.id === id,
    }));
    autoSaveCompanies(updated);
  };

  const handleDeleteCompany = async (id: string) => {
    if (companies.length <= 1) {
      toast('warning', 'Không thể xóa', 'Bạn cần giữ lại ít nhất 1 đơn vị cung cấp.');
      return;
    }
    const ok = await confirm({
      title: 'Xóa đơn vị cung cấp?',
      message: 'Thông tin đơn vị sẽ bị xóa khỏi danh sách và lưu lại ngay lập tức.',
      confirmLabel: 'Xóa',
      danger: true,
    });
    if (!ok) return;
    let updated = companies.filter((c) => c.id !== id);
    if (!updated.some((c) => c.isDefault) && updated.length > 0) {
      updated[0].isDefault = true;
    }
    autoSaveCompanies(updated);
  };

  // --- XỬ LÝ TÀI KHOẢN NGÂN HÀNG (tự lưu) ---
  const autoSaveBanks = (updated: BankAccountItem[]) => {
    setBankAccounts(updated);
    persist({ bankAccounts: updated }, 'Đã lưu danh sách tài khoản ngân hàng');
  };

  const handleOpenAddBank = () => {
    resetBank({
      id: 'acc-' + Date.now(),
      bankCode: 'Vietcombank',
      bankAccount: '',
      bankAccountName: companies[0]?.name || 'AI ROBOTIC',
      label: 'Tài khoản mới',
      qrTemplate: 'compact',
      isDefault: bankAccounts.length === 0,
    });
    setEditingAccount(null);
    setIsBankModalOpen(true);
  };

  const handleOpenEditBank = (acc: BankAccountItem) => {
    resetBank(acc);
    setEditingAccount(acc);
    setIsBankModalOpen(true);
  };

  const handleSaveBankAccount = (data: BankAccountItem) => {
    let updated: BankAccountItem[] = [];
    if (editingAccount) {
      updated = bankAccounts.map((a) => (a.id === data.id ? { ...data } : a));
    } else {
      updated = [...bankAccounts, { ...data, id: data.id || 'acc-' + Date.now() }];
    }

    if (data.isDefault) {
      updated = updated.map((a) => ({
        ...a,
        isDefault: a.id === data.id,
      }));
    } else if (!updated.some((a) => a.isDefault) && updated.length > 0) {
      updated[0].isDefault = true;
    }

    setIsBankModalOpen(false);
    autoSaveBanks(updated);
  };

  const handleSetDefaultBank = (id: string) => {
    const updated = bankAccounts.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    autoSaveBanks(updated);
  };

  const handleDeleteBank = async (id: string) => {
    if (bankAccounts.length === 1) {
      toast('warning', 'Không thể xóa', 'Bạn cần giữ lại ít nhất 1 tài khoản ngân hàng để sinh mã VietQR.');
      return;
    }
    const ok = await confirm({
      title: 'Xóa tài khoản ngân hàng?',
      message: 'Tài khoản sẽ bị xóa khỏi danh sách và lưu lại ngay lập tức.',
      confirmLabel: 'Xóa',
      danger: true,
    });
    if (!ok) return;
    let updated = bankAccounts.filter((a) => a.id !== id);
    if (!updated.some((a) => a.isDefault) && updated.length > 0) {
      updated[0].isDefault = true;
    }
    autoSaveBanks(updated);
  };

  // --- XỬ LÝ QUY TẮC (cần nút xác nhận) ---
  const onSaveRules = async (data: any) => {
    await persist(
      {
        invoicePrefix: data.invoicePrefix,
        nextInvoiceNumber: Number(data.nextInvoiceNumber) || 1,
        defaultVatRate: Number(data.defaultVatRate) || 10,
      },
      'Đã lưu quy tắc đánh số hóa đơn & thuế'
    );
  };

  const watchedBankModal = watchBank();
  const testQrUrl =
    watchedBankModal.bankCode && watchedBankModal.bankAccount
      ? `https://qr.sepay.vn/img?bank=${watchedBankModal.bankCode}&acc=${watchedBankModal.bankAccount}&template=compact&amount=500000&des=TEST%20SEPAY`
      : '';

  if (isLoading) {
    return (
      <div className="min-h-[40vh] p-8 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-sm font-medium">Đang tải cấu hình cài đặt...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cài Đặt Hệ Thống</h1>
        <p className="text-sm text-slate-500 mt-1">
          Quản lý đơn vị cung cấp, tài khoản VietQR và quy tắc đánh số hóa đơn
        </p>
      </div>

      {/* Sticky Tab Navigation */}
      <div className="sticky top-16 z-20 bg-slate-50/90 -mx-2 px-2 pb-2 backdrop-blur">
        <nav className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-xs w-fit">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* === TAB: ĐƠN VỊ CUNG CẤP === */}
      {activeTab === 'companies' && (
        <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-base">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>Danh Sách Đơn Vị Cung Cấp (Người Bán)</span>
            </div>

            <button
              type="button"
              onClick={handleOpenAddCompany}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200 transition-colors"
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
                  className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${comp.isDefault
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
                          <span className="text-[11px] font-mono text-slate-500">
                            MST: <strong className="text-slate-700">{comp.taxCode || 'Chưa cập nhật'}</strong>
                          </span>
                        </div>
                      </div>

                      {comp.isDefault ? (
                        <span className="inline-flex items-center space-x-1 bg-blue-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs shrink-0">
                          <Star className="w-3 h-3 fill-white" />
                          <span>Mặc định</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultCompany(comp.id)}
                          className="text-[11px] text-slate-500 hover:text-blue-600 hover:underline shrink-0"
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
                          <span className="font-medium text-[11px]">
                            TK liên kết: {linkedBank.bankCode} - {linkedBank.bankAccount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-3 mt-3 border-t border-slate-200/70">
                    <button
                      type="button"
                      onClick={() => handleOpenEditCompany(comp)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Chỉnh sửa đơn vị"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteCompany(comp.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
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
      )}

      {/* === TAB: TÀI KHOẢN & VIETQR === */}
      {activeTab === 'banks' && (
        <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-5">
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
            Thêm nhiều tài khoản để lựa chọn linh hoạt khi lập hóa đơn. Thay đổi được lưu tự động ngay khi thêm, sửa, xóa hoặc đổi tài khoản mặc định.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bankAccounts.map((acc, idx) => (
              <div
                key={acc.id || idx}
                className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${acc.isDefault
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
        </section>
      )}

      {/* === TAB: ĐÁNH SỐ & VAT === */}
      {activeTab === 'rules' && (
        <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-base pb-3 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-blue-600" />
            <span>Quy Tắc Đánh Số Hóa Đơn & Thuế Mặc Định</span>
          </div>

          <p className="text-xs text-slate-500">
            Các quy tắc này cần xác nhận lại trước khi lưu để tránh thay đổi số hóa đơn ngoài ý muốn.
          </p>

          <form onSubmit={rulesForm.handleSubmit(onSaveRules)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Tiền Tố Số HĐ (Prefix)
                </label>
                <input
                  {...rulesForm.register('invoicePrefix')}
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
                  {...rulesForm.register('nextInvoiceNumber')}
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
                  {...rulesForm.register('defaultVatRate')}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="10"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={saveSettings.isPending}
                className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-sm space-x-2 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saveSettings.isPending ? 'Đang lưu...' : 'Lưu Quy Tắc'}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* POPUP THÊM / SỬA ĐƠN VỊ CUNG CẤP */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
                onClick={() => setIsCompanyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200 transition-all font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Doanh Nghiệp / Đơn Vị Phát Hành *
                </label>
                <input
                  type="text"
                  placeholder="VD: CÔNG TY TNHH GIÁO DỤC AI ROBOTIC"
                  {...registerCompany('name', { required: true })}
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
                    {...registerCompany('taxCode')}
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
                    {...registerCompany('phone')}
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
                    {...registerCompany('email')}
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
                    {...registerCompany('logoUrl')}
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
                  {...registerCompany('address')}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tài Khoản Ngân Hàng Mặc Định Cho Đơn Vị Này
                </label>
                <select
                  {...registerCompany('bankAccountId')}
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
                  {...registerCompany('isDefault')}
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
                onClick={() => setIsCompanyModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCompanySubmit(handleSaveCompany)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                {editingCompany ? 'Lưu Thay Đổi' : 'Thêm Đơn Vị'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP THÊM / SỬA TÀI KHOẢN NGÂN HÀNG */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
                onClick={() => setIsBankModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200 transition-all font-bold text-sm"
              >
                ✕
              </button>
            </div>

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

            <div className="p-4 border-t border-slate-200 bg-white flex justify-end items-center space-x-3">
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleBankSubmit(handleSaveBankAccount)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                {editingAccount ? 'Lưu Thay Đổi' : 'Thêm Tài Khoản'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
