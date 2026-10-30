import { Controller, Post, Param, Get, Res, Body, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { DeliveryService } from './delivery.service';
import { ZaloService } from './zalo.service';
import { PdfService } from '../document/pdf.service';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/decorators/public.decorator';
import { MessageTemplatesService } from '../message-templates/message-templates.service';

// 🔒 Protected by global JwtAuthGuard in app.module.ts
@Controller('delivery')
export class DeliveryController {
  constructor(
    private readonly deliveryService: DeliveryService,
    private readonly zaloService: ZaloService,
    private readonly pdfService: PdfService,
    private readonly prisma: PrismaService,
    private readonly messageTemplatesService: MessageTemplatesService,
  ) {}

  @Post('send-email/:id')
  async sendEmail(@Param('id') id: string) {
    try {
      return await this.deliveryService.sendInvoiceEmail(id);
    } catch (err: any) {
      throw new BadRequestException(err?.message || 'Lỗi gửi email');
    }
  }

  @Post('send-payment-email/:id')
  async sendPaymentEmail(@Param('id') id: string) {
    try {
      return await this.deliveryService.sendPaymentSuccessEmail(id);
    } catch (err: any) {
      throw new BadRequestException(err?.message || 'Lỗi gửi email thanh toán thành công');
    }
  }

  @Post('send-zalo/:id')
  async sendZalo(@Param('id') id: string) {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!invoice) throw new BadRequestException('Không tìm thấy hóa đơn');
      if (!invoice.buyerPhone) throw new BadRequestException('Hóa đơn không có số điện thoại');

      const appUrl = (process.env.APP_URL || 'https://invoice.share4happy.com').replace(/\/+$/, '');
      const backendUrl = (process.env.BACKEND_URL || 'https://invoice-backend-5tbi.onrender.com').replace(/\/+$/, '');
      const viewUrl = `${appUrl}/view/${invoice.shareToken}`;
      const pdfUrl = `${backendUrl}/api/delivery/public/${invoice.shareToken}/pdf`;
      const packageName = invoice.items?.[0]?.name || 'Gói Dịch Vụ';
      const itemIds = invoice.items.map((it) => it.id);
      const itemNames = invoice.items.map((it) => it.name);

      // Tra cứu mẫu tin nhắn Zalo được cấu hình cho gói này
      const isPaid = invoice.status === 'PAID';
      const triggerType = isPaid ? 'PAYMENT_SUCCESS' : 'INVOICE_CREATED';
      const matchTpl = await this.messageTemplatesService.findMatchingTemplate(
        'ZALO',
        triggerType as any,
        itemIds,
        itemNames,
      );

      let customMessage: string | undefined = undefined;
      if (matchTpl) {
        const rendered = this.messageTemplatesService.renderTemplateContent(matchTpl, {
          customerName: invoice.buyerName,
          invoiceNumber: invoice.invoiceNumber,
          grandTotal: invoice.grandTotal,
          packageName,
          viewUrl,
          pdfUrl,
          paymentCode: invoice.paymentCode || '',
          brandName: 'AI WRITER',
          notes: invoice.notes || '',
        });
        customMessage = rendered.content;
        if (rendered.attachments && rendered.attachments.length > 0) {
          customMessage += '\n\n📎 Tài liệu & File đính kèm:';
          rendered.attachments.forEach((att) => {
            customMessage += `\n• ${att.name}: ${att.url}`;
          });
        }
      }

      if (isPaid) {
        const res = await this.zaloService.sendPaymentSuccessZalo({
          phone: invoice.buyerPhone,
          customerName: invoice.buyerName,
          invoiceNumber: invoice.invoiceNumber,
          grandTotal: invoice.grandTotal,
          packageName,
          brandName: 'AI WRITER',
          viewUrl,
          pdfUrl,
          customMessage,
        });
        if (!res.success) throw new BadRequestException(res.error || 'Gửi tin nhắn Zalo không thành công');
        return res;
      }

      const res = await this.zaloService.sendInvoiceZalo({
        phone: invoice.buyerPhone,
        customerName: invoice.buyerName,
        invoiceNumber: invoice.invoiceNumber,
        grandTotal: invoice.grandTotal,
        viewUrl,
        pdfUrl,
        customMessage,
      });

      if (!res.success) {
        throw new BadRequestException(res.error || 'Gửi tin nhắn Zalo không thành công');
      }

      return res;
    } catch (err: any) {
      throw new BadRequestException(err?.message || 'Lỗi gửi tin nhắn Zalo');
    }
  }

  @Post('send-payment-zalo/:id')
  async sendPaymentZalo(@Param('id') id: string, @Body('note') note?: string) {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!invoice) throw new BadRequestException('Không tìm thấy hóa đơn');
      if (!invoice.buyerPhone) throw new BadRequestException('Hóa đơn không có số điện thoại');

      const appUrl = (process.env.APP_URL || 'https://invoice.share4happy.com').replace(/\/+$/, '');
      const backendUrl = (process.env.BACKEND_URL || 'https://invoice-backend-5tbi.onrender.com').replace(/\/+$/, '');
      const packageName = invoice.items?.[0]?.name || 'Gói Dịch Vụ AI WRITER';
      const itemIds = invoice.items.map((it) => it.id);
      const itemNames = invoice.items.map((it) => it.name);

      const matchTpl = await this.messageTemplatesService.findMatchingTemplate(
        'ZALO',
        'PAYMENT_SUCCESS',
        itemIds,
        itemNames,
      );

      let customMessage: string | undefined = undefined;
      if (matchTpl) {
        const rendered = this.messageTemplatesService.renderTemplateContent(matchTpl, {
          customerName: invoice.buyerName,
          invoiceNumber: invoice.invoiceNumber,
          grandTotal: invoice.grandTotal,
          packageName,
          viewUrl: `${appUrl}/view/${invoice.shareToken}`,
          pdfUrl: `${backendUrl}/api/delivery/public/${invoice.shareToken}/pdf`,
          paymentCode: invoice.paymentCode || '',
          brandName: 'AI WRITER',
          notes: note || invoice.notes || '',
        });
        customMessage = rendered.content;
        if (rendered.attachments && rendered.attachments.length > 0) {
          customMessage += '\n\n📎 Tài liệu & File đính kèm:';
          rendered.attachments.forEach((att) => {
            customMessage += `\n• ${att.name}: ${att.url}`;
          });
        }
      }

      const res = await this.zaloService.sendPaymentSuccessZalo({
        phone: invoice.buyerPhone,
        customerName: invoice.buyerName,
        invoiceNumber: invoice.invoiceNumber,
        grandTotal: invoice.grandTotal,
        packageName,
        brandName: 'AI WRITER',
        viewUrl: `${appUrl}/view/${invoice.shareToken}`,
        pdfUrl: `${backendUrl}/api/delivery/public/${invoice.shareToken}/pdf`,
        note,
        customMessage,
      });

      if (!res.success) {
        throw new BadRequestException(res.error || 'Gửi tin nhắn Zalo thanh toán không thành công');
      }

      return res;
    } catch (err: any) {
      throw new BadRequestException(err?.message || 'Lỗi gửi tin nhắn Zalo thanh toán');
    }
  }

  @Post('test-zalo')
  async testZalo(@Body() body: { baseUrl?: string; botId: string; apiKey: string; testPhone: string }) {
    try {
      return await this.zaloService.testConnection(body);
    } catch (err: any) {
      throw new BadRequestException(err?.message || 'Lỗi gửi tin nhắn Zalo kiểm tra');
    }
  }

  @Public() // 🌐 Link chia sẻ công khai cho khách xem hoá đơn — không cần đăng nhập
  @Get('public/:token')
  async getPublicInvoice(@Param('token') token: string) {
    return this.deliveryService.getPublicInvoiceByToken(token);
  }

  @Public() // 🌐 Link tải PDF công khai theo shareToken cho khách trên Landing Page / Zalo
  @Get('public/:token/pdf')
  async exportPublicPdf(@Param('token') token: string, @Res() res: Response) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { shareToken: token, deletedAt: null },
      include: { items: true },
    });
    if (!invoice) return res.status(404).send('Không tìm thấy hóa đơn hoặc hóa đơn đã bị gỡ bỏ');

    const settings = await this.prisma.setting.findUnique({ where: { id: 'default' } });
    const buffer = await this.pdfService.generatePdfBuffer(invoice, settings);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="HD_${invoice.invoiceNumber}.pdf"`,
      'Content-Length': buffer.length,
    });

    return res.end(buffer);
  }

  @Public() // 🌐 Link tải PDF theo ID hoá đơn
  @Get('export-pdf/:id')
  async exportPdf(@Param('id') id: string, @Res() res: Response) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, deletedAt: null },
      include: { items: true },
    });
    if (!invoice) return res.status(404).send('Không tìm thấy hóa đơn hoặc hóa đơn đã bị gỡ bỏ');

    const settings = await this.prisma.setting.findUnique({ where: { id: 'default' } });
    const buffer = await this.pdfService.generatePdfBuffer(invoice, settings);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="HD_${invoice.invoiceNumber}.pdf"`,
      'Content-Length': buffer.length,
    });

    return res.end(buffer);
  }
}
