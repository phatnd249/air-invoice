import React, { useState, useRef } from 'react';
import {
  MessageSquare,
  Mail,
  Maximize2,
  Minimize2,
  Paperclip,
  Upload,
  Link as LinkIcon,
  Save,
  Check,
} from 'lucide-react';
import EmailVisualEditor from '@/components/EmailVisualEditor';
import { api } from '@/lib/api';
import {
  MessageFormData,
  AttachmentFile,
  ServiceCatalogItem,
} from './types';
import { TEMPLATE_VARIABLES } from './constants';

interface MessageTemplateModalProps {
  isOpen: boolean;
  editingMsgId: string | null;
  msgFormData: MessageFormData;
  setMsgFormData: React.Dispatch<React.SetStateAction<MessageFormData>>;
  servicesList: ServiceCatalogItem[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function MessageTemplateModal({
  isOpen,
  editingMsgId,
  msgFormData,
  setMsgFormData,
  servicesList,
  isPending,
  onClose,
  onSubmit,
}: MessageTemplateModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState<{ name: string; url: string }>({ name: '', url: '' });
  const [showAddUrlBox, setShowAddUrlBox] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsFullscreen(false);
    setShowAddUrlBox(false);
    onClose();
  };

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div
        className={`bg-white shadow-2xl transition-all duration-200 flex flex-col overflow-hidden ${
          isFullscreen
            ? 'fixed inset-0 rounded-none w-full h-full p-4 sm:p-6'
            : 'rounded-2xl max-w-5xl w-full max-h-[94vh] p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150'
        }`}
      >
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div
              className={`p-2 rounded-xl text-white ${
                msgFormData.channel === 'ZALO' ? 'bg-blue-600' : 'bg-emerald-600'
              }`}
            >
              {msgFormData.channel === 'ZALO' ? (
                <MessageSquare className="w-5 h-5" />
              ) : (
                <Mail className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                {editingMsgId ? 'Chỉnh Sửa Mẫu Tin Nhắn' : 'Tạo Mẫu Tin Nhắn Mới'}
              </h3>
              <p className="text-xs text-slate-500">
                {msgFormData.channel === 'EMAIL'
                  ? 'Tùy chỉnh tiêu đề, giao diện trực quan hoặc mã HTML cho email khách hàng'
                  : 'Nội dung tin nhắn tự động gửi qua Zalo Bot'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {msgFormData.channel === 'EMAIL' && (
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title={isFullscreen ? 'Thu nhỏ giao diện' : 'Mở rộng toàn màn hình'}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
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

          {/* Bộ Soạn Thảo Nội Dung: Email Trực Quan hoặc Zalo */}
          {msgFormData.channel === 'EMAIL' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nội Dung Email &amp; Giao Diện *
              </label>
              <EmailVisualEditor
                content={msgFormData.content}
                onChange={(newContent) => setMsgFormData({ ...msgFormData, content: newContent })}
                triggerType={msgFormData.triggerType}
                variables={TEMPLATE_VARIABLES}
                isFullscreen={isFullscreen}
              />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nội Dung Tin Nhắn Zalo *
                </label>
                <span className="text-[11px] text-slate-400">Bấm vào tag bên dưới để chèn nhanh</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                {TEMPLATE_VARIABLES.map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => insertTag(v.tag)}
                    className="px-2 py-0.5 bg-white hover:bg-blue-50 hover:text-blue-600 text-slate-700 border border-slate-200 rounded text-xs font-mono transition-colors shadow-2xs cursor-pointer"
                    title={v.desc}
                  >
                    {v.tag}
                  </button>
                ))}
              </div>

              <textarea
                ref={textareaRef}
                rows={8}
                required
                placeholder="Nhập nội dung tin nhắn Zalo gửi tới khách hàng..."
                value={msgFormData.content}
                onChange={(e) => setMsgFormData({ ...msgFormData, content: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none font-sans"
              />
            </div>
          )}

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
                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Upload className="w-3 h-3 text-blue-600" />
                  <span>{isUploadingFile ? 'Đang tải...' : 'Tải File Lên'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddUrlBox(!showAddUrlBox)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
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
                    className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustomUrl}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-2xs cursor-pointer"
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
                        className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
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
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{editingMsgId ? 'Lưu Thay Đổi' : 'Tạo Mẫu Tin Nhắn'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
