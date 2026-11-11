'use client';

import React from 'react';
import { PieChart, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { formatVnd } from './DashboardKpiCards';

interface StatusItem {
  status: string;
  label: string;
  count: number;
  amount: number;
  percentage: number;
  color: string;
}

interface InvoiceStatusDonutProps {
  data: StatusItem[];
  totalInvoices: number;
}

export function InvoiceStatusDonut({ data, totalInvoices }: InvoiceStatusDonutProps) {
  // Tính tọa độ SVG donut segments
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Trạng Thái Hóa Đơn</h3>
              <p className="text-xs text-slate-500">Tỷ lệ thanh toán & phát hành</p>
            </div>
          </div>

          <Link
            href="/invoices"
            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center"
          >
            Tất cả <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        </div>

        {/* SVG Donut Visual */}
        <div className="flex items-center justify-center my-6 relative">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />

            {/* Status Segments */}
            {data.map((item) => {
              const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -cumulativeOffset;
              cumulativeOffset += (item.percentage / 100) * circumference;

              if (item.count === 0) return null;

              return (
                <circle
                  key={item.status}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500 hover:opacity-85"
                />
              );
            })}
          </svg>

          {/* Center text in donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {totalInvoices}
            </span>
            <span className="text-[11px] font-medium text-slate-400">Tổng hóa đơn</span>
          </div>
        </div>
      </div>

      {/* Legend & Breakdown List */}
      <div className="space-y-2.5 pt-3 border-t border-slate-100">
        {data.map((item) => (
          <div key={item.status} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className="text-slate-400 font-mono text-[11px]">({item.count})</span>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-500">{formatVnd(item.amount)}</span>
              <span className="font-bold text-slate-800 w-9 text-right">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
