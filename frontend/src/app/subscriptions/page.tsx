'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  CalendarClock,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  Save,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Mail,
  Send,
  User as UserIcon,
  Building2,
  Phone,
  Timer,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Eye,
  MessageSquare,
  Sparkles,
  Edit3,
  Layers,
  Receipt,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────

interface SubscriptionItem {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCompany?: string;
  serviceId?: string;
  serviceName: string;
  servicePrice: number;
  cycle?: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'CANCELLED';
  staffName?: string;
  staffEmail?: string;
  notes?: string;
  lastAlertSentAt?: string;
  alertCount: number;
  daysRemaining: number;
  progressPercent: number;
  createdAt: string;
}

interface ServiceCatalogItem {
  id: string;
  name: string;
  description?: string;
  unit: string;
  unitPrice: number;
}

interface FormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  cycle: string;
  startDate: string;
  endDate: string;
  staffName: string;
  staffEmail: string;
  notes: string;
}

const emptyForm: FormData = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  customerCompany: '',
  serviceId: '',
  serviceName: '',
  servicePrice: 0,
  cycle: '1 năm',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  staffName: '',
  staffEmail: '',
  notes: '',
};

function CountdownTimer({ endDate }: { endDate: string }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) {
    const overdueDays = Math.abs(Math.ceil(diff / (1000 * 60 * 60 * 24)));
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        <span>Quá hạn {overdueDays} ngày</span>
      </span>
    );
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
        <Timer className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        <span>Còn {days} ngày</span>
      </span>
    );
  }

  if (days <= 30) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
        <Timer className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>Còn {days} ngày</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
      <Timer className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
      <span>Còn {days} ngày</span>
    </span>
  );
}

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SubscriptionItem | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  // Email Alert Modal
  const [alertModalItem, setAlertModalItem] = useState<SubscriptionItem | null>(null);
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  // Bulk selection để gửi email hàng loạt
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkSend, setIsBulkSend] = useState(false);
  const [bulkSendIds, setBulkSendIds] = useState<string[]>([]);

  // 1. Lấy danh sách subscriptions
  const { data: subscriptions = [], isLoading, refetch, isFetching } = useQuery<SubscriptionItem[]>({
    queryKey: ['subscriptions', statusFilter, searchTerm],
    queryFn: async () => {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      const res = await api.get('/subscriptions', { params });
      return res.data;
    },
  });

  // 2. Lấy danh mục dịch vụ (Catalog) để chọn nhanh
  const { data: services = [] } = useQuery<ServiceCatalogItem[]>({
    queryKey: ['services-catalog'],
    queryFn: async () => {
      const res = await api.get('/services');
      return res.data;
    },
  });

  // 3. Lấy cài đặt email mặc định
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

  // Mutation Thêm / Sửa
  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (editingItem) {
        return api.put(`/subscriptions/${editingItem.id}`, data);
      }
      return api.post('/subscriptions', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData(emptyForm);
      alert('Đã lưu thông tin dịch vụ khách hàng thành công!');
    },
    onError: (err: any) => {
      alert('Lỗi lưu dịch vụ: ' + (err.response?.data?.message || err.message));
    },
  });

  // Mutation Xóa
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/subscriptions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      alert('Đã xóa thông tin dịch vụ thành công!');
    },
    onError: (err: any) => {
      alert('Lỗi xóa dịch vụ: ' + (err.response?.data?.message || err.message));
    },
  });

  // Mutation Gửi Email
  const sendEmailMutation = useMutation({
    mutationFn: async ({ id, subject, message }: { id: string; subject?: string; message?: string }) => {
      return api.post(`/subscriptions/${id}/send-alert`, { subject, message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setAlertModalItem(null);
      setIsBulkSend(false);
      setBulkSendIds([]);
      alert('Đã gửi email nhắc hạn dịch vụ thành công!');
    },
    onError: (err: any) => {
      alert('Lỗi gửi email: ' + (err.response?.data?.message || err.message));
    },
  });

  // Mutation Gửi Email Hàng Loạt
  const bulkSendMutation = useMutation({
    mutationFn: async ({ ids, subject, message }: { ids: string[]; subject?: string; message?: string }) => {
      return api.post('/subscriptions/bulk-send-alert', { ids, subject, message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setAlertModalItem(null);
      setIsBulkSend(false);
      setBulkSendIds([]);
      setSelectedIds([]);
      alert('Đã gửi email nhắc hạn hàng loạt thành công!');
    },
    onError: (err: any) => {
      alert('Lỗi gửi email hàng loạt: ' + (err.response?.data?.message || err.message));
    },
  });

  // Tính toán KPI số liệu
  const metrics = useMemo(() => {
    let total = subscriptions.length;
    let active = 0;
    let expiringSoon = 0;
    let expired = 0;

    subscriptions.forEach((sub) => {
      if (sub.status === 'EXPIRED') expired++;
      else if (sub.status === 'EXPIRING_SOON') expiringSoon++;
      else if (sub.status === 'ACTIVE') active++;
    });

    return { total, active, expiringSoon, expired };
  }, [subscriptions]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub: SubscriptionItem) => {
    setEditingItem(sub);
    setFormData({
      customerName: sub.customerName || '',
      customerEmail: sub.customerEmail || '',
      customerPhone: sub.customerPhone || '',
      customerCompany: sub.customerCompany || '',
      serviceId: sub.serviceId || '',
      serviceName: sub.serviceName || '',
      servicePrice: sub.servicePrice || 0,
      cycle: sub.cycle || '1 năm',
      startDate: sub.startDate ? sub.startDate.split('T')[0] : '',
      endDate: sub.endDate ? sub.endDate.split('T')[0] : '',
      staffName: sub.staffName || '',
      staffEmail: sub.staffEmail || '',
      notes: sub.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSelectService = (svcId: string) => {
    const found = services.find((s) => s.id === svcId);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        serviceId: found.id,
        serviceName: found.name,
        servicePrice: found.unitPrice,
      }));
    }
  };

  const handleOpenAlertModal = (sub: SubscriptionItem) => {
    setAlertModalItem(sub);
    setIsBulkSend(false);
    setBulkSendIds([]);
    setCustomSubject(settings?.emailAlertSubject || '');
    setCustomMessage(settings?.emailAlertBody || '');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Đang hoạt động</span>
          </span>
        );
      case 'EXPIRING_SOON':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Sắp hết hạn</span>
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Đã quá hạn</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap bg-slate-100 text-slate-500 border border-slate-200 line-through">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>Đã hủy</span>
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  // Phân nhóm cảnh báo theo mức độ hạn dùng
  const getExpiryGroup = (sub: SubscriptionItem): string => {
    if (sub.status === 'CANCELLED') return 'CANCELLED';
    if (sub.status === 'EXPIRED') return 'EXPIRED';
    if (sub.daysRemaining <= 7) return 'EXPIRING_7D';
    if (sub.daysRemaining <= 30) return 'EXPIRING_30D';
    return 'SAFE';
  };

  const expiryGroups: Array<{
    key: string;
    label: string;
    description: string;
    dot: string;
    badge: string;
  }> = [
    {
      key: 'EXPIRED',
      label: 'Đã quá hạn (Cần gia hạn ngay)',
      description: 'Các gói dịch vụ đã hết hạn, nguy cơ gián đoạn',
      dot: 'bg-rose-500',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      key: 'EXPIRING_7D',
      label: 'Sắp hết hạn trong 7 ngày',
      description: 'Cần liên hệ khách hàng gia hạn gấp',
      dot: 'bg-amber-500',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      key: 'EXPIRING_30D',
      label: 'Sắp hết hạn trong 30 ngày',
      description: 'Chuẩn bị gửi thông báo nhắc gia hạn',
      dot: 'bg-amber-400',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      key: 'SAFE',
      label: 'Còn hạn an toàn',
      description: 'Thời hạn sử dụng còn dài',
      dot: 'bg-emerald-500',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      key: 'CANCELLED',
      label: 'Đã hủy',
      description: 'Các gói dịch vụ đã bị hủy',
      dot: 'bg-slate-400',
      badge: 'bg-slate-100 text-slate-500 border-slate-200',
    },
  ];

  const groupedSubscriptions = useMemo(() => {
    if (statusFilter === 'ALL') {
      return expiryGroups
        .map((g) => ({
          group: g,
          items: subscriptions.filter((s) => getExpiryGroup(s) === g.key),
        }))
        .filter((g) => g.items.length > 0);
    }

    const labelByStatus: Record<string, { label: string; description: string; dot: string; badge: string }> = {
      ACTIVE: {
        label: 'Đang hoạt động (Còn hạn an toàn)',
        description: 'Thời hạn sử dụng còn dài',
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      },
      EXPIRING_SOON: {
        label: 'Sắp hết hạn (≤ 30 ngày)',
        description: 'Cần chuẩn bị gửi thông báo gia hạn',
        dot: 'bg-amber-500',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
      },
      EXPIRED: {
        label: 'Đã quá hạn (Cần gia hạn ngay)',
        description: 'Nguy cơ gián đoạn dịch vụ',
        dot: 'bg-rose-500',
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
      },
      CANCELLED: {
        label: 'Đã hủy',
        description: 'Các gói dịch vụ đã bị hủy',
        dot: 'bg-slate-400',
        badge: 'bg-slate-100 text-slate-500 border-slate-200',
      },
    };
    const cfg = labelByStatus[statusFilter] || {
      label: statusFilter,
      description: '',
      dot: 'bg-slate-400',
      badge: 'bg-slate-100 text-slate-500 border-slate-200',
    };
    return [
      {
        group: { key: statusFilter, ...cfg },
        items: subscriptions.filter((s) => s.status === statusFilter),
      },
    ].filter((g) => g.items.length > 0);
  }, [subscriptions, statusFilter]);

  const selectedCount = selectedIds.length;
  const allVisibleSelected = subscriptions.length > 0 && selectedIds.length === subscriptions.length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(subscriptions.map((s) => s.id));
    }
  };

  const handleOpenBulkSend = () => {
    if (selectedIds.length === 0) return;
    setBulkSendIds(selectedIds);
    setIsBulkSend(true);
    setCustomSubject(settings?.emailAlertSubject || '');
    setCustomMessage(settings?.emailAlertBody || '');
  };

  const handleSendEmail = () => {
    if (isBulkSend) {
      bulkSendMutation.mutate({
        ids: bulkSendIds.length > 0 ? bulkSendIds : (alertModalItem ? [alertModalItem.id] : []),
        subject: customSubject || undefined,
        message: customMessage || undefined,
      });
    } else if (alertModalItem) {
      sendEmailMutation.mutate({
        id: alertModalItem.id,
        subject: customSubject || undefined,
        message: customMessage || undefined,
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Khách Hàng & Dịch Vụ Gia Hạn</h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi thời hạn Hosting, Tên miền, Bảo trì và cảnh báo gia hạn tự động
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 transition-all shadow-xs cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Khách Hàng Mới</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-sm font-medium text-slate-500">
            <span>Tổng Dịch Vụ Đang Quản Lý</span>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarClock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {metrics.total} <span className="text-sm font-sans text-slate-400 font-normal">gói</span>
          </div>
          <div className="text-xs text-slate-500">Bao gồm toàn bộ khách hàng</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-sm font-medium text-slate-500">
            <span>Đang Hoạt Động (An Toàn)</span>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600">
            {metrics.active} <span className="text-sm font-sans text-slate-400 font-normal">gói</span>
          </div>
          <div className="text-xs text-emerald-600 font-medium">Hạn sử dụng còn dài</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-sm font-medium text-slate-500">
            <span>Sắp Hết Hạn (&le; 30 Ngày)</span>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600">
            {metrics.expiringSoon} <span className="text-sm font-sans text-slate-400 font-normal">gói</span>
          </div>
          <div className="text-xs text-amber-600 font-medium">Cần chuẩn bị gửi thông báo</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-sm font-medium text-slate-500">
            <span>Đã Quá Hạn (Cần Gia Hạn Gấp)</span>
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600">
            {metrics.expired} <span className="text-sm font-sans text-slate-400 font-normal">gói</span>
          </div>
          <div className="text-xs text-rose-600 font-medium">Nguy cơ gián đoạn dịch vụ</div>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 -mx-1 px-1 overflow-x-auto">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'ACTIVE', label: 'Đang hoạt động' },
              { id: 'EXPIRING_SOON', label: 'Sắp hết hạn' },
              { id: 'EXPIRED', label: 'Đã quá hạn' },
            ].map((tab) => {
              const isSelected = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-80 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo tên KH, công ty, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors duration-150"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedCount > 0 && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center space-x-2.5 text-sm font-semibold text-blue-900">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <span>
              Đã chọn <strong className="font-bold">{selectedCount}</strong> khách hàng
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 text-sm font-semibold rounded-xl transition-all cursor-pointer"
            >
              Bỏ chọn
            </button>
            <button
              type="button"
              onClick={handleOpenBulkSend}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Gửi email nhắc hạn hàng loạt</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <span>Đang tải danh sách dịch vụ khách hàng...</span>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <CalendarClock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Chưa có khách hàng dịch vụ nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Bắt đầu theo dõi hạn Hosting, Tên miền và gửi email cảnh báo gia hạn tự động.
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all mt-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm khách hàng ngay</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 pl-5 pr-2 w-12 align-middle">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 accent-blue-600 rounded border-slate-300 cursor-pointer"
                      title="Chọn tất cả"
                    />
                  </th>
                  <th className="py-3 px-4 w-[20%] text-left">Khách Hàng / Đơn Vị</th>
                  <th className="py-3 px-4 w-[18%] text-left">Gói Dịch Vụ & Giá</th>
                  <th className="py-3 px-4 w-[13%] text-left">Thời Hạn (HSD)</th>
                  <th className="py-3 px-4 w-[12%] text-left">Đếm Ngược</th>
                  <th className="py-3 px-4 w-[13%] text-center">Trạng Thái</th>
                  <th className="py-3 px-4 w-[11%] text-left">Phụ Trách</th>
                  <th className="py-3 pl-4 pr-5 w-[110px] text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                {groupedSubscriptions.map(({ group, items }) => (
                  <React.Fragment key={group.key}>
                    {/* Group Section Header */}
                    <tr className="bg-slate-50/90">
                      <td colSpan={8} className="py-3 px-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2 h-2 rounded-full ${group.dot}`} />
                            <span className="text-[13px] font-bold text-slate-800">{group.label}</span>
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${group.badge}`}>
                              {items.length}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">{group.description}</div>
                        </div>
                      </td>
                    </tr>
                    {items.map((sub) => (
                      <tr key={sub.id} className={`transition-colors duration-150 ${selectedIds.includes(sub.id) ? 'bg-blue-50/40' : 'hover:bg-slate-50/80'}`}>
                        {/* Checkbox */}
                        <td className="py-4 pl-5 pr-2 w-12 align-middle">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(sub.id)}
                            onChange={() => toggleSelect(sub.id)}
                            className="w-4 h-4 accent-blue-600 rounded border-slate-300 cursor-pointer"
                          />
                        </td>
                        {/* Khách Hàng */}
                        <td className="py-4 px-4 w-[20%] align-middle">
                          <div className="font-semibold text-slate-900 text-sm leading-snug line-clamp-1">{sub.customerName}</div>
                          {sub.customerCompany && (
                            <div className="text-xs text-slate-500 line-clamp-1 mt-0.5 leading-snug">{sub.customerCompany}</div>
                          )}
                          <div className="text-xs text-slate-400 font-mono truncate mt-0.5 leading-snug">{sub.customerEmail}</div>
                        </td>

                        {/* Gói Dịch Vụ */}
                        <td className="py-4 px-4 w-[18%] align-middle">
                          <div className="font-semibold text-slate-800 text-sm leading-snug line-clamp-1">{sub.serviceName}</div>
                          <div className="text-slate-600 font-mono tabular-nums font-bold text-sm mt-1 leading-snug">
                            {formatCurrency(sub.servicePrice)} <span className="text-slate-400 font-normal">/ {sub.cycle || 'năm'}</span>
                          </div>
                        </td>

                        {/* Thời Hạn */}
                        <td className="py-4 px-4 w-[13%] align-middle font-mono text-sm text-slate-600 leading-snug">
                          <div>Từ: {new Date(sub.startDate).toLocaleDateString('vi-VN')}</div>
                          <div className="font-bold text-slate-800 mt-0.5">
                            Đến: {new Date(sub.endDate).toLocaleDateString('vi-VN')}
                          </div>
                        </td>

                        {/* Đếm Ngược */}
                        <td className="py-4 px-4 w-[12%] align-middle">
                          <CountdownTimer endDate={sub.endDate} />
                        </td>

                        {/* Trạng Thái */}
                        <td className="py-4 px-4 w-[13%] align-middle text-center">
                          {getStatusBadge(sub.status)}
                        </td>

                        {/* Phụ Trách */}
                        <td className="py-4 px-4 w-[11%] align-middle text-sm text-slate-600">
                          {sub.staffName || '---'}
                        </td>

                        {/* Thao Tác */}
                        <td className="py-4 pl-4 pr-5 w-[110px] align-middle text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenAlertModal(sub)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150 cursor-pointer"
                              title="Gửi email nhắc hạn cho khách"
                            >
                              <Mail className="w-[18px] h-[18px]" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(sub)}
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150 cursor-pointer"
                              title="Chỉnh sửa dịch vụ"
                            >
                              <Edit3 className="w-[18px] h-[18px]" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Bạn có chắc muốn xóa dịch vụ của ${sub.customerName}?`)) {
                                  deleteMutation.mutate(sub.id);
                                }
                              }}
                              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors duration-150 cursor-pointer"
                              title="Xóa dịch vụ"
                            >
                              <Trash2 className="w-[18px] h-[18px]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* POPUP THÊM / SỬA KHÁCH HÀNG DỊCH VỤ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingItem ? 'Chỉnh Sửa Dịch Vụ Khách Hàng' : 'Thêm Dịch Vụ Khách Hàng Mới'}
                  </h3>
                  <p className="text-xs text-slate-500">Quản lý chu kỳ gia hạn và người phụ trách</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200 transition-all font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              {/* Chọn nhanh từ Catalog */}
              {services.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chọn nhanh từ Danh mục Dịch vụ (Catalog)
                  </label>
                  <select
                    value={formData.serviceId}
                    onChange={(e) => handleSelectService(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium text-slate-800"
                  >
                    <option value="">-- Chọn gói dịch vụ có sẵn --</option>
                    {services.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.name} ({formatCurrency(svc.unitPrice)} / {svc.unit})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên Gói Dịch Vụ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.serviceName}
                    onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                    placeholder="VD: Hosting WordPress Doanh Nghiệp"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Giá Gói Dịch Vụ (VNĐ) *
                  </label>
                  <input
                    type="number"
                    step="1000"
                    required
                    value={formData.servicePrice}
                    onChange={(e) => setFormData({ ...formData, servicePrice: Number(e.target.value) })}
                    placeholder="660000"
                    className="w-full px-3.5 py-2 text-sm font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên Khách Hàng / Người Đại Diện *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="VD: Nguyễn Thành Đạt"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Nhận Thông Báo Cảnh Báo *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    placeholder="khachhang@gmail.com"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên Doanh Nghiệp / Đơn Vị (Nếu có)
                  </label>
                  <input
                    type="text"
                    value={formData.customerCompany}
                    onChange={(e) => setFormData({ ...formData, customerCompany: e.target.value })}
                    placeholder="Công ty TNHH Dịch vụ Số Thành Đạt"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số Điện Thoại Liên Hệ
                  </label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    placeholder="0901234567"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày Bắt Đầu *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày Hết Hạn (HSD) *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold text-rose-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chu Kỳ Gia Hạn
                  </label>
                  <select
                    value={formData.cycle}
                    onChange={(e) => setFormData({ ...formData, cycle: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="1 tháng">1 tháng</option>
                    <option value="3 tháng">3 tháng</option>
                    <option value="6 tháng">6 tháng</option>
                    <option value="1 năm">1 năm</option>
                    <option value="2 năm">2 năm</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nhân Viên Phụ Trách
                  </label>
                  <input
                    type="text"
                    value={formData.staffName}
                    onChange={(e) => setFormData({ ...formData, staffName: e.target.value })}
                    placeholder="VD: Kỹ thuật viên Linh"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Nhân Viên Phụ Trách
                  </label>
                  <input
                    type="email"
                    value={formData.staffEmail}
                    onChange={(e) => setFormData({ ...formData, staffEmail: e.target.value })}
                    placeholder="support@airobotics.edu.vn"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-white flex justify-end items-center space-x-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => saveMutation.mutate(formData)}
                disabled={saveMutation.isPending}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {saveMutation.isPending ? 'Đang lưu...' : 'Lưu Khách Hàng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP GỬI EMAIL NHẮC HẠN */}
      {(alertModalItem || isBulkSend) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {isBulkSend ? 'Gửi Email Nhắc Hạn Hàng Loạt' : 'Gửi Email Cảnh Báo Gia Hạn'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isBulkSend
                      ? `Gửi tới ${bulkSendIds.length} khách hàng được chọn`
                      : `Gửi tới: ${alertModalItem?.customerEmail}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAlertModalItem(null);
                  setIsBulkSend(false);
                  setBulkSendIds([]);
                }}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200 transition-all font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tiêu Đề Email
                </label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Để trống sẽ tự dùng tiêu đề tiêu chuẩn"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nội Dung Lời Nhắn Mở Đầu Email
                </label>
                <textarea
                  rows={4}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Để trống sẽ tự dùng mẫu tiêu chuẩn đã lưu trong Cài Đặt..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Bảng chi tiết thông tin gói dịch vụ, giá tiền và thông tin liên hệ sẽ tự động được hệ thống đính kèm vào email gửi khách.
                </p>
              </div>

              {/* Template Preview */}
              {settings?.emailAlertSubject && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Template Xem Trước</span>
                    <span className="text-slate-400 normal-case font-medium">Mẫu lưu trong Cài Đặt</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 border-b border-slate-200 pb-2">
                    {customSubject || settings.emailAlertSubject}
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {(customMessage || settings.emailAlertBody || '').replace(/\n/g, ' ')}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-white flex justify-end items-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  setAlertModalItem(null);
                  setIsBulkSend(false);
                  setBulkSendIds([]);
                }}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={bulkSendMutation.isPending || sendEmailMutation.isPending}
                className="inline-flex items-center space-x-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {bulkSendMutation.isPending || sendEmailMutation.isPending
                    ? 'Đang gửi...'
                    : isBulkSend
                    ? `Gửi tới ${bulkSendIds.length} khách hàng`
                    : 'Gửi Email Ngay'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
