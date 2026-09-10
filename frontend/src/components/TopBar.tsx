'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Plus,
  Bell,
  ChevronRight,
  ShieldCheck,
  Building,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const ROUTE_LABELS: Record<string, { title: string; parent?: string }> = {
  '/invoices': { title: 'Quản lý Hóa đơn', parent: 'Nghiệp vụ' },
  '/invoices/new': { title: 'Lập Hóa đơn Mới', parent: 'Quản lý Hóa đơn' },
  '/subscriptions': { title: 'Khách hàng & Dịch vụ Gia hạn', parent: 'Nghiệp vụ' },
  '/history': { title: 'Nhật ký Lịch sử Giao dịch', parent: 'Nghiệp vụ' },
  '/services': { title: 'Danh mục Dịch vụ', parent: 'Cấu hình' },
  '/templates': { title: 'Mẫu Giao diện Hóa đơn A4', parent: 'Cấu hình' },
  '/users': { title: 'Quản trị Người dùng', parent: 'Hệ thống' },
  '/settings': { title: 'Cài đặt Hệ thống', parent: 'Hệ thống' },
};

export function TopBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

  const getBreadcrumb = () => {
    if (!pathname) return { title: 'Dashboard', parent: 'Tổng quan' };
    if (pathname.startsWith('/invoices/') && pathname !== '/invoices/new') {
      return { title: 'Chi tiết Hóa đơn', parent: 'Quản lý Hóa đơn' };
    }
    return ROUTE_LABELS[pathname] || { title: 'Tổng quan', parent: 'Hệ thống' };
  };

  const currentRoute = getBreadcrumb();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-6 lg:px-8 select-none transition-all">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center space-x-2 text-xs">
        {currentRoute.parent && (
          <>
            <span className="text-slate-600 font-medium">{currentRoute.parent}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </>
        )}
        <span className="font-semibold text-slate-900">{currentRoute.title}</span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-4">
        {/* Active Company Pill */}
        {settings?.companyName && (
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs font-medium text-slate-600">
            <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate max-w-[200px]" title={settings.companyName}>
              {settings.companyName}
            </span>
          </div>
        )}

        {/* Global Quick Action Button */}
        {pathname !== '/invoices/new' && (
          <Link
            href="/invoices/new"
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Lập HĐ Mới</span>
          </Link>
        )}

        {/* User Mini Avatar & Status */}
        <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200/70">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="hidden xl:block text-left text-xs">
            <div className="font-semibold text-slate-800 leading-none truncate max-w-[120px]">
              {user?.name || 'Admin'}
            </div>
            <span className="text-[10px] text-slate-600 font-medium">
              {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
