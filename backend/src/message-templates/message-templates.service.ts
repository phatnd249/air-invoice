import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AttachmentFile {
  id?: string;
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export interface MessageTemplateDto {
  name: string;
  channel: 'ZALO' | 'EMAIL';
  triggerType?: 'INVOICE_CREATED' | 'PAYMENT_SUCCESS' | 'SUBSCRIPTION_ALERT' | 'CUSTOM';
  subject?: string;
  content: string;
  serviceIds?: string[] | string;
  attachments?: AttachmentFile[] | string;
  isDefault?: boolean;
  isActive?: boolean;
}

@Injectable()
export class MessageTemplatesService implements OnModuleInit {
  private readonly logger = new Logger(MessageTemplatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      const count = await this.prisma.messageTemplate.count();
      if (count === 0) {
        this.logger.log('Khởi tạo các mẫu tin nhắn Zalo & Email mặc định...');

        // 1. Mẫu Zalo gửi hóa đơn mặc định
        await this.prisma.messageTemplate.create({
          data: {
            name: 'Mẫu Zalo Thông Báo Hóa Đơn (Mặc Định)',
            channel: 'ZALO',
            triggerType: 'INVOICE_CREATED',
            content:
              `🔔 [Invoice-AIR] Thông báo hóa đơn dịch vụ\n` +
              `Kính chào Anh/Chị {{customerName}},\n` +
              `Hóa đơn điện tử của Quý khách cho gói {{packageName}} đã được khởi tạo thành công:\n` +
              `• Mã hóa đơn: #{{invoiceNumber}}\n` +
              `• Tổng tiền: {{grandTotal}}\n` +
              `• Hạn thanh toán: {{dueDate}}\n` +
              `👉 Xem chi tiết & Quét mã VietQR: {{viewUrl}}\n\n` +
              `Cảm ơn Quý khách đã tin tưởng và sử dụng dịch vụ!`,
            isDefault: true,
            isActive: true,
          },
        });

        // 2. Mẫu Zalo xác nhận thanh toán mặc định
        await this.prisma.messageTemplate.create({
          data: {
            name: 'Mẫu Zalo Xác Nhận Thanh Toán Thành Công (Mặc Định)',
            channel: 'ZALO',
            triggerType: 'PAYMENT_SUCCESS',
            content:
              `🎉 [{{brandName}}] XÁC NHẬN THANH TOÁN THÀNH CÔNG!\n` +
              `Kính chào Anh/Chị {{customerName}},\n` +
              `Hệ thống đã nhận được khoản thanh toán cho đơn hàng của Quý khách:\n` +
              `• Dịch vụ: {{packageName}}\n` +
              `• Mã hóa đơn: #{{invoiceNumber}}\n` +
              `• Số tiền: {{grandTotal}}\n` +
              `• Trạng thái: ✅ ĐÃ HOÀN TẤT THANH TOÁN\n` +
              `👉 Xem & Tải biên lai điện tử: {{viewUrl}}\n\n` +
              `✨ Gói dịch vụ của Quý khách đã được kích hoạt thành công. Cảm ơn Quý khách đã tin tưởng và đồng hành cùng {{brandName}}!`,
            isDefault: true,
            isActive: true,
          },
        });

        // 3. Mẫu Email gửi hóa đơn mặc định
        await this.prisma.messageTemplate.create({
          data: {
            name: 'Mẫu Email Thông Báo Hóa Đơn & Đăng Ký (Mặc Định)',
            channel: 'EMAIL',
            triggerType: 'INVOICE_CREATED',
            subject: '[{{brandName}}] Xác nhận đăng ký {{packageName}} & Hóa đơn thanh toán - #{{invoiceNumber}}',
            content: `
              <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #2c3e50; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">XÁC NHẬN ĐĂNG KÝ GÓI DỊCH VỤ & THÔNG BÁO HÓA ĐƠN</h2>
                <p>Kính gửi Quý khách hàng <strong>{{customerName}}</strong>,</p>
                <p>Lời đầu tiên, <strong>{{brandName}}</strong> xin chân thành cảm ơn Quý khách đã tin tưởng và đăng ký sử dụng dịch vụ của chúng tôi.</p>
                <p>Hệ thống đã khởi tạo hóa đơn thanh toán cho gói dịch vụ của Quý khách với thông tin chi tiết dưới đây:</p>
                <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 15px 0; border-radius: 4px;">
                  <p style="margin: 4px 0;"><strong>• Gói dịch vụ:</strong> {{packageName}}</p>
                  <p style="margin: 4px 0;"><strong>• Số tiền thanh toán:</strong> <span style="color: #dc2626; font-size: 16px; font-weight: bold;">{{grandTotal}}</span></p>
                  <p style="margin: 4px 0;"><strong>• Hạn thanh toán:</strong> {{dueDate}}</p>
                </div>
                <h4 style="color: #2c3e50; margin-top: 20px; margin-bottom: 8px;">Hướng dẫn thanh toán & Kích hoạt dịch vụ:</h4>
                <p>Quý khách vui lòng kiểm tra chi tiết hóa đơn (kèm file PDF đính kèm trong email này) và thực hiện thanh toán nhanh bằng cách truy cập đường dẫn dưới đây:</p>
                <div style="text-align: center; margin: 25px 0;">
                  <a href="{{viewUrl}}" target="_blank" style="background: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">
                    🔗 Xem Hóa Đơn & Quét Mã VietQR Thanh Toán
                  </a>
                </div>
                <p style="font-size: 13px; color: #666; font-style: italic;">
                  (Lưu ý: Quý khách vui lòng kiểm tra thông tin tài khoản và cú pháp chuyển khoản <strong>{{paymentCode}}</strong> để hệ thống tự động kích hoạt dịch vụ ngay sau khi nhận tiền).
                </p>
                <p style="margin-top: 20px;">Nếu Quý khách cần hỗ trợ kích hoạt khẩn cấp, vui lòng liên hệ:</p>
                <p style="margin: 4px 0;">💬 <strong>Hotline / Zalo:</strong> {{phone}}</p>
                <p style="margin-top: 25px; border-top: 1px solid #eee; padding-top: 15px;">
                  Trân trọng,<br />
                  <strong>Đội ngũ Chăm sóc khách hàng {{brandName}}</strong>
                </p>
              </div>
            `.trim(),
            isDefault: true,
            isActive: true,
          },
        });

        // 4. Mẫu Email thanh toán thành công
        await this.prisma.messageTemplate.create({
          data: {
            name: 'Mẫu Email Xác Nhận Thanh Toán Thành Công (Mặc Định)',
            channel: 'EMAIL',
            triggerType: 'PAYMENT_SUCCESS',
            subject: '🎉 [{{brandName}}] Xác nhận thanh toán thành công & Biên lai dịch vụ - #{{invoiceNumber}}',
            content: `
              <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #059669; border-bottom: 2px solid #10b981; padding-bottom: 10px;">XÁC NHẬN THANH TOÁN THÀNH CÔNG & KÍCH HOẠT DỊCH VỤ</h2>
                <p>Kính gửi Quý khách hàng <strong>{{customerName}}</strong>,</p>
                <p>Hệ thống của <strong>{{brandName}}</strong> đã nhận được khoản thanh toán của Quý khách cho hóa đơn <strong>#{{invoiceNumber}}</strong>.</p>
                <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 12px 16px; margin: 15px 0; border-radius: 4px;">
                  <p style="margin: 4px 0;"><strong>• Gói dịch vụ:</strong> {{packageName}}</p>
                  <p style="margin: 4px 0;"><strong>• Số tiền đã thanh toán:</strong> <span style="color: #059669; font-size: 16px; font-weight: bold;">{{grandTotal}}</span></p>
                  <p style="margin: 4px 0;"><strong>• Trạng thái:</strong> ✅ ĐÃ HOÀN TẤT THANH TOÁN</p>
                </div>
                <div style="text-align: center; margin: 25px 0;">
                  <a href="{{viewUrl}}" target="_blank" style="background: #059669; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">
                    📄 Xem & Tải Biên Lai Điện Tử
                  </a>
                </div>
                <p>Biên lai chi tiết định dạng PDF đã được đính kèm trực tiếp trong email này.</p>
                <p style="margin-top: 25px; border-top: 1px solid #eee; padding-top: 15px;">
                  Trân trọng cảm ơn Quý khách,<br />
                  <strong>Ban Quản Trị {{brandName}}</strong>
                </p>
              </div>
            `.trim(),
            isDefault: true,
            isActive: true,
          },
        });
      }
    } catch (e: any) {
      this.logger.warn(`Lỗi khi khởi tạo mẫu tin nhắn mặc định: ${e.message}`);
    }
  }

  // ================= CRUD MẪU TIN NHẮN =================

  async getAllTemplates(channel?: 'ZALO' | 'EMAIL', triggerType?: string) {
    const where: any = {};
    if (channel) where.channel = channel;
    if (triggerType) where.triggerType = triggerType;

    const templates = await this.prisma.messageTemplate.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return templates.map((t) => this.formatTemplateOutput(t));
  }

  async getTemplateById(id: string) {
    const t = await this.prisma.messageTemplate.findUnique({ where: { id } });
    if (!t) return null;
    return this.formatTemplateOutput(t);
  }

  async createTemplate(dto: MessageTemplateDto) {
    const serviceIdsJson = Array.isArray(dto.serviceIds)
      ? JSON.stringify(dto.serviceIds)
      : dto.serviceIds || null;

    const attachmentsJson = Array.isArray(dto.attachments)
      ? JSON.stringify(dto.attachments)
      : dto.attachments || null;

    // Nếu đặt làm default, bỏ default các mẫu cùng channel & triggerType
    if (dto.isDefault) {
      await this.prisma.messageTemplate.updateMany({
        where: {
          channel: dto.channel,
          triggerType: dto.triggerType || 'INVOICE_CREATED',
        },
        data: { isDefault: false },
      });
    }

    const created = await this.prisma.messageTemplate.create({
      data: {
        name: dto.name,
        channel: dto.channel,
        triggerType: dto.triggerType || 'INVOICE_CREATED',
        subject: dto.subject,
        content: dto.content,
        serviceIds: serviceIdsJson,
        attachments: attachmentsJson,
        isDefault: dto.isDefault ?? false,
        isActive: dto.isActive ?? true,
      },
    });

    return this.formatTemplateOutput(created);
  }

  async updateTemplate(id: string, dto: Partial<MessageTemplateDto>) {
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.channel !== undefined) data.channel = dto.channel;
    if (dto.triggerType !== undefined) data.triggerType = dto.triggerType;
    if (dto.subject !== undefined) data.subject = dto.subject;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    if (dto.serviceIds !== undefined) {
      data.serviceIds = Array.isArray(dto.serviceIds)
        ? JSON.stringify(dto.serviceIds)
        : dto.serviceIds;
    }

    if (dto.attachments !== undefined) {
      data.attachments = Array.isArray(dto.attachments)
        ? JSON.stringify(dto.attachments)
        : dto.attachments;
    }

    if (dto.isDefault) {
      const current = await this.prisma.messageTemplate.findUnique({ where: { id } });
      const channel = dto.channel || current?.channel;
      const trigger = dto.triggerType || current?.triggerType;
      if (channel && trigger) {
        await this.prisma.messageTemplate.updateMany({
          where: { channel, triggerType: trigger, id: { not: id } },
          data: { isDefault: false },
        });
      }
      data.isDefault = true;
    } else if (dto.isDefault !== undefined) {
      data.isDefault = dto.isDefault;
    }

    const updated = await this.prisma.messageTemplate.update({
      where: { id },
      data,
    });

    return this.formatTemplateOutput(updated);
  }

  async deleteTemplate(id: string) {
    return this.prisma.messageTemplate.delete({ where: { id } });
  }

  // ================= TÌM KIẾM MẪU KHỚP VỚI GÓI DỊCH VỤ =================

  /**
   * Tìm mẫu tin nhắn phù hợp nhất cho kênh, sự kiện và gói dịch vụ cụ thể
   */
  async findMatchingTemplate(
    channel: 'ZALO' | 'EMAIL',
    triggerType: 'INVOICE_CREATED' | 'PAYMENT_SUCCESS' | 'SUBSCRIPTION_ALERT' | 'CUSTOM' = 'INVOICE_CREATED',
    serviceIds: string[] = [],
    packageNames: string[] = [],
  ): Promise<any> {
    const templates = await this.prisma.messageTemplate.findMany({
      where: {
        channel,
        triggerType,
        isActive: true,
      },
      orderBy: [{ isDefault: 'asc' }, { createdAt: 'desc' }], // Các mẫu chỉ định gói ưu tiên trước mẫu default
    });

    if (templates.length === 0) return null;

    // 1. Tìm mẫu có gán cụ thể serviceId hoặc tên gói
    for (const t of templates) {
      if (!t.serviceIds) continue;
      try {
        const assignedIds: string[] = JSON.parse(t.serviceIds);
        if (Array.isArray(assignedIds) && assignedIds.length > 0) {
          // Kiểm tra xem có serviceId nào của hóa đơn nằm trong danh sách gán không
          const hasMatch = serviceIds.some((id) => assignedIds.includes(id));
          if (hasMatch) {
            return this.formatTemplateOutput(t);
          }
          // Hoặc kiểm tra qua tên gói
          const hasNameMatch = packageNames.some((name) =>
            assignedIds.some((aid) => aid.toLowerCase() === name.toLowerCase()),
          );
          if (hasNameMatch) {
            return this.formatTemplateOutput(t);
          }
        }
      } catch {
        // Bỏ qua lỗi parse JSON
      }
    }

    // 2. Nếu không có mẫu gán riêng cho gói, lấy mẫu được đánh dấu `isDefault: true`
    const defaultTemplate = templates.find((t) => t.isDefault);
    if (defaultTemplate) {
      return this.formatTemplateOutput(defaultTemplate);
    }

    // 3. Nếu không có mẫu default, lấy mẫu đầu tiên
    return this.formatTemplateOutput(templates[0]);
  }

  /**
   * Thay thế các biến placeholder trong nội dung tin nhắn và tiêu đề
   */
  renderTemplateContent(
    template: any,
    vars: {
      customerName?: string;
      invoiceNumber?: string;
      grandTotal?: string | number;
      packageName?: string;
      viewUrl?: string;
      pdfUrl?: string;
      paymentCode?: string;
      dueDate?: string;
      brandName?: string;
      companyName?: string;
      bankName?: string;
      bankAccount?: string;
      bankCode?: string;
      phone?: string;
      email?: string;
      notes?: string;
      startDate?: string;
      endDate?: string;
    },
  ): { subject: string; content: string; attachments: AttachmentFile[] } {
    const formatCurrency = (n: any) =>
      typeof n === 'number'
        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
        : String(n || '0 VND');

    const grandTotalStr =
      typeof vars.grandTotal === 'number' ? formatCurrency(vars.grandTotal) : vars.grandTotal || '0 VND';

    const replacements: Record<string, string> = {
      '{{customerName}}': vars.customerName || 'Quý khách',
      '{buyerName}': vars.customerName || 'Quý khách',
      '{{buyerName}}': vars.customerName || 'Quý khách',
      '{{invoiceNumber}}': vars.invoiceNumber || '',
      '{invoiceNumber}': vars.invoiceNumber || '',
      '{{grandTotal}}': grandTotalStr,
      '{grandTotal}': grandTotalStr,
      '{{totalAmount}}': grandTotalStr,
      '{{packageName}}': vars.packageName || 'Gói Dịch Vụ',
      '{{viewUrl}}': vars.viewUrl || '',
      '{viewUrl}': vars.viewUrl || '',
      '{{pdfUrl}}': vars.pdfUrl || '',
      '{pdfUrl}': vars.pdfUrl || '',
      '{{paymentCode}}': vars.paymentCode || '',
      '{{dueDate}}': vars.dueDate || '',
      '{{brandName}}': vars.brandName || vars.companyName || 'AI WRITER',
      '{{companyName}}': vars.companyName || 'AI ROBOTIC',
      '{{bankName}}': vars.bankName || 'AI ROBOTIC',
      '{{bankAccount}}': vars.bankAccount || '',
      '{{bankCode}}': vars.bankCode || 'Vietcombank',
      '{{phone}}': vars.phone || '0812305046',
      '{{email}}': vars.email || '',
      '{{notes}}': vars.notes || '',
      '{{startDate}}': vars.startDate || '',
      '{{packageStartDate}}': vars.startDate || '',
      '{{serviceStartDate}}': vars.startDate || '',
      '{{endDate}}': vars.endDate || '',
      '{{packageEndDate}}': vars.endDate || '',
      '{{serviceEndDate}}': vars.endDate || '',
      '{{expireDate}}': vars.endDate || '',
    };

    let subject = template.subject || '';
    let content = template.content || '';

    for (const [key, val] of Object.entries(replacements)) {
      const reg = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      subject = subject.replace(reg, val);
      content = content.replace(reg, val);
    }

    let attachments: AttachmentFile[] = [];
    if (template.attachments) {
      if (Array.isArray(template.attachments)) {
        attachments = template.attachments;
      } else if (typeof template.attachments === 'string') {
        try {
          attachments = JSON.parse(template.attachments);
        } catch {
          attachments = [];
        }
      }
    }

    return {
      subject,
      content,
      attachments,
    };
  }

  private formatTemplateOutput(t: any) {
    let serviceIds: string[] = [];
    let attachments: AttachmentFile[] = [];

    if (t.serviceIds) {
      try {
        serviceIds = typeof t.serviceIds === 'string' ? JSON.parse(t.serviceIds) : t.serviceIds;
      } catch {
        serviceIds = [];
      }
    }

    if (t.attachments) {
      try {
        attachments = typeof t.attachments === 'string' ? JSON.parse(t.attachments) : t.attachments;
      } catch {
        attachments = [];
      }
    }

    return {
      ...t,
      serviceIds,
      attachments,
    };
  }
}

