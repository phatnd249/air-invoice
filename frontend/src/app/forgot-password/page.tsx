'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  KeyRound,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Send,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sentInfo, setSentInfo] = useState<{
    email: string;
  } | null>(null);

  // Bước duy nhất: Gửi yêu cầu → hệ thống tạo link đặt lại mật khẩu & gửi qua email
  const handleRequestResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email) {
      setErrorMessage('Vui lòng nhập địa chỉ email của bạn');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSentInfo({
        email: data.email || email,
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Không thể gửi liên kết khôi phục. Vui lòng thử lại.';
      setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-500/30 mb-4 border border-blue-400/30">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Khôi Phục Mật Khẩu
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {sentInfo
              ? 'Kiểm tra hộp thư email của bạn để hoàn tất'
              : 'Nhập email để nhận liên kết đặt lại mật khẩu qua email'}
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-2xl p-6 sm:p-8">
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Screen */}
          {sentInfo ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Liên kết đặt lại mật khẩu đã được gửi!</p>
                  <p className="text-xs text-emerald-400/90">
                    Kiểm tra hộp thư <strong>{sentInfo.email}</strong>. Liên kết có
                    hiệu lực trong 60 phút và chỉ sử dụng được một lần.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-300 text-xs">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-semibold uppercase tracking-wider text-slate-400">
                    Hướng dẫn tiếp theo
                  </span>
                  <span className="flex items-center gap-1 text-blue-400 font-medium">
                    <Send className="w-3.5 h-3.5" /> Email đã gửi
                  </span>
                </div>
                <ol className="space-y-2 text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span>Mở email <strong className="text-slate-300">Invoice-AIR</strong> vừa gửi đến <strong className="text-slate-300">{sentInfo.email}</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <span>Bấm nút <strong className="text-slate-300">Đặt Lại Mật Khẩu</strong> trong email để mở trang đặt mật khẩu mới.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span>Nhập mật khẩu mới và đăng nhập lại với mật khẩu vừa đặt.</span>
                  </li>
                </ol>
                <div className="mt-3 pt-3 border-t border-slate-700/60">
                  <p className="text-slate-400 leading-relaxed">
                    Đã gửi nhưng vẫn chưa nhận được email? Hãy kiểm tra mục
                    <strong> Spam / Thư rác</strong>, hoặc bấm nút bên dưới để gửi lại.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại trang Đăng nhập</span>
                </Link>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleRequestResetLink}
                  className="ml-auto py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? 'Đang gửi...' : 'Gửi lại liên kết'}
                </button>
              </div>
            </div>
          ) : (
            /* Request Link Form */
            <form onSubmit={handleRequestResetLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Địa chỉ Email tài khoản
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@airobotics.edu.vn"
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Gửi Liên Kết Đặt Lại Mật Khẩu</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Back to Login Link */}
          {!sentInfo && (
            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại trang Đăng nhập</span>
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          © 2026 Invoice-AIR. All rights reserved.
        </p>
      </div>
    </div>
  );
}