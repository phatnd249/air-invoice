import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PdfService } from '../document/pdf.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessageTemplatesService } from '../message-templates/message-templates.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class DeliveryService {
  private transporter: nodemailer.Transporter;

  
  /**
   * Tải nội dung các file đính kèm từ URL hoặc đường dẫn cục bộ
   */
  private async resolveAttachmentBuffers(attachments: any[]): Promise<Array<{ filename: string; content: Buffer; contentType?: string }>> {
    const result: Array<{ filename: string; content: Buffer; contentType?: string }> = [];
    if (!Array.isArray(attachments)) return result;

    for (const att of attachments) {
      try {
        if (!att?.url) continue;
        const name = att.name || 'document';
        if (att.url.startsWith('http://') || att.url.startsWith('https://')) {
          const res = await fetch(att.url);
          if (res.ok) {
            const arr = await res.arrayBuffer();
            result.push({
              filename: name,
              content: Buffer.from(arr),
              contentType: att.type || res.headers.get('content-type') || 'application/octet-stream',
            });
          }
        } else if (fs.existsSync(att.url)) {
          result.push({
            filename: name,
            content: fs.readFileSync(att.url),
            contentType: att.type || 'application/octet-stream',
          });
        }
      } catch (err: any) {
        console.warn(`[Delivery] Không thể tải file đính kèm ${att.name}: ${err.message}`);
      }
    }
    return result;
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
    private readonly messageTemplatesService: MessageTemplatesService,
  ) {
    this.transporter = this.getTransporter();
  }

  private getTransporter() {
    const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = (process.env.SMTP_USER || '').trim().replace(/^["']|["']$/g, '');
    const pass = (process.env.SMTP_PASS || '').trim().replace(/^["']|["']$/g, '').replace(/\s+/g, '');

    const secure = process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === 'true'
      : port === 465;

    return nodemailer.createTransport({
      host,
      port,
      secure,
      family: 4, // 👈 Bắt buộc ép kết nối qua IPv4 để tránh lỗi ENETUNREACH trên Render/Docker container
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 25000,
      greetingTimeout: 20000,
      socketTimeout: 30000,
    } as any);
  }

  /**
   * Kiểm tra email người nhận trước khi gửi.
   * Resend luôn từ chối các domain dành cho tài liệu/thử nghiệm (example.com, test.com...),
   * nên chặn sớm để không phải sinh PDF và gọi API vô ích.
   */
  private resolveRecipientEmail(email?: string | null): string {
    const value = (email || '').trim();
    if (!value) throw new Error('Hóa đơn chưa có địa chỉ email người nhận');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      throw new Error(`Email người nhận không hợp lệ: ${value}`);
    }

    const domain = (value.split('@')[1] || '').toLowerCase();
    const blockedDomains = [
      'example.com',
      'example.org',
      'example.net',
      'test.com',
      'test.local',
      'localhost',
      'local',
      'invalid',
    ];

    if (
      blockedDomains.includes(domain) ||
      domain.endsWith('.invalid') ||
      domain.endsWith('.local') ||
      domain.endsWith('.example')
    ) {
      throw new Error(
        `Email "${value}" dùng domain thử nghiệm nên Resend từ chối gửi. Vui lòng dùng email thật của khách hàng.`,
      );
    }

    return value;
  }

  async sendInvoiceEmail(
    invoiceId: string,
    options?: {
      source?: string;
      packageName?: string;
      subject?: string;
      customMessage?: string;
      isRegistration?: boolean;
    },
  ): Promise<{ success: boolean; message: string }> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    });

    if (!invoice) throw new Error('Hóa đơn không tồn tại');
    const recipientEmail = this.resolveRecipientEmail(invoice.buyerEmail);

    // Nếu hóa đơn đã thanh toán (PAID), tự động chuyển sang gửi email biên lai thanh toán thành công
    if (invoice.status === 'PAID') {
      return this.sendPaymentSuccessEmail(invoiceId, options);
    }

    const settings = await this.prisma.setting.findUnique({ where: { id: 'default' } });

    // 1. Sinh file PDF đính kèm bằng Playwright
    const pdfBuffer = await this.pdfService.generatePdfBuffer(invoice, settings);

    // 2. Định dạng thông tin hiển thị
    const formatCurrency = (n: number) =>
      new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

    const firstItem = invoice.items[0] || { name: 'Dịch vụ', description: '', metaInfo: '' };
    const packageName = options?.packageName || firstItem.name || 'Gói Dịch Vụ';
    const brandName = options?.source || settings?.companyName || 'AI WRITER';
    const appUrl = process.env.APP_URL || 'https://invoice.share4happy.com';
    const shareUrl = `${appUrl}/view/${invoice.shareToken}`;
    const dueDateStr = invoice.dueDate
      ? new Date(invoice.dueDate).toLocaleDateString('vi-VN')
      : new Date(invoice.issueDate).toLocaleDateString('vi-VN');

    const isRegistration = options?.isRegistration !== false;
    const emailHeaderTitle = isRegistration
      ? 'XÁC NHẬN ĐĂNG KÝ GÓI DỊCH VỤ & THÔNG BÁO HÓA ĐƠN'
      : 'THÔNG BÁO HÓA ĐƠN & NHẮC LỊCH THANH TOÁN';

    let emailSubject =
      options?.subject ||
      `[${brandName}] Xác nhận đăng ký ${packageName} & Hóa đơn thanh toán - #${invoice.invoiceNumber}`;

    let customAttachments: any[] = [];

    // Tra cứu mẫu Email được cấu hình riêng cho gói này
    const itemIds = invoice.items.map((it: any) => it.id);
    const itemNames = invoice.items.map((it: any) => it.name);
    const matchedEmailTpl = await this.messageTemplatesService.findMatchingTemplate(
      'EMAIL',
      'INVOICE_CREATED',
      itemIds,
      itemNames,
    );

    let htmlBody = '';
    if (matchedEmailTpl) {
      const rendered = this.messageTemplatesService.renderTemplateContent(matchedEmailTpl, {
        customerName: invoice.buyerName,
        invoiceNumber: invoice.invoiceNumber,
        grandTotal: invoice.grandTotal,
        packageName,
        viewUrl: shareUrl,
        dueDate: dueDateStr,
        paymentCode: invoice.paymentCode || '',
        brandName,
        companyName: settings?.companyName || brandName,
        phone: settings?.phone || '0812305046',
        email: settings?.email || '',
        notes: invoice.notes || '',
      });
      if (rendered.subject) emailSubject = rendered.subject;
      htmlBody = rendered.content;
      customAttachments = rendered.attachments || [];
    } else {
      htmlBody = `
      <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">${emailHeaderTitle}</h2>
        
        <p>Kính gửi Quý khách hàng <strong>${invoice.buyerName}</strong>,</p>
        
        <p>Lời đầu tiên, <strong>${brandName}</strong> xin chân thành cảm ơn Quý khách đã tin tưởng và đăng ký sử dụng dịch vụ của chúng tôi.</p>
        
        <p>Hệ thống đã khởi tạo hóa đơn thanh toán cho gói dịch vụ của Quý khách với thông tin chi tiết dưới đây:</p>
        
        <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 15px 0; border-radius: 4px;">
          <p style="margin: 4px 0;"><strong>• Gói dịch vụ:</strong> ${packageName}</p>
          ${firstItem.description ? `<p style="margin: 4px 0;"><strong>• Chi tiết gói:</strong> ${firstItem.description}</p>` : ''}
          ${firstItem.metaInfo ? `<p style="margin: 4px 0;"><strong>• Thời hạn / Quy mô:</strong> ${firstItem.metaInfo}</p>` : ''}
          <p style="margin: 4px 0;"><strong>• Số tiền thanh toán:</strong> <span style="color: #dc2626; font-size: 16px; font-weight: bold;">${formatCurrency(invoice.grandTotal)}</span></p>
          <p style="margin: 4px 0;"><strong>• Hạn thanh toán:</strong> ${dueDateStr}</p>
        </div>

        <h4 style="color: #2c3e50; margin-top: 20px; margin-bottom: 8px;">Hướng dẫn thanh toán & Kích hoạt dịch vụ:</h4>
        <p>Quý khách vui lòng kiểm tra chi tiết hóa đơn (kèm file PDF đính kèm trong email này) và thực hiện thanh toán nhanh bằng cách truy cập đường dẫn dưới đây:</p>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${shareUrl}" target="_blank" style="background: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">
            🔗 Xem Hóa Đơn & Quét Mã VietQR Thanh Toán
          </a>
        </div>

        <p style="font-size: 13px; color: #666; font-style: italic;">
          (Lưu ý: Quý khách vui lòng kiểm tra thông tin tài khoản và cú pháp chuyển khoản <strong>${invoice.paymentCode || ''}</strong> để hệ thống tự động kích hoạt dịch vụ ngay sau khi nhận tiền).
        </p>

        <p style="margin-top: 20px;">Nếu Quý khách cần hỗ trợ kích hoạt khẩn cấp hoặc gửi xác nhận chuyển khoản, vui lòng liên hệ:</p>
        <p style="margin: 4px 0;">💬 <strong>Zalo Hỗ Trợ:</strong> ${settings?.phone || '0812305046'}</p>
        <p style="margin: 4px 0;">📞 <strong>Hotline:</strong> ${settings?.phone || '0812305046'}</p>

        <p style="margin-top: 25px; border-top: 1px solid #eee; padding-top: 15px;">
          Trân trọng,<br />
          <strong>Đội ngũ Chăm sóc khách hàng ${brandName}</strong>
        </p>
      </div>
    `;
    }

    const extraAttachmentBuffers = await this.resolveAttachmentBuffers(customAttachments);

    // 4. Gửi qua Resend API hoặc fallback sang SMTP
    try {
      let emailSent = false;
      let emailError: string | null = null;

      if (process.env.RESEND_API_KEY) {
        try {
          // Gửi qua Resend REST API (HTTPS cổng 443 — hoạt động 100% trên Render Free)
          let fromEmail = (process.env.SMTP_FROM || '').trim().replace(/^["']|["']$/g, '');
          // Tự động dùng domain đã verified trên Resend: invoice.share4happy.com
          if (!fromEmail || fromEmail.includes('onboarding@resend.dev') || fromEmail.includes('your-email') || !fromEmail.includes('@invoice.share4happy.com')) {
            fromEmail = `"${brandName}" <billing@invoice.share4happy.com>`;
          } else if (!fromEmail.includes('<') && fromEmail.includes('@')) {
            fromEmail = `"${brandName}" <${fromEmail}>`;
          }

          const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [recipientEmail],
              subject: emailSubject,
              html: htmlBody,
              attachments: [
                {
                  filename: `HD_${invoice.invoiceNumber}.pdf`,
                  content: pdfBuffer.toString('base64'),
                },
                ...extraAttachmentBuffers.map((att) => ({
                  filename: att.filename,
                  content: att.content.toString('base64'),
                })),
              ],
            }),
          });

          const resendData = await resendRes.json().catch(() => ({}));
          if (resendRes.ok) {
            emailSent = true;
          } else {
            emailError = `Resend API HTTP ${resendRes.status}: ${resendData?.message || JSON.stringify(resendData)}`;
            console.warn(`[Delivery] Gửi qua Resend API chưa thành công: ${emailError}. Đang chuyển sang SMTP fallback...`);
          }
        } catch (resendErr: any) {
          emailError = resendErr?.message;
          console.warn(`[Delivery] Lỗi gọi Resend API: ${resendErr?.message}. Đang chuyển sang SMTP fallback...`);
        }
      }

      // 4.2. Fallback sang SMTP nếu Resend chưa gửi được hoặc không cấu hình
      if (!emailSent && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const user = (process.env.SMTP_USER || '').trim().replace(/^["']|["']$/g, '');
          let fromAddress = (process.env.SMTP_FROM || '').trim().replace(/^["']|["']$/g, '');
          if (!fromAddress || fromAddress.includes('your-email@gmail.com') || fromAddress.includes('no-reply@invoice-air.com') || fromAddress.includes('YOUR_EMAIL_HERE')) {
            fromAddress = `"${settings?.companyName || 'Invoice-AIR'}" <${user}>`;
          }

          const transporter = this.getTransporter();
          await transporter.sendMail({
            from: fromAddress,
            to: recipientEmail,
            subject: emailSubject,
            html: htmlBody,
            attachments: [
              {
                filename: `HD_${invoice.invoiceNumber}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf',
              },
              ...extraAttachmentBuffers.map((att) => ({
                filename: att.filename,
                content: att.content,
                contentType: att.contentType,
              })),
            ],
          });
          emailSent = true;
        } catch (smtpErr: any) {
          emailError = smtpErr?.message;
          console.error(`[Delivery] Lỗi gửi qua SMTP: ${smtpErr?.message}`);
        }
      }

      if (!emailSent) {
        throw new Error(emailError || 'Chưa cấu hình thông tin gửi Email hợp lệ (Resend API hoặc SMTP)');
      }

      // 5. Cập nhật trạng thái hóa đơn sang SENT
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'SENT',
          histories: {
            create: {
              action: 'SENT',
              note: `Đã gửi email thông báo kèm file PDF tới ${recipientEmail}`,
            },
          },
        },
      });

      return { success: true, message: `Đã gửi email thành công tới ${recipientEmail}` };
    } catch (error: any) {
      console.error('Lỗi gửi email:', error);
      const cleanMsg = (error.message || '').replace(/^Lỗi gửi mail:\s*/, '');
      throw new Error(cleanMsg || 'Không thể gửi email');
    }
  }

  /**
   * Gửi Email Biên Lai Xác Nhận Thanh Toán Thành Công & Kích Hoạt Dịch Vụ
   */
  async sendPaymentSuccessEmail(
    invoiceId: string,
    options?: {
      source?: string;
      packageName?: string;
      note?: string;
      subject?: string;
      customMessage?: string;
    },
  ): Promise<{ success: boolean; message: string }> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    });

    if (!invoice) throw new Error('Hóa đơn không tồn tại');
    const recipientEmail = this.resolveRecipientEmail(invoice.buyerEmail);

    const settings = await this.prisma.setting.findUnique({ where: { id: 'default' } });

    // 1. Sinh file PDF đính kèm bằng Playwright (có dấu xanh ✅ ĐÃ THANH TOÁN - PAID IN FULL)
    const paidInvoice = { ...invoice, status: 'PAID' as any };
    const pdfBuffer = await this.pdfService.generatePdfBuffer(paidInvoice, settings);

    // 2. Định dạng thông tin hiển thị
    const formatCurrency = (n: number) =>
      new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

    const firstItem = invoice.items[0] || { name: 'Dịch vụ', description: '', metaInfo: '' };
    const packageName = options?.packageName || firstItem.name || 'Gói Dịch Vụ AI WRITER';
    const brandName = options?.source || settings?.companyName || 'AI WRITER';
    const appUrl = (process.env.APP_URL || 'https://invoice.share4happy.com').replace(/\/+$/, '');
    const shareUrl = `${appUrl}/view/${invoice.shareToken}`;
    const formattedPaidTime = new Date().toLocaleString('vi-VN');

    let emailSubject =
      options?.subject ||
      `[${brandName}] Xác nhận thanh toán thành công & Biên lai điện tử - #${invoice.invoiceNumber}`;

    let customPaymentAttachments: any[] = [];
    const payItemIds = invoice.items.map((it: any) => it.id);
    const payItemNames = invoice.items.map((it: any) => it.name);
    const matchedPayTpl = await this.messageTemplatesService.findMatchingTemplate(
      'EMAIL',
      'PAYMENT_SUCCESS',
      payItemIds,
      payItemNames,
    );

    let htmlBody = '';
    if (matchedPayTpl) {
      const rendered = this.messageTemplatesService.renderTemplateContent(matchedPayTpl, {
        customerName: invoice.buyerName,
        invoiceNumber: invoice.invoiceNumber,
        grandTotal: invoice.grandTotal,
        packageName,
        viewUrl: shareUrl,
        paymentCode: invoice.paymentCode || '',
        brandName,
        companyName: settings?.companyName || brandName,
        phone: settings?.phone || '0812305046',
        email: settings?.email || '',
        notes: options?.note || invoice.notes || '',
      });
      if (rendered.subject) emailSubject = rendered.subject;
      htmlBody = rendered.content;
      customPaymentAttachments = rendered.attachments || [];
    } else {
      htmlBody = `
      <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 26px 20px; text-align: center; border-radius: 8px 8px 0 0; color: #ffffff;">
          <div style="font-size: 34px; line-height: 1; margin-bottom: 8px;">✅</div>
          <h2 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">
            XÁC NHẬN THANH TOÁN THÀNH CÔNG
          </h2>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95;">Biên lai thu tiền điện tử - Hệ thống ${brandName}</p>
        </div>

        <div style="padding: 24px 20px;">
          <p style="font-size: 15px; margin-top: 0; color: #0f172a;">
            Kính gửi Quý khách hàng <strong>${invoice.buyerName}</strong>,
          </p>
          
          <p style="color: #475569;">
            <strong>${brandName}</strong> xin trân trọng thông báo: Chúng tôi đã nhận được thanh toán đầy đủ cho đơn hàng của Quý khách. Gói dịch vụ đã được kích hoạt thành công trên hệ thống.
          </p>

          <!-- Receipt Card -->
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
            <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #166534; letter-spacing: 0.5px; margin-bottom: 12px; border-bottom: 1px dashed #86efac; padding-bottom: 6px;">
              Chi tiết biên lai thanh toán
            </div>
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; width: 40%;">Mã hóa đơn:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">#${invoice.invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Gói dịch vụ:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${packageName}</td>
              </tr>
              ${firstItem.description ? `<tr><td style="padding: 6px 0; color: #64748b;">Mô tả:</td><td style="padding: 6px 0; color: #334155;">${firstItem.description}</td></tr>` : ''}
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Số tiền đã thanh toán:</td>
                <td style="padding: 6px 0; font-size: 17px; font-weight: bold; color: #059669;">${formatCurrency(invoice.grandTotal)}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Trạng thái:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #059669;">✅ ĐÃ HOÀN TẤT (PAID IN FULL)</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Thời gian xác nhận:</td>
                <td style="padding: 6px 0; color: #334155;">${formattedPaidTime}</td>
              </tr>
              ${options?.note ? `
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Ghi chú:</td>
                <td style="padding: 6px 0; color: #334155; font-style: italic;">${options.note}</td>
              </tr>` : ''}
            </table>
          </div>

          <!-- Activation Notice -->
          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 15px 0; border-radius: 4px; font-size: 13px; color: #1e40af;">
            🚀 <strong>Kích hoạt dịch vụ:</strong> Quý khách hiện đã có thể truy cập và sử dụng đầy đủ các tính năng của gói <strong>${packageName}</strong>.
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 28px 0 20px;">
            <a href="${shareUrl}" target="_blank" style="background: #059669; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.2);">
              📄 Xem &amp; Tải Biên Lai Điện Tử Online
            </a>
          </div>

          <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 10px;">
            (File PDF biên lai chính thức có dấu xác nhận thanh toán đã được đính kèm trực tiếp trong email này)
          </p>

          <!-- Support info -->
          <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #475569;">
            <p style="margin: 4px 0;">Nếu Quý khách cần hỗ trợ thêm thông tin hoặc hướng dẫn sử dụng, vui lòng liên hệ:</p>
            <p style="margin: 4px 0;">💬 <strong>Zalo Hỗ Trợ:</strong> ${settings?.phone || '0812305046'}</p>
            <p style="margin: 4px 0;">📞 <strong>Hotline:</strong> ${settings?.phone || '0812305046'}</p>
            <p style="margin: 4px 0;">🌐 <strong>Website:</strong> <a href="https://aiwriter.ntcore.io.vn" target="_blank" style="color: #2563eb; text-decoration: none;">aiwriter.ntcore.io.vn</a></p>
          </div>

          <p style="margin-top: 25px; border-top: 1px solid #f1f5f9; padding-top: 15px; color: #64748b; font-size: 13px;">
            Trân trọng cảm ơn Quý khách,<br />
            <strong style="color: #0f172a;">Đội ngũ Chăm sóc khách hàng ${brandName}</strong>
          </p>
        </div>
      </div>
    `;
    }

    const extraPaymentBuffers = await this.resolveAttachmentBuffers(customPaymentAttachments);

    // 4. Gửi qua Resend API hoặc fallback sang SMTP
    try {
      let emailSent = false;
      let emailError: string | null = null;

      if (process.env.RESEND_API_KEY) {
        try {
          let fromEmail = (process.env.SMTP_FROM || '').trim().replace(/^["']|["']$/g, '');
          if (!fromEmail || fromEmail.includes('onboarding@resend.dev') || fromEmail.includes('your-email') || !fromEmail.includes('@invoice.share4happy.com')) {
            fromEmail = `"${brandName}" <billing@invoice.share4happy.com>`;
          } else if (!fromEmail.includes('<') && fromEmail.includes('@')) {
            fromEmail = `"${brandName}" <${fromEmail}>`;
          }

          const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [recipientEmail],
              subject: emailSubject,
              html: htmlBody,
              attachments: [
                {
                  filename: `Bien_Lai_HD_${invoice.invoiceNumber}.pdf`,
                  content: pdfBuffer.toString('base64'),
                },
                ...extraPaymentBuffers.map((att) => ({
                  filename: att.filename,
                  content: att.content.toString('base64'),
                })),
              ],
            }),
          });

          const resendData = await resendRes.json().catch(() => ({}));
          if (resendRes.ok) {
            emailSent = true;
          } else {
            emailError = `Resend API HTTP ${resendRes.status}: ${resendData?.message || JSON.stringify(resendData)}`;
            console.warn(`[Delivery] Gửi biên lai qua Resend chưa thành công: ${emailError}. Đang chuyển sang SMTP fallback...`);
          }
        } catch (resendErr: any) {
          emailError = resendErr?.message;
          console.warn(`[Delivery] Lỗi gọi Resend API biên lai: ${resendErr?.message}. Đang chuyển sang SMTP fallback...`);
        }
      }

      // 4.2. Fallback sang SMTP nếu Resend chưa gửi được hoặc không cấu hình
      if (!emailSent && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const user = (process.env.SMTP_USER || '').trim().replace(/^["']|["']$/g, '');
          let fromAddress = (process.env.SMTP_FROM || '').trim().replace(/^["']|["']$/g, '');
          if (!fromAddress || fromAddress.includes('your-email@gmail.com') || fromAddress.includes('no-reply@invoice-air.com') || fromAddress.includes('YOUR_EMAIL_HERE')) {
            fromAddress = `"${brandName}" <${user}>`;
          }

          const transporter = this.getTransporter();
          await transporter.sendMail({
            from: fromAddress,
            to: recipientEmail,
            subject: emailSubject,
            html: htmlBody,
            attachments: [
              {
                filename: `Bien_Lai_HD_${invoice.invoiceNumber}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf',
              },
              ...extraPaymentBuffers.map((att) => ({
                filename: att.filename,
                content: att.content,
                contentType: att.contentType,
              })),
            ],
          });
          emailSent = true;
        } catch (smtpErr: any) {
          emailError = smtpErr?.message;
          console.error(`[Delivery] Lỗi gửi biên lai qua SMTP: ${smtpErr?.message}`);
        }
      }

      if (!emailSent) {
        throw new Error(emailError || 'Chưa cấu hình thông tin gửi Email hợp lệ (Resend API hoặc SMTP)');
      }

      // 5. Ghi lịch sử hóa đơn
      await this.prisma.invoiceHistory.create({
        data: {
          invoiceId: invoice.id,
          action: 'SENT',
          note: `Đã gửi email biên lai thanh toán thành công kèm PDF tới ${recipientEmail}`,
        },
      });

      return { success: true, message: `Đã gửi email biên lai thanh toán tới ${recipientEmail}` };
    } catch (error: any) {
      console.error('Lỗi gửi email thanh toán thành công:', error);
      const cleanMsg = (error.message || '').replace(/^Lỗi gửi mail:\s*/, '');
      throw new Error(cleanMsg || 'Không thể gửi email thanh toán thành công');
    }
  }

  /**
   * Gửi email đặt lại mật khẩu với đường link khôi phục
   * Đường link được tạo từ phía AuthService (dựa theo origin/APP_URL)
   * để khi Deploy lên môi trường khác không phải chỉnh sửa.
   */
  async sendPasswordResetEmail(
    to: string,
    name: string | null | undefined,
    resetLink: string,
    expiresInMinutes: number,
  ): Promise<{ success: boolean; message: string }> {
    const displayName = name || to;
    const userFirstName = displayName.trim().split(/\s+/).slice(-1)[0] || 'bạn';

    // Mẫu email đặt lại mật khẩu (thiết kế riêng, tự động theo link truyền vào)
    const htmlBody = `
      <div style="font-family: Arial, 'Helvetica Neue', sans-serif; font-size: 14px; line-height: 1.6; color: #334155; max-width: 620px; margin: 0 auto; padding: 20px; background: #f8fafc;">
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
          <!-- Header -->
          <div style="background: #0f172a; padding: 20px 28px; text-align: center; border-bottom: 3px solid #2563eb;">
            <div style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 1px;">INVOICE<span style="color: #3b82f6;">-AIR</span></div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px; letter-spacing: 0.5px;">HỆ THỐNG TẠO &amp; QUẢN LÝ HÓA ĐƠN TỰ ĐỘNG</div>
          </div>

          <!-- Body -->
          <div style="padding: 28px 30px;">
            <p style="color: #0f172a; font-size: 15px; margin: 0 0 14px;">Xin chào <strong style="color: #1d4ed8;">${displayName}</strong>,</p>

            <p style="margin: 0 0 14px;">
              Chúng tôi vừa nhận được yêu cầu <strong>đặt lại mật khẩu</strong> cho tài khoản
              <strong style="color: #0f172a;">${to}</strong> trên hệ thống <strong>Invoice-AIR</strong>.
            </p>

            <p style="margin: 0 0 18px;">
              Vui lòng nhấn vào nút bên dưới để tạo mật khẩu đăng nhập mới:
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 24px 0;">
              <a href="${resetLink}" target="_blank"
                 style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 13px 34px; border-radius: 8px; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;">
                🔑 Đặt Lại Mật Khẩu
              </a>
            </div>

            <p style="margin: 0 0 10px; font-size: 13px; color: #64748b;">
              <strong style="color: #0f172a;">Lưu ý:</strong> Liên kết này chỉ có hiệu lực trong
              <strong style="color: #dc2626;">${expiresInMinutes} phút</strong> và chỉ sử dụng được <strong>một lần</strong>.
              Nếu liên kết đã hết hạn, bạn có thể thực hiện lại yêu cầu tại trang quên mật khẩu.
            </p>

            <!-- Fallback raw link -->
            <div style="background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px 16px; margin: 16px 0; font-size: 12px; color: #475569; word-break: break-all;">
              Nếu nút bên trên không hoạt động, sao chép &amp; dán đường dẫn sau vào trình duyệt:<br />
              <a href="${resetLink}" style="color: #2563eb; word-break: break-all;">${resetLink}</a>
            </div>

            <!-- Security note -->
            <div style="border-left: 4px solid #f59e0b; background: #fffbeb; padding: 12px 16px; border-radius: 6px; margin: 18px 0 0; font-size: 13px; color: #92400e;">
              <strong>⚠️ Bảo mật:</strong> Nếu bạn <em>không</em> yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
              Tài khoản của bạn vẫn được bảo mật và không cần thực hiện thêm thao tác nào.
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f1f5f9; padding: 16px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 4px;">© 2026 Invoice-AIR — Hệ thống Tạo &amp; Quản lý Hóa Đơn Tự Động.</p>
            <p style="margin: 0;">Email này được gửi tự động từ hệ thống. Vui lòng không phản hồi email này.</p>
          </div>
        </div>
      </div>
    `;

    try {
      if (process.env.RESEND_API_KEY) {
        let fromEmail = (process.env.SMTP_FROM || '').trim().replace(/^["']|["']$/g, '');
        if (!fromEmail || fromEmail.includes('onboarding@resend.dev') || fromEmail.includes('your-email') || !fromEmail.includes('@invoice.share4happy.com')) {
          fromEmail = '"Invoice-AIR" <billing@invoice.share4happy.com>';
        } else if (!fromEmail.includes('<') && fromEmail.includes('@')) {
          fromEmail = `"Invoice-AIR" <${fromEmail}>`;
        }

        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [to],
            subject: '[Invoice-AIR] Yêu cầu đặt lại mật khẩu',
            html: htmlBody,
          }),
        });

        const resendData = await resendRes.json().catch(() => ({}));
        if (!resendRes.ok) {
          throw new Error(`Resend API HTTP ${resendRes.status}: ${resendData?.message || JSON.stringify(resendData)}`);
        }
      } else if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await this.transporter.sendMail({
          from: process.env.SMTP_FROM || '"Invoice-AIR" <billing@invoice.share4happy.com>',
          to,
          subject: '[Invoice-AIR] Yêu cầu đặt lại mật khẩu',
          html: htmlBody,
        });
      } else {
        throw new Error('Chưa cấu hình thông tin gửi Email (Cần RESEND_API_KEY hoặc SMTP_USER/PASS)');
      }

      console.log(`Đã gửi email đặt lại mật khẩu cho ${to}`);
      return { success: true, message: `Đã gửi email đặt lại mật khẩu tới ${to}` };
    } catch (error: any) {
      console.error('Lỗi gửi email đặt lại mật khẩu:', error);
      const cleanMsg = (error.message || '').replace(/^Lỗi gửi mail:\s*/, '');
      throw new Error(cleanMsg || 'Không thể gửi email đặt lại mật khẩu');
    }
  }

  async getPublicInvoiceByToken(shareToken: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { shareToken },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!invoice) throw new Error('Hóa đơn không tồn tại hoặc liên kết đã hết hạn');
    const settings = await this.prisma.setting.findUnique({ where: { id: 'default' } });
    return { invoice, settings };
  }
}
