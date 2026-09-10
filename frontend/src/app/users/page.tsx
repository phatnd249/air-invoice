'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  ShieldCheck,
  User as UserIcon,
  Trash2,
  Pencil,
  Key,
  X,
  Save,
  AlertTriangle,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface UserItem {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  updatedAt: string;
}

interface UserFormData {
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  password?: string;
}

const emptyForm: UserFormData = {
  email: '',
  name: '',
  role: 'USER',
  password: '',
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [formData, setFormData] = useState<UserFormData>(emptyForm);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch danh sách người dùng
  const { data: users = [], isLoading } = useQuery<UserItem[]>({
    queryKey: ['users', search, roleFilter],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      if (roleFilter !== 'ALL') params.role = roleFilter;
      const res = await api.get('/users', { params });
      return res.data;
    },
  });

  // Mutation: Thêm người dùng mới
  const createMutation = useMutation({
    mutationFn: (data: UserFormData) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSuccessMessage('Đã tạo tài khoản người dùng thành công');
      setTimeout(() => setSuccessMessage(null), 4000);
      closeModal();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Không thể tạo người dùng mới';
      setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  // Mutation: Cập nhật người dùng
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserFormData> }) => {
      const payload: any = { ...data };
      if (!payload.password) delete payload.password;
      return api.patch(`/users/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSuccessMessage('Đã cập nhật thông tin người dùng thành công');
      setTimeout(() => setSuccessMessage(null), 4000);
      closeModal();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Không thể cập nhật người dùng';
      setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  // Mutation: Xóa người dùng
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSuccessMessage('Đã xóa người dùng khỏi hệ thống');
      setTimeout(() => setSuccessMessage(null), 4000);
      setDeleteConfirmUser(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Không thể xóa người dùng';
      alert(Array.isArray(msg) ? msg.join(', ') : msg);
      setDeleteConfirmUser(null);
    },
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData(emptyForm);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserItem) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name || '',
      role: user.role,
      password: '',
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData(emptyForm);
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: formData });
    } else {
      if (!formData.password || formData.password.length < 6) {
        setErrorMessage('Mật khẩu bắt buộc có ít nhất 6 ký tự');
        return;
      }
      createMutation.mutate(formData);
    }
  };

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const standardUserCount = totalUsers - adminCount;

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Success Message */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-600 rounded-xl shadow-xs">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản Lý Người Dùng</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Danh sách tài khoản hệ thống, phân quyền và cấp quyền truy cập
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs space-x-2 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm Người Dùng</span>
        </button>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tổng tài khoản</p>
            <p className="text-xl font-bold text-slate-900">{totalUsers}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Quản Trị Viên (Admin)</p>
            <p className="text-xl font-bold text-indigo-600">{adminCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nhân Viên (User)</p>
            <p className="text-xl font-bold text-emerald-600">{standardUserCount}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email người dùng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white shadow-sm transition-all"
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

        <div className="flex bg-slate-200/70 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              roleFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setRoleFilter('ADMIN')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              roleFilter === 'ADMIN'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => setRoleFilter('USER')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              roleFilter === 'USER'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nhân viên
          </button>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 text-base">
            {search ? 'Không tìm thấy người dùng nào' : 'Chưa có người dùng nào'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {search
              ? `Không có tài khoản nào khớp với "${search}"`
              : 'Bắt đầu thêm tài khoản để cấp quyền cho nhân viên'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Người Dùng
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-center px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Vai Trò
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider hidden sm:table-cell">
                    Ngày Tạo
                  </th>
                  <th className="text-center px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider w-28">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((item) => {
                  const isSelf = currentUser?.id === item.id;
                  const initial = item.name ? item.name.charAt(0).toUpperCase() : 'U';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
                            item.role === 'ADMIN'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-600 text-white'
                          }`}>
                            {initial}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-slate-900">
                                {item.name || 'Chưa đặt tên'}
                              </span>
                              {isSelf && (
                                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.2 rounded border border-blue-200">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 sm:hidden">{item.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs font-mono">
                        {item.email}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            item.role === 'ADMIN'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {item.role === 'ADMIN' ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                          )}
                          <span>{item.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên'}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs hidden sm:table-cell">
                        {new Date(item.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            title="Chỉnh sửa thông tin / Đổi mật khẩu"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmUser(item)}
                            disabled={isSelf}
                            className={`p-1.5 rounded-lg transition-all ${
                              isSelf
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                            }`}
                            title={isSelf ? 'Không thể xóa tài khoản của chính bạn' : 'Xóa tài khoản'}
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

          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Hiển thị <strong className="text-slate-700">{users.length}</strong> tài khoản</span>
            <span className="text-slate-400">Nhấn biểu tượng bút chì để chỉnh sửa hoặc đổi mật khẩu</span>
          </div>
        </div>
      )}

      {/* Modal: Thêm / Sửa người dùng */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  {editingUser ? <Pencil className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingUser ? 'Chỉnh Sửa Người Dùng' : 'Thêm Người Dùng Mới'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingUser ? 'Cập nhật thông tin hoặc cấp lại mật khẩu' : 'Tạo tài khoản mới để truy cập hệ thống'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Error Alert */}
            {errorMessage && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm font-medium border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Địa chỉ Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm font-medium border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vai trò phân quyền *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      formData.role === 'ADMIN'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Quản Trị Viên (Admin)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'USER' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      formData.role === 'USER'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <UserIcon className="w-4 h-4 text-blue-600" />
                    <span>Nhân Viên (User)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {editingUser ? 'Đổi mật khẩu mới (bỏ trống nếu giữ nguyên)' : 'Mật khẩu khởi tạo *'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    placeholder={editingUser ? 'Để trống nếu không đổi...' : 'Tối thiểu 6 ký tự'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-600/20 space-x-1.5 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Đang lưu...' : editingUser ? 'Cập Nhật' : 'Tạo Tài Khoản'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Xác nhận Xóa người dùng */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Xác Nhận Xóa Tài Khoản</h3>
            <p className="text-xs text-slate-500 mb-6">
              Bạn có chắc chắn muốn xóa người dùng <strong className="text-slate-800">{deleteConfirmUser.name || deleteConfirmUser.email}</strong>? Hành động này không thể khôi phục.
            </p>

            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirmUser.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa Tài Khoản'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
