'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Building2, CreditCard, Save, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();

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
    }
  }, [settings, reset]);

  const mutation = useMutation({
    mutationFn: async (formData: any) => {
      return api.put('/settings', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      alert('Đã lưu cài đặt thành công!');
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate({
      ...data,
      defaultVatRate: Number(data.defaultVatRate) || 10,
      nextInvoiceNumber: Number(data.nextInvoiceNumber) || 1,
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Đang tải cài đặt...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Cài Đặt Hệ Thống</h1>
        <p className="text-sm text-slate-500 mt-1">
          Cấu hình thông tin doanh nghiệp, tài khoản ngân hàng nhận chuyển khoản và quy tắc tạo hóa đơn
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Thông tin đơn vị bán */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-900 font-semibold mb-4 border-b pb-3">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span>Thông Tin Đơn Vị (Người Bán)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Tên Doanh Nghiệp</label>
              <input
                {...register('companyName')}
                className="w-full px-3.5 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="VD: CÔNG TY TNHH GIÁO DỤC AI ROBOTIC"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Mã Số Thuế</label>
              <input
                {...register('taxCode')}
                className="w-full px-3.5 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="3603893101"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Số Điện Thoại</label>
              <input
                {...register('phone')}
                className="w-full px-3.5 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="0900000000"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Địa Chỉ</label>
              <input
                {...register('address')}
                className="w-full px-3.5 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Số 10 Huỳnh Văn Nghệ, P. Trấn Biên, Đồng Nai"
              />
            </div>
          </div>
        </div>

        {/* Thông tin Ngân hàng & VietQR */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-900 font-semibold mb-4 border-b pb-3">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span>Tài Khoản Nhận Chuyển Khoản & Sinh VietQR (SePay)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Ngân Hàng</label>
              <input
                {...register('bankCode')}
                className="w-full px-3.5 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Vietcombank, MB, ACB..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Số Tài Khoản</label>
              <input
                {...register('bankAccount')}
                className="w-full px-3.5 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="SHYNNERI hoặc 0123456789"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Tên Chủ Tài Khoản</label>
              <input
                {...register('bankAccountName')}
                className="w-full px-3.5 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="AI ROBOTIC"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm space-x-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{mutation.isPending ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
