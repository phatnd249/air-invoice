'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import AddSubscriptionFromInvoiceModal from '@/components/AddSubscriptionFromInvoiceModal';
import { InvoiceHeader } from '@/components/invoices/InvoiceHeader';
import { InvoiceFilterBar } from '@/components/invoices/InvoiceFilterBar';
import { InvoiceTable } from '@/components/invoices/InvoiceTable';
import { InvoiceBatchBar } from '@/components/invoices/InvoiceBatchBar';
import { BulkPayModal } from '@/components/invoices/BulkPayModal';
import { BulkSubModal } from '@/components/invoices/BulkSubModal';
import {
  SinglePayResultModal,
  BulkPayResultModal,
  BulkSubResultModal,
} from '@/components/invoices/PayResultModals';

export default function InvoicesPage() {
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

  // Modals hiển thị kết quả thông báo
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
    mutationFn: async (id: string) => api.post(`/invoices/${id}/clone`),
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
    mutationFn: async (id: string) => api.delete(`/invoices/${id}`),
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
    mutationFn: async (ids: string[]) => api.post('/invoices/bulk-delete', { ids }),
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
    mutationFn: async (id: string) => api.post(`/invoices/${id}/restore`),
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
    mutationFn: async (ids: string[]) => api.post('/invoices/bulk-restore', { ids }),
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
    mutationFn: async (id: string) => api.delete(`/invoices/${id}/permanent`),
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
    mutationFn: async (ids: string[]) => api.post('/invoices/bulk-permanent-delete', { ids }),
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
    mutationFn: async () => api.post('/invoices/empty-trash'),
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

  // Multi-Select handlers
  const handleToggleSelectAll = () => {
    const isAll =
      filteredInvoices.length > 0 &&
      filteredInvoices.every((inv) => selectedIds.includes(inv.id));
    setSelectedIds(isAll ? [] : filteredInvoices.map((inv) => inv.id));
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

  const handlePermanentDeleteSingle = async (inv: any) => {
    const ok = await confirm({
      title: 'Xóa vĩnh viễn hóa đơn?',
      message: `Bạn có chắc muốn XÓA VĨNH VIỄN hóa đơn ${inv.invoiceNumber} không? Thao tác này không thể hoàn tác!`,
      confirmLabel: 'Xóa vĩnh viễn',
      danger: true,
    });
    if (ok) {
      permanentDeleteMutation.mutate(inv.id);
    }
  };

  const handleSoftDeleteSingle = async (inv: any) => {
    const ok = await confirm({
      title: 'Chuyển vào thùng rác?',
      message: `Bạn có chắc muốn chuyển hóa đơn ${inv.invoiceNumber} vào Thùng rác? Bạn có thể khôi phục lại bất kỳ lúc nào.`,
      confirmLabel: 'Chuyển thùng rác',
    });
    if (ok) {
      deleteMutation.mutate(inv.id);
    }
  };

  const handleEmptyTrash = async () => {
    const ok = await confirm({
      title: 'Dọn sạch thùng rác?',
      message:
        'Bạn có chắc chắn muốn DỌN SẠCH toàn bộ thùng rác không? Tất cả các hóa đơn trong thùng rác sẽ bị xóa vĩnh viễn và không thể khôi phục.',
      confirmLabel: 'Dọn sạch ngay',
      danger: true,
    });
    if (ok) {
      emptyTrashMutation.mutate();
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* 1. Header Toolbar */}
      <InvoiceHeader
        onExportBackup={handleExportBackup}
        onRefresh={() => refetch()}
        isFetching={isFetching}
      />

      {/* 2. Filter Toolbar & Segmented Status Bar */}
      <InvoiceFilterBar
        selectedStatus={selectedStatus}
        onSelectStatus={(status) => {
          setSelectedStatus(status);
          setSelectedIds([]);
        }}
        trashCount={trashCount}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedType={selectedType}
        onSelectType={setSelectedType}
        searchInputRef={searchInputRef}
        isTrashView={isTrashView}
        onEmptyTrash={handleEmptyTrash}
        isEmptyingTrash={emptyTrashMutation.isPending}
      />

      {/* 4. Main Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <InvoiceTable
          invoices={filteredInvoices}
          totalInvoicesCount={invoices.length}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onToggleSelectAll={handleToggleSelectAll}
          onToggleSelectRow={handleToggleSelectRow}
          openMenuRow={openMenuRow}
          setOpenMenuRow={setOpenMenuRow}
          menuPos={menuPos}
          setMenuPos={setMenuPos}
          menuRef={menuRef}
          isTrashView={isTrashView}
          searchTerm={searchTerm}
          selectedStatus={selectedStatus}
          selectedType={selectedType}
          onRestore={(id) => restoreMutation.mutate(id)}
          isRestoring={restoreMutation.isPending}
          onPermanentDelete={handlePermanentDeleteSingle}
          isPermanentDeleting={permanentDeleteMutation.isPending}
          onClone={(id) => cloneMutation.mutate(id)}
          isCloning={cloneMutation.isPending}
          onPay={(id) => payMutation.mutate({ id })}
          isPaying={payMutation.isPending}
          onAddToSubscriptions={(inv) => setSelectedInvoiceForSub(inv)}
          onSoftDelete={handleSoftDeleteSingle}
          isSoftDeleting={deleteMutation.isPending}
        />
      </div>

      {/* 5. Floating Batch Action Bar */}
      <InvoiceBatchBar
        selectedCount={selectedIds.length}
        totalSelectedAmount={totalSelectedAmount}
        unpaidCount={unpaidSelectedInvoices.length}
        isTrashView={isTrashView}
        onBulkRestore={handleBulkRestore}
        isBulkRestoring={bulkRestoreMutation.isPending}
        onBulkDelete={handleBulkDelete}
        isBulkDeleting={
          isTrashView
            ? bulkPermanentDeleteMutation.isPending
            : bulkDeleteMutation.isPending
        }
        onOpenBulkPay={() => {
          setBulkPayNote('Xác nhận thanh toán hàng loạt');
          setIsBulkPayOpen(true);
        }}
        onOpenBulkSub={() => {
          setBulkSubNotes('Thêm từ danh sách hóa đơn đã chọn');
          setIsBulkSubOpen(true);
        }}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* 6. Modal: Thanh Toán Hàng Loạt */}
      <BulkPayModal
        isOpen={isBulkPayOpen}
        onClose={() => setIsBulkPayOpen(false)}
        selectedInvoices={selectedInvoices}
        totalAmount={totalSelectedAmount}
        unpaidCount={unpaidSelectedInvoices.length}
        bulkPayNote={bulkPayNote}
        setBulkPayNote={setBulkPayNote}
        bulkPaySendEmail={bulkPaySendEmail}
        setBulkPaySendEmail={setBulkPaySendEmail}
        bulkPaySendZalo={bulkPaySendZalo}
        setBulkPaySendZalo={setBulkPaySendZalo}
        onSubmit={() =>
          bulkPayMutation.mutate({
            ids: selectedIds,
            note: bulkPayNote,
            sendEmail: bulkPaySendEmail,
            sendZalo: bulkPaySendZalo,
          })
        }
        isSubmitting={bulkPayMutation.isPending}
      />

      {/* 7. Modal: Chuyển Nhanh Thành Khách Hàng */}
      <BulkSubModal
        isOpen={isBulkSubOpen}
        onClose={() => setIsBulkSubOpen(false)}
        selectedInvoices={selectedInvoices}
        bulkSubCycle={bulkSubCycle}
        setBulkSubCycle={setBulkSubCycle}
        bulkSubNotes={bulkSubNotes}
        setBulkSubNotes={setBulkSubNotes}
        onSubmit={() =>
          bulkSubMutation.mutate({
            ids: selectedIds,
            cycle: bulkSubCycle,
            notes: bulkSubNotes,
          })
        }
        isSubmitting={bulkSubMutation.isPending}
      />

      {/* 8. Modals: Thông Báo Kết Quả */}
      <SinglePayResultModal
        result={singlePayResult}
        onClose={() => setSinglePayResult({ isOpen: false })}
        onAddSub={(inv) => setSelectedInvoiceForSub(inv)}
      />

      <BulkPayResultModal
        result={bulkPayResult}
        onClose={() =>
          setBulkPayResult({ isOpen: false, count: 0, totalAmount: 0, message: '' })
        }
      />

      <BulkSubResultModal
        result={bulkSubResult}
        onClose={() =>
          setBulkSubResult({
            isOpen: false,
            count: 0,
            total: 0,
            errorsCount: 0,
            message: '',
          })
        }
      />

      {/* 9. Modal Thêm vào Trang Khách Hàng (Từng đơn) */}
      <AddSubscriptionFromInvoiceModal
        isOpen={!!selectedInvoiceForSub}
        onClose={() => setSelectedInvoiceForSub(null)}
        invoice={selectedInvoiceForSub}
      />
    </div>
  );
}
