'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutTemplate, Check } from 'lucide-react';

export default function TemplatesPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8 pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Mẫu Hóa Đơn (Templates)</h1>
        <p className="text-sm text-slate-500 mt-1">
          Danh sách mẫu hiển thị hóa đơn khi xem trực tiếp và xuất file PDF
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Template 1: Classic Blue */}
        <div className="bg-white rounded-xl border-2 border-blue-600 shadow-md p-6 relative overflow-hidden">
          <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold flex items-center space-x-1">
            <Check className="w-3 h-3" />
            <span>Mặc định</span>
          </div>

          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <LayoutTemplate className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Standard Classic (Midnight Blue)</h3>
              <p className="text-xs text-slate-500">Khổ A4 tiêu chuẩn • Có VietQR SePay</p>
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-6">
            Mẫu chuẩn trang trọng với tông màu xanh navy `#2c3e50`, hiển thị phân cấp 3 tầng chi tiết cho dịch vụ và tích hợp mã VietQR quét thanh toán tức thì.
          </p>

          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-xs space-y-1 text-slate-600">
            <div className="flex justify-between">
              <span>Khổ giấy hỗ trợ:</span>
              <span className="font-semibold text-slate-800">A4</span>
            </div>
            <div className="flex justify-between">
              <span>Định dạng:</span>
              <span className="font-semibold text-slate-800">HTML / PDF</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
