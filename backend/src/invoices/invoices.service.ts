import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  // Hàm sinh mã ngẫu nhiên 6 ký tự như Google Apps Script
  private generatePaymentCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Hàm sinh URL VietQR tự động
  private generateVietQrUrl(bankCode: string, account: string, amount: number, desc: string): string {
    const sanitizedAmount = Math.round(amount);
    const encodedDesc = encodeURIComponent(desc);
    return `https://qr.sepay.vn/img?bank=${bankCode}&acc=${account}&template=compact&amount=${sanitizedAmount}&des=${encodedDesc}`;
  }

  async getInvoices(status?: string, search?: string) {
    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { buyerName: { contains: search } },
        { buyerCompany: { contains: search } },
      ];
    }

    return this.prisma.invoice.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInvoiceById(id: string) {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: 'asc' } }, histories: { orderBy: { createdAt: 'desc' } } },
    });
  }

  async getNextInvoiceNumber(): Promise<string> {
    const settings = await this.settingsService.getSettings();
    const prefix = settings?.invoicePrefix || 'HD';
    const nextNum = settings?.nextInvoiceNumber || 1;
    const padded = String(nextNum).padStart(settings?.invoiceNumberLength || 6, '0');
    return `${prefix}-${padded}`;
  }

  async createInvoice(dto: any) {
    const settings = await this.settingsService.getSettings();
    const paymentCode = this.generatePaymentCode();
    
    // Tính toán subtotal, VAT, Grand total
    const items = dto.items || [];
    let subTotal = 0;
    const processedItems = items.map((item: any, idx: number) => {
      const quantity = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const amount = quantity * unitPrice;
      subTotal += amount;
      return {
        sortOrder: idx,
        name: item.name || 'Dịch vụ',
        description: item.description,
        metaInfo: item.metaInfo,
        unit: item.unit || 'dịch vụ',
        quantity,
        unitPrice,
        amount,
      };
    });

    const hasVat = dto.hasVat !== false;
    const vatRate = dto.vatRate !== undefined ? Number(dto.vatRate) : (settings?.defaultVatRate || 10);
    const vatAmount = hasVat ? (subTotal * vatRate) / 100 : 0;
    const grandTotal = subTotal + vatAmount;

    // Sinh QR SePay nếu có thông tin ngân hàng
    let qrDataUrl = '';
    if (settings?.bankCode && settings?.bankAccount) {
      const serviceName = processedItems[0]?.name || 'Dich vu';
      const desc = `${paymentCode} - ${serviceName}`;
      qrDataUrl = this.generateVietQrUrl(settings.bankCode, settings.bankAccount, grandTotal, desc);
    }

    const invoiceNumber = dto.invoiceNumber || (await this.getNextInvoiceNumber());

    const created = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        paymentCode,
        status: dto.status || 'DRAFT',
        issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        buyerName: dto.buyerName,
        buyerCompany: dto.buyerCompany,
        buyerTaxCode: dto.buyerTaxCode,
        buyerAddress: dto.buyerAddress,
        buyerEmail: dto.buyerEmail,
        buyerPhone: dto.buyerPhone,
        hasVat,
        vatRate,
        subTotal,
        vatAmount,
        grandTotal,
        qrDataUrl,
        shareToken: Math.random().toString(36).substring(2) + Date.now().toString(36),
        items: {
          create: processedItems,
        },
        histories: {
          create: {
            action: 'CREATED',
            note: 'Khởi tạo hóa đơn',
          },
        },
      },
      include: { items: true },
    });

    // Tăng số hóa đơn tiếp theo
    if (settings) {
      await this.prisma.setting.update({
        where: { id: 'default' },
        data: { nextInvoiceNumber: (settings.nextInvoiceNumber || 1) + 1 },
      });
    }

    return created;
  }

  async updateInvoice(id: string, dto: any) {
    const existing = await this.prisma.invoice.findUnique({ where: { id }, include: { items: true } });
    if (!existing) throw new Error('Hóa đơn không tồn tại');

    // Cập nhật lại các dòng items nếu có
    if (dto.items) {
      await this.prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
    }

    const items = dto.items || existing.items;
    let subTotal = 0;
    const processedItems = items.map((item: any, idx: number) => {
      const quantity = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const amount = quantity * unitPrice;
      subTotal += amount;
      return {
        sortOrder: idx,
        name: item.name || 'Dịch vụ',
        description: item.description,
        metaInfo: item.metaInfo,
        unit: item.unit || 'dịch vụ',
        quantity,
        unitPrice,
        amount,
      };
    });

    const hasVat = dto.hasVat !== undefined ? dto.hasVat : existing.hasVat;
    const vatRate = dto.vatRate !== undefined ? Number(dto.vatRate) : existing.vatRate;
    const vatAmount = hasVat ? (subTotal * vatRate) / 100 : 0;
    const grandTotal = subTotal + vatAmount;

    return this.prisma.invoice.update({
      where: { id },
      data: {
        buyerName: dto.buyerName,
        buyerCompany: dto.buyerCompany,
        buyerTaxCode: dto.buyerTaxCode,
        buyerAddress: dto.buyerAddress,
        buyerEmail: dto.buyerEmail,
        buyerPhone: dto.buyerPhone,
        status: dto.status,
        hasVat,
        vatRate,
        subTotal,
        vatAmount,
        grandTotal,
        items: {
          create: processedItems,
        },
        histories: {
          create: {
            action: 'UPDATED',
            note: 'Cập nhật nội dung hóa đơn',
          },
        },
      },
      include: { items: true },
    });
  }

  async deleteInvoice(id: string) {
    return this.prisma.invoice.delete({ where: { id } });
  }
}
