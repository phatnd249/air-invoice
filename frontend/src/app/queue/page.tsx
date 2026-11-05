'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ApiSummaryItem, QueueJobItem, QueueStats } from '@/components/queue/types';
import { QueueHeader } from '@/components/queue/QueueHeader';
import { QueueStatsCards } from '@/components/queue/QueueStatsCards';
import { QueueApiCards } from '@/components/queue/QueueApiCards';
import { QueueFilters } from '@/components/queue/QueueFilters';
import { QueueTable } from '@/components/queue/QueueTable';
import { QueueBatchBar } from '@/components/queue/QueueBatchBar';
import { QueueDetailModal } from '@/components/queue/QueueDetailModal';

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
  const stats: QueueStats = statsData || { total: 0, pending: 0, processing: 0, completed: 0, failed: 0 };

  // Helper invalidate
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['queue-jobs'] });
    queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    queryClient.invalidateQueries({ queryKey: ['queue-apis'] });
  };

  // Mutations
  const processMutation = useMutation({
    mutationFn: async () => api.post('/queue/process'),
    onSuccess: invalidateAll,
  });

  const retryMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/queue/jobs/${id}/retry`),
    onSuccess: invalidateAll,
    onError: (err: any) => {
      alert('Lỗi thử lại: ' + (err.response?.data?.message || err.message));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/queue/jobs/${id}`),
    onSuccess: invalidateAll,
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => api.post('/queue/jobs/bulk-delete', { ids }),
    onSuccess: (res: any) => {
      invalidateAll();
      setSelectedIds([]);
      alert(`Đã xóa ${res?.data?.count || selectedIds.length} request khỏi hàng chờ!`);
    },
  });

  const clearCompletedMutation = useMutation({
    mutationFn: async () => api.post('/queue/clear-completed'),
    onSuccess: (res: any) => {
      invalidateAll();
      alert(`Đã dọn dẹp ${res?.data?.count || 0} request đã hoàn thành!`);
    },
  });

  const handleRefreshAll = () => {
    refetchStats();
    refetchApis();
    refetchJobs();
  };

  // Selection handlers
  const handleToggleSelectAll = () => {
    const isAll = jobs.length > 0 && jobs.every((j) => selectedIds.includes(j.id));
    setSelectedIds(isAll ? [] : jobs.map((j) => j.id));
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

  const handleDeleteSingle = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa request này khỏi hàng chờ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleClearCompleted = () => {
    if (confirm('Bạn có muốn xóa tất cả các request đã hoàn thành thành công để dọn gọn hàng chờ?')) {
      clearCompletedMutation.mutate();
    }
  };

  const hasFilters = Boolean(
    searchTerm || selectedStatus !== 'ALL' || selectedApi !== 'ALL' || selectedType !== 'ALL'
  );

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* 1. Header Banner */}
      <QueueHeader
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
        onRefreshAll={handleRefreshAll}
        onProcessNow={() => processMutation.mutate()}
        isProcessing={processMutation.isPending}
        onClearCompleted={handleClearCompleted}
        isClearingCompleted={clearCompletedMutation.isPending}
        completedCount={stats.completed}
      />

      {/* 2. KPI Cards */}
      <QueueStatsCards stats={stats} />

      {/* 3. Danh Sách API & Số Request */}
      <QueueApiCards
        apis={apis}
        selectedApi={selectedApi}
        onSelectApi={(apiName) => {
          setSelectedApi(apiName);
          setPage(1);
        }}
      />

      {/* 4. Bộ lọc & Bảng Danh Sách Request */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <QueueFilters
          searchTerm={searchTerm}
          onSearchChange={(val) => {
            setSearchTerm(val);
            setPage(1);
          }}
          selectedApi={selectedApi}
          onSelectApi={(val) => {
            setSelectedApi(val);
            setPage(1);
          }}
          apis={apis}
          selectedStatus={selectedStatus}
          onSelectStatus={(val) => {
            setSelectedStatus(val);
            setPage(1);
          }}
          selectedType={selectedType}
          onSelectType={(val) => {
            setSelectedType(val);
            setPage(1);
          }}
        />

        <QueueTable
          jobs={jobs}
          isLoading={isLoadingJobs}
          totalJobs={jobsData?.total || 0}
          currentPage={page}
          totalPages={jobsData?.totalPages || 1}
          onPageChange={setPage}
          selectedIds={selectedIds}
          onToggleSelectAll={handleToggleSelectAll}
          onToggleSelectRow={handleToggleSelectRow}
          onViewDetail={setDetailJob}
          onRetry={(id) => retryMutation.mutate(id)}
          isRetrying={retryMutation.isPending}
          onDelete={handleDeleteSingle}
          isDeleting={deleteMutation.isPending}
          hasFilters={hasFilters}
        />
      </div>

      {/* Floating Batch Action Bar */}
      <QueueBatchBar
        selectedCount={selectedIds.length}
        onBulkDelete={handleBulkDelete}
        isBulkDeleting={bulkDeleteMutation.isPending}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* Modal Chi Tiết Request */}
      <QueueDetailModal
        job={detailJob}
        onClose={() => setDetailJob(null)}
        onRetry={(id) => retryMutation.mutate(id)}
        isRetrying={retryMutation.isPending}
      />
    </div>
  );
}
