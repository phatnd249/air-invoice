'use client';

import React from 'react';
import { CalendarClock, AlertCircle, Timer, ArrowUpRight, Send, User } from 'lucide-react';
import Link from 'next/link';
import { formatVnd } from './DashboardKpiCards';

interface UrgentSubItem {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerCompany?: string;
  serviceName: string;
  servicePrice: number;
  endDate: string;
  daysRemaining: number;
  status: string;
}

interface UrgentSubscriptionsWidgetProps {
  subscriptions: UrgentSubItem[];
}

export function UrgentSubscriptionsWidget({ subscriptions }: UrgentSubscriptionsWidgetProps) {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Khách Hàng Cần Gia Hạn Gấp</h3>
              <p className="text-xs text-slate-500">Các gói dịch vụ sắp hết hạn hoặc đã quá hạn</p>
            </div>
          </div>

          <Link
            href="/subscriptions?status=EXPIRING_SOON"
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center"
          >
            Tất cả <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        </div>

        {subscriptions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            🎉 Không có gói dịch vụ nào cần gia hạn gấp! Toàn bộ khách hàng đang an toàn.
          </div>
        ) : (
          <div className="space-y-3">
            {subscriptions.map((sub) => {
              const isOverdue = sub.daysRemaining < 0;
              const overdueDays = Math.abs(sub.daysRemaining);

              return (
                <div
                  key={sub.id}
                  className="p-3 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs truncate">
                        {sub.customerName}
                      </span>
                      {sub.customerCompany && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          ({sub.customerCompany})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-semibold text-blue-600 truncate">{sub.serviceName}</span>
                      <span>•</span>
                      <span className="font-mono">{formatVnd(sub.servicePrice)}</span>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-0.5">
                      HSD: {new Date(sub.endDate).toLocaleDateString('vi-VN')}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {/* Countdown Badge */}
                    {isOverdue ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        <span>Quá hạn {overdueDays} ngày</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        <Timer className="w-3 h-3 text-amber-500" />
                        <span>Còn {sub.daysRemaining} ngày</span>
                      </span>
                    )}

                    {/* Quick action button linking to subscriptions */}
                    <Link
                      href="/subscriptions"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                    >
                      <Send className="w-3 h-3" />
                      <span>Nhắc hạn</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <Link
          href="/subscriptions"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
        >
          + Thêm theo dõi dịch vụ
        </Link>
        <Link href="/subscriptions" className="text-slate-400 hover:text-slate-600 text-[11px]">
          Xem toàn bộ danh sách khách hàng →
        </Link>
      </div>
    </div>
  );
}
