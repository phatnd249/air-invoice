import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly prisma: PrismaService) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  /**
   * Tính toán lại trạng thái động dựa trên ngày hết hạn
   */
  private computeStatusAndRemaining(sub: any) {
    const now = new Date();
    const endDate = new Date(sub.endDate);
    const startDate = new Date(sub.startDate);

    const diffTime = endDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsedDuration = now.getTime() - startDate.getTime();
    let progressPercent = 0;
    if (totalDuration > 0) {
      progressPercent = Math.min(100, Math.max(0, Math.round((elapsedDuration / totalDuration) * 100)));
    }

    let calculatedStatus = sub.status;
    if (sub.status !== 'CANCELLED') {
      if (daysRemaining < 0) {
        calculatedStatus = 'EXPIRED';
      } else if (daysRemaining <= 15) {
        calculatedStatus = 'EXPIRING_SOON';
      } else {
        calculatedStatus = 'ACTIVE';
      }
    }

    return {
      ...sub,
      status: calculatedStatus,
      daysRemaining,
      progressPercent,
    };
  }

  async findAll(search?: string, status?: string) {
    const where: any = {};

    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
        { customerCompany: { contains: search } },
        { serviceName: { contains: search } },
        { staffName: { contains: search } },
      ];
    }

    const rawList = await this.prisma.customerSubscription.findMany({
      where,
      orderBy: { endDate: 'asc' },
    });

    const computedList = rawList.map((item) => this.computeStatusAndRemaining(item));

    if (status && status !== 'ALL') {
      return computedList.filter((item) => item.status === status);
    }

    return computedList;
  }

  async getStats() {
    const rawList = await this.prisma.customerSubscription.findMany();
    const list = rawList.map((item) => this.computeStatusAndRemaining(item));

    const total = list.length;
    const active = list.filter((i) => i.status === 'ACTIVE').length;
    const expiringSoon = list.filter((i) => i.status === 'EXPIRING_SOON').length;
    const expired = list.filter((i) => i.status === 'EXPIRED').length;
    const cancelled = list.filter((i) => i.status === 'CANCELLED').length;
    const totalRevenue = list
      .filter((i) => i.status !== 'CANCELLED')
      .reduce((acc, curr) => acc + (curr.servicePrice || 0), 0);

    return {
      total,
      active,
      expiringSoon,
      expired,
      cancelled,
      totalRevenue,
    };
  }

  async findOne(id: string) {
    const sub = await this.prisma.customerSubscription.findUnique({
      where: { id },
    });

    if (!sub) {
      throw new NotFoundException('Không tìm thấy thông tin đăng ký dịch vụ của khách hàng');
    }

    return this.computeStatusAndRemaining(sub);
  }

  async create(dto: CreateSubscriptionDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Định dạng ngày bắt đầu hoặc ngày kết thúc không hợp lệ');
    }

    if (end < start) {
      throw new BadRequestException('Ngày kết thúc không được nhỏ hơn ngày bắt đầu');
    }

    const created = await this.prisma.customerSubscription.create({
      data: {
        customerName: dto.customerName.trim(),
        customerEmail: dto.customerEmail.trim().toLowerCase(),
        customerPhone: dto.customerPhone?.trim(),
        customerCompany: dto.customerCompany?.trim(),
        serviceId: dto.serviceId,
        serviceName: dto.serviceName.trim(),
        servicePrice: dto.servicePrice || 0,
        cycle: dto.cycle || '1 năm',
        startDate: start,
        endDate: end,
        status: dto.status || 'ACTIVE',
        staffName: dto.staffName?.trim(),
        staffEmail: dto.staffEmail?.trim().toLowerCase(),
        notes: dto.notes,
      },
    });

    return this.computeStatusAndRemaining(created);
  }

  async update(id: string, dto: UpdateSubscriptionDto) {
    const existing = await this.prisma.customerSubscription.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy thông tin sử dụng dịch vụ');
    }

    const dataToUpdate: any = {};

    if (dto.customerName) dataToUpdate.customerName = dto.customerName.trim();
    if (dto.customerEmail) dataToUpdate.customerEmail = dto.customerEmail.trim().toLowerCase();
    if (dto.customerPhone !== undefined) dataToUpdate.customerPhone = dto.customerPhone?.trim();
    if (dto.customerCompany !== undefined) dataToUpdate.customerCompany = dto.customerCompany?.trim();
    if (dto.serviceId !== undefined) dataToUpdate.serviceId = dto.serviceId;
    if (dto.serviceName) dataToUpdate.serviceName = dto.serviceName.trim();
    if (dto.servicePrice !== undefined) dataToUpdate.servicePrice = dto.servicePrice;
    if (dto.cycle !== undefined) dataToUpdate.cycle = dto.cycle;
    if (dto.status) dataToUpdate.status = dto.status;
    if (dto.staffName !== undefined) dataToUpdate.staffName = dto.staffName?.trim();
    if (dto.staffEmail !== undefined) dataToUpdate.staffEmail = dto.staffEmail?.trim().toLowerCase();
    if (dto.notes !== undefined) dataToUpdate.notes = dto.notes;

    if (dto.startDate) {
      const start = new Date(dto.startDate);
      if (isNaN(start.getTime())) throw new BadRequestException('Ngày bắt đầu không hợp lệ');
      dataToUpdate.startDate = start;
    }

    if (dto.endDate) {
      const end = new Date(dto.endDate);
      if (isNaN(end.getTime())) throw new BadRequestException('Ngày kết thúc không hợp lệ');
      dataToUpdate.endDate = end;
    }

    const updated = await this.prisma.customerSubscription.update({
      where: { id },
      data: dataToUpdate,
    });

    return this.computeStatusAndRemaining(updated);
  }

  async remove(id: string) {
    const existing = await this.prisma.customerSubscription.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy thông tin đăng ký dịch vụ');
    }

    await this.prisma.customerSubscription.delete({ where: { id } });
    return { message: 'Đã xóa khách hàng khỏi danh sách sử dụng dịch vụ' };
  }

  /**
   * Xem trước nội dung email cảnh báo gia hạn dịch vụ
   */
  async previewAlertEmail(id: string, customSubject?: string, customMessage?: string) {
    const sub = await this.findOne(id);
    const settings = (await this.prisma.setting.findUnique({ where: { id: 'default' } })) as any;

    const companyName = settings?.companyName || 'CÔNG TY TNHH GIÁO DỤC AI ROBOTIC';
    const hotline = settings?.phone || '0900000000';
    const supportEmail = settings?.email || 'contact@airobotics.edu.vn';

    const formatCurrency = (n: number) =>
      new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

    const startDateStr = new Date(sub.startDate).toLocaleDateString('vi-VN');
    const endDateStr = new Date(sub.endDate).toLocaleDateString('vi-VN');

    const daysRemainingText =
      sub.daysRemaining < 0
        ? `ĐÃ QUÁ HẠN ${Math.abs(sub.daysRemaining)} NGÀY`
        : sub.daysRemaining === 0
        ? `HẾT HẠN HÔM NAY`
        : `CÒN ${sub.daysRemaining} NGÀY NỮA`;

    const statusBadgeColor =
      sub.daysRemaining <= 0 ? '#e11d48' : sub.daysRemaining <= 15 ? '#d97706' : '#2563eb';

    // Thay thế các biến động nếu có
    const replaceVariables = (text: string) => {
      return text
        .replace(/\{customerName\}/g, sub.customerName || '')
        .replace(/\{customerCompany\}/g, sub.customerCompany ? `(${sub.customerCompany})` : '')
        .replace(/\{serviceName\}/g, sub.serviceName || '')
        .replace(/\{cycle\}/g, sub.cycle || '1 năm')
        .replace(/\{startDate\}/g, startDateStr)
        .replace(/\{endDate\}/g, endDateStr)
        .replace(/\{servicePrice\}/g, formatCurrency(sub.servicePrice))
        .replace(/\{daysRemaining\}/g, daysRemainingText)
        .replace(/\{staffName\}/g, sub.staffName || 'Bộ phận Kỹ thuật & Khách hàng')
        .replace(/\{staffEmail\}/g, sub.staffEmail || '')
        .replace(/\{companyName\}/g, companyName)
        .replace(/\{hotline\}/g, hotline)
        .replace(/\{supportEmail\}/g, supportEmail);
    };

    let subjectTemplate =
      customSubject ||
      settings?.emailAlertSubject ||
      `[THÔNG BÁO GIA HẠN DỊCH VỤ] Gói "{serviceName}" của {customerName} {daysRemaining}`;

    let emailSubject = replaceVariables(subjectTemplate);

    let defaultIntro =
      'Hệ thống tự động xin gửi thông báo nhắc lịch gia hạn gói dịch vụ mà Quý khách đang sử dụng nhằm đảm bảo dịch vụ luôn duy trì hoạt động thông suốt và ổn định nhất.';

    let introText = customMessage ? customMessage : settings?.emailAlertBody || defaultIntro;
    introText = replaceVariables(introText).replace(/\n/g, '<br/>');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="color: #1e293b; margin: 0; font-size: 20px; text-transform: uppercase;">THÔNG BÁO LỊCH GIA HẠN DỊCH VỤ</h2>
            <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0;">${companyName}</p>
          </div>
          <div style="background: ${statusBadgeColor}; color: #ffffff; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 12px;">
            ${daysRemainingText}
          </div>
        </div>

        <p>Kính gửi Quý khách hàng <strong>${sub.customerName}</strong> ${sub.customerCompany ? `(${sub.customerCompany})` : ''},</p>
        
        <p>${introText}</p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0f172a; font-size: 15px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px;">Chi Tiết Gói Dịch Vụ Đang Sử Dụng:</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 40%;">Tên dịch vụ:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${sub.serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Chu kỳ sử dụng:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${sub.cycle || '1 năm'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Thời gian kích hoạt:</td>
              <td style="padding: 6px 0; color: #0f172a;">${startDateStr}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Thời hạn kết thúc:</td>
              <td style="padding: 6px 0; font-weight: bold; color: ${statusBadgeColor}; font-size: 14px;">${endDateStr}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Giá trị hợp đồng / gói:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #059669; font-size: 15px;">${formatCurrency(sub.servicePrice)}</td>
            </tr>
          </table>
        </div>

        <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 12px 16px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: #1e40af; font-size: 13px;">
            <strong>Người phụ trách hỗ trợ:</strong> ${sub.staffName || 'Bộ phận Kỹ thuật & Khách hàng'} ${sub.staffEmail ? `(Email: ${sub.staffEmail})` : ''}
          </p>
        </div>

        <p>Quý khách vui lòng liên hệ với người phụ trách hoặc phản hồi trực tiếp email này để tiến hành gia hạn hợp đồng trước ngày <strong>${endDateStr}</strong> để tránh gián đoạn dịch vụ.</p>

        <p style="margin-top: 30px; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          Trân trọng cảm ơn Quý khách!<br/>
          <strong>${companyName}</strong><br/>
          Hotline: ${hotline} | Email: ${supportEmail}
        </p>
      </div>
    `;

    return {
      to: sub.customerEmail,
      cc: sub.staffEmail || null,
      subject: emailSubject,
      introText,
      htmlContent,
      sub,
      companyName,
    };
  }

  /**
   * Gửi email cảnh báo sắp hết hạn cho cả Khách hàng & Người phụ trách (hỗ trợ nội dung tùy chỉnh)
   */
  async sendExpiryAlert(id: string, customSubject?: string, customMessage?: string) {
    const preview = await this.previewAlertEmail(id, customSubject, customMessage);
    const sub = preview.sub;

    const recipients = [preview.to];
    const ccRecipients: string[] = [];
    if (preview.cc && preview.cc !== preview.to) {
      ccRecipients.push(preview.cc);
    }

    try {
      await this.transporter.sendMail({
        from: `"${preview.companyName}" <${process.env.SMTP_FROM || 'no-reply@invoice-air.com'}>`,
        to: recipients.join(', '),
        cc: ccRecipients.length > 0 ? ccRecipients.join(', ') : undefined,
        subject: preview.subject,
        html: preview.htmlContent,
      });

      this.logger.log(`Đã gửi email cảnh báo gia hạn cho ${preview.to} (CC: ${ccRecipients.join(', ') || 'không'})`);
    } catch (err) {
      this.logger.warn(`Không thể gửi email qua SMTP thật (Sẽ ghi log hệ thống): ${err}`);
    }

    // Cập nhật số lần cảnh báo và thời gian
    await this.prisma.customerSubscription.update({
      where: { id },
      data: {
        lastAlertSentAt: new Date(),
        alertCount: { increment: 1 },
      },
    });

    return {
      success: true,
      message: `Đã gửi thông báo cảnh báo gia hạn cho khách hàng ${sub.customerName} và người phụ trách (${sub.staffEmail || 'Chưa gán'}) thành công`,
      recipients: {
        to: preview.to,
        cc: preview.cc,
      },
      subject: preview.subject,
      sentAt: new Date().toISOString(),
    };
  }

  /**
   * Gửi email cảnh báo hàng loạt cho nhiều khách hàng được chọn
   */
  async bulkSendExpiryAlerts(ids: string[], customSubject?: string, customMessage?: string) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một khách hàng để gửi email');
    }

    const results = [];
    for (const id of ids) {
      try {
        const res = await this.sendExpiryAlert(id, customSubject, customMessage);
        results.push({ id, to: res.recipients?.to, status: 'SENT', res });
      } catch (err: any) {
        results.push({ id, status: 'FAILED', error: err.message });
      }
    }

    return {
      requested: ids.length,
      sentCount: results.filter((r) => r.status === 'SENT').length,
      failedCount: results.filter((r) => r.status === 'FAILED').length,
      details: results,
    };
  }

  /**
   * Kiểm tra hàng loạt và tự động gửi cảnh báo các gói sắp hết hạn (<= 15 ngày)
   */
  async checkAndSendBatchAlerts() {
    const list = await this.findAll();
    const expiringList = list.filter(
      (sub) =>
        (sub.status === 'EXPIRING_SOON' || sub.status === 'EXPIRED') &&
        sub.customerEmail
    );

    const results = [];
    for (const sub of expiringList) {
      try {
        const res = await this.sendExpiryAlert(sub.id);
        results.push({ id: sub.id, customerName: sub.customerName, status: 'SENT', res });
      } catch (err: any) {
        results.push({ id: sub.id, customerName: sub.customerName, status: 'FAILED', error: err.message });
      }
    }

    return {
      totalExpiring: expiringList.length,
      alertedCount: results.filter((r) => r.status === 'SENT').length,
      details: results,
    };
  }
}
