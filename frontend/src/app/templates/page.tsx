'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  LayoutTemplate,
  Check,
  Eye,
  Plus,
  MessageSquare,
  Mail,
  FileText,
  Paperclip,
  Trash2,
  Pencil,
  Copy,
  Sparkles,
  Save,
  AlertTriangle,
  Send,
  Upload,
  Link as LinkIcon,
  X,
  Layers,
  ChevronDown,
  Info,
} from 'lucide-react';
import InvoiceTemplateRenderer, {
  TEMPLATES_CONFIG,
  InvoiceDesignTemplate,
} from '@/components/InvoiceTemplateRenderer';
import InvoiceDesignerModal from '@/components/InvoiceDesignerModal';

const SAMPLE_INVOICE = {
  invoiceNumber: 'HD-2026-0001',
  issueDate: '2026-06-25T08:30:00Z',
  dueDate: '2026-07-05',
  status: 'ISSUED',
  buyerName: 'Nguyễn Thành Đạt',
  buyerCompany: 'Công ty Cổ phần Dịch vụ Số Thành Đạt',
  buyerTaxCode: '0315894123',
  buyerAddress: '124 Điện Biên Phủ, Quận 1, TP. Hồ Chí Minh',
  buyerEmail: 'thanhdat@thanhdattax.com',
  buyerPhone: '0976600395',
  hasVat: true,
  vatRate: 10,
  subTotal: 1320000,
  vatAmount: 132000,
  grandTotal: 1452000,
  paymentCode: 'AI89K2',
  qrDataUrl: 'https://qr.sepay.vn/img?bank=Vietcombank&acc=SHYNNERI&template=compact&amount=1452000&des=AI89K2%20AI%20Writer',
  items: [
    {
      id: '1',
      name: 'Gói AI WRITER - 1 Năm Bản Quyền Pro',
      description: 'Tạo nội dung AI không giới hạn, hỗ trợ chuẩn SEO & WordPress',
      metaInfo: 'Thời hạn: 25/06/2026 - 25/06/2027',
      quantity: 1,
      unitPrice: 1452000,
      amount: 1452000,
    },
  ],
};

const SAMPLE_SETTINGS = {
  companyName: 'CÔNG TY TNHH GIÁO DỤC AI ROBOTIC',
  address: 'Số 10 Huỳnh Văn Nghệ, P. Trấn Biên, Đồng Nai',
  taxCode: '3603893101',
  phone: '0812305046',
  email: 'contact@airobotics.edu.vn',
};

const DEFAULT_PRESET_TEMPLATES: InvoiceDesignTemplate[] = [
  {
    id: 'standard-classic',
    code: 'standard-classic',
    name: 'Mẫu Chuẩn Doanh Nghiệp',
    description: 'Mẫu hóa đơn GTGT trang trọng theo quy chuẩn doanh nghiệp Việt Nam, bố cục thanh lịch.',
    primaryColor: '#1e3a8a',
    headerBgColor: '#f8fafc',
    textColor: '#1e293b',
    fontFamily: 'serif',
    showTaxCodeBadge: false,
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
    isDefault: true,
    isActive: true,
  },
  {
    id: 'modern-minimalist',
    code: 'modern-minimalist',
    name: 'Mẫu Tối Giản Hiện Đại',
    description: 'Phong cách tối giản Clean & Sharp, phông chữ Sans-serif hiện đại, đường nét mỏng tinh tế.',
    primaryColor: '#0f172a',
    headerBgColor: '#f1f5f9',
    textColor: '#0f172a',
    fontFamily: 'sans',
    showTaxCodeBadge: false,
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
    footerNote: 'Cảm ơn quý khách đã tin tưởng và đồng hành cùng chúng tôi!',
    isDefault: false,
    isActive: true,
  },
  {
    id: 'tech-emerald',
    code: 'tech-emerald',
    name: 'Mẫu Xanh Lục Bảo Công Nghệ',
    description: 'Tông màu xanh ngọc lục bảo trẻ trung năng động, hoàn hảo cho các dịch vụ SaaS, AI & Công nghệ.',
    primaryColor: '#059669',
    headerBgColor: '#ecfdf5',
    textColor: '#064e3b',
    fontFamily: 'sans',
    showTaxCodeBadge: false,
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
    footerNote: 'Hóa đơn điện tử được khởi tạo và lưu trữ trên hệ thống AI Cloud.',
    isDefault: false,
    isActive: true,
  },
  {
    id: 'formal-administrative',
    code: 'formal-administrative',
    name: 'Mẫu Hành Chính Đầy Đủ (Có Chữ Ký)',
    description: 'Bố cục truyền thống đầy đủ khối chữ ký Đại diện khách hàng / Người lập hóa đơn và ghi chú thuế.',
    primaryColor: '#831843',
    headerBgColor: '#fdf2f8',
    textColor: '#1e293b',
    fontFamily: 'serif',
    showTaxCodeBadge: true,
    subtitle: '(Có mã của cơ quan thuế)',
    showSellerInfo: true,
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
    qrLayout: 'stacked',
    showSignatures: true,
    customerSignTitle: 'ĐẠI DIỆN KHÁCH HÀNG',
    customerSignSub: '(Ký và ghi rõ họ tên)',
    sellerSignTitle: 'NGƯỜI LẬP HÓA ĐƠN',
    sellerSignSub: '(Ký và ghi rõ họ tên)',
    footerNote: '',
    isDefault: false,
    isActive: true,
  },
];

interface AttachmentFile {
  id?: string;
  name: string;
  url: string;
  size?: number;
  type?: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  channel: 'ZALO' | 'EMAIL';
  triggerType: 'INVOICE_CREATED' | 'PAYMENT_SUCCESS' | 'SUBSCRIPTION_ALERT' | 'CUSTOM';
  subject?: string;
  content: string;
  serviceIds: string[];
  attachments: AttachmentFile[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ServiceCatalogItem {
  id: string;
  name: string;
  unitPrice: number;
  unit: string;
  groupId?: string | null;
  group?: { id: string; name: string; color?: string } | null;
}

const TEMPLATE_VARIABLES = [
  { tag: '{{customerName}}', desc: 'Tên khách hàng' },
  { tag: '{{invoiceNumber}}', desc: 'Số hóa đơn (HD-000001)' },
  { tag: '{{grandTotal}}', desc: 'Tổng tiền thanh toán (VND)' },
  { tag: '{{packageName}}', desc: 'Tên gói dịch vụ đăng ký' },
  { tag: '{{viewUrl}}', desc: 'Link xem & quét VietQR' },
  { tag: '{{paymentCode}}', desc: 'Cú pháp chuyển khoản' },
  { tag: '{{dueDate}}', desc: 'Hạn thanh toán' },
  { tag: '{{brandName}}', desc: 'Tên thương hiệu (AI WRITER)' },
  { tag: '{{phone}}', desc: 'Hotline / Zalo hỗ trợ' },
  { tag: '{{bankAccount}}', desc: 'Số tài khoản ngân hàng' },
  { tag: '{{bankCode}}', desc: 'Tên ngân hàng thụ hưởng' },
];

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'a4' | 'zalo' | 'email'>('a4');

  // Designer Modal for A4 Template
  const [isDesignerModalOpen, setIsDesignerModalOpen] = useState<boolean>(false);
  const [editingDesignTemplate, setEditingDesignTemplate] = useState<InvoiceDesignTemplate | null>(null);
  const [previewDesignTemplate, setPreviewDesignTemplate] = useState<InvoiceDesignTemplate | null>(null);

  // Fetch Invoice Design Templates
  const { data: invoiceDesignTemplates = [], isLoading: isLoadingInvoiceTemplates } = useQuery<InvoiceDesignTemplate[]>({
    queryKey: ['invoice-templates'],
    queryFn: async () => {
      const res = await api.get('/invoice-templates');
      return res.data;
    },
  });

  const setDefaultTemplateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/invoice-templates/${id}/set-default`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-templates'] });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/invoice-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-templates'] });
    },
    onError: (err: any) => {
      alert('Không thể xóa mẫu: ' + (err.response?.data?.message || err.message));
    },
  });

  const effectiveTemplates = invoiceDesignTemplates.length > 0 ? invoiceDesignTemplates : DEFAULT_PRESET_TEMPLATES;

  // Preview Modal for A4 Template
  const [selectedPreviewTemplate, setSelectedPreviewTemplate] = useState<string>('standard-classic');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);

  // Message Template Filter
  const [triggerFilter, setTriggerFilter] = useState<string>('all');

  // Message Template Modal state
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [msgFormData, setMsgFormData] = useState<{
    name: string;
    channel: 'ZALO' | 'EMAIL';
    triggerType: 'INVOICE_CREATED' | 'PAYMENT_SUCCESS';
    subject: string;
    content: string;
    applyAllServices: boolean;
    serviceIds: string[];
    attachments: AttachmentFile[];
    isDefault: boolean;
    isActive: boolean;
  }>({
    name: '',
    channel: 'ZALO',
    triggerType: 'INVOICE_CREATED',
    subject: '',
    content: '',
    applyAllServices: true,
    serviceIds: [],
    attachments: [],
    isDefault: false,
    isActive: true,
  });

  const [previewMsgModal, setPreviewMsgModal] = useState<MessageTemplate | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState<{ name: string; url: string }>({ name: '', url: '' });
  const [showAddUrlBox, setShowAddUrlBox] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 1. Fetch Message Templates
  const { data: messageTemplates = [], isLoading: isLoadingTemplates } = useQuery<MessageTemplate[]>({
    queryKey: ['message-templates'],
    queryFn: async () => {
      const res = await api.get('/message-templates');
      return res.data;
    },
  });

  // 2. Fetch Services to select for message template
  const { data: servicesList = [] } = useQuery<ServiceCatalogItem[]>({
    queryKey: ['services-for-template'],
    queryFn: async () => {
      const res = await api.get('/services');
      return res.data;
    },
  });

  // Mutations
  const createMsgMutation = useMutation({
    mutationFn: (data: any) => api.post('/message-templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
      closeMsgModal();
    },
  });

  const updateMsgMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/message-templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
      closeMsgModal();
    },
  });

  const deleteMsgMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/message-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
    },
  });

  // ================= MODAL ACTIONS =================

  const openCreateMsgModal = (channel: 'ZALO' | 'EMAIL') => {
    setEditingMsgId(null);
    setMsgFormData({
      name: channel === 'ZALO' ? 'Mẫu Tin Nhắn Zalo Mới' : 'Mẫu Email Mới',
      channel,
      triggerType: 'INVOICE_CREATED',
      subject: channel === 'EMAIL' ? '[{{brandName}}] Xác nhận đăng ký {{packageName}} & Hóa đơn #{{invoiceNumber}}' : '',
      content:
        channel === 'ZALO'
          ? `🔔 [Invoice-AIR] Thông báo hóa đơn dịch vụ\nKính chào Anh/Chị {{customerName}},\nHóa đơn cho gói {{packageName}} đã sẵn sàng:\n• Mã hóa đơn: #{{invoiceNumber}}\n• Tổng tiền: {{grandTotal}}\n👉 Xem & Thanh toán: {{viewUrl}}`
          : `<div style="font-family: Arial, sans-serif; padding: 20px;">\n  <h2>THÔNG BÁO HÓA ĐƠN</h2>\n  <p>Kính gửi {{customerName}},</p>\n  <p>Hệ thống gửi đến Quý khách hóa đơn cho gói <strong>{{packageName}}</strong> với số tiền: <strong>{{grandTotal}}</strong>.</p>\n  <p><a href="{{viewUrl}}">Bấm vào đây để xem hóa đơn & quét mã VietQR</a></p>\n</div>`,
      applyAllServices: true,
      serviceIds: [],
      attachments: [],
      isDefault: false,
      isActive: true,
    });
    setIsMsgModalOpen(true);
  };

  const openEditMsgModal = (t: MessageTemplate) => {
    setEditingMsgId(t.id);
    const hasSpecificServices = Array.isArray(t.serviceIds) && t.serviceIds.length > 0;
    setMsgFormData({
      name: t.name,
      channel: t.channel,
      triggerType: t.triggerType as any,
      subject: t.subject || '',
      content: t.content,
      applyAllServices: !hasSpecificServices,
      serviceIds: t.serviceIds || [],
      attachments: t.attachments || [],
      isDefault: t.isDefault,
      isActive: t.isActive,
    });
    setIsMsgModalOpen(true);
  };

  const closeMsgModal = () => {
    setIsMsgModalOpen(false);
    setEditingMsgId(null);
    setShowAddUrlBox(false);
  };

  const handleMsgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgFormData.name.trim() || !msgFormData.content.trim()) return;

    const payload = {
      name: msgFormData.name,
      channel: msgFormData.channel,
      triggerType: msgFormData.triggerType,
      subject: msgFormData.channel === 'EMAIL' ? msgFormData.subject : undefined,
      content: msgFormData.content,
      serviceIds: msgFormData.applyAllServices ? [] : msgFormData.serviceIds,
      attachments: msgFormData.attachments,
      isDefault: msgFormData.isDefault,
      isActive: msgFormData.isActive,
    };

    if (editingMsgId) {
      updateMsgMutation.mutate({ id: editingMsgId, data: payload });
    } else {
      createMsgMutation.mutate(payload);
    }
  };

  // Chèn placeholder tag vào vị trí con trỏ trong textarea
  const insertTag = (tag: string) => {
    const el = textareaRef.current;
    if (!el) {
      setMsgFormData((prev) => ({ ...prev, content: prev.content + tag }));
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = msgFormData.content;
    const nextText = text.substring(0, start) + tag + text.substring(end);
    setMsgFormData((prev) => ({ ...prev, content: nextText }));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    }, 10);
  };

  // Upload file đính kèm
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsUploadingFile(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const res = await api.post('/upload', {
            name: file.name,
            size: file.size,
            type: file.type,
            base64,
          });

          if (res.data?.url) {
            const newAtt: AttachmentFile = {
              id: String(Date.now()),
              name: file.name,
              url: res.data.url,
              size: file.size,
              type: file.type,
            };
            setMsgFormData((prev) => ({
              ...prev,
              attachments: [...prev.attachments, newAtt],
            }));
          }
        } catch (err: any) {
          alert('Lỗi khi tải file: ' + (err.response?.data?.message || err.message));
        } finally {
          setIsUploadingFile(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploadingFile(false);
    }
  };

  const handleAddCustomUrl = () => {
    if (!customUrlInput.url.trim()) return;
    const name = customUrlInput.name.trim() || 'Tài liệu đính kèm';
    const newAtt: AttachmentFile = {
      id: String(Date.now()),
      name,
      url: customUrlInput.url.trim(),
    };
    setMsgFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, newAtt],
    }));
    setCustomUrlInput({ name: '', url: '' });
    setShowAddUrlBox(false);
  };

  const removeAttachment = (index: number) => {
    setMsgFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const toggleServiceSelection = (serviceId: string) => {
    setMsgFormData((prev) => {
      const exists = prev.serviceIds.includes(serviceId);
      return {
        ...prev,
        serviceIds: exists
          ? prev.serviceIds.filter((id) => id !== serviceId)
          : [...prev.serviceIds, serviceId],
      };
    });
  };

  // Render mock preview text
  const renderMockText = (templateText: string) => {
    return templateText
      .replace(/{{customerName}}|{buyerName}/g, SAMPLE_INVOICE.buyerName)
      .replace(/{{invoiceNumber}}|{invoiceNumber}/g, SAMPLE_INVOICE.invoiceNumber)
      .replace(/{{grandTotal}}|{grandTotal}/g, '1.452.000 ₫')
      .replace(/{{packageName}}/g, SAMPLE_INVOICE.items[0].name)
      .replace(/{{viewUrl}}|{viewUrl}/g, 'https://invoice.share4happy.com/view/demo-token')
      .replace(/{{paymentCode}}/g, SAMPLE_INVOICE.paymentCode)
      .replace(/{{dueDate}}/g, '05/07/2026')
      .replace(/{{brandName}}/g, 'AI WRITER')
      .replace(/{{phone}}/g, '0812305046')
      .replace(/{{bankAccount}}/g, '00006322633')
      .replace(/{{bankCode}}/g, 'TPBank');
  };

  // Lọc mẫu tin nhắn theo tab và trigger
  const filteredTemplates = messageTemplates.filter((t) => {
    if (activeTab === 'zalo' && t.channel !== 'ZALO') return false;
    if (activeTab === 'email' && t.channel !== 'EMAIL') return false;
    if (triggerFilter !== 'all' && t.triggerType !== triggerFilter) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cấu Hình Định Dạng &amp; Tin Nhắn</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tùy biến mẫu hóa đơn in ấn A4, kịch bản tin nhắn Zalo và Email theo từng gói dịch vụ
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'a4' ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setEditingDesignTemplate(null);
                  setIsDesignerModalOpen(true);
                }}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>+ Thiết Kế Mẫu Mới</span>
              </button>
              <Link
                href="/invoices/new"
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Hóa Đơn</span>
              </Link>
            </div>
          ) : (
            <button
              onClick={() => openCreateMsgModal(activeTab === 'zalo' ? 'ZALO' : 'EMAIL')}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm Mẫu {activeTab === 'zalo' ? 'Zalo' : 'Email'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Điều Hướng */}
      <div className="flex border-b border-slate-200 space-x-2 sm:space-x-6 overflow-x-auto text-sm font-semibold">
        <button
          onClick={() => setActiveTab('a4')}
          className={`pb-3 pt-1 px-1 border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'a4'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
          <span>Mẫu Hóa Đơn A4 (In Ấn &amp; PDF)</span>
        </button>

        <button
          onClick={() => setActiveTab('zalo')}
          className={`pb-3 pt-1 px-1 border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'zalo'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-blue-500" />
          <span>Mẫu Tin Nhắn Zalo</span>
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
            {messageTemplates.filter((t) => t.channel === 'ZALO').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('email')}
          className={`pb-3 pt-1 px-1 border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'email'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className="w-4 h-4 text-emerald-600" />
          <span>Mẫu Email Hóa Đơn &amp; Biên Lai</span>
          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
            {messageTemplates.filter((t) => t.channel === 'EMAIL').length}
          </span>
        </button>
      </div>

      {/* ================= TAB 1: MẪU HÓA ĐƠN A4 ================= */}
      {activeTab === 'a4' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3 bg-blue-50/60 border border-blue-100 p-4 rounded-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Công Cụ Thiết Kế Mẫu Hóa Đơn Trực Quan
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Tùy chỉnh màu sắc thương hiệu, phông chữ, bật/tắt chữ ký Đại diện khách hàng / Người lập hóa đơn, phụ đề thuế theo nhu cầu.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingDesignTemplate(null);
                setIsDesignerModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Thiết Kế Mẫu Mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {effectiveTemplates.map((tpl) => {
              const isDefault = tpl.isDefault;
              const pc = tpl.primaryColor || '#1e3a8a';

              return (
                <div
                  key={tpl.id || tpl.code}
                  className={`bg-white rounded-2xl border-2 transition-all duration-300 shadow-xs hover:shadow-md p-6 flex flex-col justify-between relative overflow-hidden ${
                    isDefault ? 'border-blue-600 ring-1 ring-blue-600/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Header card */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs flex-shrink-0"
                          style={{ backgroundColor: pc }}
                        >
                          <LayoutTemplate className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                            <span>{tpl.name}</span>
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block"
                              style={{ backgroundColor: pc }}
                            />
                            <span className="font-mono text-[11px] text-slate-500 uppercase">{pc}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {tpl.fontFamily === 'sans' ? 'Phông Sans' : tpl.fontFamily === 'mono' ? 'Phông Mono' : 'Phông Serif'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isDefault && (
                        <span className="bg-blue-600 text-white text-[11px] px-2.5 py-1 rounded-full font-semibold flex items-center space-x-1 shadow-xs flex-shrink-0">
                          <Check className="w-3 h-3" />
                          <span>Mặc định</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mb-4 leading-relaxed line-clamp-2">
                      {tpl.description}
                    </p>

                    {/* Features Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className={`text-[10.5px] px-2 py-0.5 rounded-md font-medium border ${
                        tpl.showSignatures
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {tpl.showSignatures ? '✍️ Có Khối Chữ Ký' : '🚫 Không Chữ Ký'}
                      </span>

                      <span className={`text-[10.5px] px-2 py-0.5 rounded-md font-medium border ${
                        tpl.showTaxCodeBadge
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {tpl.showTaxCodeBadge ? '🏛️ Phụ Đề Thuế' : 'Tối Giản Thuế'}
                      </span>

                      <span className="text-[10.5px] px-2 py-0.5 rounded-md font-medium border bg-slate-50 text-slate-600 border-slate-200">
                        {tpl.qrLayout === 'stacked' ? 'QR Xếp Tầng' : 'QR Cạnh Nhau'}
                      </span>
                    </div>

                    {/* Interactive Preview Box */}
                    <div
                      onClick={() => setPreviewDesignTemplate(tpl)}
                      className="cursor-pointer border border-slate-200/90 rounded-xl p-4 mb-4 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col items-center justify-center min-h-[140px] group"
                    >
                      <FileText className="w-8 h-8 text-slate-400 group-hover:text-blue-600 transition-colors mb-2" />
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600">
                        Bấm để xem trước toàn bộ mẫu A4
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1">
                        {tpl.showSignatures ? 'Hiển thị đủ 2 chữ ký & ghi chú' : 'Đã tinh gọn chữ ký & phụ đề thuế'}
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setPreviewDesignTemplate(tpl)}
                        className="p-2 text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg text-xs font-medium transition-all"
                        title="Xem mẫu đầy đủ"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setEditingDesignTemplate(tpl);
                          setIsDesignerModalOpen(true);
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg text-xs font-semibold transition-all"
                        title="Chỉnh sửa thiết kế này"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Sửa Thiết Kế</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingDesignTemplate({
                            ...tpl,
                            id: undefined,
                            isDefault: false,
                            name: `${tpl.name} (Bản sao)`,
                            code: undefined,
                          });
                          setIsDesignerModalOpen(true);
                        }}
                        className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs transition-all"
                        title="Nhân bản mẫu này"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {!isDefault && tpl.id && (
                        <button
                          onClick={() => setDefaultTemplateMutation.mutate(tpl.id!)}
                          disabled={setDefaultTemplateMutation.isPending}
                          className="p-2 text-slate-500 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 rounded-lg text-xs transition-all"
                          title="Đặt làm mặc định"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                      {!isDefault && tpl.id && tpl.code !== 'standard-classic' && (
                        <button
                          onClick={() => {
                            if (confirm(`Bạn có chắc chắn muốn xóa mẫu thiết kế "${tpl.name}"?`)) {
                              deleteTemplateMutation.mutate(tpl.id!);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-lg text-xs transition-all"
                          title="Xóa mẫu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <Link
                      href={`/invoices/new?templateId=${tpl.code || tpl.id}`}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all whitespace-nowrap"
                    >
                      <span>Dùng mẫu</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 2 & 3: MẪU TIN NHẮN ZALO & EMAIL ================= */}
      {(activeTab === 'zalo' || activeTab === 'email') && (
        <div className="space-y-6">
          {/* Subfilter theo sự kiện */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-semibold text-slate-500">Lọc theo sự kiện:</span>
              <button
                onClick={() => setTriggerFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  triggerFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Tất cả ({activeTab === 'zalo' ? messageTemplates.filter((t) => t.channel === 'ZALO').length : messageTemplates.filter((t) => t.channel === 'EMAIL').length})
              </button>
              <button
                onClick={() => setTriggerFilter('INVOICE_CREATED')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  triggerFilter === 'INVOICE_CREATED'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Khi Tạo Hóa Đơn
              </button>
              <button
                onClick={() => setTriggerFilter('PAYMENT_SUCCESS')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  triggerFilter === 'PAYMENT_SUCCESS'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Khi Thanh Toán Thành Công
              </button>
            </div>

            <div className="text-xs text-slate-500 flex items-center space-x-1.5">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              <span>Hệ thống tự động dùng mẫu tin tương ứng theo gói dịch vụ khi gửi tin</span>
            </div>
          </div>

          {/* Danh sách thẻ mẫu tin nhắn */}
          {isLoadingTemplates ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700 text-base">
                Chưa có mẫu tin nhắn {activeTab === 'zalo' ? 'Zalo' : 'Email'} nào
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tạo mẫu tin nhắn để tự động gửi thông báo hóa đơn và tài liệu đính kèm cho khách
              </p>
              <button
                onClick={() => openCreateMsgModal(activeTab === 'zalo' ? 'ZALO' : 'EMAIL')}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Mẫu Đầu Tiên</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredTemplates.map((template) => {
                const isAll = !template.serviceIds || template.serviceIds.length === 0;
                const assignedServices = servicesList.filter((s) =>
                  template.serviceIds?.includes(s.id),
                );

                return (
                  <div
                    key={template.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className={`p-2 rounded-xl text-white shadow-xs ${
                              template.channel === 'ZALO' ? 'bg-blue-600' : 'bg-emerald-600'
                            }`}
                          >
                            {template.channel === 'ZALO' ? (
                              <MessageSquare className="w-4 h-4" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{template.name}</h3>
                            <div className="flex items-center space-x-2 mt-0.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  template.triggerType === 'PAYMENT_SUCCESS'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}
                              >
                                {template.triggerType === 'PAYMENT_SUCCESS'
                                  ? '✅ Thanh Toán Thành Công'
                                  : '🧾 Tạo Mới Hóa Đơn'}
                              </span>
                              {template.isDefault && (
                                <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-semibold">
                                  Mặc định
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={() => setPreviewMsgModal(template)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Xem trước tin nhắn"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditMsgModal(template)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {!template.isDefault && (
                            <button
                              onClick={() => {
                                if (confirm(`Bạn có chắc muốn xóa mẫu "${template.name}"?`)) {
                                  deleteMsgMutation.mutate(template.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Xóa mẫu"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Tiêu đề Email (nếu là email) */}
                      {template.channel === 'EMAIL' && template.subject && (
                        <div className="mb-2.5 bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-1.5 text-xs text-slate-700">
                          <span className="font-bold text-slate-500">Tiêu đề:</span>{' '}
                          <span className="font-medium text-slate-900">{template.subject}</span>
                        </div>
                      )}

                      {/* Preview Content Balloon */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 mb-3 text-xs text-slate-700 font-sans whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                        {template.content.replace(/<[^>]*>?/gm, '')}
                      </div>

                      {/* Gói dịch vụ áp dụng */}
                      <div className="mb-3">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Áp Dụng Cho Gói:
                        </span>
                        {isAll ? (
                          <span className="inline-flex items-center space-x-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full font-semibold">
                            <Check className="w-3 h-3" />
                            <span>Tất cả các gói dịch vụ (Mặc định)</span>
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {assignedServices.map((svc) => (
                              <span
                                key={svc.id}
                                className="text-xs bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-0.5 rounded-md font-medium"
                              >
                                {svc.name}
                              </span>
                            ))}
                            {assignedServices.length === 0 && (
                              <span className="text-xs text-slate-400 italic">
                                Đã chọn {template.serviceIds.length} gói
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* File đính kèm */}
                      {template.attachments && template.attachments.length > 0 && (
                        <div className="mb-2">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            File Đính Kèm ({template.attachments.length}):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {template.attachments.map((att, idx) => (
                              <a
                                key={idx}
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-1 rounded-lg transition-colors font-medium"
                              >
                                <Paperclip className="w-3 h-3" />
                                <span className="truncate max-w-[150px]">{att.name}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span>Cập nhật: {new Date(template.updatedAt).toLocaleDateString('vi-VN')}</span>
                      <button
                        onClick={() => openEditMsgModal(template)}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        Chỉnh sửa mẫu &rarr;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL TẠO / SỬA MẪU TIN NHẮN (ZALO / EMAIL) ================= */}
      {isMsgModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <div
                  className={`p-2 rounded-xl text-white ${
                    msgFormData.channel === 'ZALO' ? 'bg-blue-600' : 'bg-emerald-600'
                  }`}
                >
                  {msgFormData.channel === 'ZALO' ? (
                    <MessageSquare className="w-4 h-4" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                </div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  {editingMsgId ? 'Chỉnh Sửa Mẫu Tin Nhắn' : 'Tạo Mẫu Tin Nhắn Mới'}
                </h3>
              </div>
              <button onClick={closeMsgModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleMsgSubmit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tên Mẫu Gợi Nhớ *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Zalo - Gói AI Writer 1 Năm"
                    value={msgFormData.name}
                    onChange={(e) => setMsgFormData({ ...msgFormData, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Sự Kiện Kích Hoạt *
                  </label>
                  <select
                    value={msgFormData.triggerType}
                    onChange={(e) =>
                      setMsgFormData({ ...msgFormData, triggerType: e.target.value as any })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none bg-white"
                  >
                    <option value="INVOICE_CREATED">🧾 Khi tạo hóa đơn mới (Gửi link & VietQR)</option>
                    <option value="PAYMENT_SUCCESS">✅ Khi thanh toán thành công (Biên lai & Kích hoạt)</option>
                  </select>
                </div>
              </div>

              {/* Tiêu đề cho Email */}
              {msgFormData.channel === 'EMAIL' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tiêu Đề Email (Subject) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: [{{brandName}}] Xác nhận đăng ký {{packageName}} - #{{invoiceNumber}}"
                    value={msgFormData.subject}
                    onChange={(e) => setMsgFormData({ ...msgFormData, subject: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Tags chèn nhanh */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Nội Dung Tin Nhắn *
                  </label>
                  <span className="text-[11px] text-slate-400">Bấm vào tag bên dưới để chèn nhanh</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {TEMPLATE_VARIABLES.map((v) => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => insertTag(v.tag)}
                      className="px-2 py-0.5 bg-white hover:bg-blue-50 hover:text-blue-600 text-slate-700 border border-slate-200 rounded text-xs font-mono transition-colors shadow-2xs"
                      title={v.desc}
                    >
                      {v.tag}
                    </button>
                  ))}
                </div>

                <textarea
                  ref={textareaRef}
                  rows={msgFormData.channel === 'EMAIL' ? 7 : 6}
                  required
                  placeholder={
                    msgFormData.channel === 'ZALO'
                      ? 'Nhập nội dung tin nhắn Zalo gửi tới khách hàng...'
                      : 'Nhập nội dung HTML hoặc văn bản gửi email...'
                  }
                  value={msgFormData.content}
                  onChange={(e) => setMsgFormData({ ...msgFormData, content: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none font-sans"
                />
              </div>

              {/* Áp dụng cho gói nào */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Chỉ Định Áp Dụng Cho Gói Dịch Vụ
                  </label>
                  <div className="flex items-center space-x-3 text-xs">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={msgFormData.applyAllServices}
                        onChange={() => setMsgFormData({ ...msgFormData, applyAllServices: true })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Tất cả các gói (Mặc định)</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={!msgFormData.applyAllServices}
                        onChange={() => setMsgFormData({ ...msgFormData, applyAllServices: false })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Chỉ định gói cụ thể</span>
                    </label>
                  </div>
                </div>

                {!msgFormData.applyAllServices && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <p className="text-[11px] text-slate-500">
                      Chọn các gói dịch vụ sẽ sử dụng mẫu tin nhắn này:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                      {servicesList.map((svc) => {
                        const isChecked = msgFormData.serviceIds.includes(svc.id);
                        return (
                          <label
                            key={svc.id}
                            className={`flex items-start space-x-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-semibold'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleServiceSelection(svc.id)}
                              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                            />
                            <div className="min-w-0">
                              <span className="block truncate">{svc.name}</span>
                              <span className="text-[10px] text-slate-400 block font-normal">
                                {svc.group ? svc.group.name : 'Chưa phân nhóm'}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* File đính kèm */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Paperclip className="w-4 h-4 text-emerald-600" />
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      File &amp; Tài Liệu Đính Kèm
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Ẩn file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      disabled={isUploadingFile}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                    >
                      <Upload className="w-3 h-3 text-blue-600" />
                      <span>{isUploadingFile ? 'Đang tải...' : 'Tải File Lên'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowAddUrlBox(!showAddUrlBox)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                    >
                      <LinkIcon className="w-3 h-3 text-emerald-600" />
                      <span>Nhập URL File</span>
                    </button>
                  </div>
                </div>

                {/* Box nhập link URL trực tiếp */}
                {showAddUrlBox && (
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Tên file hiển thị (VD: Huong_Dan_Su_Dung.pdf)"
                        value={customUrlInput.name}
                        onChange={(e) => setCustomUrlInput({ ...customUrlInput, name: e.target.value })}
                        className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Link file (VD: https://drive.google.com/...)"
                        value={customUrlInput.url}
                        onChange={(e) => setCustomUrlInput({ ...customUrlInput, url: e.target.value })}
                        className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowAddUrlBox(false)}
                        className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700"
                      >
                        Đóng
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomUrl}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-2xs"
                      >
                        Thêm File
                      </button>
                    </div>
                  </div>
                )}

                {/* Danh sách file đính kèm đã thêm */}
                {msgFormData.attachments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Chưa có file đính kèm (Có thể đính kèm file PDF hướng dẫn, hợp đồng, file quà tặng...)
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {msgFormData.attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs"
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <Paperclip className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-medium text-slate-800 truncate">{att.name}</span>
                          {att.size && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({(att.size / 1024).toFixed(1)} KB)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline text-[11px]"
                          >
                            Xem link
                          </a>
                          <button
                            type="button"
                            onClick={() => removeAttachment(idx)}
                            className="text-slate-400 hover:text-rose-600 p-0.5"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tùy chọn mặc định & Kích hoạt */}
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={msgFormData.isDefault}
                    onChange={(e) => setMsgFormData({ ...msgFormData, isDefault: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Đặt làm mẫu mặc định cho sự kiện này</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={msgFormData.isActive}
                    onChange={(e) => setMsgFormData({ ...msgFormData, isActive: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Kích hoạt</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeMsgModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={createMsgMutation.isPending || updateMsgMutation.isPending}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingMsgId ? 'Lưu Thay Đổi' : 'Tạo Mẫu Tin Nhắn'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL XEM TRƯỚC TIN NHẮN (PREVIEW) ================= */}
      {previewMsgModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Xem Trước: {previewMsgModal.name}
                </h3>
              </div>
              <button
                onClick={() => setPreviewMsgModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {previewMsgModal.channel === 'EMAIL' && previewMsgModal.subject && (
                <div className="p-3 bg-slate-100 rounded-xl text-xs">
                  <span className="font-bold text-slate-600">Tiêu đề email:</span>{' '}
                  <span className="font-semibold text-slate-900">
                    {renderMockText(previewMsgModal.subject)}
                  </span>
                </div>
              )}

              {/* Mobile Phone Mockup for Zalo */}
              {previewMsgModal.channel === 'ZALO' ? (
                <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200">
                  <div className="text-[11px] text-slate-400 text-center mb-2 font-medium">
                    Mô phỏng tin nhắn Zalo gửi tới khách hàng
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                    {renderMockText(previewMsgModal.content)}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-4 border border-slate-200 text-xs text-slate-800 leading-relaxed max-h-72 overflow-y-auto">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: renderMockText(previewMsgModal.content),
                    }}
                  />
                </div>
              )}

              {previewMsgModal.attachments && previewMsgModal.attachments.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-700 block mb-1.5">
                    File đính kèm kèm theo tin nhắn:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {previewMsgModal.attachments.map((att, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-medium"
                      >
                        <Paperclip className="w-3 h-3" />
                        <span>{att.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPreviewMsgModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL XEM TRƯỚC MẪU HÓA ĐƠN A4 ================= */}
      {previewDesignTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: previewDesignTemplate.primaryColor || '#1e3a8a' }}
                >
                  <LayoutTemplate className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Xem Trước Mẫu: {previewDesignTemplate.name}
                  </h3>
                  <p className="text-xs text-slate-500">Mô phỏng đầy đủ dữ liệu thực tế</p>
                </div>
              </div>

              <button
                onClick={() => setPreviewDesignTemplate(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-all text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-100 flex-1">
              <div className="max-w-3xl mx-auto">
                <InvoiceTemplateRenderer
                  invoice={SAMPLE_INVOICE}
                  settings={SAMPLE_SETTINGS}
                  designConfig={previewDesignTemplate}
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
              <span className="text-xs text-slate-500">Chuẩn in ấn A4 &amp; xuất Playwright PDF</span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setEditingDesignTemplate(previewDesignTemplate);
                    setPreviewDesignTemplate(null);
                    setIsDesignerModalOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                >
                  Chỉnh Sửa Thiết Kế
                </button>
                <button
                  onClick={() => setPreviewDesignTemplate(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  Đóng
                </button>
                <Link
                  href={`/invoices/new?templateId=${previewDesignTemplate.code || previewDesignTemplate.id}`}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all"
                >
                  Tạo Hóa Đơn Với Mẫu Này
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL THIẾT KẾ MẪU TRỰC QUAN ================= */}
      <InvoiceDesignerModal
        isOpen={isDesignerModalOpen}
        onClose={() => setIsDesignerModalOpen(false)}
        initialTemplate={editingDesignTemplate}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['invoice-templates'] });
        }}
      />
    </div>
  );
}
