'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Trash2, ArrowLeft, Save, Eye, QrCode, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function NewInvoicePage() {
  const router = useRouter();

  // Lấy thông tin cài đặt mặc định
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

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
      issueDate: new Date().toISOString().split('T')[0],
      buyerName: '',
      buyerCompany: '',
      buyerTaxCode: '',
      buyerAddress: '',
      hasVat: true,
      vatRate: 10,
      items: [
        {
          name: '',
          description: '',
          metaInfo: '',
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

  useEffect(() => {
    if (nextNumberData?.nextNumber) {
      setValue('invoiceNumber', nextNumberData.nextNumber);
    }
  }, [nextNumberData, setValue]);

  // Watch để tính toán preview realtime
  const watchedValues = watch();
  const items = watchedValues.items || [];
  const subTotal = items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const vatRate = watchedValues.hasVat ? Number(watchedValues.vatRate || 10) : 0;
  const vatAmount = (subTotal * vatRate) / 100;
  const grandTotal = subTotal + vatAmount;

  // VietQR Preview Link
  const qrPreviewUrl =
    settings?.bankCode && settings?.bankAccount
      ? `https://qr.sepay.vn/img?bank=${settings.bankCode}&acc=${settings.bankAccount}&template=compact&amount=${Math.round(grandTotal)}&des=${encodeURIComponent(
          `${watchedValues.invoiceNumber || 'HD'} - ${items[0]?.name || 'Dich vu'}`
        )}`
      : '';

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/invoices', data);
    },
    onSuccess: (res) => {
      alert('Tạo hóa đơn thành công!');
      router.push('/invoices');
    },
    onError: (err: any) => {
      alert('Lỗi tạo hóa đơn: ' + (err.response?.data?.message || err.message));
    },
  });

  const onSubmit = (formData: any) => {
    createMutation.mutate(formData);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-4">
          <Link
            href="/invoices"
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tạo Hóa Đơn Mới</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Nhập thông tin bên trái và xem trước hóa đơn trực quan kèm mã VietQR ở bên phải
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit(onSubmit)}
          disabled={createMutation.isPending}
          className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm space-x-2 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{createMutation.isPending ? 'Đang lưu...' : 'Lưu Hóa Đơn'}</span>
        </button>
      </div>

      {/* Main Split Layout: Left Form / Right Realtime Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Input Form (7 Cols) */}
        <div className="xl:col-span-7 space-y-6">
          {/* Thông tin chung */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 border-b pb-2">1. Thông Tin Chung Hóa Đơn</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Số Hóa Đơn</label>
                <input
                  {...register('invoiceNumber')}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-semibold text-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="HD-000001"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Ngày Lập</label>
                <input
                  type="date"
                  {...register('issueDate')}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Thông tin khách hàng */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 border-b pb-2">2. Thông Tin Khách Hàng (Người Mua)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tên Người Mua / Đại Diện *</label>
                <input
                  {...register('buyerName', { required: true })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tên Công Ty (Nếu có)</label>
                <input
                  {...register('buyerCompany')}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Công ty ABC"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Mã Số Thuế</label>
                <input
                  {...register('buyerTaxCode')}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="0312345678"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Địa Chỉ</label>
                <input
                  {...register('buyerAddress')}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="TP. Biên Hòa, Đồng Nai"
                />
              </div>
            </div>
          </div>

          {/* Danh sách Dịch vụ / Hàng hóa */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold text-slate-900">3. Danh Sách Dịch Vụ / Hàng Hóa</h3>
              <button
                type="button"
                onClick={() => append({ name: '', description: '', metaInfo: '', quantity: 1, unitPrice: 0 })}
                className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Dịch Vụ</span>
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((field, idx) => (
                <div key={field.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg relative space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500">Mục #{idx + 1}</span>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-6">
                      <label className="block text-xs text-slate-600 mb-1">Tên Dịch Vụ *</label>
                      <input
                        {...register(`items.${idx}.name` as const, { required: true })}
                        className="w-full px-3 py-1.5 border rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="VD: Gói dịch vụ AI & Robot"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs text-slate-600 mb-1">Số Lượng</label>
                      <input
                        type="number"
                        step="any"
                        {...register(`items.${idx}.quantity` as const)}
                        className="w-full px-3 py-1.5 border rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs text-slate-600 mb-1">Đơn Giá (₫)</label>
                      <input
                        type="number"
                        {...register(`items.${idx}.unitPrice` as const)}
                        className="w-full px-3 py-1.5 border rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Mô tả chi tiết</label>
                      <input
                        {...register(`items.${idx}.description` as const)}
                        className="w-full px-3 py-1.5 border rounded text-xs bg-white focus:outline-none"
                        placeholder="Mô tả công việc thực hiện..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Thời hạn (MetaInfo)</label>
                      <input
                        {...register(`items.${idx}.metaInfo` as const)}
                        className="w-full px-3 py-1.5 border rounded text-xs bg-white focus:outline-none"
                        placeholder="VD: (01/01/2026 - 31/01/2026)"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Thuế VAT */}
            <div className="pt-3 border-t flex items-center justify-between">
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('hasVat')}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span>Tính thuế VAT 10%</span>
              </label>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-900">
                  Tổng thanh toán: {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Realtime HTML/CSS Preview Matching Template (5 Cols) */}
        <div className="xl:col-span-5 sticky top-6">
          <div className="bg-slate-900 text-white px-4 py-2 rounded-t-xl text-xs font-semibold flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>Xem Trước Hóa Đơn Trực Quan (Realtime A4 Preview)</span>
            </span>
            <span className="bg-blue-600/80 px-2 py-0.5 rounded text-[10px]">Standard Classic</span>
          </div>

          {/* Invoice Paper Simulated Container */}
          <div className="bg-white border-x border-b border-slate-300 shadow-2xl rounded-b-xl p-8 font-sans text-slate-800 text-[13px] leading-normal min-h-[600px]">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-[#2c3e50] pb-4 mb-5">
              <div>
                <h2 className="text-xl font-bold text-[#2c3e50] flex items-center space-x-2">
                  <span>HÓA ĐƠN {watchedValues.invoiceNumber || 'HD-XXXXXX'}</span>
                  <span className="bg-[#e74c3c] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    Chưa thanh toán
                  </span>
                </h2>
              </div>
              <div className="text-xs text-slate-600">
                Ngày lập: <strong>{watchedValues.issueDate}</strong>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nhà cung cấp</span>
                <div className="font-bold text-slate-900">{settings?.companyName || 'CÔNG TY TNHH GIÁO DỤC AI ROBOTIC'}</div>
                <div className="text-slate-600 text-xs">{settings?.address || 'Số 10 Huỳnh Văn Nghệ, P. Trấn Biên, Đồng Nai'}</div>
                <div className="text-slate-600 text-xs">MST: {settings?.taxCode || '3603893101'}</div>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Khách hàng</span>
                <div className="font-bold text-slate-900">{watchedValues.buyerName || '---'}</div>
                {watchedValues.buyerCompany && <div className="text-slate-600 text-xs">{watchedValues.buyerCompany}</div>}
                {watchedValues.buyerAddress && <div className="text-slate-600 text-xs">{watchedValues.buyerAddress}</div>}
                {watchedValues.buyerTaxCode && <div className="text-slate-600 text-xs">MST: {watchedValues.buyerTaxCode}</div>}
              </div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse mb-6">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-[11px] uppercase border-b-2 border-slate-300">
                  <th className="py-2 px-2 text-left w-8">#</th>
                  <th className="py-2 px-2 text-left">Dịch Vụ</th>
                  <th className="py-2 px-2 text-right w-28">Thành Tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((it, idx) => {
                  const lineTotal = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
                  return (
                    <tr key={idx}>
                      <td className="py-2 px-2 align-top text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-2 align-top">
                        <span className="font-bold text-[#2c3e50] block">{it.name || '---'}</span>
                        {it.description && <span className="text-slate-600 block text-xs">{it.description}</span>}
                        {it.metaInfo && <span className="text-slate-400 block text-[11px] italic">{it.metaInfo}</span>}
                      </td>
                      <td className="py-2 px-2 align-top text-right font-medium">
                        {formatCurrency(lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Footer with QR and Totals */}
            <div className="flex justify-between items-start pt-4 border-t border-slate-100">
              <div className="text-center p-2 bg-slate-50 border border-slate-200 rounded-lg w-44">
                <div className="text-[10px] text-slate-500 mb-1 font-medium">Quét mã thanh toán</div>
                {qrPreviewUrl && grandTotal > 0 ? (
                  <img
                    src={qrPreviewUrl}
                    alt="VietQR"
                    className="w-36 h-auto mx-auto rounded shadow-sm"
                  />
                ) : (
                  <div className="w-36 h-36 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs mx-auto">
                    <QrCode className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div className="w-52 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Tổng phụ:</span>
                  <span className="font-medium">{formatCurrency(subTotal)}</span>
                </div>
                {watchedValues.hasVat && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">VAT (10%):</span>
                    <span className="font-medium">{formatCurrency(vatAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-[#2c3e50] pt-2 border-t-2 border-[#2c3e50] mt-2">
                  <span>TỔNG CỘNG:</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
