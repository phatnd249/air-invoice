'use client';

import React from 'react';
import { numberToVietnameseWords } from '@/lib/numberToWords';

export interface InvoiceTemplateProps {
  invoice: {
    invoiceNumber?: string;
    issueDate?: string | Date;
    dueDate?: string | Date | null;
    status?: string;
    invoiceType?: string;
    invoiceForm?: string;
    templateId?: string;
    sellerName?: string | null;
    sellerTaxCode?: string | null;
    sellerAddress?: string | null;
    sellerPhone?: string | null;
    sellerEmail?: string | null;
    sellerLogoUrl?: string | null;
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

  const typeTitle = (() => {
    switch (invoice.invoiceType) {
      case 'BAN_HANG':
        return 'HÓA ĐƠN BÁN HÀNG';
      case 'TAI_SAN_CONG':
        return 'HÓA ĐƠN BÁN TÀI SẢN CÔNG';
      case 'DU_TRU_QG':
        return 'HÓA ĐƠN BÁN HÀNG DỰ TRỮ QUỐC GIA';
      case 'GTGT':
      default:
        return 'HÓA ĐƠN GIÁ TRỊ GIA TĂNG';
    }
  })();

  const formSubtitle = (() => {
    switch (invoice.invoiceForm) {
      case 'WITHOUT_TAX_CODE':
        return '(Không có mã của cơ quan thuế)';
      case 'POS_CONNECTED':
        return '(Khởi tạo từ máy tính tiền)';
      case 'WITH_TAX_CODE':
      default:
        return '(Có mã của cơ quan thuế)';
    }
  })();

  const companyName = invoice.sellerName || settings?.companyName || 'CÔNG TY TNHH GIÁO DỤC AI ROBOTIC';
  const address = invoice.sellerAddress || settings?.address || 'Số 10 Huỳnh Văn Nghệ, P. Trấn Biên, Đồng Nai';
  const taxCode = invoice.sellerTaxCode || settings?.taxCode || '3603893101';
  const phone = invoice.sellerPhone || settings?.phone;
  const email = invoice.sellerEmail || settings?.email;
  const logoUrl = invoice.sellerLogoUrl || settings?.logoUrl;

  return (
    <div
      className="bg-white max-w-[850px] mx-auto print:shadow-none print:border-none print:p-0"
      style={{ fontFamily: "'Times New Roman', 'Noto Serif', serif", color: '#1a1a1a', fontSize: '13px', lineHeight: '1.5', padding: '40px 48px', border: '1px solid #ccc' }}
    >
      {/* === HEADER === */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '12px', borderBottom: `2px solid ${pc}`, marginBottom: '4px' }}>
        {/* Seller Info */}
        <div style={{ maxWidth: '55%' }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              style={{ maxHeight: '40px', maxWidth: '160px', objectFit: 'contain', marginBottom: '4px' }}
            />
          ) : (
            <div style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', color: pc, marginBottom: '4px', letterSpacing: '0.5px' }}>
              {companyName}
            </div>
          )}
          <div style={{ fontSize: '11.5px', color: '#444' }}>
            Địa chỉ: {address}
          </div>
          <div style={{ fontSize: '11.5px', color: '#444' }}>
            MST: {taxCode}
            {phone && <> &nbsp;—&nbsp; ĐT: {phone}</>}
          </div>
          {email && (
            <div style={{ fontSize: '11.5px', color: '#444' }}>Email: {email}</div>
          )}
        </div>

        {/* Invoice Title */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase', color: pc, letterSpacing: '1px' }}>
            {typeTitle}
          </div>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px', fontStyle: 'italic' }}>
            {formSubtitle}
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px', padding: '16px 20px', border: '1px solid #d1d5db', background: '#f8fafc', borderRadius: '8px' }}>
        {/* QR Code - PHÓNG TO RÕ NÉT */}
        <div style={{ flexShrink: 0, textAlign: 'center' }}>
          {invoice.qrDataUrl ? (
            <div style={{ background: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', display: 'inline-block' }}>
              <img
                src={invoice.qrDataUrl}
                alt="VietQR"
                style={{ width: '220px', height: 'auto', display: 'block', margin: '0 auto' }}
              />
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Quét mã để thanh toán tức thì
              </div>
            </div>
          ) : (
            <div style={{ width: '220px', height: '220px', border: '2px dashed #cbd5e1', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px', background: '#fff' }}>
              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>VietQR</span>
              <span style={{ fontSize: '10px', marginTop: '4px' }}>Chưa tạo mã QR</span>
            </div>
          )}
        </div>

        {/* Bank Details */}
        <div style={{ fontSize: '13px', lineHeight: '2.0', color: '#334155', flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', color: pc, marginBottom: '6px', letterSpacing: '0.5px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '4px' }}>
            Thông tin thanh toán chuyển khoản
          </div>
          <div>
            Ngân hàng thụ hưởng: <strong style={{ color: '#0f172a' }}>{invoice.bankCode || settings?.bankCode || 'Vietcombank'}</strong>
          </div>
          <div>
            Số tài khoản: <strong style={{ fontFamily: "'Courier New', monospace", fontSize: '16px', color: pc, letterSpacing: '0.5px' }}>
              {invoice.bankAccount || settings?.bankAccount || 'SHYNNERI'}
            </strong>
          </div>
          <div>
            Chủ tài khoản: <strong style={{ textTransform: 'uppercase', color: '#0f172a' }}>
              {invoice.bankAccountName || settings?.bankAccountName || 'AI ROBOTIC'}
            </strong>
          </div>
          <div>
            Số tiền: <strong style={{ color: '#059669', fontSize: '15px' }}>
              {formatCurrency(invoice.grandTotal)}
            </strong>
          </div>
          <div style={{ marginTop: '2px' }}>
            Nội dung chuyển khoản: <strong style={{ fontFamily: "'Courier New', monospace", background: '#fff', padding: '2px 8px', border: '1px solid #94a3b8', borderRadius: '4px', color: '#0f172a', fontSize: '14px' }}>
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
