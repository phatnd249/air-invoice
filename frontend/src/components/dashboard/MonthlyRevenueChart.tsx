'use client';

import React, { useState } from 'react';
import { BarChart3, TrendingUp, Info } from 'lucide-react';
import { formatVnd } from './DashboardKpiCards';

interface MonthlyTrendItem {
  monthKey: string;
  label: string;
  paidRevenue: number;
  pendingRevenue: number;
  paidCount: number;
  totalCount: number;
}

interface MonthlyRevenueChartProps {
  data: MonthlyTrendItem[];
}

export function MonthlyRevenueChart({ data }: MonthlyRevenueChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-center h-80 text-slate-400 text-sm">
        Chưa có dữ liệu xu hướng doanh thu
      </div>
    );
  }

  // Tìm giá trị max để scale chiều cao cột
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.paidRevenue + d.pendingRevenue, d.paidRevenue, 1000000))
  );

  // Tính tổng & trung bình trong 6 tháng
  const totalPeriodPaid = data.reduce((acc, curr) => acc + curr.paidRevenue, 0);
  const avgMonthlyPaid = Math.round(totalPeriodPaid / data.length);
  const highestMonth = [...data].sort((a, b) => b.paidRevenue - a.paidRevenue)[0];

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Xu Hướng Doanh Thu 6 Tháng</h3>
              <p className="text-xs text-slate-500">So sánh doanh thu thực thu và công nợ theo từng tháng</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span>Đã thu (PAID)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400" />
              <span>Chờ thu (Công nợ)</span>
            </div>
          </div>
        </div>

        {/* Quick summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-100">
          <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
            <div className="text-[11px] font-medium text-slate-500">Tổng thu 6 tháng</div>
            <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{formatVnd(totalPeriodPaid)}</div>
          </div>
          <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
            <div className="text-[11px] font-medium text-slate-500">Trung bình tháng</div>
            <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{formatVnd(avgMonthlyPaid)}</div>
          </div>
          <div className="hidden sm:block bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
            <div className="text-[11px] font-medium text-slate-500">Tháng cao điểm ({highestMonth?.label})</div>
            <div className="text-sm font-bold text-emerald-600 font-mono mt-0.5">
              {formatVnd(highestMonth?.paidRevenue)}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="mt-8 relative h-64 flex items-end gap-3 sm:gap-6 pt-6 pb-2 border-b border-slate-200">
        {/* Horizontal grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
          <div className="border-b border-slate-200 w-full" />
          <div className="border-b border-slate-200 w-full" />
          <div className="border-b border-slate-200 w-full" />
          <div className="border-b border-slate-200 w-full" />
        </div>

        {/* Bars */}
        {data.map((item, index) => {
          const paidHeightPct = Math.max(4, Math.round((item.paidRevenue / maxVal) * 100));
          const pendingHeightPct = Math.max(0, Math.round((item.pendingRevenue / maxVal) * 100));
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={item.monthKey}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="flex-1 flex flex-col items-center h-full justify-end relative cursor-pointer group"
            >
              {/* Tooltip on hover */}
              {isHovered && (
                <div className="absolute bottom-full mb-2 z-20 bg-slate-900 text-white text-xs rounded-xl p-3 shadow-xl pointer-events-none w-48 animate-in fade-in zoom-in-95 duration-150">
                  <div className="font-bold text-white border-b border-slate-700 pb-1.5 mb-1.5 flex justify-between items-center">
                    <span>Tháng {item.label}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                      {item.totalCount} HĐ
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-emerald-400">
                      <span>Đã thu:</span>
                      <span className="font-mono font-bold">{formatVnd(item.paidRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center text-amber-300">
                      <span>Chờ thu:</span>
                      <span className="font-mono">{formatVnd(item.pendingRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                      <span>Số HĐ hoàn tất:</span>
                      <span>{item.paidCount} HĐ</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bar Stack */}
              <div className="w-full max-w-[42px] flex items-end justify-center gap-1 h-full">
                {/* Cột Đã Thu */}
                <div
                  className={`w-1/2 rounded-t-md transition-all duration-300 ${
                    isHovered ? 'bg-emerald-600 shadow-md' : 'bg-emerald-500'
                  }`}
                  style={{ height: `${paidHeightPct}%` }}
                />

                {/* Cột Chờ Thu */}
                <div
                  className={`w-1/2 rounded-t-md transition-all duration-300 ${
                    isHovered ? 'bg-amber-500 shadow-md' : 'bg-amber-400/90'
                  }`}
                  style={{ height: `${Math.max(4, pendingHeightPct)}%` }}
                />
              </div>

              {/* Month label below */}
              <div className="mt-3 text-xs font-semibold text-slate-600 tracking-tight group-hover:text-blue-600 transition-colors">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
        <span>* Dữ liệu cập nhật tự động theo thời gian thực từ các hóa đơn đã phát hành</span>
        <span>Đơn vị tính: VNĐ</span>
      </div>
    </div>
  );
}

