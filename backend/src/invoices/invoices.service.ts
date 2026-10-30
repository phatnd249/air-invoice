import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { ServicesCatalogService } from '../services-catalog/services-catalog.service';
import * as crypto from 'crypto';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly servicesCatalogService: ServicesCatalogService,
  ) {}

  // Sinh mã token chia sẻ ngẫu nhiên an toàn chuẩn mã hóa (32 ký tự hex)
  private generateShareToken(): string {
    return crypto.randomBytes(16).toString('hex');
  }

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

  async getInvoices(status?: string, search?: string, invoiceType?: string, invoiceForm?: string, trash?: boolean | string) {
    const where: any = {};
    if (trash === true || trash === 'true') {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    if (status && status !== 'ALL' && status !== 'TRASH') {
      where.status = status;
    }
    if (invoiceType && invoiceType !== 'ALL') {
      where.invoiceType = invoiceType;
    }
    if (invoiceForm && invoiceForm !== 'ALL') {
      where.invoiceForm = invoiceForm;
    }
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { buyerName: { contains: search, mode: 'insensitive' } },
        { buyerCompany: { contains: search, mode: 'insensitive' } },
        { buyerEmail: { contains: search, mode: 'insensitive' } },
        { buyerPhone: { contains: search } },
      ];
    }

    return this.prisma.invoice.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  normalizePhone(phone?: string): string[] {
    if (!phone) return [];
    const clean = phone.toString().replace(/\D/g, ''); // Giữ lại chỉ các chữ số
    const variants = new Set<string>();
    const trimmed = phone.toString().trim();
    if (trimmed) variants.add(trimmed);
    if (clean) {
      variants.add(clean);
      if (clean.startsWith('84') && clean.length >= 10) {
        variants.add('0' + clean.substring(2));
        variants.add('+' + clean);
      } else if (clean.startsWith('0') && clean.length >= 10) {
        variants.add('+84' + clean.substring(1));
        variants.add('84' + clean.substring(1));
      }
    }
    return Array.from(variants);
  }

  async findExistingInvoice(buyerEmail?: string, buyerPhone?: string) {
    const searchConditions: any[] = [];
    if (buyerEmail && buyerEmail.toString().trim()) {
      searchConditions.push({ buyerEmail: { equals: buyerEmail.toString().trim(), mode: 'insensitive' } });
    }
    if (buyerPhone && buyerPhone.toString().trim()) {
      const phoneVariants = this.normalizePhone(buyerPhone);
      if (phoneVariants.length > 0) {
        searchConditions.push({ buyerPhone: { in: phoneVariants } });
      }
    }

    if (searchConditions.length === 0) return null;

    return this.prisma.invoice.findFirst({
      where: {
        AND: [
          { OR: searchConditions },
          { status: { notIn: ['CANCELLED'] } },
          { deletedAt: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: { items: { orderBy: { sortOrder: 'asc' } }, histories: { orderBy: { createdAt: 'desc' } } },
    });
  }

  async getInvoiceById(id: string) {
    return this.prisma.invoice.findFirst({
      where: {
        OR: [
          { id },
          { invoiceNumber: id },
          { paymentCode: id },
        ],
      },
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
    // 0. Kiểm tra chống tạo trùng lặp hóa đơn cho cùng một khách hàng (nếu không forceNew)
    if (!dto.forceNew && (dto.buyerEmail || dto.buyerPhone)) {
      const existing = await this.findExistingInvoice(dto.buyerEmail, dto.buyerPhone);
      if (existing) {
        return existing;
      }
    }

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
        invoiceType: dto.invoiceType || 'GTGT',
        invoiceForm: dto.invoiceForm || 'WITH_TAX_CODE',
        paymentCode,
        status: dto.status || 'ISSUED',
        templateId: dto.templateId || 'standard-classic',
        issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        sellerName: dto.sellerName || settings?.companyName,
        sellerTaxCode: dto.sellerTaxCode !== undefined ? dto.sellerTaxCode : settings?.taxCode,
        sellerAddress: dto.sellerAddress !== undefined ? dto.sellerAddress : settings?.address,
        sellerPhone: dto.sellerPhone !== undefined ? dto.sellerPhone : settings?.phone,
        sellerEmail: dto.sellerEmail !== undefined ? dto.sellerEmail : settings?.email,
        sellerLogoUrl: dto.sellerLogoUrl !== undefined ? dto.sellerLogoUrl : settings?.logoUrl,
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
        shareToken: this.generateShareToken(),
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
    if (dto.invoiceType && dto.invoiceType !== existing.invoiceType) changes.push(`Đổi loại HĐ: "${existing.invoiceType}" → "${dto.invoiceType}"`);
    if (dto.invoiceForm && dto.invoiceForm !== existing.invoiceForm) changes.push(`Đổi hình thức: "${existing.invoiceForm}" → "${dto.invoiceForm}"`);
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
        invoiceType: dto.invoiceType !== undefined ? dto.invoiceType : existing.invoiceType,
        invoiceForm: dto.invoiceForm !== undefined ? dto.invoiceForm : existing.invoiceForm,
        templateId: dto.templateId !== undefined ? dto.templateId : existing.templateId,
        sellerName: dto.sellerName !== undefined ? dto.sellerName : (existing as any).sellerName,
        sellerTaxCode: dto.sellerTaxCode !== undefined ? dto.sellerTaxCode : (existing as any).sellerTaxCode,
        sellerAddress: dto.sellerAddress !== undefined ? dto.sellerAddress : (existing as any).sellerAddress,
        sellerPhone: dto.sellerPhone !== undefined ? dto.sellerPhone : (existing as any).sellerPhone,
        sellerEmail: dto.sellerEmail !== undefined ? dto.sellerEmail : (existing as any).sellerEmail,
        sellerLogoUrl: dto.sellerLogoUrl !== undefined ? dto.sellerLogoUrl : (existing as any).sellerLogoUrl,
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
        invoiceType: existing.invoiceType || 'GTGT',
        invoiceForm: existing.invoiceForm || 'WITH_TAX_CODE',
        paymentCode,
        status: 'ISSUED',
        templateId: existing.templateId || 'standard-classic',
        issueDate: new Date(),
        dueDate: existing.dueDate,
        sellerName: (existing as any).sellerName,
        sellerTaxCode: (existing as any).sellerTaxCode,
        sellerAddress: (existing as any).sellerAddress,
        sellerPhone: (existing as any).sellerPhone,
        sellerEmail: (existing as any).sellerEmail,
        sellerLogoUrl: (existing as any).sellerLogoUrl,
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
        shareToken: this.generateShareToken(),
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
    const existing = await this.prisma.invoice.findFirst({
      where: {
        OR: [
          { id },
          { invoiceNumber: id },
          { paymentCode: id },
        ],
      },
      include: { items: true, histories: { orderBy: { createdAt: 'desc' } } },
    });
    if (!existing) throw new Error('Hóa đơn không tồn tại');

    // Nếu hóa đơn đã ở trạng thái PAID: cập nhật ghi chú bổ sung (nếu có) và trả về hóa đơn hiện tại (idempotent)
    if (existing.status === 'PAID') {
      if (note && note !== existing.notes) {
        return this.prisma.invoice.update({
          where: { id: existing.id },
          data: {
            notes: note,
            histories: {
              create: {
                action: 'PAID',
                note: `Cập nhật ghi chú xác nhận thanh toán: ${note}`,
              },
            },
          },
          include: { items: true, histories: { orderBy: { createdAt: 'desc' } } },
        });
      }
      return existing;
    }

    return this.prisma.invoice.update({
      where: { id: existing.id },
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
    const existing = await this.prisma.invoice.findFirst({
      where: {
        OR: [
          { id },
          { invoiceNumber: id },
          { paymentCode: id },
        ],
      },
    });
    if (!existing) throw new Error('Hóa đơn không tồn tại');
    if (existing.status === 'CANCELLED') throw new Error('Hóa đơn này đã bị hủy trước đó');

    return this.prisma.invoice.update({
      where: { id: existing.id },
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


  /**
   * Lưu 1 dòng dịch vụ hoặc toàn bộ dịch vụ từ hóa đơn vào danh mục hệ thống
   */
  async saveInvoiceItemsToCatalog(invoiceId: string, itemId?: string, groupId?: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    });
    if (!invoice) throw new Error('Hóa đơn không tồn tại');

    const itemsToSave = itemId
      ? invoice.items.filter((it: any) => it.id === itemId)
      : invoice.items;

    const results = [];
    for (const it of itemsToSave) {
      const res = await this.servicesCatalogService.findOrCreateService({
        name: it.name,
        description: it.description || undefined,
        metaInfo: it.metaInfo || undefined,
        unit: it.unit || 'gói',
        unitPrice: it.unitPrice || 0,
        groupId,
      });
      results.push(res);
    }
    return results;
  }

  async deleteInvoice(id: string) {
    const existing = await this.prisma.invoice.findFirst({
      where: { OR: [{ id }, { invoiceNumber: id }] },
    });
    if (!existing) throw new Error('Hóa đơn không tồn tại');

    return this.prisma.invoice.update({
      where: { id: existing.id },
      data: {
        deletedAt: new Date(),
        histories: {
          create: {
            action: 'CANCELLED',
            note: `Chuyển hóa đơn ${existing.invoiceNumber} vào Thùng rác`,
          },
        },
      },
      include: { items: true },
    });
  }

  async deleteManyInvoices(ids: string[]) {
    if (!ids || ids.length === 0) return { count: 0 };
    return this.prisma.invoice.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() },
    });
  }

  async restoreInvoice(id: string) {
    const existing = await this.prisma.invoice.findFirst({
      where: { OR: [{ id }, { invoiceNumber: id }] },
    });
    if (!existing) throw new Error('Hóa đơn không tồn tại trong Thùng rác');

    return this.prisma.invoice.update({
      where: { id: existing.id },
      data: {
        deletedAt: null,
        histories: {
          create: {
            action: 'UPDATED',
            note: `Khôi phục hóa đơn ${existing.invoiceNumber} từ Thùng rác`,
          },
        },
      },
      include: { items: true },
    });
  }

  async restoreManyInvoices(ids: string[]) {
    if (!ids || ids.length === 0) return { count: 0 };
    return this.prisma.invoice.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: null },
    });
  }

  async permanentDeleteInvoice(id: string) {
    const existing = await this.prisma.invoice.findFirst({
      where: { OR: [{ id }, { invoiceNumber: id }] },
    });
    if (!existing) throw new Error('Hóa đơn không tồn tại');
    return this.prisma.invoice.delete({ where: { id: existing.id } });
  }

  async permanentDeleteManyInvoices(ids: string[]) {
    if (!ids || ids.length === 0) return { count: 0 };
    return this.prisma.invoice.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async emptyTrash() {
    return this.prisma.invoice.deleteMany({
      where: { deletedAt: { not: null } },
    });
  }

  async getBackupData() {
    const invoices = await this.prisma.invoice.findMany({
      include: { items: true, histories: true },
      orderBy: { createdAt: 'desc' },
    });
    return {
      exportedAt: new Date().toISOString(),
      totalCount: invoices.length,
      invoices,
    };
  }
}
