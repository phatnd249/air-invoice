'use client';

import React from 'react';
import { numberToVietnameseWords } from '@/lib/numberToWords';
import { formatVietnamDateTime, formatVietnamDate } from '@/lib/date';

export interface InvoiceDesignTemplate {
  id?: string;
  name?: string;
  code?: string;
  description?: string;
  primaryColor?: string;
  headerBgColor?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: string;
  customTitle?: string;
  subtitle?: string;
  showTaxCodeBadge?: boolean;
  slogan?: string;
  showSellerInfo?: boolean;
  showBuyerInfo?: boolean;
  showBuyerCompany?: boolean;
  showBuyerAddress?: boolean;
  showBuyerPhone?: boolean;
  showBuyerEmail?: boolean;
  showDueDate?: boolean;
  showServiceUnit?: boolean;
  showMetaInfo?: boolean;
  showTotalInWords?: boolean;
  showQrCode?: boolean;
  showBankInfo?: boolean;
  qrLayout?: string;
  showSignatures?: boolean;
  customerSignTitle?: string;
  customerSignSub?: string;
  sellerSignTitle?: string;
  sellerSignSub?: string;
  footerNote?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

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
  designConfig?: Partial<InvoiceDesignTemplate>;
}

export const TEMPLATES_CONFIG = [
  {
    id: 'standard-classic',
    name: 'Mẫu Chuẩn Doanh Nghiệp',
    description: 'Mẫu hóa đơn GTGT cổ điển chuẩn doanh nghiệp, thanh lịch và tin cậy.',
    primaryColor: '#1e3a8a',
    fontFamily: 'serif',
  },
  {
    id: 'modern-minimalist',
    name: 'Mẫu Tối Giản Hiện Đại',
    description: 'Phong cách tối giản Clean & Sharp, phông chữ Sans hiện đại, tinh gọn.',
    primaryColor: '#0f172a',
    fontFamily: 'sans',
  },
  {
    id: 'tech-emerald',
    name: 'Mẫu Xanh Lục Bảo Công Nghệ',
    description: 'Tông màu xanh ngọc lục bảo trẻ trung năng động, phù hợp SaaS & AI.',
    primaryColor: '#059669',
    fontFamily: 'sans',
  },
  {
    id: 'formal-administrative',
    name: 'Mẫu Hành Chính Đầy Đủ (Có Chữ Ký)',
    description: 'Bố cục truyền thống có khối chữ ký Đại diện khách hàng / Người lập hóa đơn.',
    primaryColor: '#831843',
    fontFamily: 'serif',
  },
];

export default function InvoiceTemplateRenderer({
  invoice,
  settings,
  overrideTemplateId,
  designConfig,
}: InvoiceTemplateProps) {
  const currentTemplateId = overrideTemplateId || invoice.templateId || 'standard-classic';
  const theme =
    TEMPLATES_CONFIG.find((t) => t.id === currentTemplateId) || TEMPLATES_CONFIG[0];

  const pc = designConfig?.primaryColor || theme.primaryColor || '#1e3a8a';
  const headerBgColor = designConfig?.headerBgColor || '#f8fafc';
  const fontFamilyCss =
    designConfig?.fontFamily === 'sans'
      ? '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : designConfig?.fontFamily === 'mono'
      ? '"Courier New", Courier, monospace'
      : '"Times New Roman", "Noto Serif", Georgia, serif';

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

  const defaultTypeTitle = (() => {
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

  const titleText = designConfig?.customTitle || defaultTypeTitle;
  const subtitleText = designConfig?.subtitle || (designConfig?.showTaxCodeBadge ? '(Có mã của cơ quan thuế)' : '');
  const sloganText = designConfig?.slogan || '';

  const showSeller = !!designConfig?.showSellerInfo;
  const showBuyer = designConfig?.showBuyerInfo !== false;
  const showBuyerCompany = designConfig?.showBuyerCompany !== false;
  const showBuyerAddress = designConfig?.showBuyerAddress !== false;
  const showBuyerPhone = designConfig?.showBuyerPhone !== false;
  const showBuyerEmail = designConfig?.showBuyerEmail !== false;
  const showDueDate = designConfig?.showDueDate !== false;
  const showServiceUnit = designConfig?.showServiceUnit !== false;
  const showMetaInfo = designConfig?.showMetaInfo !== false;
  const showTotalInWords = designConfig?.showTotalInWords !== false;
  const showQrCode = designConfig?.showQrCode !== false;
  const showBankInfo = designConfig?.showBankInfo !== false;
  const qrLayout = designConfig?.qrLayout || 'side-by-side';
  const showSignatures = !!designConfig?.showSignatures;
  const customerSignTitle = designConfig?.customerSignTitle || 'ĐẠI DIỆN KHÁCH HÀNG';
  const customerSignSub = designConfig?.customerSignSub || '(Ký và ghi rõ họ tên)';
  const sellerSignTitle = designConfig?.sellerSignTitle || 'NGƯỜI LẬP HÓA ĐƠN';
  const sellerSignSub = designConfig?.sellerSignSub || '(Ký và ghi rõ họ tên)';
  const footerNote = designConfig?.footerNote || '';

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm 14mm; }
          .no-print { display: none !important; }
        }
        .invoice-paper-root {
          font-family: ${fontFamilyCss};
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
          flex-direction: ${qrLayout === 'stacked' ? 'column' : 'row'};
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
          padding: 16px 20px;
          border: 1px solid #d1d5db;
          background: #f8fafc;
          border-radius: 12px;
          page-break-inside: avoid;
        }
        @media (max-width: 640px) {
          .invoice-qr-bank-container {
            flex-direction: column;
          }
        }
        .invoice-qr-box {
          flex-shrink: 0;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .invoice-bank-box {
          flex: 1;
          width: 100%;
        }
      `}</style>

      <div className="invoice-paper-root bg-white shadow-lg mx-auto border border-slate-200 rounded-sm">
        {/* === SELLER INFO HEADER (IF ENABLED) === */}
        {showSeller && (
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4 pb-3 border-b border-slate-200 text-xs leading-relaxed">
            <div>
              <div className="text-base font-bold" style={{ color: pc }}>
                {invoice.sellerName || settings?.companyName || 'CÔNG TY TNHH GIÁO DỤC AI ROBOTIC'}
              </div>
              {(invoice.sellerAddress || settings?.address) && (
                <div className="text-slate-600">
                  Địa chỉ: {invoice.sellerAddress || settings?.address}
                </div>
              )}
              {(invoice.sellerTaxCode || settings?.taxCode) && (
                <div className="text-slate-600">
                  Mã số thuế: <strong>{invoice.sellerTaxCode || settings?.taxCode}</strong>
                </div>
              )}
              {(invoice.sellerPhone || settings?.phone || invoice.sellerEmail || settings?.email) && (
                <div className="text-slate-600">
                  {invoice.sellerPhone || settings?.phone ? `ĐT: ${invoice.sellerPhone || settings?.phone}` : ''}
                  {invoice.sellerEmail || settings?.email ? ` | Email: ${invoice.sellerEmail || settings?.email}` : ''}
                </div>
              )}
            </div>
            {settings?.logoUrl && (
              <img
                src={settings.logoUrl}
                alt="Logo"
                className="max-h-12 max-w-[140px] object-contain self-start"
              />
            )}
          </div>
        )}

        {/* === HEADER (TITLE & META) === */}
        <div className="invoice-header-clean">
          <div
            style={{
              fontSize: '22px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              color: pc,
              letterSpacing: '1px',
              marginBottom: '4px',
            }}
          >
            {titleText}
          </div>

          {subtitleText && (
            <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#64748b', marginBottom: '6px' }}>
              {subtitleText}
            </div>
          )}

          {sloganText && (
            <div style={{ fontSize: '11.5px', color: '#475569', marginBottom: '6px' }}>
              {sloganText}
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
                {formatVietnamDateTime(invoice.issueDate || (invoice as any).createdAt)}
              </strong>
            </div>
            {showDueDate && invoice.dueDate && (
              <>
                <span className="invoice-meta-dot">•</span>
                <div>
                  Hạn TT: <strong style={{ color: '#0f172a' }}>
                    {formatVietnamDate(invoice.dueDate)}
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
        {showBuyer && (
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
                {showBuyerCompany && invoice.buyerCompany && (
                  <tr>
                    <td colSpan={2} style={{ padding: '1px 0' }}>
                      Đơn vị: <strong>{invoice.buyerCompany}</strong>
                    </td>
                  </tr>
                )}
                {showBuyerAddress && invoice.buyerAddress && (
                  <tr>
                    <td colSpan={2} style={{ padding: '1px 0' }}>
                      Địa chỉ: {invoice.buyerAddress}
                    </td>
                  </tr>
                )}
                <tr>
                  {showBuyerPhone && invoice.buyerPhone && (
                    <td style={{ padding: '1px 0' }}>
                      Điện thoại: {invoice.buyerPhone}
                    </td>
                  )}
                  {showBuyerEmail && invoice.buyerEmail && (
                    <td style={{ padding: '1px 0' }}>
                      Email: {invoice.buyerEmail}
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* === SERVICE TABLE === */}
        <div className="table-responsive-wrapper">
          <table style={{ width: '100%', minWidth: '560px', borderCollapse: 'collapse', marginBottom: '6px' }}>
            <thead>
              <tr style={{ backgroundColor: headerBgColor }}>
                <th style={{ border: '1px solid #999', padding: '6px 8px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center', width: '36px', color: '#333' }}>STT</th>
                <th style={{ border: '1px solid #999', padding: '6px 8px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'left', color: '#333' }}>Tên dịch vụ / Nội dung</th>
                {showServiceUnit && (
                  <th style={{ border: '1px solid #999', padding: '6px 8px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center', width: '50px', color: '#333' }}>ĐVT</th>
                )}
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
                        {it.name}
                      </div>
                      {it.description && (
                        <div style={{ color: '#555', fontSize: '11.5px', marginTop: '1px' }}>
                          {it.description}
                        </div>
                      )}
                      {showMetaInfo && it.metaInfo && (
                        <div style={{ color: '#777', fontSize: '11px', fontStyle: 'italic', marginTop: '1px' }}>
                          {it.metaInfo}
                        </div>
                      )}
                    </td>
                    {showServiceUnit && (
                      <td style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'center', color: '#444', verticalAlign: 'top', fontSize: '12px' }}>
                        {it.unit || 'gói'}
                      </td>
                    )}
                    <td style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold', color: '#111', verticalAlign: 'top', fontSize: '12px' }}>
                      {it.quantity || 1}
                    </td>
                    <td style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'right', color: '#333', verticalAlign: 'top', fontSize: '12px' }}>
                      {formatCurrency(it.unitPrice)}
                    </td>
                    <td style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px', color: '#111', verticalAlign: 'top' }}>
                      {formatCurrency(it.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={showServiceUnit ? 6 : 5} style={{ border: '1px solid #bbb', padding: '16px', textAlign: 'center', color: '#888' }}>
                    Chưa có hạng mục nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* === TOTALS SUMMARY === */}
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
        {showTotalInWords && (
          <div style={{ fontSize: '12px', marginBottom: '16px', padding: '4px 0', borderBottom: '1px dashed #ccc' }}>
            <span style={{ color: '#555' }}>Số tiền bằng chữ: </span>
            <strong style={{ color: '#111', fontStyle: 'italic' }}>{inWords}.</strong>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div style={{ fontSize: '11.5px', color: '#555', marginBottom: '16px', fontStyle: 'italic' }}>
            <strong style={{ fontStyle: 'normal' }}>Ghi chú: </strong>{invoice.notes}
          </div>
        )}

        {/* === QR + BANK INFO === */}
        {(showQrCode || showBankInfo) && (
          <div className="invoice-qr-bank-container">
            {showQrCode && (
              <div className="invoice-qr-box">
                {invoice.status === 'PAID' ? (
                  <div style={{ background: '#f0fdf4', padding: '20px 24px', borderRadius: '12px', border: '2px solid #10b981', display: 'inline-block', textAlign: 'center', minWidth: '180px' }}>
                    <div style={{ fontSize: '36px', lineHeight: 1, marginBottom: '6px' }}>✔</div>
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
            )}

            {showBankInfo && (
              <div className="invoice-bank-box">
                <div style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', color: pc, marginBottom: '10px', letterSpacing: '0.5px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px' }}>
                  {invoice.status === 'PAID' ? 'Thông tin giao dịch & biên lai' : 'Thông tin thanh toán chuyển khoản'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '12.5px' }}>Ngân hàng thụ hưởng:</span>
                    <strong style={{ color: '#0f172a', fontSize: '13px' }}>{invoice.bankCode || settings?.bankCode || 'Vietcombank'}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '12.5px' }}>Số tài khoản:</span>
                    <strong style={{ fontFamily: "'Courier New', monospace", fontSize: '16px', color: pc, letterSpacing: '0.5px' }}>
                      {invoice.bankAccount || settings?.bankAccount || 'SHYNNERI'}
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
                    ✔ Hóa đơn đã được xác nhận thanh toán thành công &amp; hợp lệ.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* === SIGNATURES BLOCK (IF ENABLED) === */}
        {showSignatures && (
          <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', marginTop: '28px', marginBottom: '16px', pageBreakInside: 'avoid' }}>
            <div style={{ width: '45%' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12.5px', textTransform: 'uppercase', color: '#1e293b' }}>
                {customerSignTitle}
              </div>
              <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#64748b', marginTop: '2px' }}>
                {customerSignSub}
              </div>
              <div style={{ height: '60px' }}></div>
            </div>
            <div style={{ width: '45%' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12.5px', textTransform: 'uppercase', color: '#1e293b' }}>
                {sellerSignTitle}
              </div>
              <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#64748b', marginTop: '2px' }}>
                {sellerSignSub}
              </div>
              <div style={{ height: '60px' }}></div>
            </div>
          </div>
        )}

        {/* === FOOTER NOTE === */}
        {footerNote && (
          <div style={{ textAlign: 'center', fontSize: '11.5px', color: '#64748b', fontStyle: 'italic', marginTop: '16px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', pageBreakInside: 'avoid' }}>
            {footerNote}
          </div>
        )}
      </div>
    </>
  );
}
