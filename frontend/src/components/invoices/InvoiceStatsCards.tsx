import React from 'react';
import { CheckCircle2, Clock, FileText, TrendingUp } from 'lucide-react';
import { InvoiceMetrics, formatCurrency } from './types';

interface InvoiceStatsCardsProps {
  metrics: InvoiceMetrics;
}

export function InvoiceStatsCards({ metrics }: InvoiceStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Đã Thu */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-sm font-medium text-slate-500">
          <span>Doanh Thu Thực Thu (Đã Trả)</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums tracking-tight text-emerald-700">
          {formatCurrency(metrics.paidRevenue)}
        </div>
        <div className="text-xs text-slate-500 font-medium">
          {metrics.paidCount} hóa đơn đã hoàn tất
        </div>
      </div>

      {/* Metric 2: Chờ Thu */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-sm font-medium text-slate-500">
          <span>Đang Chờ Thanh Toán</span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums tracking-tight text-amber-600">
          {formatCurrency(metrics.pendingRevenue)}
        </div>
        <div className="text-xs text-slate-500 font-medium">
          {metrics.pendingCount} hóa đơn chưa thanh toán
        </div>
      </div>

      {/* Metric 3: Tổng Số Hóa Đơn */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-sm font-medium text-slate-500">
          <span>Tổng Hóa Đơn Hoạt Động</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums tracking-tight text-slate-900">
          {metrics.totalCount}
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Bao gồm GTGT, Bán hàng & Dịch vụ
        </div>
      </div>

      {/* Metric 4: Tỉ Lệ Thu Tiền */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-sm font-medium text-slate-500">
          <span>Tỉ Lệ Thu Tiền</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums tracking-tight text-slate-900">
          {metrics.totalCount > 0
            ? `${Math.round((metrics.paidCount / metrics.totalCount) * 100)}%`
            : '100%'}
        </div>
        <div className="text-xs text-slate-500 font-medium">
          {metrics.cancelledCount > 0 ? `${metrics.cancelledCount} hóa đơn đã hủy` : 'Không có hóa đơn hủy'}
        </div>
      </div>
    </div>
  );
}

