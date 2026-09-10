'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAuth } from '@/context/AuthContext';
import { FileText, ShieldAlert, ArrowLeft } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();

  const isPublicRoute =
    pathname?.startsWith('/view') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/forgot-password');

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      window.location.replace('/login');
    }
  }, [isLoading, isAuthenticated, isPublicRoute]);

  // Nếu là trang public (như /login, /forgot-password, hoặc /view/[token])
  if (isPublicRoute) {
    return <main className="min-h-screen w-full bg-slate-950">{children}</main>;
  }

  // Màn hình loading khi đang xác thực phiên đăng nhập
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20 mb-4 animate-pulse">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <p className="text-slate-300 text-sm font-medium animate-pulse mb-3">
          Đang xác thực phiên đăng nhập...
        </p>
        <a
          href="/login"
          className="text-xs text-blue-400 hover:text-blue-300 underline transition-colors"
        >
          Chuyển thẳng đến trang Đăng nhập
        </a>
      </div>
    );
  }

  // Nếu chưa đăng nhập, hiển thị thông báo chuyển hướng ngắn thay vì màn hình trắng
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-4">
        <p className="text-slate-300 text-sm font-medium mb-3">
          Đang chuyển hướng đến trang đăng nhập...
        </p>
        <a
          href="/login"
          className="text-xs text-blue-400 hover:text-blue-300 underline"
        >
          Bấm vào đây nếu trình duyệt không tự chuyển
        </a>
      </div>
    );
  }

  // Kiểm tra quyền truy cập route quản trị (Admin Only)
  const isAdminOnlyRoute = pathname?.startsWith('/users');
  if (isAdminOnlyRoute && !isAdmin) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 overflow-y-auto bg-slate-50/50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto mb-4">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Truy Cập Bị Từ Chối</h2>
              <p className="text-sm text-slate-500 mb-6">
                Tài khoản của bạn có vai trò <strong>{user?.role || 'USER'}</strong>. Trang này yêu cầu quyền <strong>Quản Trị Viên (ADMIN)</strong> để truy cập.
              </p>
              <Link
                href="/invoices"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay Lại Trang Hóa Đơn</span>
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Giao diện chính sau khi đăng nhập với TopBar
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-slate-50/70">
          {children}
        </main>
      </div>
    </div>
  );
}
