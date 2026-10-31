import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { DeliveryService } from '../delivery/delivery.service';
import { ZaloService } from '../delivery/zalo.service';
import { QueueService } from '../queue/queue.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaymentWebhookGuard } from './guards/payment-webhook.guard';
import { QueueType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// 🔒 Protected by global JwtAuthGuard in app.module.ts
@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly deliveryService: DeliveryService,
    private readonly zaloService: ZaloService,
    private readonly queueService: QueueService,
    private readonly prisma: PrismaService,
  ) {}

  @Public() // 🌐 Endpoint kiểm tra nhanh xem khách hàng đã có hóa đơn chưa
  @Get('check-existing')
  async checkExistingInvoice(
    @Query('email') email?: string,
    @Query('phone') phone?: string,
  ) {
    if (!email && !phone) {
      return { exists: false };
    }
    const existing = await this.invoicesService.findExistingInvoice(email, phone);

    // 🔒 Chỉ trả về true/false. KHÔNG trả tên, email, SĐT, mã hóa đơn, số tiền hay link
    // xem/tải PDF — endpoint này là public nên mọi dữ liệu chi tiết đều là rò rỉ PII.
    return { exists: !!existing };
  }

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

    // 🔒 Request công khai (không kèm API Key) không được điều khiển nội dung email/Zalo.
    // Nếu cho phép, bất kỳ ai cũng dùng được domain email đã xác thực để gửi nội dung tùy ý.
    if (!req?.apiKey) {
      delete body.emailSubject;
      delete body.customMessage;
      delete body.message;
      delete body.brandName;
      delete body.source;
      delete dto.emailSubject;
      delete dto.customMessage;
      delete dto.message;
    }

    // Tự động đối chiếu đơn giá & mô tả từ Danh mục dịch vụ nếu chưa có
    if (dto.items && Array.isArray(dto.items)) {
      for (const item of dto.items) {
        if (!item.unitPrice || item.unitPrice === 0) {
          try {
            const matchedService = await this.prisma.serviceCatalog.findFirst({
              where: {
                name: { equals: item.name, mode: 'insensitive' },
              },
            });
            if (matchedService) {
              item.unitPrice = matchedService.unitPrice;
              if (!item.description) item.description = matchedService.description || '';
              if (matchedService.unit) item.unit = matchedService.unit;
            }
          } catch {}
        }
      }
    }

    // 1.5. Chống trùng lặp (Deduplication): Nếu khách hàng đã có hóa đơn trên hệ thống
    // Chuẩn hóa cờ forceNew để controller và service dùng cùng một điều kiện
    // (tránh trường hợp controller bỏ qua dedupe nhưng service lại trả về hóa đơn cũ).
    dto.forceNew = body.forceNew === true;

    if (!dto.forceNew && (dto.buyerEmail || dto.buyerPhone)) {
      const existing = await this.invoicesService.findExistingInvoice(dto.buyerEmail, dto.buyerPhone);
      if (existing) {
        // 🔒 Request không kèm API Key (Google Form / Landing Page public) chỉ nhận thông báo,
        // không được trả về dữ liệu hóa đơn của khách khác (PII + token xem/tải PDF).
        if (!req?.apiKey) {
          return {
            success: true,
            isExisting: true,
            message:
              'Thông tin này đã được đăng ký trước đó. Vui lòng kiểm tra email/SĐT hoặc liên hệ bộ phận hỗ trợ để được cấp lại link hóa đơn.',
            emailResult: { sent: false, queued: false, note: 'Bỏ qua gửi email vì hóa đơn đã tồn tại' },
            zaloResult: { sent: false, queued: false, note: 'Bỏ qua gửi Zalo vì hóa đơn đã tồn tại' },
          };
        }

        const appUrl = (process.env.APP_URL || 'https://invoice.share4happy.com').replace(/\/+$/, '');
        const backendUrl = (process.env.BACKEND_URL || 'https://invoice-backend-5tbi.onrender.com').replace(/\/+$/, '');
        const viewUrl = `${appUrl}/view/${existing.shareToken}`;
        const pdfUrl = `${backendUrl}/api/delivery/public/${existing.shareToken}/pdf`;

        return {
          success: true,
          isExisting: true,
          message: `Khách hàng ${existing.buyerName} đã có hóa đơn #${existing.invoiceNumber}. Không tạo thêm hóa đơn và không gửi lại email/Zalo để tránh làm phiền khách.`,
          id: existing.id,
          invoiceNumber: existing.invoiceNumber,
          paymentCode: existing.paymentCode,
          grandTotal: existing.grandTotal,
          shareToken: existing.shareToken,
          qrDataUrl: existing.qrDataUrl,
          viewUrl,
          pdfUrl,
          downloadPdfUrl: `${backendUrl}/api/delivery/export-pdf/${existing.id}`,
          invoice: existing,
          emailResult: { sent: false, queued: false, note: 'Bỏ qua gửi email vì hóa đơn đã tồn tại' },
          zaloResult: { sent: false, queued: false, note: 'Bỏ qua gửi Zalo vì hóa đơn đã tồn tại' },
        };
      }
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

    const apiName = req?.apiKey?.name || body.source || body.brandName || 'AI WRITER';
    const targetInfo = `${created.buyerName} (${created.buyerEmail || created.buyerPhone || 'Chưa có SĐT/Email'})`;
    const source = req?.apiKey ? `API Key: ${req.apiKey.name}` : (body.source || 'Landing Page');

    // 3. Tự động gửi email hóa đơn: Lưu vào Hàng Chờ (Queue) để gửi tuần tự và tự động thử lại sau vài phút nếu lỗi
    let emailResult = { sent: false, queued: false, jobId: null as any };
    if (created.buyerEmail && body.disableEmail !== true) {
      const emailJob = await this.queueService.enqueue(
        QueueType.DELIVERY_EMAIL,
        {
          invoiceId: created.id,
          options: {
            source: brandName,
            packageName: serviceTitle,
            subject: body.emailSubject,
            isRegistration: true,
          },
          isPaymentSuccess: false,
        },
        {
          priority: 2,
          maxRetries: 5,
          apiName,
          endpoint: '/api/invoices/quick-create',
          source,
          title: `Gửi Email hóa đơn #${created.invoiceNumber}`,
          targetInfo,
        },
      );
      emailResult.queued = true;
      emailResult.jobId = emailJob.id;
    }

    // 4. Tự động gửi tin nhắn Zalo kèm link PDF: Lưu vào Hàng Chờ để gửi tuần tự
    let zaloResult = { sent: false, queued: false, jobId: null as any };
    if (created.buyerPhone && body.disableZalo !== true) {
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

      const zaloPayload = {
        phone: created.buyerPhone,
        customerName: created.buyerName,
        invoiceNumber: created.invoiceNumber,
        grandTotal: created.grandTotal,
        viewUrl,
        pdfUrl,
        customMessage: customZaloMessage,
      };

      const zaloJob = await this.queueService.enqueue(
        QueueType.DELIVERY_ZALO,
        {
          isPaymentSuccess: false,
          zaloOptions: zaloPayload,
        },
        {
          priority: 1,
          maxRetries: 5,
          apiName,
          endpoint: '/api/invoices/quick-create',
          source,
          title: `Gửi Tin nhắn Zalo #${created.invoiceNumber}`,
          targetInfo,
        },
      );
      zaloResult.queued = true;
      zaloResult.jobId = zaloJob.id;
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

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
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
    @Query('trash') trash?: string,
  ) {
    return this.invoicesService.getInvoices(status, search, invoiceType, invoiceForm, trash);
  }

  @Get('backup/export')
  async exportBackup() {
    return this.invoicesService.getBackupData();
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


  @Post(':id/save-to-catalog')
  async saveToCatalog(
    @Param('id') id: string,
    @Body('itemId') itemId?: string,
    @Body('groupId') groupId?: string,
  ) {
    return this.invoicesService.saveInvoiceItemsToCatalog(id, itemId, groupId);
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

  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'API_KEY')
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
    const apiName = req?.apiKey?.name || body?.source || 'AI WRITER';
    const targetInfo = `${updated.buyerName} (${updated.buyerEmail || updated.buyerPhone || '---'})`;
    const source = req?.apiKey ? `API Key: ${req.apiKey.name}` : 'Thanh Toán / Webhook';

    // 2. Tự động gửi Email Biên Lai Thanh Toán Thành Công: Đưa vào Hàng Chờ (Queue)
    let emailResult = { sent: false, queued: false, jobId: null as any };
    if (body?.sendEmail !== false && updated.buyerEmail) {
      const emailJob = await this.queueService.enqueue(
        QueueType.DELIVERY_EMAIL,
        {
          invoiceId: updated.id,
          options: {
            note,
            source: brandName,
            packageName,
          },
          isPaymentSuccess: true,
        },
        {
          priority: 3,
          maxRetries: 5,
          apiName,
          endpoint: '/api/invoices/:id/pay',
          source,
          title: `Gửi Email Biên lai thanh toán #${updated.invoiceNumber}`,
          targetInfo,
        },
      );
      emailResult.queued = true;
      emailResult.jobId = emailJob.id;
    }

    // Tính toán thời gian bắt đầu & kết thúc gói dịch vụ
    const payStartDate = new Date();
    let payCycleMonths = 1;
    try {
      const matchedCatalog = await this.prisma.serviceCatalog.findFirst({
        where: { name: { equals: packageName, mode: 'insensitive' } },
      });
      const meta = (matchedCatalog?.metaInfo || (firstItem as any)?.metaInfo || firstItem?.description || packageName).toLowerCase();
      if (meta.includes('năm') || meta.includes('12 tháng') || meta.includes('year')) {
        payCycleMonths = 12;
      } else if (meta.includes('quý') || meta.includes('3 tháng')) {
        payCycleMonths = 3;
      } else if (meta.includes('6 tháng')) {
        payCycleMonths = 6;
      }
    } catch {}
    const payExpireDate = new Date(payStartDate);
    payExpireDate.setMonth(payExpireDate.getMonth() + payCycleMonths);
    const pDay = String(payStartDate.getDate()).padStart(2, '0');
    const pMonth = String(payStartDate.getMonth() + 1).padStart(2, '0');
    const payStartStr = `${pDay}/${pMonth}/${payStartDate.getFullYear()}`;
    const pEndDay = String(payExpireDate.getDate()).padStart(2, '0');
    const pEndMonth = String(payExpireDate.getMonth() + 1).padStart(2, '0');
    const payEndStr = `${pEndDay}/${pEndMonth}/${payExpireDate.getFullYear()}`;

    // 3. Tự động gửi Tin Nhắn Zalo xác nhận thanh toán & kích hoạt gói: Đưa vào Hàng Chờ
    let zaloResult = { sent: false, queued: false, jobId: null as any };
    if (body?.sendZalo !== false && updated.buyerPhone) {
      const zaloPayload = {
        phone: updated.buyerPhone,
        customerName: updated.buyerName,
        invoiceNumber: updated.invoiceNumber,
        grandTotal: updated.grandTotal,
        packageName,
        brandName,
        viewUrl,
        pdfUrl,
        note,
        startDate: payStartStr,
        endDate: payEndStr,
      };

      const zaloJob = await this.queueService.enqueue(
        QueueType.DELIVERY_ZALO,
        {
          isPaymentSuccess: true,
          zaloOptions: zaloPayload,
        },
        {
          priority: 2,
          maxRetries: 5,
          apiName,
          endpoint: '/api/invoices/:id/pay',
          source,
          title: `Gửi Zalo Xác nhận thanh toán #${updated.invoiceNumber}`,
          targetInfo,
        },
      );
      zaloResult.queued = true;
      zaloResult.jobId = zaloJob.id;
    }

    return {
      success: true,
      invoice: updated,
      emailResult,
      zaloResult,
    };
  }

  @Public() // 🌐 Endpoint dành cho Webhook đối soát (SePay, Casso, Ngân hàng) — bắt buộc có secret
  @UseGuards(PaymentWebhookGuard)
  @Post('confirm-payment/:id')
  async confirmPaymentWebhook(
    @Param('id') id: string,
    @Body() body: any = {},
    @Req() req: any,
  ) {
    return this.payInvoice(id, body, req);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
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

    const paymentDate = new Date();
    let cycleMonths = 1;
    try {
      const matchedCatalog = await this.prisma.serviceCatalog.findFirst({
        where: { name: { equals: packageName, mode: 'insensitive' } },
      });
      const meta = (matchedCatalog?.metaInfo || (invoice.items?.[0] as any)?.metaInfo || invoice.items?.[0]?.description || packageName).toLowerCase();
      if (meta.includes('năm') || meta.includes('12 tháng') || meta.includes('year')) {
        cycleMonths = 12;
      } else if (meta.includes('quý') || meta.includes('3 tháng')) {
        cycleMonths = 3;
      } else if (meta.includes('6 tháng')) {
        cycleMonths = 6;
      }
    } catch {}
    const expireDate = new Date(paymentDate);
    expireDate.setMonth(expireDate.getMonth() + cycleMonths);
    const day = String(paymentDate.getDate()).padStart(2, '0');
    const month = String(paymentDate.getMonth() + 1).padStart(2, '0');
    const startDateStr = `${day}/${month}/${paymentDate.getFullYear()}`;
    const endDay = String(expireDate.getDate()).padStart(2, '0');
    const endMonth = String(expireDate.getMonth() + 1).padStart(2, '0');
    const endDateStr = `${endDay}/${endMonth}/${expireDate.getFullYear()}`;

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
          startDate: startDateStr,
          endDate: endDateStr,
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

  @Post('bulk-restore')
  async bulkRestoreInvoices(@Body() body: { ids: string[] }) {
    return this.invoicesService.restoreManyInvoices(body.ids || []);
  }

  @Post('bulk-permanent-delete')
  async bulkPermanentDeleteInvoices(@Body() body: { ids: string[] }) {
    return this.invoicesService.permanentDeleteManyInvoices(body.ids || []);
  }

  @Post('empty-trash')
  async emptyTrash() {
    return this.invoicesService.emptyTrash();
  }

  @Post('bulk-delete')
  async bulkDeleteInvoices(@Body() body: { ids: string[] }) {
    return this.invoicesService.deleteManyInvoices(body.ids || []);
  }

  @Post(':id/restore')
  async restoreInvoice(@Param('id') id: string) {
    return this.invoicesService.restoreInvoice(id);
  }

  @Delete(':id/permanent')
  async permanentDeleteInvoice(@Param('id') id: string) {
    return this.invoicesService.permanentDeleteInvoice(id);
  }

  @Delete(':id')
  async deleteInvoice(@Param('id') id: string) {
    return this.invoicesService.deleteInvoice(id);
  }
}
