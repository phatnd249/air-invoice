import { Controller, Post, Param, Get, Res, Body, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { DeliveryService } from './delivery.service';
import { ZaloService } from './zalo.service';
import { PdfService } from '../document/pdf.service';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/decorators/public.decorator';

// 🔒 Protected by global JwtAuthGuard in app.module.ts
@Controller('delivery')
export class DeliveryController {
  constructor(
    private readonly deliveryService: DeliveryService,
    private readonly zaloService: ZaloService,
    private readonly pdfService: PdfService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('send-email/:id')
  async sendEmail(@Param('id') id: string) {
    try {
      return await this.deliveryService.sendInvoiceEmail(id);
    } catch (err: any) {
      throw new BadRequestException(err?.message || 'Lỗi gửi email');
    }
  }

  @Post('send-zalo/:id')
  async sendZalo(@Param('id') id: string) {
    try {
      const invoice = await this.prisma.invoice.findUnique({ where: { id } });
      if (!invoice) throw new BadRequestException('Không tìm thấy hóa đơn');
      if (!invoice.buyerPhone) throw new BadRequestException('Hóa đơn không có số điện thoại');

      const appUrl = (process.env.APP_URL || 'https://invoice.share4happy.com').replace(/\/+$/, '');
      const backendUrl = (process.env.BACKEND_URL || 'https://invoice-backend-5tbi.onrender.com').replace(/\/+$/, '');

      return await this.zaloService.sendInvoiceZalo({
        phone: invoice.buyerPhone,
        customerName: invoice.buyerName,
        invoiceNumber: invoice.invoiceNumber,
        grandTotal: invoice.grandTotal,
        viewUrl: `${appUrl}/view/${invoice.shareToken}`,
        pdfUrl: `${backendUrl}/api/delivery/public/${invoice.shareToken}/pdf`,
      });
    } catch (err: any) {
      throw new BadRequestException(err?.message || 'Lỗi gửi tin nhắn Zalo');
    }
  }

  @Post('test-zalo')
  async testZalo(@Body() body: { baseUrl?: string; botId: string; apiKey: string; testPhone: string }) {
    return this.zaloService.testConnection(body);
  }

  @Public()  // 🌐 Link chia sẻ công khai cho khách xem hoá đơn — không cần đăng nhập
  @Get('public/:token')
  async getPublicInvoice(@Param('token') token: string) {
    return this.deliveryService.getPublicInvoiceByToken(token);
  }

  @Public()  // 🌐 Link tải PDF công khai theo shareToken cho khách trên Landing Page / Zalo
  @Get('public/:token/pdf')
  async exportPublicPdf(@Param('token') token: string, @Res() res: Response) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { shareToken: token },
      include: { items: true },
    });
    if (!invoice) return res.status(404).send('Không tìm thấy hóa đơn');

    const settings = await this.prisma.setting.findUnique({ where: { id: 'default' } });
    const buffer = await this.pdfService.generatePdfBuffer(invoice, settings);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="HD_${invoice.invoiceNumber}.pdf"`,
      'Content-Length': buffer.length,
    });

    return res.end(buffer);
  }

  @Public()  // 🌐 Link tải PDF theo ID hoá đơn
  @Get('export-pdf/:id')
  async exportPdf(@Param('id') id: string, @Res() res: Response) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!invoice) return res.status(404).send('Không tìm thấy hóa đơn');

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
