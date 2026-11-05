import React from 'react';
import {
  MessageSquare,
  Mail,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Check,
  Paperclip,
  Info,
} from 'lucide-react';
import { MessageTemplate, ServiceCatalogItem } from './types';

interface MessageTemplatesTabProps {
  activeTab: 'zalo' | 'email';
  triggerFilter: string;
  onTriggerFilterChange: (filter: string) => void;
  messageTemplates: MessageTemplate[];
  filteredTemplates: MessageTemplate[];
  servicesList: ServiceCatalogItem[];
  isLoadingTemplates: boolean;
  onOpenCreateMsgModal: (channel: 'ZALO' | 'EMAIL') => void;
  onOpenEditMsgModal: (t: MessageTemplate) => void;
  onPreview: (t: MessageTemplate) => void;
  onDelete: (id: string, name: string) => void;
}

export function MessageTemplatesTab({
  activeTab,
  triggerFilter,
  onTriggerFilterChange,
  messageTemplates,
  filteredTemplates,
  servicesList,
  isLoadingTemplates,
  onOpenCreateMsgModal,
  onOpenEditMsgModal,
  onPreview,
  onDelete,
}: MessageTemplatesTabProps) {
  const channelCount =
    activeTab === 'zalo'
      ? messageTemplates.filter((t) => t.channel === 'ZALO').length
      : messageTemplates.filter((t) => t.channel === 'EMAIL').length;

  return (
    <div className="space-y-6">
      {/* Subfilter theo sự kiện */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-semibold text-slate-500">Lọc theo sự kiện:</span>
          <button
            onClick={() => onTriggerFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              triggerFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Tất cả ({channelCount})
          </button>
          <button
            onClick={() => onTriggerFilterChange('INVOICE_CREATED')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              triggerFilter === 'INVOICE_CREATED'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Khi Tạo Hóa Đơn
          </button>
          <button
            onClick={() => onTriggerFilterChange('PAYMENT_SUCCESS')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
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
            onClick={() => onOpenCreateMsgModal(activeTab === 'zalo' ? 'ZALO' : 'EMAIL')}
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs space-x-1.5 cursor-pointer"
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
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
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
                            <span className="text-xs bg-slate-900 text-white px-2.5 py-0.5 rounded-full font-semibold">
                              Mặc định
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => onPreview(template)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Xem trước tin nhắn"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onOpenEditMsgModal(template)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {!template.isDefault && (
                        <button
                          onClick={() => onDelete(template.id, template.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
                    onClick={() => onOpenEditMsgModal(template)}
                    className="text-blue-600 hover:underline font-semibold cursor-pointer"
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
  );
}
