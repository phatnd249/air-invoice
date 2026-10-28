'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatVietnamDateTime } from '@/lib/date';
import {
  Clock,
  RefreshCw,
  Play,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Layers,
  Send,
  MessageSquare,
  Key,
  Globe,
  RotateCcw,
  Eye,
  X,
  Copy,
  Check,
  ChevronRight,
  ShieldAlert,
  Inbox,
  Flame,
} from 'lucide-react';

interface ApiSummaryItem {
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

interface QueueJobItem {
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

const TYPE_CONFIG: Record<
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

export default function QueuePage() {
  const queryClient = useQueryClient();
  const [selectedApi, setSelectedApi] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailJob, setDetailJob] = useState<QueueJobItem | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 1. Thống kê tổng quan hàng chờ
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['queue-stats'],
    queryFn: async () => {
      const res = await api.get('/queue/stats');
      return res.data;
    },
    refetchInterval: autoRefresh ? 6000 : false,
  });

  // 2. Danh sách các API hiện có hiển thị số request
  const { data: apisData, refetch: refetchApis } = useQuery<ApiSummaryItem[]>({
    queryKey: ['queue-apis'],
    queryFn: async () => {
      const res = await api.get('/queue/apis');
      return res.data;
    },
    refetchInterval: autoRefresh ? 6000 : false,
  });

  // 3. Danh sách request chi tiết
  const {
    data: jobsData,
    isLoading: isLoadingJobs,
    refetch: refetchJobs,
  } = useQuery({
    queryKey: ['queue-jobs', selectedStatus, selectedType, selectedApi, searchTerm, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
      if (selectedType !== 'ALL') params.set('type', selectedType);
      if (selectedApi !== 'ALL') params.set('apiName', selectedApi);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      params.set('page', page.toString());
      params.set('limit', '40');

      const res = await api.get(`/queue/jobs?${params.toString()}`);
      return res.data as { items: QueueJobItem[]; total: number; page: number; totalPages: number };
    },
    refetchInterval: autoRefresh ? 6000 : false,
  });

  const jobs = useMemo(() => jobsData?.items || [], [jobsData]);
  const apis = useMemo(() => apisData || [], [apisData]);
  const stats = statsData || { total: 0, pending: 0, processing: 0, completed: 0, failed: 0 };

  // Mutations
  const processMutation = useMutation({
    mutationFn: async () => api.post('/queue/process'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['queue-apis'] });
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/queue/jobs/${id}/retry`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['queue-apis'] });
    },
    onError: (err: any) => {
      alert('Lỗi thử lại: ' + (err.response?.data?.message || err.message));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/queue/jobs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['queue-apis'] });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => api.post('/queue/jobs/bulk-delete', { ids }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['queue-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['queue-apis'] });
      setSelectedIds([]);
      alert(`Đã xóa ${res?.data?.count || selectedIds.length} request khỏi hàng chờ!`);
    },
  });

  const clearCompletedMutation = useMutation({
    mutationFn: async () => api.post('/queue/clear-completed'),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['queue-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['queue-apis'] });
      alert(`Đã dọn dẹp ${res?.data?.count || 0} request đã hoàn thành!`);
    },
  });

  const handleRefreshAll = () => {
    refetchStats();
    refetchApis();
    refetchJobs();
  };

  // Multi-select helpers
  const isAllSelected = jobs.length > 0 && jobs.every((j) => selectedIds.includes(j.id));
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(jobs.map((j) => j.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} request khỏi hàng chờ?`)) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getStatusBadge = (status: string, retryCount: number, maxRetries: number) => {
    switch (status) {
      case 'PENDING':
        return retryCount > 0 ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <RotateCcw className="w-3 h-3 animate-spin text-amber-600" />
            Đợi thử lại ({retryCount}/{maxRetries})
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500" />
            Đang chờ
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
            Đang gửi tuần tự
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Thành công
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Đã dừng thử lại ({retryCount}/{maxRetries})
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Hàng Chờ Xử Lý Request (Queue Worker)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Ghi nhận tất cả request từ các API, chạy tuần tự từng tin nhắn. Tự động thử lại sau vài phút nếu lỗi (tối đa 5 lần rồi dừng, vẫn lưu lại).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Nút Auto Refresh */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              autoRefresh
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title={autoRefresh ? 'Tự động làm mới mỗi 6 giây' : 'Bật tự động làm mới'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span>{autoRefresh ? 'Auto 6s: BẬT' : 'Auto: TẮT'}</span>
          </button>

          {/* Nút Refresh ngay */}
          <button
            type="button"
            onClick={handleRefreshAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </button>

          {/* Nút Kích hoạt chạy ngay */}
          <button
            type="button"
            onClick={() => processMutation.mutate()}
            disabled={processMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{processMutation.isPending ? 'Đang kích hoạt...' : 'Xử lý ngay'}</span>
          </button>

          {/* Nút Dọn dẹp hoàn thành */}
          {stats.completed > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Bạn có muốn xóa tất cả các request đã hoàn thành thành công để dọn gọn hàng chờ?')) {
                  clearCompletedMutation.mutate();
                }
              }}
              disabled={clearCompletedMutation.isPending}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Dọn đã xong ({stats.completed})</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Tổng Request</span>
            <Inbox className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-1">Đã tiếp nhận qua Queue</div>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold mb-1">
            <span>Đang Chờ Đến Lượt</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-900">{stats.pending}</div>
          <div className="text-[11px] text-amber-600 mt-1">Chờ lượt hoặc chờ đến giờ gửi lại</div>
        </div>

        <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 shadow-xs">
          <div className="flex items-center justify-between text-blue-700 text-xs font-semibold mb-1">
            <span>Đang Gửi Tuần Tự</span>
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-900">{stats.processing}</div>
          <div className="text-[11px] text-blue-600 mt-1">Đang thực thi lần lượt (1 by 1)</div>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 text-xs font-semibold mb-1">
            <span>Đã Dừng (Thất Bại)</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-900">{stats.failed}</div>
          <div className="text-[11px] text-rose-600 mt-1">Vẫn để đó để kiểm tra & thử lại</div>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold mb-1">
            <span>Đã Hoàn Thành</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-900">{stats.completed}</div>
          <div className="text-[11px] text-emerald-600 mt-1">Gửi tin nhắn thành công</div>
        </div>
      </div>

      {/* 3. DANH SÁCH API HIỆN CÓ & SỐ REQUEST ĐANG CÓ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-600" />
              <span>Danh Sách API Hiện Có &amp; Số Request Của Từng API</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ghi nhận từng nguồn gọi API / API Key và hiển thị số lượng request đang có trong hệ thống. Nhấp để lọc nhanh request.
            </p>
          </div>

          {selectedApi !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedApi('ALL')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 rounded-lg cursor-pointer transition-colors"
            >
              <span>Xem tất cả API</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {apis.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-slate-400 italic">
              Chưa có dữ liệu API nào được ghi nhận.
            </div>
          ) : (
            apis.map((apiItem) => {
              const isSelected = selectedApi === apiItem.apiName;
              return (
                <div
                  key={apiItem.apiName}
                  onClick={() => setSelectedApi(isSelected ? 'ALL' : apiItem.apiName)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left relative group ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-bold text-sm text-slate-900 truncate">
                      {apiItem.apiName}
                    </div>
                    {apiItem.isApiKey ? (
                      <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-100 text-violet-700 border border-violet-200">
                        API Key
                      </span>
                    ) : (
                      <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">
                        System
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono truncate mb-3">
                    {apiItem.endpoint || '/api/invoices/quick-create'}
                  </div>

                  {/* Badges số request */}
                  <div className="grid grid-cols-4 gap-1.5 text-center text-[11px] pt-2 border-t border-slate-200/60">
                    <div className="bg-white/80 rounded py-1 border border-slate-200/60">
                      <div className="text-[10px] text-slate-400 font-medium">Tổng</div>
                      <div className="font-bold font-mono text-slate-800">{apiItem.total}</div>
                    </div>
                    <div className="bg-amber-50 rounded py-1 border border-amber-200/60">
                      <div className="text-[10px] text-amber-600 font-medium">Chờ</div>
                      <div className="font-bold font-mono text-amber-700">{apiItem.pending}</div>
                    </div>
                    <div className="bg-emerald-50 rounded py-1 border border-emerald-200/60">
                      <div className="text-[10px] text-emerald-600 font-medium">Xong</div>
                      <div className="font-bold font-mono text-emerald-700">{apiItem.completed}</div>
                    </div>
                    <div className="bg-rose-50 rounded py-1 border border-rose-200/60">
                      <div className="text-[10px] text-rose-600 font-medium">Lỗi</div>
                      <div className="font-bold font-mono text-rose-700">{apiItem.failed}</div>
                    </div>
                  </div>

                  {apiItem.lastRequestAt && (
                    <div className="text-[10.5px] text-slate-400 mt-2 truncate">
                      Gần nhất: {formatVietnamDateTime(apiItem.lastRequestAt)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. Bộ lọc & Danh sách Request chi tiết trong Hàng Chờ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Thanh lọc & tìm kiếm */}
        <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Tìm mã Job, tên API, số HĐ, tên người nhận, lỗi..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Lọc theo API */}
            <select
              value={selectedApi}
              onChange={(e) => {
                setSelectedApi(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="ALL">Tất cả API ({apis.length})</option>
              {apis.map((a) => (
                <option key={a.apiName} value={a.apiName}>
                  {a.apiName} ({a.total} req)
                </option>
              ))}
            </select>

            {/* Lọc theo Trạng Thái */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Đang chờ (Pending)</option>
              <option value="PROCESSING">Đang gửi (Processing)</option>
              <option value="COMPLETED">Thành công (Completed)</option>
              <option value="FAILED">Đã dừng / Thất bại (Failed)</option>
            </select>

            {/* Lọc theo Loại Tác Vụ */}
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="ALL">Tất cả loại tác vụ</option>
              <option value="DELIVERY_EMAIL">Gửi Email Hóa Đơn</option>
              <option value="DELIVERY_ZALO">Gửi Tin Nhắn Zalo</option>
              <option value="PAYMENT_CONFIRMATION">Xác Nhận Thanh Toán</option>
              <option value="QUICK_CREATE_INVOICE">Tạo Nhanh Hóa Đơn</option>
              <option value="WEBHOOK_EVENT">Webhook</option>
              <option value="CUSTOM">Khác</option>
            </select>
          </div>
        </div>

        {/* Bảng Request Trong Hàng Chờ */}
        {isLoadingJobs ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Đang tải danh sách hàng chờ...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Hàng chờ đang trống</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || selectedStatus !== 'ALL' || selectedApi !== 'ALL' || selectedType !== 'ALL'
                ? 'Không tìm thấy request nào phù hợp với bộ lọc hiện tại.'
                : 'Hiện không có request nào đang chờ xử lý. Các request gửi đến API sẽ được ghi nhận tại đây.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 pl-4 pr-1 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                      title={isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                      aria-label="Chọn tất cả request"
                    />
                  </th>
                  <th className="py-3.5 px-4">Thời Gian &amp; ID</th>
                  <th className="py-3.5 px-4">API / Nguồn Tiếp Nhận</th>
                  <th className="py-3.5 px-4">Tác Vụ &amp; Đối Tượng</th>
                  <th className="py-3.5 px-4 text-center">Tiến Độ Thử Lại</th>
                  <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                  <th className="py-3.5 px-5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {jobs.map((job) => {
                  const isSelected = selectedIds.includes(job.id);
                  const typeCfg = TYPE_CONFIG[job.type] || TYPE_CONFIG.CUSTOM;
                  const TypeIcon = typeCfg.icon;

                  return (
                    <tr
                      key={job.id}
                      className={`transition-colors group ${
                        isSelected ? 'bg-blue-50/70 hover:bg-blue-50' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Checkbox chọn hàng */}
                      <td className="py-4 pl-4 pr-1 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(job.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                          aria-label={`Chọn request ${job.id}`}
                        />
                      </td>

                      {/* Thời gian & ID */}
                      <td className="py-4 px-4">
                        <div className="font-mono text-slate-900 font-semibold text-[11.5px]">
                          {formatVietnamDateTime(job.createdAt)}
                        </div>
                        <div className="font-mono text-[10.5px] text-slate-400 mt-0.5">
                          ID: {job.id.slice(0, 8)}...
                        </div>
                      </td>

                      {/* API / Nguồn tiếp nhận ("Ghi rõ request của API nào") */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200 text-xs inline-flex items-center gap-1">
                            <Key className="w-3 h-3 text-blue-600" />
                            {job.apiName || 'Hệ thống'}
                          </span>
                        </div>
                        <div className="font-mono text-[10.5px] text-slate-500 mt-1 truncate max-w-[200px]" title={job.endpoint || ''}>
                          {job.endpoint || job.source || 'Direct API'}
                        </div>
                      </td>

                      {/* Tác vụ & Đối tượng */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <TypeIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="line-clamp-1">{job.title || typeCfg.label}</span>
                        </div>
                        {job.targetInfo && (
                          <div className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                            {job.targetInfo}
                          </div>
                        )}
                        {job.errorMessage && (
                          <div
                            className="text-[10.5px] text-rose-600 line-clamp-1 mt-1 font-mono bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100"
                            title={job.errorMessage}
                          >
                            ⚠️ {job.errorMessage}
                          </div>
                        )}
                      </td>

                      {/* Tiến độ thử lại */}
                      <td className="py-4 px-4 text-center">
                        <div className="font-mono font-semibold text-xs text-slate-800">
                          {job.retryCount} / {job.maxRetries}
                        </div>
                        {job.retryCount > 0 && job.status === 'PENDING' && (
                          <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                            Gửi lại: {formatVietnamDateTime(job.nextRunAt).slice(0, 5)}
                          </div>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-4 px-4 text-center">
                        {getStatusBadge(job.status, job.retryCount, job.maxRetries)}
                      </td>

                      {/* Thao tác */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút Xem chi tiết */}
                          <button
                            type="button"
                            onClick={() => setDetailJob(job)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Xem chi tiết Request"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Nút Thử lại ngay (nếu FAILED hoặc PENDING có lỗi) */}
                          {(job.status === 'FAILED' || job.status === 'PENDING') && (
                            <button
                              type="button"
                              onClick={() => retryMutation.mutate(job.id)}
                              disabled={retryMutation.isPending}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Thử lại ngay lập tức"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}

                          {/* Nút Xóa */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Bạn có chắc muốn xóa request này khỏi hàng chờ?')) {
                                deleteMutation.mutate(job.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa request"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer phân trang */}
        {jobsData && jobsData.total > 0 && (
          <div className="px-5 py-3 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Hiển thị <strong>{jobs.length}</strong> / <strong>{jobsData.total}</strong> request
            </span>

            {jobsData.totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  Trang trước
                </button>
                <span className="px-2 font-mono font-medium">
                  {page} / {jobsData.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= jobsData.totalPages}
                  onClick={() => setPage((p) => Math.min(jobsData.totalPages, p + 1))}
                  className="px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  Trang sau
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Batch Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200 border border-slate-800">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-mono font-bold text-white">
              {selectedIds.length}
            </span>
            <span>Đã chọn {selectedIds.length} request</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={bulkDeleteMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{bulkDeleteMutation.isPending ? 'Đang xóa...' : 'Xóa tất cả đã chọn'}</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer px-2 py-1"
          >
            Bỏ chọn
          </button>
        </div>
      )}

      {/* 5. Modal Chi Tiết Request */}
      {detailJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/75">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Chi Tiết Request #{detailJob.id.slice(0, 8)}
                  </h3>
                  <div className="text-xs text-slate-500 font-mono">
                    API: <strong className="text-blue-600">{detailJob.apiName || 'Hệ thống'}</strong> • {detailJob.endpoint || ''}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailJob(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                <div>
                  <span className="text-slate-400 block text-[11px]">Trạng Thái:</span>
                  <div className="mt-1">
                    {getStatusBadge(detailJob.status, detailJob.retryCount, detailJob.maxRetries)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Loại Tác Vụ:</span>
                  <div className="font-semibold text-slate-800 mt-1">
                    {TYPE_CONFIG[detailJob.type]?.label || detailJob.type}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Số Lần Thử Lại:</span>
                  <div className="font-mono text-slate-800 mt-0.5">
                    {detailJob.retryCount} / {detailJob.maxRetries} lần (Tối đa 5 lần)
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Thời Gian Tạo:</span>
                  <div className="font-mono text-slate-800 mt-0.5">
                    {formatVietnamDateTime(detailJob.createdAt)}
                  </div>
                </div>
                {detailJob.targetInfo && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[11px]">Đối Tượng / Người Nhận:</span>
                    <div className="font-medium text-slate-900 mt-0.5">{detailJob.targetInfo}</div>
                  </div>
                )}
              </div>

              {/* Lỗi nếu có */}
              {detailJob.errorMessage && (
                <div>
                  <div className="text-slate-600 font-semibold mb-1 flex items-center gap-1.5 text-rose-600">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Chi Tiết Lỗi Ghi Nhận:</span>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 font-mono text-[11.5px] whitespace-pre-wrap">
                    {detailJob.errorMessage}
                  </div>
                </div>
              )}

              {/* Payload JSON */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-700 font-semibold">Dữ Liệu Gửi Lên (Payload):</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(JSON.stringify(detailJob.payload, null, 2), 'payload')}
                    className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'payload' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'payload' ? 'Đã sao chép' : 'Sao chép JSON'}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                  {JSON.stringify(detailJob.payload, null, 2)}
                </pre>
              </div>

              {/* Result JSON (nếu có) */}
              {detailJob.result && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-700 font-semibold">Kết Quả Phản Hồi (Result):</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(JSON.stringify(detailJob.result, null, 2), 'result')}
                      className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'result' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'result' ? 'Đã sao chép' : 'Sao chép JSON'}</span>
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto max-h-40 border border-slate-800">
                    {JSON.stringify(detailJob.result, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">
                Cập nhật lần cuối: {formatVietnamDateTime(detailJob.updatedAt)}
              </span>

              <div className="flex items-center gap-2">
                {(detailJob.status === 'FAILED' || detailJob.status === 'PENDING') && (
                  <button
                    type="button"
                    onClick={() => {
                      retryMutation.mutate(detailJob.id);
                      setDetailJob(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs cursor-pointer transition-colors shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Thử lại ngay</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDetailJob(null)}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
