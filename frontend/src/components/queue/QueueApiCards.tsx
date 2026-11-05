import React from 'react';
import { Key, X } from 'lucide-react';
import { formatVietnamDateTime } from '@/lib/date';
import { ApiSummaryItem } from './types';

interface QueueApiCardsProps {
  apis: ApiSummaryItem[];
  selectedApi: string;
  onSelectApi: (apiName: string) => void;
}

export function QueueApiCards({ apis, selectedApi, onSelectApi }: QueueApiCardsProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" />
            <span>Danh Sách API Hiện Có &amp; Số Request Của Từng API</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Ghi nhận từng nguồn gọi API / API Key và hiển thị số lượng request đang có trong hệ thống. Nhấp để lọc nhanh request.
          </p>
        </div>

        {selectedApi !== 'ALL' && (
          <button
            type="button"
            onClick={() => onSelectApi('ALL')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 rounded-lg cursor-pointer transition-colors"
          >
            <span>Xem tất cả API</span>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {apis.length === 0 ? (
          <div className="col-span-full py-8 text-center text-sm text-slate-400 italic">
            Chưa có dữ liệu API nào được ghi nhận.
          </div>
        ) : (
          apis.map((apiItem) => {
            const isSelected = selectedApi === apiItem.apiName;
            return (
              <div
                key={apiItem.apiName}
                onClick={() => onSelectApi(isSelected ? 'ALL' : apiItem.apiName)}
                className={`p-4 rounded-xl border transition-all cursor-pointer text-left relative group ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="font-bold text-sm text-slate-900 truncate">
                    {apiItem.apiName}
                  </div>
                  {apiItem.isApiKey ? (
                    <span className="shrink-0 px-2 py-0.5 rounded text-xs font-semibold bg-violet-100 text-violet-700 border border-violet-200">
                      API Key
                    </span>
                  ) : (
                    <span className="shrink-0 px-2 py-0.5 rounded text-xs font-semibold bg-slate-200 text-slate-700">
                      System
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-500 font-mono truncate mb-3">
                  {apiItem.endpoint || '/api/invoices/quick-create'}
                </div>

                {/* Badges số request */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-xs pt-2.5 border-t border-slate-200/60">
                  <div className="bg-white/80 rounded-lg py-1.5 border border-slate-200/60">
                    <div className="text-xs text-slate-400 font-medium">Tổng</div>
                    <div className="font-bold font-mono text-sm text-slate-800">{apiItem.total}</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg py-1.5 border border-amber-200/60">
                    <div className="text-xs text-amber-600 font-medium">Chờ</div>
                    <div className="font-bold font-mono text-sm text-amber-700">{apiItem.pending}</div>
                  </div>
                  <div className="bg-emerald-50 rounded-lg py-1.5 border border-emerald-200/60">
                    <div className="text-xs text-emerald-600 font-medium">Xong</div>
                    <div className="font-bold font-mono text-sm text-emerald-700">{apiItem.completed}</div>
                  </div>
                  <div className="bg-rose-50 rounded-lg py-1.5 border border-rose-200/60">
                    <div className="text-xs text-rose-600 font-medium">Lỗi</div>
                    <div className="font-bold font-mono text-sm text-rose-700">{apiItem.failed}</div>
                  </div>
                </div>

                {apiItem.lastRequestAt && (
                  <div className="text-xs text-slate-400 mt-2 truncate">
                    Gần nhất: {formatVietnamDateTime(apiItem.lastRequestAt)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

