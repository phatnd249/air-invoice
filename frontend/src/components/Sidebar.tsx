'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  LayoutTemplate,
  Settings,
  Layers,
  History,
  LogOut,
  User,
  Users,
  CalendarClock,
  Sparkles,
  Receipt,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    groupName: 'Nghiệp Vụ Chính',
    items: [
      { name: 'Quản lý Hóa đơn', href: '/invoices', icon: Receipt },
      { name: 'Khách hàng & Dịch vụ', href: '/subscriptions', icon: CalendarClock },
      { name: 'Lịch sử Giao dịch', href: '/history', icon: History },
    ],
  },
  {
    groupName: 'Cấu Hình & Danh Mục',
    items: [
      { name: 'Danh mục Dịch vụ', href: '/services', icon: Layers },
      { name: 'Cấu Hình Định Dạng', href: '/templates', icon: LayoutTemplate },
    ],
  },
  {
    groupName: 'Hệ Thống & Quản Trị',
    items: [
      { name: 'Quản trị Người dùng', href: '/users', icon: Users, adminOnly: true },
      { name: 'Cài đặt Hệ thống', href: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 min-h-screen flex flex-col border-r border-slate-800 shrink-0 select-none">
      {/* Workspace / Brand Header */}
      <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
        <Link href="/invoices" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-500 transition-colors">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-white tracking-tight leading-none flex items-center space-x-1">
              <span>Invoice-AIR</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Hóa đơn & Dịch vụ</span>
          </div>
        </Link>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {navGroups.map((group, gIdx) => {
          const visibleItems = group.items.filter((item) => !item.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                {group.groupName}
              </div>

              {visibleItems.map((item) => {
                const isActive =
                  item.href === '/invoices'
                    ? pathname === '/invoices' || (pathname.startsWith('/invoices/') && pathname !== '/invoices/new')
                    : pathname.startsWith(item.href);

                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-white' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>

                    {item.adminOnly && (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                        Admin
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User Info & Quick Logout Footer */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/50 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-300 font-bold text-xs shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user?.name || 'Quản Trị Viên'}
              </p>
              <p className="text-[11px] text-slate-300 truncate">
                {user?.email || 'admin@airobotics.edu.vn'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => logout()}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
