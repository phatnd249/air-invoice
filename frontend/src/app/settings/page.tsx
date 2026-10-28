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
  Bell,
  Mail,
  MessageSquare,
  Bot,
  Key,
  Eye,
  EyeOff,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Info,
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

type SettingsTabId = 'companies' | 'banks' | 'rules' | 'notifications';

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
  const [modalBotId, setModalBotId] = useState('');
  const [modalApiKey, setModalApiKey] = useState('');
  const [modalBaseUrl, setModalBaseUrl] = useState('https://sms-service.talab.io.vn/api/gateway/v1.0');
  const [modalAutoFriend, setModalAutoFriend] = useState(false);
  const [modalAliasPrefix, setModalAliasPrefix] = useState('KH_');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [isTestingZalo, setIsTestingZalo] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; raw?: any } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const settingsTabs: { id: SettingsTabId; label: string; icon: React.ElementType }[] = [
    { id: 'companies', label: 'Đơn vị cung cấp', icon: Building2 },
    { id: 'banks', label: 'Tài khoản & VietQR', icon: QrCode },
    { id: 'rules', label: 'Đánh số & VAT', icon: Sliders },
    { id: 'notifications', label: 'Cấu hình Thông báo', icon: Bell },
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
      handleOpenZaloModal();
      return;
    }
    setEnableZalo(checked);
    await persist(
      { enableZaloNotification: checked },
      checked ? 'Đã bật gửi thông báo Zalo Bot' : 'Đã tắt gửi thông báo Zalo Bot'
    );
  };

  const handleOpenZaloModal = () => {
    setModalBotId(zaloBotId);
    setModalApiKey(zaloApiKey);
    setModalBaseUrl(zaloApiBaseUrl || 'https://sms-service.talab.io.vn/api/gateway/v1.0');
    setModalAutoFriend(zaloAutoFriendRequest);
    setModalAliasPrefix(zaloAliasPrefix || 'KH_');
    setTestResult(null);
    setIsZaloModalOpen(true);
  };

  const handleSaveZaloConfig = async () => {
    const payload = {
      zaloBotId: modalBotId.trim(),
      zaloApiKey: modalApiKey.trim(),
      zaloApiBaseUrl: modalBaseUrl.trim() || 'https://sms-service.talab.io.vn/api/gateway/v1.0',
      zaloAutoFriendRequest: modalAutoFriend,
      zaloAliasPrefix: modalAliasPrefix.trim() || 'KH_',
    };
    setZaloBotId(payload.zaloBotId);
    setZaloApiKey(payload.zaloApiKey);
    setZaloApiBaseUrl(payload.zaloApiBaseUrl);
    setZaloAutoFriendRequest(payload.zaloAutoFriendRequest);
    setZaloAliasPrefix(payload.zaloAliasPrefix);
    await persist(payload, 'Đã lưu cấu hình Zalo Bot');
    setIsZaloModalOpen(false);
  };

  const handleTestZalo = async () => {
    if (!modalBotId || !modalApiKey) {
      toast('warning', 'Thiếu thông tin Bot', 'Vui lòng nhập Bot ID và API Key trước khi gửi thử.');
      return;
    }
    if (!testPhone) {
      toast('warning', 'Thiếu số điện thoại', 'Vui lòng nhập số điện thoại người nhận thử.');
      return;
    }
    setIsTestingZalo(true);
    setTestResult(null);
    try {
      const res = await api.post('/delivery/test-zalo', {
        baseUrl: modalBaseUrl || 'https://sms-service.talab.io.vn/api/gateway/v1.0',
        botId: modalBotId.trim(),
        apiKey: modalApiKey.trim(),
        testPhone: testPhone.trim(),
      });
      setTestResult(res.data);
      if (res.data?.success) {
        toast('success', 'Gửi tin nhắn thử thành công!', 'Kiểm tra thông báo Zalo trên điện thoại.');
      } else {
        toast('error', 'Gửi không thành công', res.data?.message || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      setTestResult({ success: false, message: msg });
      toast('error', 'Lỗi kết nối Zalo Gateway', msg);
    } finally {
      setIsTestingZalo(false);
    }
  };

  const handleSaveTemplate = async () => {
    await persist(
      { zaloMessageTemplate },
      'Đã lưu mẫu tin nhắn Zalo'
    );
  };

  const handleSaveEmailTemplate = async () => {
    await persist(
      { emailAlertSubject, emailAlertBody },
      'Đã lưu mẫu email nhắc hạn & cảnh báo dịch vụ'
    );
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

      {/* === TAB: CẤU HÌNH THÔNG BÁO (EMAIL & ZALO BOT) === */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* Email Notification Card */}
          <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>Gửi Hóa Đơn Tự Động Qua Email (SMTP)</span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        enableEmail
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {enableEmail ? 'Đang Bật' : 'Đang Tắt'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tự động gửi hóa đơn kèm mã QR thanh toán và đường dẫn xem online đến email khách hàng khi tạo hóa đơn.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={enableEmail}
                  onChange={(e) => handleToggleEmail(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
              <div className="space-y-1">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Dịch vụ SMTP Máy Chủ Đã Sẵn Sàng</span>
                </div>
                <p className="text-slate-500">
                  Cấu hình gửi mail được quản lý an toàn qua biến môi trường máy chủ (SMTP host, port, user, pass).
                </p>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Template: invoice-notification.html</span>
            </div>
          </section>

          {/* Zalo Bot Notification Card */}
          <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>Gửi Hóa Đơn Qua Zalo Bot (SMS-Service / Talab)</span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        enableZalo && zaloBotId && zaloApiKey
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {enableZalo && zaloBotId && zaloApiKey
                        ? 'Đang Bật'
                        : !zaloBotId || !zaloApiKey
                        ? 'Chưa Cấu Hình Bot'
                        : 'Đang Tắt'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gửi tin nhắn trực tiếp đến Zalo của khách hàng bằng số điện thoại. Hỗ trợ tự động kết bạn (Batch Friend Request).
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={enableZalo}
                  onChange={(e) => handleToggleZalo(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Zalo Status & Config Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Thông Tin Bot & Kết Nối</div>
                <div className="text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Zalo Bot ID:</span>
                    <strong className="font-mono text-slate-800">
                      {zaloBotId ? zaloBotId : <span className="text-amber-600 font-normal">Chưa thiết lập</span>}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">x-api-key:</span>
                    <strong className="font-mono text-slate-800">
                      {zaloApiKey ? `${zaloApiKey.slice(0, 6)}••••••••` : <span className="text-amber-600 font-normal">Chưa thiết lập</span>}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Tự động kết bạn:</span>
                    <span className={`font-semibold ${zaloAutoFriendRequest ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {zaloAutoFriendRequest ? `Bật (Tiền tố: ${zaloAliasPrefix || 'KH_'})` : 'Tắt'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cổng API Gateway</div>
                  <p className="text-xs font-mono text-slate-700 truncate" title={zaloApiBaseUrl}>
                    {zaloApiBaseUrl || 'https://sms-service.talab.io.vn/api/gateway/v1.0'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    API Nhắn tin & Kết Bạn Batch hỗ trợ gửi cho người lạ không cần qua OA ZNS.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleOpenZaloModal}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Key className="w-4 h-4" />
                    <span>Cấu Hình Zalo Bot (API Key & Bot ID)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Template Box */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Mẫu Tin Nhắn Zalo Gửi Khách Hàng
                  </h4>
                  <p className="text-xs text-slate-500">
                    Bấm vào các thẻ biến bên dưới để chèn vào nội dung tin nhắn. Để trống để sử dụng mẫu chuẩn mặc định.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={saveSettings.isPending}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saveSettings.isPending ? 'Đang lưu...' : 'Lưu Mẫu'}</span>
                </button>
              </div>

              {/* Variable Chips */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { tag: '{{customerName}}', desc: 'Tên người nhận' },
                  { tag: '{{invoiceNumber}}', desc: 'Mã số hóa đơn' },
                  { tag: '{{totalAmount}}', desc: 'Tổng tiền thanh toán' },
                  { tag: '{{viewUrl}}', desc: 'Link xem online' },
                  { tag: '{{pdfUrl}}', desc: 'Link tải PDF' },
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => {
                      setZaloMessageTemplate((prev) => (prev ? `${prev} ${item.tag}` : item.tag));
                    }}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-mono transition-colors"
                    title={item.desc}
                  >
                    <span>{item.tag}</span>
                    <span className="text-[10px] text-blue-400 font-sans">({item.desc})</span>
                  </button>
                ))}
              </div>

              <textarea
                value={zaloMessageTemplate}
                onChange={(e) => setZaloMessageTemplate(e.target.value)}
                rows={4}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-sans focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
                placeholder={`[Thông báo Hóa đơn]
Kính gửi {{customerName}},
Hệ thống xin gửi Quý khách hóa đơn {{invoiceNumber}} với số tiền thanh toán là {{totalAmount}}.

Xem chi tiết và mã VietQR thanh toán tại:
{{viewUrl}}

Tải file PDF trực tiếp:
{{pdfUrl}}

Trân trọng!`}
              />
            </div>
          </section>

          {/* Email Alert & Subscription Reminder Template Card */}
          <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Mẫu Tin Nhắn Email Cảnh Báo & Nhắc Hạn Dịch Vụ
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cấu hình tiêu đề và lời nhắn mở đầu email gửi khách hàng khi dịch vụ / hợp đồng sắp hết hạn.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveEmailTemplate}
                disabled={saveSettings.isPending}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>{saveSettings.isPending ? 'Đang lưu...' : 'Lưu Mẫu Email'}</span>
              </button>
            </div>

            {/* Placeholders */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 text-xs text-slate-600 space-y-2">
              <div className="font-bold text-blue-900 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Các biến tự động chèn dữ liệu (bấm để thêm vào nội dung):</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { tag: '{customerName}', desc: 'Tên KH' },
                  { tag: '{serviceName}', desc: 'Tên gói' },
                  { tag: '{daysRemaining}', desc: 'Số ngày còn' },
                  { tag: '{endDate}', desc: 'Ngày hết hạn' },
                  { tag: '{servicePrice}', desc: 'Giá gói' },
                  { tag: '{staffName}', desc: 'Người phụ trách' },
                  { tag: '{companyName}', desc: 'Tên công ty' },
                  { tag: '{hotline}', desc: 'Hotline' },
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => setEmailAlertBody((prev) => (prev ? `${prev} ${item.tag}` : item.tag))}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-mono transition-colors"
                    title={`Chèn ${item.tag} (${item.desc})`}
                  >
                    <span>{item.tag}</span>
                    <span className="text-[10px] text-blue-400 font-sans">({item.desc})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Tiêu Đề Email Mặc Định
                </label>
                <input
                  type="text"
                  value={emailAlertSubject}
                  onChange={(e) => setEmailAlertSubject(e.target.value)}
                  placeholder='VD: [THÔNG BÁO GIA HẠN DỊCH VỤ] Gói "{serviceName}" của {customerName} {daysRemaining}'
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Nếu để trống, hệ thống sẽ tự động dùng tiêu đề tiêu chuẩn.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Nội Dung / Lời Nhắn Mở Đầu Email
                </label>
                <textarea
                  rows={4}
                  value={emailAlertBody}
                  onChange={(e) => setEmailAlertBody(e.target.value)}
                  placeholder="VD: Kính gửi Quý khách hàng, hệ thống xin thông báo gói dịch vụ của Quý khách sắp đến thời hạn gia hạn. Quý khách vui lòng kiểm tra và liên hệ hỗ trợ để dịch vụ không bị gián đoạn..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Nội dung này sẽ hiển thị trang trọng ở phần đầu email gửi đến khách hàng kèm bảng chi tiết gói dịch vụ và thông tin người phụ trách.
                </p>
              </div>
            </div>
          </section>

          {/* Webhook Landing Page Card */}
          <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-base pb-3 border-b border-slate-100">
              <Bot className="w-5 h-5 text-blue-600" />
              <span>Tích Hợp Landing Page Webhook (Tạo Hóa Đơn & Gửi Tự Động)</span>
            </div>

            <p className="text-xs text-slate-600">
              Khi khách hàng điền form trên Landing Page, hệ thống của bạn chỉ cần gửi thông tin qua Webhook API dưới đây. Backend sẽ tự động lập hóa đơn, tạo mã VietQR, đồng thời kích hoạt gửi <strong>Email</strong> và <strong>Zalo</strong> theo cấu hình ở trên.
            </p>

            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-emerald-400 font-bold">POST /api/invoices/quick-create</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('https://invoice-backend-5tbi.onrender.com/api/invoices/quick-create');
                    setCopiedWebhook(true);
                    setTimeout(() => setCopiedWebhook(false), 2000);
                  }}
                  className="text-slate-400 hover:text-white flex items-center space-x-1 text-[11px]"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWebhook ? 'Đã sao chép' : 'Sao chép URL'}</span>
                </button>
              </div>

              <div className="text-slate-300">
                <span className="text-slate-500">// Ví dụ Payload JSON gửi từ Landing Page:</span>
                <pre className="text-amber-300 mt-1 whitespace-pre-wrap">
{`{
  "customerName": "Nguyễn Văn A",
  "customerPhone": "0334551531",
  "customerEmail": "nguyenvana@example.com",
  "amount": 500000,
  "description": "Thanh toán khóa học STEM Robotic",
  "notes": "Đăng ký từ landing page"
}`}
                </pre>
              </div>
            </div>
          </section>
        </div>
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
      {/* POPUP CẤU HÌNH ZALO BOT (API KEY & BOT ID) */}
      {isZaloModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Cấu Hình Zalo Bot Gateway
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kết nối SMS-Service Gateway (https://sms-service.talab.io.vn)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsZaloModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200 transition-all font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              {/* Bot ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Zalo Bot ID (bot_id) *
                </label>
                <input
                  type="text"
                  value={modalBotId}
                  onChange={(e) => setModalBotId(e.target.value)}
                  placeholder="VD: 6867341... hoặc ID bot trên hệ thống Talab"
                  className="w-full px-3.5 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* API Key */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  API Key (x-api-key) *
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={modalApiKey}
                    onChange={(e) => setModalApiKey(e.target.value)}
                    placeholder="VD: d58ef8b4-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full px-3.5 py-2 pr-10 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Gateway URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gateway API Base URL
                </label>
                <input
                  type="text"
                  value={modalBaseUrl}
                  onChange={(e) => setModalBaseUrl(e.target.value)}
                  placeholder="https://sms-service.talab.io.vn/api/gateway/v1.0"
                  className="w-full px-3.5 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Friend Request Settings */}
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-3">
                <div className="flex items-start space-x-2.5">
                  <input
                    type="checkbox"
                    id="autoFriendCheck"
                    checked={modalAutoFriend}
                    onChange={(e) => setModalAutoFriend(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-0.5"
                  />
                  <label htmlFor="autoFriendCheck" className="text-xs text-slate-700 cursor-pointer font-medium">
                    Tự động gửi lời mời kết bạn (Batch Friend Request) khi nhắn tin cho số lạ
                    <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                      Giúp khách hàng dễ nhận thông báo và tin nhắn không bị đưa vào thư mục người lạ.
                    </span>
                  </label>
                </div>

                {modalAutoFriend && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tiền Tố Đổi Tên Gợi Nhớ (alias_prefix)
                    </label>
                    <input
                      type="text"
                      value={modalAliasPrefix}
                      onChange={(e) => setModalAliasPrefix(e.target.value)}
                      placeholder="KH_"
                      className="w-32 px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                    <span className="text-[11px] text-slate-400 ml-2">VD: KH_Nguyễn Văn A</span>
                  </div>
                )}
              </div>

              {/* Test Message Box */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <Send className="w-3.5 h-3.5 text-blue-600" />
                  <span>Thử Nghiệm Gửi Tin Nhắn Zalo Thực Tế</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="Nhập số điện thoại Zalo thử (VD: 0334551531)"
                    className="flex-1 px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleTestZalo}
                    disabled={isTestingZalo}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center space-x-1"
                  >
                    {isTestingZalo ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang gửi...</span>
                      </>
                    ) : (
                      <span>Gửi Thử</span>
                    )}
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-xl text-xs space-y-1 ${
                      testResult.success
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 font-bold">
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                      )}
                      <span>{testResult.success ? 'Gửi thành công!' : 'Gửi thất bại'}</span>
                    </div>
                    <p className="text-[11px]">{testResult.message}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-white flex justify-end items-center space-x-3">
              <button
                type="button"
                onClick={() => setIsZaloModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveZaloConfig}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Lưu Cấu Hình
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
