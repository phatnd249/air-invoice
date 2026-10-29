import { Injectable, Logger, OnModuleDestroy, Optional } from '@nestjs/common';
import { chromium, Browser, Page } from 'playwright';
import { numberToVietnameseWords } from './numberToWords';
import { PrismaService } from '../prisma/prisma.service';

interface TemplateTheme {
  primaryColor: string;
}

const TEMPLATE_THEMES: Record<string, TemplateTheme> = {
  'standard-classic': { primaryColor: '#1e3a8a' },
  'modern-minimalist': { primaryColor: '#0f172a' },
  'tech-emerald': { primaryColor: '#059669' },
  'formal-administrative': { primaryColor: '#831843' },
};

/**
 * Cờ Chromium tối ưu RAM cho container nhỏ (512MB):
 * - tắt GPU / software rasterizer: -12MB đo được
 * - giới hạn V8 heap của renderer: tránh renderer phình to
 * - --disable-dev-shm-usage: bắt buộc trong container ( /dev/shm mặc định 64MB )
 */
const CHROMIUM_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-gpu',
  '--disable-software-rasterizer',
  '--disable-gpu-compositing',
  '--disable-dev-shm-usage',
  '--disable-extensions',
  '--disable-background-networking',
  '--disable-sync',
  '--disable-translate',
  '--metrics-recording-only',
  '--mute-audio',
  '--no-first-run',
  '--js-flags=--max-old-space-size=96',
];

/** Đóng Chromium sau khi rảnh để trả lại ~180-200MB RAM cho OS. */
const BROWSER_IDLE_TIMEOUT_MS = Number(process.env.PDF_BROWSER_IDLE_TIMEOUT_MS) || 60_000;
/** Timeout render 1 hóa đơn. */
const PDF_RENDER_TIMEOUT_MS = Number(process.env.PDF_RENDER_TIMEOUT_MS) || 30_000;

@Injectable()
export class PdfService implements OnModuleDestroy {
  private readonly logger = new Logger(PdfService.name);
  private browser: Browser | null = null;
  private page: Page | null = null;
  private idleTimer: NodeJS.Timeout | null = null;
  /** Hàng đợi: chỉ render 1 PDF tại một thời điểm để tránh nhân đôi RAM. */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  async onModuleDestroy(): Promise<void> {
    await this.closeBrowser('module destroy');
  }

  private async getPage(): Promise<Page> {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await chromium.launch({ headless: true, args: CHROMIUM_ARGS });
      this.browser.on('disconnected', () => {
        this.browser = null;
        this.page = null;
      });
      this.page = await this.browser.newPage();
    } else if (!this.page || this.page.isClosed()) {
      this.page = await this.browser.newPage();
    }

    this.clearIdleTimer();
    return this.page;
  }

  private clearIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  private scheduleIdleClose(): void {
    this.clearIdleTimer();
    this.idleTimer = setTimeout(() => {
      void this.closeBrowser('idle');
    }, BROWSER_IDLE_TIMEOUT_MS);
    this.idleTimer.unref?.();
  }

  private async closeBrowser(reason: string): Promise<void> {
    this.clearIdleTimer();
    const browser = this.browser;
    this.browser = null;
    this.page = null;
    if (!browser) return;
    try {
      await browser.close();
      this.logger.debug(`Chromium đã đóng (${reason})`);
    } catch (err) {
      this.logger.warn(`Không đóng được Chromium (${reason}): ${(err as Error).message}`);
    }
  }

  generateInvoiceHtml(invoice: any, settings: any, customDesign?: any): string {
    const templateId = invoice.templateId || 'standard-classic';
    const fallbackTheme = TEMPLATE_THEMES[templateId] || TEMPLATE_THEMES['standard-classic'];
    const design = customDesign || {};

    const pc = design.primaryColor || fallbackTheme.primaryColor || '#1e3a8a';
    const headerBgColor = design.headerBgColor || '#f8fafc';
    const fontFamilyCss =
      design.fontFamily === 'sans'
        ? 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        : design.fontFamily === 'mono'
        ? '"Courier New", Courier, monospace'
        : '"Times New Roman", "Noto Serif", Georgia, serif';

    const fmt = (n: number) =>
      new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

    const grandTotal = invoice.grandTotal || 0;
    const inWords = numberToVietnameseWords(grandTotal);

    const statusLabel = (s: string) => {
      if (s === 'ISSUED') return 'ĐÃ PHÁT HÀNH';
      if (s === 'SENT') return 'ĐÃ GỬI';
      if (s === 'PAID') return 'ĐÃ THANH TOÁN';
      if (s === 'CANCELLED') return 'ĐÃ HỦY';
      return '';
    };

    const showServiceUnit = design.showServiceUnit !== false;
    const showMetaInfo = design.showMetaInfo !== false;

    const rows = (invoice.items || [])
      .map((it: any, idx: number) => {
        const desc = it.description ? `<div style="color:#555;font-size:11.5px;margin-top:1px">${it.description}</div>` : '';
        const meta = showMetaInfo && it.metaInfo ? `<div style="color:#777;font-size:11px;font-style:italic;margin-top:1px">${it.metaInfo}</div>` : '';
        return `<tr>
          <td style="border:1px solid #bbb;padding:6px 8px;text-align:center;color:#666;vertical-align:top;font-size:12px">${idx + 1}</td>
          <td style="border:1px solid #bbb;padding:6px 8px;vertical-align:top"><strong style="display:block;color:#111;font-size:13px">${it.name || ''}</strong>${desc}${meta}</td>
          ${showServiceUnit ? `<td style="border:1px solid #bbb;padding:6px 8px;text-align:center;color:#444;vertical-align:top;font-size:12px">${it.unit || 'gói'}</td>` : ''}
          <td style="border:1px solid #bbb;padding:6px 8px;text-align:center;font-weight:bold;color:#111;vertical-align:top;font-size:12px">${it.quantity || 1}</td>
          <td style="border:1px solid #bbb;padding:6px 8px;text-align:right;color:#333;vertical-align:top;font-size:12px">${fmt(it.unitPrice)}</td>
          <td style="border:1px solid #bbb;padding:6px 8px;text-align:right;font-weight:bold;font-size:13px;color:#111;vertical-align:top">${fmt(it.amount)}</td>
        </tr>`;
      })
      .join('');

    const formatVietnamDateTime = (dateInput: any): string => {
      if (!dateInput) return '---';
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return '---';
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour12: false,
      });
      const parts = formatter.formatToParts(d);
      const m: Record<string, string> = {};
      for (const p of parts) m[p.type] = p.value;
      return `${m.hour}:${m.minute} - ${m.day}/${m.month}/${m.year}`;
    };

    const formatVietnamDate = (dateInput: any): string => {
      if (!dateInput) return '';
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return '';
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const parts = formatter.formatToParts(d);
      const m: Record<string, string> = {};
      for (const p of parts) m[p.type] = p.value;
      return `${m.day}/${m.month}/${m.year}`;
    };

    const issueDate = formatVietnamDateTime(invoice.issueDate || invoice.createdAt);
    const dueDate = formatVietnamDate(invoice.dueDate);

    const thStyle = `border:1px solid #999;padding:6px 8px;font-size:11px;font-weight:bold;text-transform:uppercase;color:#333;background:${headerBgColor}`;
    const tdSumLabel = 'border:1px solid #bbb;padding:5px 10px;text-align:right;font-size:12px;color:#444;width:70%';
    const tdSumVal = 'border:1px solid #bbb;padding:5px 10px;text-align:right;font-size:12px;font-weight:bold;color:#111';

    const vatRow = invoice.hasVat ? `<tr><td style="${tdSumLabel}">Thuế GTGT (${invoice.vatRate || 10}%):</td><td style="${tdSumVal}">${fmt(invoice.vatAmount)}</td></tr>` : '';
    const feeRow = invoice.otherFee ? `<tr><td style="${tdSumLabel}">Phí khác:</td><td style="${tdSumVal}">${fmt(invoice.otherFee)}</td></tr>` : '';
    const notesHtml = invoice.notes ? `<div style="font-size:11.5px;color:#555;margin-bottom:16px;font-style:italic"><strong style="font-style:normal">Ghi chú: </strong>${invoice.notes}</div>` : '';
    const isPaid = invoice.status === 'PAID';
    const statusLine = isPaid
      ? `<div style="text-align:center;font-size:11px;font-weight:bold;color:#059669;margin-bottom:14px">Trạng thái: ✔ ĐÃ HOÀN TẤT THANH TOÁN</div>`
      : (invoice.status && statusLabel(invoice.status) ? `<div style="text-align:center;font-size:10.5px;color:#64748b;font-style:italic;margin-bottom:14px">Trạng thái: ${statusLabel(invoice.status)}</div>` : '');

    const isQrVisible = design.showQrCode !== false;
    const isBankVisible = design.showBankInfo !== false;

    const qrHtml = isPaid
      ? `<div style="background:#f0fdf4;padding:16px 20px;border-radius:8px;border:2px solid #10b981;display:inline-block;text-align:center;min-width:180px">
          <div style="font-size:32px;line-height:1;margin-bottom:6px">✔</div>
          <div style="font-size:13px;color:#065f46;font-weight:bold;text-transform:uppercase;letter-spacing:1px">ĐÃ THANH TOÁN</div>
          <div style="font-size:10px;color:#047857;margin-top:2px;font-weight:600">PAID IN FULL</div>
        </div>`
      : (invoice.qrDataUrl
          ? `<div style="background:#ffffff;padding:8px;border-radius:8px;border:1px solid #e2e8f0;display:inline-block;text-align:center"><img src="${invoice.qrDataUrl}" style="width:190px;height:auto;display:block;margin:0 auto" /><div style="font-size:10px;color:#64748b;margin-top:4px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px">QUÉT MÃ THANH TOÁN</div></div>`
          : '<div style="width:190px;height:190px;border:2px dashed #cbd5e1;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:12px;background:#fff;flex-shrink:0">VietQR</div>');

    const bankCode = invoice.bankCode || settings?.bankCode || 'Vietcombank';
    const bankAccount = invoice.bankAccount || settings?.bankAccount || 'SHYNNERI';
    const bankName = invoice.bankAccountName || settings?.bankAccountName || 'AI ROBOTIC';

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

    const titleText = design.customTitle || defaultTypeTitle;
    const subtitleText = design.subtitle || (design.showTaxCodeBadge ? '(Có mã của cơ quan thuế)' : '');
    const sloganText = design.slogan || '';

    const showSeller = !!design.showSellerInfo;
    const showBuyer = design.showBuyerInfo !== false;
    const showBuyerCompany = design.showBuyerCompany !== false;
    const showBuyerAddress = design.showBuyerAddress !== false;
    const showBuyerPhone = design.showBuyerPhone !== false;
    const showBuyerEmail = design.showBuyerEmail !== false;
    const showDueDate = design.showDueDate !== false;
    const showTotalInWords = design.showTotalInWords !== false;
    const showSignatures = !!design.showSignatures;
    const customerSignTitle = design.customerSignTitle || 'ĐẠI DIỆN KHÁCH HÀNG';
    const customerSignSub = design.customerSignSub || '(Ký và ghi rõ họ tên)';
    const sellerSignTitle = design.sellerSignTitle || 'NGƯỜI LẬP HÓA ĐƠN';
    const sellerSignSub = design.sellerSignSub || '(Ký và ghi rõ họ tên)';
    const footerNote = design.footerNote || '';

    // Buyer table
    const buyerHtml = showBuyer ? `
      <div style="margin-bottom:16px;font-size:12.5px;line-height:1.7">
        <div style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;color:#666;margin-bottom:4px">Thông tin người mua</div>
        <table style="width:100%;border-collapse:collapse;border:none">
          <tr>
            <td style="padding:1px 0;width:50%;border:none">Họ tên: <strong style="color:#111">${invoice.buyerName || '...............'}</strong></td>
            ${invoice.buyerTaxCode ? `<td style="padding:1px 0;width:50%;border:none">MST: <strong>${invoice.buyerTaxCode}</strong></td>` : '<td style="border:none"></td>'}
          </tr>
          ${showBuyerCompany && invoice.buyerCompany ? `<tr><td colspan="2" style="padding:1px 0;border:none">Đơn vị: <strong>${invoice.buyerCompany}</strong></td></tr>` : ''}
          ${showBuyerAddress && invoice.buyerAddress ? `<tr><td colspan="2" style="padding:1px 0;border:none">Địa chỉ: ${invoice.buyerAddress}</td></tr>` : ''}
          <tr>
            ${showBuyerPhone && invoice.buyerPhone ? `<td style="padding:1px 0;border:none">Điện thoại: ${invoice.buyerPhone}</td>` : '<td style="border:none"></td>'}
            ${showBuyerEmail && invoice.buyerEmail ? `<td style="padding:1px 0;border:none">Email: ${invoice.buyerEmail}</td>` : '<td style="border:none"></td>'}
          </tr>
        </table>
      </div>
    ` : '';

    // Seller Header
    const sellerHtml = showSeller ? `
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #e2e8f0;font-size:12px;line-height:1.6">
        <div>
          <div style="font-size:15px;font-weight:bold;color:${pc}">${invoice.sellerName || settings?.companyName || 'CÔNG TY TNHH GIÁO DỤC AI ROBOTIC'}</div>
          ${(invoice.sellerAddress || settings?.address) ? `<div>Địa chỉ: ${invoice.sellerAddress || settings?.address}</div>` : ''}
          ${(invoice.sellerTaxCode || settings?.taxCode) ? `<div>Mã số thuế: <strong>${invoice.sellerTaxCode || settings?.taxCode}</strong></div>` : ''}
          ${(invoice.sellerPhone || settings?.phone || invoice.sellerEmail || settings?.email) ? `<div>${(invoice.sellerPhone || settings?.phone) ? `ĐT: ${invoice.sellerPhone || settings?.phone}` : ''} ${(invoice.sellerEmail || settings?.email) ? `| Email: ${invoice.sellerEmail || settings?.email}` : ''}</div>` : ''}
        </div>
        ${settings?.logoUrl ? `<img src="${settings.logoUrl}" style="max-height:55px;max-width:140px;object-fit:contain" />` : ''}
      </div>
    ` : '';

    // QR + Bank Block
    let qrBankHtml = '';
    const qrLayout = design.qrLayout || 'side-by-side';

    if (isQrVisible || isBankVisible) {
      if (qrLayout === 'stacked') {
        qrBankHtml = `
          <div style="margin-bottom:20px;padding:16px 20px;border:1px solid #d1d5db;background:#f8fafc;border-radius:8px;page-break-inside:avoid;text-align:center">
            ${isQrVisible ? `<div style="display:flex;justify-content:center;margin-bottom:12px">${qrHtml}</div>` : ''}
            ${isBankVisible ? `
              <div style="font-size:12.5px;line-height:1.9;color:#334155;text-align:left;max-width:480px;margin:0 auto">
                <div style="font-weight:bold;font-size:11.5px;text-transform:uppercase;color:${pc};margin-bottom:6px;letter-spacing:0.5px;border-bottom:1px dashed #cbd5e1;padding-bottom:4px;text-align:center">Thông tin thanh toán chuyển khoản</div>
                <div style="display:flex;justify-content:space-between"><span>Ngân hàng thụ hưởng:</span><strong style="color:#0f172a">${bankCode}</strong></div>
                <div style="display:flex;justify-content:space-between"><span>Số tài khoản:</span><strong style="font-family:'Courier New',monospace;font-size:15px;color:${pc};letter-spacing:0.5px">${bankAccount}</strong></div>
                <div style="display:flex;justify-content:space-between"><span>Chủ tài khoản:</span><strong style="text-transform:uppercase;color:#0f172a">${bankName}</strong></div>
                <div style="display:flex;justify-content:space-between"><span>Số tiền:</span><strong style="color:#059669;font-size:14px">${fmt(invoice.grandTotal)}</strong></div>
                <div style="display:flex;justify-content:space-between;margin-top:2px"><span>Nội dung chuyển khoản:</span><strong style="font-family:'Courier New',monospace;background:#fff;padding:2px 8px;border:1px solid #94a3b8;border-radius:4px;color:#0f172a;font-size:13px">${invoice.paymentCode || invoice.invoiceNumber || 'HD'}</strong></div>
              </div>
            ` : ''}
          </div>
        `;
      } else {
        // side-by-side
        qrBankHtml = `
          <div style="display:flex;align-items:center;gap:20px;margin-bottom:20px;padding:16px 20px;border:1px solid #d1d5db;background:#f8fafc;border-radius:8px;page-break-inside:avoid">
            ${isQrVisible ? `<div style="flex-shrink:0">${qrHtml}</div>` : ''}
            ${isBankVisible ? `
              <div style="font-size:12.5px;line-height:2.0;color:#334155;flex:1">
                <div style="font-weight:bold;font-size:11.5px;text-transform:uppercase;color:${pc};margin-bottom:6px;letter-spacing:0.5px;border-bottom:1px dashed #cbd5e1;padding-bottom:4px">Thông tin thanh toán chuyển khoản</div>
                <div>Ngân hàng thụ hưởng: <strong style="color:#0f172a">${bankCode}</strong></div>
                <div>Số tài khoản: <strong style="font-family:'Courier New',monospace;font-size:16px;color:${pc};letter-spacing:0.5px">${bankAccount}</strong></div>
                <div>Chủ tài khoản: <strong style="text-transform:uppercase;color:#0f172a">${bankName}</strong></div>
                <div>Số tiền: <strong style="color:#059669;font-size:15px">${fmt(invoice.grandTotal)}</strong></div>
                <div style="margin-top:2px">Nội dung chuyển khoản: <strong style="font-family:'Courier New',monospace;background:#fff;padding:2px 8px;border:1px solid #94a3b8;border-radius:4px;color:#0f172a;font-size:13px">${invoice.paymentCode || invoice.invoiceNumber || 'HD'}</strong></div>
              </div>
            ` : ''}
          </div>
        `;
      }
    }

    const signaturesHtml = showSignatures ? `
      <div style="display:flex;justify-content:space-between;text-align:center;margin-top:28px;margin-bottom:16px;page-break-inside:avoid">
        <div style="width:45%">
          <div style="font-weight:bold;font-size:12.5px;text-transform:uppercase;color:#1e293b">${customerSignTitle}</div>
          <div style="font-size:11px;font-style:italic;color:#64748b;margin-top:2px">${customerSignSub}</div>
          <div style="height:60px"></div>
        </div>
        <div style="width:45%">
          <div style="font-weight:bold;font-size:12.5px;text-transform:uppercase;color:#1e293b">${sellerSignTitle}</div>
          <div style="font-size:11px;font-style:italic;color:#64748b;margin-top:2px">${sellerSignSub}</div>
          <div style="height:60px"></div>
        </div>
      </div>
    ` : '';

    const footerNoteHtml = footerNote ? `
      <div style="text-align:center;font-size:11.5px;color:#64748b;font-style:italic;margin-top:16px;padding-top:10px;border-top:1px dashed #cbd5e1;page-break-inside:avoid">
        ${footerNote}
      </div>
    ` : '';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
@page { size: A4; margin: 10mm 12mm; }
* { box-sizing: border-box; }
body {
  font-family: ${fontFamilyCss};
  font-size: 13px; color: #1a1a1a; margin: 0; padding: 0;
  -webkit-print-color-adjust: exact; background: #fff; line-height: 1.5;
}
.c { width: 100%; max-width: 780px; margin: 0 auto; }
</style>
</head>
<body>
<div class="c">

${sellerHtml}

<!-- HEADER -->
<div style="text-align:center;padding-bottom:14px;border-bottom:2px solid ${pc};margin-bottom:14px">
  <div style="font-size:22px;font-weight:bold;text-transform:uppercase;color:${pc};letter-spacing:1px;margin-bottom:4px">${titleText}</div>
  ${subtitleText ? `<div style="font-size:12px;font-style:italic;color:#64748b;margin-bottom:6px">${subtitleText}</div>` : ''}
  ${sloganText ? `<div style="font-size:11.5px;color:#475569;margin-bottom:6px">${sloganText}</div>` : ''}
  <div style="display:flex;justify-content:center;align-items:center;gap:14px;font-size:12.5px;color:#475569">
    <div>Số: <strong style="font-size:14px;color:#0f172a;font-family:'Courier New',monospace">${invoice.invoiceNumber || 'HD-000001'}</strong></div>
    <span style="color:#94a3b8">•</span>
    <div>Ngày tạo: <strong style="color:#0f172a">${issueDate}</strong></div>
    ${showDueDate && dueDate ? `<span style="color:#94a3b8">•</span><div>Hạn TT: <strong style="color:#0f172a">${dueDate}</strong></div>` : ''}
  </div>
</div>
${statusLine}

${buyerHtml}

<!-- SERVICE TABLE -->
<table style="width:100%;border-collapse:collapse;margin-bottom:6px">
  <thead>
    <tr>
      <th style="${thStyle};text-align:center;width:36px">STT</th>
      <th style="${thStyle};text-align:left">Tên dịch vụ / Nội dung</th>
      ${showServiceUnit ? `<th style="${thStyle};text-align:center;width:50px">ĐVT</th>` : ''}
      <th style="${thStyle};text-align:center;width:40px">SL</th>
      <th style="${thStyle};text-align:right;width:100px">Đơn giá</th>
      <th style="${thStyle};text-align:right;width:110px">Thành tiền</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>

<!-- TOTALS -->
<table style="width:100%;border-collapse:collapse;margin-bottom:8px">
  <tr><td style="${tdSumLabel}">Cộng tiền dịch vụ:</td><td style="${tdSumVal}">${fmt(invoice.subTotal)}</td></tr>
  ${vatRow}
  ${feeRow}
  <tr style="background:#f5f5f5">
    <td style="border:1px solid #999;padding:7px 10px;text-align:right;font-size:13px;font-weight:bold;color:#111;text-transform:uppercase">TỔNG CỘNG THANH TOÁN:</td>
    <td style="border:1px solid #999;padding:7px 10px;text-align:right;font-size:16px;font-weight:bold;color:${pc}">${fmt(invoice.grandTotal)}</td>
  </tr>
</table>

<!-- WORDS -->
${showTotalInWords ? `
<div style="font-size:12px;margin-bottom:16px;padding:4px 0;border-bottom:1px dashed #ccc">
  <span style="color:#555">Số tiền bằng chữ: </span>
  <strong style="color:#111;font-style:italic">${inWords}.</strong>
</div>
` : ''}
${notesHtml}

${qrBankHtml}

${signaturesHtml}

${footerNoteHtml}

</div>
</body>
</html>`;
  }

  async generatePdfBuffer(
    invoice: any,
    settings: any,
    format: 'A4' | 'A5' = 'A4',
    customDesign?: any,
  ): Promise<Buffer> {
    let resolvedDesign = customDesign;
    if (!resolvedDesign && this.prisma && invoice.templateId) {
      try {
        resolvedDesign = await this.prisma.invoiceDesignTemplate.findFirst({
          where: {
            OR: [{ id: invoice.templateId }, { code: invoice.templateId }],
          },
        });
      } catch {
        // Fallback
      }
    }

    const task = this.queue.then(() =>
      this.renderPdf(invoice, settings, format, resolvedDesign),
    );
    this.queue = task.catch(() => undefined);
    return task as Promise<Buffer>;
  }

  private async renderPdf(
    invoice: any,
    settings: any,
    format: 'A4' | 'A5',
    customDesign?: any,
  ): Promise<Buffer> {
    const page = await this.getPage();

    try {
      const html = this.generateInvoiceHtml(invoice, settings, customDesign);
      await page.setContent(html, { waitUntil: 'load', timeout: PDF_RENDER_TIMEOUT_MS });

      const pdfBuffer = await page.pdf({
        format: format,
        printBackground: true,
        margin: {
          top: '10mm',
          bottom: '10mm',
          left: '12mm',
          right: '12mm',
        },
      });

      return Buffer.from(pdfBuffer);
    } catch (err) {
      await this.closeBrowser('render error');
      throw err;
    } finally {
      this.scheduleIdleClose();
    }
  }
}
