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
    const otherFee = Number(dto.otherFee) || 0;
    const grandTotal = subTotal + vatAmount + otherFee;

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
        status: dto.status || 'ISSUED',
        templateId: dto.templateId || 'standard-classic',
        issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        buyerName: dto.buyerName,
        buyerCompany: dto.buyerCompany,
        buyerTaxCode: dto.buyerTaxCode,
        buyerAddress: dto.buyerAddress,
        buyerEmail: dto.buyerEmail,
        buyerPhone: dto.buyerPhone,
        notes: dto.notes,
        terms: dto.terms,
        hasVat,
        vatRate,
        otherFee,
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

    const hasVat = dto.hasVat !== undefined ? dto.hasVat : existing.hasVat;
    const vatRate = dto.vatRate !== undefined ? Number(dto.vatRate) : existing.vatRate;
    const otherFee = dto.otherFee !== undefined ? Number(dto.otherFee) : (existing.otherFee || 0);

    let subTotal = existing.subTotal;
    let itemsUpdate: any = undefined;
    let processedItemsCount = existing.items.length;

    // Chỉ cập nhật và xóa/tạo lại items nếu client truyền mảng items mới lên
    if (dto.items !== undefined && Array.isArray(dto.items)) {
      await this.prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
      subTotal = 0;
      const processedItems = dto.items.map((item: any, idx: number) => {
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
      itemsUpdate = { create: processedItems };
      processedItemsCount = processedItems.length;
    }

    const vatAmount = hasVat ? (subTotal * vatRate) / 100 : 0;
    const grandTotal = subTotal + vatAmount + otherFee;

    // Ghi nhận chi tiết các thay đổi cho lịch sử
    const changes: string[] = [];
    if (dto.templateId && dto.templateId !== existing.templateId) changes.push(`Đổi mẫu template: "${existing.templateId}" → "${dto.templateId}"`);
    if (dto.buyerName && dto.buyerName !== existing.buyerName) changes.push(`Tên KH: "${existing.buyerName}" → "${dto.buyerName}"`);
    if (dto.buyerEmail && dto.buyerEmail !== existing.buyerEmail) changes.push(`Email: "${existing.buyerEmail || '(trống)'}" → "${dto.buyerEmail}"`);
    if (dto.buyerCompany && dto.buyerCompany !== existing.buyerCompany) changes.push(`Công ty: "${existing.buyerCompany || '(trống)'}" → "${dto.buyerCompany}"`);
    if (grandTotal !== existing.grandTotal) changes.push(`Tổng tiền: ${existing.grandTotal.toLocaleString('vi-VN')}₫ → ${grandTotal.toLocaleString('vi-VN')}₫`);
    if (dto.items !== undefined) changes.push(`Cập nhật ${processedItemsCount} dòng dịch vụ/hàng hóa`);
    const historyNote = changes.length > 0 ? changes.join(' | ') : 'Cập nhật nội dung hóa đơn';

    return this.prisma.invoice.update({
      where: { id },
      data: {
        templateId: dto.templateId !== undefined ? dto.templateId : existing.templateId,
        buyerName: dto.buyerName !== undefined ? dto.buyerName : existing.buyerName,
        buyerCompany: dto.buyerCompany !== undefined ? dto.buyerCompany : existing.buyerCompany,
        buyerTaxCode: dto.buyerTaxCode !== undefined ? dto.buyerTaxCode : existing.buyerTaxCode,
        buyerAddress: dto.buyerAddress !== undefined ? dto.buyerAddress : existing.buyerAddress,
        buyerEmail: dto.buyerEmail !== undefined ? dto.buyerEmail : existing.buyerEmail,
        buyerPhone: dto.buyerPhone !== undefined ? dto.buyerPhone : existing.buyerPhone,
        notes: dto.notes !== undefined ? dto.notes : existing.notes,
        terms: dto.terms !== undefined ? dto.terms : existing.terms,
        status: dto.status !== undefined ? dto.status : existing.status,
        hasVat,
        vatRate,
        otherFee,
        subTotal,
        vatAmount,
        grandTotal,
        ...(itemsUpdate ? { items: itemsUpdate } : {}),
        histories: {
          create: {
            action: 'UPDATED',
            note: historyNote,
          },
        },
      },
      include: { items: true },
    });
  }

  async cloneInvoice(id: string) {
    const existing = await this.prisma.invoice.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!existing) throw new Error('Hóa đơn nguồn không tồn tại');

    const nextInvoiceNumber = await this.getNextInvoiceNumber();
    const paymentCode = this.generatePaymentCode();
    const settings = await this.settingsService.getSettings();

    let qrDataUrl = '';
    if (settings?.bankCode && settings?.bankAccount) {
      const serviceName = existing.items[0]?.name || 'Dich vu';
      const desc = `${paymentCode} - ${serviceName}`;
      qrDataUrl = this.generateVietQrUrl(settings.bankCode, settings.bankAccount, existing.grandTotal, desc);
    }

    const cloned = await this.prisma.invoice.create({
      data: {
        invoiceNumber: nextInvoiceNumber,
        paymentCode,
        status: 'ISSUED',
        templateId: existing.templateId || 'standard-classic',
        issueDate: new Date(),
        dueDate: existing.dueDate,
        buyerName: existing.buyerName,
        buyerCompany: existing.buyerCompany,
        buyerTaxCode: existing.buyerTaxCode,
        buyerAddress: existing.buyerAddress,
        buyerEmail: existing.buyerEmail,
        buyerPhone: existing.buyerPhone,
        hasVat: existing.hasVat,
        vatRate: existing.vatRate,
        subTotal: existing.subTotal,
        vatAmount: existing.vatAmount,
        grandTotal: existing.grandTotal,
        qrDataUrl,
        shareToken: Math.random().toString(36).substring(2) + Date.now().toString(36),
        items: {
          create: existing.items.map((it, idx) => ({
            sortOrder: idx,
            name: it.name,
            description: it.description,
            metaInfo: it.metaInfo,
            unit: it.unit,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            amount: it.amount,
          })),
        },
        histories: {
          create: {
            action: 'CREATED',
            note: `Sao chép từ hóa đơn cũ ${existing.invoiceNumber}`,
          },
        },
      },
      include: { items: true },
    });

    if (settings) {
      await this.prisma.setting.update({
        where: { id: 'default' },
        data: { nextInvoiceNumber: (settings.nextInvoiceNumber || 1) + 1 },
      });
    }

    return cloned;
  }

  async issueInvoice(id: string) {
    const existing = await this.prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw new Error('Hóa đơn không tồn tại');

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: 'ISSUED',
        histories: {
          create: {
            action: 'ISSUED',
            note: `Xác nhận phát hành hóa đơn ${existing.invoiceNumber}`,
          },
        },
      },
      include: { items: true, histories: { orderBy: { createdAt: 'desc' } } },
    });
  }

  async payInvoice(id: string, note?: string) {
    const existing = await this.prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw new Error('Hóa đơn không tồn tại');
    if (existing.status === 'PAID') throw new Error('Hóa đơn này đã được xác nhận thanh toán trước đó');

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: 'PAID',
        histories: {
          create: {
            action: 'PAID',
            note: note || `Xác nhận thanh toán hóa đơn ${existing.invoiceNumber} (${existing.grandTotal.toLocaleString('vi-VN')}₫)`,
          },
        },
      },
      include: { items: true, histories: { orderBy: { createdAt: 'desc' } } },
    });
  }

  async cancelInvoice(id: string) {
    const existing = await this.prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw new Error('Hóa đơn không tồn tại');
    if (existing.status === 'CANCELLED') throw new Error('Hóa đơn này đã bị hủy trước đó');

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        histories: {
          create: {
            action: 'CANCELLED',
            note: `Hủy hóa đơn ${existing.invoiceNumber} (trạng thái trước: ${existing.status})`,
          },
        },
      },
      include: { items: true, histories: { orderBy: { createdAt: 'desc' } } },
    });
  }

  async getInvoiceHistory(id: string) {
    return this.prisma.invoiceHistory.findMany({
      where: { invoiceId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllHistories(action?: string, search?: string) {
    const where: any = {};
    if (action && action !== 'ALL') {
      where.action = action;
    }
    if (search) {
      where.OR = [
        { note: { contains: search } },
        { invoice: { invoiceNumber: { contains: search } } },
        { invoice: { buyerName: { contains: search } } },
        { invoice: { buyerCompany: { contains: search } } },
      ];
    }

    return this.prisma.invoiceHistory.findMany({
      where,
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            buyerName: true,
            buyerCompany: true,
            grandTotal: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async deleteInvoice(id: string) {
    return this.prisma.invoice.delete({ where: { id } });
  }
}
