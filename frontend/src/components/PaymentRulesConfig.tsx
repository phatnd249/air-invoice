'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { PaymentDescriptionRule } from '@invoice/types';
import {
  Sparkles,
  RefreshCw,
  Plus,
  CheckCircle2,
  Edit2,
  Trash2,
  Save,
  Info,
  X,
  CreditCard,
  Mail,
  HelpCircle,
} from 'lucide-react';

export default function PaymentRulesConfig() {
  const queryClient = useQueryClient();
  const { toast, confirm } = useToast();

  const [paymentRules, setPaymentRules] = useState<PaymentDescriptionRule[]>([]);
  const [defaultPaymentDesc, setDefaultPaymentDesc] = useState<string>('{paymentCode} - {serviceName}');
  const [editingRule, setEditingRule] = useState<PaymentDescriptionRule | null>(null);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleFormName, setRuleFormName] = useState('');
  const [ruleFormPattern, setRuleFormPattern] = useState('');
  const [ruleFormTemplate, setRuleFormTemplate] = useState('');
  const [ruleFormActive, setRuleFormActive] = useState(true);
  const [testEmail, setTestEmail] = useState('124001340@lachong.edu.vn');
  const [isSyncingQr, setIsSyncingQr] = useState(false);

  // Lấy dữ liệu settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

  // Tải rules từ settings
  useEffect(() => {
    if (settings) {
      let loadedRules = settings.paymentRules;
      if (typeof loadedRules === 'string') {
        try {
          loadedRules = JSON.parse(loadedRules);
        } catch {
          loadedRules = [];
        }
      }
      if (Array.isArray(loadedRules)) {
        setPaymentRules(loadedRules);
      }
      if (settings.defaultPaymentDescription) {
        setDefaultPaymentDesc(settings.defaultPaymentDescription);
      }
    }
  }, [settings]);

  // Hàm tính toán preview thời gian thực
  const calculateRulePreview = (email: string, template: string) => {
    const clean = (email || '').trim().toLowerCase();
    const prefix = clean ? clean.split('@')[0].trim() : '';
    const matchNumber = prefix.match(/^(\d+)/);
    const studentId = matchNumber ? matchNumber[1] : prefix;
    return (template || '')
      .replace(/{studentId}/gi, studentId || '124001340')
      .replace(/{emailPrefix}/gi, prefix || '124001340')
      .replace(/{paymentCode}/gi, 'A8X9K2')
      .replace(/{invoiceNumber}/gi, 'HD-000047')
      .replace(/{serviceName}/gi, 'AI Writer Pro')
      .replace(/{customerName}/gi, 'Nguyễn Văn A');
  };

  const persistSettings = async (payload: any, successMsg: string) => {
    try {
      await api.patch('/settings', payload);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast('success', 'Thành công', successMsg);
    } catch (err: any) {
      toast('error', 'Lưu thất bại', err.response?.data?.message || err.message);
    }
  };

  const autoSavePaymentRules = (updated: PaymentDescriptionRule[], defaultDesc?: string) => {
    setPaymentRules(updated);
    const payload: any = { paymentRules: updated };
    if (defaultDesc !== undefined) {
      payload.defaultPaymentDescription = defaultDesc;
    }
    persistSettings(payload, 'Đã lưu quy tắc và tự động cập nhật lại mã QR cho các hóa đơn chưa thanh toán');
  };

  const handleSyncUnpaidQr = async () => {
    try {
      setIsSyncingQr(true);
      const res = await api.post('/settings/sync-unpaid-qr');
      const { updatedCount, totalUnpaid } = res.data || {};
      toast(
        'success',
        'Đồng bộ mã QR thành công',
        `Đã cập nhật lại mã QR cho ${updatedCount}/${totalUnpaid} hóa đơn chưa thanh toán.`
      );
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    } catch (err: any) {
      toast('error', 'Lỗi đồng bộ mã QR', err.response?.data?.message || err.message);
    } finally {
      setIsSyncingQr(false);
    }
  };

  const handleOpenAddRule = () => {
    setEditingRule(null);
    setRuleFormName('');
    setRuleFormPattern('');
    setRuleFormTemplate('{studentId} / Trường Đại Học Lạc Hồng');
    setRuleFormActive(true);
    setTestEmail('124001340@lachong.edu.vn');
    setIsRuleModalOpen(true);
  };

  const handleOpenEditRule = (rule: PaymentDescriptionRule) => {
    setEditingRule(rule);
    setRuleFormName(rule.name);
    setRuleFormPattern(rule.emailPattern);
    setRuleFormTemplate(rule.descriptionTemplate);
    setRuleFormActive(rule.isActive ?? true);
    setTestEmail(rule.emailPattern ? '124001340@' + rule.emailPattern : '124001340@lachong.edu.vn');
    setIsRuleModalOpen(true);
  };

  const handleToggleRuleActive = (ruleId: string) => {
    const updated = paymentRules.map((r) =>
      r.id === ruleId ? { ...r, isActive: !r.isActive } : r
    );
    autoSavePaymentRules(updated);
  };

  const handleDeleteRule = async (ruleId: string) => {
    const isOk = await confirm({
      title: 'Xóa quy tắc nội dung chuyển khoản',
      message: 'Bạn có chắc chắn muốn xóa quy tắc này? Hành động này sẽ không thể hoàn tác.',
      confirmLabel: 'Xóa quy tắc',
      cancelLabel: 'Hủy',
      danger: true,
    });
    if (!isOk) return;

    const updated = paymentRules.filter((r) => r.id !== ruleId);
    autoSavePaymentRules(updated);
  };

  const handleSaveRuleModal = () => {
    if (!ruleFormName.trim()) {
      toast('error', 'Lỗi nhập liệu', 'Vui lòng nhập tên quy tắc');
      return;
    }
    if (!ruleFormPattern.trim()) {
      toast('error', 'Lỗi nhập liệu', 'Vui lòng nhập từ khóa/tên miền email nhận diện (VD: lachong.edu.vn)');
      return;
    }
    if (!ruleFormTemplate.trim()) {
      toast('error', 'Lỗi nhập liệu', 'Vui lòng nhập cú pháp nội dung chuyển khoản');
      return;
    }

    let updated: PaymentDescriptionRule[] = [];
    if (editingRule) {
      updated = paymentRules.map((r) =>
        r.id === editingRule.id
          ? {
              ...r,
              name: ruleFormName.trim(),
              emailPattern: ruleFormPattern.trim().toLowerCase(),
              descriptionTemplate: ruleFormTemplate.trim(),
              isActive: ruleFormActive,
            }
          : r
      );
    } else {
      const newRule: PaymentDescriptionRule = {
        id: 'rule-' + Date.now(),
        name: ruleFormName.trim(),
        emailPattern: ruleFormPattern.trim().toLowerCase(),
        descriptionTemplate: ruleFormTemplate.trim(),
        isActive: ruleFormActive,
      };
      updated = [...paymentRules, newRule];
    }

    autoSavePaymentRules(updated);
    setIsRuleModalOpen(false);
  };

  const handleSaveDefaultDesc = () => {
    persistSettings(
      { defaultPaymentDescription: defaultPaymentDesc },
      'Đã lưu cú pháp mặc định và tự động cập nhật lại mã QR cho các hóa đơn chưa thanh toán'
    );
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-2">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs">Đang tải cấu hình nội dung chuyển khoản...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Panel */}
      <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-base">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Quy Tắc Định Dạng Nội Dung Chuyển Khoản Theo Email (VietQR)</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tự động nhận diện email khách hàng (sinh viên trường đại học, tổ chức, đối tác...) để sinh nội dung thanh toán mã QR chuẩn xác.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleSyncUnpaidQr}
              disabled={isSyncingQr}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 transition-colors shadow-xs cursor-pointer"
              title="Cập nhật lại mã QR SePay cho toàn bộ hóa đơn chưa thanh toán (ISSUED, SENT)"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingQr ? 'animate-spin' : ''}`} />
              <span>{isSyncingQr ? 'Đang đồng bộ...' : 'Đồng Bộ QR HĐ Chưa Trả'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddRule}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Quy Tắc Mới</span>
            </button>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Tự động đồng bộ:</strong> Khi bạn lưu quy tắc hoặc cú pháp chuyển khoản mới, hệ thống tự động cập nhật lại mã QR cho toàn bộ hóa đơn chưa thanh toán (trạng thái Chờ thanh toán / Đã gửi).
          </span>
        </div>

        {/* Danh sách quy tắc */}
        <div className="space-y-3">
          {paymentRules.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm space-y-2">
              <p>Chưa có quy tắc riêng theo email nào.</p>
              <p className="text-xs text-slate-400">Bấm nút "Thêm Quy Tắc Mới" phía trên để tạo quy tắc cho trường học hoặc đối tác.</p>
            </div>
          ) : (
            paymentRules.map((rule) => {
              const sampleEmail = '124001340@' + (rule.emailPattern || 'lachong.edu.vn');
              const samplePreview = calculateRulePreview(sampleEmail, rule.descriptionTemplate);

              return (
                <div
                  key={rule.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    rule.isActive
                      ? 'border-indigo-200 bg-indigo-50/20 shadow-xs'
                      : 'border-slate-200 bg-slate-50/60 opacity-60'
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-bold text-slate-900 text-sm">{rule.name}</span>
                      {rule.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Đang kích hoạt
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                          Đã tạm dừng
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div>
                        Điều kiện email chứa: <code className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono text-indigo-700 font-semibold">{rule.emailPattern}</code>
                      </div>
                      <div>
                        Cú pháp định dạng: <code className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono text-slate-800">{rule.descriptionTemplate}</code>
                      </div>
                      <div className="text-xs text-slate-500 pt-1 flex items-center space-x-1.5 flex-wrap">
                        <span>👉 Kết quả mẫu trên VietQR:</span>
                        <strong className="font-mono text-indigo-900 bg-indigo-100/70 px-2.5 py-0.5 rounded border border-indigo-200/60">{samplePreview}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => handleToggleRuleActive(rule.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        rule.isActive
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {rule.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditRule(rule)}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-indigo-200"
                      title="Chỉnh sửa quy tắc"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-200"
                      title="Xóa quy tắc"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cú pháp chuyển khoản mặc định */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Cú pháp chuyển khoản mặc định (khi email không khớp quy tắc nào)
              </h4>
              <p className="text-xs text-slate-500">
                Áp dụng cho mọi hóa đơn thanh toán nếu khách hàng không dùng email đặc thù.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveDefaultDesc}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu Cú Pháp Mặc Định</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={defaultPaymentDesc}
              onChange={(e) => setDefaultPaymentDesc(e.target.value)}
              className="w-full px-3.5 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              placeholder="{paymentCode} - {serviceName}"
            />
          </div>

          {/* Quick tags */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 pt-1">
            <span className="text-xs text-slate-400 font-medium">Bấm chèn biến:</span>
            {[
              { tag: '{paymentCode}', desc: 'Mã thanh toán' },
              { tag: '{invoiceNumber}', desc: 'Số hóa đơn' },
              { tag: '{serviceName}', desc: 'Tên dịch vụ' },
              { tag: '{customerName}', desc: 'Tên khách hàng' },
            ].map((item) => (
              <button
                key={item.tag}
                type="button"
                onClick={() => setDefaultPaymentDesc((prev) => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + item.tag)}
                className="px-2.5 py-1 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-xs font-mono transition-colors cursor-pointer"
              >
                {item.tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Guide Card: Bảng tra cứu các biến */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-sm">
          <Info className="w-4 h-4 text-indigo-600" />
          <span>Bảng Tra Cứu Các Biến Tự Động Trong Định Dạng Chuyển Khoản</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-mono font-bold text-indigo-700">{'{studentId}'}</div>
            <div className="text-slate-600">Dãy số mã số sinh viên ở đầu email (hoặc toàn bộ chuỗi trước @ nếu không có số).</div>
            <div className="text-xs text-slate-500 italic">Ví dụ: "124001340@lachong.edu.vn" → "124001340"</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-mono font-bold text-indigo-700">{'{emailPrefix}'}</div>
            <div className="text-slate-600">Toàn bộ ký tự nằm phía trước dấu @ của địa chỉ email.</div>
            <div className="text-xs text-slate-500 italic">Ví dụ: "thanhdat.nguyen@company.com" → "thanhdat.nguyen"</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-mono font-bold text-indigo-700">{'{paymentCode}'}</div>
            <div className="text-slate-600">Mã thanh toán đối soát 6 ký tự ngẫu nhiên được sinh cho mỗi hóa đơn.</div>
            <div className="text-xs text-slate-500 italic">Ví dụ: "A8X9K2", "M3AU0C"</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-mono font-bold text-indigo-700">{'{invoiceNumber}'}</div>
            <div className="text-slate-600">Số hiệu hóa đơn chính thức trên hệ thống.</div>
            <div className="text-xs text-slate-500 italic">Ví dụ: "HD-000047", "HD-000072"</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-mono font-bold text-indigo-700">{'{serviceName}'}</div>
            <div className="text-slate-600">Tên dịch vụ, khóa học hoặc hàng hóa đầu tiên trong hóa đơn.</div>
            <div className="text-xs text-slate-500 italic">Ví dụ: "Starter", "AI Writer Pro 1 Năm"</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-mono font-bold text-indigo-700">{'{customerName}'}</div>
            <div className="text-slate-600">Họ và tên của khách hàng / người mua ghi trên hóa đơn.</div>
            <div className="text-xs text-slate-500 italic">Ví dụ: "Phạm Phương Thảo", "Đinh Triệu Mẫn"</div>
          </div>
        </div>
      </section>

      {/* Modal Thêm / Chỉnh Sửa Quy Tắc */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-slate-100">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingRule ? 'Chỉnh Sửa Quy Tắc Chuyển Khoản' : 'Thêm Quy Tắc Chuyển Khoản Mới'}
                  </h3>
                  <p className="text-xs text-slate-500">Cấu hình định dạng nội dung VietQR tự động theo email</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRuleModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Gợi Nhớ Quy Tắc <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={ruleFormName}
                  onChange={(e) => setRuleFormName(e.target.value)}
                  placeholder="VD: Sinh viên ĐH Lạc Hồng"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Điều Kiện Nhận Diện Email (Tên miền hoặc từ khóa) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={ruleFormPattern}
                    onChange={(e) => setRuleFormPattern(e.target.value)}
                    placeholder="VD: lachong.edu.vn hoặc @hutech.edu.vn"
                    className="w-full px-3.5 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Hệ thống kiểm tra nếu email khách hàng có chứa chuỗi này thì sẽ áp dụng quy tắc.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cú Pháp Nội Dung Chuyển Khoản (VietQR) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={ruleFormTemplate}
                  onChange={(e) => setRuleFormTemplate(e.target.value)}
                  placeholder="VD: {studentId} / Trường Đại Học Lạc Hồng"
                  className="w-full px-3.5 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />

                {/* Quick variable tags */}
                <div className="flex flex-wrap gap-1.5 pt-1.5 text-xs">
                  {[
                    { tag: '{studentId}', label: 'Mã số SV' },
                    { tag: '{invoiceNumber}', label: 'Số HĐ' },
                    { tag: '{paymentCode}', label: 'Mã TT' },
                    { tag: '{emailPrefix}', label: 'Prefix email' },
                    { tag: '{serviceName}', label: 'Tên DV' },
                  ].map((it) => (
                    <button
                      key={it.tag}
                      type="button"
                      onClick={() => setRuleFormTemplate((prev) => prev + (prev ? ' ' : '') + it.tag)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-xs font-mono transition-colors cursor-pointer"
                    >
                      +{it.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Test Preview Box */}
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 flex items-center gap-1.5 text-sm">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Thử nghiệm kết quả thực tế
                  </span>
                </div>

                <div>
                  <label className="text-xs text-slate-600 block mb-1">Nhập thử email khách hàng:</label>
                  <input
                    type="text"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="VD: 124001340@lachong.edu.vn"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="pt-1">
                  <label className="text-xs text-slate-600 block mb-1">Nội dung VietQR thực tế sinh ra:</label>
                  <div className="p-3 bg-white rounded-lg border border-indigo-200 text-indigo-950 font-mono font-bold text-sm break-words">
                    {calculateRulePreview(testEmail, ruleFormTemplate) || '(Chưa có nội dung)'}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={ruleFormActive}
                    onChange={(e) => setRuleFormActive(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Kích hoạt quy tắc này ngay sau khi lưu</span>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveRuleModal}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingRule ? 'Cập Nhật Quy Tắc' : 'Lưu Quy Tắc Mới'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
