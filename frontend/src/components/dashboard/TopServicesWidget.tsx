'use client';

import React from 'react';
import { Layers, ArrowUpRight, Award } from 'lucide-react';
import Link from 'next/link';
import { formatVnd } from './DashboardKpiCards';

interface ServiceItem {
  name: string;
  quantity: number;
  revenue: number;
  percentage: number;
}

interface TopServicesWidgetProps {
  services: ServiceItem[];
}

export function TopServicesWidget({ services }: TopServicesWidgetProps) {
  const medalColors = [
    'bg-amber-100 text-amber-800 border-amber-300', // Gold
    'bg-slate-200 text-slate-700 border-slate-300', // Silver
    'bg-orange-100 text-orange-800 border-orange-300', // Bronze
    'bg-slate-100 text-slate-600 border-slate-200',
    'bg-slate-100 text-slate-600 border-slate-200',
  ];

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Top Gói Dịch Vụ Bán Chạy</h3>
              <p className="text-xs text-slate-500">Doanh thu & số lượng đã cung cấp</p>
            </div>
          </div>

          <Link
            href="/services"
            className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center"
          >
            Danh mục <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        </div>

        {services.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Chưa có số liệu dịch vụ trong kỳ này
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((item, idx) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 border ${
                        medalColors[idx] || medalColors[3]
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800 truncate" title={item.name}>
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 font-mono">
                    <span className="text-slate-400 text-[11px] font-sans">
                      {item.quantity} gói
                    </span>
                    <span className="font-bold text-slate-900">
                      {formatVnd(item.revenue)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, Math.min(100, item.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Xếp hạng theo tổng doanh thu hóa đơn</span>
        <span className="font-semibold text-slate-600">Top 5</span>
      </div>
    </div>
  );
}

