'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getExportPdfUrl } from '@/lib/api';
import { formatVietnamDateTime } from '@/lib/date';
import {
  Plus,
  Search,
  FileText,
  Copy,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Clock,
  Download,
  TrendingUp,
  Eye,
  MoreVertical,
} from 'lucide-react';
import { INVOICE_TYPE_CONFIG, INVOICE_FORM_CONFIG, InvoiceType } from '@invoice/types';
import { useAuth } from '@/context/AuthContext';

export default function InvoicesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openMenuRow, setOpenMenuRow] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

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

  // Lấy danh sách hóa đơn
  const { data: invoices = [], isLoading, refetch, isFetching } = useQuery<any[]>({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await api.get('/invoices');
      return res.data;
    },
    enabled: !!user,
  });

  // Clone hóa đơn
  const cloneMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.post(`/invoices/${id}/clone`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      alert('Đã nhân bản hóa đơn thành công!');
    },
    onError: (err: any) => {
      alert('Lỗi nhân bản hóa đơn: ' + (err.response?.data?.message || err.message));
    },
  });

  // Xác nhận thanh toán
  const payMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      return api.post(`/invoices/${id}/pay`, { note });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      const data = res?.data || {};
      let msg = '🎉 Đã xác nhận thanh toán thành công!';
      if (data.emailResult?.sent) {
        msg += '\n• Đã gửi Email biên lai thanh toán tới khách hàng';
      } else if (data.emailResult?.error) {
        msg += `\n• Lưu ý Email: ${data.emailResult.error}`;
      }
      if (data.zaloResult?.sent) {
        msg += '\n• Đã gửi tin nhắn Zalo xác nhận kích hoạt tới khách hàng';
      } else if (data.zaloResult?.error) {
        msg += `\n• Lưu ý Zalo: ${data.zaloResult.error}`;
      }
      alert(msg);
    },
    onError: (err: any) => {
      alert('Lỗi xác nhận thanh toán: ' + (err.response?.data?.message || err.message));
    },
  });

  // Xóa hóa đơn
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      alert('Đã xóa hóa đơn thành công!');
    },
    onError: (err: any) => {
      alert('Lỗi xóa hóa đơn: ' + (err.response?.data?.message || err.message));
    },
  });

  // Xóa nhiều hóa đơn đã chọn (Bulk Delete)
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return api.post('/invoices/bulk-delete', { ids });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      const count = res?.data?.count || selectedIds.length;
      setSelectedIds([]);
      alert(`Đã xóa thành công ${count} hóa đơn đã chọn!`);
    },
    onError: (err: any) => {
      alert('Lỗi xóa nhiều hóa đơn: ' + (err.response?.data?.message || err.message));
    },
  });

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

      const matchStatus = selectedStatus === 'ALL' || inv.status === selectedStatus;
      const matchType = selectedType === 'ALL' || inv.invoiceType === selectedType;

      return matchSearch && matchStatus && matchType;
    });
  }, [invoices, searchTerm, selectedStatus, selectedType]);

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

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (
      confirm(
        `Bạn có chắc chắn muốn xóa ${selectedIds.length} hóa đơn đã chọn không?\nHành động này không thể hoàn tác!`
      )
    ) {
      bulkDeleteMutation.mutate(selectedIds);
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
            <span>Lập Hóa Đơn Mới</span>
          </Link>
        </div>
      </div>

      {/* Metric KPI Cards (Modern SaaS style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Thực Thu */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Doanh Thu Thực Thu</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums tracking-tight text-slate-900">
            {formatCurrency(metrics.paidRevenue)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center space-x-1">
            <span>{metrics.paidCount} hóa đơn đã thanh toán</span>
          </div>
        </div>

        {/* Metric 2: Chờ Thanh Toán */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Chờ Thanh Toán</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums tracking-tight text-blue-700">
            {formatCurrency(metrics.pendingRevenue)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium flex items-center space-x-1">
            <span>{metrics.pendingCount} hóa đơn chưa thu</span>
          </div>
        </div>

        {/* Metric 3: Tổng Số Hóa Đơn */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Tổng Hóa Đơn Đã Lập</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums tracking-tight text-slate-900">
            {metrics.totalCount} <span className="text-xs font-sans text-slate-400 font-normal">hóa đơn</span>
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
            ].map((tab) => {
              const isSelected = selectedStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Bar & Type Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Tìm theo số HĐ, tên khách..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded-md pointer-events-none">
                /
              </kbd>
            </div>

            {/* Bộ lọc loại hóa đơn dạng segment control */}
            <div className="flex flex-wrap items-center bg-slate-100/80 p-1 rounded-xl gap-1">
              {[
                { id: 'ALL', label: 'Mọi loại' },
                { id: 'GTGT', label: 'GTGT' },
                { id: 'BAN_HANG', label: 'Bán hàng' },
              ].map((tab) => {
                const isSelected = selectedType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedType(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <span>Đang tải danh sách hóa đơn...</span>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Chưa có hóa đơn nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || selectedStatus !== 'ALL' || selectedType !== 'ALL'
                ? 'Không tìm thấy hóa đơn phù hợp với bộ lọc hiện tại.'
                : 'Bắt đầu lập hóa đơn đầu tiên để quản lý và thu tiền tiện lợi.'}
            </p>
            {!(searchTerm || selectedStatus !== 'ALL' || selectedType !== 'ALL') && (
              <Link
                href="/invoices/new"
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Lập hóa đơn ngay</span>
              </Link>
            )}
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
                      aria-label="Chọn tất cả hóa đơn"
                    />
                  </th>
                  <th className="py-3.5 px-4">Số Hóa Đơn</th>
                  <th className="py-3.5 px-4">Khách Hàng / Đơn Vị</th>
                  <th className="py-3.5 px-4">Loại Hóa Đơn</th>
                  <th className="py-3.5 px-4">Ngày Lập</th>
                  <th className="py-3.5 px-4 text-right">Tổng Tiền</th>
                  <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                  <th className="py-3.5 px-5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredInvoices.map((inv) => {
                  const isSelected = selectedIds.includes(inv.id);
                  return (
                    <tr
                      key={inv.id}
                      className={`transition-colors group ${
                        isSelected ? 'bg-blue-50/70 hover:bg-blue-50' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Checkbox chọn hàng */}
                      <td className="py-4 pl-4 pr-1 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(inv.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                          aria-label={`Chọn hóa đơn ${inv.invoiceNumber}`}
                        />
                      </td>

                      {/* Số Hóa Đơn */}
                      <td className="py-4 px-4">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1"
                      >
                        <span>{inv.invoiceNumber}</span>
                      </Link>
                      {inv.sellerName && (
                        <span className="text-[11px] text-slate-600 truncate block max-w-[160px]">
                          {inv.sellerName}
                        </span>
                      )}
                    </td>

                    {/* Khách Hàng */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-900 line-clamp-1">
                        {inv.buyerName || 'Khách vãng lai'}
                      </div>
                      {inv.buyerCompany ? (
                        <div className="text-[11px] text-slate-600 line-clamp-1">
                          {inv.buyerCompany}
                        </div>
                      ) : inv.buyerPhone ? (
                        <div className="text-[11px] text-slate-600">{inv.buyerPhone}</div>
                      ) : null}
                    </td>

                    {/* Loại HĐ */}
                    <td className="py-4 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {inv.invoiceType ? INVOICE_TYPE_CONFIG[inv.invoiceType as InvoiceType]?.shortLabel || inv.invoiceType : 'HĐ GTGT'}
                      </span>
                    </td>

                    {/* Ngày Lập */}
                    <td className="py-4 px-4 text-slate-600 font-mono text-[11.5px]">
                      {formatVietnamDateTime(inv.issueDate || inv.createdAt)}
                    </td>

                    {/* Tổng Tiền */}
                    <td className="py-4 px-4 text-right">
                      <span className="font-mono tabular-nums font-bold text-slate-900 text-sm">
                        {formatCurrency(inv.grandTotal)}
                      </span>
                    </td>

                    {/* Trạng Thái */}
                    <td className="py-4 px-4 text-center">
                      {getStatusBadge(inv.status)}
                    </td>

                    {/* Thao Tác: Menu 3 chấm */}
                    <td className="py-4 px-5 text-right">
                      <div ref={openMenuRow === inv.id ? menuRef : undefined}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openMenuRow === inv.id) {
                              setOpenMenuRow(null);
                              setMenuPos(null);
                            } else {
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              setMenuPos({
                                top: rect.bottom + 6,
                                right: window.innerWidth - rect.right,
                              });
                              setOpenMenuRow(inv.id);
                            }
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            openMenuRow === inv.id
                              ? 'bg-slate-100 text-slate-800'
                              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                          }`}
                          title="Thao tác"
                          aria-label="Thao tác hóa đơn"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      {openMenuRow === inv.id && menuPos && (
                        <div
                          ref={menuRef}
                          style={{
                            position: 'fixed',
                            top: menuPos.top,
                            right: menuPos.right,
                          }}
                          className="z-[9999] w-52 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 text-left animate-in fade-in zoom-in-95 duration-100"
                        >
                          <Link
                            href={`/invoices/${inv.id}`}
                            onClick={() => { setOpenMenuRow(null); setMenuPos(null); }}
                            className="flex items-center space-x-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>Xem chi tiết</span>
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
                              className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-left cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>Xác nhận đã thanh toán</span>
                            </button>
                          )}
                          <div className="my-1 border-t border-slate-100" />
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa hóa đơn ${inv.invoiceNumber}?`)) {
                                deleteMutation.mutate(inv.id);
                              }
                              setOpenMenuRow(null);
                              setMenuPos(null);
                            }}
                            disabled={deleteMutation.isPending}
                            className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa hóa đơn</span>
                          </button>
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

      {/* Floating Batch Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200 border border-slate-800">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-mono font-bold text-white">
              {selectedIds.length}
            </span>
            <span>Đã chọn {selectedIds.length} hóa đơn</span>
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
    </div>
  );
}
