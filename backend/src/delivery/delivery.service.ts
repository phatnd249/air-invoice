import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PdfService } from '../document/pdf.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeliveryService {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  async sendInvoiceEmail(invoiceId: string): Promise<{ success: boolean; message: string }> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    });

    if (!invoice) throw new Error('Hóa đơn không tồn tại');
    if (!invoice.buyerEmail) throw new Error('Hóa đơn chưa có địa chỉ email người nhận');

    const settings = await this.prisma.setting.findUnique({ where: { id: 'default' } });

    // 1. Sinh file PDF đính kèm bằng Playwright
    const pdfBuffer = await this.pdfService.generatePdfBuffer(invoice, settings);

    // 2. Định dạng thông tin hiển thị
    const formatCurrency = (n: number) =>
      new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

    const firstItem = invoice.items[0] || { name: 'Dịch vụ', description: '', metaInfo: '' };
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const shareUrl = `${appUrl}/view/${invoice.shareToken}`;
    const dueDateStr = invoice.dueDate
      ? new Date(invoice.dueDate).toLocaleDateString('vi-VN')
      : new Date(invoice.issueDate).toLocaleDateString('vi-VN');

    // 3. Nội dung Email theo đúng mẫu yêu cầu của Tetrasco
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #2c3e50; padding-bottom: 10px;">THÔNG BÁO HÓA ĐƠN & NHẮC LỊCH THANH TOÁN</h2>
        
        <p>Kính gửi Quý khách hàng <strong>${invoice.buyerName}</strong>,</p>
        
        <p>Lời đầu tiên, <strong>Tetrasco</strong> xin chân thành cảm ơn Quý khách đã tin tưởng và đồng hành cùng dịch vụ của chúng tôi trong suốt thời gian qua.</p>
        
        <p>Chúng tôi xin gửi thông báo hóa đơn & nhắc lịch thanh toán cho dịch vụ mà Quý khách đang sử dụng để đảm bảo hoạt động luôn trong trạng thái ổn định nhất. Thông tin chi tiết dịch vụ:</p>
        
        <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 15px 0; border-radius: 4px;">
          <p style="margin: 4px 0;"><strong>• Dịch vụ:</strong> ${firstItem.name}</p>
          ${firstItem.description ? `<p style="margin: 4px 0;"><strong>• Tên miền liên kết / Chi tiết:</strong> ${firstItem.description}</p>` : ''}
          ${firstItem.metaInfo ? `<p style="margin: 4px 0;"><strong>• Thời hạn dịch vụ:</strong> ${firstItem.metaInfo}</p>` : ''}
          <p style="margin: 4px 0;"><strong>• Số tiền thanh toán:</strong> <span style="color: #dc2626; font-size: 16px; font-weight: bold;">${formatCurrency(invoice.grandTotal)}</span></p>
          <p style="margin: 4px 0;"><strong>• Ngày hết hạn / Đến hạn:</strong> ${dueDateStr}</p>
        </div>

        <h4 style="color: #2c3e50; margin-top: 20px; margin-bottom: 8px;">Tại sao Quý khách cần gia hạn / thanh toán đúng hạn?</h4>
        <p style="margin: 4px 0;">Việc gia hạn kịp thời giúp Quý khách:</p>
        <ul style="padding-left: 20px; margin-top: 4px;">
          <li>Duy trì hoạt động liên tục 24/7 của hệ thống website và email doanh nghiệp.</li>
          <li>Đảm bảo an toàn dữ liệu, tránh các rủi ro phát sinh khi dịch vụ bị gián đoạn.</li>
          <li>Giữ vững thứ hạng SEO và uy tín thương hiệu trên môi trường internet.</li>
        </ul>

        <h4 style="color: #2c3e50; margin-top: 20px; margin-bottom: 8px;">Hướng dẫn thanh toán & Xem hóa đơn:</h4>
        <p>Quý khách vui lòng kiểm tra chi tiết hóa đơn (kèm file PDF đính kèm trong email này) và thực hiện thanh toán bằng cách truy cập trực tiếp vào đường dẫn dưới đây:</p>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${shareUrl}" target="_blank" style="background: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">
            🔗 Xem Hóa Đơn & Quét Mã VietQR Trực Tuyến
          </a>
        </div>

        <p style="font-size: 13px; color: #666; font-style: italic;">
          (Lưu ý: Quý khách vui lòng kiểm tra thông tin tài khoản và cú pháp chuyển khoản <strong>${invoice.paymentCode || ''}</strong> được ghi sẵn trong hóa đơn để hoàn tất quy trình).
        </p>

        <p style="margin-top: 20px;">Bên cạnh đó, Quý khách cũng có thể liên hệ để được hỗ trợ gia hạn hoặc gửi biên lai trực tiếp qua:</p>
        <p style="margin: 4px 0;">💬 <strong>Zalo TetrasCo:</strong> 0812305046</p>
        <p style="margin: 4px 0;">📞 <strong>Hotline:</strong> 0812305046</p>

        <p style="margin-top: 15px;">Nếu Quý khách cần hỗ trợ kỹ thuật hoặc có bất kỳ thắc mắc nào về quy trình, xin vui lòng phản hồi email này hoặc liên hệ hotline 0812305046.</p>

        <p style="margin-top: 25px; border-top: 1px solid #eee; padding-top: 15px;">
          Trân trọng,<br />
          <strong>Đội ngũ Hỗ trợ khách hàng Tetrasco</strong>
        </p>
      </div>
    `;

    // 4. Gửi qua SMTP
    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await this.transporter.sendMail({
          from: process.env.SMTP_FROM || '"Đội ngũ Tetrasco" <no-reply@invoice-air.com>',
          to: invoice.buyerEmail,
          subject: `[Tetrasco] Thông báo hóa đơn & Nhắc lịch thanh toán dịch vụ - ${invoice.invoiceNumber}`,
          html: htmlBody,
          attachments: [
            {
              filename: `HD_${invoice.invoiceNumber}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf',
            },
          ],
        });
      }

      // 5. Cập nhật trạng thái hóa đơn sang SENT
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'SENT',
          histories: {
            create: {
              action: 'SENT',
              note: `Đã gửi email thông báo kèm file PDF tới ${invoice.buyerEmail}`,
            },
          },
        },
      });

      return { success: true, message: `Đã gửi email thành công tới ${invoice.buyerEmail}` };
    } catch (error: any) {
      console.error('Lỗi gửi email:', error);
      throw new Error(`Lỗi gửi mail: ${error.message}`);
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
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await this.transporter.sendMail({
          from: process.env.SMTP_FROM || '"Invoice-AIR" <no-reply@invoice-air.com>',
          to,
          subject: '[Invoice-AIR] Yêu cầu đặt lại mật khẩu',
          html: htmlBody,
        });
      }

      console.log(`Đã gửi email đặt lại mật khẩu cho ${to}`);
      return { success: true, message: `Đã gửi email đặt lại mật khẩu tới ${to}` };
    } catch (error: any) {
      console.error('Lỗi gửi email đặt lại mật khẩu:', error);
      throw new Error(`Lỗi gửi mail: ${error.message}`);
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
