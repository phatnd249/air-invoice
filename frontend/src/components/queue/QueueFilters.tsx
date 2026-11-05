import React from 'react';
import { Search, X } from 'lucide-react';
import { ApiSummaryItem } from './types';

interface QueueFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedApi: string;
  onSelectApi: (apiName: string) => void;
  apis: ApiSummaryItem[];
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  selectedType: string;
  onSelectType: (type: string) => void;
}

export function QueueFilters({
  searchTerm,
  onSearchChange,
  selectedApi,
  onSelectApi,
  apis,
  selectedStatus,
  onSelectStatus,
  selectedType,
  onSelectType,
}: QueueFiltersProps) {
  return (
    <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
      {/* Ô tìm kiếm */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm mã Job, tên API, số HĐ, tên người nhận, lỗi..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Bộ lọc dropdown */}
      <div className="flex items-center flex-wrap gap-2">
        {/* Lọc theo API */}
        <select
          value={selectedApi}
          onChange={(e) => onSelectApi(e.target.value)}
          className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
        >
          <option value="ALL">Tất cả API ({apis.length})</option>
          {apis.map((a) => (
            <option key={a.apiName} value={a.apiName}>
              {a.apiName} ({a.total} req)
            </option>
          ))}
        </select>

        {/* Lọc theo Trạng Thái */}
        <select
          value={selectedStatus}
          onChange={(e) => onSelectStatus(e.target.value)}
          className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PENDING">Đang chờ (Pending)</option>
          <option value="PROCESSING">Đang gửi (Processing)</option>
          <option value="COMPLETED">Thành công (Completed)</option>
          <option value="FAILED">Đã dừng / Thất bại (Failed)</option>
        </select>

        {/* Lọc theo Loại Tác Vụ */}
        <select
          value={selectedType}
          onChange={(e) => onSelectType(e.target.value)}
          className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
        >
          <option value="ALL">Tất cả loại tác vụ</option>
          <option value="DELIVERY_EMAIL">Gửi Email Hóa Đơn</option>
          <option value="DELIVERY_ZALO">Gửi Tin Nhắn Zalo</option>
          <option value="PAYMENT_CONFIRMATION">Xác Nhận Thanh Toán</option>
          <option value="QUICK_CREATE_INVOICE">Tạo Nhanh Hóa Đơn</option>
          <option value="WEBHOOK_EVENT">Webhook</option>
          <option value="CUSTOM">Khác</option>
        </select>
      </div>
    </div>
  );
}

