import React from 'react';
import { Mail, MessageSquare, Paperclip } from 'lucide-react';
import { MessageTemplate } from './types';
import { renderMockText } from './constants';

interface MessagePreviewModalProps {
  template: MessageTemplate | null;
  onClose: () => void;
}

export function MessagePreviewModal({ template, onClose }: MessagePreviewModalProps) {
  if (!template) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full flex flex-col max-h-[92vh] border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 ${
          template.channel === 'EMAIL' ? 'max-w-5xl' : 'max-w-2xl'
        }`}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-2xl ${
                template.channel === 'EMAIL'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-sky-100 text-sky-600'
              }`}
            >
              {template.channel === 'EMAIL' ? (
                <Mail className="w-5 h-5" />
              ) : (
                <MessageSquare className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  Xem Trước: {template.name}
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${
                    template.channel === 'EMAIL'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-sky-50 text-sky-700 border border-sky-200'
                  }`}
                >
                  {template.channel}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Sự kiện kích hoạt:{' '}
                <span className="font-semibold text-slate-700">
                  {template.triggerType === 'PAYMENT_SUCCESS'
                    ? 'Khi thanh toán thành công'
                    : 'Khi tạo hóa đơn mới'}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {template.channel === 'EMAIL' ? (
            <>
              {/* Email Client Header Bar */}
              {template.subject && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-slate-500 shrink-0 mt-0.5">Tiêu đề:</span>
                    <span className="font-bold text-slate-900 text-sm leading-snug">
                      {renderMockText(template.subject)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1.5 border-t border-slate-200/60">
                    <span>
                      <strong>Từ:</strong> Tetrasco &lt;contact@airobotics.edu.vn&gt;
                    </span>
                    <span>
                      <strong>Tới:</strong> Nguyễn Thành Đạt &lt;datnt@example.com&gt;
                    </span>
                    <span className="text-slate-400">
                      {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })},{' '}
                      {new Date().toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              )}

              {/* Email Body Frame (Spacious & Scaled) */}
              <div className="bg-slate-100/90 rounded-2xl p-4 sm:p-8 border border-slate-200/80 flex justify-center items-start min-h-[460px]">
                <div className="w-full max-w-[800px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <iframe
                    title="Xem trước nội dung email"
                    sandbox=""
                    referrerPolicy="no-referrer"
                    srcDoc={renderMockText(template.content)}
                    className="w-full h-[640px] bg-white border-0"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Zalo Mobile / Chat Interface Preview */
            <div className="bg-slate-100/90 rounded-2xl p-4 sm:p-6 border border-slate-200/80 flex flex-col items-center">
              <div className="text-xs text-slate-400 text-center mb-3 font-medium">
                Mô phỏng tin nhắn Zalo gửi tới khách hàng
              </div>

              <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
                {/* Zalo App Bar */}
                <div className="bg-[#0068ff] text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-bold text-sm text-white">
                      AI
                    </div>
                    <div>
                      <div className="font-bold text-sm leading-tight flex items-center gap-1.5">
                        <span>AI WRITER</span>
                        <span className="w-3.5 h-3.5 rounded-full bg-white text-[#0068ff] text-[9px] flex items-center justify-center font-bold">
                          ✓
                        </span>
                      </div>
                      <p className="text-xs text-white/90">Tài khoản doanh nghiệp xác thực</p>
                    </div>
                  </div>
                  <span className="text-xs text-white/70">Zalo OA</span>
                </div>

                {/* Zalo Message Body */}
                <div className="bg-[#e5effa] p-5 min-h-[380px] max-h-[560px] overflow-y-auto space-y-3 flex flex-col justify-end">
                  <div className="text-center">
                    <span className="px-3 py-1 bg-black/10 text-slate-600 rounded-full text-xs font-medium">
                      Hôm nay
                    </span>
                  </div>

                  <div className="bg-white rounded-2xl rounded-tl-xs p-4 sm:p-5 shadow-xs border border-slate-200/80 text-sm sm:text-base text-slate-800 whitespace-pre-line leading-relaxed font-sans max-w-[94%]">
                    {renderMockText(template.content)}
                    <div className="text-xs text-slate-400 text-right mt-2 font-mono">
                      {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • Đã nhận
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Attachments */}
          {template.attachments && template.attachments.length > 0 && (
            <div className="pt-3 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-700 block mb-2">
                📎 File & tài liệu đính kèm kèm theo tin nhắn:
              </span>
              <div className="flex flex-wrap gap-2">
                {template.attachments.map((att, idx) => (
                  <a
                    key={idx}
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{att.name}</span>
                    {att.size && (
                      <span className="text-xs text-emerald-600 font-mono">
                        ({(att.size / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Hiển thị dữ liệu giả định để kiểm tra trực quan
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            Đóng Xem Trước
          </button>
        </div>
      </div>
    </div>
  );
}
