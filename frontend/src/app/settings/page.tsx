'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { CompanyProfile, BankAccountItem } from '@invoice/types';
import { SettingsTabId } from '@/components/settings/types';
import { SettingsTabsNav } from '@/components/settings/SettingsTabsNav';
import { CompaniesTab } from '@/components/settings/CompaniesTab';
import { CompanyModal } from '@/components/settings/CompanyModal';
import { BanksTab } from '@/components/settings/BanksTab';
import { BankModal } from '@/components/settings/BankModal';
import { FormatsTab } from '@/components/settings/FormatsTab';
import { InvoiceRulesTab } from '@/components/settings/InvoiceRulesTab';
import { NotificationsTab } from '@/components/settings/NotificationsTab';
import { ZaloConfigModal } from '@/components/settings/ZaloConfigModal';

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

  // State Cấu hình Thông báo (Email & Zalo Bot)
  const [enableEmail, setEnableEmail] = useState<boolean>(true);
  const [enableZalo, setEnableZalo] = useState<boolean>(false);
  const [zaloBotId, setZaloBotId] = useState<string>('');
  const [zaloApiKey, setZaloApiKey] = useState<string>('');
  const [zaloApiBaseUrl, setZaloApiBaseUrl] = useState<string>('https://sms-service.talab.io.vn/api/gateway/v1.0');
  const [zaloAutoFriendRequest, setZaloAutoFriendRequest] = useState<boolean>(false);
  const [zaloAliasPrefix, setZaloAliasPrefix] = useState<string>('KH_');
  const [zaloMessageTemplate, setZaloMessageTemplate] = useState<string>('');

  // State Mẫu Email Nhắc Hạn & Cảnh Báo Hệ Thống
  const [emailAlertSubject, setEmailAlertSubject] = useState<string>('');
  const [emailAlertBody, setEmailAlertBody] = useState<string>('');

  // State Modal Zalo
  const [isZaloModalOpen, setIsZaloModalOpen] = useState(false);

  // State quy tắc hóa đơn & thuế
  const [invoiceRules, setInvoiceRules] = useState<{
    invoicePrefix: string;
    nextInvoiceNumber: number;
    defaultVatRate: number;
  }>({
    invoicePrefix: 'HD',
    nextInvoiceNumber: 1,
    defaultVatRate: 10,
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
      setInvoiceRules({
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

      // Cấu hình thông báo
      setEnableEmail(settings.enableEmailNotification ?? true);
      setEnableZalo(settings.enableZaloNotification ?? false);
      setZaloBotId(settings.zaloBotId || '');
      setZaloApiKey(settings.zaloApiKey || '');
      setZaloApiBaseUrl(settings.zaloApiBaseUrl || 'https://sms-service.talab.io.vn/api/gateway/v1.0');
      setZaloAutoFriendRequest(settings.zaloAutoFriendRequest ?? false);
      setZaloAliasPrefix(settings.zaloAliasPrefix || 'KH_');
      setZaloMessageTemplate(settings.zaloMessageTemplate || '');

      // Mẫu email nhắc hạn & cảnh báo
      if (settings.emailAlertSubject != null) setEmailAlertSubject(settings.emailAlertSubject);
      if (settings.emailAlertBody != null) setEmailAlertBody(settings.emailAlertBody);
    }
  }, [settings]);

  // Đóng modal khi bấm phím Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCompanyModalOpen(false);
        setIsBankModalOpen(false);
        setIsZaloModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // --- XỬ LÝ CÔNG TY / ĐƠN VỊ CUNG CẤP ---
  const autoSaveCompanies = (updated: CompanyProfile[]) => {
    setCompanies(updated);
    persist({ companies: updated }, 'Đã lưu danh sách đơn vị cung cấp');
  };

  const handleOpenAddCompany = () => {
    setEditingCompany(null);
    setIsCompanyModalOpen(true);
  };

  const handleOpenEditCompany = (comp: CompanyProfile) => {
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

  const handleSetDefaultCompany = (id?: string) => {
    if (!id) return;
    const updated = companies.map((c) => ({
      ...c,
      isDefault: c.id === id,
    }));
    autoSaveCompanies(updated);
  };

  const handleDeleteCompany = async (id?: string) => {
    if (!id) return;
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

  // --- XỬ LÝ TÀI KHOẢN NGÂN HÀNG ---
  const autoSaveBanks = (updated: BankAccountItem[]) => {
    setBankAccounts(updated);
    persist({ bankAccounts: updated }, 'Đã lưu danh sách tài khoản ngân hàng');
  };

  const handleOpenAddBank = () => {
    setEditingAccount(null);
    setIsBankModalOpen(true);
  };

  const handleOpenEditBank = (acc: BankAccountItem) => {
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

  const handleSetDefaultBank = (id?: string) => {
    if (!id) return;
    const updated = bankAccounts.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    autoSaveBanks(updated);
  };

  const handleDeleteBank = async (id?: string) => {
    if (!id) return;
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
    if (!updated.some((c) => c.isDefault) && updated.length > 0) {
      updated[0].isDefault = true;
    }
    autoSaveBanks(updated);
  };

  // --- XỬ LÝ CẤU HÌNH THÔNG BÁO ---
  const handleToggleEmail = async (checked: boolean) => {
    setEnableEmail(checked);
    await persist(
      { enableEmailNotification: checked },
      checked ? 'Đã bật gửi thông báo Email tự động' : 'Đã tắt gửi thông báo Email'
    );
  };

  const handleToggleZalo = async (checked: boolean) => {
    if (checked && (!zaloBotId || !zaloApiKey)) {
      toast('warning', 'Chưa cấu hình Zalo Bot', 'Vui lòng điền Bot ID và API Key trước khi bật.');
      setIsZaloModalOpen(true);
      return;
    }
    setEnableZalo(checked);
    await persist(
      { enableZaloNotification: checked },
      checked ? 'Đã bật gửi thông báo Zalo Bot' : 'Đã tắt gửi thông báo Zalo Bot'
    );
  };

  const handleSaveZaloConfig = async (config: {
    zaloBotId: string;
    zaloApiKey: string;
    zaloApiBaseUrl: string;
    zaloAutoFriendRequest: boolean;
    zaloAliasPrefix: string;
  }) => {
    setZaloBotId(config.zaloBotId);
    setZaloApiKey(config.zaloApiKey);
    setZaloApiBaseUrl(config.zaloApiBaseUrl);
    setZaloAutoFriendRequest(config.zaloAutoFriendRequest);
    setZaloAliasPrefix(config.zaloAliasPrefix);
    await persist(config, 'Đã lưu cấu hình Zalo Bot');
  };

  const handleSaveZaloTemplate = async () => {
    await persist({ zaloMessageTemplate }, 'Đã lưu mẫu tin nhắn Zalo');
  };

  const handleSaveEmailTemplate = async () => {
    await persist(
      { emailAlertSubject, emailAlertBody },
      'Đã lưu mẫu email nhắc hạn & cảnh báo dịch vụ'
    );
  };

  // --- XỬ LÝ QUY TẮC ĐÁNH SỐ & THUẾ ---
  const onSaveInvoiceRules = async (data: {
    invoicePrefix: string;
    nextInvoiceNumber: number;
    defaultVatRate: number;
  }) => {
    setInvoiceRules(data);
    await persist(
      {
        invoicePrefix: data.invoicePrefix,
        nextInvoiceNumber: Number(data.nextInvoiceNumber) || 1,
        defaultVatRate: Number(data.defaultVatRate) || 10,
      },
      'Đã lưu quy tắc đánh số hóa đơn & thuế'
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-[40vh] p-8 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-sm font-medium">Đang tải cấu hình cài đặt...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* 1. Header */}
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Cài Đặt Hệ Thống</h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1.5">
          Quản lý đơn vị cung cấp, tài khoản VietQR, quy tắc hóa đơn và cấu hình thông báo
        </p>
      </div>

      {/* 2. Sticky Tab Navigation */}
      <SettingsTabsNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 3. Tab: Đơn Vị Cung Cấp */}
      {activeTab === 'companies' && (
        <CompaniesTab
          companies={companies}
          bankAccounts={bankAccounts}
          onOpenAdd={handleOpenAddCompany}
          onOpenEdit={handleOpenEditCompany}
          onDelete={handleDeleteCompany}
          onSetDefault={handleSetDefaultCompany}
        />
      )}

      {/* 4. Tab: Tài Khoản VietQR */}
      {activeTab === 'banks' && (
        <BanksTab
          bankAccounts={bankAccounts}
          onOpenAdd={handleOpenAddBank}
          onOpenEdit={handleOpenEditBank}
          onDelete={handleDeleteBank}
          onSetDefault={handleSetDefaultBank}
        />
      )}

      {/* 5. Tab: Định Dạng Nội Dung */}
      {activeTab === 'formats' && <FormatsTab />}

      {/* 6. Tab: Đánh Số & Thuế */}
      {activeTab === 'rules' && (
        <InvoiceRulesTab
          initialValues={invoiceRules}
          onSave={onSaveInvoiceRules}
          isSaving={saveSettings.isPending}
        />
      )}

      {/* 7. Tab: Cấu Hình Thông Báo */}
      {activeTab === 'notifications' && (
        <NotificationsTab
          enableEmail={enableEmail}
          onToggleEmail={handleToggleEmail}
          enableZalo={enableZalo}
          onToggleZalo={handleToggleZalo}
          zaloBotId={zaloBotId}
          zaloApiKey={zaloApiKey}
          zaloApiBaseUrl={zaloApiBaseUrl}
          zaloAutoFriendRequest={zaloAutoFriendRequest}
          zaloAliasPrefix={zaloAliasPrefix}
          onOpenZaloModal={() => setIsZaloModalOpen(true)}
          zaloMessageTemplate={zaloMessageTemplate}
          setZaloMessageTemplate={setZaloMessageTemplate}
          onSaveZaloTemplate={handleSaveZaloTemplate}
          isSavingZaloTemplate={saveSettings.isPending}
          emailAlertSubject={emailAlertSubject}
          setEmailAlertSubject={setEmailAlertSubject}
          emailAlertBody={emailAlertBody}
          setEmailAlertBody={setEmailAlertBody}
          onSaveEmailTemplate={handleSaveEmailTemplate}
          isSavingEmailTemplate={saveSettings.isPending}
        />
      )}

      {/* Modal: Đơn Vị Cung Cấp */}
      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        editingCompany={editingCompany}
        bankAccounts={bankAccounts}
        onSave={handleSaveCompany}
      />

      {/* Modal: Tài Khoản Ngân Hàng */}
      <BankModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        editingAccount={editingAccount}
        onSave={handleSaveBankAccount}
      />

      {/* Modal: Cấu Hình Zalo Bot */}
      <ZaloConfigModal
        isOpen={isZaloModalOpen}
        onClose={() => setIsZaloModalOpen(false)}
        zaloBotId={zaloBotId}
        zaloApiKey={zaloApiKey}
        zaloApiBaseUrl={zaloApiBaseUrl}
        zaloAutoFriendRequest={zaloAutoFriendRequest}
        zaloAliasPrefix={zaloAliasPrefix}
        onSave={handleSaveZaloConfig}
      />
    </div>
  );
}
