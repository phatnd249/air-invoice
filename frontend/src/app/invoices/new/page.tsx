'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Plus,
  Trash2,
  ArrowLeft,
  Eye,
  QrCode,
  LayoutTemplate,
  CreditCard,
  Banknote,
  Smartphone,
  RefreshCw,
  Maximize2,
  User,
  ShieldCheck,
  Receipt,
  Building,
  Search,
  X,
  Layers,
  ChevronRight,
  FileCheck,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import InvoiceTemplateRenderer, { TEMPLATES_CONFIG } from '@/components/InvoiceTemplateRenderer';
import { INVOICE_TYPE_CONFIG, INVOICE_FORM_CONFIG, InvoiceType, InvoiceForm } from '@invoice/types';

interface CatalogService {
  id: string;
  name: string;
  description?: string;
  metaInfo?: string;
  unit: string;
  unitPrice: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'CASH' | 'CARD'>('TRANSFER');
  const [cashGiven, setCashGiven] = useState<number | ''>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isQrZoomed, setIsQrZoomed] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');

  // Lấy danh mục dịch vụ từ catalog
  const { data: catalogServices = [] } = useQuery<CatalogService[]>({
    queryKey: ['services-catalog', catalogSearch],
    queryFn: async () => {
      const res = await api.get('/services', { params: catalogSearch ? { search: catalogSearch } : {} });
      return res.data;
    },
    enabled: isCatalogOpen,
  });

  // Lấy thông tin cài đặt mặc định
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

  // Lấy danh sách đơn vị cung cấp (người bán)
  const companies: Array<{
    id: string;
    name: string;
    taxCode?: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
    bankAccountId?: string;
    isDefault?: boolean;
  }> = settings?.companies && Array.isArray(settings.companies) && settings.companies.length > 0
    ? settings.companies
    : settings?.companyName
    ? [
        {
          id: 'comp-default',
          name: settings.companyName,
          taxCode: settings.taxCode,
          address: settings.address,
          phone: settings.phone,
          email: settings.email,
          logoUrl: settings.logoUrl,
          isDefault: true,
        },
      ]
    : [];

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  // Lấy danh sách tài khoản ngân hàng đã cấu hình
  const bankAccounts: Array<{
    id: string;
    bankCode: string;
    bankAccount: string;
    bankAccountName: string;
    label?: string;
    qrTemplate?: string;
    isDefault?: boolean;
  }> = settings?.bankAccounts && Array.isArray(settings.bankAccounts) && settings.bankAccounts.length > 0
    ? settings.bankAccounts
    : settings?.bankCode && settings?.bankAccount
    ? [
        {
          id: 'acc-default',
          bankCode: settings.bankCode,
          bankAccount: settings.bankAccount,
          bankAccountName: settings.bankAccountName || 'AI ROBOTIC',
          label: 'Tài khoản chính',
          isDefault: true,
        },
      ]
    : [];

  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      const defaultComp = companies.find((c) => c.isDefault) || companies[0];
      setSelectedCompanyId(defaultComp.id);
      if (defaultComp.bankAccountId) {
        setSelectedBankId(defaultComp.bankAccountId);
      }
    }
  }, [companies, selectedCompanyId]);

  useEffect(() => {
    if (bankAccounts.length > 0 && !selectedBankId) {
      const defaultAcc = bankAccounts.find((a) => a.isDefault) || bankAccounts[0];
      setSelectedBankId(defaultAcc.id);
    }
  }, [bankAccounts, selectedBankId]);

  const activeCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0];
  const activeBank = bankAccounts.find((a) => a.id === selectedBankId) || bankAccounts[0];

  const handleSelectCompany = (compId: string) => {
    setSelectedCompanyId(compId);
    const comp = companies.find((c) => c.id === compId);
    if (comp?.bankAccountId) {
      setSelectedBankId(comp.bankAccountId);
    }
  };

  // Lấy số hóa đơn kế tiếp
  const { data: nextNumberData } = useQuery({
    queryKey: ['next-number'],
    queryFn: async () => {
      const res = await api.get('/invoices/next-number');
      return res.data;
    },
  });

  const { register, control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      invoiceNumber: '',
      invoiceType: 'GTGT' as InvoiceType,
      invoiceForm: 'WITH_TAX_CODE' as InvoiceForm,
      templateId: 'standard-classic',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      buyerName: '',
      buyerEmail: '',
      buyerPhone: '',
      buyerCompany: '',
      buyerTaxCode: '',
      buyerAddress: '',
      hasVat: true,
      vatRate: 10,
      otherFee: 0,
      notes: '',
      items: [
        {
          name: 'Hosting Wordpress - Gói Doanh Nghiệp',
          description: 'thanhdattax.com',
          metaInfo: '25/06/2026 - 25/06/2027',
          unit: 'gói',
          quantity: 1,
          unitPrice: 660000,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  useEffect(() => {
    if (nextNumberData?.nextNumber) {
      setValue('invoiceNumber', nextNumberData.nextNumber);
    }
  }, [nextNumberData, setValue]);

  // Watch để tính toán tiền theo thời gian thực
  const watchedValues = watch();
  const items = watchedValues.items || [];
  const subTotal = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0
  );
  const vatRate = watchedValues.hasVat ? Number(watchedValues.vatRate || 10) : 0;
  const vatAmount = (subTotal * vatRate) / 100;
  const otherFee = Number(watchedValues.otherFee) || 0;
  const grandTotal = subTotal + vatAmount + otherFee;

  // Tính tiền thừa nếu thanh toán tiền mặt
  const numericCashGiven = typeof cashGiven === 'number' ? cashGiven : Number(cashGiven) || 0;
  const changeAmount = numericCashGiven >= grandTotal ? numericCashGiven - grandTotal : 0;

  // VietQR Link theo tài khoản ngân hàng đang được chọn
  const qrPreviewUrl =
    activeBank?.bankCode && activeBank?.bankAccount
      ? `https://qr.sepay.vn/img?bank=${activeBank.bankCode}&acc=${activeBank.bankAccount}&template=compact&amount=${Math.round(grandTotal)}&des=${encodeURIComponent(
          `${watchedValues.invoiceNumber || 'HD'} - ${items[0]?.name || 'Dich vu'}`
        )}`
      : '';

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/invoices', data);
    },
    onSuccess: (res) => {
      alert('Đã lập và lưu hóa đơn thành công!');
      router.push(`/invoices/${res.data.id}`);
    },
    onError: (err: any) => {
      alert('Lỗi tạo hóa đơn: ' + (err.response?.data?.message || err.message));
    },
  });

  const onSubmit = (formData: any) => {
    createMutation.mutate({
      ...formData,
      status: 'ISSUED',
      sellerName: activeCompany?.name || settings?.companyName,
      sellerTaxCode: activeCompany?.taxCode || settings?.taxCode,
      sellerAddress: activeCompany?.address || settings?.address,
      sellerPhone: activeCompany?.phone || settings?.phone,
      sellerEmail: activeCompany?.email || settings?.email,
      sellerLogoUrl: activeCompany?.logoUrl || settings?.logoUrl,
      bankCode: activeBank?.bankCode,
      bankAccount: activeBank?.bankAccount,
      bankAccountName: activeBank?.bankAccountName,
      grandTotal,
      subTotal,
      vatAmount,
      otherFee,
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const selectedTemplateId = watchedValues.templateId || 'standard-classic';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center space-x-4">
          <Link
            href="/invoices"
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lập Hóa Đơn Dịch Vụ</h1>
              <span className="font-mono text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-200">
                {watchedValues.invoiceNumber || 'HD-NEW'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Nhập thông tin dịch vụ và đối soát thanh toán trực tiếp
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex items-center px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl shadow-sm space-x-2 transition-all"
          >
            <Eye className="w-4 h-4 text-blue-600" />
            <span>Xem Bản In A4</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={createMutation.isPending}
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-sm shadow-blue-500/20 space-x-2 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{createMutation.isPending ? 'Đang lưu...' : 'Lưu & Phát Hành'}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Split Billing Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Services & Customer Info (xl:col-span-7) */}
        <div className="xl:col-span-7 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 0. Seller / Company Profile Selection Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Đơn Vị Cung Cấp (Người Bán / Phát Hành)
                  </h2>
                </div>
                <Link
                  href="/settings"
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  Quản lý đơn vị
                </Link>
              </div>

              {companies.length > 1 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {companies.map((comp) => {
                    const isSelected = (activeCompany?.id || '') === comp.id;
                    return (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => handleSelectCompany(comp.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className={`text-xs font-bold line-clamp-1 ${isSelected ? 'text-blue-700' : 'text-slate-900'}`}>
                            {comp.name}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 ml-1.5" />}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
                          <div>MST: <strong className="text-slate-700">{comp.taxCode || '---'}</strong></div>
                          {comp.address && <div className="line-clamp-1">{comp.address}</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-700 space-y-1">
                  <div className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                    <span>{activeCompany?.name || settings?.companyName || 'AI ROBOTIC'}</span>
                  </div>
                  <div>MST: <strong>{activeCompany?.taxCode || settings?.taxCode || '---'}</strong></div>
                  <div>Địa chỉ: {activeCompany?.address || settings?.address || '---'}</div>
                </div>
              )}
            </div>

            {/* Invoice Classification & Form Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Phân Loại & Hình Thức Hóa Đơn
                </h2>
              </div>

              {/* Invoice Type Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Loại Hóa Đơn (Theo NĐ 123/2020/NĐ-CP)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(INVOICE_TYPE_CONFIG) as InvoiceType[]).map((tKey) => {
                    const cfg = INVOICE_TYPE_CONFIG[tKey];
                    const isSelected = (watchedValues.invoiceType || 'GTGT') === tKey;
                    return (
                      <button
                        key={tKey}
                        type="button"
                        onClick={() => {
                          setValue('invoiceType', tKey);
                          if (tKey === 'BAN_HANG') {
                            setValue('hasVat', false);
                          } else if (tKey === 'GTGT') {
                            setValue('hasVat', true);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className={`text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                            {cfg.label}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 ml-1.5" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">
                          {cfg.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Invoice Form Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Hình Thức Hóa Đơn Điện Tử
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(Object.keys(INVOICE_FORM_CONFIG) as InvoiceForm[]).map((fKey) => {
                    const cfg = INVOICE_FORM_CONFIG[fKey];
                    const isSelected = (watchedValues.invoiceForm || 'WITH_TAX_CODE') === fKey;
                    return (
                      <button
                        key={fKey}
                        type="button"
                        onClick={() => setValue('invoiceForm', fKey)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20 font-semibold text-indigo-900'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 text-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold truncate">{cfg.label}</div>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">{cfg.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Customer Details Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <User className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Thông Tin Khách Hàng (Người Mua)
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên Khách Hàng / Đại Diện *
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Nguyễn Thành Đạt / Anh Linh"
                    {...register('buyerName', { required: true })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số Điện Thoại Liên Hệ
                  </label>
                  <input
                    type="tel"
                    placeholder="0901234567"
                    {...register('buyerPhone')}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Nhận Hóa Đơn & PDF
                  </label>
                  <input
                    type="email"
                    placeholder="khachhang@gmail.com"
                    {...register('buyerEmail')}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Doanh Nghiệp / Công Ty (Nếu có)
                </label>
                <input
                  type="text"
                  placeholder="Công ty TNHH Dịch vụ Số Thành Đạt"
                  {...register('buyerCompany')}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Địa Chỉ Khách Hàng
                </label>
                <input
                  type="text"
                  placeholder="124 Điện Biên Phủ, P. Đa Kao, Quận 1, TP. HCM"
                  {...register('buyerAddress')}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Template Selector Bar */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <LayoutTemplate className="w-4 h-4 text-blue-600" />
                  <span>Mẫu Thiết Kế Hóa Đơn (Template)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {TEMPLATES_CONFIG.map((tpl) => {
                  const isSelected = selectedTemplateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setValue('templateId', tpl.id)}
                      className={`flex items-center space-x-2 p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20 font-semibold'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 text-slate-700'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tpl.primaryColor }}
                      />
                      <span className="text-xs truncate">{tpl.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Service Items Table Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Danh Sách Dịch Vụ Cung Cấp
                  </h2>
                  <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                    {fields.length} mục
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => { setCatalogSearch(''); setIsCatalogOpen(true); }}
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Chọn từ danh mục</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      append({
                        name: '',
                        description: '',
                        metaInfo: '',
                        unit: 'gói',
                        quantity: 1,
                        unitPrice: 0,
                      })
                    }
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nhập thủ công</span>
                  </button>
                </div>
              </div>

              {/* Service Rows */}
              <div className="space-y-3.5">
                {fields.map((field, index) => {
                  const currentQty = Number(watch(`items.${index}.quantity`)) || 0;
                  const currentPrice = Number(watch(`items.${index}.unitPrice`)) || 0;
                  const rowAmount = currentQty * currentPrice;

                  return (
                    <div
                      key={field.id}
                      className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3 relative group hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          Dịch vụ #{index + 1}
                        </span>

                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-semibold text-slate-700">
                            Thành tiền: <span className="text-emerald-600 font-bold text-sm">{formatCurrency(rowAmount)}</span>
                          </span>

                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-all"
                              title="Xóa dịch vụ này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Main Service Name */}
                      <div>
                        <input
                          type="text"
                          placeholder="Tên dịch vụ (VD: Hosting WordPress - Gói Doanh Nghiệp)"
                          {...register(`items.${index}.name` as const, { required: true })}
                          className="w-full px-3.5 py-2 text-sm font-semibold text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                        />
                      </div>

                      {/* Detail / Domain & Duration (HSD) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          placeholder="Chi tiết / Tên miền (VD: thanhdattax.com)"
                          {...register(`items.${index}.description` as const)}
                          className="w-full px-3.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-700"
                        />
                        <input
                          type="text"
                          placeholder="Thời hạn HSD (VD: 25/06/2026 - 25/06/2027)"
                          {...register(`items.${index}.metaInfo` as const)}
                          className="w-full px-3.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-700"
                        />
                      </div>

                      {/* Quantity, Unit & Unit Price */}
                      <div className="grid grid-cols-3 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">Số Lượng</label>
                          <input
                            type="number"
                            min="1"
                            {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                            className="w-full px-3 py-1.5 text-sm font-semibold border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">Đơn Vị Tính</label>
                          <input
                            type="text"
                            placeholder="gói / năm"
                            {...register(`items.${index}.unit` as const)}
                            className="w-full px-3 py-1.5 text-sm font-semibold border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">Đơn Giá (VNĐ)</label>
                          <input
                            type="number"
                            step="1000"
                            placeholder="660000"
                            {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })}
                            className="w-full px-3 py-1.5 text-sm font-semibold border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Note & Terms Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Ghi Chú Đơn Hàng / Hóa Đơn
              </label>
              <textarea
                rows={2}
                placeholder="Ghi chú thêm về điều khoản thanh toán, liên hệ kỹ thuật..."
                {...register('notes')}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700"
              />
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Settlement & VietQR Payment Box (xl:col-span-5) */}
        <div className="xl:col-span-5 sticky top-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-6">
            {/* Header Settlement Info */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Thanh Toán Hóa Đơn</h3>
                <p className="text-xs text-slate-500">Đối soát & xác nhận dòng tiền</p>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400 font-medium">Thời gian lập</div>
                <div className="text-xs font-semibold text-slate-700 mt-0.5">
                  {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
                  {new Date().toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>

            {/* Financial Summary Calculation */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center space-x-1.5">
                  <span>Tổng tiền dịch vụ</span>
                  <span className="bg-slate-100 text-slate-700 text-[11px] px-1.5 py-0.5 rounded font-bold">
                    {items.length}
                  </span>
                </span>
                <span className="font-semibold tabular-nums text-slate-900">{formatCurrency(subTotal)}</span>
              </div>

              {/* VAT Switcher & Input */}
              <div className="flex items-center justify-between text-slate-600 pt-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hasVatRight"
                    {...register('hasVat')}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="hasVatRight" className="text-xs font-medium cursor-pointer text-slate-700">
                    Thuế VAT ({watchedValues.hasVat ? `${watchedValues.vatRate}%` : '0%'})
                  </label>
                </div>
                <span className="font-semibold tabular-nums text-slate-900">{formatCurrency(vatAmount)}</span>
              </div>

              {/* Phí Khác (Tùy chọn) */}
              <div className="flex items-center justify-between text-slate-600 pt-1">
                <span className="text-xs">Phí dịch vụ khác:</span>
                <input
                  type="number"
                  placeholder="0"
                  {...register('otherFee', { valueAsNumber: true })}
                  className="w-28 px-2.5 py-1 text-right text-xs font-semibold border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* KHÁCH CẦN TRẢ (PROMINENT TOTAL) */}
              <div className="pt-4 border-t-2 border-slate-900 mt-3 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Khách cần trả
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Đã gồm thuế & phí</span>
                </div>
                <div className="text-2xl font-black text-blue-600 tracking-tight tabular-nums font-mono">
                  {formatCurrency(grandTotal)}
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Phương Thức Thanh Toán
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('TRANSFER')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                    paymentMethod === 'TRANSFER'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 ring-2 ring-blue-600/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/50'
                  }`}
                >
                  <QrCode className="w-5 h-5 mb-1 text-blue-600" />
                  <span className="text-xs font-bold">Chuyển khoản</span>
                  <span className="text-[10px] opacity-75">VietQR SePay</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('CASH');
                    if (!cashGiven) setCashGiven(grandTotal);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                    paymentMethod === 'CASH'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-700 ring-2 ring-emerald-600/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/50'
                  }`}
                >
                  <Banknote className="w-5 h-5 mb-1 text-emerald-600" />
                  <span className="text-xs font-bold">Tiền mặt</span>
                  <span className="text-[10px] opacity-75">Tính tiền thừa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                    paymentMethod === 'CARD'
                      ? 'border-purple-600 bg-purple-50/70 text-purple-700 ring-2 ring-purple-600/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/50'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mb-1 text-purple-600" />
                  <span className="text-xs font-bold">Thẻ / POS</span>
                  <span className="text-[10px] opacity-75">Quẹt thẻ</span>
                </button>
              </div>
            </div>

            {/* Dynamic Payment Body */}
            {paymentMethod === 'TRANSFER' && (
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3">
                {/* Bank Account Selector Dropdown */}
                {bankAccounts.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Tài khoản ngân hàng nhận tiền
                    </label>
                    <select
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-800 shadow-2xs"
                    >
                      {bankAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.label || acc.bankCode} ({acc.bankCode} - {acc.bankAccount}) {acc.isDefault ? '★' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-600 font-medium pt-1">
                  <span className="flex items-center space-x-1">
                    <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                    <span>Quét mã VietQR chuyển khoản</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsQrZoomed(true)}
                    className="text-blue-600 hover:underline inline-flex items-center space-x-0.5 text-[11px]"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Phóng to</span>
                  </button>
                </div>

                {qrPreviewUrl ? (
                  <div className="bg-white p-3 rounded-xl border border-slate-200 inline-block shadow-sm text-center mx-auto w-full">
                    <img
                      src={qrPreviewUrl}
                      alt="VietQR"
                      className="w-44 h-auto mx-auto rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="w-44 h-44 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-xs mx-auto">
                    Chưa cấu hình SePay
                  </div>
                )}

                <div className="text-xs text-slate-600 space-y-1 text-center">
                  <div>
                    Ngân hàng: <strong className="text-slate-800">{activeBank?.bankCode || 'Vietcombank'}</strong> •{' '}
                    <strong className="text-slate-800 font-mono">{activeBank?.bankAccount || 'SHYNNERI'}</strong>
                  </div>
                  <div>
                    Chủ tài khoản: <strong className="text-slate-800 uppercase text-[11px]">{activeBank?.bankAccountName || 'AI ROBOTIC'}</strong>
                  </div>
                  <div>
                    Cú pháp CK:{' '}
                    <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-blue-700">
                      {watchedValues.invoiceNumber || 'HD0001'}
                    </span>
                  </div>
                </div>

                {/* Kiểm tra giao dịch button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCheckingPayment(true);
                    setTimeout(() => {
                      setIsCheckingPayment(false);
                      alert('Hệ thống SePay đang lắng nghe biến động số dư. Khi khách chuyển khoản thành công, hóa đơn sẽ tự động đối soát!');
                    }, 1200);
                  }}
                  disabled={isCheckingPayment}
                  className="w-full inline-flex items-center justify-center space-x-1.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition-all shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isCheckingPayment ? 'animate-spin' : ''}`} />
                  <span>{isCheckingPayment ? 'Đang kiểm tra biến động SePay...' : 'Kiểm tra giao dịch SePay'}</span>
                </button>
              </div>
            )}

            {paymentMethod === 'CASH' && (
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khách Thanh Toán (Tiền Khách Đưa)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    placeholder="VD: 1000000"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2 text-base font-bold text-slate-900 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  />
                </div>

                {/* Quick amount suggestion chips */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCashGiven(grandTotal)}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold rounded-lg border border-emerald-200 transition-colors"
                  >
                    Đúng tiền ({formatCurrency(grandTotal)})
                  </button>
                  {[500000, 1000000, 2000000, 5000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashGiven(amt)}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-slate-700 text-[11px] font-medium rounded-lg border border-emerald-200 transition-colors"
                    >
                      {formatCurrency(amt)}
                    </button>
                  ))}
                </div>

                <div className="pt-3 border-t border-emerald-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Tiền thừa trả khách:</span>
                  <span className="text-lg font-black text-emerald-700">
                    {formatCurrency(changeAmount)}
                  </span>
                </div>
              </div>
            )}

            {paymentMethod === 'CARD' && (
              <div className="bg-purple-50/50 border border-purple-200 rounded-2xl p-4 space-y-2 text-xs text-purple-900">
                <p className="font-semibold">Quẹt thẻ qua máy POS hoặc Cổng thanh toán</p>
                <p className="text-slate-600 text-[11px]">
                  Sau khi quẹt thẻ thành công tại máy POS, bấm nút <strong>"Lưu & Phát Hành"</strong> bên dưới để hoàn tất đơn hàng.
                </p>
              </div>
            )}

            {/* BIG ACTION BUTTON */}
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={createMutation.isPending}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-sm space-x-2 transition-all flex items-center justify-center tracking-wide"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>{createMutation.isPending ? 'Đang xử lý...' : 'Lưu & Phát Hành'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* FULL-SCREEN LIVE PREVIEW A4 MODAL */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Xem Trước Bản In A4 Chuẩn</h3>
                  <p className="text-xs text-slate-500">Mô phỏng chính xác file PDF Playwright sẽ xuất ra</p>
                </div>
              </div>

              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200 transition-all font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto bg-slate-100 flex-1">
              <div className="max-w-3xl mx-auto">
                <InvoiceTemplateRenderer
                  invoice={{
                    invoiceNumber: watchedValues.invoiceNumber || 'HD-SAMPLE',
                    invoiceType: watchedValues.invoiceType || 'GTGT',
                    invoiceForm: watchedValues.invoiceForm || 'WITH_TAX_CODE',
                    issueDate: watchedValues.issueDate,
                    dueDate: watchedValues.dueDate,
                    status: 'ISSUED',
                    templateId: selectedTemplateId,
                    sellerName: activeCompany?.name || settings?.companyName,
                    sellerTaxCode: activeCompany?.taxCode || settings?.taxCode,
                    sellerAddress: activeCompany?.address || settings?.address,
                    sellerPhone: activeCompany?.phone || settings?.phone,
                    sellerEmail: activeCompany?.email || settings?.email,
                    sellerLogoUrl: activeCompany?.logoUrl || settings?.logoUrl,
                    buyerName: watchedValues.buyerName,
                    buyerCompany: watchedValues.buyerCompany,
                    buyerAddress: watchedValues.buyerAddress,
                    buyerTaxCode: watchedValues.buyerTaxCode,
                    buyerEmail: watchedValues.buyerEmail,
                    buyerPhone: watchedValues.buyerPhone,
                    hasVat: watchedValues.hasVat,
                    vatRate: vatRate,
                    subTotal: subTotal,
                    vatAmount: vatAmount,
                    otherFee: otherFee,
                    grandTotal: grandTotal,
                    qrDataUrl: qrPreviewUrl,
                    bankCode: activeBank?.bankCode,
                    bankAccount: activeBank?.bankAccount,
                    bankAccountName: activeBank?.bankAccountName,
                    notes: watchedValues.notes,
                    items: items.map((it) => ({
                      name: it.name,
                      description: it.description,
                      metaInfo: it.metaInfo,
                      unit: it.unit || 'gói',
                      quantity: Number(it.quantity) || 1,
                      unitPrice: Number(it.unitPrice) || 0,
                      amount: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
                    })),
                  }}
                  settings={settings}
                  overrideTemplateId={selectedTemplateId}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
              <span className="text-xs text-slate-500 font-medium">Khổ giấy A4 • VietQR SePay</span>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Zoom Modal */}
      {isQrZoomed && qrPreviewUrl && (
        <div
          onClick={() => setIsQrZoomed(false)}
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="bg-white p-6 rounded-2xl shadow-2xl text-center max-w-sm w-full space-y-3">
            <h4 className="font-bold text-slate-900 text-base">Mã VietQR SePay</h4>
            <img src={qrPreviewUrl} alt="VietQR Zoom" className="w-64 h-auto mx-auto rounded-xl shadow" />
            <p className="text-xs text-slate-500 font-mono">
              Nội dung CK: <strong className="text-blue-600">{watchedValues.invoiceNumber || 'HD0001'}</strong>
            </p>
            <p className="text-[11px] text-slate-400">Bấm bất kỳ đâu để đóng</p>
          </div>
        </div>
      )}

      {/* SERVICE CATALOG PICKER MODAL */}
      {isCatalogOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Chọn Dịch Vụ Từ Danh Mục</h3>
                    <p className="text-xs text-slate-500">Nhấn vào dịch vụ để thêm vào hóa đơn</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCatalogOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Tìm kiếm dịch vụ..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none bg-white transition-all"
                />
              </div>
            </div>

            {/* Service List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {catalogServices.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">
                    {catalogSearch ? 'Không tìm thấy dịch vụ phù hợp' : 'Chưa có dịch vụ nào trong danh mục'}
                  </p>
                  <p className="text-xs mt-1">
                    Vào trang <strong>Dịch vụ</strong> trong menu bên trái để thêm
                  </p>
                </div>
              ) : (
                catalogServices.map((svc) => (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => {
                      append({
                        name: svc.name,
                        description: svc.description || '',
                        metaInfo: svc.metaInfo || '',
                        unit: svc.unit || 'gói',
                        quantity: 1,
                        unitPrice: svc.unitPrice || 0,
                      });
                      setIsCatalogOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="font-semibold text-sm text-slate-900 truncate group-hover:text-blue-800">
                        {svc.name}
                      </div>
                      {svc.description && (
                        <div className="text-xs text-slate-500 truncate mt-0.5">{svc.description}</div>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        {svc.metaInfo && (
                          <span className="text-[11px] text-slate-400">{svc.metaInfo}</span>
                        )}
                        <span className="bg-slate-100 text-slate-600 text-[11px] px-1.5 py-0.5 rounded font-medium">
                          {svc.unit}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="font-bold text-sm text-slate-900 whitespace-nowrap">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(svc.unitPrice)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {catalogServices.length} dịch vụ trong danh mục
              </span>
              <button
                type="button"
                onClick={() => setIsCatalogOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
