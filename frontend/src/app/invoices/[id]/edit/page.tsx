'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Plus,
  Trash2,
  ArrowLeft,
  Eye,
  QrCode,
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
  FileCheck,
  Building2,
  CheckCircle2,
  ExternalLink,
  Save,
  Pencil,
} from 'lucide-react';
import Link from 'next/link';
import InvoiceTemplateRenderer from '@/components/InvoiceTemplateRenderer';
import { INVOICE_TYPE_CONFIG, INVOICE_FORM_CONFIG, InvoiceType, InvoiceForm } from '@invoice/types';

interface CatalogService {
  id: string;
  name: string;
  description?: string;
  metaInfo?: string;
  unit: string;
  unitPrice: number;
}

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const queryClient = useQueryClient();

  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'CASH' | 'CARD'>('TRANSFER');
  const [cashGiven, setCashGiven] = useState<number | ''>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isQrZoomed, setIsQrZoomed] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [autoSaveToCatalog, setAutoSaveToCatalog] = useState(true);

  // 1. Fetch Existing Invoice
  const { data: invoice, isLoading: isLoadingInvoice, isError } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const res = await api.get(`/invoices/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // 2. Fetch Services Catalog
  const { data: catalogServices = [] } = useQuery<CatalogService[]>({
    queryKey: ['services-catalog', catalogSearch],
    queryFn: async () => {
      const res = await api.get('/services', { params: catalogSearch ? { search: catalogSearch } : {} });
      return res.data;
    },
    enabled: isCatalogOpen,
  });

  // 3. Fetch Settings
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

  // Fetch danh sách mẫu thiết kế hóa đơn
  const { data: invoiceTemplates = [] } = useQuery<any[]>({
    queryKey: ['invoice-templates'],
    queryFn: async () => {
      const res = await api.get('/invoice-templates');
      return res.data;
    },
  });

  const companies: Array<any> =
    settings?.companies && Array.isArray(settings.companies) && settings.companies.length > 0
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

  const bankAccounts: Array<any> =
    settings?.bankAccounts && Array.isArray(settings.bankAccounts) && settings.bankAccounts.length > 0
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

  const { register, control, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      invoiceNumber: '',
      invoiceType: 'GTGT' as InvoiceType,
      invoiceForm: 'WITH_TAX_CODE' as InvoiceForm,
      templateId: 'standard-classic',
      issueDate: '',
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
      terms: '',
      items: [
        {
          name: '',
          description: '',
          metaInfo: '',
          unit: 'gói',
          quantity: 1,
          unitPrice: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Populate form with existing invoice data
  useEffect(() => {
    if (invoice) {
      reset({
        invoiceNumber: invoice.invoiceNumber || '',
        invoiceType: invoice.invoiceType || 'GTGT',
        invoiceForm: invoice.invoiceForm || 'WITH_TAX_CODE',
        templateId: invoice.templateId || 'standard-classic',
        issueDate: invoice.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : '',
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
        buyerName: invoice.buyerName || '',
        buyerEmail: invoice.buyerEmail || '',
        buyerPhone: invoice.buyerPhone || '',
        buyerCompany: invoice.buyerCompany || '',
        buyerTaxCode: invoice.buyerTaxCode || '',
        buyerAddress: invoice.buyerAddress || '',
        hasVat: invoice.hasVat ?? true,
        vatRate: invoice.vatRate ?? 10,
        otherFee: invoice.otherFee ?? 0,
        notes: invoice.notes || '',
        terms: invoice.terms || '',
        items:
          invoice.items && invoice.items.length > 0
            ? invoice.items.map((it: any) => ({
                name: it.name || '',
                description: it.description || '',
                metaInfo: it.metaInfo || '',
                unit: it.unit || 'gói',
                quantity: it.quantity || 1,
                unitPrice: it.unitPrice || 0,
              }))
            : [
                {
                  name: '',
                  description: '',
                  metaInfo: '',
                  unit: 'gói',
                  quantity: 1,
                  unitPrice: 0,
                },
              ],
      });
    }
  }, [invoice, reset]);

  const watchedValues = watch();

  const subTotal = (watchedValues.items || []).reduce((acc: number, item: any) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return acc + qty * price;
  }, 0);

  const vatAmount = watchedValues.hasVat ? (subTotal * (Number(watchedValues.vatRate) || 0)) / 100 : 0;
  const otherFee = Number(watchedValues.otherFee) || 0;
  const grandTotal = subTotal + vatAmount + otherFee;

  const activeCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0];
  const activeBank = bankAccounts.find((a) => a.id === selectedBankId) || bankAccounts[0];

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.put(`/invoices/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      alert('Đã cập nhật hóa đơn thành công!');
      router.push(`/invoices/${id}`);
    },
    onError: (err: any) => {
      alert('Lỗi cập nhật hóa đơn: ' + (err.response?.data?.message || err.message));
    },
  });

  const onSubmit = (formData: any) => {
    updateMutation.mutate({
      ...formData,
      autoSaveItemsToCatalog: autoSaveToCatalog,
      sellerName: activeCompany?.name || invoice?.sellerName || settings?.companyName,
      sellerTaxCode: activeCompany?.taxCode || invoice?.sellerTaxCode || settings?.taxCode,
      sellerAddress: activeCompany?.address || invoice?.sellerAddress || settings?.address,
      sellerPhone: activeCompany?.phone || invoice?.sellerPhone || settings?.phone,
      sellerEmail: activeCompany?.email || invoice?.sellerEmail || settings?.email,
      sellerLogoUrl: activeCompany?.logoUrl || invoice?.sellerLogoUrl || settings?.logoUrl,
      grandTotal,
      subTotal,
      vatAmount,
      otherFee,
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  if (isLoadingInvoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy hóa đơn cần chỉnh sửa</h2>
        <Link
          href="/invoices"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Quản lý Hóa đơn</span>
        </Link>
      </div>
    );
  }

  const selectedTemplateId = watchedValues.templateId || invoice.templateId || 'standard-classic';
  const activeTemplate = (invoiceTemplates as any[]).find(
    (t: any) => t.code === selectedTemplateId || t.id === selectedTemplateId
  );


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center space-x-4">
          <Link
            href={`/invoices/${id}`}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-all shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Chỉnh Sửa Hóa Đơn</h1>
              <span className="font-mono text-xs font-bold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-md border border-amber-300">
                {invoice.invoiceNumber}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Cập nhật thông tin dịch vụ, người mua và bảng giá cho hóa đơn #{invoice.invoiceNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex items-center px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl shadow-xs space-x-2 transition-all"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Xem Trước Bản In</span>
          </button>

          <Link
            href={`/invoices/${id}`}
            className="inline-flex items-center px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl shadow-xs transition-all"
          >
            <span>Hủy Bỏ</span>
          </Link>

          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={updateMutation.isPending}
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs space-x-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{updateMutation.isPending ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Invoice Meta Settings */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Thông Tin Hóa Đơn</h3>
                </div>
                <span className="text-xs text-slate-400">Số HĐ: {invoice.invoiceNumber}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Loại Hóa Đơn
                  </label>
                  <select
                    {...register('invoiceType')}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    {Object.entries(INVOICE_TYPE_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.shortLabel} - {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ngày Tạo HĐ
                  </label>
                  <input
                    type="date"
                    {...register('issueDate')}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Hạn Thanh Toán
                  </label>
                  <input
                    type="date"
                    {...register('dueDate')}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Buyer Customer Info */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <User className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Thông Tin Khách Hàng (Người Mua)</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tên Khách Hàng / Đại Diện *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    {...register('buyerName', { required: true })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Số Điện Thoại (Zalo)
                  </label>
                  <input
                    type="tel"
                    placeholder="0901234567"
                    {...register('buyerPhone')}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Địa Chỉ Email
                  </label>
                  <input
                    type="email"
                    placeholder="khachhang@gmail.com"
                    {...register('buyerEmail')}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mã Số Thuế (Nếu có)
                  </label>
                  <input
                    type="text"
                    placeholder="0315894123"
                    {...register('buyerTaxCode')}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tên Doanh Nghiệp / Đơn Vị (Nếu có)
                  </label>
                  <input
                    type="text"
                    placeholder="Công ty TNHH Giải Pháp Số XYZ"
                    {...register('buyerCompany')}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Địa Chỉ
                  </label>
                  <input
                    type="text"
                    placeholder="Số 123 đường ABC, Quận 1, TP. HCM"
                    {...register('buyerAddress')}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Service Items Table */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Danh Mục Dịch Vụ / Hàng Hóa</h3>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsCatalogOpen(true)}
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
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
                    <span>Thêm dòng dịch vụ</span>
                  </button>
                </div>
              </div>

              {/* Rows */}
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
                            Thành tiền:{' '}
                            <span className="text-emerald-600 font-bold text-sm">
                              {formatCurrency(rowAmount)}
                            </span>
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

                      <div>
                        <input
                          type="text"
                          placeholder="Tên gói dịch vụ (VD: Gói AI WRITER - 1 Năm Bản Quyền)"
                          {...register(`items.${index}.name` as const, { required: true })}
                          className="w-full px-3.5 py-2 text-sm font-semibold text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          placeholder="Chi tiết / Tên miền (VD: thanhdattax.com)"
                          {...register(`items.${index}.description` as const)}
                          className="w-full px-3.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-700"
                        />
                        <input
                          type="text"
                          placeholder="Thời hạn HSD (VD: 25/06/2026 - 25/06/2027)"
                          {...register(`items.${index}.metaInfo` as const)}
                          className="w-full px-3.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-700"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">
                            Số Lượng
                          </label>
                          <input
                            type="number"
                            min="1"
                            {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                            className="w-full px-3 py-1.5 text-sm font-semibold border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">
                            Đơn Vị Tính
                          </label>
                          <input
                            type="text"
                            placeholder="gói / năm"
                            {...register(`items.${index}.unit` as const)}
                            className="w-full px-3 py-1.5 text-sm font-semibold border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">
                            Đơn Giá (VNĐ)
                          </label>
                          <input
                            type="number"
                            step="1000"
                            placeholder="660000"
                            {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })}
                            className="w-full px-3 py-1.5 text-sm font-semibold border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tùy chọn tự động lưu vào danh mục */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between text-xs mt-3">
                <label className="flex items-center space-x-2.5 cursor-pointer text-slate-800 font-semibold select-none">
                  <input
                    type="checkbox"
                    checked={autoSaveToCatalog}
                    onChange={(e) => setAutoSaveToCatalog(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>⚡ Tự động lưu các gói dịch vụ mới vào Danh mục hệ thống</span>
                </label>
                <span className="text-[11px] text-blue-600 font-medium hidden sm:inline">
                  Hệ thống tự động lưu vào danh mục gói
                </span>
              </div>
            </div>

            {/* Note & Terms Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
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

        {/* Right Summary Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Financial Calculation Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Chi Tiết Thanh Toán</span>
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-semibold">
                VND
              </span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Cộng tiền dịch vụ:</span>
                <span className="font-semibold text-slate-900 font-mono text-sm">
                  {formatCurrency(subTotal)}
                </span>
              </div>

              {/* VAT Checkbox & Rate */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      {...register('hasVat')}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Tính Thuế GTGT (VAT)</span>
                  </label>

                  {watchedValues.hasVat && (
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        {...register('vatRate', { valueAsNumber: true })}
                        className="w-14 px-2 py-1 text-xs border border-slate-200 rounded font-semibold text-right"
                      />
                      <span className="text-slate-500">%</span>
                    </div>
                  )}
                </div>

                {watchedValues.hasVat && (
                  <div className="flex justify-between items-center text-slate-600 pl-6">
                    <span>Tiền thuế GTGT:</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {formatCurrency(vatAmount)}
                    </span>
                  </div>
                )}
              </div>

              {/* Other Fee */}
              <div className="flex justify-between items-center text-slate-600 pt-2 border-t border-slate-100">
                <span>Phí dịch vụ khác:</span>
                <div className="w-28">
                  <input
                    type="number"
                    step="1000"
                    {...register('otherFee', { valueAsNumber: true })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-right font-mono"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Grand Total */}
              <div className="pt-4 border-t border-slate-200 flex justify-between items-baseline">
                <span className="font-bold text-slate-900 text-sm uppercase">TỔNG THANH TOÁN:</span>
                <span className="font-mono text-xl font-extrabold text-blue-600">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={updateMutation.isPending}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-xs space-x-2 transition-all flex items-center justify-center cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{updateMutation.isPending ? 'Đang cập nhật...' : 'Lưu Thay Đổi Hóa Đơn'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Selector Modal */}
      {isCatalogOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">Chọn Gói Dịch Vụ Từ Danh Mục</h3>
              <button
                type="button"
                onClick={() => setIsCatalogOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm gói dịch vụ..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {catalogServices.map((svc) => (
                <div
                  key={svc.id}
                  onClick={() => {
                    append({
                      name: svc.name,
                      description: svc.description || '',
                      metaInfo: svc.metaInfo || '',
                      unit: svc.unit,
                      quantity: 1,
                      unitPrice: svc.unitPrice,
                    });
                    setIsCatalogOpen(false);
                  }}
                  className="p-3 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/40 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs group-hover:text-blue-600">
                      {svc.name}
                    </h4>
                    {svc.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{svc.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-xs text-emerald-600 block">
                      {formatCurrency(svc.unitPrice)}
                    </span>
                    <span className="text-[10px] text-slate-400">/{svc.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Xem Trước Bản In #{invoice.invoiceNumber}</h3>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto bg-slate-100 flex-1">
              <InvoiceTemplateRenderer
                invoice={{
                  ...watchedValues,
                  invoiceNumber: invoice.invoiceNumber,
                  grandTotal,
                  subTotal,
                  vatAmount,
                  otherFee,
                  paymentCode: invoice.paymentCode,
                  qrDataUrl: invoice.qrDataUrl,
                }}
                settings={settings}
                overrideTemplateId={selectedTemplateId}
                  designConfig={activeTemplate}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

