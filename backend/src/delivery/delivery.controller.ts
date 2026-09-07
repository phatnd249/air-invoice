import { Controller, Post, Param, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { DeliveryService } from './delivery.service';
import { PdfService } from '../document/pdf.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('delivery')
export class DeliveryController {
  constructor(
    private readonly deliveryService: DeliveryService,
    private readonly pdfService: PdfService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('send-email/:id')
  async sendEmail(@Param('id') id: string) {
    return this.deliveryService.sendInvoiceEmail(id);
  }

  @Get('public/:token')
  async getPublicInvoice(@Param('token') token: string) {
    return this.deliveryService.getPublicInvoiceByToken(token);
  }

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
