'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  X,
  Palette,
  Type,
  Layout,
  QrCode,
  FileSignature,
  Save,
  Check,
  Eye,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import InvoiceTemplateRenderer, {
  InvoiceDesignTemplate,
} from './InvoiceTemplateRenderer';

interface InvoiceDesignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTemplate?: InvoiceDesignTemplate | null;
  onSaved?: (tpl: InvoiceDesignTemplate) => void;
}

const PRESET_COLORS = [
  { name: 'Xanh Doanh Nghiệp', hex: '#1e3a8a' },
  { name: 'Đen Slate Tối Giản', hex: '#0f172a' },
  { name: 'Xanh Lục Bảo AI', hex: '#059669' },
  { name: 'Đỏ Rượu Burgundy', hex: '#831843' },
  { name: 'Tím Công Nghệ', hex: '#4f46e5' },
  { name: 'Xanh Mòng Két Teal', hex: '#0d9488' },
  { name: 'Hổ Phách Sang Trọng', hex: '#d97706' },
  { name: 'Xám Đậm Charcoal', hex: '#334155' },
];

const PRESET_HEADER_BGS = [
  { name: 'Xám Trắng Nhẹ', hex: '#f8fafc' },
  { name: 'Trắng Tinh', hex: '#ffffff' },
  { name: 'Xám Nhạt Bạc', hex: '#f1f5f9' },
  { name: 'Xanh Pastel Dịu', hex: '#eff6ff' },
];

const SAMPLE_INVOICE_DATA = {
  invoiceNumber: 'HD-2026-00088',
  issueDate: new Date().toISOString(),
  dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
  status: 'ISSUED',
  invoiceType: 'GTGT',
  sellerName: 'CÔNG TY TNHH GIÁO DỤC AI ROBOTIC',
  sellerTaxCode: '0317899668',
  sellerAddress: 'Tầng 12, Tòa nhà AI Innovation, 180 Nguyễn Thị Minh Khai, Q.3, TP.HCM',
  sellerPhone: '0976600395',
  sellerEmail: 'billing@airobotics.vn',
  buyerName: 'Nguyễn Thành Đạt',
  buyerCompany: 'Công ty Cổ phần Giải pháp Số Thành Đạt',
  buyerTaxCode: '0315894123',
  buyerAddress: '124 Điện Biên Phủ, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh',
  buyerEmail: 'thanhdat@thanhdattax.com',
  buyerPhone: '0976600395',
  hasVat: true,
  vatRate: 10,
  subTotal: 1450000,
  vatAmount: 145000,
  grandTotal: 1595000,
  paymentCode: 'AI89K2',
  qrDataUrl:
    'https://qr.sepay.vn/img?bank=Vietcombank&acc=SHYNNERI&template=compact&amount=1595000&des=AI89K2%20AI%20Writer',
  bankCode: 'Vietcombank',
  bankAccount: 'SHYNNERI',
  bankAccountName: 'AI ROBOTIC',
  notes: 'Hóa đơn điện tử có giá trị pháp lý, được khởi tạo tự động bởi hệ thống AI.',
  items: [
    {
      id: '1',
      name: 'Gói AI WRITER PRO - Bản Quyền 1 Năm',
      description: 'Công cụ sáng tạo nội dung AI chuyên sâu, tự động viết bài SEO & WordPress',
      metaInfo: 'Chu kỳ kích hoạt: 01/07/2026 - 01/07/2027',
      unit: 'gói',
      quantity: 1,
      unitPrice: 1450000,
      amount: 1450000,
    },
  ],
};

const DEFAULT_FORM: InvoiceDesignTemplate = {
  name: 'Mẫu Thiết Kế Mới',
  code: '',
  description: 'Mẫu hóa đơn được tùy chỉnh riêng theo nhu cầu thương hiệu.',
  primaryColor: '#1e3a8a',
  headerBgColor: '#f8fafc',
  textColor: '#1e293b',
  fontFamily: 'serif',
  fontSize: 'medium',
  customTitle: '',
  subtitle: '',
  showTaxCodeBadge: false,
  slogan: '',
  showSellerInfo: false,
  showBuyerInfo: true,
  showBuyerCompany: true,
  showBuyerAddress: true,
  showBuyerPhone: true,
  showBuyerEmail: true,
  showDueDate: true,
  showServiceUnit: true,
  showMetaInfo: true,
  showTotalInWords: true,
  showQrCode: true,
  showBankInfo: true,
  qrLayout: 'side-by-side',
  showSignatures: false,
  customerSignTitle: 'ĐẠI DIỆN KHÁCH HÀNG',
  customerSignSub: '(Ký và ghi rõ họ tên)',
  sellerSignTitle: 'NGƯỜI LẬP HÓA ĐƠN',
  sellerSignSub: '(Ký và ghi rõ họ tên)',
  footerNote: '',
  isDefault: false,
  isActive: true,
};

export default function InvoiceDesignerModal({
  isOpen,
  onClose,
  initialTemplate,
  onSaved,
}: InvoiceDesignerModalProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'style' | 'content' | 'sections' | 'payment' | 'signatures'>('style');
  const [form, setForm] = useState<InvoiceDesignTemplate>(DEFAULT_FORM);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (initialTemplate) {
      setForm({
        ...DEFAULT_FORM,
        ...initialTemplate,
      });
    } else {
      setForm({
        ...DEFAULT_FORM,
        name: `Mẫu Thiết Kế Tùy Chỉnh (${new Date().toLocaleDateString('vi-VN')})`,
      });
    }
  }, [initialTemplate, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async (data: InvoiceDesignTemplate) => {
      if (initialTemplate?.id) {
        const res = await api.put(`/invoice-templates/${initialTemplate.id}`, data);
        return res.data;
      } else {
        const res = await api.post('/invoice-templates', data);
        return res.data;
      }
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['invoice-templates'] });
      if (onSaved) onSaved(saved);
      onClose();
    },
    onError: (err: any) => {
      alert('Không thể lưu mẫu thiết kế: ' + (err.response?.data?.message || err.message));
    },
  });

  if (!isOpen) return null;

  const updateField = (key: keyof InvoiceDesignTemplate, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!form.name?.trim()) {
      alert('Vui lòng nhập tên mẫu thiết kế');
      return;
    }
    saveMutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl flex flex-col w-full transition-all duration-300 border border-slate-200 overflow-hidden ${
          isFullScreen ? 'h-[98vh] max-w-[98vw]' : 'h-[92vh] max-w-7xl'
        }`}
      >
        {/* === TOP BAR === */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {initialTemplate?.id ? 'Chỉnh Sửa Thiết Kế Mẫu Hóa Đơn' : 'Thiết Kế Mẫu Hóa Đơn Trực Quan'}
              </h2>
              <p className="text-xs text-slate-400">
                Tự do tùy chỉnh màu sắc, phông chữ, ẩn/hiện chữ ký và phụ đề thuế theo ý muốn
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title={isFullScreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* === MAIN CONTENT (SPLIT SCREEN) === */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* LEFT PANEL: CONTROLS */}
          <div className="w-full lg:w-[460px] xl:w-[500px] border-r border-slate-200 flex flex-col bg-slate-50/70 flex-shrink-0 overflow-hidden">
            {/* Template Basic Info */}
            <div className="p-4 bg-white border-b border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tên Mẫu Thiết Kế <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="VD: Mẫu Doanh Nghiệp Navy, Mẫu Tối Giản..."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all font-medium text-slate-900"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={form.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Ghi chú ngắn về mục đích sử dụng mẫu này..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-600"
                />
              </div>
            </div>

            {/* Design Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-2 overflow-x-auto text-xs font-semibold scrollbar-none">
              <button
                onClick={() => setActiveTab('style')}
                className={`py-3 px-3 border-b-2 flex items-center space-x-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'style'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Màu Sắc & Phông</span>
              </button>

              <button
                onClick={() => setActiveTab('content')}
                className={`py-3 px-3 border-b-2 flex items-center space-x-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'content'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Tiêu Đề & Phụ Đề</span>
              </button>

              <button
                onClick={() => setActiveTab('sections')}
                className={`py-3 px-3 border-b-2 flex items-center space-x-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'sections'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layout className="w-3.5 h-3.5" />
                <span>Ẩn / Hiện Khối</span>
              </button>

              <button
                onClick={() => setActiveTab('payment')}
                className={`py-3 px-3 border-b-2 flex items-center space-x-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'payment'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Bố Cục QR</span>
              </button>

              <button
                onClick={() => setActiveTab('signatures')}
                className={`py-3 px-3 border-b-2 flex items-center space-x-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'signatures'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileSignature className="w-3.5 h-3.5" />
                <span>Chữ Ký & Đuôi</span>
              </button>
            </div>

            {/* TAB CONTENT (SCROLLABLE CONTROLS) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* TAB 1: STYLE */}
              {activeTab === 'style' && (
                <div className="space-y-6">
                  {/* Primary Color */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Màu Chủ Đạo (Thương Hiệu & Tiêu Đề)
                    </label>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => updateField('primaryColor', c.hex)}
                          className={`flex items-center space-x-1.5 p-2 rounded-xl border text-xs font-medium transition-all ${
                            form.primaryColor?.toLowerCase() === c.hex.toLowerCase()
                              ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/50'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full flex-shrink-0 shadow-xs"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="truncate text-[11px] text-slate-700">{c.name.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center space-x-3 bg-white p-2.5 rounded-xl border border-slate-200">
                      <input
                        type="color"
                        value={form.primaryColor || '#1e3a8a'}
                        onChange={(e) => updateField('primaryColor', e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={form.primaryColor || '#1e3a8a'}
                        onChange={(e) => updateField('primaryColor', e.target.value)}
                        className="flex-1 font-mono text-xs uppercase px-2 py-1 border border-slate-200 rounded-md"
                        placeholder="#1E3A8A"
                      />
                      <span className="text-xs text-slate-400">Mã HEX</span>
                    </div>
                  </div>

                  {/* Header Background */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Màu Nền Tiêu Đề Bảng Hàng Hóa
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {PRESET_HEADER_BGS.map((bg) => (
                        <button
                          key={bg.hex}
                          type="button"
                          onClick={() => updateField('headerBgColor', bg.hex)}
                          className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs transition-all ${
                            form.headerBgColor?.toLowerCase() === bg.hex.toLowerCase()
                              ? 'border-blue-600 ring-2 ring-blue-600/20 bg-white font-bold'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-md border border-slate-300 flex-shrink-0"
                            style={{ backgroundColor: bg.hex }}
                          />
                          <span className="text-slate-700 text-xs">{bg.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Family */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Phông Chữ Hóa Đơn
                    </label>
                    <div className="space-y-2">
                      <label
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          form.fontFamily === 'serif'
                            ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="fontFamily"
                            checked={form.fontFamily === 'serif'}
                            onChange={() => updateField('fontFamily', 'serif')}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-serif font-bold text-slate-900 text-sm">Times New Roman (Serif)</div>
                            <div className="text-xs text-slate-500">Trang trọng, chuẩn mực văn bản tài chính doanh nghiệp</div>
                          </div>
                        </div>
                      </label>

                      <label
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          form.fontFamily === 'sans'
                            ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="fontFamily"
                            checked={form.fontFamily === 'sans'}
                            onChange={() => updateField('fontFamily', 'sans')}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-sans font-bold text-slate-900 text-sm">Inter / Roboto (Sans-serif)</div>
                            <div className="text-xs text-slate-500">Tối giản, hiện đại, thích hợp cho công nghệ & dịch vụ số</div>
                          </div>
                        </div>
                      </label>

                      <label
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          form.fontFamily === 'mono'
                            ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="fontFamily"
                            checked={form.fontFamily === 'mono'}
                            onChange={() => updateField('fontFamily', 'mono')}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-mono font-bold text-slate-900 text-sm">Courier New (Monospace)</div>
                            <div className="text-xs text-slate-500">Phong cách biên lai máy tính, sắc nét kỹ thuật</div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CONTENT */}
              {activeTab === 'content' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Tiêu Đề Hóa Đơn Tùy Chỉnh
                    </label>
                    <input
                      type="text"
                      value={form.customTitle || ''}
                      onChange={(e) => updateField('customTitle', e.target.value)}
                      placeholder="Mặc định: HÓA ĐƠN GIÁ TRỊ GIA TĂNG (hoặc gõ riêng)"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Để trống để tự động hiển thị theo loại hóa đơn (GTGT, Bán hàng, Tài sản công).
                    </p>
                  </div>

                  {/* Subtitle & Tax code badge toggle (Addressing User Image 2) */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Phụ Đề Thuế &quot;(Có mã của cơ quan thuế)&quot;
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Bật hoặc tắt dòng chữ phụ đề thuế bên dưới tiêu đề
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.showTaxCodeBadge}
                          onChange={(e) => {
                            updateField('showTaxCodeBadge', e.target.checked);
                            if (e.target.checked && !form.subtitle) {
                              updateField('subtitle', '(Có mã của cơ quan thuế)');
                            }
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Nội dung dòng phụ đề
                      </label>
                      <input
                        type="text"
                        value={form.subtitle || ''}
                        onChange={(e) => updateField('subtitle', e.target.value)}
                        placeholder="VD: (Có mã của cơ quan thuế) hoặc (Bản thể hiện điện tử)"
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Khẩu Hiệu / Slogan Thương Hiệu
                    </label>
                    <input
                      type="text"
                      value={form.slogan || ''}
                      onChange={(e) => updateField('slogan', e.target.value)}
                      placeholder="VD: Giải pháp công nghệ dẫn đầu cho tương lai"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: SECTIONS TOGGLE */}
              {activeTab === 'sections' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 divide-y divide-slate-100">
                    <div className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-900 block">Hiện Thông Tin Người Bán Đầu Trang</span>
                        <span className="text-[11px] text-slate-500">Tên công ty, MST, địa chỉ, logo ở góc trên</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.showSellerInfo}
                        onChange={(e) => updateField('showSellerInfo', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded-sm"
                      />
                    </div>

                    <div className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-900 block">Khối Thông Tin Người Mua</span>
                        <span className="text-[11px] text-slate-500">Họ tên, đơn vị, MST, địa chỉ khách</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.showBuyerInfo}
                        onChange={(e) => updateField('showBuyerInfo', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded-sm"
                      />
                    </div>

                    <div className="py-2.5 flex items-center justify-between pl-4">
                      <span className="text-xs text-slate-700">Tên công ty / Đơn vị người mua</span>
                      <input
                        type="checkbox"
                        checked={form.showBuyerCompany}
                        onChange={(e) => updateField('showBuyerCompany', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded-sm"
                      />
                    </div>

                    <div className="py-2.5 flex items-center justify-between pl-4">
                      <span className="text-xs text-slate-700">Địa chỉ người mua</span>
                      <input
                        type="checkbox"
                        checked={form.showBuyerAddress}
                        onChange={(e) => updateField('showBuyerAddress', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded-sm"
                      />
                    </div>

                    <div className="py-2.5 flex items-center justify-between pl-4">
                      <span className="text-xs text-slate-700">Số điện thoại người mua</span>
                      <input
                        type="checkbox"
                        checked={form.showBuyerPhone}
                        onChange={(e) => updateField('showBuyerPhone', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded-sm"
                      />
                    </div>

                    <div className="py-2.5 flex items-center justify-between pl-4">
                      <span className="text-xs text-slate-700">Email người mua</span>
                      <input
                        type="checkbox"
                        checked={form.showBuyerEmail}
                        onChange={(e) => updateField('showBuyerEmail', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded-sm"
                      />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 divide-y divide-slate-100">
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900">Hiện Hạn Thanh Toán (Hạn TT)</span>
                      <input
                        type="checkbox"
                        checked={form.showDueDate}
                        onChange={(e) => updateField('showDueDate', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded-sm"
                      />
                    </div>

                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900">Hiện Cột Đơn Vị Tính (ĐVT)</span>
                      <input
                        type="checkbox"
                        checked={form.showServiceUnit}
                        onChange={(e) => updateField('showServiceUnit', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded-sm"
                      />
                    </div>

                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900">Hiện Dòng Chu Kỳ / Thông Tin Bổ Trợ (metaInfo)</span>
                      <input
                        type="checkbox"
                        checked={form.showMetaInfo}
                        onChange={(e) => updateField('showMetaInfo', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded-sm"
                      />
                    </div>

                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900">Hiện Dòng &quot;Số tiền bằng chữ&quot;</span>
                      <input
                        type="checkbox"
                        checked={form.showTotalInWords}
                        onChange={(e) => updateField('showTotalInWords', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PAYMENT */}
              {activeTab === 'payment' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900">Hiện Mã QR Thanh Toán (VietQR)</span>
                      <input
                        type="checkbox"
                        checked={form.showQrCode}
                        onChange={(e) => updateField('showQrCode', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded-sm"
                      />
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="text-xs font-semibold text-slate-900">Hiện Thông Tin Chuyển Khoản Ngân Hàng</span>
                      <input
                        type="checkbox"
                        checked={form.showBankInfo}
                        onChange={(e) => updateField('showBankInfo', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Bố Cục Hiển Thị QR & Tài Khoản
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => updateField('qrLayout', 'side-by-side')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          form.qrLayout === 'side-by-side'
                            ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/30 font-bold'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="text-xs text-slate-900 font-semibold mb-1">Cạnh Nhau (Mặc Định)</div>
                        <div className="text-[11px] text-slate-500 leading-tight">Mã QR bên trái, thông tin STK ngân hàng bên phải</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateField('qrLayout', 'stacked')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          form.qrLayout === 'stacked'
                            ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/30 font-bold'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="text-xs text-slate-900 font-semibold mb-1">Xếp Tầng (Dọc)</div>
                        <div className="text-[11px] text-slate-500 leading-tight">Mã QR căn giữa ở trên, thông tin STK căn đều ở dưới</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: SIGNATURES & FOOTER NOTE (Directly addresses User Images 1 & 2) */}
              {activeTab === 'signatures' && (
                <div className="space-y-5">
                  {/* Signature Toggle */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Bật / Tắt Khối Chữ Ký Đuôi Hóa Đơn
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Hiện hoặc ẩn khối chữ ký &quot;Đại diện khách hàng / Người lập hóa đơn&quot;
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.showSignatures}
                          onChange={(e) => updateField('showSignatures', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {form.showSignatures && (
                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              Tiêu đề bên trái
                            </label>
                            <input
                              type="text"
                              value={form.customerSignTitle || ''}
                              onChange={(e) => updateField('customerSignTitle', e.target.value)}
                              placeholder="ĐẠI DIỆN KHÁCH HÀNG"
                              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              Dòng phụ bên trái
                            </label>
                            <input
                              type="text"
                              value={form.customerSignSub || ''}
                              onChange={(e) => updateField('customerSignSub', e.target.value)}
                              placeholder="(Ký và ghi rõ họ tên)"
                              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              Tiêu đề bên phải
                            </label>
                            <input
                              type="text"
                              value={form.sellerSignTitle || ''}
                              onChange={(e) => updateField('sellerSignTitle', e.target.value)}
                              placeholder="NGƯỜI LẬP HÓA ĐƠN"
                              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              Dòng phụ bên phải
                            </label>
                            <input
                              type="text"
                              value={form.sellerSignSub || ''}
                              onChange={(e) => updateField('sellerSignSub', e.target.value)}
                              placeholder="(Ký và ghi rõ họ tên)"
                              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer note (Addressing the "Test" text shown in user Image 1) */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-900 mb-1">
                      Lời Cảm Ơn / Ghi Chú Đáy Trang (Footer Note)
                    </label>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Để trống để hoàn toàn không hiển thị dòng chữ nào ở chân trang.
                    </p>
                    <textarea
                      rows={2}
                      value={form.footerNote || ''}
                      onChange={(e) => updateField('footerNote', e.target.value)}
                      placeholder="VD: Cảm ơn quý khách đã tin tưởng và đồng hành cùng chúng tôi! (Hoặc để trống)"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Controls Bottom Bar */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => updateField('isDefault', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-sm"
                />
                <span>Đặt làm mẫu mặc định</span>
              </label>

              <button
                type="button"
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saveMutation.isPending ? 'Đang lưu...' : 'Lưu Mẫu Thiết Kế'}</span>
              </button>
            </div>
          </div>

          {/* RIGHT PANEL: LIVE A4 PREVIEW */}
          <div className="flex-1 bg-slate-200/80 p-4 sm:p-6 overflow-y-auto flex flex-col items-center">
            <div className="w-full max-w-3xl flex items-center justify-between mb-3 text-xs text-slate-500">
              <span className="flex items-center space-x-1.5 font-medium">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Bản Xem Trước Trực Tiếp (Live A4 Preview)</span>
              </span>
              <span className="bg-slate-300/80 text-slate-700 px-2 py-0.5 rounded text-[11px] font-mono">
                Khổ A4 • Tỉ lệ 100%
              </span>
            </div>

            <div className="w-full max-w-3xl bg-white shadow-2xl rounded-sm transition-all duration-200 overflow-hidden">
              <InvoiceTemplateRenderer
                invoice={SAMPLE_INVOICE_DATA}
                settings={{
                  companyName: SAMPLE_INVOICE_DATA.sellerName,
                  address: SAMPLE_INVOICE_DATA.sellerAddress,
                  taxCode: SAMPLE_INVOICE_DATA.sellerTaxCode,
                  phone: SAMPLE_INVOICE_DATA.sellerPhone,
                  email: SAMPLE_INVOICE_DATA.sellerEmail,
                  bankCode: SAMPLE_INVOICE_DATA.bankCode,
                  bankAccount: SAMPLE_INVOICE_DATA.bankAccount,
                  bankAccountName: SAMPLE_INVOICE_DATA.bankAccountName,
                }}
                designConfig={form}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
