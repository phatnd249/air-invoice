'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  X,
  Send,
  Mail,
  MessageSquare,
  Eye,
  Edit3,
  Check,
  AlertCircle,
  Sparkles,
  User,
  Paperclip,
  CheckCircle2,
  Info,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { MessageTemplate, AttachmentFile } from '@/components/templates/types';

export interface SubscriptionRecipient {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  serviceName: string;
  endDate: string;
}

interface SubscriptionMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: SubscriptionRecipient[];
  onRemoveRecipient?: (id: string) => void;
  onSuccess: (result: { queuedEmailCount: number; queuedZaloCount: number; totalRecipients: number }) => void;
  defaultServiceName?: string;
}

export function SubscriptionMessageModal({
  isOpen,
  onClose,
  recipients,
  onRemoveRecipient,
  onSuccess,
  defaultServiceName,
}: SubscriptionMessageModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [channels, setChannels] = useState<('EMAIL' | 'ZALO')[]>(['EMAIL', 'ZALO']);
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [previewMode, setPreviewMode] = useState<'editor' | 'preview'>('editor');
  const [previewChannel, setPreviewChannel] = useState<'EMAIL' | 'ZALO'>('EMAIL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch danh sách templates từ /message-templates
  const { data: rawTemplates = [], isLoading: isLoadingTemplates } = useQuery<MessageTemplate[]>({
    queryKey: ['message-templates'],
    queryFn: async () => {
      const res = await api.get('/message-templates');
      return res.data;
    },
    enabled: isOpen,
  });

  // 2. Lọc bỏ các template hóa đơn không phù hợp (INVOICE_CREATED, PAYMENT_SUCCESS)
  // Chỉ giữ các mẫu tin phù hợp chăm sóc khách hàng & cập nhật dịch vụ (SUBSCRIPTION_ALERT, CUSTOM)
  const filteredTemplates = useMemo(() => {
    return rawTemplates.filter((t) => {
      // Loại bỏ hoàn toàn template xuất hóa đơn hoặc xác nhận thanh toán hóa đơn
      if (t.triggerType === 'INVOICE_CREATED' || t.triggerType === 'PAYMENT_SUCCESS') {
        return false;
      }
      return true;
    });
  }, [rawTemplates]);

  // 3. Lấy thông tin cài đặt hệ thống (hotline, tên công ty)
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
    enabled: isOpen,
  });

  // Reset form khi mở modal
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      // Tự động chọn mẫu thông báo cập nhật hoặc nhắc hạn đầu tiên nếu có
      if (filteredTemplates.length > 0 && !selectedTemplateId) {
        // Ưu tiên template CUSTOM nếu có, hoặc template nhắc hạn
        const defaultTpl = filteredTemplates.find((t) => t.isDefault) || filteredTemplates[0];
        if (defaultTpl) {
          applyTemplate(defaultTpl);
        }
      } else if (!selectedTemplateId) {
        // Soạn tin mặc định
        setSubject(`[${settings?.companyName || 'Invoice-AIR'}] Thông báo cập nhật dịch vụ`);
        setMessage(
          `Kính gửi Quý khách {{customerName}},\n\nChúng tôi xin thông báo bản cập nhật mới nhất cho dịch vụ {{serviceName}}...\n\nNếu cần hỗ trợ kỹ thuật, Quý khách vui lòng liên hệ hotline: {{hotline}}.\n\nTrân trọng,\n{{brandName}}`
        );
      }
    }
  }, [isOpen, filteredTemplates]);

  const applyTemplate = (tpl: MessageTemplate) => {
    setSelectedTemplateId(tpl.id);
    if (tpl.subject) {
      setSubject(tpl.subject);
    } else {
      setSubject(`[${settings?.companyName || 'Invoice-AIR'}] Thông báo dịch vụ {{serviceName}}`);
    }
    setMessage(tpl.content || '');
    if (tpl.attachments && Array.isArray(tpl.attachments)) {
      setAttachments(tpl.attachments);
    } else {
      setAttachments([]);
    }
  };

  const handleSelectTemplate = (tplId: string) => {
    if (!tplId) {
      setSelectedTemplateId('');
      return;
    }
    const found = filteredTemplates.find((t) => t.id === tplId);
    if (found) {
      applyTemplate(found);
    }
  };

  const toggleChannel = (ch: 'EMAIL' | 'ZALO') => {
    setChannels((prev) => {
      if (prev.includes(ch)) {
        if (prev.length === 1) return prev; // Phải giữ lại ít nhất 1 kênh
        return prev.filter((c) => c !== ch);
      } else {
        return [...prev, ch];
      }
    });
  };

  const insertVariable = (variableTag: string) => {
    setMessage((prev) => prev + ' ' + variableTag);
  };

  // Tính số lượng khách hàng có thể nhận từng kênh
  const emailEligibleCount = useMemo(() => {
    return recipients.filter((r) => !!r.customerEmail && r.customerEmail.includes('@')).length;
  }, [recipients]);

  const zaloEligibleCount = useMemo(() => {
    return recipients.filter((r) => !!r.customerPhone && r.customerPhone.trim().length >= 8).length;
  }, [recipients]);

  // Render nội dung xem trước với mẫu dữ liệu của người nhận đầu tiên
  const sampleRecipient = recipients[0] || {
    id: 'sample',
    customerName: 'Nguyễn Văn A',
    customerEmail: 'khachhang@example.com',
    customerPhone: '0901234567',
    customerCompany: 'Công ty Cổ phần Công nghệ ABC',
    serviceName: defaultServiceName || 'Dịch vụ Nt AI Writer (Pro)',
    endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
  };

  const previewSubject = useMemo(() => {
    const company = settings?.companyName || 'Invoice-AIR';
    const hotline = settings?.phone || '';
    return (subject || '')
      .replace(/{{customerName}}|{buyerName}|{customerName}/g, sampleRecipient.customerName)
      .replace(/{{serviceName}}|{packageName}|{{packageName}}/g, sampleRecipient.serviceName)
      .replace(/{{customerEmail}}/g, sampleRecipient.customerEmail || '')
      .replace(/{{customerPhone}}/g, sampleRecipient.customerPhone || '')
      .replace(/{{brandName}}/g, company)
      .replace(/{{phone}}|{{hotline}}/g, hotline);
  }, [subject, sampleRecipient, settings]);

  const previewContent = useMemo(() => {
    const company = settings?.companyName || 'Invoice-AIR';
    const hotline = settings?.phone || '';
    const dateFormatted = new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(sampleRecipient.endDate));

    return (message || '')
      .replace(/{{customerName}}|{buyerName}|{customerName}/g, sampleRecipient.customerName)
      .replace(/{{serviceName}}|{packageName}|{{packageName}}/g, sampleRecipient.serviceName)
      .replace(/{{customerEmail}}/g, sampleRecipient.customerEmail || '')
      .replace(/{{customerPhone}}/g, sampleRecipient.customerPhone || '')
      .replace(/{{endDate}}|{expireDate}|{{expireDate}}/g, dateFormatted)
      .replace(/{{brandName}}/g, company)
      .replace(/{{phone}}|{{hotline}}/g, hotline);
  }, [message, sampleRecipient, settings]);

  const handleSubmit = async () => {
    if (recipients.length === 0) {
      setErrorMessage('Không có khách hàng nào được chọn');
      return;
    }
    if (channels.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất một kênh gửi (Email hoặc Zalo)');
      return;
    }
    if (!message.trim()) {
      setErrorMessage('Nội dung tin nhắn không được để trống');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        ids: recipients.map((r) => r.id),
        channels,
        subject: channels.includes('EMAIL') ? subject : undefined,
        message,
        attachments: attachments.map((a) => ({ name: a.name, url: a.url, size: a.size, type: a.type })),
      };

      const res = await api.post('/subscriptions/bulk-send-message', payload);
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Lỗi gửi tin nhắn');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50/60 via-slate-50 to-indigo-50/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Gửi Tin Nhắn & Thông Báo Khách Hàng</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {recipients.length} khách hàng
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Gửi thông báo cập nhật tính năng mới, gia hạn hoặc chăm sóc qua Email & Zalo Bot
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recipients Summary Pills */}
        <div className="px-6 py-2.5 bg-slate-50/80 border-b border-slate-200/70 flex items-center justify-between gap-3 text-xs overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0 font-medium text-slate-600">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Người nhận:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-1 overflow-x-auto py-0.5 no-scrollbar">
            {recipients.slice(0, 5).map((r) => (
              <span
                key={r.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs font-medium whitespace-nowrap"
              >
                <span>{r.customerName}</span>
                {r.serviceName && (
                  <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-1 rounded">
                    {r.serviceName}
                  </span>
                )}
                {onRemoveRecipient && (
                  <button
                    type="button"
                    onClick={() => onRemoveRecipient(r.id)}
                    className="text-slate-400 hover:text-rose-600 ml-0.5"
                    title="Bỏ người nhận này"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
            {recipients.length > 5 && (
              <span className="text-slate-500 font-semibold px-2 py-0.5 bg-slate-200/70 rounded-md text-[11px] whitespace-nowrap">
                +{recipients.length - 5} người khác
              </span>
            )}
          </div>

          {defaultServiceName && (
            <div className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg shrink-0">
              <Layers className="w-3 h-3 text-indigo-600" />
              <span>Gói: {defaultServiceName}</span>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Row 1: Channels & Template Selection */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Kênh gửi */}
            <div className="md:col-span-5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Kênh Gửi Tin Nhắn
              </label>
              <div className="flex items-center gap-3">
                <label
                  className={`flex-1 flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    channels.includes('EMAIL')
                      ? 'bg-blue-50/80 border-blue-400 text-blue-900 font-semibold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={channels.includes('EMAIL')}
                    onChange={() => toggleChannel('EMAIL')}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                  <Mail className={`w-4 h-4 ${channels.includes('EMAIL') ? 'text-blue-600' : 'text-slate-400'}`} />
                  <div className="text-xs">
                    <div>Email</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      {emailEligibleCount}/{recipients.length} có Email
                    </div>
                  </div>
                </label>

                <label
                  className={`flex-1 flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    channels.includes('ZALO')
                      ? 'bg-emerald-50/80 border-emerald-400 text-emerald-900 font-semibold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={channels.includes('ZALO')}
                    onChange={() => toggleChannel('ZALO')}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                  <MessageSquare
                    className={`w-4 h-4 ${channels.includes('ZALO') ? 'text-emerald-600' : 'text-slate-400'}`}
                  />
                  <div className="text-xs">
                    <div>Zalo Bot</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      {zaloEligibleCount}/{recipients.length} có SĐT
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Chọn mẫu tin nhắn từ Định Dạng */}
            <div className="md:col-span-7 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mẫu Tin Nhắn (Đã Lọc Phù Hợp)
                </label>
                <span className="text-[11px] text-slate-400">
                  {filteredTemplates.length} mẫu có sẵn
                </span>
              </div>
              <div className="relative">
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium text-slate-800 cursor-pointer"
                >
                  <option value="">-- Soạn thảo tự do (Không dùng mẫu) --</option>
                  {filteredTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.channel === 'ZALO' ? 'Zalo' : 'Email'}] {t.name}{' '}
                      {t.triggerType === 'CUSTOM' ? '(Cập nhật / Tùy chỉnh)' : '(Nhắc hạn)'}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-slate-500">
                Chỉ hiển thị mẫu thông báo dịch vụ & nhắc hạn, đã loại bỏ các mẫu xuất hóa đơn #HD.
              </p>
            </div>
          </div>

          {/* Mode Switcher: Soạn thảo vs Xem trước */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewMode('editor')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  previewMode === 'editor'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Soạn Thảo Nội Dung</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewMode('preview')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  previewMode === 'preview'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem Trước ({sampleRecipient.customerName})</span>
              </button>
            </div>

            {previewMode === 'preview' && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500 text-[11px]">Kênh:</span>
                <button
                  type="button"
                  onClick={() => setPreviewChannel('EMAIL')}
                  className={`px-2 py-0.5 rounded font-medium ${
                    previewChannel === 'EMAIL' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewChannel('ZALO')}
                  className={`px-2 py-0.5 rounded font-medium ${
                    previewChannel === 'ZALO' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Zalo
                </button>
              </div>
            )}
          </div>

          {/* Content Area */}
          {previewMode === 'editor' ? (
            <div className="space-y-4">
              {/* Tiêu đề (áp dụng cho Email) */}
              {channels.includes('EMAIL') && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Tiêu Đề Email <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">Có thể dùng biến {'{{customerName}}'}, {'{{serviceName}}'}</span>
                  </div>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="VD: [Invoice-AIR] Cập nhật phiên bản mới dịch vụ Nt AI Writer"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-900"
                  />
                </div>
              )}

              {/* Nội dung tin nhắn */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Nội Dung Tin Nhắn / Email <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Hỗ trợ định dạng văn bản & các biến tự động</span>
                </div>
                <textarea
                  rows={8}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Nhập nội dung thông báo hoặc cập nhật dịch vụ cho khách hàng..."
                  className="w-full px-3.5 py-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed text-slate-800 font-mono text-[13px]"
                />
              </div>

              {/* Danh sách biến thay thế nhanh */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Bấm vào biến bên dưới để chèn nhanh vào nội dung:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { tag: '{{customerName}}', label: 'Tên Khách Hàng' },
                    { tag: '{{serviceName}}', label: 'Tên Dịch Vụ' },
                    { tag: '{{customerEmail}}', label: 'Email KH' },
                    { tag: '{{customerPhone}}', label: 'SĐT KH' },
                    { tag: '{{endDate}}', label: 'Hạn Dùng' },
                    { tag: '{{brandName}}', label: 'Tên Công Ty' },
                    { tag: '{{hotline}}', label: 'Hotline' },
                  ].map((v) => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => insertVariable(v.tag)}
                      className="px-2.5 py-1 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors shadow-2xs cursor-pointer"
                      title={`Chèn biến ${v.tag}`}
                    >
                      <span className="text-blue-600 font-bold">{v.tag}</span>
                      <span className="text-slate-400 ml-1">({v.label})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tệp đính kèm (nếu có từ mẫu) */}
              {attachments.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                      <span>Tài Liệu / Tệp Đính Kèm ({attachments.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachments([])}
                      className="text-slate-400 hover:text-rose-600 text-[11px]"
                    >
                      Xóa tất cả tệp
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                      >
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline truncate max-w-sm"
                        >
                          📎 {att.name}
                        </a>
                        <button
                          type="button"
                          onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Live Preview */
            <div className="space-y-3">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center justify-between">
                <span>
                  Đang xem trước mẫu gửi cho khách hàng: <strong>{sampleRecipient.customerName}</strong> (
                  {sampleRecipient.customerEmail || sampleRecipient.customerPhone || 'Chưa có thông tin'})
                </span>
                <span className="text-[11px] font-semibold text-blue-600">Dịch vụ: {sampleRecipient.serviceName}</span>
              </div>

              {previewChannel === 'EMAIL' ? (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Tiêu Đề Email:</div>
                    <div className="text-base font-bold text-slate-900">{previewSubject || '(Chưa có tiêu đề)'}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Đến: <span className="font-mono text-slate-700">{sampleRecipient.customerEmail || 'khachhang@example.com'}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm leading-relaxed text-slate-800 whitespace-pre-line font-sans">
                    {previewContent || '(Chưa có nội dung)'}
                  </div>

                  {attachments.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                      <div className="font-semibold text-slate-600">Tệp đính kèm gửi kèm:</div>
                      {attachments.map((a, i) => (
                        <div key={i} className="text-blue-600 font-medium">
                          📎 {a.name}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-slate-400 pt-2 border-t border-slate-100">
                    Trân trọng,<br />
                    <strong>{settings?.companyName || 'Invoice-AIR'}</strong>
                    {settings?.phone && ` | Hotline: ${settings.phone}`}
                  </div>
                </div>
              ) : (
                /* Zalo Preview Bubble */
                <div className="bg-slate-100 border border-slate-200 rounded-xl p-6 flex justify-center">
                  <div className="max-w-md w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                        Z
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-800">
                          {settings?.companyName || 'Invoice-AIR'} (Zalo Bot)
                        </div>
                        <div className="text-[10px] text-slate-400">Gửi tới {sampleRecipient.customerPhone || '090xxxxxxx'}</div>
                      </div>
                    </div>

                    <div className="bg-blue-50/60 p-3 rounded-xl text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                      {previewContent || '(Chưa có nội dung)'}
                    </div>

                    <div className="text-[10px] text-slate-400 text-right">
                      Vừa xong • Tin nhắn tự động qua Zalo Bot Gateway
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info banner about Queue */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-800">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Xử lý an toàn qua Hàng đợi (Queue): </span>
              Toàn bộ tin nhắn sẽ được đưa vào hàng đợi chạy nền với cơ chế giãn cách và tự động thử lại khi lỗi, đảm
              bảo không bị khóa tài khoản hoặc gián đoạn trình duyệt.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-all cursor-pointer"
          >
            Hủy Bỏ
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || recipients.length === 0}
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-bounce' : ''}`} />
            <span>
              {isSubmitting
                ? 'Đang nạp vào hàng đợi...'
                : `Gửi Tin Nhắn (${recipients.length} Khách Hàng)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
