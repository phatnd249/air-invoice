import React from 'react';
import Link from 'next/link';
import { Sparkles, ExternalLink } from 'lucide-react';
import PaymentRulesConfig from '@/components/PaymentRulesConfig';

export function FormatsTab() {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-900">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            Cấu hình này hiện đã có tab riêng tại mục <strong>Mẫu Tin Nhắn &amp; HĐ</strong>. Bạn có thể chỉnh sửa trực tiếp bên dưới hoặc chuyển qua trang Mẫu Tin Nhắn.
          </span>
        </div>
        <Link
          href="/templates?tab=vietqr"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shrink-0 transition-colors cursor-pointer"
        >
          <span>Xem Tại Mẫu Tin Nhắn</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
      <PaymentRulesConfig />
    </div>
  );
}

