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
  Code2,
  Globe,
  ExternalLink,
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

type SettingsTabId = 'companies' | 'banks' | 'rules' | 'notifications' | 'api';

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
  const [copiedApiItem, setCopiedApiItem] = useState<string | null>(null);

  // State Quản lý API Key (Khóa Truy Cập Hệ Thống)
  const [isCreateKeyModalOpen, setIsCreateKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState<number>(0);
  const [newKeyPermission, setNewKeyPermission] = useState('all');
  const [createdKeyResult, setCreatedKeyResult] = useState<{ name: string; apiKey: string } | null>(null);
  const [isCreatingKey, setIsCreatingKey] = useState(false);

  const { data: apiKeys = [], isLoading: isLoadingKeys, refetch: refetchApiKeys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await api.get('/api-keys');
      return res.data;
    },
  });

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedApiItem(key);
    toast('success', 'Đã sao chép vào bộ nhớ tạm');
    setTimeout(() => setCopiedApiItem(null), 2000);
  };

  const settingsTabs: { id: SettingsTabId; label: string; icon: React.ElementType }[] = [
    { id: 'companies', label: 'Đơn vị cung cấp', icon: Building2 },
    { id: 'banks', label: 'Tài khoản & VietQR', icon: QrCode },
    { id: 'rules', label: 'Đánh số & VAT', icon: Sliders },
    { id: 'notifications', label: 'Cấu hình Thông báo', icon: Bell },
    { id: 'api', label: 'Tổng hợp API', icon: Code2 },
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
    let botId = modalBotId.trim();
    let apiKey = modalApiKey.trim();

    // Tự động nhận diện & hoán đổi nếu dán nhầm API Key vào ô Bot ID
    if (botId.startsWith('zlite_') || (!apiKey.startsWith('zlite_') && botId.includes('zlite_'))) {
      const temp = botId;
      botId = apiKey;
      apiKey = temp;
      setModalBotId(botId);
      setModalApiKey(apiKey);
    }

    const payload = {
      zaloBotId: botId,
      zaloApiKey: apiKey,
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
    let botId = modalBotId.trim();
    let apiKey = modalApiKey.trim();

    // Tự động hoán đổi nếu dán nhầm
    if (botId.startsWith('zlite_') || (!apiKey.startsWith('zlite_') && botId.includes('zlite_'))) {
      const temp = botId;
      botId = apiKey;
      apiKey = temp;
      setModalBotId(botId);
      setModalApiKey(apiKey);
    }

    if (!botId || !apiKey) {
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
        botId,
        apiKey,
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

  // --- XỬ LÝ QUẢN LÝ API KEY ---
  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      toast('warning', 'Thiếu tên API Key', 'Vui lòng nhập tên mô tả cho API Key.');
      return;
    }
    setIsCreatingKey(true);
    try {
      const res = await api.post('/api-keys', {
        name: newKeyName.trim(),
        permissions: newKeyPermission,
        expiresInDays: newKeyExpiry || undefined,
      });
      setCreatedKeyResult(res.data);
      setIsCreateKeyModalOpen(false);
      setNewKeyName('');
      setNewKeyExpiry(0);
      refetchApiKeys();
      toast('success', 'Tạo API Key thành công!', 'Hãy sao chép và lưu trữ mã khóa ngay bây giờ.');
    } catch (err: any) {
      toast('error', 'Lỗi tạo API Key', err.response?.data?.message || err.message);
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleToggleApiKey = async (id: string) => {
    try {
      await api.patch(`/api-keys/${id}/toggle`);
      refetchApiKeys();
      toast('success', 'Đã thay đổi trạng thái API Key');
    } catch (err: any) {
      toast('error', 'Lỗi cập nhật', err.response?.data?.message || err.message);
    }
  };

  const handleDeleteApiKey = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Thu hồi API Key',
      message: `Bạn có chắc chắn muốn thu hồi và xóa vĩnh viễn API Key "${name}"? Các ứng dụng hoặc Landing Page đang sử dụng khóa này sẽ không thể gọi API được nữa.`,
      confirmLabel: 'Thu Hồi Ngay',
      cancelLabel: 'Hủy',
      danger: true,
    });
    if (ok) {
      try {
        await api.delete(`/api-keys/${id}`);
        refetchApiKeys();
        toast('success', 'Đã thu hồi API Key');
      } catch (err: any) {
        toast('error', 'Lỗi thu hồi', err.response?.data?.message || err.message);
      }
    }
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
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Cài Đặt Hệ Thống</h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1.5">
          Quản lý đơn vị cung cấp, tài khoản VietQR, quy tắc hóa đơn, thông báo và tổng hợp API
        </p>
      </div>

      {/* Sticky Tab Navigation */}
      <div className="sticky top-16 z-20 bg-slate-50/90 -mx-2 px-2 pb-2 backdrop-blur">
        <nav className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs flex-wrap">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
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
        </div>
      )}

      {/* === TAB: TỔNG HỢP API & WEBHOOK === */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          {/* Header Overview Card */}
          <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Code2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Tổng Hợp API & Webhook Hệ Thống
                  </h3>
                  <p className="text-sm text-slate-500">
                    Tài liệu dành cho lập trình viên để tích hợp Landing Page, Web App hoặc hệ thống CRM bên ngoài.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>API Sẵn Sàng</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                <div className="font-semibold text-slate-700 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>Backend API Base URL</span>
                </div>
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs text-slate-800">
                  <span className="truncate">https://invoice-backend-5tbi.onrender.com/api</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('https://invoice-backend-5tbi.onrender.com/api', 'base_url')}
                    className="text-blue-600 hover:text-blue-800 font-sans text-xs ml-2 shrink-0 font-medium cursor-pointer"
                  >
                    {copiedApiItem === 'base_url' ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                <div className="font-semibold text-slate-700 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                  <span>Frontend Public Web URL</span>
                </div>
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs text-slate-800">
                  <span className="truncate">https://invoice.share4happy.com</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('https://invoice.share4happy.com', 'web_url')}
                    className="text-blue-600 hover:text-blue-800 font-sans text-xs ml-2 shrink-0 font-medium cursor-pointer"
                  >
                    {copiedApiItem === 'web_url' ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-800 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <span>
                <strong>CORS Policy:</strong> API đang ở chế độ <strong>public</strong> — mọi website (landing page, CRM, n8n...) đều gọi được trực tiếp từ browser. Có thể giới hạn lại bằng biến môi trường <code>CORS_ORIGINS</code> (mặc định <code>*</code>).
              </span>
            </div>
          </section>

          {/* Card: Quản Lý API Key (Khóa Xác Thực Tích Hợp) */}
          <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Khóa Truy Cập API (API Keys)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dùng để xác thực an toàn qua Header <code className="px-1.5 py-0.5 bg-slate-100 rounded font-mono text-slate-800">x-api-key: air_live_...</code> khi tích hợp từ Landing Page, CRM, N8N hoặc phần mềm bán hàng.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateKeyModalOpen(true)}
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo API Key Mới</span>
              </button>
            </div>

            {/* Danh sách API Key */}
            {isLoadingKeys ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Đang tải danh sách API Key...
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                <Key className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">Chưa có API Key nào được tạo</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Tạo khóa API Key để kết nối Landing Page hoặc các hệ thống bên ngoài tự động tạo hóa đơn và gửi Zalo/Email.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateKeyModalOpen(true)}
                  className="mt-2 inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo Khóa Đầu Tiên</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Tên Khóa / Mục Đích</th>
                      <th className="p-3">Mã Khóa (Token)</th>
                      <th className="p-3">Trạng Thái</th>
                      <th className="p-3">Lần Cuối Dùng</th>
                      <th className="p-3">Ngày Tạo / Hết Hạn</th>
                      <th className="p-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {apiKeys.map((k: any) => (
                      <tr key={k.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 font-semibold text-slate-900">
                          <div>{k.name}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            Quyền: {k.permissions === 'all' ? 'Toàn quyền API' : k.permissions}
                          </div>
                        </td>
                        <td className="p-3 font-mono">
                          <div className="inline-flex items-center space-x-1.5 bg-slate-100 px-2 py-1 rounded text-slate-700">
                            <span>{k.prefix}••••••••{k.lastChars}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={k.isActive}
                              onChange={() => handleToggleApiKey(k.id)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                            <span className={`ml-2 text-xs font-semibold ${k.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                              {k.isActive ? 'Đang Bật' : 'Tạm Khóa'}
                            </span>
                          </label>
                        </td>
                        <td className="p-3 text-slate-500">
                          {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString('vi-VN') : 'Chưa sử dụng'}
                        </td>
                        <td className="p-3 text-slate-500">
                          <div>Tạo: {new Date(k.createdAt).toLocaleDateString('vi-VN')}</div>
                          <div className="text-[11px] text-slate-400">
                            {k.expiresAt ? `Hết hạn: ${new Date(k.expiresAt).toLocaleDateString('vi-VN')}` : 'Hiệu lực vĩnh viễn'}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteApiKey(k.id, k.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Thu hồi / Xóa API Key này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Endpoint 1: Quick Create Invoice (Landing Page Webhook) */}
          <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 bg-emerald-600 text-white font-mono font-bold text-xs rounded-lg">POST</span>
                  <span className="font-mono font-bold text-sm sm:text-base text-slate-900">/api/invoices/quick-create</span>
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    Public Webhook
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  <strong>Tạo hóa đơn nhanh từ Landing Page:</strong> Tự động lập số HĐ, tạo mã VietQR thanh toán, và tự động gửi Email / Zalo Bot theo cấu hình thông báo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard('https://invoice-backend-5tbi.onrender.com/api/invoices/quick-create', 'ep_quick_create')}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
              >
                {copiedApiItem === 'ep_quick_create' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedApiItem === 'ep_quick_create' ? 'Đã chép URL' : 'Sao chép URL'}</span>
              </button>
            </div>

            {/* Request Schema Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Các Tham Số Body (JSON Payload)
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Trường</th>
                      <th className="p-2.5">Kiểu</th>
                      <th className="p-2.5">Bắt buộc</th>
                      <th className="p-2.5">Mô tả & Ví dụ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr>
                      <td className="p-2.5 font-mono text-blue-700 font-bold">customerName</td>
                      <td className="p-2.5 font-mono">string</td>
                      <td className="p-2.5 font-bold text-rose-600">Có</td>
                      <td className="p-2.5">Họ tên khách hàng / học viên (VD: "Nguyễn Văn A")</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-blue-700 font-bold">customerPhone</td>
                      <td className="p-2.5 font-mono">string</td>
                      <td className="p-2.5 text-slate-500">Tùy chọn</td>
                      <td className="p-2.5">Số điện thoại để tự động gửi Zalo Bot và kết bạn (VD: "0334551531")</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-blue-700 font-bold">customerEmail</td>
                      <td className="p-2.5 font-mono">string</td>
                      <td className="p-2.5 text-slate-500">Tùy chọn</td>
                      <td className="p-2.5">Email nhận hóa đơn và thông báo thanh toán (VD: "khach@example.com")</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-blue-700 font-bold">amount</td>
                      <td className="p-2.5 font-mono">number</td>
                      <td className="p-2.5 font-bold text-rose-600">Có</td>
                      <td className="p-2.5">Số tiền thanh toán (VD: 500000)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-blue-700 font-bold">description</td>
                      <td className="p-2.5 font-mono">string</td>
                      <td className="p-2.5 font-bold text-rose-600">Có</td>
                      <td className="p-2.5">Tên gói dịch vụ / Khóa học / Nội dung thanh toán</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-blue-700 font-bold">notes</td>
                      <td className="p-2.5 font-mono">string</td>
                      <td className="p-2.5 text-slate-500">Tùy chọn</td>
                      <td className="p-2.5">Ghi chú bổ sung (VD: "Đăng ký từ Landing Page hè")</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Code Examples: JSON & cURL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
                  <span className="text-amber-400 font-bold">// Ví dụ Payload JSON gửi lên:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`{
  "customerName": "Nguyễn Văn A",
  "customerPhone": "0334551531",
  "customerEmail": "khach@example.com",
  "amount": 500000,
  "description": "Khóa học AI Robotic Cơ Bản",
  "notes": "Đăng ký từ landing page"
}`, 'json_payload')}
                    className="hover:text-white flex items-center space-x-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedApiItem === 'json_payload' ? 'Đã chép' : 'Chép JSON'}</span>
                  </button>
                </div>
                <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap">
{`{
  "customerName": "Nguyễn Văn A",
  "customerPhone": "0334551531",
  "customerEmail": "khach@example.com",
  "amount": 500000,
  "description": "Khóa học AI Robotic Cơ Bản",
  "notes": "Đăng ký từ landing page"
}`}
                </pre>
              </div>

              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
                  <span className="text-emerald-400 font-bold">// Kết quả trả về (Response 201 Created):</span>
                </div>
                <pre className="text-emerald-300 overflow-x-auto whitespace-pre-wrap">
{`{
  "success": true,
  "invoice": {
    "invoiceNumber": "HD0001",
    "grandTotal": 500000,
    "shareToken": "e27a6966-...",
    "viewUrl": "https://invoice.share4happy.com/view/e27a6966-...",
    "pdfUrl": "https://invoice-backend-5tbi.onrender.com/api/delivery/public/e27a6966-.../pdf",
    "qrDataUrl": "https://qr.sepay.vn/img?bank=Vietcombank&acc=SHYNNERI&amount=500000&des=HD0001"
  },
  "delivery": {
    "email": { "attempted": true, "success": true },
    "zalo": { "attempted": true, "success": true }
  }
}`}
                </pre>
              </div>
            </div>

            {/* cURL & Code Integration Snippet */}
            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
                <span className="text-blue-400 font-bold">// Ví dụ gọi API bằng cURL (Kèm Header xác thực x-api-key):</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`curl -X POST "https://invoice-backend-5tbi.onrender.com/api/invoices/quick-create" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKeys[0]?.prefix ? apiKeys[0].prefix.replace(/•+/g, 'YOUR_KEY_HERE') : 'air_live_YOUR_KEY_HERE'}" \\
  -d '{
    "customerName": "Nguyễn Văn A",
    "customerPhone": "0334551531",
    "customerEmail": "khach@example.com",
    "amount": 500000,
    "description": "Khóa học AI Robotic Cơ Bản"
  }'`, 'curl_snippet')}
                  className="hover:text-white flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedApiItem === 'curl_snippet' ? 'Đã chép cURL' : 'Chép cURL'}</span>
                </button>
              </div>
              <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`curl -X POST "https://invoice-backend-5tbi.onrender.com/api/invoices/quick-create" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKeys[0]?.prefix ? apiKeys[0].prefix.replace(/•+/g, 'YOUR_KEY_HERE') : 'air_live_YOUR_KEY_HERE'}" \\
  -d '{
    "customerName": "Nguyễn Văn A",
    "customerPhone": "0334551531",
    "customerEmail": "khach@example.com",
    "amount": 500000,
    "description": "Khóa học AI Robotic Cơ Bản"
  }'`}
              </pre>
            </div>
          </section>

          {/* Endpoint 2: Export Public PDF */}
          <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 bg-blue-600 text-white font-mono font-bold text-xs rounded-lg">GET</span>
                  <span className="font-mono font-bold text-sm sm:text-base text-slate-900">/api/delivery/public/:token/pdf</span>
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    Public Direct Stream
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  <strong>Tải trực tiếp file PDF hóa đơn:</strong> Dùng để nhúng link nút "Tải Hóa Đơn PDF" trên Landing Page hoặc gửi cho khách hàng mà không cần đăng nhập.
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard('https://invoice-backend-5tbi.onrender.com/api/delivery/public/{shareToken}/pdf', 'ep_pdf')}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
              >
                {copiedApiItem === 'ep_pdf' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedApiItem === 'ep_pdf' ? 'Đã chép URL' : 'Sao chép URL'}</span>
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 font-mono">
              GET https://invoice-backend-5tbi.onrender.com/api/delivery/public/<strong className="text-blue-700">{'<shareToken>'}</strong>/pdf
            </div>
          </section>

          {/* Endpoint 3: Public Invoice JSON Data */}
          <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 bg-blue-600 text-white font-mono font-bold text-xs rounded-lg">GET</span>
                  <span className="font-mono font-bold text-sm sm:text-base text-slate-900">/api/delivery/public/:token</span>
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    Public JSON
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  <strong>Lấy dữ liệu hóa đơn công khai:</strong> Trả về thông tin chi tiết hóa đơn (trạng thái thanh toán, tổng tiền, mã QR SePay) để Landing Page render trực tiếp trên trang cảm ơn.
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard('https://invoice-backend-5tbi.onrender.com/api/delivery/public/{shareToken}', 'ep_token_data')}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
              >
                {copiedApiItem === 'ep_token_data' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedApiItem === 'ep_token_data' ? 'Đã chép URL' : 'Sao chép URL'}</span>
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 font-mono">
              GET https://invoice-backend-5tbi.onrender.com/api/delivery/public/<strong className="text-blue-700">{'<shareToken>'}</strong>
            </div>
          </section>

          {/* Endpoint 4: Public View Page */}
          <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 bg-purple-600 text-white font-mono font-bold text-xs rounded-lg">WEB</span>
                  <span className="font-mono font-bold text-sm sm:text-base text-slate-900">https://invoice.share4happy.com/view/:token</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  <strong>Trang xem hóa đơn & thanh toán online:</strong> Giao diện hiển thị hóa đơn đẹp mắt chuẩn A4, hiển thị mã VietQR chuyển khoản ngân hàng và cho phép in ấn / lưu trữ trực tiếp.
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard('https://invoice.share4happy.com/view/{shareToken}', 'ep_view_page')}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
              >
                {copiedApiItem === 'ep_view_page' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedApiItem === 'ep_view_page' ? 'Đã chép URL' : 'Sao chép URL'}</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {/* POPUP THÊM / SỬA ĐƠN VỊ CUNG CẤP */}
      {isCompanyModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCompanyModalOpen(false);
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
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsBankModalOpen(false);
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
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsZaloModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
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
              {/* Guidance Banner */}
              <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start space-x-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed space-y-1">
                  <div className="font-semibold text-blue-950">Quy tắc định dạng của Talab SMS Gateway:</div>
                  <div>• <strong className="text-blue-950">Zalo Bot ID:</strong> Mã UUID định danh Bot (VD: <code className="px-1 py-0.5 bg-blue-100/80 text-blue-900 rounded font-mono font-bold">ae32c723-1a7a-4e22-985f-eb3e8876f2cc</code>)</div>
                  <div>• <strong className="text-blue-950">API Key:</strong> Khóa bí mật luôn bắt đầu bằng tiền tố <code className="px-1 py-0.5 bg-blue-100/80 text-blue-900 rounded font-mono font-bold">zlite_...</code> (VD: <code className="px-1 py-0.5 bg-blue-100/80 text-blue-900 rounded font-mono">zlite_31d757...</code>)</div>
                  <div className="text-slate-500 italic mt-0.5">💡 Hệ thống tự động nhận diện và đảo chuẩn xác nếu bạn vô tình dán ngược giữa 2 ô.</div>
                </div>
              </div>

              {/* Bot ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Zalo Bot ID (bot_id) * <span className="font-normal text-slate-400">— Mã định danh Bot (UUID)</span>
                </label>
                <input
                  type="text"
                  value={modalBotId}
                  onChange={(e) => setModalBotId(e.target.value)}
                  placeholder="VD: ae32c723-1a7a-4e22-985f-eb3e8876f2cc"
                  className="w-full px-3.5 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* API Key */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  API Key (x-api-key) * <span className="font-normal text-slate-400">— Khóa truy cập (bắt đầu bằng zlite_)</span>
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={modalApiKey}
                    onChange={(e) => setModalApiKey(e.target.value)}
                    placeholder="VD: zlite_31d7572529b37294b69ce96881a9c2ce78ac7280"
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

      {/* MODAL TẠO API KEY MỚI */}
      {isCreateKeyModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateKeyModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Tạo API Key Mới</h3>
                  <p className="text-xs text-slate-500">Cấp khóa truy cập bảo mật cho hệ thống bên ngoài</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateKeyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200 transition-all font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateApiKey} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Gợi Nhớ / Mục Đích Sử Dụng *
                </label>
                <input
                  type="text"
                  required
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="VD: Landing Page Học Viện, Webhook CRM, N8N Automation..."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thời Hạn Hiệu Lực
                </label>
                <select
                  value={newKeyExpiry}
                  onChange={(e) => setNewKeyExpiry(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value={0}>Không bao giờ hết hạn (Khuyến nghị)</option>
                  <option value={30}>30 ngày</option>
                  <option value={90}>90 ngày</option>
                  <option value={365}>1 năm (365 ngày)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phạm Vi Quyền Hạn
                </label>
                <select
                  value={newKeyPermission}
                  onChange={(e) => setNewKeyPermission(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="all">Toàn quyền (Tạo hóa đơn, xem, xuất PDF)</option>
                  <option value="invoices:create">Chỉ tạo hóa đơn nhanh (Landing Page)</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
                <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <span className="leading-relaxed">
                  Sau khi bấm tạo, chuỗi bí mật của API Key sẽ chỉ hiển thị <strong>duy nhất một lần</strong>. Hãy sao chép và lưu trữ cẩn thận.
                </span>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateKeyModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreatingKey}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                >
                  {isCreatingKey ? 'Đang tạo...' : 'Tạo Khóa Ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HIỂN THỊ API KEY VỪA TẠO (CHỈ HIỂN THỊ 1 LẦN) */}
      {createdKeyResult && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setCreatedKeyResult(null);
          }}
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="p-5 border-b border-emerald-100 bg-emerald-50/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Đã Tạo API Key Thành Công!</h3>
                  <p className="text-xs text-slate-500">Khóa cho: <strong>{createdKeyResult.name}</strong></p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start space-x-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                <div className="leading-relaxed">
                  <strong className="font-semibold block text-rose-950 mb-0.5">Lưu ý quan trọng về bảo mật:</strong>
                  Đây là lần duy nhất toàn bộ chuỗi API Key này được hiển thị. Khi bạn đóng cửa sổ này, hệ thống sẽ ẩn vĩnh viễn và chỉ lưu bản băm SHA-256 an toàn.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Chuỗi Khóa API Key (x-api-key)
                </label>
                <div className="flex items-center bg-slate-900 rounded-xl p-3 border border-slate-800 text-slate-100 font-mono text-xs sm:text-sm select-all break-all relative">
                  <span className="text-emerald-400 font-bold mr-2 select-none">KEY:</span>
                  <span className="flex-1 select-all">{createdKeyResult.apiKey}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => copyToClipboard(createdKeyResult.apiKey, 'new_created_key')}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {copiedApiItem === 'new_created_key' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedApiItem === 'new_created_key' ? 'Đã Sao Chép Khóa!' : 'Sao Chép API Key'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreatedKeyResult(null)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Tôi Đã Lưu & Đóng Lại
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
