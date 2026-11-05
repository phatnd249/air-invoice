import React from 'react';
import { Inbox, Clock, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { QueueStats } from './types';

interface QueueStatsCardsProps {
  stats: QueueStats;
}

export function QueueStatsCards({ stats }: QueueStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {/* 1. Tổng Request */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 text-sm font-medium mb-1.5">
          <span>Tổng Request</span>
          <Inbox className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-slate-900">{stats.total}</div>
        <div className="text-xs text-slate-400 mt-1">Đã tiếp nhận qua Queue</div>
      </div>

      {/* 2. Đang Chờ Đến Lượt */}
      <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-xs">
        <div className="flex items-center justify-between text-amber-700 text-sm font-semibold mb-1.5">
          <span>Đang Chờ Đến Lượt</span>
          <Clock className="w-4 h-4 text-amber-600" />
        </div>
        <div className="text-2xl font-bold font-mono text-amber-900">{stats.pending}</div>
        <div className="text-xs text-amber-600 mt-1">Chờ lượt hoặc chờ đến giờ gửi lại</div>
      </div>

      {/* 3. Đang Gửi Tuần Tự */}
      <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-200 shadow-xs">
        <div className="flex items-center justify-between text-blue-700 text-sm font-semibold mb-1.5">
          <span>Đang Gửi Tuần Tự</span>
          <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
        </div>
        <div className="text-2xl font-bold font-mono text-blue-900">{stats.processing}</div>
        <div className="text-xs text-blue-600 mt-1">Đang thực thi lần lượt (1 by 1)</div>
      </div>

      {/* 4. Đã Dừng (Thất Bại) */}
      <div className="bg-rose-50/70 p-5 rounded-2xl border border-rose-200 shadow-xs">
        <div className="flex items-center justify-between text-rose-700 text-sm font-semibold mb-1.5">
          <span>Đã Dừng (Thất Bại)</span>
          <AlertTriangle className="w-4 h-4 text-rose-600" />
        </div>
        <div className="text-2xl font-bold font-mono text-rose-900">{stats.failed}</div>
        <div className="text-xs text-rose-600 mt-1">Vẫn để đó để kiểm tra & thử lại</div>
      </div>

      {/* 5. Đã Hoàn Thành */}
      <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 shadow-xs col-span-2 md:col-span-1">
        <div className="flex items-center justify-between text-emerald-700 text-sm font-semibold mb-1.5">
          <span>Đã Hoàn Thành</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-2xl font-bold font-mono text-emerald-900">{stats.completed}</div>
        <div className="text-xs text-emerald-600 mt-1">Gửi tin nhắn thành công</div>
      </div>
    </div>
  );
}

