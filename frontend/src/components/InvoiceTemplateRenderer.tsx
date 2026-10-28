'use client';

import React from 'react';
import { numberToVietnameseWords } from '@/lib/numberToWords';

export interface InvoiceTemplateProps {
  invoice: {
    invoiceNumber?: string;
    paymentCode?: string | null;
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
    description: 'Mẫu hóa đơn GTGT chuẩn doanh nghiệp theo quy định Việt Nam',
    primaryColor: '#2c3e50',
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

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm 14mm; }
          .no-print { display: none !important; }
        }
        .invoice-paper-root {
          font-family: 'Times New Roman', 'Noto Serif', serif;
          color: #1a1a1a;
          font-size: 13px;
          line-height: 1.5;
          padding: 16px 14px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media (min-width: 640px) {
          .invoice-paper-root {
            padding: 40px 48px;
          }
        }
        .invoice-header-clean {
          text-align: center;
          padding-bottom: 14px;
          border-bottom: 2px solid ${pc};
          margin-bottom: 12px;
        }
        .invoice-meta-row {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          gap: 14px;
          font-size: 13px;
          color: #475569;
        }
        .invoice-meta-dot {
          color: #94a3b8;
          user-select: none;
        }
        @media (max-width: 480px) {
          .invoice-meta-dot {
            display: none;
          }
          .invoice-meta-row {
            flex-direction: column;
            gap: 4px;
          }
        }
        .table-responsive-wrapper {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          margin-bottom: 8px;
        }
        .invoice-qr-bank-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          margin-bottom: 24px;
          padding: 16px 14px;
          border: 1px solid #d1d5db;
          background: #f8fafc;
          border-radius: 12px;
          page-break-inside: avoid;
        }
        @media (min-width: 640px) {
          .invoice-qr-bank-container {
            flex-direction: row;
            align-items: center;
            gap: 24px;
            padding: 18px 24px;
            border-radius: 8px;
          }
        }
        .invoice-qr-box {
          flex-shrink: 0;
          text-align: center;
        }
        .invoice-bank-box {
          width: 100%;
          font-size: 13px;
          line-height: 1.8;
          color: #334155;
        }
        @media (min-width: 640px) {
          .invoice-bank-box {
            flex: 1;
            width: auto;
          }
        }
      `}</style>
      <div
        className="invoice-paper-root bg-white max-w-[850px] mx-auto shadow-sm sm:shadow rounded-xl sm:rounded-2xl print:shadow-none print:border-none print:p-0"
      >
      {/* === HEADER === */}
      <div className="invoice-header-clean">
        <div style={{ fontSize: '22px', fontWeight: 'bold', textTransform: 'uppercase', color: pc, letterSpacing: '1px', marginBottom: '4px' }}>
          {typeTitle}
        </div>
        {formSubtitle && (
          <div style={{ fontSize: '11.5px', color: '#64748b', fontStyle: 'italic', marginBottom: '8px' }}>
            {formSubtitle}
          </div>
        )}
        <div className="invoice-meta-row">
          <div>
            Số: <strong style={{ fontSize: '14px', color: '#0f172a', fontFamily: "'Courier New', monospace" }}>
              {invoice.invoiceNumber || 'HD-000001'}
            </strong>
          </div>
          <span className="invoice-meta-dot">•</span>
          <div>
            Ngày tạo: <strong style={{ color: '#0f172a' }}>
              {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('vi-VN') : '---'}
            </strong>
          </div>
          {invoice.dueDate && (
            <>
              <span className="invoice-meta-dot">•</span>
              <div>
                Hạn TT: <strong style={{ color: '#0f172a' }}>
                  {new Date(invoice.dueDate).toLocaleDateString('vi-VN')}
                </strong>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status line */}
      {invoice.status && statusText(invoice.status) && (
        <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginBottom: '14px' }}>
          Trạng thái: <strong style={{ color: invoice.status === 'PAID' ? '#059669' : '#334155' }}>{statusText(invoice.status)}</strong>
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
      <div className="table-responsive-wrapper">
        <table style={{ width: '100%', minWidth: '560px', borderCollapse: 'collapse', marginBottom: '6px' }}>
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
      </div>

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
      <div className="invoice-qr-bank-container">
        {/* QR Code hoặc Huy Hiệu ĐÃ THANH TOÁN */}
        <div className="invoice-qr-box">
          {invoice.status === 'PAID' ? (
            <div style={{ background: '#f0fdf4', padding: '20px 24px', borderRadius: '12px', border: '2px solid #10b981', display: 'inline-block', textAlign: 'center', minWidth: '180px' }}>
              <div style={{ fontSize: '36px', lineHeight: 1, marginBottom: '6px' }}>✅</div>
              <div style={{ fontSize: '14px', color: '#065f46', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>ĐÃ THANH TOÁN</div>
              <div style={{ fontSize: '10px', color: '#047857', marginTop: '2px', fontWeight: 600 }}>PAID IN FULL</div>
            </div>
          ) : invoice.qrDataUrl ? (
            <div style={{ background: '#ffffff', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'inline-block' }}>
              <img
                src={invoice.qrDataUrl}
                alt="VietQR"
                style={{ width: '190px', maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }}
              />
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '6px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                QUÉT MÃ THANH TOÁN
              </div>
            </div>
          ) : (
            <div style={{ width: '190px', height: '190px', border: '2px dashed #cbd5e1', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px', background: '#fff' }}>
              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>VietQR</span>
              <span style={{ fontSize: '10px', marginTop: '4px' }}>Chưa tạo mã QR</span>
            </div>
          )}
        </div>

        {/* Bank Details */}
        <div className="invoice-bank-box">
          <div style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', color: pc, marginBottom: '10px', letterSpacing: '0.5px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px' }}>
            {invoice.status === 'PAID' ? 'Thông tin giao dịch & biên lai' : 'Thông tin thanh toán chuyển khoản'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
              <span style={{ color: '#64748b', fontSize: '12.5px' }}>Ngân hàng thụ hưởng:</span>
              <strong style={{ color: '#0f172a', fontSize: '13px' }}>{invoice.bankCode || settings?.bankCode || 'TPBank'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
              <span style={{ color: '#64748b', fontSize: '12.5px' }}>Số tài khoản:</span>
              <strong style={{ fontFamily: "'Courier New', monospace", fontSize: '16px', color: pc, letterSpacing: '0.5px' }}>
                {invoice.bankAccount || settings?.bankAccount || '00006322633'}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
              <span style={{ color: '#64748b', fontSize: '12.5px' }}>Chủ tài khoản:</span>
              <strong style={{ textTransform: 'uppercase', color: '#0f172a', fontSize: '13px' }}>
                {invoice.bankAccountName || settings?.bankAccountName || 'AI ROBOTIC'}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
              <span style={{ color: '#64748b', fontSize: '12.5px' }}>Số tiền:</span>
              <strong style={{ color: '#059669', fontSize: '16px' }}>
                {formatCurrency(invoice.grandTotal)}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', paddingTop: '2px' }}>
              <span style={{ color: '#64748b', fontSize: '12.5px' }}>Nội dung chuyển khoản:</span>
              <strong style={{ fontFamily: "'Courier New', monospace", background: '#ffffff', padding: '3px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14px', letterSpacing: '0.5px' }}>
                {invoice.paymentCode || invoice.invoiceNumber || 'HD'}
              </strong>
            </div>
          </div>

          {invoice.status === 'PAID' && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', padding: '8px 12px', marginTop: '12px', color: '#065f46', fontSize: '12px', fontWeight: 600 }}>
              ✅ Hóa đơn đã được xác nhận thanh toán thành công &amp; hợp lệ.
            </div>
          )}
        </div>
      </div>

      {/* === SIGNATURES === */}
      <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '12px', color: '#444', borderTop: '1px solid #ddd', paddingTop: '16px', pageBreakInside: 'avoid' }}>
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
            Người lập hóa đơn
          </div>
          <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic', marginBottom: '60px' }}>
            (Ký và ghi rõ họ tên)
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
