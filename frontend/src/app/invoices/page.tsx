'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getExportPdfUrl } from '@/lib/api';
import { formatVietnamDateTime } from '@/lib/date';
import {
  Plus,
  Search,
  FileText,
  Copy,
  Pencil,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Clock,
  Download,
  TrendingUp,
  Eye,
  MoreVertical,
  RotateCcw,
  ArchiveRestore,
  CalendarClock,
  UserPlus,
  CreditCard,
  ExternalLink,
  X,
  AlertTriangle,
  Mail,
  Send,
  MessageSquare,
  Users,
  Check,
  Sparkles,
} from 'lucide-react';
import { INVOICE_TYPE_CONFIG, INVOICE_FORM_CONFIG, InvoiceType, InvoiceForm } from '@invoice/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import AddSubscriptionFromInvoiceModal from '@/components/AddSubscriptionFromInvoiceModal';

export default function InvoicesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast, confirm } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openMenuRow, setOpenMenuRow] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const [selectedInvoiceForSub, setSelectedInvoiceForSub] = useState<any>(null);

  // Modals quản lý hàng loạt
  const [isBulkPayOpen, setIsBulkPayOpen] = useState(false);
  const [bulkPayNote, setBulkPayNote] = useState('');
  const [bulkPaySendEmail, setBulkPaySendEmail] = useState(true);
  const [bulkPaySendZalo, setBulkPaySendZalo] = useState(true);

  const [isBulkSubOpen, setIsBulkSubOpen] = useState(false);
  const [bulkSubCycle, setBulkSubCycle] = useState('auto');
  const [bulkSubNotes, setBulkSubNotes] = useState('');

  // Modals hiển thị kết quả thông báo đẹp mắt
  const [singlePayResult, setSinglePayResult] = useState<{
    isOpen: boolean;
    invoice?: any;
    emailResult?: any;
    zaloResult?: any;
  }>({ isOpen: false });

  const [bulkPayResult, setBulkPayResult] = useState<{
    isOpen: boolean;
    count: number;
    totalAmount: number;
    message: string;
  }>({ isOpen: false, count: 0, totalAmount: 0, message: '' });

  const [bulkSubResult, setBulkSubResult] = useState<{
    isOpen: boolean;
    count: number;
    total: number;
    errorsCount: number;
    message: string;
  }>({ isOpen: false, count: 0, total: 0, errorsCount: 0, message: '' });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isTrashView = selectedStatus === 'TRASH';

  // Phím tắt `/` để focus vào thanh tìm kiếm
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      if (isTyping) return;
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setOpenMenuRow(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Đóng menu 3 chấm khi click ra ngoài
  useEffect(() => {
    if (!openMenuRow) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuRow(null);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [openMenuRow]);

  // Lấy danh sách hóa đơn (đang hoạt động hoặc trong thùng rác)
  const { data: invoices = [], isLoading, refetch, isFetching } = useQuery<any[]>({
    queryKey: ['invoices', isTrashView],
    queryFn: async () => {
      const res = await api.get('/invoices', {
        params: { trash: isTrashView ? 'true' : 'false' },
      });
      return res.data;
    },
    enabled: !!user,
  });

  // Lấy số lượng hóa đơn trong Thùng rác để hiển thị badge
  const { data: trashInvoices = [] } = useQuery<any[]>({
    queryKey: ['invoices-trash-count'],
    queryFn: async () => {
      const res = await api.get('/invoices', { params: { trash: 'true' } });
      return res.data;
    },
    enabled: !!user,
  });
  const trashCount = trashInvoices.length;

  // Clone hóa đơn
  const cloneMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.post(`/invoices/${id}/clone`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast('success', 'Nhân bản thành công', 'Đã tạo bản sao hóa đơn mới');
    },
    onError: (err: any) => {
      toast('error', 'Lỗi nhân bản hóa đơn', err.response?.data?.message || err.message);
    },
  });

  // Xác nhận thanh toán 1 hóa đơn
  const payMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      return api.post(`/invoices/${id}/pay`, { note });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      // ƯU TIÊN TỨC THÌ: Chuyển ngay sang tab "Đã thanh toán"
      setSelectedStatus('PAID');

      const data = res?.data || {};
      const inv = data?.invoice;
      setSinglePayResult({
        isOpen: true,
        invoice: inv,
        emailResult: data?.emailResult,
        zaloResult: data?.zaloResult,
      });
      toast('success', 'Thanh toán thành công', `Hóa đơn #${inv?.invoiceNumber || ''} đã chuyển sang ĐÃ THANH TOÁN`);
    },
    onError: (err: any) => {
      toast('error', 'Lỗi xác nhận thanh toán', err.response?.data?.message || err.message);
    },
  });

  // Thanh toán hàng loạt hóa đơn
  const bulkPayMutation = useMutation({
    mutationFn: async ({
      ids,
      note,
      sendEmail,
      sendZalo,
    }: {
      ids: string[];
      note?: string;
      sendEmail?: boolean;
      sendZalo?: boolean;
    }) => {
      return api.post('/invoices/bulk-pay', { ids, note, sendEmail, sendZalo });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      const count = res.data?.count || selectedIds.length;
      const totalAmount = res.data?.totalAmount || 0;
      setSelectedIds([]);
      setIsBulkPayOpen(false);

      // ƯU TIÊN TỨC THÌ: Chuyển ngay sang tab "Đã thanh toán"
      setSelectedStatus('PAID');

      setBulkPayResult({
        isOpen: true,
        count,
        totalAmount,
        message: res.data?.message || `Đã xác nhận thanh toán thành công ${count} hóa đơn!`,
      });
      toast('success', 'Thanh toán nhiều thành công', `Đã chuyển ${count} hóa đơn sang trạng thái ĐÃ THANH TOÁN`);
    },
    onError: (err: any) => {
      toast('error', 'Lỗi thanh toán hàng loạt', err.response?.data?.message || err.message);
    },
  });

  // Chuyển thành khách hàng nhanh hàng loạt
  const bulkSubMutation = useMutation({
    mutationFn: async ({ ids, cycle, notes }: { ids: string[]; cycle?: string; notes?: string }) => {
      return api.post('/subscriptions/bulk-from-invoices', {
        ids,
        cycle: cycle === 'auto' ? undefined : cycle,
        notes,
      });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      const count = res.data?.count || 0;
      const total = res.data?.total || selectedIds.length;
      const errorsCount = res.data?.errorsCount || 0;
      setSelectedIds([]);
      setIsBulkSubOpen(false);

      setBulkSubResult({
        isOpen: true,
        count,
        total,
        errorsCount,
        message: res.data?.message || `Đã chuyển thành công ${count}/${total} khách hàng!`,
      });
      toast('success', 'Chuyển khách hàng thành công', `Đã lưu ${count} khách hàng vào Trang Khách Hàng`);
    },
    onError: (err: any) => {
      toast('error', 'Lỗi chuyển thành khách hàng', err.response?.data?.message || err.message);
    },
  });

  // Xóa hóa đơn (Chuyển vào Thùng rác)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-trash-count'] });
      toast('info', 'Đã chuyển vào Thùng rác', 'Bạn có thể khôi phục lại bất kỳ lúc nào');
    },
    onError: (err: any) => {
      toast('error', 'Lỗi xóa hóa đơn', err.response?.data?.message || err.message);
    },
  });

  // Xóa nhiều hóa đơn (Chuyển vào Thùng rác)
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return api.post('/invoices/bulk-delete', { ids });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-trash-count'] });
      const count = res?.data?.count || selectedIds.length;
      setSelectedIds([]);
      toast('info', 'Đã chuyển vào Thùng rác', `Đã chuyển ${count} hóa đơn đã chọn vào Thùng rác`);
    },
    onError: (err: any) => {
      toast('error', 'Lỗi xóa nhiều hóa đơn', err.response?.data?.message || err.message);
    },
  });

  // Khôi phục hóa đơn từ Thùng rác
  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.post(`/invoices/${id}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-trash-count'] });
      toast('success', 'Khôi phục thành công', 'Hóa đơn đã được đưa về bảng chính');
    },
    onError: (err: any) => {
      toast('error', 'Lỗi khôi phục hóa đơn', err.response?.data?.message || err.message);
    },
  });

  // Khôi phục nhiều hóa đơn đã chọn
  const bulkRestoreMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return api.post('/invoices/bulk-restore', { ids });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-trash-count'] });
      const count = res?.data?.count || selectedIds.length;
      setSelectedIds([]);
      toast('success', 'Khôi phục thành công', `Đã khôi phục ${count} hóa đơn về bảng chính`);
    },
    onError: (err: any) => {
      toast('error', 'Lỗi khôi phục nhiều hóa đơn', err.response?.data?.message || err.message);
    },
  });

  // Xóa vĩnh viễn 1 hóa đơn
  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/invoices/${id}/permanent`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-trash-count'] });
      toast('info', 'Đã xóa vĩnh viễn', 'Hóa đơn đã được gỡ bỏ khỏi cơ sở dữ liệu');
    },
    onError: (err: any) => {
      toast('error', 'Lỗi xóa vĩnh viễn', err.response?.data?.message || err.message);
    },
  });

  // Xóa vĩnh viễn nhiều hóa đơn
  const bulkPermanentDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return api.post('/invoices/bulk-permanent-delete', { ids });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-trash-count'] });
      const count = res?.data?.count || selectedIds.length;
      setSelectedIds([]);
      toast('info', 'Đã xóa vĩnh viễn', `Đã xóa vĩnh viễn ${count} hóa đơn đã chọn`);
    },
    onError: (err: any) => {
      toast('error', 'Lỗi xóa vĩnh viễn', err.response?.data?.message || err.message);
    },
  });

  // Dọn sạch thùng rác
  const emptyTrashMutation = useMutation({
    mutationFn: async () => {
      return api.post('/invoices/empty-trash');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-trash-count'] });
      setSelectedIds([]);
      toast('success', 'Thùng rác đã sạch', 'Đã dọn sạch toàn bộ thùng rác');
    },
    onError: (err: any) => {
      toast('error', 'Lỗi dọn thùng rác', err.response?.data?.message || err.message);
    },
  });

  // Tải bản sao lưu toàn bộ hóa đơn
  const handleExportBackup = async () => {
    try {
      const res = await api.get('/invoices/backup/export');
      const data = res.data;
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_invoices_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('success', 'Tải sao lưu thành công', 'File backup đã được lưu về máy');
    } catch (err: any) {
      toast('error', 'Lỗi tải bản sao lưu', err.response?.data?.message || err.message);
    }
  };

  // Tính toán KPI số liệu
  const metrics = useMemo(() => {
    const totalCount = invoices.length;
    let paidRevenue = 0;
    let pendingRevenue = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;

    invoices.forEach((inv) => {
      const amount = Number(inv.grandTotal) || 0;
      if (inv.status === 'PAID') {
        paidRevenue += amount;
        paidCount++;
      } else if (inv.status === 'ISSUED' || inv.status === 'SENT') {
        pendingRevenue += amount;
        pendingCount++;
      } else if (inv.status === 'CANCELLED') {
        cancelledCount++;
      }
    });

    return {
      totalCount,
      paidRevenue,
      pendingRevenue,
      paidCount,
      pendingCount,
      cancelledCount,
    };
  }, [invoices]);

  // Lọc dữ liệu theo tìm kiếm & status
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        searchTerm === '' ||
        inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.buyerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.buyerCompany?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.buyerEmail?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = isTrashView || selectedStatus === 'ALL' || inv.status === selectedStatus;
      const matchType = selectedType === 'ALL' || inv.invoiceType === selectedType;

      return matchSearch && matchStatus && matchType;
    });
  }, [invoices, searchTerm, selectedStatus, selectedType, isTrashView]);

  // Các hóa đơn đang được chọn trong danh sách hiện tại
  const selectedInvoices = useMemo(() => {
    return invoices.filter((inv) => selectedIds.includes(inv.id));
  }, [invoices, selectedIds]);

  const totalSelectedAmount = useMemo(() => {
    return selectedInvoices.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0);
  }, [selectedInvoices]);

  const unpaidSelectedInvoices = useMemo(() => {
    return selectedInvoices.filter((inv) => inv.status !== 'PAID' && inv.status !== 'CANCELLED');
  }, [selectedInvoices]);

  // Xử lý chọn nhiều (Multi-Select)
  const isAllSelected =
    filteredInvoices.length > 0 &&
    filteredInvoices.every((inv) => selectedIds.includes(inv.id));
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInvoices.map((inv) => inv.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (isTrashView) {
      const ok = await confirm({
        title: 'Xác nhận xóa vĩnh viễn?',
        message: `Bạn có chắc chắn muốn XÓA VĨNH VIỄN ${selectedIds.length} hóa đơn đã chọn khỏi cơ sở dữ liệu? Hành động này KHÔNG THỂ HOÀN TÁC!`,
        confirmLabel: 'Xóa vĩnh viễn',
        danger: true,
      });
      if (ok) {
        bulkPermanentDeleteMutation.mutate(selectedIds);
      }
    } else {
      const ok = await confirm({
        title: 'Chuyển vào thùng rác?',
        message: `Bạn có chắc muốn chuyển ${selectedIds.length} hóa đơn đã chọn vào Thùng rác không? Bạn có thể khôi phục lại bất kỳ lúc nào.`,
        confirmLabel: 'Chuyển thùng rác',
      });
      if (ok) {
        bulkDeleteMutation.mutate(selectedIds);
      }
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    const ok = await confirm({
      title: 'Khôi phục hóa đơn?',
      message: `Khôi phục ${selectedIds.length} hóa đơn đã chọn về danh sách chính?`,
      confirmLabel: 'Khôi phục ngay',
    });
    if (ok) {
      bulkRestoreMutation.mutate(selectedIds);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Đã thanh toán</span>
          </span>
        );
      case 'ISSUED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Đã phát hành</span>
          </span>
        );
      case 'SENT':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>Đã gửi mail</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200 line-through">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Đã hủy</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
      {/* Top Title & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản Lý Hóa Đơn</h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi, phát hành và kiểm soát dòng tiền thanh toán dịch vụ
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="inline-flex items-center space-x-1.5 px-3 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold text-xs transition-all shadow-xs cursor-pointer"
            title="Tải tệp sao lưu toàn bộ dữ liệu hóa đơn về máy tính"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Sao Lưu (Backup)</span>
          </button>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 transition-all shadow-xs cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <Link
            href="/invoices/new"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Hóa Đơn Mới</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Đã Thu */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Doanh Thu Thực Thu (Đã Trả)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums tracking-tight text-emerald-700">
            {formatCurrency(metrics.paidRevenue)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {metrics.paidCount} hóa đơn đã hoàn tất
          </div>
        </div>

        {/* Metric 2: Chờ Thu */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Đang Chờ Thanh Toán</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums tracking-tight text-amber-600">
            {formatCurrency(metrics.pendingRevenue)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {metrics.pendingCount} hóa đơn chưa thanh toán
          </div>
        </div>

        {/* Metric 3: Tổng Số Hóa Đơn */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Tổng Hóa Đơn Hoạt Động</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums tracking-tight text-slate-900">
            {metrics.totalCount}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Bao gồm GTGT, Bán hàng & Dịch vụ
          </div>
        </div>

        {/* Metric 4: Tỉ Lệ Thu Tiền */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Tỉ Lệ Thu Tiền</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums tracking-tight text-slate-900">
            {metrics.totalCount > 0
              ? `${Math.round((metrics.paidCount / metrics.totalCount) * 100)}%`
              : '100%'}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {metrics.cancelledCount > 0 ? `${metrics.cancelledCount} hóa đơn đã hủy` : 'Không có hóa đơn hủy'}
          </div>
        </div>
      </div>

      {/* Filter Toolbar & Segmented Status Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs Segment */}
          <div className="flex flex-wrap items-center bg-slate-100/80 p-1 rounded-xl gap-1">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'PAID', label: 'Đã thanh toán' },
              { id: 'ISSUED', label: 'Đã phát hành' },
              { id: 'SENT', label: 'Đã gửi' },
              { id: 'CANCELLED', label: 'Đã hủy' },
              {
                id: 'TRASH',
                label: `Thùng rác${trashCount > 0 ? ` (${trashCount})` : ''}`,
                isTrash: true,
              },
            ].map((tab) => {
              const isSelected = selectedStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedStatus(tab.id);
                    setSelectedIds([]);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    isSelected
                      ? tab.isTrash
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
                        : 'bg-white text-slate-900 shadow-xs'
                      : tab.isTrash && trashCount > 0
                      ? 'text-rose-600 hover:text-rose-800'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.isTrash && <Trash2 className="w-3.5 h-3.5" />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Bar & Type Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã, khách hàng, email (Bấm '/' để gõ)..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer"
            >
              <option value="ALL">Tất cả loại hóa đơn</option>
              {Object.entries(INVOICE_TYPE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cảnh báo Thùng rác nếu đang ở chế độ xem Thùng rác */}
        {isTrashView && (
          <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800">
            <div className="flex items-center space-x-2">
              <ArchiveRestore className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Bạn đang xem <strong>Thùng rác</strong> ({trashCount} hóa đơn). Hóa đơn trong này không tính vào doanh thu.
              </span>
            </div>
            {trashCount > 0 && (
              <button
                type="button"
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Dọn sạch thùng rác?',
                    message: 'Bạn có chắc chắn muốn DỌN SẠCH toàn bộ thùng rác không? Tất cả các hóa đơn trong thùng rác sẽ bị xóa vĩnh viễn và không thể khôi phục.',
                    confirmLabel: 'Dọn sạch ngay',
                    danger: true,
                  });
                  if (ok) {
                    emptyTrashMutation.mutate();
                  }
                }}
                disabled={emptyTrashMutation.isPending}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors cursor-pointer self-start sm:self-auto shrink-0"
              >
                {emptyTrashMutation.isPending ? 'Đang dọn...' : 'Dọn sạch thùng rác'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500">Đang tải danh sách hóa đơn...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">Không tìm thấy hóa đơn nào</p>
              <p className="text-xs text-slate-500">
                {searchTerm || selectedStatus !== 'ALL' || selectedType !== 'ALL'
                  ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                  : 'Bắt đầu bằng cách tạo hóa đơn mới đầu tiên'}
              </p>
            </div>
            {!(searchTerm || selectedStatus !== 'ALL' || selectedType !== 'ALL') && (
              <Link
                href="/invoices/new"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo hóa đơn ngay</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      onChange={handleToggleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      title="Chọn tất cả hóa đơn trang này"
                    />
                  </th>
                  <th className="py-3 px-4">Số Hóa Đơn</th>
                  <th className="py-3 px-4">Khách Hàng / Đơn Vị</th>
                  <th className="py-3 px-4">Loại & Hình Thức</th>
                  <th className="py-3 px-4 text-right">Tổng Tiền</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4">Ngày Lập</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredInvoices.map((inv) => {
                  const isChecked = selectedIds.includes(inv.id);
                  const isMenuOpen = openMenuRow === inv.id;
                  const typeCfg =
                    (inv.invoiceType && (INVOICE_TYPE_CONFIG as any)[inv.invoiceType]) ||
                    (INVOICE_TYPE_CONFIG as any)[InvoiceType.BAN_HANG] || {
                      label: inv.invoiceType || 'Bán hàng',
                    };
                  const formCfg =
                    (inv.invoiceForm && (INVOICE_FORM_CONFIG as any)[inv.invoiceForm]) ||
                    (INVOICE_FORM_CONFIG as any)[InvoiceForm.WITH_TAX_CODE] || {
                      label: 'Có mã CQT',
                    };

                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isChecked ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectRow(inv.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {/* Số Hóa Đơn */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="font-bold text-blue-600 hover:text-blue-800 font-mono hover:underline cursor-pointer"
                          >
                            #{inv.invoiceNumber}
                          </Link>
                          {inv.isDraft && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Nháp
                            </span>
                          )}
                        </div>
                        {inv.paymentCode && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Mã: {inv.paymentCode}
                          </div>
                        )}
                      </td>

                      {/* Khách Hàng */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{inv.buyerName}</div>
                        {inv.buyerCompany && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">
                            {inv.buyerCompany}
                          </div>
                        )}
                        {inv.buyerEmail && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            {inv.buyerEmail}
                          </div>
                        )}
                      </td>

                      {/* Loại & Hình Thức */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col space-y-1">
                          <span className="text-[11px] font-medium text-slate-700">
                            {typeCfg.label}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formCfg.label}
                          </span>
                        </div>
                      </td>

                      {/* Tổng Tiền */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatCurrency(inv.grandTotal)}
                      </td>

                      {/* Trạng Thái */}
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(inv.status)}
                      </td>

                      {/* Ngày Lập */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        <div>{formatVietnamDateTime(inv.issueDate || inv.createdAt)}</div>
                      </td>

                      {/* Thao Tác (Actions Menu) */}
                      <td className="py-3 px-4 text-right relative">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openMenuRow === inv.id) {
                                setOpenMenuRow(null);
                                setMenuPos(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const menuEstimatedHeight = 260;
                                const spaceBelow = window.innerHeight - rect.bottom;
                                const openUpwards = spaceBelow < menuEstimatedHeight;

                                setMenuPos({
                                  top: openUpwards ? undefined : rect.bottom + 4,
                                  bottom: openUpwards ? window.innerHeight - rect.top + 4 : undefined,
                                  right: window.innerWidth - rect.right,
                                });
                                setOpenMenuRow(inv.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Thao tác khác"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Dropdown Menu (tự động mở lên trên nếu ở sát đáy màn hình để không bị che) */}
                        {isMenuOpen && menuPos && (
                          <div
                            ref={menuRef}
                            style={{
                              position: 'fixed',
                              top: menuPos.top !== undefined ? `${menuPos.top}px` : undefined,
                              bottom: menuPos.bottom !== undefined ? `${menuPos.bottom}px` : undefined,
                              right: `${menuPos.right}px`,
                              zIndex: 60,
                              maxHeight: 'calc(100vh - 32px)',
                              overflowY: 'auto',
                            }}
                            className="w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-1.5 text-left animate-in fade-in zoom-in-95 duration-150"
                          >
                            {isTrashView ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    restoreMutation.mutate(inv.id);
                                    setOpenMenuRow(null);
                                    setMenuPos(null);
                                  }}
                                  disabled={restoreMutation.isPending}
                                  className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors text-left cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Khôi phục hóa đơn</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const ok = await confirm({
                                      title: 'Xóa vĩnh viễn hóa đơn?',
                                      message: `Bạn có chắc muốn XÓA VĨNH VIỄN hóa đơn ${inv.invoiceNumber} không? Thao tác này không thể hoàn tác!`,
                                      confirmLabel: 'Xóa vĩnh viễn',
                                      danger: true,
                                    });
                                    if (ok) {
                                      permanentDeleteMutation.mutate(inv.id);
                                    }
                                    setOpenMenuRow(null);
                                    setMenuPos(null);
                                  }}
                                  disabled={permanentDeleteMutation.isPending}
                                  className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Xóa vĩnh viễn</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <Link
                                  href={`/invoices/${inv.id}/edit`}
                                  onClick={() => { setOpenMenuRow(null); setMenuPos(null); }}
                                  className="flex items-center space-x-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Chỉnh sửa hóa đơn</span>
                                </Link>

                                <a
                                  href={getExportPdfUrl(inv.id)}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => { setOpenMenuRow(null); setMenuPos(null); }}
                                  className="flex items-center space-x-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5 text-slate-400" />
                                  <span>In / Tải PDF</span>
                                </a>

                                <button
                                  type="button"
                                  onClick={() => {
                                    cloneMutation.mutate(inv.id);
                                    setOpenMenuRow(null);
                                    setMenuPos(null);
                                  }}
                                  disabled={cloneMutation.isPending}
                                  className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Nhân bản hóa đơn</span>
                                </button>

                                {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      payMutation.mutate({ id: inv.id });
                                      setOpenMenuRow(null);
                                      setMenuPos(null);
                                    }}
                                    disabled={payMutation.isPending}
                                    className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors text-left cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Xác nhận đã thanh toán</span>
                                  </button>
                                )}

                                {inv.status === 'PAID' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedInvoiceForSub(inv);
                                      setOpenMenuRow(null);
                                      setMenuPos(null);
                                    }}
                                    className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors text-left cursor-pointer"
                                  >
                                    <CalendarClock className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Thêm vào Trang Khách Hàng</span>
                                  </button>
                                )}

                                <div className="my-1 border-t border-slate-100" />

                                <button
                                  type="button"
                                  onClick={async () => {
                                    const ok = await confirm({
                                      title: 'Chuyển vào thùng rác?',
                                      message: `Bạn có chắc muốn chuyển hóa đơn ${inv.invoiceNumber} vào Thùng rác? Bạn có thể khôi phục lại bất kỳ lúc nào.`,
                                      confirmLabel: 'Chuyển thùng rác',
                                    });
                                    if (ok) {
                                      deleteMutation.mutate(inv.id);
                                    }
                                    setOpenMenuRow(null);
                                    setMenuPos(null);
                                  }}
                                  disabled={deleteMutation.isPending}
                                  className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Chuyển vào Thùng rác</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer Summary */}
        {filteredInvoices.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Hiển thị <strong>{filteredInvoices.length}</strong> / <strong>{invoices.length}</strong> hóa đơn
            </span>
            <span className="font-mono tabular-nums font-medium">
              Tổng tiền trang này:{' '}
              <strong className="text-slate-900">
                {formatCurrency(
                  filteredInvoices.reduce((acc, it) => acc + (Number(it.grandTotal) || 0), 0)
                )}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Floating Batch Action Bar (CẢI TIẾN: Thêm Thanh toán nhiều & Chuyển khách hàng nhanh) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 border border-slate-700/80">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-mono font-bold text-white">
              {selectedIds.length}
            </span>
            <span>Đã chọn {selectedIds.length} hóa đơn</span>
            <span className="text-slate-400 font-mono font-normal">
              ({formatCurrency(totalSelectedAmount)})
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          {isTrashView ? (
            <>
              <button
                type="button"
                onClick={handleBulkRestore}
                disabled={bulkRestoreMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{bulkRestoreMutation.isPending ? 'Đang khôi phục...' : `Khôi phục (${selectedIds.length})`}</span>
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkPermanentDeleteMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{bulkPermanentDeleteMutation.isPending ? 'Đang xóa...' : `Xóa vĩnh viễn (${selectedIds.length})`}</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {/* Nút Thanh Toán Nhiều */}
              <button
                type="button"
                onClick={() => {
                  setBulkPayNote('Xác nhận thanh toán hàng loạt');
                  setIsBulkPayOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>
                  Thanh toán ({unpaidSelectedInvoices.length > 0 ? unpaidSelectedInvoices.length : selectedIds.length})
                </span>
              </button>

              {/* Nút Chuyển Thành Khách Hàng Nhanh */}
              <button
                type="button"
                onClick={() => {
                  setBulkSubNotes('Thêm từ danh sách hóa đơn đã chọn');
                  setIsBulkSubOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-900/30 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Chuyển thành khách hàng ({selectedIds.length})</span>
              </button>

              {/* Nút Xóa Nhiều (Thùng rác) */}
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-rose-700 text-slate-300 hover:text-white text-xs font-medium rounded-xl transition-all cursor-pointer border border-slate-700"
                title="Chuyển vào Thùng rác"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Thùng rác</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer px-2 py-1 ml-auto"
          >
            Bỏ chọn
          </button>
        </div>
      )}

      {/* ================= MODAL: THANH TOÁN NHIỀU HÓA ĐƠN ================= */}
      {isBulkPayOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-slate-100">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl shadow-xs">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Xác Nhận Thanh Toán Hàng Loạt</h3>
                  <p className="text-xs text-slate-500">
                    Áp dụng cho <strong>{selectedIds.length}</strong> hóa đơn được chọn
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkPayOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nội dung */}
            <div className="p-6 space-y-4">
              {/* Tóm tắt số tiền */}
              <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-800 font-semibold block">
                    Tổng số tiền thanh toán
                  </span>
                  <span className="text-xs text-emerald-600">
                    {selectedIds.length} hóa đơn ({unpaidSelectedInvoices.length} chưa thanh toán)
                  </span>
                </div>
                <div className="text-lg font-bold font-mono text-emerald-700">
                  {formatCurrency(totalSelectedAmount)}
                </div>
              </div>

              {/* Danh sách hóa đơn tóm tắt */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {selectedInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-900 font-mono">#{inv.invoiceNumber}</span>
                      <span className="text-slate-500 ml-2">{inv.buyerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-slate-800">
                        {formatCurrency(inv.grandTotal)}
                      </span>
                      {inv.status === 'PAID' ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-700 font-bold">
                          Đã trả
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 font-bold">
                          Chờ trả
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tùy chọn thông báo */}
              <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
                <label className="flex items-center space-x-2.5 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={bulkPaySendEmail}
                    onChange={(e) => setBulkPaySendEmail(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Tự động gửi <strong>Email biên lai thanh toán</strong> cho khách hàng</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={bulkPaySendZalo}
                    onChange={(e) => setBulkPaySendZalo(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Tự động gửi <strong>Tin nhắn Zalo</strong> xác nhận kích hoạt dịch vụ</span>
                </label>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú thanh toán
                </label>
                <input
                  type="text"
                  value={bulkPayNote}
                  onChange={(e) => setBulkPayNote(e.target.value)}
                  placeholder="Ghi chú đối soát..."
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkPayOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() =>
                    bulkPayMutation.mutate({
                      ids: selectedIds,
                      note: bulkPayNote,
                      sendEmail: bulkPaySendEmail,
                      sendZalo: bulkPaySendZalo,
                    })
                  }
                  disabled={bulkPayMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-200 transition-all cursor-pointer"
                >
                  <CheckCircle2 className={`w-4 h-4 ${bulkPayMutation.isPending ? 'animate-spin' : ''}`} />
                  <span>
                    {bulkPayMutation.isPending
                      ? 'Đang xử lý thanh toán...'
                      : `Xác Nhận Thanh Toán (${selectedIds.length})`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CHUYỂN THÀNH KHÁCH HÀNG NHANH ================= */}
      {isBulkSubOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-slate-100">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl shadow-xs">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Chuyển Nhanh Thành Khách Hàng</h3>
                  <p className="text-xs text-slate-500">
                    Đăng ký dịch vụ cho <strong>{selectedIds.length}</strong> hóa đơn được chọn
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkSubOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nội dung */}
            <div className="p-6 space-y-4">
              <div className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-200/80 text-xs text-indigo-900 leading-relaxed">
                Hệ thống sẽ tự động trích xuất thông tin khách hàng, gói dịch vụ và thời gian bắt đầu (tính từ ngày thanh toán) để tạo thuê bao trên <strong>Trang Khách Hàng</strong>.
              </div>

              {/* Danh sách tóm tắt */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {selectedInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">{inv.buyerName}</span>
                      <span className="text-slate-400 text-[11px] block truncate max-w-xs">
                        {inv.items?.[0]?.name || 'Gói Dịch Vụ'}
                      </span>
                    </div>
                    <span className="font-mono text-slate-500 text-[11px]">#{inv.invoiceNumber}</span>
                  </div>
                ))}
              </div>

              {/* Cấu hình chu kỳ */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chu kỳ gói dịch vụ áp dụng
                </label>
                <select
                  value={bulkSubCycle}
                  onChange={(e) => setBulkSubCycle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-800"
                >
                  <option value="auto">✨ Tự động nhận diện theo tên gói (Khuyên dùng)</option>
                  <option value="1 tháng">1 tháng (30 ngày)</option>
                  <option value="3 tháng">3 tháng (1 quý)</option>
                  <option value="6 tháng">6 tháng</option>
                  <option value="1 năm">1 năm (12 tháng)</option>
                </select>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú cho các thuê bao
                </label>
                <input
                  type="text"
                  value={bulkSubNotes}
                  onChange={(e) => setBulkSubNotes(e.target.value)}
                  placeholder="Ghi chú thêm..."
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkSubOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() =>
                    bulkSubMutation.mutate({
                      ids: selectedIds,
                      cycle: bulkSubCycle,
                      notes: bulkSubNotes,
                    })
                  }
                  disabled={bulkSubMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer"
                >
                  <UserPlus className={`w-4 h-4 ${bulkSubMutation.isPending ? 'animate-spin' : ''}`} />
                  <span>
                    {bulkSubMutation.isPending
                      ? 'Đang chuyển đổi...'
                      : `Chuyển Ngay (${selectedIds.length})`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: THÔNG BÁO KẾT QUẢ THANH TOÁN 1 HÓA ĐƠN ================= */}
      {singlePayResult.isOpen && singlePayResult.invoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-slate-100 p-6 space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Xác Nhận Thanh Toán Thành Công!
              </h3>
              <p className="text-xs text-slate-500">
                Hóa đơn <strong className="text-slate-800">#{singlePayResult.invoice.invoiceNumber}</strong> đã được chuyển sang tab <strong>Đã thanh toán</strong>
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Khách hàng:</span>
                <span className="font-semibold text-slate-800">{singlePayResult.invoice.buyerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tiền:</span>
                <span className="font-bold text-emerald-600 font-mono">
                  {formatCurrency(singlePayResult.invoice.grandTotal)}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200/60">
                <span className="text-slate-500">Email biên lai:</span>
                <span className="text-slate-700 font-medium">
                  {singlePayResult.emailResult?.queued ? 'Đang gửi ngầm' : 'Hoàn tất'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  const inv = singlePayResult.invoice;
                  setSinglePayResult({ isOpen: false });
                  setSelectedInvoiceForSub(inv);
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <CalendarClock className="w-4 h-4" />
                <span>Thêm Khách Hàng Này Vào Trang Khách Hàng</span>
              </button>

              <button
                type="button"
                onClick={() => setSinglePayResult({ isOpen: false })}
                className="w-full px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer text-center"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: THÔNG BÁO KẾT QUẢ THANH TOÁN HÀNG LOẠT ================= */}
      {bulkPayResult.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-slate-100 p-6 space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Thanh Toán Hàng Loạt Hoàn Tất!
              </h3>
              <p className="text-xs text-slate-500">{bulkPayResult.message}</p>
            </div>

            <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 text-center space-y-1">
              <span className="text-[11px] text-emerald-700 font-semibold block uppercase">
                Tổng giá trị đã xác nhận thu
              </span>
              <span className="text-xl font-bold font-mono text-emerald-800">
                {formatCurrency(bulkPayResult.totalAmount)}
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setBulkPayResult({ isOpen: false, count: 0, totalAmount: 0, message: '' })}
                className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer text-center"
              >
                Xem Hóa Đơn Đã Thanh Toán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: THÔNG BÁO KẾT QUẢ CHUYỂN KHÁCH HÀNG HÀNG LOẠT ================= */}
      {bulkSubResult.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-slate-100 p-6 space-y-4">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Đã Lưu Vào Trang Khách Hàng!
              </h3>
              <p className="text-xs text-slate-500">{bulkSubResult.message}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex justify-between">
              <span>Khách hàng thành công:</span>
              <span className="font-bold text-indigo-700">{bulkSubResult.count}</span>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBulkSubResult({ isOpen: false, count: 0, total: 0, errorsCount: 0, message: '' })}
                className="flex-1 px-4 py-2.5 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center"
              >
                Ở lại trang này
              </button>

              <button
                type="button"
                onClick={() => {
                  setBulkSubResult({ isOpen: false, count: 0, total: 0, errorsCount: 0, message: '' });
                  router.push('/subscriptions');
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Tới Trang Khách Hàng</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm vào Trang Khách Hàng (Từng đơn) */}
      <AddSubscriptionFromInvoiceModal
        isOpen={!!selectedInvoiceForSub}
        onClose={() => setSelectedInvoiceForSub(null)}
        invoice={selectedInvoiceForSub}
      />
    </div>
  );
}
