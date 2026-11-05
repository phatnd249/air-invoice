import React from 'react';
import { RefreshCw, Inbox, Key, Eye, RotateCcw, Trash2 } from 'lucide-react';
import { formatVietnamDateTime } from '@/lib/date';
import { QueueJobItem, TYPE_CONFIG } from './types';
import { QueueStatusBadge } from './QueueStatusBadge';

interface QueueTableProps {
  jobs: QueueJobItem[];
  isLoading: boolean;
  totalJobs: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  selectedIds: string[];
  onToggleSelectAll: () => void;
  onToggleSelectRow: (id: string) => void;
  onViewDetail: (job: QueueJobItem) => void;
  onRetry: (id: string) => void;
  isRetrying: boolean;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  hasFilters: boolean;
}

export function QueueTable({
  jobs,
  isLoading,
  totalJobs,
  currentPage,
  totalPages,
  onPageChange,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectRow,
  onViewDetail,
  onRetry,
  isRetrying,
  onDelete,
  isDeleting,
  hasFilters,
}: QueueTableProps) {
  const isAllSelected = jobs.length > 0 && jobs.every((j) => selectedIds.includes(j.id));
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <p className="text-sm text-slate-500">Đang tải danh sách hàng chờ...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-800 text-base">Hàng chờ đang trống</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          {hasFilters
            ? 'Không tìm thấy request nào phù hợp với bộ lọc hiện tại.'
            : 'Hiện không có request nào đang chờ xử lý. Các request gửi đến API sẽ được ghi nhận tại đây.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/75 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 pl-4 pr-1 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isSomeSelected;
                  }}
                  onChange={onToggleSelectAll}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  title={isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  aria-label="Chọn tất cả request"
                />
              </th>
              <th className="py-3.5 px-4">Thời Gian &amp; ID</th>
              <th className="py-3.5 px-4">API / Nguồn Tiếp Nhận</th>
              <th className="py-3.5 px-4">Tác Vụ &amp; Đối Tượng</th>
              <th className="py-3.5 px-4 text-center">Tiến Độ Thử Lại</th>
              <th className="py-3.5 px-4 text-center">Trạng Thái</th>
              <th className="py-3.5 px-5 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {jobs.map((job) => {
              const isSelected = selectedIds.includes(job.id);
              const typeCfg = TYPE_CONFIG[job.type] || TYPE_CONFIG.CUSTOM;
              const TypeIcon = typeCfg.icon;

              return (
                <tr
                  key={job.id}
                  className={`transition-colors group ${
                    isSelected ? 'bg-blue-50/70 hover:bg-blue-50' : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Checkbox chọn hàng */}
                  <td className="py-4 pl-4 pr-1 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectRow(job.id)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                      aria-label={`Chọn request ${job.id}`}
                    />
                  </td>

                  {/* Thời gian & ID */}
                  <td className="py-4 px-4">
                    <div className="font-mono text-slate-900 font-semibold text-xs">
                      {formatVietnamDateTime(job.createdAt)}
                    </div>
                    <div className="font-mono text-xs text-slate-400 mt-0.5">
                      ID: {job.id.slice(0, 8)}...
                    </div>
                  </td>

                  {/* API / Nguồn tiếp nhận */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200 text-xs inline-flex items-center gap-1">
                        <Key className="w-3 h-3 text-blue-600" />
                        {job.apiName || 'Hệ thống'}
                      </span>
                    </div>
                    <div
                      className="font-mono text-xs text-slate-500 mt-1 truncate max-w-[200px]"
                      title={job.endpoint || ''}
                    >
                      {job.endpoint || job.source || 'Direct API'}
                    </div>
                  </td>

                  {/* Tác vụ & Đối tượng */}
                  <td className="py-4 px-4">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <TypeIcon className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="line-clamp-1">{job.title || typeCfg.label}</span>
                    </div>
                    {job.targetInfo && (
                      <div className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                        {job.targetInfo}
                      </div>
                    )}
                    {job.errorMessage && (
                      <div
                        className="text-xs text-rose-600 line-clamp-1 mt-1 font-mono bg-rose-50 px-2 py-0.5 rounded border border-rose-100"
                        title={job.errorMessage}
                      >
                        ⚠️ {job.errorMessage}
                      </div>
                    )}
                  </td>

                  {/* Tiến độ thử lại */}
                  <td className="py-4 px-4 text-center">
                    <div className="font-mono font-semibold text-sm text-slate-800">
                      {job.retryCount} / {job.maxRetries}
                    </div>
                    {job.retryCount > 0 && job.status === 'PENDING' && (
                      <div className="text-xs text-amber-600 font-medium mt-0.5">
                        Gửi lại: {formatVietnamDateTime(job.nextRunAt).slice(0, 5)}
                      </div>
                    )}
                  </td>

                  {/* Trạng thái */}
                  <td className="py-4 px-4 text-center">
                    <QueueStatusBadge
                      status={job.status}
                      retryCount={job.retryCount}
                      maxRetries={job.maxRetries}
                    />
                  </td>

                  {/* Thao tác */}
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Nút Xem chi tiết */}
                      <button
                        type="button"
                        onClick={() => onViewDetail(job)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Xem chi tiết Request"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Nút Thử lại ngay */}
                      {(job.status === 'FAILED' || job.status === 'PENDING') && (
                        <button
                          type="button"
                          onClick={() => onRetry(job.id)}
                          disabled={isRetrying}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Thử lại ngay lập tức"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}

                      {/* Nút Xóa */}
                      <button
                        type="button"
                        onClick={() => onDelete(job.id)}
                        disabled={isDeleting}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer phân trang */}
      {totalJobs > 0 && (
        <div className="px-5 py-3 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-sm text-slate-500">
          <span>
            Hiển thị <strong>{jobs.length}</strong> / <strong>{totalJobs}</strong> request
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                className="px-3 py-1 rounded-lg text-sm bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                Trang trước
              </button>
              <span className="px-2 font-mono font-medium text-sm">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                className="px-3 py-1 rounded-lg text-sm bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                Trang sau
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

