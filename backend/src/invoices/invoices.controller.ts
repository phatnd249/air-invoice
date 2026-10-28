import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { DeliveryService } from '../delivery/delivery.service';
import { ZaloService } from '../delivery/zalo.service';
import { Public } from '../auth/decorators/public.decorator';

// 🔒 Protected by global JwtAuthGuard in app.module.ts
@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly deliveryService: DeliveryService,
    private readonly zaloService: ZaloService,
  ) {}

  @Public() // 🌐 Endpoint dành riêng cho Landing Page (gọi tạo hoá đơn & sinh PDF trực tiếp)
  @Post('quick-create')
  async quickCreateInvoice(@Body() body: any) {
    let dto: any = {};

    // 1. Nhận diện cấu trúc dữ liệu từ Landing Page (Form đặt hàng / tư vấn)
    if (body.customer || body.order) {
      const customer = body.customer || {};
      const order = body.order || {};

      dto = {
        buyerName: customer.fullName || customer.name || 'Khách hàng',
        buyerPhone: customer.phone || '',
        buyerEmail: customer.email || '',
        notes: body.notes || order.description || `Đơn hàng từ ${body.source || 'Landing Page'}`,
        invoiceType: body.invoiceType || 'GTGT',
        invoiceForm: body.invoiceForm || 'WITH_TAX_CODE',
        hasVat: body.hasVat === true,
        items: [
          {
            name: order.packageName || order.name || 'Dịch vụ phần mềm',
            quantity: Number(order.quantity) || 1,
            unitPrice: Number(order.amountVnd || order.price || order.chargeAmount) || 0,
            description: order.description || '',
            unit: 'gói',
          },
        ],
      };
    } else {
      dto = body;
    }

    // 2. Tạo hóa đơn trong Database
    const created = await this.invoicesService.createInvoice(dto);

    const appUrl = (process.env.APP_URL || 'https://invoice.share4happy.com').replace(/\/+$/, '');
    const backendUrl = (process.env.BACKEND_URL || 'https://invoice-backend-5tbi.onrender.com').replace(/\/+$/, '');
    const viewUrl = `${appUrl}/view/${created.shareToken}`;
    const pdfUrl = `${backendUrl}/api/delivery/public/${created.shareToken}/pdf`;

    // 3. Tự động gửi email hóa đơn nếu có email và không tắt cờ sendEmail
    if (body.sendEmail !== false && created.buyerEmail) {
      try {
        await this.deliveryService.sendInvoiceEmail(created.id);
      } catch (err: any) {
        console.warn('[Quick-Create] Không thể gửi email tự động:', err?.message);
      }
    }

    // 4. Tự động gửi tin nhắn Zalo kèm link PDF nếu có số điện thoại
    if (body.sendZalo !== false && created.buyerPhone) {
      try {
        await this.zaloService.sendInvoiceZalo({
          phone: created.buyerPhone,
          customerName: created.buyerName,
          invoiceNumber: created.invoiceNumber,
          grandTotal: created.grandTotal,
          viewUrl,
          pdfUrl,
        });
      } catch (err: any) {
        console.warn('[Quick-Create] Không thể gửi tin nhắn Zalo tự động:', err?.message);
      }
    }

    return {
      success: true,
      id: created.id,
      invoiceNumber: created.invoiceNumber,
      paymentCode: created.paymentCode,
      grandTotal: created.grandTotal,
      shareToken: created.shareToken,
      qrDataUrl: created.qrDataUrl,
      viewUrl,
      pdfUrl,
      downloadPdfUrl: `${backendUrl}/api/delivery/export-pdf/${created.id}`,
    };
  }

  @Get()
  async getInvoices(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('invoiceType') invoiceType?: string,
    @Query('invoiceForm') invoiceForm?: string,
  ) {
    return this.invoicesService.getInvoices(status, search, invoiceType, invoiceForm);
  }

  @Get('next-number')
  async getNextInvoiceNumber() {
    const nextNumber = await this.invoicesService.getNextInvoiceNumber();
    return { nextNumber };
  }

  @Get('activities/all')
  async getAllHistories(@Query('action') action?: string, @Query('search') search?: string) {
    return this.invoicesService.getAllHistories(action, search);
  }

  @Get(':id')
  async getInvoiceById(@Param('id') id: string) {
    return this.invoicesService.getInvoiceById(id);
  }

  @Post()
  async createInvoice(@Body() dto: any) {
    return this.invoicesService.createInvoice(dto);
  }

  @Put(':id')
  async updateInvoice(@Param('id') id: string, @Body() dto: any) {
    return this.invoicesService.updateInvoice(id, dto);
  }

  @Post(':id/clone')
  async cloneInvoice(@Param('id') id: string) {
    return this.invoicesService.cloneInvoice(id);
  }

  @Post(':id/issue')
  async issueInvoice(@Param('id') id: string) {
    return this.invoicesService.issueInvoice(id);
  }

  @Post(':id/pay')
  async payInvoice(@Param('id') id: string, @Body('note') note?: string) {
    return this.invoicesService.payInvoice(id, note);
  }

  @Post(':id/cancel')
  async cancelInvoice(@Param('id') id: string) {
    return this.invoicesService.cancelInvoice(id);
  }

  @Get(':id/history')
  async getInvoiceHistory(@Param('id') id: string) {
    return this.invoicesService.getInvoiceHistory(id);
  }

  @Delete(':id')
  async deleteInvoice(@Param('id') id: string) {
    return this.invoicesService.deleteInvoice(id);
  }
}
