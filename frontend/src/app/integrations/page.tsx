'use client';

import React from 'react';
import { Code2 } from 'lucide-react';
import { ApiIntegrationPanel } from '@/components/ApiIntegrationPanel';

export default function IntegrationsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              API &amp; Tích Hợp
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-1">
              Quản lý API Key, endpoint công khai và tài liệu tích hợp cho Landing Page, CRM, n8n.
            </p>
          </div>
        </div>
      </div>

      <ApiIntegrationPanel />
    </div>
  );
}
