'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicView = pathname?.startsWith('/view');

  if (isPublicView) {
    return <main className="min-h-screen w-full bg-slate-100">{children}</main>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-h-screen bg-slate-50/50">
        {children}
      </main>
    </div>
  );
}
