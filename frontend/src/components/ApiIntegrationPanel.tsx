'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  Code2,
  Globe,
  ExternalLink,
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

/**
 * Khối "API & Tích hợp": quản lý API Key + tài liệu endpoint công khai.
 * Trước đây nằm trong tab "Tổng hợp API" của trang Cài đặt.
 */
export function ApiIntegrationPanel() {
  const { toast, confirm } = useToast();

  const [copiedApiItem, setCopiedApiItem] = useState<string | null>(null);

  // State Quản lý API Key (Khóa Truy Cập Hệ Thống)
  const [isCreateKeyModalOpen, setIsCreateKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState<number>(0);
  const [newKeyPermission, setNewKeyPermission] = useState('all');
  const [createdKeyResult, setCreatedKeyResult] = useState<{ name: string; apiKey: string } | null>(null);
  const [isCreatingKey, setIsCreatingKey] = useState(false);

  const { data: apiKeys = [], isLoading: isLoadingKeys, refetch: refetchApiKeys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await api.get('/api-keys');
      return res.data;
    },
  });

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedApiItem(key);
    toast('success', 'Đã sao chép vào bộ nhớ tạm');
    setTimeout(() => setCopiedApiItem(null), 2000);
  };

  // --- XỬ LÝ QUẢN LÝ API KEY ---
  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      toast('warning', 'Thiếu tên API Key', 'Vui lòng nhập tên mô tả cho API Key.');
      return;
    }
    setIsCreatingKey(true);
    try {
      const res = await api.post('/api-keys', {
        name: newKeyName.trim(),
        permissions: newKeyPermission,
        expiresInDays: newKeyExpiry || undefined,
      });
      setCreatedKeyResult(res.data);
      setIsCreateKeyModalOpen(false);
      setNewKeyName('');
      setNewKeyExpiry(0);
      refetchApiKeys();
      toast('success', 'Tạo API Key thành công!', 'Hãy sao chép và lưu trữ mã khóa ngay bây giờ.');
    } catch (err: any) {
      toast('error', 'Lỗi tạo API Key', err.response?.data?.message || err.message);
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleToggleApiKey = async (id: string) => {
    try {
      await api.patch(`/api-keys/${id}/toggle`);
      refetchApiKeys();
      toast('success', 'Đã thay đổi trạng thái API Key');
    } catch (err: any) {
      toast('error', 'Lỗi cập nhật', err.response?.data?.message || err.message);
    }
  };

  const handleDeleteApiKey = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Thu hồi API Key',
      message: `Bạn có chắc chắn muốn thu hồi và xóa vĩnh viễn API Key "${name}"? Các ứng dụng hoặc Landing Page đang sử dụng khóa này sẽ không thể gọi API được nữa.`,
      confirmLabel: 'Thu Hồi Ngay',
      cancelLabel: 'Hủy',
      danger: true,
    });
    if (ok) {
      try {
        await api.delete(`/api-keys/${id}`);
        refetchApiKeys();
        toast('success', 'Đã thu hồi API Key');
      } catch (err: any) {
        toast('error', 'Lỗi thu hồi', err.response?.data?.message || err.message);
      }
    }
  };

  return (
    <>
        <div className="space-y-6">
          {/* Header Overview Card */}
          <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Code2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Tổng Hợp API & Webhook Hệ Thống
                  </h3>
                  <p className="text-sm text-slate-500">
                    Tài liệu dành cho lập trình viên để tích hợp Landing Page, Web App hoặc hệ thống CRM bên ngoài.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>API Sẵn Sàng</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                <div className="font-semibold text-slate-700 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>Backend API Base URL</span>
                </div>
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs text-slate-800">
                  <span className="truncate">https://invoice-backend-5tbi.onrender.com/api</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('https://invoice-backend-5tbi.onrender.com/api', 'base_url')}
                    className="text-blue-600 hover:text-blue-800 font-sans text-xs ml-2 shrink-0 font-medium cursor-pointer"
                  >
                    {copiedApiItem === 'base_url' ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                <div className="font-semibold text-slate-700 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                  <span>Frontend Public Web URL</span>
                </div>
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs text-slate-800">
                  <span className="truncate">https://invoice.share4happy.com</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('https://invoice.share4happy.com', 'web_url')}
                    className="text-blue-600 hover:text-blue-800 font-sans text-xs ml-2 shrink-0 font-medium cursor-pointer"
                  >
                    {copiedApiItem === 'web_url' ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-800 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <span>
                <strong>CORS Policy:</strong> API đang ở chế độ <strong>public</strong> — mọi website (landing page, CRM, n8n...) đều gọi được trực tiếp từ browser. Có thể giới hạn lại bằng biến môi trường <code>CORS_ORIGINS</code> (mặc định <code>*</code>).
              </span>
            </div>
          </section>

          {/* Card: Quản Lý API Key (Khóa Xác Thực Tích Hợp) */}
          <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Khóa Truy Cập API (API Keys)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dùng để xác thực an toàn qua Header <code className="px-1.5 py-0.5 bg-slate-100 rounded font-mono text-slate-800">x-api-key: air_live_...</code> khi tích hợp từ Landing Page, CRM, N8N hoặc phần mềm bán hàng.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateKeyModalOpen(true)}
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo API Key Mới</span>
              </button>
            </div>

            {/* Danh sách API Key */}
            {isLoadingKeys ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Đang tải danh sách API Key...
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                <Key className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">Chưa có API Key nào được tạo</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Tạo khóa API Key để kết nối Landing Page hoặc các hệ thống bên ngoài tự động tạo hóa đơn và gửi Zalo/Email.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateKeyModalOpen(true)}
                  className="mt-2 inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo Khóa Đầu Tiên</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Tên Khóa / Mục Đích</th>
                      <th className="p-3">Mã Khóa (Token)</th>
                      <th className="p-3">Trạng Thái</th>
                      <th className="p-3">Lần Cuối Dùng</th>
                      <th className="p-3">Ngày Tạo / Hết Hạn</th>
                      <th className="p-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {apiKeys.map((k: any) => (
                      <tr key={k.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 font-semibold text-slate-900">
                          <div>{k.name}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            Quyền: {k.permissions === 'all' ? 'Toàn quyền API' : k.permissions}
                          </div>
                        </td>
                        <td className="p-3 font-mono">
                          <div className="inline-flex items-center space-x-1.5 bg-slate-100 px-2 py-1 rounded text-slate-700">
                            <span>{k.prefix}••••••••{k.lastChars}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={k.isActive}
                              onChange={() => handleToggleApiKey(k.id)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                            <span className={`ml-2 text-xs font-semibold ${k.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                              {k.isActive ? 'Đang Bật' : 'Tạm Khóa'}
                            </span>
                          </label>
                        </td>
                        <td className="p-3 text-slate-500">
                          {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString('vi-VN') : 'Chưa sử dụng'}
                        </td>
                        <td className="p-3 text-slate-500">
                          <div>Tạo: {new Date(k.createdAt).toLocaleDateString('vi-VN')}</div>
                          <div className="text-[11px] text-slate-400">
                            {k.expiresAt ? `Hết hạn: ${new Date(k.expiresAt).toLocaleDateString('vi-VN')}` : 'Hiệu lực vĩnh viễn'}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteApiKey(k.id, k.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Thu hồi / Xóa API Key này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Endpoint 1: Quick Create Invoice (Landing Page Webhook) */}
          <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 bg-emerald-600 text-white font-mono font-bold text-xs rounded-lg">POST</span>
                  <span className="font-mono font-bold text-sm sm:text-base text-slate-900">/api/invoices/quick-create</span>
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    Public Webhook
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  <strong>Tạo hóa đơn nhanh từ Landing Page:</strong> Tự động lập số HĐ, tạo mã VietQR thanh toán, và tự động gửi Email / Zalo Bot theo cấu hình thông báo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard('https://invoice-backend-5tbi.onrender.com/api/invoices/quick-create', 'ep_quick_create')}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
              >
                {copiedApiItem === 'ep_quick_create' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedApiItem === 'ep_quick_create' ? 'Đã chép URL' : 'Sao chép URL'}</span>
              </button>
            </div>

            {/* Request Schema Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Các Tham Số Body (JSON Payload)
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Trường</th>
                      <th className="p-2.5">Kiểu</th>
                      <th className="p-2.5">Bắt buộc</th>
                      <th className="p-2.5">Mô tả & Ví dụ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr>
                      <td className="p-2.5 font-mono text-blue-700 font-bold">customerName</td>
                      <td className="p-2.5 font-mono">string</td>
                      <td className="p-2.5 font-bold text-rose-600">Có</td>
                      <td className="p-2.5">Họ tên khách hàng / học viên (VD: "Nguyễn Văn A")</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-blue-700 font-bold">customerPhone</td>
                      <td className="p-2.5 font-mono">string</td>
                      <td className="p-2.5 text-slate-500">Tùy chọn</td>
                      <td className="p-2.5">Số điện thoại để tự động gửi Zalo Bot và kết bạn (VD: "0334551531")</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-blue-700 font-bold">customerEmail</td>
                      <td className="p-2.5 font-mono">string</td>
                      <td className="p-2.5 text-slate-500">Tùy chọn</td>
                      <td className="p-2.5">Email nhận hóa đơn và thông báo thanh toán (VD: "khach@example.com")</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-blue-700 font-bold">amount</td>
                      <td className="p-2.5 font-mono">number</td>
                      <td className="p-2.5 font-bold text-rose-600">Có</td>
                      <td className="p-2.5">Số tiền thanh toán (VD: 500000)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-blue-700 font-bold">description</td>
                      <td className="p-2.5 font-mono">string</td>
                      <td className="p-2.5 font-bold text-rose-600">Có</td>
                      <td className="p-2.5">Tên gói dịch vụ / Khóa học / Nội dung thanh toán</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-blue-700 font-bold">notes</td>
                      <td className="p-2.5 font-mono">string</td>
                      <td className="p-2.5 text-slate-500">Tùy chọn</td>
                      <td className="p-2.5">Ghi chú bổ sung (VD: "Đăng ký từ Landing Page hè")</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Code Examples: JSON & cURL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
                  <span className="text-amber-400 font-bold">// Ví dụ Payload JSON gửi lên:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`{
  "customerName": "Nguyễn Văn A",
  "customerPhone": "0334551531",
  "customerEmail": "khach@example.com",
  "amount": 500000,
  "description": "Khóa học AI Robotic Cơ Bản",
  "notes": "Đăng ký từ landing page"
}`, 'json_payload')}
                    className="hover:text-white flex items-center space-x-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedApiItem === 'json_payload' ? 'Đã chép' : 'Chép JSON'}</span>
                  </button>
                </div>
                <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap">
{`{
  "customerName": "Nguyễn Văn A",
  "customerPhone": "0334551531",
  "customerEmail": "khach@example.com",
  "amount": 500000,
  "description": "Khóa học AI Robotic Cơ Bản",
  "notes": "Đăng ký từ landing page"
}`}
                </pre>
              </div>

              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
                  <span className="text-emerald-400 font-bold">// Kết quả trả về (Response 201 Created):</span>
                </div>
                <pre className="text-emerald-300 overflow-x-auto whitespace-pre-wrap">
{`{
  "success": true,
  "invoice": {
    "invoiceNumber": "HD0001",
    "grandTotal": 500000,
    "shareToken": "e27a6966-...",
    "viewUrl": "https://invoice.share4happy.com/view/e27a6966-...",
    "pdfUrl": "https://invoice-backend-5tbi.onrender.com/api/delivery/public/e27a6966-.../pdf",
    "qrDataUrl": "https://qr.sepay.vn/img?bank=Vietcombank&acc=SHYNNERI&amount=500000&des=HD0001"
  },
  "delivery": {
    "email": { "attempted": true, "success": true },
    "zalo": { "attempted": true, "success": true }
  }
}`}
                </pre>
              </div>
            </div>

            {/* cURL & Code Integration Snippet */}
            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
                <span className="text-blue-400 font-bold">// Ví dụ gọi API bằng cURL (Kèm Header xác thực x-api-key):</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`curl -X POST "https://invoice-backend-5tbi.onrender.com/api/invoices/quick-create" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKeys[0]?.prefix ? apiKeys[0].prefix.replace(/•+/g, 'YOUR_KEY_HERE') : 'air_live_YOUR_KEY_HERE'}" \\
  -d '{
    "customerName": "Nguyễn Văn A",
    "customerPhone": "0334551531",
    "customerEmail": "khach@example.com",
    "amount": 500000,
    "description": "Khóa học AI Robotic Cơ Bản"
  }'`, 'curl_snippet')}
                  className="hover:text-white flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedApiItem === 'curl_snippet' ? 'Đã chép cURL' : 'Chép cURL'}</span>
                </button>
              </div>
              <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`curl -X POST "https://invoice-backend-5tbi.onrender.com/api/invoices/quick-create" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKeys[0]?.prefix ? apiKeys[0].prefix.replace(/•+/g, 'YOUR_KEY_HERE') : 'air_live_YOUR_KEY_HERE'}" \\
  -d '{
    "customerName": "Nguyễn Văn A",
    "customerPhone": "0334551531",
    "customerEmail": "khach@example.com",
    "amount": 500000,
    "description": "Khóa học AI Robotic Cơ Bản"
  }'`}
              </pre>
            </div>
          </section>

          {/* Endpoint 2: Export Public PDF */}
          <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 bg-blue-600 text-white font-mono font-bold text-xs rounded-lg">GET</span>
                  <span className="font-mono font-bold text-sm sm:text-base text-slate-900">/api/delivery/public/:token/pdf</span>
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    Public Direct Stream
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  <strong>Tải trực tiếp file PDF hóa đơn:</strong> Dùng để nhúng link nút "Tải Hóa Đơn PDF" trên Landing Page hoặc gửi cho khách hàng mà không cần đăng nhập.
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard('https://invoice-backend-5tbi.onrender.com/api/delivery/public/{shareToken}/pdf', 'ep_pdf')}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
              >
                {copiedApiItem === 'ep_pdf' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedApiItem === 'ep_pdf' ? 'Đã chép URL' : 'Sao chép URL'}</span>
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 font-mono">
              GET https://invoice-backend-5tbi.onrender.com/api/delivery/public/<strong className="text-blue-700">{'<shareToken>'}</strong>/pdf
            </div>
          </section>

          {/* Endpoint 3: Public Invoice JSON Data */}
          <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 bg-blue-600 text-white font-mono font-bold text-xs rounded-lg">GET</span>
                  <span className="font-mono font-bold text-sm sm:text-base text-slate-900">/api/delivery/public/:token</span>
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    Public JSON
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  <strong>Lấy dữ liệu hóa đơn công khai:</strong> Trả về thông tin chi tiết hóa đơn (trạng thái thanh toán, tổng tiền, mã QR SePay) để Landing Page render trực tiếp trên trang cảm ơn.
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard('https://invoice-backend-5tbi.onrender.com/api/delivery/public/{shareToken}', 'ep_token_data')}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
              >
                {copiedApiItem === 'ep_token_data' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedApiItem === 'ep_token_data' ? 'Đã chép URL' : 'Sao chép URL'}</span>
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 font-mono">
              GET https://invoice-backend-5tbi.onrender.com/api/delivery/public/<strong className="text-blue-700">{'<shareToken>'}</strong>
            </div>
          </section>

          {/* Endpoint 4: Public View Page */}
          <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 bg-purple-600 text-white font-mono font-bold text-xs rounded-lg">WEB</span>
                  <span className="font-mono font-bold text-sm sm:text-base text-slate-900">https://invoice.share4happy.com/view/:token</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  <strong>Trang xem hóa đơn & thanh toán online:</strong> Giao diện hiển thị hóa đơn đẹp mắt chuẩn A4, hiển thị mã VietQR chuyển khoản ngân hàng và cho phép in ấn / lưu trữ trực tiếp.
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard('https://invoice.share4happy.com/view/{shareToken}', 'ep_view_page')}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
              >
                {copiedApiItem === 'ep_view_page' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedApiItem === 'ep_view_page' ? 'Đã chép URL' : 'Sao chép URL'}</span>
              </button>
            </div>
          </section>
        </div>
      {/* MODAL TẠO API KEY MỚI */}
      {isCreateKeyModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateKeyModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Tạo API Key Mới</h3>
                  <p className="text-xs text-slate-500">Cấp khóa truy cập bảo mật cho hệ thống bên ngoài</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateKeyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200 transition-all font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateApiKey} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Gợi Nhớ / Mục Đích Sử Dụng *
                </label>
                <input
                  type="text"
                  required
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="VD: Landing Page Học Viện, Webhook CRM, N8N Automation..."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thời Hạn Hiệu Lực
                </label>
                <select
                  value={newKeyExpiry}
                  onChange={(e) => setNewKeyExpiry(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value={0}>Không bao giờ hết hạn (Khuyến nghị)</option>
                  <option value={30}>30 ngày</option>
                  <option value={90}>90 ngày</option>
                  <option value={365}>1 năm (365 ngày)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phạm Vi Quyền Hạn
                </label>
                <select
                  value={newKeyPermission}
                  onChange={(e) => setNewKeyPermission(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="all">Toàn quyền (Tạo hóa đơn, xem, xuất PDF)</option>
                  <option value="invoices:create">Chỉ tạo hóa đơn nhanh (Landing Page)</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
                <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <span className="leading-relaxed">
                  Sau khi bấm tạo, chuỗi bí mật của API Key sẽ chỉ hiển thị <strong>duy nhất một lần</strong>. Hãy sao chép và lưu trữ cẩn thận.
                </span>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateKeyModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreatingKey}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                >
                  {isCreatingKey ? 'Đang tạo...' : 'Tạo Khóa Ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HIỂN THỊ API KEY VỪA TẠO (CHỈ HIỂN THỊ 1 LẦN) */}
      {createdKeyResult && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setCreatedKeyResult(null);
          }}
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="p-5 border-b border-emerald-100 bg-emerald-50/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Đã Tạo API Key Thành Công!</h3>
                  <p className="text-xs text-slate-500">Khóa cho: <strong>{createdKeyResult.name}</strong></p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start space-x-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                <div className="leading-relaxed">
                  <strong className="font-semibold block text-rose-950 mb-0.5">Lưu ý quan trọng về bảo mật:</strong>
                  Đây là lần duy nhất toàn bộ chuỗi API Key này được hiển thị. Khi bạn đóng cửa sổ này, hệ thống sẽ ẩn vĩnh viễn và chỉ lưu bản băm SHA-256 an toàn.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Chuỗi Khóa API Key (x-api-key)
                </label>
                <div className="flex items-center bg-slate-900 rounded-xl p-3 border border-slate-800 text-slate-100 font-mono text-xs sm:text-sm select-all break-all relative">
                  <span className="text-emerald-400 font-bold mr-2 select-none">KEY:</span>
                  <span className="flex-1 select-all">{createdKeyResult.apiKey}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => copyToClipboard(createdKeyResult.apiKey, 'new_created_key')}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {copiedApiItem === 'new_created_key' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedApiItem === 'new_created_key' ? 'Đã Sao Chép Khóa!' : 'Sao Chép API Key'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreatedKeyResult(null)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Tôi Đã Lưu & Đóng Lại
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
