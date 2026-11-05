'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import InvoiceDesignerModal from '@/components/InvoiceDesignerModal';
import PaymentRulesConfig from '@/components/PaymentRulesConfig';
import {
  TemplateTabType,
  MessageTemplate,
  MessageFormData,
  ServiceCatalogItem,
  InvoiceDesignTemplate,
} from '@/components/templates/types';
import { DEFAULT_PRESET_TEMPLATES } from '@/components/templates/constants';
import { TemplatesHeader } from '@/components/templates/TemplatesHeader';
import { TemplatesTabsNav } from '@/components/templates/TemplatesTabsNav';
import { InvoiceTemplatesTab } from '@/components/templates/InvoiceTemplatesTab';
import { MessageTemplatesTab } from '@/components/templates/MessageTemplatesTab';
import { MessageTemplateModal } from '@/components/templates/MessageTemplateModal';
import { MessagePreviewModal } from '@/components/templates/MessagePreviewModal';
import { InvoicePreviewModal } from '@/components/templates/InvoicePreviewModal';

const INITIAL_MSG_FORM: MessageFormData = {
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
};

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TemplateTabType>('a4');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'vietqr' || tab === 'zalo' || tab === 'email' || tab === 'a4') {
        setActiveTab(tab as TemplateTabType);
      }
    }
  }, []);

  // Designer & Preview Modals for A4 Template
  const [isDesignerModalOpen, setIsDesignerModalOpen] = useState(false);
  const [editingDesignTemplate, setEditingDesignTemplate] = useState<InvoiceDesignTemplate | null>(null);
  const [previewDesignTemplate, setPreviewDesignTemplate] = useState<InvoiceDesignTemplate | null>(null);

  // Message Template Modal & Filter
  const [triggerFilter, setTriggerFilter] = useState<string>('all');
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [msgFormData, setMsgFormData] = useState<MessageFormData>(INITIAL_MSG_FORM);
  const [previewMsgModal, setPreviewMsgModal] = useState<MessageTemplate | null>(null);

  // 1. Fetch Invoice Design Templates
  const { data: invoiceDesignTemplates = [] } = useQuery<InvoiceDesignTemplate[]>({
    queryKey: ['invoice-templates'],
    queryFn: async () => {
      const res = await api.get('/invoice-templates');
      return res.data;
    },
  });

  const effectiveTemplates =
    invoiceDesignTemplates.length > 0 ? invoiceDesignTemplates : DEFAULT_PRESET_TEMPLATES;

  // 2. Fetch Message Templates
  const { data: messageTemplates = [], isLoading: isLoadingTemplates } = useQuery<MessageTemplate[]>({
    queryKey: ['message-templates'],
    queryFn: async () => {
      const res = await api.get('/message-templates');
      return res.data;
    },
  });

  // 3. Fetch Services
  const { data: servicesList = [] } = useQuery<ServiceCatalogItem[]>({
    queryKey: ['services-for-template'],
    queryFn: async () => {
      const res = await api.get('/services');
      return res.data;
    },
  });

  // ================= MUTATIONS FOR A4 TEMPLATES =================
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

  // ================= MUTATIONS FOR MESSAGE TEMPLATES =================
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

  // ================= MODAL HANDLERS =================
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

  // Lọc mẫu tin nhắn theo tab và trigger
  const filteredTemplates = messageTemplates.filter((t) => {
    if (activeTab === 'zalo' && t.channel !== 'ZALO') return false;
    if (activeTab === 'email' && t.channel !== 'EMAIL') return false;
    if (triggerFilter !== 'all' && t.triggerType !== triggerFilter) return false;
    return true;
  });

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* 1. Header */}
      <TemplatesHeader
        activeTab={activeTab}
        onOpenCreateDesignModal={() => {
          setEditingDesignTemplate(null);
          setIsDesignerModalOpen(true);
        }}
        onOpenCreateMsgModal={openCreateMsgModal}
      />

      {/* 2. Tabs Navigation */}
      <TemplatesTabsNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 3. Tab 1: Mẫu Hóa Đơn A4 */}
      {activeTab === 'a4' && (
        <InvoiceTemplatesTab
          effectiveTemplates={effectiveTemplates}
          onPreview={(tpl) => setPreviewDesignTemplate(tpl)}
          onEdit={(tpl) => {
            setEditingDesignTemplate(tpl);
            setIsDesignerModalOpen(true);
          }}
          onDuplicate={(tpl) => {
            setEditingDesignTemplate({
              ...tpl,
              id: undefined,
              isDefault: false,
              name: `${tpl.name} (Bản sao)`,
              code: undefined,
            });
            setIsDesignerModalOpen(true);
          }}
          onSetDefault={(id) => setDefaultTemplateMutation.mutate(id)}
          isSetDefaultPending={setDefaultTemplateMutation.isPending}
          onDelete={(id, name) => {
            if (confirm(`Bạn có chắc chắn muốn xóa mẫu thiết kế "${name}"?`)) {
              deleteTemplateMutation.mutate(id);
            }
          }}
        />
      )}

      {/* 4. Tab 2 & 3: Mẫu Tin Nhắn Zalo & Email */}
      {(activeTab === 'zalo' || activeTab === 'email') && (
        <MessageTemplatesTab
          activeTab={activeTab}
          triggerFilter={triggerFilter}
          onTriggerFilterChange={setTriggerFilter}
          messageTemplates={messageTemplates}
          filteredTemplates={filteredTemplates}
          servicesList={servicesList}
          isLoadingTemplates={isLoadingTemplates}
          onOpenCreateMsgModal={openCreateMsgModal}
          onOpenEditMsgModal={openEditMsgModal}
          onPreview={(t) => setPreviewMsgModal(t)}
          onDelete={(id, name) => {
            if (confirm(`Bạn có chắc muốn xóa mẫu "${name}"?`)) {
              deleteMsgMutation.mutate(id);
            }
          }}
        />
      )}

      {/* 5. Tab 4: Nội Dung Chuyển Khoản (VietQR) */}
      {activeTab === 'vietqr' && <PaymentRulesConfig />}

      {/* 6. Modal Tạo / Sửa Mẫu Tin Nhắn (Zalo / Email) */}
      <MessageTemplateModal
        isOpen={isMsgModalOpen}
        editingMsgId={editingMsgId}
        msgFormData={msgFormData}
        setMsgFormData={setMsgFormData}
        servicesList={servicesList}
        isPending={createMsgMutation.isPending || updateMsgMutation.isPending}
        onClose={closeMsgModal}
        onSubmit={handleMsgSubmit}
      />

      {/* 7. Modal Xem Trước Tin Nhắn (Preview) */}
      <MessagePreviewModal
        template={previewMsgModal}
        onClose={() => setPreviewMsgModal(null)}
      />

      {/* 8. Modal Xem Trước Mẫu Hóa Đơn A4 */}
      <InvoicePreviewModal
        template={previewDesignTemplate}
        onClose={() => setPreviewDesignTemplate(null)}
        onEdit={(tpl) => {
          setEditingDesignTemplate(tpl);
          setPreviewDesignTemplate(null);
          setIsDesignerModalOpen(true);
        }}
      />

      {/* 9. Modal Thiết Kế Mẫu Trực Quan */}
      <InvoiceDesignerModal
        isOpen={isDesignerModalOpen}
        onClose={() => setIsDesignerModalOpen(false)}
        initialTemplate={editingDesignTemplate}
      />
    </div>
  );
}
