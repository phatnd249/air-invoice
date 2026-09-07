'use client';

import React from 'react';
import { numberToVietnameseWords } from '@/lib/numberToWords';

export interface InvoiceTemplateProps {
  invoice: {
    invoiceNumber?: string;
    issueDate?: string | Date;
    dueDate?: string | Date | null;
    status?: string;
    templateId?: string;
    buyerName?: string;
    buyerCompany?: string | null;
    buyerAddress?: string | null;
    buyerTaxCode?: string | null;
    buyerEmail?: string | null;
    buyerPhone?: string | null;
    hasVat?: boolean;
    vatRate?: number;
    subTotal?: number;
    vatAmount?: number;
    otherFee?: number;
    grandTotal?: number;
    qrDataUrl?: string | null;
    bankCode?: string | null;
    bankAccount?: string | null;
    bankAccountName?: string | null;
    notes?: string | null;
    items?: Array<{
      id?: string;
      name: string;
      description?: string | null;
      metaInfo?: string | null;
      unit?: string;
      quantity?: number;
      unitPrice?: number;
      amount?: number;
    }>;
  };
  settings?: {
    companyName?: string;
    address?: string | null;
    taxCode?: string | null;
    phone?: string | null;
    email?: string | null;
    logoUrl?: string | null;
    bankCode?: string | null;
    bankAccount?: string | null;
    bankAccountName?: string | null;
  };
  overrideTemplateId?: string;
}

export const TEMPLATES_CONFIG = [
  {
    id: 'standard-classic',
    name: 'Mẫu Chuẩn Doanh Nghiệp',
    subName: 'Midnight Navy (#2c3e50)',
    description: 'Mẫu hóa đơn thanh toán chuẩn doanh nghiệp trang trọng',
    primaryColor: '#2c3e50',
    accentColor: '#34495e',
  },
  {
    id: 'modern-minimal',
    name: 'Mẫu Tối Giản Hành Chính',
    subName: 'Monochrome Clean (#111827)',
    description: 'Mẫu đen trắng tối giản chuẩn in laser văn phòng',
    primaryColor: '#111827',
    accentColor: '#374151',
  },
  {
    id: 'tech-emerald',
    name: 'Mẫu Dịch Vụ Công Nghệ',
    subName: 'Enterprise Green (#047857)',
    description: 'Phù hợp các đơn vị cung cấp Hosting, Phần mềm & IT',
    primaryColor: '#047857',
    accentColor: '#065f46',
  },
  {
    id: 'elegant-ruby',
    name: 'Mẫu Biên Lai Thu Tiền',
    subName: 'Official Burgundy (#991b1b)',
    description: 'Phong cách biên lai xác nhận thanh toán truyền thống',
    primaryColor: '#991b1b',
    accentColor: '#7f1d1d',
  },
];

export default function InvoiceTemplateRenderer({
  invoice,
  settings,
  overrideTemplateId,
}: InvoiceTemplateProps) {
  const currentTemplateId = overrideTemplateId || invoice.templateId || 'standard-classic';
  const theme =
    TEMPLATES_CONFIG.find((t) => t.id === currentTemplateId) || TEMPLATES_CONFIG[0];

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const grandTotal = invoice.grandTotal || 0;
  const inWords = numberToVietnameseWords(grandTotal);

  const statusText = (status?: string) => {
    switch (status) {
      case 'ISSUED': return 'ĐÃ PHÁT HÀNH';
      case 'SENT': return 'ĐÃ GỬI';
      case 'PAID': return 'ĐÃ THANH TOÁN';
      case 'CANCELLED': return 'ĐÃ HỦY';
      default: return '';
    }
  };

  const pc = theme.primaryColor;

  return (
    <div
      className="bg-white max-w-[850px] mx-auto print:shadow-none print:border-none print:p-0"
      style={{ fontFamily: "'Times New Roman', 'Noto Serif', serif", color: '#1a1a1a', fontSize: '13px', lineHeight: '1.5', padding: '40px 48px', border: '1px solid #ccc' }}
    >
      {/* === HEADER === */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '12px', borderBottom: `2px solid ${pc}`, marginBottom: '4px' }}>
        {/* Seller Info */}
        <div style={{ maxWidth: '55%' }}>
          {settings?.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt="Logo"
              style={{ maxHeight: '40px', maxWidth: '160px', objectFit: 'contain', marginBottom: '4px' }}
            />
          ) : (
            <div style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', color: pc, marginBottom: '4px', letterSpacing: '0.5px' }}>
              {settings?.companyName || 'CÔNG TY TNHH GIÁO DỤC AI ROBOTIC'}
            </div>
          )}
          <div style={{ fontSize: '11.5px', color: '#444' }}>
            Địa chỉ: {settings?.address || 'Số 10 Huỳnh Văn Nghệ, P. Trấn Biên, Đồng Nai'}
          </div>
          <div style={{ fontSize: '11.5px', color: '#444' }}>
            MST: {settings?.taxCode || '3603893101'}
            {settings?.phone && <> &nbsp;—&nbsp; ĐT: {settings.phone}</>}
          </div>
          {settings?.email && (
            <div style={{ fontSize: '11.5px', color: '#444' }}>Email: {settings.email}</div>
          )}
        </div>

        {/* Invoice Title */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '22px', fontWeight: 'bold', textTransform: 'uppercase', color: pc, letterSpacing: '1px' }}>
            HÓA ĐƠN
          </div>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>
            (THANH TOÁN DỊCH VỤ)
          </div>
          <div style={{ fontSize: '12px', color: '#555' }}>
            Số: <strong style={{ fontSize: '14px', color: '#111', fontFamily: "'Courier New', monospace" }}>
              {invoice.invoiceNumber || 'HD-000001'}
            </strong>
          </div>
          <div style={{ fontSize: '12px', color: '#555' }}>
            Ngày: <strong style={{ color: '#111' }}>
              {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('vi-VN') : '---'}
            </strong>
          </div>
          {invoice.dueDate && (
            <div style={{ fontSize: '12px', color: '#555' }}>
              Hạn TT: <strong style={{ color: '#111' }}>
                {new Date(invoice.dueDate).toLocaleDateString('vi-VN')}
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* Status line */}
      {invoice.status && statusText(invoice.status) && (
        <div style={{ textAlign: 'right', fontSize: '10px', color: '#888', fontStyle: 'italic', marginBottom: '12px', paddingTop: '2px' }}>
          Trạng thái: {statusText(invoice.status)}
        </div>
      )}

      {/* === BUYER INFO === */}
      <div style={{ marginBottom: '16px', fontSize: '12.5px', lineHeight: '1.7' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666', marginBottom: '4px' }}>
          Thông tin người mua
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ width: invoice.buyerTaxCode ? '50%' : '100%', padding: '1px 0', verticalAlign: 'top' }}>
                Họ tên: <strong style={{ color: '#111' }}>{invoice.buyerName || '...............'}</strong>
              </td>
              {invoice.buyerTaxCode ? (
                <td style={{ width: '50%', padding: '1px 0', verticalAlign: 'top' }}>
                  MST: <strong>{invoice.buyerTaxCode}</strong>
                </td>
              ) : null}
            </tr>
            {invoice.buyerCompany && (
              <tr>
                <td colSpan={2} style={{ padding: '1px 0' }}>
                  Đơn vị: <strong>{invoice.buyerCompany}</strong>
                </td>
              </tr>
            )}
            {invoice.buyerAddress && (
              <tr>
                <td colSpan={2} style={{ padding: '1px 0' }}>
                  Địa chỉ: {invoice.buyerAddress}
                </td>
              </tr>
            )}
            <tr>
              {invoice.buyerPhone && (
                <td style={{ padding: '1px 0' }}>
                  Điện thoại: {invoice.buyerPhone}
                </td>
              )}
              {invoice.buyerEmail && (
                <td style={{ padding: '1px 0' }}>
                  Email: {invoice.buyerEmail}
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* === SERVICE TABLE === */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ border: '1px solid #999', padding: '6px 8px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center', width: '36px', color: '#333' }}>STT</th>
            <th style={{ border: '1px solid #999', padding: '6px 8px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'left', color: '#333' }}>Tên dịch vụ / Nội dung</th>
            <th style={{ border: '1px solid #999', padding: '6px 8px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center', width: '50px', color: '#333' }}>ĐVT</th>
            <th style={{ border: '1px solid #999', padding: '6px 8px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center', width: '40px', color: '#333' }}>SL</th>
            <th style={{ border: '1px solid #999', padding: '6px 8px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'right', width: '100px', color: '#333' }}>Đơn giá</th>
            <th style={{ border: '1px solid #999', padding: '6px 8px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'right', width: '110px', color: '#333' }}>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items && invoice.items.length > 0 ? (
            invoice.items.map((it, idx) => (
              <tr key={it.id || idx}>
                <td style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'center', color: '#666', verticalAlign: 'top', fontSize: '12px' }}>
                  {idx + 1}
                </td>
                <td style={{ border: '1px solid #bbb', padding: '6px 8px', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#111' }}>
                    {it.name || '---'}
                  </div>
                  {it.description && (
                    <div style={{ fontSize: '11.5px', color: '#555', marginTop: '1px' }}>
                      {it.description}
                    </div>
                  )}
                  {it.metaInfo && (
                    <div style={{ fontSize: '11px', color: '#777', fontStyle: 'italic', marginTop: '1px' }}>
                      {it.metaInfo}
                    </div>
                  )}
                </td>
                <td style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'center', color: '#444', verticalAlign: 'top', fontSize: '12px' }}>
                  {it.unit || 'gói'}
                </td>
                <td style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold', color: '#111', verticalAlign: 'top', fontSize: '12px' }}>
                  {it.quantity || 1}
                </td>
                <td style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'right', color: '#333', verticalAlign: 'top', fontSize: '12px' }}>
                  {formatCurrency(it.unitPrice)}
                </td>
                <td style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', color: '#111', verticalAlign: 'top', fontSize: '13px' }}>
                  {formatCurrency(it.amount)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} style={{ border: '1px solid #bbb', padding: '20px', textAlign: 'center', color: '#999', fontStyle: 'italic' }}>
                Chưa có dòng dịch vụ nào
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* === TOTALS === */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #bbb', padding: '5px 10px', textAlign: 'right', fontSize: '12px', color: '#444', width: '70%' }}>
              Cộng tiền dịch vụ:
            </td>
            <td style={{ border: '1px solid #bbb', padding: '5px 10px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#111' }}>
              {formatCurrency(invoice.subTotal)}
            </td>
          </tr>
          {invoice.hasVat && (
            <tr>
              <td style={{ border: '1px solid #bbb', padding: '5px 10px', textAlign: 'right', fontSize: '12px', color: '#444' }}>
                Thuế GTGT ({invoice.vatRate || 10}%):
              </td>
              <td style={{ border: '1px solid #bbb', padding: '5px 10px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#111' }}>
                {formatCurrency(invoice.vatAmount)}
              </td>
            </tr>
          )}
          {invoice.otherFee ? (
            <tr>
              <td style={{ border: '1px solid #bbb', padding: '5px 10px', textAlign: 'right', fontSize: '12px', color: '#444' }}>
                Phí khác:
              </td>
              <td style={{ border: '1px solid #bbb', padding: '5px 10px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#111' }}>
                {formatCurrency(invoice.otherFee)}
              </td>
            </tr>
          ) : null}
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <td style={{ border: '1px solid #999', padding: '7px 10px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold', color: '#111', textTransform: 'uppercase' }}>
              Tổng cộng thanh toán:
            </td>
            <td style={{ border: '1px solid #999', padding: '7px 10px', textAlign: 'right', fontSize: '16px', fontWeight: 'bold', color: pc }}>
              {formatCurrency(invoice.grandTotal)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Amount in Words */}
      <div style={{ fontSize: '12px', marginBottom: '16px', padding: '4px 0', borderBottom: '1px dashed #ccc' }}>
        <span style={{ color: '#555' }}>Số tiền bằng chữ: </span>
        <strong style={{ color: '#111', fontStyle: 'italic' }}>{inWords}.</strong>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div style={{ fontSize: '11.5px', color: '#555', marginBottom: '16px', fontStyle: 'italic' }}>
          <strong style={{ fontStyle: 'normal' }}>Ghi chú: </strong>{invoice.notes}
        </div>
      )}

      {/* === QR + BANK INFO === */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '24px', padding: '12px', border: '1px solid #ddd', background: '#fafafa' }}>
        {/* QR Code - BIGGER */}
        <div style={{ flexShrink: 0 }}>
          {invoice.qrDataUrl ? (
            <img
              src={invoice.qrDataUrl}
              alt="VietQR"
              style={{ width: '160px', height: 'auto', border: '1px solid #ddd' }}
            />
          ) : (
            <div style={{ width: '160px', height: '160px', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '11px' }}>
              VietQR
            </div>
          )}
        </div>

        {/* Bank Details */}
        <div style={{ fontSize: '12px', lineHeight: '1.8', color: '#333' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', color: '#555', marginBottom: '4px', letterSpacing: '0.3px' }}>
            Thông tin chuyển khoản
          </div>
          <div>
            Ngân hàng: <strong>{invoice.bankCode || settings?.bankCode || 'Vietcombank'}</strong>
          </div>
          <div>
            Số tài khoản: <strong style={{ fontFamily: "'Courier New', monospace", fontSize: '14px', color: pc }}>
              {invoice.bankAccount || settings?.bankAccount || 'SHYNNERI'}
            </strong>
          </div>
          <div>
            Chủ TK: <strong style={{ textTransform: 'uppercase' }}>
              {invoice.bankAccountName || settings?.bankAccountName || 'AI ROBOTIC'}
            </strong>
          </div>
          <div>
            Nội dung CK: <strong style={{ fontFamily: "'Courier New', monospace", background: '#fff', padding: '1px 6px', border: '1px solid #ccc' }}>
              {invoice.invoiceNumber || 'HD'}
            </strong>
          </div>
        </div>
      </div>

      {/* === SIGNATURES === */}
      <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '12px', color: '#444', borderTop: '1px solid #ddd', paddingTop: '16px' }}>
        <div style={{ width: '45%' }}>
          <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px', color: '#111', marginBottom: '2px' }}>
            Đại diện khách hàng
          </div>
          <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic', marginBottom: '60px' }}>
            (Ký và ghi rõ họ tên)
          </div>
          <div style={{ fontWeight: 'bold', color: '#333' }}>{invoice.buyerName || '...............'}</div>
        </div>

        <div style={{ width: '45%' }}>
          <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px', color: '#111', marginBottom: '2px' }}>
            Đại diện đơn vị cung cấp
          </div>
          <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic', marginBottom: '60px' }}>
            (Ký, đóng dấu hoặc xác nhận số)
          </div>
          <div style={{ fontWeight: 'bold', color: '#333' }}>{settings?.companyName || 'AI ROBOTIC'}</div>
        </div>
      </div>
    </div>
  );
}
