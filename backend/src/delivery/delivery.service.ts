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
