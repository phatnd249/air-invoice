'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  LayoutDashboard,
  RefreshCw,
  Plus,
  Calendar,
  Layers,
  Receipt,
  UserPlus,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { PeriodType, DashboardStatsResponse } from '@/components/dashboard/types';
import { DashboardKpiCards } from '@/components/dashboard/DashboardKpiCards';
import { MonthlyRevenueChart } from '@/components/dashboard/MonthlyRevenueChart';
import { InvoiceStatusDonut } from '@/components/dashboard/InvoiceStatusDonut';
import { TopServicesWidget } from '@/components/dashboard/TopServicesWidget';
import { OperationalHealthWidget } from '@/components/dashboard/OperationalHealthWidget';
import { RecentInvoicesTable } from '@/components/dashboard/RecentInvoicesTable';
import { UrgentSubscriptionsWidget } from '@/components/dashboard/UrgentSubscriptionsWidget';

const PERIOD_OPTIONS: Array<{ id: PeriodType; label: string }> = [
  { id: 'all', label: 'Toàn thời gian' },
  { id: 'today', label: 'Hôm nay' },
  { id: '7d', label: '7 ngày qua' },
  { id: '30d', label: '30 ngày qua' },
  { id: 'this_month', label: 'Tháng này' },
  { id: 'last_month', label: 'Tháng trước' },
  { id: 'this_year', label: 'Năm nay' },
];

export default function DashboardPage() {
  const [period, setPeriod] = useState<PeriodType>('all');

  const {
    data: stats,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<DashboardStatsResponse>({
    queryKey: ['dashboard-stats', period],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats', {
        params: { period },
      });
      return res.data;
    },
    staleTime: 30000,
  });

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* ── Top Header & Actions ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Dashboard Tổng Quan
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Báo cáo số liệu tài chính, hiệu suất phát hành hóa đơn và cảnh báo dịch vụ khách hàng
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 transition-all shadow-xs cursor-pointer"
            title="Làm mới số liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <Link
            href="/invoices/new"
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Lập Hóa Đơn Mới</span>
          </Link>
        </div>
      </div>

      {/* ── Period Filter Bar ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 px-2 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Kỳ báo cáo:</span>
          </div>
          {PERIOD_OPTIONS.map((opt) => {
            const isSelected = period === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPeriod(opt.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-400 hidden lg:block px-2">
          {isFetching ? 'Đang đồng bộ số liệu...' : 'Dữ liệu thời gian thực'}
        </div>
      </div>

      {/* ── Main Content Area ── */}
      {isLoading || !stats ? (
        /* Loading Skeleton */
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 bg-white rounded-2xl border border-slate-200/60 p-5" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 h-96 bg-white rounded-2xl border border-slate-200/60" />
            <div className="lg:col-span-4 h-96 bg-white rounded-2xl border border-slate-200/60" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Row 1: KPI Cards */}
          <DashboardKpiCards stats={stats} />

          {/* Row 2: Biểu đồ xu hướng 6 tháng & Cơ cấu trạng thái hóa đơn */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <MonthlyRevenueChart data={stats.monthlyTrend} />
            </div>
            <div className="lg:col-span-4">
              <InvoiceStatusDonut
                data={stats.statusDistribution}
                totalInvoices={stats.invoices.total}
              />
            </div>
          </div>

          {/* Row 3: Top gói dịch vụ bán chạy & Vận hành hàng chờ Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopServicesWidget services={stats.topServices} />
            <OperationalHealthWidget queue={stats.queue} />
          </div>

          {/* Row 4: Hóa đơn mới nhất & Khách hàng cần gia hạn gấp */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentInvoicesTable invoices={stats.recentInvoices} />
            <UrgentSubscriptionsWidget subscriptions={stats.urgentSubscriptions} />
          </div>
        </div>
      )}
    </div>
  );
}
