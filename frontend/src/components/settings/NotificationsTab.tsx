import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ExternalLink,
  Mail,
  CheckCircle2,
  MessageSquare,
  Key,
  Save,
  Info,
} from 'lucide-react';

interface NotificationsTabProps {
  enableEmail: boolean;
  onToggleEmail: (enabled: boolean) => void;
  enableZalo: boolean;
  onToggleZalo: (enabled: boolean) => void;
  zaloBotId: string;
  zaloApiKey: string;
  zaloApiBaseUrl: string;
  zaloAutoFriendRequest: boolean;
  zaloAliasPrefix: string;
  onOpenZaloModal: () => void;
  zaloMessageTemplate: string;
  setZaloMessageTemplate: React.Dispatch<React.SetStateAction<string>>;
  onSaveZaloTemplate: () => void;
  isSavingZaloTemplate: boolean;
  emailAlertSubject: string;
  setEmailAlertSubject: (val: string) => void;
  emailAlertBody: string;
  setEmailAlertBody: React.Dispatch<React.SetStateAction<string>>;
  onSaveEmailTemplate: () => void;
  isSavingEmailTemplate: boolean;
}

export function NotificationsTab({
  enableEmail,
  onToggleEmail,
  enableZalo,
  onToggleZalo,
  zaloBotId,
  zaloApiKey,
  zaloApiBaseUrl,
  zaloAutoFriendRequest,
  zaloAliasPrefix,
  onOpenZaloModal,
  zaloMessageTemplate,
  setZaloMessageTemplate,
  onSaveZaloTemplate,
  isSavingZaloTemplate,
  emailAlertSubject,
  setEmailAlertSubject,
  emailAlertBody,
  setEmailAlertBody,
  onSaveEmailTemplate,
  isSavingEmailTemplate,
}: NotificationsTabProps) {
  return (
    <div className="space-y-6">
      {/* Banner điều hướng sang Nội Dung Chuyển Khoản & Mẫu Tin Nhắn */}
      <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-900 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">Cấu hình Nội Dung Chuyển Khoản VietQR Theo Email</p>
            <p className="text-slate-500 text-xs mt-0.5">
              Đã được chuyển sang quản lý tập trung tại trang <strong>Mẫu Tin Nhắn &amp; Hóa Đơn</strong> cùng các kịch bản Zalo và Email.
            </p>
          </div>
        </div>
        <Link
          href="/templates?tab=vietqr"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shrink-0 transition-colors shadow-xs cursor-pointer"
        >
          <span>Mở Tab Cấu Hình VietQR</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Email Notification Card */}
      <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>Gửi Hóa Đơn Tự Động Qua Email (SMTP)</span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    enableEmail
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {enableEmail ? 'Đang Bật' : 'Đang Tắt'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Tự động gửi hóa đơn kèm mã QR thanh toán và đường dẫn xem online đến email khách hàng khi tạo hóa đơn.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={enableEmail}
              onChange={(e) => onToggleEmail(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Dịch vụ SMTP Máy Chủ Đã Sẵn Sàng</span>
            </div>
            <p className="text-slate-500">
              Cấu hình gửi mail được quản lý an toàn qua biến môi trường máy chủ (SMTP host, port, user, pass).
            </p>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Template: invoice-notification.html</span>
        </div>
      </section>

      {/* Zalo Bot Notification Card */}
      <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>Gửi Hóa Đơn Qua Zalo Bot (SMS-Service / Talab)</span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    enableZalo && zaloBotId && zaloApiKey
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {enableZalo && zaloBotId && zaloApiKey
                    ? 'Đang Bật'
                    : !zaloBotId || !zaloApiKey
                    ? 'Chưa Cấu Hình Bot'
                    : 'Đang Tắt'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Gửi tin nhắn trực tiếp đến Zalo của khách hàng bằng số điện thoại. Hỗ trợ tự động kết bạn (Batch Friend Request).
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={enableZalo}
              onChange={(e) => onToggleZalo(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Zalo Status & Config Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Thông Tin Bot &amp; Kết Nối</div>
            <div className="text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Zalo Bot ID:</span>
                <strong className="font-mono text-slate-800">
                  {zaloBotId ? zaloBotId : <span className="text-amber-600 font-normal">Chưa thiết lập</span>}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">x-api-key:</span>
                <strong className="font-mono text-slate-800">
                  {zaloApiKey ? `${zaloApiKey.slice(0, 6)}••••••••` : <span className="text-amber-600 font-normal">Chưa thiết lập</span>}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Tự động kết bạn:</span>
                <span className={`font-semibold ${zaloAutoFriendRequest ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {zaloAutoFriendRequest ? `Bật (Tiền tố: ${zaloAliasPrefix || 'KH_'})` : 'Tắt'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cổng API Gateway</div>
              <p className="text-xs font-mono text-slate-700 truncate" title={zaloApiBaseUrl}>
                {zaloApiBaseUrl || 'https://sms-service.talab.io.vn/api/gateway/v1.0'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                API Nhắn tin &amp; Kết Bạn Batch hỗ trợ gửi cho người lạ không cần qua OA ZNS.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={onOpenZaloModal}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>Cấu Hình Zalo Bot (API Key &amp; Bot ID)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Custom Template Box */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Đã có trang quản lý Mẫu Tin Nhắn riêng:</span>{' '}
                <span>
                  Hệ thống hiện đã hỗ trợ quản lý kịch bản Zalo &amp; Email theo từng gói dịch vụ, kèm xem trước và đính kèm file tại menu{' '}
                  <strong>Mẫu Tin Nhắn</strong>. Khung bên dưới chỉ đóng vai trò dự phòng cơ bản nếu không tìm thấy mẫu nào.
                </span>
              </div>
            </div>
            <Link
              href="/templates"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs shrink-0 transition-colors shadow-2xs cursor-pointer"
            >
              <span>Mẫu Tin Nhắn</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Mẫu Tin Nhắn Zalo Gửi Khách Hàng (Dự Phòng Fallback)
              </h4>
              <p className="text-xs text-slate-500">
                Bấm vào các thẻ biến bên dưới để chèn vào nội dung tin nhắn. Để trống để sử dụng mẫu chuẩn mặc định.
              </p>
            </div>
            <button
              type="button"
              onClick={onSaveZaloTemplate}
              disabled={isSavingZaloTemplate}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingZaloTemplate ? 'Đang lưu...' : 'Lưu Mẫu'}</span>
            </button>
          </div>

          {/* Variable Chips */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { tag: '{{customerName}}', desc: 'Tên người nhận' },
              { tag: '{{invoiceNumber}}', desc: 'Mã số hóa đơn' },
              { tag: '{{totalAmount}}', desc: 'Tổng tiền thanh toán' },
              { tag: '{{viewUrl}}', desc: 'Link xem online' },
              { tag: '{{pdfUrl}}', desc: 'Link tải PDF' },
            ].map((item) => (
              <button
                key={item.tag}
                type="button"
                onClick={() => {
                  setZaloMessageTemplate((prev) => (prev ? `${prev} ${item.tag}` : item.tag));
                }}
                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-mono transition-colors cursor-pointer"
                title={item.desc}
              >
                <span>{item.tag}</span>
                <span className="text-[10px] text-blue-400 font-sans">({item.desc})</span>
              </button>
            ))}
          </div>

          <textarea
            value={zaloMessageTemplate}
            onChange={(e) => setZaloMessageTemplate(e.target.value)}
            rows={4}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-sans focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
            placeholder={`[Thông báo Hóa đơn]\nKính gửi {{customerName}},\nHệ thống xin gửi Quý khách hóa đơn {{invoiceNumber}} với số tiền thanh toán là {{totalAmount}}.\n\nXem chi tiết và mã VietQR thanh toán tại:\n{{viewUrl}}\n\nTải file PDF trực tiếp:\n{{pdfUrl}}\n\nTrân trọng!`}
          />
        </div>
      </section>

      {/* Email Alert & Subscription Reminder Template Card */}
      <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Mẫu Tin Nhắn Email Cảnh Báo &amp; Nhắc Hạn Dịch Vụ
              </h3>
              <p className="text-xs text-slate-500">
                Cấu hình tiêu đề và lời nhắn mở đầu email gửi khách hàng khi dịch vụ / hợp đồng sắp hết hạn.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSaveEmailTemplate}
            disabled={isSavingEmailTemplate}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{isSavingEmailTemplate ? 'Đang lưu...' : 'Lưu Mẫu Email'}</span>
          </button>
        </div>

        {/* Placeholders */}
        <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 text-xs text-slate-600 space-y-2">
          <div className="font-bold text-blue-900 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-600" />
            <span>Các biến tự động chèn dữ liệu (bấm để thêm vào nội dung):</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { tag: '{customerName}', desc: 'Tên KH' },
              { tag: '{serviceName}', desc: 'Tên gói' },
              { tag: '{daysRemaining}', desc: 'Số ngày còn' },
              { tag: '{endDate}', desc: 'Ngày hết hạn' },
              { tag: '{servicePrice}', desc: 'Giá gói' },
              { tag: '{staffName}', desc: 'Người phụ trách' },
              { tag: '{companyName}', desc: 'Tên công ty' },
              { tag: '{hotline}', desc: 'Hotline' },
            ].map((item) => (
              <button
                key={item.tag}
                type="button"
                onClick={() => setEmailAlertBody((prev) => (prev ? `${prev} ${item.tag}` : item.tag))}
                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-mono transition-colors cursor-pointer"
                title={`Chèn ${item.tag} (${item.desc})`}
              >
                <span>{item.tag}</span>
                <span className="text-[10px] text-blue-400 font-sans">({item.desc})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Tiêu Đề Email Mặc Định
            </label>
            <input
              type="text"
              value={emailAlertSubject}
              onChange={(e) => setEmailAlertSubject(e.target.value)}
              placeholder='VD: [THÔNG BÁO GIA HẠN DỊCH VỤ] Gói "{serviceName}" của {customerName} {daysRemaining}'
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Nếu để trống, hệ thống sẽ tự động dùng tiêu đề tiêu chuẩn.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Nội Dung / Lời Nhắn Mở Đầu Email
            </label>
            <textarea
              rows={4}
              value={emailAlertBody}
              onChange={(e) => setEmailAlertBody(e.target.value)}
              placeholder="VD: Kính gửi Quý khách hàng, hệ thống xin thông báo gói dịch vụ của Quý khách sắp đến thời hạn gia hạn. Quý khách vui lòng kiểm tra và liên hệ hỗ trợ để dịch vụ không bị gián đoạn..."
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Nội dung này sẽ hiển thị trang trọng ở phần đầu email gửi đến khách hàng kèm bảng chi tiết gói dịch vụ và thông tin người phụ trách.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

