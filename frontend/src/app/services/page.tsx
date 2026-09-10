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
} from 'lucide-react';

interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  metaInfo?: string;
  unit: string;
  unitPrice: number;
  createdAt: string;
  updatedAt: string;
}

interface ServiceFormData {
  name: string;
  description: string;
  metaInfo: string;
  unit: string;
  unitPrice: number;
}

const emptyForm: ServiceFormData = {
  name: '',
  description: '',
  metaInfo: '',
  unit: 'gói',
  unitPrice: 0,
};

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch services
  const { data: services = [], isLoading } = useQuery<ServiceItem[]>({
    queryKey: ['services', search],
    queryFn: async () => {
      const res = await api.get('/services', { params: search ? { search } : {} });
      return res.data;
    },
  });

  // Create
  const createMutation = useMutation({
    mutationFn: (data: ServiceFormData) => api.post('/services', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      closeModal();
    },
  });

  // Update
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServiceFormData }) =>
      api.put(`/services/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      closeModal();
    },
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setDeleteConfirmId(null);
    },
  });

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (svc: ServiceItem) => {
    setEditingId(svc.id);
    setFormData({
      name: svc.name,
      description: svc.description || '',
      metaInfo: svc.metaInfo || '',
      unit: svc.unit,
      unitPrice: svc.unitPrice,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-600 rounded-xl shadow-xs">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Danh Mục Dịch Vụ</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản lý bảng giá dịch vụ để chọn nhanh khi lập hóa đơn
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-xs space-x-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Dịch Vụ</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc mô tả dịch vụ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none bg-white shadow-xs transition-all"
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

      {/* Services Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 text-base">
            {search ? 'Không tìm thấy dịch vụ nào' : 'Chưa có dịch vụ nào'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {search
              ? `Không có kết quả phù hợp với "${search}"`
              : 'Bắt đầu thêm dịch vụ để sử dụng khi lập hóa đơn'}
          </p>
          {!search && (
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-500/20 space-x-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Dịch Vụ Đầu Tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Tên Dịch Vụ
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider hidden sm:table-cell">
                    Mô Tả
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider hidden md:table-cell">
                    Thông Tin Bổ Sung
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
                  <tr
                    key={svc.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-slate-900">{svc.name}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs hidden sm:table-cell max-w-[200px] truncate">
                      {svc.description || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs hidden md:table-cell">
                      {svc.metaInfo || '—'}
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
                          onClick={() => openEditModal(svc)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Chỉnh sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {deleteConfirmId === svc.id ? (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => deleteMutation.mutate(svc.id)}
                              disabled={deleteMutation.isPending}
                              className="p-1.5 text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-all text-xs font-bold"
                              title="Xác nhận xóa"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                              title="Hủy"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(svc.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Summary */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Tổng: <strong className="text-slate-700">{services.length}</strong> dịch vụ</span>
            <span className="text-slate-400">Nhấn vào biểu tượng bút chì để chỉnh sửa</span>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingId ? 'Chỉnh Sửa Dịch Vụ' : 'Thêm Dịch Vụ Mới'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingId ? 'Cập nhật thông tin dịch vụ' : 'Điền thông tin để tạo dịch vụ mới trong danh mục'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Dịch Vụ *
                </label>
                <input
                  type="text"
                  placeholder="VD: Hosting WordPress - Gói Doanh Nghiệp"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô Tả Chi Tiết
                </label>
                <input
                  type="text"
                  placeholder="VD: NVMe SSD 20GB, Băng thông không giới hạn"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thông Tin Bổ Sung (Thời hạn, HSD...)
                </label>
                <input
                  type="text"
                  placeholder="VD: 1 Năm (12 Tháng) / 25/06/2026 - 25/06/2027"
                  value={formData.metaInfo}
                  onChange={(e) => setFormData({ ...formData, metaInfo: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đơn Vị Tính
                  </label>
                  <input
                    type="text"
                    placeholder="gói / năm / tháng"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đơn Giá (VNĐ)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    placeholder="660000"
                    value={formData.unitPrice || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, unitPrice: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3.5 py-2 text-sm font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !formData.name.trim()}
                  className="inline-flex items-center px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-500/20 space-x-1.5 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Đang lưu...' : editingId ? 'Cập Nhật' : 'Tạo Mới'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
