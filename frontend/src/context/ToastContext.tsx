'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void;
  confirm: (options: {
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
  }) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};

const TYPE_STYLES: Record<ToastType, { box: string; icon: React.ElementType; iconColor: string; bar: string }> = {
  success: {
    box: 'border-emerald-200',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
    bar: 'bg-emerald-500',
  },
  error: {
    box: 'border-rose-200',
    icon: AlertTriangle,
    iconColor: 'text-rose-500',
    bar: 'bg-rose-500',
  },
  warning: {
    box: 'border-amber-200',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    bar: 'bg-amber-500',
  },
  info: {
    box: 'border-blue-200',
    icon: Info,
    iconColor: 'text-blue-500',
    bar: 'bg-blue-500',
  },
};

// Confirm dialog state (promise-based)
interface ConfirmState {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  danger: boolean;
  resolve: (val: boolean) => void;
}

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current[id];
    if (timer) {
      clearTimeout(timer);
      delete timers.current[id];
    }
  }, []);

  const toast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      timers.current[id] = setTimeout(() => dismissToast(id), 4000);
    },
    [dismissToast]
  );

  const confirm = useCallback(
    (options: {
      title: string;
      message?: string;
      confirmLabel?: string;
      cancelLabel?: string;
      danger?: boolean;
    }) =>
      new Promise<boolean>((resolve) => {
        setConfirmState({
          title: options.title,
          message: options.message,
          confirmLabel: options.confirmLabel || 'Xác nhận',
          cancelLabel: options.cancelLabel || 'Hủy',
          danger: options.danger ?? false,
          resolve,
        });
      }),
    []
  );

  const handleConfirm = (val: boolean) => {
    confirmState?.resolve(val);
    setConfirmState(null);
  };

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast Stack */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 w-[340px] max-w-[calc(100vw-2.5rem)]">
        {toasts.map((t) => {
          const s = TYPE_STYLES[t.type];
          const Icon = s.icon;
          return (
            <div
              key={t.id}
              role="status"
              className={`relative bg-white rounded-xl border shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200`}
            >
              <div className={`absolute inset-y-0 left-0 w-1 ${s.bar}`} />
              <div className="flex items-start gap-3 p-3.5 pl-4">
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${s.iconColor}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                  {t.message && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{t.message}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(t.id)}
                  className="text-slate-300 hover:text-slate-500 shrink-0 p-0.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm Dialog */}
      {confirmState && (
        <div className="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  confirmState.danger ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-600'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="pt-0.5">
                <h3 className="text-sm font-bold text-slate-900">{confirmState.title}</h3>
                {confirmState.message && (
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{confirmState.message}</p>
                )}
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => handleConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                {confirmState.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => handleConfirm(true)}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-colors cursor-pointer ${
                  confirmState.danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
