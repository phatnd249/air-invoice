'use client';

import React from 'react';
import {
  Wallet,
  Clock,
  CheckCircle2,
  CalendarClock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardStatsResponse } from './types';

interface DashboardKpiCardsProps {
  stats: DashboardStatsResponse;
}

export function formatVnd(val?: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

export function DashboardKpiCards({ stats }: DashboardKpiCardsProps) {
  const { revenue, invoices, subscriptions } = stats;

  const isGrowthPositive = revenue.growthRate >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Doanh thu thực thu */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow duration-200 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Doanh Thu Đã Thu
          </span>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            {formatVnd(revenue.paid)}
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                isGrowthPositive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {isGrowthPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{isGrowthPositive ? `+${revenue.growthRate}%` : `${revenue.growthRate}%`}</span>
            </span>
            <span className="text-[11px] text-slate-500">so với tháng trước</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Tháng này: <strong className="text-slate-700">{formatVnd(revenue.thisMonth)}</strong></span>
          <Link
            href="/invoices?status=PAID"
            className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-0.5"
          >
            Chi tiết <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* 2. Công nợ / Chờ thanh toán */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow duration-200 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Chờ Thu / Công Nợ
          </span>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono tracking-tight">
            {formatVnd(revenue.pending)}
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{invoices.issued + invoices.sent} hóa đơn</span>
            </span>
            <span className="text-[11px] text-slate-500">chưa nhận chuyển khoản</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Tổng lập: <strong className="text-slate-700">{formatVnd(revenue.totalInvoiced)}</strong></span>
          <Link
            href="/invoices?status=ISSUED"
            className="text-amber-600 hover:text-amber-700 font-semibold inline-flex items-center gap-0.5"
          >
            Đôn đốc <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* 3. Tỷ lệ thanh toán & Số lượng hóa đơn */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow duration-200 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tỷ Lệ Thu Tiền
          </span>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono tracking-tight">
            {invoices.collectionRate}%
          </div>

          <div className="mt-2.5">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, invoices.collectionRate))}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Đã thu: <strong className="text-blue-700">{invoices.paid}</strong> / {invoices.total} HĐ
          </span>
          <Link
            href="/invoices"
            className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-0.5"
          >
            Danh sách <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* 4. Doanh thu định kỳ (MRR) & Subscriptions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow duration-200 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Doanh Thu Định Kỳ (MRR)
          </span>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <CalendarClock className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 font-mono tracking-tight">
            ~{formatVnd(subscriptions.estimatedMRR)}
            <span className="text-xs font-normal text-slate-400 font-sans ml-1">/tháng</span>
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{subscriptions.active} an toàn</span>
            </span>
            {subscriptions.expiringSoon > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <span>{subscriptions.expiringSoon} sắp hết</span>
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Tổng {subscriptions.total} gói dịch vụ</span>
          <Link
            href="/subscriptions"
            className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-0.5"
          >
            Quản lý <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

