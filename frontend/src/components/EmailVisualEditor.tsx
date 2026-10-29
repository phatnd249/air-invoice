'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Code,
  Eye,
  Palette,
  Sparkles,
  Smartphone,
  Monitor,
  RotateCcw,
  PlusCircle,
  HelpCircle,
  Check,
  ChevronDown,
} from 'lucide-react';

interface EmailVisualEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  triggerType?: 'INVOICE_CREATED' | 'PAYMENT_SUCCESS';
  variables?: Array<{ tag: string; desc: string }>;
  isFullscreen?: boolean;
}

// Bộ màu hỗ trợ
const COLOR_OPTIONS = [
  { name: 'Mặc định', color: '#1e293b' },
  { name: 'Xanh dương', color: '#2563eb' },
  { name: 'Xanh lá', color: '#059669' },
  { name: 'Đỏ', color: '#dc2626' },
  { name: 'Tím', color: '#7c3aed' },
  { name: 'Cam', color: '#ea580c' },
  { name: 'Xám', color: '#64748b' },
];

export default function EmailVisualEditor({
  content,
  onChange,
  triggerType = 'INVOICE_CREATED',
  variables = [],
  isFullscreen = false,
}: EmailVisualEditorProps) {
  const [editorMode, setEditorMode] = useState<'visual' | 'form' | 'code' | 'preview'>('visual');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showTemplatePresets, setShowTemplatePresets] = useState(false);

  // Form state cho chế độ "Soạn Thảo Nhanh Bằng Form" (Dành cho người không biết code)
  const [formData, setFormData] = useState({
    headerTitle: triggerType === 'PAYMENT_SUCCESS' ? 'XÁC NHẬN THANH TOÁN THÀNH CÔNG' : 'THÔNG BÁO HÓA ĐƠN & NHẮC LỊCH THANH TOÁN',
    headerSubtitle: triggerType === 'PAYMENT_SUCCESS' ? 'Biên lai thu tiền điện tử - Hệ thống {{brandName}}' : 'Hệ thống tạo & quản lý hóa đơn tự động {{brandName}}',
    greeting: 'Kính gửi Quý khách hàng {{customerName}},',
    introText:
      triggerType === 'PAYMENT_SUCCESS'
        ? '{{brandName}} xin trân trọng thông báo: Chúng tôi đã nhận được thanh toán đầy đủ cho đơn hàng của Quý khách. Gói dịch vụ đã được kích hoạt thành công trên hệ thống.'
        : 'Lời đầu tiên, {{brandName}} xin chân thành cảm ơn Quý khách đã tin tưởng và đăng ký sử dụng dịch vụ của chúng tôi. Hệ thống đã khởi tạo hóa đơn với thông tin chi tiết dưới đây:',
    showInvoiceBox: true,
    buttonText: triggerType === 'PAYMENT_SUCCESS' ? '📄 Xem & Tải Biên Lai Điện Tử Online' : '🔗 Xem Hóa Đơn & Quét Mã VietQR Thanh Toán',
    buttonUrl: '{{viewUrl}}',
    buttonColor: triggerType === 'PAYMENT_SUCCESS' ? '#059669' : '#2563eb',
    noticeText:
      triggerType === 'PAYMENT_SUCCESS'
        ? '🚀 Kích hoạt dịch vụ: Quý khách hiện đã có thể truy cập và sử dụng đầy đủ các tính năng của gói {{packageName}}.'
        : 'Lưu ý: Quý khách vui lòng kiểm tra thông tin tài khoản và cú pháp chuyển khoản {{paymentCode}} để hệ thống tự động kích hoạt dịch vụ ngay sau khi nhận tiền.',
    supportPhone: '{{phone}}',
    signOff: 'Đội ngũ Chăm sóc khách hàng {{brandName}}',
  });

  const visualIframeRef = useRef<HTMLIFrameElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Khởi tạo iframe khi chuyển sang tab visual
  useEffect(() => {
    if (editorMode === 'visual' && visualIframeRef.current) {
      const doc = visualIframeRef.current.contentDocument || visualIframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(content || '<div style="font-family: Arial, sans-serif; padding: 20px;">Nhập nội dung email...</div>');
        doc.close();

        // Bật chế độ chỉnh sửa trực quan
        try {
          doc.designMode = 'on';
          if (doc.body) {
            doc.body.contentEditable = 'true';
            doc.body.style.cursor = 'text';
            doc.body.style.minHeight = '100%';

            // Bắt sự kiện khi người dùng gõ phím trực tiếp trên email
            const handleInput = () => {
              const updated = doc.documentElement.outerHTML;
              onChange(updated);
            };
            doc.body.addEventListener('input', handleInput);
          }
        } catch (e) {
          console.warn('Lỗi bật designMode trong visual editor:', e);
        }
      }
    }
  }, [editorMode]);

  // Thực hiện lệnh định dạng trong iframe Visual
  const execVisualCommand = (command: string, value: string | null = null) => {
    const doc = visualIframeRef.current?.contentDocument;
    if (!doc) return;
    doc.execCommand(command, false, value as any);
    onChange(doc.documentElement.outerHTML);
  };

  // Chèn nút bấm CTA vào vị trí con trỏ
  const insertButtonAtCursor = () => {
    const doc = visualIframeRef.current?.contentDocument;
    if (!doc) return;
    const btnHtml = `
      <div style="text-align: center; margin: 25px 0;">
        <a href="{{viewUrl}}" target="_blank" style="background: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
          👉 Bấm Vào Đây Để Xem Chi Tiết
        </a>
      </div>
    `;
    doc.execCommand('insertHTML', false, btnHtml);
    onChange(doc.documentElement.outerHTML);
  };

  // Chèn khung ghi chú vào vị trí con trỏ
  const insertNoticeAtCursor = () => {
    const doc = visualIframeRef.current?.contentDocument;
    if (!doc) return;
    const noticeHtml = `
      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 18px; margin: 18px 0; border-radius: 6px; font-size: 13.5px; color: #1e40af; line-height: 1.6;">
        💡 <strong>Lưu ý quan trọng:</strong> Nhập hướng dẫn hoặc lưu ý dịch vụ cho khách hàng tại đây...
      </div>
    `;
    doc.execCommand('insertHTML', false, noticeHtml);
    onChange(doc.documentElement.outerHTML);
  };

  // Chèn tag biến vào con trỏ
  const insertTagAtCursor = (tag: string) => {
    if (editorMode === 'visual') {
      const doc = visualIframeRef.current?.contentDocument;
      if (doc) {
        doc.execCommand('insertText', false, tag);
        onChange(doc.documentElement.outerHTML);
      }
    } else if (editorMode === 'code') {
      const el = textareaRef.current;
      if (!el) {
        onChange(content + tag);
        return;
      }
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const nextText = content.substring(0, start) + tag + content.substring(end);
      onChange(nextText);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + tag.length, start + tag.length);
      }, 10);
    }
    setShowTagDropdown(false);
  };

  // Tự động sinh mã HTML chuẩn từ Form dành cho người không biết code
  const generateHtmlFromForm = () => {
    const isPayment = triggerType === 'PAYMENT_SUCCESS';
    const primaryColor = formData.buttonColor || (isPayment ? '#059669' : '#2563eb');
    const headerBg = isPayment
      ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
      : 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)';

    const generated = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${formData.headerTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 650px; margin: 25px auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <!-- Header Banner -->
    <div style="background: ${headerBg}; padding: 26px 20px; text-align: center; color: #ffffff;">
      <div style="font-size: 32px; margin-bottom: 6px;">${isPayment ? '✅' : '🧾'}</div>
      <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
        ${formData.headerTitle}
      </h2>
      <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95;">
        ${formData.headerSubtitle}
      </p>
    </div>

    <!-- Body Content -->
    <div style="padding: 24px 24px 20px; color: #334155; line-height: 1.6; font-size: 14.5px;">
      <p style="margin-top: 0; font-size: 15px; color: #0f172a; font-weight: 600;">
        ${formData.greeting}
      </p>

      <p style="color: #475569; margin: 12px 0 16px;">
        ${formData.introText}
      </p>

      ${
        formData.showInvoiceBox
          ? `
      <!-- Khối chi tiết hóa đơn -->
      <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
        <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; margin-bottom: 10px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 6px;">
          Thông Tin Chi Tiết Giao Dịch
        </div>
        <table style="width: 100%; font-size: 13.5px; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 0; color: #64748b; width: 42%;">Mã hóa đơn:</td>
            <td style="padding: 5px 0; font-weight: bold; color: #0f172a;">#{{invoiceNumber}}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748b;">Gói dịch vụ:</td>
            <td style="padding: 5px 0; font-weight: bold; color: #0f172a;">{{packageName}}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748b;">${isPayment ? 'Số tiền đã thanh toán:' : 'Số tiền cần thanh toán:'}</td>
            <td style="padding: 5px 0; font-size: 16px; font-weight: bold; color: ${primaryColor};">{{grandTotal}}</td>
          </tr>
          ${
            !isPayment
              ? `
          <tr>
            <td style="padding: 5px 0; color: #64748b;">Hạn thanh toán:</td>
            <td style="padding: 5px 0; color: #dc2626; font-weight: 600;">{{dueDate}}</td>
          </tr>`
              : `
          <tr>
            <td style="padding: 5px 0; color: #64748b;">Trạng thái:</td>
            <td style="padding: 5px 0; font-weight: bold; color: #059669;">✅ ĐÃ HOÀN TẤT (PAID IN FULL)</td>
          </tr>`
          }
        </table>
      </div>`
          : ''
      }

      ${
        formData.noticeText
          ? `
      <!-- Khối lưu ý -->
      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 18px 0; border-radius: 4px; font-size: 13.5px; color: #1e40af;">
        ${formData.noticeText}
      </div>`
          : ''
      }

      <!-- Nút kêu gọi hành động (CTA) -->
      <div style="text-align: center; margin: 28px 0;">
        <a href="${formData.buttonUrl}" target="_blank" style="background: ${primaryColor}; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14.5px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15);">
          ${formData.buttonText}
        </a>
      </div>

      <!-- Hỗ trợ & Chân trang -->
      <div style="margin-top: 26px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">
        <p style="margin: 3px 0;">Nếu Quý khách cần hỗ trợ, vui lòng liên hệ:</p>
        <p style="margin: 3px 0;">💬 <strong>Hotline / Zalo:</strong> ${formData.supportPhone}</p>
      </div>

      <p style="margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 14px; color: #64748b; font-size: 13px;">
        Trân trọng cảm ơn Quý khách,<br />
        <strong style="color: #0f172a;">${formData.signOff}</strong>
      </p>
    </div>

    <!-- Footer Copyright -->
    <div style="background: #0f172a; padding: 14px 20px; text-align: center; font-size: 11.5px; color: #94a3b8;">
      Email được gửi tự động từ hệ thống {{brandName}}. Vui lòng không phản hồi thư này.
    </div>
  </div>
</body>
</html>
    `.trim();

    onChange(generated);
    setEditorMode('visual');
  };

  // Tạo nội dung preview với các biến giả lập
  const getSimulatedHtml = () => {
    const sampleReplacements: Record<string, string> = {
      '{{customerName}}': 'Nguyễn Văn An',
      '{buyerName}': 'Nguyễn Văn An',
      '{{invoiceNumber}}': 'HD-000048',
      '{{grandTotal}}': '1.500.000 ₫',
      '{{packageName}}': 'Gói Dịch Vụ AI Writer Pro (1 Năm)',
      '{{viewUrl}}': 'https://invoice.share4happy.com/view/sample-token',
      '{{paymentCode}}': 'HD000048',
      '{{dueDate}}': '29/10/2026',
      '{{brandName}}': 'AI WRITER',
      '{{phone}}': '0812305046',
      '{{bankCode}}': 'Vietcombank',
      '{{bankAccount}}': '1029384756',
    };

    let simulated = content || '';
    for (const [tag, val] of Object.entries(sampleReplacements)) {
      const reg = new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      simulated = simulated.replace(reg, val);
    }
    return simulated;
  };

  return (
    <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
      {/* Thanh điều hướng chế độ (Tabs) */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setEditorMode('visual')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              editorMode === 'visual'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>🎨 Soạn Thảo Trực Quan</span>
          </button>

          <button
            type="button"
            onClick={() => setEditorMode('form')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              editorMode === 'form'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
            title="Dành cho người không biết code: Điền form để tự động sinh email đẹp"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>📝 Form Điền Nhanh (Dễ Nhất)</span>
          </button>

          <button
            type="button"
            onClick={() => setEditorMode('code')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              editorMode === 'code'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>💻 Mã HTML (Nâng Cao)</span>
          </button>

          <button
            type="button"
            onClick={() => setEditorMode('preview')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              editorMode === 'preview'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>👁️ Xem Trước Thực Tế</span>
          </button>
        </div>

        {/* Nút chèn biến nhanh (Tags Dropdown) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTagDropdown(!showTagDropdown)}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs"
          >
            <span>+ Chèn Thẻ Biến Tự Động</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {showTagDropdown && (
            <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 max-h-72 overflow-y-auto">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Danh sách biến thay thế
              </div>
              {variables.map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => insertTagAtCursor(v.tag)}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-blue-50 text-xs flex flex-col transition-colors"
                >
                  <span className="font-mono font-bold text-blue-600">{v.tag}</span>
                  <span className="text-[11px] text-slate-500">{v.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= CHẾ ĐỘ 1: SOẠN THẢO TRỰC QUAN (WYSIWYG) ================= */}
      {editorMode === 'visual' && (
        <div className="flex flex-col flex-1">
          {/* Thanh công cụ định dạng (Formatting Toolbar) */}
          <div className="flex items-center flex-wrap gap-1 p-2 bg-white border-b border-slate-200 text-xs">
            <div className="flex items-center space-x-0.5 border-r border-slate-200 pr-1.5 mr-1">
              <button
                type="button"
                onClick={() => execVisualCommand('bold')}
                className="p-1.5 text-slate-700 hover:bg-slate-100 rounded font-bold"
                title="In đậm (Ctrl+B)"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => execVisualCommand('italic')}
                className="p-1.5 text-slate-700 hover:bg-slate-100 rounded italic"
                title="In nghiêng (Ctrl+I)"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => execVisualCommand('underline')}
                className="p-1.5 text-slate-700 hover:bg-slate-100 rounded underline"
                title="Gạch chân (Ctrl+U)"
              >
                <Underline className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-0.5 border-r border-slate-200 pr-1.5 mr-1">
              <button
                type="button"
                onClick={() => execVisualCommand('formatBlock', '<h1>')}
                className="px-2 py-1 text-slate-700 hover:bg-slate-100 rounded font-bold"
                title="Tiêu đề lớn H1"
              >
                H1
              </button>
              <button
                type="button"
                onClick={() => execVisualCommand('formatBlock', '<h2>')}
                className="px-2 py-1 text-slate-700 hover:bg-slate-100 rounded font-bold"
                title="Tiêu đề phụ H2"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => execVisualCommand('formatBlock', '<p>')}
                className="px-2 py-1 text-slate-700 hover:bg-slate-100 rounded"
                title="Đoạn văn bản thường"
              >
                Văn bản
              </button>
            </div>

            <div className="flex items-center space-x-0.5 border-r border-slate-200 pr-1.5 mr-1">
              <button
                type="button"
                onClick={() => execVisualCommand('justifyLeft')}
                className="p-1.5 text-slate-700 hover:bg-slate-100 rounded"
                title="Căn trái"
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => execVisualCommand('justifyCenter')}
                className="p-1.5 text-slate-700 hover:bg-slate-100 rounded"
                title="Căn giữa"
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => execVisualCommand('justifyRight')}
                className="p-1.5 text-slate-700 hover:bg-slate-100 rounded"
                title="Căn phải"
              >
                <AlignRight className="w-4 h-4" />
              </button>
            </div>

            {/* Bảng chọn màu chữ */}
            <div className="relative border-r border-slate-200 pr-1.5 mr-1">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-1.5 text-slate-700 hover:bg-slate-100 rounded flex items-center space-x-1"
                title="Đổi màu chữ"
              >
                <Palette className="w-4 h-4 text-blue-600" />
              </button>

              {showColorPicker && (
                <div className="absolute left-0 mt-1.5 p-2 bg-white border border-slate-200 rounded-xl shadow-xl z-30 flex space-x-1.5">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => {
                        execVisualCommand('foreColor', c.color);
                        setShowColorPicker(false);
                      }}
                      className="w-5 h-5 rounded-full border border-slate-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Các thành phần email chuyên dụng */}
            <button
              type="button"
              onClick={insertButtonAtCursor}
              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-semibold transition-colors"
              title="Chèn nút bấm chuyển hướng (Call to action)"
            >
              <span>🔘 + Nút Bấm (CTA)</span>
            </button>

            <button
              type="button"
              onClick={insertNoticeAtCursor}
              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded font-semibold transition-colors"
              title="Chèn khung ghi chú / hướng dẫn"
            >
              <span>📢 + Khung Lưu Ý</span>
            </button>
          </div>

          <div className="p-1 bg-amber-50/70 border-b border-amber-200/60 text-[11px] text-amber-800 text-center font-medium">
            💡 Bạn có thể bấm chuột trực tiếp vào nội dung email bên dưới để gõ chữ, xóa hoặc sửa đổi nội dung như Word!
          </div>

          {/* Iframe trực quan */}
          <div className="flex-1 bg-slate-100 p-3 sm:p-4 overflow-y-auto">
            <iframe
              ref={visualIframeRef}
              title="Visual Email Canvas"
              className="w-full bg-white rounded-lg shadow-sm border border-slate-300"
              style={{
                height: isFullscreen ? 'calc(100vh - 380px)' : '460px',
                minHeight: '400px',
              }}
            />
          </div>
        </div>
      )}

      {/* ================= CHẾ ĐỘ 2: FORM ĐIỀN NHANH (DÀNH CHO NGƯỜI KHÔNG BIẾT CODE) ================= */}
      {editorMode === 'form' && (
        <div
          className="p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50"
          style={{ height: isFullscreen ? 'calc(100vh - 320px)' : '480px' }}
        >
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-800 flex items-start space-x-2.5">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Chế độ này dành cho người không muốn chạm vào mã code!</strong>
              <p className="mt-0.5 text-blue-700">
                Bạn chỉ cần điền các thông tin bạn muốn hiển thị vào các ô bên dưới, sau đó bấm nút{' '}
                <strong>"Áp Dụng Vào Mẫu Email"</strong>. Hệ thống sẽ tự động tạo ra một mẫu email chuyên nghiệp, đẹp mắt
                và tương thích hoàn hảo với Gmail, Outlook, iPhone.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tiêu Đề Header Banner
              </label>
              <input
                type="text"
                value={formData.headerTitle}
                onChange={(e) => setFormData({ ...formData, headerTitle: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Dòng Mô Tả Phụ Header
              </label>
              <input
                type="text"
                value={formData.headerSubtitle}
                onChange={(e) => setFormData({ ...formData, headerSubtitle: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Lời Chào Khách Hàng
              </label>
              <input
                type="text"
                value={formData.greeting}
                onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Màu Sắc Nút Bấm
              </label>
              <select
                value={formData.buttonColor}
                onChange={(e) => setFormData({ ...formData, buttonColor: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="#059669">🟢 Xanh Lá Cây (Thành công / Kích hoạt)</option>
                <option value="#2563eb">🔵 Xanh Dương (Hiện đại / Thanh toán)</option>
                <option value="#7c3aed">🟣 Tím (Cao cấp / Premium)</option>
                <option value="#ea580c">🟠 Cam (Nổi bật / Năng động)</option>
                <option value="#0f172a">⚫ Đen Sang Trọng (Luxury Black)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Thông Điệp / Lời Cảm Ơn Mở Đầu
            </label>
            <textarea
              rows={2}
              value={formData.introText}
              onChange={(e) => setFormData({ ...formData, introText: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tên Nút Bấm Kêu Gọi Hành Động (CTA Button)
              </label>
              <input
                type="text"
                value={formData.buttonText}
                onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Đường Dẫn Nút Bấm (Link)
              </label>
              <input
                type="text"
                value={formData.buttonUrl}
                onChange={(e) => setFormData({ ...formData, buttonUrl: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Khung Lưu Ý / Hướng Dẫn Sử Dụng
            </label>
            <textarea
              rows={2}
              value={formData.noticeText}
              onChange={(e) => setFormData({ ...formData, noticeText: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Hotline / Zalo Hỗ Trợ
              </label>
              <input
                type="text"
                value={formData.supportPhone}
                onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Lời Chúc / Ký Tên
              </label>
              <input
                type="text"
                value={formData.signOff}
                onChange={(e) => setFormData({ ...formData, signOff: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={generateHtmlFromForm}
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>✨ Áp Dụng Thông Tin Này Vào Mẫu Email Ngay</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= CHẾ ĐỘ 3: MÃ NGUỒN HTML (DÀNH CHO DEVELOPER) ================= */}
      {editorMode === 'code' && (
        <div className="flex flex-col flex-1 p-3 bg-slate-900 text-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
            <span>Mã nguồn HTML Email (Full Source Code)</span>
            <span>{content.length.toLocaleString('vi-VN')} ký tự</span>
          </div>

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            className="w-full mt-2 p-3 bg-slate-950 text-slate-200 font-mono text-xs border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
            style={{
              height: isFullscreen ? 'calc(100vh - 360px)' : '440px',
              minHeight: '380px',
            }}
          />
        </div>
      )}

      {/* ================= CHẾ ĐỘ 4: XEM TRƯỚC THỰC TẾ (LIVE PREVIEW) ================= */}
      {editorMode === 'preview' && (
        <div className="flex flex-col flex-1 bg-slate-100">
          {/* Thanh công cụ xem trước */}
          <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-medium">Giao diện xem trước:</span>
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                    previewDevice === 'desktop' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Máy Tính</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                    previewDevice === 'mobile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Điện Thoại</span>
                </button>
              </div>
            </div>

            <span className="text-[11px] text-slate-400">
              * Dữ liệu mẫu: Khách hàng "Nguyễn Văn An" - Hóa đơn "#HD-000048"
            </span>
          </div>

          {/* Khung hiển thị Device */}
          <div
            className="flex-1 p-4 sm:p-6 overflow-y-auto flex items-center justify-center bg-slate-200/70"
            style={{ minHeight: isFullscreen ? 'calc(100vh - 360px)' : '460px' }}
          >
            <div
              className={`bg-white rounded-xl shadow-xl overflow-hidden border border-slate-300 transition-all ${
                previewDevice === 'mobile' ? 'w-[375px] max-w-full rounded-3xl border-8 border-slate-800' : 'w-full max-w-[680px]'
              }`}
            >
              <iframe
                ref={previewIframeRef}
                srcDoc={getSimulatedHtml()}
                title="Email Preview"
                className="w-full bg-white"
                style={{
                  height: previewDevice === 'mobile' ? '560px' : isFullscreen ? 'calc(100vh - 400px)' : '480px',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

