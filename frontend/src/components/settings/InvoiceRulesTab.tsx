import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Sliders, Save } from 'lucide-react';

interface InvoiceRulesTabProps {
  initialValues: {
    invoicePrefix?: string;
    nextInvoiceNumber?: number;
    defaultVatRate?: number;
  };
  onSave: (data: { invoicePrefix: string; nextInvoiceNumber: number; defaultVatRate: number }) => void;
  isSaving: boolean;
}

export function InvoiceRulesTab({ initialValues, onSave, isSaving }: InvoiceRulesTabProps) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      invoicePrefix: initialValues.invoicePrefix || 'HD',
      nextInvoiceNumber: initialValues.nextInvoiceNumber || 1,
      defaultVatRate: initialValues.defaultVatRate || 10,
    },
  });

  useEffect(() => {
    reset({
      invoicePrefix: initialValues.invoicePrefix || 'HD',
      nextInvoiceNumber: initialValues.nextInvoiceNumber || 1,
      defaultVatRate: initialValues.defaultVatRate || 10,
    });
  }, [initialValues, reset]);

  return (
    <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-5">
      <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-base pb-3 border-b border-slate-100">
        <Sliders className="w-5 h-5 text-blue-600" />
        <span>Quy Tắc Đánh Số Hóa Đơn &amp; Thuế Mặc Định</span>
      </div>

      <p className="text-xs text-slate-500">
        Các quy tắc này cần xác nhận lại trước khi lưu để tránh thay đổi số hóa đơn ngoài ý muốn.
      </p>

      <form onSubmit={handleSubmit(onSave)} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Tiền Tố Số HĐ (Prefix)
            </label>
            <input
              {...register('invoicePrefix')}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              placeholder="HD"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Số Hóa Đơn Tiếp Theo
            </label>
            <input
              type="number"
              {...register('nextInvoiceNumber', { valueAsNumber: true })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              placeholder="1"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Thuế Suất VAT Mặc Định (%)
            </label>
            <input
              type="number"
              {...register('defaultVatRate', { valueAsNumber: true })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="10"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-sm space-x-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu Quy Tắc'}</span>
          </button>
        </div>
      </form>
    </section>
  );
}

