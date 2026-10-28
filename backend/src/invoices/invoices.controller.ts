import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
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
  async quickCreateInvoice(@Body() body: any, @Req() req: any) {
    let dto: any = {};

    // 1. Nhận diện cấu trúc dữ liệu từ Landing Page (Form đặt hàng / tư vấn)
    if (body.customer || body.order) {
      const customer = body.customer || {};
      const order = body.order || {};

      dto = {
        buyerName: customer.fullName || customer.name || 'Khách hàng',
        buyerPhone: customer.phone || '',
        buyerEmail: customer.email || '',
        notes: body.notes || order.description || `Đơn hàng từ ${body.source || req?.apiKey?.name || 'AI WRITER'}`,
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

    // Nhận diện thương hiệu từ API Key (VD: 'AI WRITER') hoặc body.source
    const brandName =
      req?.apiKey?.name ||
      body.source ||
      body.brandName ||
      (body.order?.packageName?.toUpperCase().includes('AI') ? 'AI WRITER' : 'AI WRITER');

    const serviceTitle =
      body.order?.packageName ||
      body.packageName ||
      (created.items && created.items[0]?.name) ||
      'Gói Dịch Vụ AI WRITER';

    // 3. Tự động gửi email hóa đơn nếu có email và không tắt cờ sendEmail
    let emailResult = { sent: false, error: null as any };
    if (body.sendEmail !== false && created.buyerEmail) {
      try {
        await this.deliveryService.sendInvoiceEmail(created.id, {
          source: brandName,
          packageName: serviceTitle,
          subject: body.emailSubject,
          isRegistration: true,
        });
        emailResult.sent = true;
      } catch (err: any) {
        emailResult.error = err?.message || String(err);
        console.error('[Quick-Create] Không thể gửi email tự động:', err?.message);
      }
    }

    // 4. Tự động gửi tin nhắn Zalo kèm link PDF nếu có số điện thoại
    let zaloResult = { sent: false, error: null as any };
    if (body.sendZalo !== false && created.buyerPhone) {
      try {
        const formatCurrency = (n?: number) =>
          new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

        let customZaloMessage = body.customMessage || body.message;
        if (!customZaloMessage) {
          customZaloMessage =
            `🎉 [${brandName}] Xác nhận đăng ký gói dịch vụ thành công!\n` +
            `Kính chào Anh/Chị ${created.buyerName},\n` +
            `Hệ thống đã tiếp nhận yêu cầu đăng ký gói dịch vụ của Quý khách:\n` +
            `• Dịch vụ: ${serviceTitle}\n` +
            `• Mã hóa đơn: #${created.invoiceNumber}\n` +
            `• Tổng thanh toán: ${formatCurrency(created.grandTotal)}\n` +
            (created.paymentCode ? `• Cú pháp chuyển khoản: ${created.paymentCode}\n` : '') +
            `👉 Xem hóa đơn & Quét mã VietQR thanh toán tự động: ${viewUrl}\n\n` +
            `Gói dịch vụ sẽ được kích hoạt ngay khi hoàn tất thanh toán. Cảm ơn Quý khách!`;
        }

        const zRes = await this.zaloService.sendInvoiceZalo({
          phone: created.buyerPhone,
          customerName: created.buyerName,
          invoiceNumber: created.invoiceNumber,
          grandTotal: created.grandTotal,
          viewUrl,
          pdfUrl,
          customMessage: customZaloMessage,
        });
        if (zRes.success) {
          zaloResult.sent = true;
        } else {
          zaloResult.error = zRes.error;
        }
      } catch (err: any) {
        zaloResult.error = err?.message || String(err);
        console.error('[Quick-Create] Không thể gửi tin nhắn Zalo tự động:', err?.message);
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
      emailResult,
      zaloResult,
    };
  }

  @Public() // 🌐 Endpoint kiểm tra trực tiếp việc gửi email cho một hóa đơn
  @Post('test-send-email/:id')
  async testSendEmail(@Param('id') id: string) {
    return this.deliveryService.sendInvoiceEmail(id, {
      source: 'AI WRITER',
      isRegistration: true,
    });
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
  async payInvoice(
    @Param('id') id: string,
    @Body() body: { note?: string; sendEmail?: boolean; sendZalo?: boolean; source?: string } = {},
    @Req() req: any,
  ) {
    const note = body?.note;
    // 1. Cập nhật trạng thái hóa đơn sang PAID trong Database
    const updated = await this.invoicesService.payInvoice(id, note);

    const appUrl = (process.env.APP_URL || 'https://invoice.share4happy.com').replace(/\/+$/, '');
    const backendUrl = (process.env.BACKEND_URL || 'https://invoice-backend-5tbi.onrender.com').replace(/\/+$/, '');
    const viewUrl = `${appUrl}/view/${updated.shareToken}`;
    const pdfUrl = `${backendUrl}/api/delivery/public/${updated.shareToken}/pdf`;

    const brandName = req?.apiKey?.name || body?.source || 'AI WRITER';
    const firstItem = updated.items?.[0];
    const packageName = firstItem?.name || 'Gói Dịch Vụ AI WRITER';

    // 2. Tự động gửi Email Biên Lai Thanh Toán Thành Công kèm file PDF
    let emailResult = { sent: false, error: null as any };
    if (body?.sendEmail !== false && updated.buyerEmail) {
      try {
        await this.deliveryService.sendPaymentSuccessEmail(updated.id, {
          note,
          source: brandName,
          packageName,
        });
        emailResult.sent = true;
      } catch (err: any) {
        emailResult.error = err?.message || String(err);
        console.error('[Pay-Invoice] Lỗi gửi email thanh toán thành công:', err?.message);
      }
    }

    // 3. Tự động gửi Tin Nhắn Zalo xác nhận thanh toán & kích hoạt gói
    let zaloResult = { sent: false, error: null as any };
    if (body?.sendZalo !== false && updated.buyerPhone) {
      try {
        const zRes = await this.zaloService.sendPaymentSuccessZalo({
          phone: updated.buyerPhone,
          customerName: updated.buyerName,
          invoiceNumber: updated.invoiceNumber,
          grandTotal: updated.grandTotal,
          packageName,
          brandName,
          viewUrl,
          pdfUrl,
          note,
        });
        if (zRes.success) {
          zaloResult.sent = true;
        } else {
          zaloResult.error = zRes.error;
        }
      } catch (err: any) {
        zaloResult.error = err?.message || String(err);
        console.error('[Pay-Invoice] Lỗi gửi tin nhắn Zalo thanh toán thành công:', err?.message);
      }
    }

    return {
      success: true,
      invoice: updated,
      emailResult,
      zaloResult,
    };
  }

  @Public() // 🌐 Endpoint dành cho Webhook đối soát (SePay, Casso, Ngân hàng) hoặc Landing Page gọi xác nhận
  @Post('confirm-payment/:id')
  async confirmPaymentWebhook(
    @Param('id') id: string,
    @Body() body: any = {},
    @Req() req: any,
  ) {
    return this.payInvoice(id, body, req);
  }

  @Public() // 🌐 Endpoint kiểm tra trực tiếp gửi Email & Zalo thanh toán thành công
  @Post('test-send-payment-success/:id')
  async testSendPaymentSuccess(@Param('id') id: string, @Body() body: any = {}) {
    const invoice = await this.invoicesService.getInvoiceById(id);
    if (!invoice) throw new Error('Hóa đơn không tồn tại');

    const appUrl = (process.env.APP_URL || 'https://invoice.share4happy.com').replace(/\/+$/, '');
    const backendUrl = (process.env.BACKEND_URL || 'https://invoice-backend-5tbi.onrender.com').replace(/\/+$/, '');
    const viewUrl = `${appUrl}/view/${invoice.shareToken}`;
    const pdfUrl = `${backendUrl}/api/delivery/public/${invoice.shareToken}/pdf`;
    const brandName = body?.source || 'AI WRITER';
    const packageName = body?.packageName || invoice.items?.[0]?.name || 'Gói Dịch Vụ AI WRITER';
    const note = body?.note || 'Xác nhận thanh toán thành công (Thử nghiệm)';

    let emailResult = { sent: false, error: null as any };
    if (invoice.buyerEmail) {
      try {
        await this.deliveryService.sendPaymentSuccessEmail(id, {
          source: brandName,
          packageName,
          note,
        });
        emailResult.sent = true;
      } catch (err: any) {
        emailResult.error = err?.message || String(err);
      }
    }

    let zaloResult = { sent: false, error: null as any };
    if (invoice.buyerPhone) {
      try {
        const zRes = await this.zaloService.sendPaymentSuccessZalo({
          phone: invoice.buyerPhone,
          customerName: invoice.buyerName,
          invoiceNumber: invoice.invoiceNumber,
          grandTotal: invoice.grandTotal,
          packageName,
          brandName,
          viewUrl,
          pdfUrl,
          note,
        });
        if (zRes.success) {
          zaloResult.sent = true;
        } else {
          zaloResult.error = zRes.error;
        }
      } catch (err: any) {
        zaloResult.error = err?.message || String(err);
      }
    }

    return {
      success: true,
      invoiceNumber: invoice.invoiceNumber,
      buyerEmail: invoice.buyerEmail,
      buyerPhone: invoice.buyerPhone,
      emailResult,
      zaloResult,
    };
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
