import React, { useState, useEffect } from 'react';
import { Bot, Info, Eye, EyeOff, Send, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface ZaloConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  zaloBotId: string;
  zaloApiKey: string;
  zaloApiBaseUrl: string;
  zaloAutoFriendRequest: boolean;
  zaloAliasPrefix: string;
  onSave: (config: {
    zaloBotId: string;
    zaloApiKey: string;
    zaloApiBaseUrl: string;
    zaloAutoFriendRequest: boolean;
    zaloAliasPrefix: string;
  }) => void;
}

export function ZaloConfigModal({
  isOpen,
  onClose,
  zaloBotId,
  zaloApiKey,
  zaloApiBaseUrl,
  zaloAutoFriendRequest,
  zaloAliasPrefix,
  onSave,
}: ZaloConfigModalProps) {
  const { toast } = useToast();

  const [modalBotId, setModalBotId] = useState('');
  const [modalApiKey, setModalApiKey] = useState('');
  const [modalBaseUrl, setModalBaseUrl] = useState('');
  const [modalAutoFriend, setModalAutoFriend] = useState(false);
  const [modalAliasPrefix, setModalAliasPrefix] = useState('KH_');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [isTestingZalo, setIsTestingZalo] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setModalBotId(zaloBotId || '');
      setModalApiKey(zaloApiKey || '');
      setModalBaseUrl(zaloApiBaseUrl || 'https://sms-service.talab.io.vn/api/gateway/v1.0');
      setModalAutoFriend(zaloAutoFriendRequest || false);
      setModalAliasPrefix(zaloAliasPrefix || 'KH_');
      setTestResult(null);
    }
  }, [isOpen, zaloBotId, zaloApiKey, zaloApiBaseUrl, zaloAutoFriendRequest, zaloAliasPrefix]);

  if (!isOpen) return null;

  const handleTestZalo = async () => {
    if (!testPhone.trim()) {
      toast('error', 'Chưa nhập số điện thoại', 'Vui lòng nhập số điện thoại để thử gửi tin');
      return;
    }

    let finalBotId = modalBotId.trim();
    let finalApiKey = modalApiKey.trim();

    if (finalBotId.startsWith('zlite_') && !finalApiKey.startsWith('zlite_')) {
      const tmp = finalBotId;
      finalBotId = finalApiKey;
      finalApiKey = tmp;
    }

    if (!finalBotId || !finalApiKey) {
      toast('error', 'Chưa điền đủ thông tin', 'Vui lòng nhập Bot ID và API Key trước khi thử');
      return;
    }

    setIsTestingZalo(true);
    setTestResult(null);

    try {
      const res = await api.post('/delivery/test-zalo', {
        baseUrl: modalBaseUrl.trim() || 'https://sms-service.talab.io.vn/api/gateway/v1.0',
        botId: finalBotId,
        apiKey: finalApiKey,
        testPhone: testPhone.trim(),
      });

      if (res.data?.success) {
        setTestResult({
          success: true,
          message: res.data?.message || 'Đã gửi tin nhắn Zalo thử nghiệm thành công!',
        });
        toast('success', 'Gửi tin nhắn thử thành công!', 'Kiểm tra thông báo Zalo trên điện thoại.');
      } else {
        setTestResult({
          success: false,
          message: res.data?.message || 'Có lỗi xảy ra khi gửi tin',
        });
        toast('error', 'Gửi không thành công', res.data?.message || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      setTestResult({ success: false, message: msg });
      toast('error', 'Lỗi kết nối Zalo Gateway', msg);
    } finally {
      setIsTestingZalo(false);
    }
  };

  const handleSave = () => {
    let finalBotId = modalBotId.trim();
    let finalApiKey = modalApiKey.trim();

    // Tự động nhận diện nếu người dùng dán ngược (API Key bắt đầu bằng zlite_)
    if (finalBotId.startsWith('zlite_') && !finalApiKey.startsWith('zlite_')) {
      const tmp = finalBotId;
      finalBotId = finalApiKey;
      finalApiKey = tmp;
      setModalBotId(finalBotId);
      setModalApiKey(finalApiKey);
    }

    onSave({
      zaloBotId: finalBotId,
      zaloApiKey: finalApiKey,
      zaloApiBaseUrl: modalBaseUrl.trim() || 'https://sms-service.talab.io.vn/api/gateway/v1.0',
      zaloAutoFriendRequest: modalAutoFriend,
      zaloAliasPrefix: modalAliasPrefix.trim() || 'KH_',
    });
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 cursor-default"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Cấu Hình Zalo Bot Gateway</h3>
              <p className="text-xs text-slate-500">
                Kết nối SMS-Service Gateway (https://sms-service.talab.io.vn)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200 transition-all font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Guidance Banner */}
          <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed space-y-1">
              <div className="font-semibold text-blue-950">Quy tắc định dạng của Talab SMS Gateway:</div>
              <div>
                • <strong className="text-blue-950">Zalo Bot ID:</strong> Mã UUID định danh Bot (VD:{' '}
                <code className="px-1 py-0.5 bg-blue-100/80 text-blue-900 rounded font-mono font-bold">
                  ae32c723-1a7a-4e22-985f-eb3e8876f2cc
                </code>
                )
              </div>
              <div>
                • <strong className="text-blue-950">API Key:</strong> Khóa bí mật luôn bắt đầu bằng tiền tố{' '}
                <code className="px-1 py-0.5 bg-blue-100/80 text-blue-900 rounded font-mono font-bold">zlite_...</code>{' '}
                (VD:{' '}
                <code className="px-1 py-0.5 bg-blue-100/80 text-blue-900 rounded font-mono">zlite_31d757...</code>)
              </div>
              <div className="text-slate-500 italic mt-0.5">
                💡 Hệ thống tự động nhận diện và đảo chuẩn xác nếu bạn vô tình dán ngược giữa 2 ô.
              </div>
            </div>
          </div>

          {/* Bot ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Zalo Bot ID (bot_id) * <span className="font-normal text-slate-400">— Mã định danh Bot (UUID)</span>
            </label>
            <input
              type="text"
              value={modalBotId}
              onChange={(e) => setModalBotId(e.target.value)}
              placeholder="VD: ae32c723-1a7a-4e22-985f-eb3e8876f2cc"
              className="w-full px-3.5 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              API Key (x-api-key) * <span className="font-normal text-slate-400">— Khóa truy cập (bắt đầu bằng zlite_)</span>
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={modalApiKey}
                onChange={(e) => setModalApiKey(e.target.value)}
                placeholder="VD: zlite_31d7572529b37294b69ce96881a9c2ce78ac7280"
                className="w-full px-3.5 py-2 pr-10 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Gateway URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Gateway API Base URL
            </label>
            <input
              type="text"
              value={modalBaseUrl}
              onChange={(e) => setModalBaseUrl(e.target.value)}
              placeholder="https://sms-service.talab.io.vn/api/gateway/v1.0"
              className="w-full px-3.5 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Friend Request Settings */}
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-3">
            <div className="flex items-start space-x-2.5">
              <input
                type="checkbox"
                id="autoFriendCheck"
                checked={modalAutoFriend}
                onChange={(e) => setModalAutoFriend(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-0.5 cursor-pointer"
              />
              <label htmlFor="autoFriendCheck" className="text-xs text-slate-700 cursor-pointer font-medium">
                Tự động gửi lời mời kết bạn (Batch Friend Request) khi nhắn tin cho số lạ
                <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                  Giúp khách hàng dễ nhận thông báo và tin nhắn không bị đưa vào thư mục người lạ.
                </span>
              </label>
            </div>

            {modalAutoFriend && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Tiền Tố Đổi Tên Gợi Nhớ (alias_prefix)
                </label>
                <input
                  type="text"
                  value={modalAliasPrefix}
                  onChange={(e) => setModalAliasPrefix(e.target.value)}
                  placeholder="KH_"
                  className="w-32 px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
                <span className="text-[11px] text-slate-400 ml-2">VD: KH_Nguyễn Văn A</span>
              </div>
            )}
          </div>

          {/* Test Message Box */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
              <Send className="w-3.5 h-3.5 text-blue-600" />
              <span>Thử Nghiệm Gửi Tin Nhắn Zalo Thực Tế</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="Nhập số điện thoại Zalo thử (VD: 0334551531)"
                className="flex-1 px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              />
              <button
                type="button"
                onClick={handleTestZalo}
                disabled={isTestingZalo}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center space-x-1 cursor-pointer"
              >
                {isTestingZalo ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <span>Gửi Thử</span>
                )}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs space-y-1 ${
                  testResult.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{testResult.success ? 'Gửi thành công!' : 'Gửi thất bại'}</span>
                </div>
                <p className="text-[11px]">{testResult.message}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex justify-end items-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            Lưu Cấu Hình
          </button>
        </div>
      </div>
    </div>
  );
}
