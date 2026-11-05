import React from 'react';
import { Send, MessageSquare, CheckCircle2, Layers, Globe, Clock } from 'lucide-react';

export interface ApiSummaryItem {
  apiName: string;
  endpoint?: string;
  isApiKey: boolean;
  isActive?: boolean;
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  lastRequestAt?: string | null;
}

export interface QueueJobItem {
  id: string;
  type: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  priority: number;
  apiName?: string | null;
  endpoint?: string | null;
  source?: string | null;
  title?: string | null;
  targetInfo?: string | null;
  payload: any;
  result?: any;
  errorMessage?: string | null;
  retryCount: number;
  maxRetries: number;
  nextRunAt: string;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QueueStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export const TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  DELIVERY_EMAIL: { label: 'Gửi Email Hóa Đơn', icon: Send, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  DELIVERY_ZALO: { label: 'Gửi Tin Nhắn Zalo', icon: MessageSquare, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  PAYMENT_CONFIRMATION: { label: 'Xác Nhận Thanh Toán', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  QUICK_CREATE_INVOICE: { label: 'Tạo Nhanh Hóa Đơn', icon: Layers, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  WEBHOOK_EVENT: { label: 'Sự Kiện Webhook', icon: Globe, color: 'text-violet-600 bg-violet-50 border-violet-200' },
  CUSTOM: { label: 'Tác Vụ Tùy Chỉnh', icon: Clock, color: 'text-slate-600 bg-slate-50 border-slate-200' },
};

