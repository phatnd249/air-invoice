'use client';

import React from 'react';
import { Clock, CheckCircle2, AlertCircle, RefreshCw, ArrowUpRight, Zap, Mail, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface QueueStats {
  total: number;
  completed: number;
  pending: number;
  processing: number;
  failed: number;
  successRate: number;
}

interface OperationalHealthWidgetProps {
  queue: QueueStats;
}

export function OperationalHealthWidget({ queue }: OperationalHealthWidgetProps) {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Vận Hành & Hàng Chờ (Queue)</h3>
              <p className="text-xs text-slate-500">Tiến trình gửi Email & Zalo tự động</p>
            </div>
          </div>

          <Link
            href="/queue"
            className="text-xs text-purple-600 hover:text-purple-700 font-semibold inline-flex items-center"
          >
            Hàng chờ <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        </div>

        {/* Gauge / Big Rate */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 sm:p-5 my-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tỷ lệ xử lý thành công
              </span>
              <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-0.5">
                {queue.successRate}%
              </div>
            </div>

            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-300">
            <span>Tổng yêu cầu: <strong className="text-white font-mono">{queue.total}</strong></span>
            <span>Đã hoàn tất: <strong className="text-emerald-400 font-mono">{queue.completed}</strong></span>
          </div>
        </div>

        {/* Detailed Breakdown Grid */}
        <div className="grid grid-cols-3 gap-2.5 mt-3">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
            <span className="text-[11px] text-slate-500 block">Đang chờ</span>
            <span className="text-base font-bold font-mono text-amber-600 mt-0.5 block">
              {queue.pending}
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
            <span className="text-[11px] text-slate-500 block">Đang chạy</span>
            <span className="text-base font-bold font-mono text-blue-600 mt-0.5 block">
              {queue.processing}
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
            <span className="text-[11px] text-slate-500 block">Thất bại / Lỗi</span>
            <span className="text-base font-bold font-mono text-rose-600 mt-0.5 block">
              {queue.failed}
            </span>
          </div>
        </div>
      </div>

      {/* Integration Channels Indicator */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            <span>Email SMTP</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zalo Bot</span>
          </div>
        </div>

        <Link href="/settings" className="text-slate-400 hover:text-slate-600 text-[11px]">
          Cấu hình →
        </Link>
      </div>
    </div>
  );
}

