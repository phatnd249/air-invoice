'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Plus,
  Trash2,
  Pencil,
  Search,
  Layers,
  X,
  Package,
  Save,
  AlertTriangle,
  Globe,
  GripVertical,
  FolderPlus,
  Folder,
  Check,
  Tag,
  ExternalLink,
  Kanban,
  Table as TableIcon,
} from 'lucide-react';

interface ServiceGroup {
  id: string;
  name: string;
  code?: string;
  website?: string;
  description?: string;
  color?: string;
  sortOrder: number;
  services?: ServiceItem[];
  createdAt: string;
  updatedAt: string;
}

interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  metaInfo?: string;
  unit: string;
  unitPrice: number;
  groupId?: string | null;
  group?: {
    id: string;
    name: string;
    code?: string;
    website?: string;
    color?: string;
  } | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface ServiceFormData {
  name: string;
  description: string;
  metaInfo: string;
  unit: string;
  unitPrice: number;
  groupId: string;
}

interface GroupFormData {
  name: string;
  code: string;
  website: string;
  description: string;
  color: string;
}

const emptyServiceForm: ServiceFormData = {
  name: '',
  description: '',
  metaInfo: '',
  unit: 'gói',
  unitPrice: 0,
  groupId: '',
};

const emptyGroupForm: GroupFormData = {
  name: '',
  code: '',
  website: '',
  description: '',
  color: '#2563eb',
};

const PRESET_COLORS = [
  '#2563eb', // Blue
  '#059669', // Emerald
  '#7c3aed', // Purple
  '#d97706', // Amber
  '#dc2626', // Red
  '#0891b2', // Cyan
  '#4f46e5', // Indigo
  '#db2777', // Pink
];

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Service Modal state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceFormData, setServiceFormData] = useState<ServiceFormData>(emptyServiceForm);
  const [deleteConfirmServiceId, setDeleteConfirmServiceId] = useState<string | null>(null);

  // Group Modal state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupFormData, setGroupFormData] = useState<GroupFormData>(emptyGroupForm);
  const [deleteConfirmGroupId, setDeleteConfirmGroupId] = useState<string | null>(null);

  // Drag and drop state
  const [draggedServiceId, setDraggedServiceId] = useState<string | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
  const [dragToast, setDragToast] = useState<string | null>(null);

  // 1. Fetch Groups
  const { data: groups = [], isLoading: isLoadingGroups } = useQuery<ServiceGroup[]>({
    queryKey: ['service-groups'],
    queryFn: async () => {
      const res = await api.get('/services/groups');
      return res.data;
    },
  });

  // 2. Fetch Services
  const { data: services = [], isLoading: isLoadingServices } = useQuery<ServiceItem[]>({
    queryKey: ['services', search, selectedGroupFilter],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      if (selectedGroupFilter !== 'all') params.groupId = selectedGroupFilter;
      const res = await api.get('/services', { params });
      return res.data;
    },
  });

  // ================= MUTATIONS FOR SERVICES =================

  const createServiceMutation = useMutation({
    mutationFn: (data: ServiceFormData) => api.post('/services', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service-groups'] });
      closeServiceModal();
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServiceFormData }) =>
      api.put(`/services/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service-groups'] });
      closeServiceModal();
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service-groups'] });
      setDeleteConfirmServiceId(null);
    },
  });

  // Assign Group (phục vụ kéo thả)
  const assignGroupMutation = useMutation({
    mutationFn: ({ serviceId, groupId }: { serviceId: string; groupId: string | null }) =>
      api.put(`/services/${serviceId}/assign-group`, { groupId }),
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service-groups'] });
      const targetGroup = groups.find((g) => g.id === vars.groupId);
      showToast(`Đã chuyển gói vào nhóm "${targetGroup ? targetGroup.name : 'Chưa phân nhóm'}"`);
    },
  });

  // ================= MUTATIONS FOR GROUPS =================

  const createGroupMutation = useMutation({
    mutationFn: (data: GroupFormData) => api.post('/services/groups', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-groups'] });
      closeGroupModal();
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: GroupFormData }) =>
      api.put(`/services/groups/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-groups'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      closeGroupModal();
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/services/groups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-groups'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setDeleteConfirmGroupId(null);
    },
  });

  const showToast = (msg: string) => {
    setDragToast(msg);
    setTimeout(() => setDragToast(null), 3000);
  };

  // ================= MODAL HANDLERS =================

  const openCreateServiceModal = (presetGroupId?: string) => {
    setEditingServiceId(null);
    setServiceFormData({
      ...emptyServiceForm,
      groupId: presetGroupId && presetGroupId !== 'unassigned' ? presetGroupId : '',
    });
    setIsServiceModalOpen(true);
  };

  const openEditServiceModal = (svc: ServiceItem) => {
    setEditingServiceId(svc.id);
    setServiceFormData({
      name: svc.name,
      description: svc.description || '',
      metaInfo: svc.metaInfo || '',
      unit: svc.unit,
      unitPrice: svc.unitPrice,
      groupId: svc.groupId || '',
    });
    setIsServiceModalOpen(true);
  };

  const closeServiceModal = () => {
    setIsServiceModalOpen(false);
    setEditingServiceId(null);
    setServiceFormData(emptyServiceForm);
  };

  const openCreateGroupModal = () => {
    setEditingGroupId(null);
    setGroupFormData(emptyGroupForm);
    setIsGroupModalOpen(true);
  };

  const openEditGroupModal = (g: ServiceGroup) => {
    setEditingGroupId(g.id);
    setGroupFormData({
      name: g.name,
      code: g.code || '',
      website: g.website || '',
      description: g.description || '',
      color: g.color || '#2563eb',
    });
    setIsGroupModalOpen(true);
  };

  const closeGroupModal = () => {
    setIsGroupModalOpen(false);
    setEditingGroupId(null);
    setGroupFormData(emptyGroupForm);
  };

  const handleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceFormData.name.trim()) return;
    if (editingServiceId) {
      updateServiceMutation.mutate({ id: editingServiceId, data: serviceFormData });
    } else {
      createServiceMutation.mutate(serviceFormData);
    }
  };

  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupFormData.name.trim()) return;
    if (editingGroupId) {
      updateGroupMutation.mutate({ id: editingGroupId, data: groupFormData });
    } else {
      createGroupMutation.mutate(groupFormData);
    }
  };

  // ================= DRAG & DROP LOGIC =================

  const handleDragStart = (e: React.DragEvent, serviceId: string) => {
    e.dataTransfer.setData('text/plain', serviceId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedServiceId(serviceId);
  };

  const handleDragOver = (e: React.DragEvent, targetGroupId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverGroupId !== targetGroupId) {
      setDragOverGroupId(targetGroupId);
    }
  };

  const handleDragLeave = () => {
    setDragOverGroupId(null);
  };

  const handleDrop = (e: React.DragEvent, targetGroupId: string | null) => {
    e.preventDefault();
    const serviceId = e.dataTransfer.getData('text/plain') || draggedServiceId;
    setDragOverGroupId(null);
    setDraggedServiceId(null);

    if (!serviceId) return;

    const svc = services.find((s) => s.id === serviceId);
    if (!svc) return;

    // Nếu thả vào cùng nhóm hiện tại thì không làm gì
    const currentGroupId = svc.groupId || null;
    if (currentGroupId === targetGroupId) return;

    // Gán nhóm mới
    assignGroupMutation.mutate({ serviceId, groupId: targetGroupId });
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

  // Nhóm dịch vụ theo nhóm gói
  const unassignedServices = services.filter((s) => !s.groupId);
  const servicesByGroup: Record<string, ServiceItem[]> = {};
  groups.forEach((g) => {
    servicesByGroup[g.id] = services.filter((s) => s.groupId === g.id);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast thông báo kéo thả */}
      {dragToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-sm animate-in slide-in-from-bottom duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{dragToast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-600 rounded-xl shadow-xs">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Danh Mục Gói Dịch Vụ</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản lý gói dịch vụ theo từng nhóm website/dự án và hỗ trợ kéo thả tiện lợi
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap">
          {/* Switch View Mode */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem theo nhóm & Kéo thả (Kanban)"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Theo Nhóm</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem bảng chi tiết"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Bảng Giá</span>
            </button>
          </div>

          {/* Thêm Nhóm Gói Mới */}
          <button
            onClick={openCreateGroupModal}
            className="inline-flex items-center px-3.5 py-2 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white text-xs font-semibold rounded-xl shadow-xs space-x-1.5 transition-all"
          >
            <FolderPlus className="w-3.5 h-3.5 text-blue-400" />
            <span>+ Nhóm Gói (Web)</span>
          </button>

          {/* Thêm Gói Dịch Vụ */}
          <button
            onClick={() => openCreateServiceModal()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Gói Dịch Vụ</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên gói, mô tả, thông tin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none bg-white shadow-xs transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Group Filter Tabs (khi xem dạng bảng) */}
        {viewMode === 'table' && (
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedGroupFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                selectedGroupFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Tất cả ({services.length})
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGroupFilter(g.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                  selectedGroupFilter === g.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: g.color || '#2563eb' }}
                />
                <span>{g.name}</span>
                <span className="text-[10px] opacity-75">
                  ({services.filter((s) => s.groupId === g.id).length})
                </span>
              </button>
            ))}
            <button
              onClick={() => setSelectedGroupFilter('unassigned')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                selectedGroupFilter === 'unassigned'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Chưa nhóm ({unassignedServices.length})
            </button>
          </div>
        )}
      </div>

      {/* VIEW MODE 1: KANBAN COLUMNS (DRAG AND DROP) */}
      {viewMode === 'kanban' && (
        <div className="space-y-4">
          <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-blue-800">
            <div className="flex items-center space-x-2">
              <span className="text-base">💡</span>
              <span>
                <strong>Kéo &amp; Thả:</strong> Bạn có thể giữ và kéo thẻ gói dịch vụ từ nhóm này thả vào nhóm khác để gán nhanh cho từng website!
              </span>
            </div>
            <span className="text-[11px] font-medium text-blue-600 hidden md:inline">
              Tự động lưu tức thì
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
            {/* Cột từng Nhóm đã cấu hình */}
            {groups.map((group) => {
              const groupServices = servicesByGroup[group.id] || [];
              const isDragOver = dragOverGroupId === group.id;

              return (
                <div
                  key={group.id}
                  onDragOver={(e) => handleDragOver(e, group.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, group.id)}
                  className={`bg-slate-50/80 rounded-2xl border-2 transition-all duration-200 flex flex-col min-h-[380px] overflow-hidden ${
                    isDragOver
                      ? 'border-blue-500 bg-blue-50/50 ring-4 ring-blue-500/10 scale-[1.01]'
                      : 'border-slate-200 shadow-xs'
                  }`}
                >
                  {/* Group Header */}
                  <div
                    className="p-4 border-b border-slate-200 bg-white"
                    style={{ borderTop: `4px solid ${group.color || '#2563eb'}` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: group.color || '#2563eb' }}
                        />
                        <h3 className="font-bold text-slate-900 text-sm truncate" title={group.name}>
                          {group.name}
                        </h3>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => openEditGroupModal(group)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Sửa nhóm"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {deleteConfirmGroupId === group.id ? (
                          <div className="flex items-center space-x-0.5">
                            <button
                              onClick={() => deleteGroupMutation.mutate(group.id)}
                              className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold"
                              title="Xác nhận xóa nhóm"
                            >
                              Xóa
                            </button>
                            <button
                              onClick={() => setDeleteConfirmGroupId(null)}
                              className="p-1 text-slate-400 hover:text-slate-600"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmGroupId(group.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Xóa nhóm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Website Domain Link */}
                    {group.website ? (
                      <div className="mt-1.5 flex items-center space-x-1 text-xs text-slate-500">
                        <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                        <a
                          href={group.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline truncate"
                        >
                          {group.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-1 truncate">
                        {group.description || 'Chưa gán website quản lý'}
                      </p>
                    )}

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <span>
                        Số gói: <strong className="text-slate-800">{groupServices.length}</strong>
                      </span>
                      <button
                        onClick={() => openCreateServiceModal(group.id)}
                        className="text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1 hover:underline cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Thêm gói vào nhóm</span>
                      </button>
                    </div>
                  </div>

                  {/* Group Services List (Cards) */}
                  <div className="p-3 space-y-2.5 flex-1 overflow-y-auto max-h-[550px]">
                    {groupServices.length === 0 ? (
                      <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center text-slate-400 text-xs">
                        <Package className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-60" />
                        <p>Kéo gói dịch vụ và thả vào đây</p>
                        <button
                          onClick={() => openCreateServiceModal(group.id)}
                          className="mt-2 text-blue-600 text-xs font-semibold hover:underline"
                        >
                          + Tạo gói mới cho nhóm này
                        </button>
                      </div>
                    ) : (
                      groupServices.map((svc) => (
                        <div
                          key={svc.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, svc.id)}
                          className={`bg-white rounded-xl p-3 border transition-all cursor-grab active:cursor-grabbing hover:shadow-md ${
                            draggedServiceId === svc.id
                              ? 'opacity-40 border-blue-400 shadow-lg scale-95'
                              : 'border-slate-200/90 shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start space-x-2 min-w-0">
                              <GripVertical className="w-4 h-4 text-slate-400 mt-0.5 shrink-0 opacity-60 hover:opacity-100" />
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                                  {svc.name}
                                </h4>
                                {svc.description && (
                                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                                    {svc.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                onClick={() => openEditServiceModal(svc)}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                title="Sửa"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteServiceMutation.mutate(svc.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              {formatCurrency(svc.unitPrice)}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              /{svc.unit} {svc.metaInfo ? `• ${svc.metaInfo}` : ''}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}

            {/* Cột các gói "Chưa Phân Nhóm" */}
            <div
              onDragOver={(e) => handleDragOver(e, null)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, null)}
              className={`bg-slate-50/80 rounded-2xl border-2 transition-all duration-200 flex flex-col min-h-[380px] overflow-hidden ${
                dragOverGroupId === null && draggedServiceId
                  ? 'border-amber-500 bg-amber-50/50 ring-4 ring-amber-500/10 scale-[1.01]'
                  : 'border-dashed border-slate-300'
              }`}
            >
              <div className="p-4 border-b border-slate-200 bg-white border-t-4 border-t-amber-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <h3 className="font-bold text-slate-800 text-sm">Gói Chưa Phân Nhóm</h3>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {unassignedServices.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Kéo thả vào các nhóm website bên cạnh để quản lý
                </p>
              </div>

              <div className="p-3 space-y-2.5 flex-1 overflow-y-auto max-h-[550px]">
                {unassignedServices.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    <Check className="w-7 h-7 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p>Tất cả gói dịch vụ đã được phân vào các nhóm website!</p>
                  </div>
                ) : (
                  unassignedServices.map((svc) => (
                    <div
                      key={svc.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, svc.id)}
                      className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs cursor-grab active:cursor-grabbing hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start space-x-2 min-w-0">
                          <GripVertical className="w-4 h-4 text-slate-400 mt-0.5 shrink-0 opacity-60 hover:opacity-100" />
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{svc.name}</h4>
                            {svc.description && (
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                                {svc.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={() => openEditServiceModal(svc)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {formatCurrency(svc.unitPrice)}
                        </span>
                        <span className="text-[11px] text-slate-500">/{svc.unit}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Tên Gói Dịch Vụ
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Nhóm Website
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider hidden sm:table-cell">
                    Mô Tả &amp; Thời Hạn
                  </th>
                  <th className="text-center px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Đơn Vị
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Đơn Giá
                  </th>
                  <th className="text-center px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider w-28">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services.map((svc) => (
                  <tr key={svc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-slate-900 block">{svc.name}</span>
                      {svc.metaInfo && (
                        <span className="text-[11px] text-slate-500 block">{svc.metaInfo}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {svc.group ? (
                        <span
                          className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: `${svc.group.color || '#2563eb'}15`,
                            color: svc.group.color || '#2563eb',
                            border: `1px solid ${svc.group.color || '#2563eb'}30`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: svc.group.color || '#2563eb' }}
                          />
                          <span>{svc.group.name}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Chưa nhóm</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs hidden sm:table-cell max-w-[260px] truncate">
                      {svc.description || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-md border border-blue-200">
                        {svc.unit}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(svc.unitPrice)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => openEditServiceModal(svc)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Chỉnh sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteServiceMutation.mutate(svc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Tổng số gói: <strong className="text-slate-800">{services.length}</strong>
            </span>
            <span className="text-slate-400">
              Có thể chuyển sang chế độ &quot;Theo Nhóm&quot; để kéo thả gói dịch vụ dễ dàng
            </span>
          </div>
        </div>
      )}

      {/* ================= MODAL TẠO / SỬA GÓI DỊCH VỤ ================= */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingServiceId ? 'Chỉnh Sửa Gói Dịch Vụ' : 'Thêm Gói Dịch Vụ Mới'}
              </h3>
              <button
                onClick={closeServiceModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleServiceSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tên Gói Dịch Vụ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Gói AI WRITER - 1 Năm Bản Quyền"
                  value={serviceFormData.name}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Thuộc Nhóm Website / Dự Án
                </label>
                <select
                  value={serviceFormData.groupId}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, groupId: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none bg-white"
                >
                  <option value="">-- Chưa phân nhóm (Dùng chung) --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} {g.website ? `(${g.website})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Giúp phân định rõ web nào đang bán gói nào để gửi tin nhắn và áp dụng mẫu chính xác.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Đơn Giá (VND) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={serviceFormData.unitPrice}
                    onChange={(e) =>
                      setServiceFormData({ ...serviceFormData, unitPrice: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Đơn Vị Tính
                  </label>
                  <input
                    type="text"
                    placeholder="gói, tháng, năm..."
                    value={serviceFormData.unit}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, unit: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Thông Tin Bổ Sung / Thời Hạn
                </label>
                <input
                  type="text"
                  placeholder="VD: Thời hạn: 1 Năm (12 Tháng) • Không giới hạn token"
                  value={serviceFormData.metaInfo}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, metaInfo: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mô Tả Chi Tiết Gói
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả quyền lợi gói, tính năng hỗ trợ..."
                  value={serviceFormData.description}
                  onChange={(e) =>
                    setServiceFormData({ ...serviceFormData, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeServiceModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingServiceId ? 'Lưu Thay Đổi' : 'Tạo Gói Dịch Vụ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TẠO / SỬA NHÓM GÓI (SERVICE GROUP) ================= */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Folder className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-lg">
                  {editingGroupId ? 'Chỉnh Sửa Nhóm Gói' : 'Thêm Nhóm Gói (Website) Mới'}
                </h3>
              </div>
              <button
                onClick={closeGroupModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGroupSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tên Nhóm / Tên Website *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: AI Writer - Nền Tảng Viết Bài"
                  value={groupFormData.name}
                  onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Website / Domain Quản Lý
                </label>
                <input
                  type="text"
                  placeholder="https://aiwriter.ntcore.io.vn"
                  value={groupFormData.website}
                  onChange={(e) => setGroupFormData({ ...groupFormData, website: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Màu Sắc Nhận Diện
                </label>
                <div className="flex items-center space-x-2 mt-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setGroupFormData({ ...groupFormData, color: c })}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        groupFormData.color === c
                          ? 'ring-2 ring-offset-2 ring-slate-800 scale-110 shadow-xs'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {groupFormData.color === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mô Tả Nhóm
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm về mục đích nhóm gói..."
                  value={groupFormData.description}
                  onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeGroupModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={createGroupMutation.isPending || updateGroupMutation.isPending}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingGroupId ? 'Lưu Thay Đổi' : 'Tạo Nhóm Gói'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
