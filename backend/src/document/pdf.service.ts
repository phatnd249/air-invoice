import { Injectable } from '@nestjs/common';
import { chromium, Browser } from 'playwright';
import { numberToVietnameseWords } from './numberToWords';

interface TemplateTheme {
  primaryColor: string;
}

const TEMPLATE_THEMES: Record<string, TemplateTheme> = {
  'standard-classic': { primaryColor: '#2c3e50' },
  'modern-minimal': { primaryColor: '#111827' },
  'tech-emerald': { primaryColor: '#047857' },
  'elegant-ruby': { primaryColor: '#991b1b' },
};

@Injectable()
export class PdfService {
  private browser: Browser | null = null;

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browser;
  }

  generateInvoiceHtml(invoice: any, settings: any): string {
    const templateId = invoice.templateId || 'standard-classic';
    const theme = TEMPLATE_THEMES[templateId] || TEMPLATE_THEMES['standard-classic'];
    const pc = theme.primaryColor;

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

    const rows = (invoice.items || [])
      .map((it: any, idx: number) => {
        const desc = it.description ? `<div style="color:#555;font-size:11.5px;margin-top:1px">${it.description}</div>` : '';
        const meta = it.metaInfo ? `<div style="color:#777;font-size:11px;font-style:italic;margin-top:1px">${it.metaInfo}</div>` : '';
        return `<tr>
          <td style="border:1px solid #bbb;padding:6px 8px;text-align:center;color:#666;vertical-align:top;font-size:12px">${idx + 1}</td>
          <td style="border:1px solid #bbb;padding:6px 8px;vertical-align:top"><strong style="display:block;color:#111;font-size:13px">${it.name || ''}</strong>${desc}${meta}</td>
          <td style="border:1px solid #bbb;padding:6px 8px;text-align:center;color:#444;vertical-align:top;font-size:12px">${it.unit || 'gói'}</td>
          <td style="border:1px solid #bbb;padding:6px 8px;text-align:center;font-weight:bold;color:#111;vertical-align:top;font-size:12px">${it.quantity || 1}</td>
          <td style="border:1px solid #bbb;padding:6px 8px;text-align:right;color:#333;vertical-align:top;font-size:12px">${fmt(it.unitPrice)}</td>
          <td style="border:1px solid #bbb;padding:6px 8px;text-align:right;font-weight:bold;font-size:13px;color:#111;vertical-align:top">${fmt(it.amount)}</td>
        </tr>`;
      })
      .join('');

    const issueDate = invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('vi-VN') : '---';
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('vi-VN') : '';

    const thStyle = 'border:1px solid #999;padding:6px 8px;font-size:11px;font-weight:bold;text-transform:uppercase;color:#333';
    const tdSumLabel = 'border:1px solid #bbb;padding:5px 10px;text-align:right;font-size:12px;color:#444;width:70%';
    const tdSumVal = 'border:1px solid #bbb;padding:5px 10px;text-align:right;font-size:12px;font-weight:bold;color:#111';

    const vatRow = invoice.hasVat ? `<tr><td style="${tdSumLabel}">Thuế GTGT (${invoice.vatRate || 10}%):</td><td style="${tdSumVal}">${fmt(invoice.vatAmount)}</td></tr>` : '';
    const feeRow = invoice.otherFee ? `<tr><td style="${tdSumLabel}">Phí khác:</td><td style="${tdSumVal}">${fmt(invoice.otherFee)}</td></tr>` : '';
    const notesHtml = invoice.notes ? `<div style="font-size:11.5px;color:#555;margin-bottom:16px;font-style:italic"><strong style="font-style:normal">Ghi chú: </strong>${invoice.notes}</div>` : '';
    const dueLine = dueDate ? `<div style="font-size:12px;color:#555">Hạn TT: <strong style="color:#111">${dueDate}</strong></div>` : '';
    const statusLine = invoice.status && statusLabel(invoice.status) ? `<div style="text-align:right;font-size:10px;color:#888;font-style:italic;margin-bottom:12px;padding-top:2px">Trạng thái: ${statusLabel(invoice.status)}</div>` : '';

    const qrHtml = invoice.qrDataUrl
      ? `<div style="background:#ffffff;padding:8px;border-radius:8px;border:1px solid #e2e8f0;display:inline-block;text-align:center"><img src="${invoice.qrDataUrl}" style="width:200px;height:auto;display:block;margin:0 auto" /><div style="font-size:10px;color:#64748b;margin-top:4px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px">Quét mã thanh toán</div></div>`
      : '<div style="width:200px;height:200px;border:2px dashed #cbd5e1;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:12px;background:#fff;flex-shrink:0">VietQR</div>';

    const bankCode = invoice.bankCode || settings?.bankCode || 'Vietcombank';
    const bankAccount = invoice.bankAccount || settings?.bankAccount || 'SHYNNERI';
    const bankName = invoice.bankAccountName || settings?.bankAccountName || 'AI ROBOTIC';
    const companyName = invoice.sellerName || settings?.companyName || 'CÔNG TY TNHH GIÁO DỤC AI ROBOTIC';
    const address = invoice.sellerAddress || settings?.address || 'Số 10 Huỳnh Văn Nghệ, P. Trấn Biên, Đồng Nai';
    const taxCode = invoice.sellerTaxCode || settings?.taxCode || '3603893101';
    const phone = invoice.sellerPhone || settings?.phone;
    const email = invoice.sellerEmail || settings?.email;
    const logoUrl = invoice.sellerLogoUrl || settings?.logoUrl;

    const logoHtml = logoUrl
      ? `<img src="${logoUrl}" alt="Logo" style="max-height:40px;max-width:160px;object-fit:contain;margin-bottom:4px" />`
      : '';

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

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
@page { size: A4; margin: 12mm 14mm; }
* { box-sizing: border-box; }
body {
  font-family: "Times New Roman", "Noto Serif", Georgia, serif;
  font-size: 13px; color: #1a1a1a; margin: 0; padding: 0;
  -webkit-print-color-adjust: exact; background: #fff; line-height: 1.5;
}
.c { width: 100%; max-width: 780px; margin: 0 auto; }
</style>
</head>
<body>
<div class="c">

<!-- HEADER -->
<div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:12px;border-bottom:2px solid ${pc};margin-bottom:4px">
  <div style="max-width:55%">
    ${logoHtml || `<div style="font-weight:bold;font-size:14px;text-transform:uppercase;color:${pc};margin-bottom:4px;letter-spacing:0.5px">${companyName}</div>`}
    <div style="font-size:11.5px;color:#444">Địa chỉ: ${address}</div>
    <div style="font-size:11.5px;color:#444">MST: ${taxCode}${settings?.phone ? ` &nbsp;—&nbsp; ĐT: ${settings.phone}` : ''}</div>
    ${settings?.email ? `<div style="font-size:11.5px;color:#444">Email: ${settings.email}</div>` : ''}
  </div>
  <div style="text-align:right">
    <div style="font-size:20px;font-weight:bold;text-transform:uppercase;color:${pc};letter-spacing:1px">${typeTitle}</div>
    <div style="font-size:11px;color:#666;margin-bottom:6px;font-style:italic">${formSubtitle}</div>
    <div style="font-size:12px;color:#555">Số: <strong style="font-size:14px;color:#111;font-family:'Courier New',monospace">${invoice.invoiceNumber || 'HD-000001'}</strong></div>
    <div style="font-size:12px;color:#555">Ngày: <strong style="color:#111">${issueDate}</strong></div>
    ${dueLine}
  </div>
</div>
${statusLine}

<!-- BUYER INFO -->
<div style="margin-bottom:16px;font-size:12.5px;line-height:1.7">
  <div style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;color:#666;margin-bottom:4px">Thông tin người mua</div>
  <table style="width:100%;border-collapse:collapse;border:none">
    <tr>
      <td style="padding:1px 0;width:50%;border:none">Họ tên: <strong style="color:#111">${invoice.buyerName || '...............'}</strong></td>
      ${invoice.buyerTaxCode ? `<td style="padding:1px 0;width:50%;border:none">MST: <strong>${invoice.buyerTaxCode}</strong></td>` : '<td style="border:none"></td>'}
    </tr>
    ${invoice.buyerCompany ? `<tr><td colspan="2" style="padding:1px 0;border:none">Đơn vị: <strong>${invoice.buyerCompany}</strong></td></tr>` : ''}
    ${invoice.buyerAddress ? `<tr><td colspan="2" style="padding:1px 0;border:none">Địa chỉ: ${invoice.buyerAddress}</td></tr>` : ''}
    <tr>
      ${invoice.buyerPhone ? `<td style="padding:1px 0;border:none">Điện thoại: ${invoice.buyerPhone}</td>` : '<td style="border:none"></td>'}
      ${invoice.buyerEmail ? `<td style="padding:1px 0;border:none">Email: ${invoice.buyerEmail}</td>` : '<td style="border:none"></td>'}
    </tr>
  </table>
</div>

<!-- SERVICE TABLE -->
<table style="width:100%;border-collapse:collapse;margin-bottom:6px">
  <thead>
    <tr style="background:#f5f5f5">
      <th style="${thStyle};text-align:center;width:36px">STT</th>
      <th style="${thStyle};text-align:left">Tên dịch vụ / Nội dung</th>
      <th style="${thStyle};text-align:center;width:50px">ĐVT</th>
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
<div style="font-size:12px;margin-bottom:16px;padding:4px 0;border-bottom:1px dashed #ccc">
  <span style="color:#555">Số tiền bằng chữ: </span>
  <strong style="color:#111;font-style:italic">${inWords}.</strong>
</div>
${notesHtml}

<!-- QR + BANK -->
<div style="display:flex;align-items:center;gap:24px;margin-bottom:24px;padding:16px 20px;border:1px solid #d1d5db;background:#f8fafc;border-radius:8px;page-break-inside:avoid">
  <div style="flex-shrink:0">
    ${qrHtml}
  </div>
  <div style="font-size:13px;line-height:2.0;color:#334155;flex:1">
    <div style="font-weight:bold;font-size:12px;text-transform:uppercase;color:${pc};margin-bottom:6px;letter-spacing:0.5px;border-bottom:1px dashed #cbd5e1;padding-bottom:4px">Thông tin thanh toán chuyển khoản</div>
    <div>Ngân hàng thụ hưởng: <strong style="color:#0f172a">${bankCode}</strong></div>
    <div>Số tài khoản: <strong style="font-family:'Courier New',monospace;font-size:16px;color:${pc};letter-spacing:0.5px">${bankAccount}</strong></div>
    <div>Chủ tài khoản: <strong style="text-transform:uppercase;color:#0f172a">${bankName}</strong></div>
    <div>Số tiền: <strong style="color:#059669;font-size:15px">${fmt(invoice.grandTotal)}</strong></div>
    <div style="margin-top:2px">Nội dung chuyển khoản: <strong style="font-family:'Courier New',monospace;background:#fff;padding:2px 8px;border:1px solid #94a3b8;border-radius:4px;color:#0f172a;font-size:14px">${invoice.invoiceNumber || 'HD'}</strong></div>
  </div>
</div>

<!-- SIGNATURES -->
<div style="display:flex;justify-content:space-between;text-align:center;font-size:12px;color:#444;border-top:1px solid #ddd;padding-top:16px;page-break-inside:avoid">
  <div style="width:45%">
    <div style="font-weight:bold;text-transform:uppercase;font-size:12px;color:#111;margin-bottom:2px">Đại diện khách hàng</div>
    <div style="font-size:11px;color:#888;font-style:italic;margin-bottom:60px">(Ký và ghi rõ họ tên)</div>
    <div style="font-weight:bold;color:#333">${invoice.buyerName || '...............'}</div>
  </div>
  <div style="width:45%">
    <div style="font-weight:bold;text-transform:uppercase;font-size:12px;color:#111;margin-bottom:2px">Đại diện đơn vị cung cấp</div>
    <div style="font-size:11px;color:#888;font-style:italic;margin-bottom:60px">(Ký, đóng dấu hoặc xác nhận số)</div>
    <div style="font-weight:bold;color:#333">${companyName}</div>
  </div>
</div>

</div>
</body>
</html>`;
  }

  async generatePdfBuffer(invoice: any, settings: any, format: 'A4' | 'A5' = 'A4'): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    const html = this.generateInvoiceHtml(invoice, settings);
    await page.setContent(html, { waitUntil: 'networkidle' });

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

    await page.close();
    return Buffer.from(pdfBuffer);
  }
}
