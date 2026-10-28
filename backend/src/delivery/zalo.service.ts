import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SendZaloOptions {
  phone: string;
  customerName?: string;
  invoiceNumber?: string;
  grandTotal?: number;
  viewUrl?: string;
  pdfUrl?: string;
  customMessage?: string;
}

export interface ZaloConfigOverride {
  baseUrl?: string;
  botId?: string;
  apiKey?: string;
  aliasPrefix?: string;
  autoFriendRequest?: boolean;
}

@Injectable()
export class ZaloService {
  private readonly logger = new Logger(ZaloService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Chuẩn hóa số điện thoại Việt Nam (đổi +84, 84 thành 0; xóa khoảng trắng, dấu gạch)
   */
  formatPhone(phone: string): string {
    if (!phone) return '';
    let clean = phone.replace(/[\s\-\.]/g, '');
    if (clean.startsWith('+84')) {
      clean = '0' + clean.slice(3);
    } else if (clean.startsWith('84') && clean.length >= 11) {
      clean = '0' + clean.slice(2);
    }
    return clean;
  }

  /**
   * Gửi tin nhắn Zalo kèm hóa đơn & mã VietQR tới khách hàng qua Zalo Bot Batch API
   */
  async sendInvoiceZalo(options: SendZaloOptions, configOverride?: ZaloConfigOverride): Promise<{ success: boolean; data?: any; error?: string }> {
    const cleanPhone = this.formatPhone(options.phone);
    if (!cleanPhone || cleanPhone.length < 9) {
      this.logger.warn(`Bỏ qua gửi Zalo: Số điện thoại không hợp lệ (${options.phone})`);
      return { success: false, error: 'Số điện thoại không hợp lệ' };
    }

    const settings = await this.prisma.setting.findUnique({ where: { id: 'default' } });

    const baseUrl = (configOverride?.baseUrl || settings?.zaloApiBaseUrl || 'https://sms-service.talab.io.vn/api/gateway/v1.0').replace(/\/+$/, '');
    const botId = configOverride?.botId || settings?.zaloBotId;
    const apiKey = configOverride?.apiKey || settings?.zaloApiKey;
    const autoFriend = configOverride?.autoFriendRequest !== undefined ? configOverride.autoFriendRequest : settings?.zaloAutoFriendRequest;
    const aliasPrefix = configOverride?.aliasPrefix || settings?.zaloAliasPrefix || 'KH_';

    if (!botId || !apiKey) {
      this.logger.warn('Chưa cấu hình Zalo Bot ID hoặc API Key trong Cài đặt Hệ thống');
      return { success: false, error: 'Chưa cấu hình Zalo Bot ID hoặc API Key' };
    }

    // Soạn nội dung tin nhắn
    const formatCurrency = (n?: number) =>
      new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

    const buyerName = options.customerName || 'Quý khách';
    const invoiceNum = options.invoiceNumber || 'Hóa đơn';
    const totalStr = formatCurrency(options.grandTotal);
    const viewUrl = options.viewUrl || '';
    const pdfUrl = options.pdfUrl || '';

    let messageText = settings?.zaloMessageTemplate || '';
    if (options.customMessage) {
      messageText = options.customMessage;
    }

    if (messageText && messageText.trim() !== '') {
      messageText = messageText
        .replace(/\{buyerName\}/g, buyerName)
        .replace(/\{invoiceNumber\}/g, invoiceNum)
        .replace(/\{grandTotal\}/g, totalStr)
        .replace(/\{viewUrl\}/g, viewUrl)
        .replace(/\{pdfUrl\}/g, pdfUrl);
    } else {
      messageText =
        `🔔 [Invoice-AIR] Thông báo hóa đơn dịch vụ\n` +
        `Kính chào Anh/Chị ${buyerName},\n` +
        `Hóa đơn điện tử của Quý khách đã được khởi tạo thành công:\n` +
        `• Mã hóa đơn: #${invoiceNum}\n` +
        `• Tổng tiền: ${totalStr}\n` +
        (viewUrl ? `• Xem hóa đơn & Quét mã VietQR: ${viewUrl}\n` : '') +
        (pdfUrl ? `• Tải file PDF trực tiếp: ${pdfUrl}\n` : '') +
        `\nCảm ơn Quý khách đã tin tưởng và sử dụng dịch vụ!`;
    }

    try {
      // 1. Gọi API Gửi tin nhắn Batch (≤5 recipients là đồng bộ)
      const messageEndpoint = `${baseUrl}/bots/${botId}/messages/send-batch`;
      const messagePayload = {
        recipients: [{ phone: cleanPhone }],
        content: {
          type: 'text',
          data: { text: messageText },
        },
        mode: 'safe',
      };

      const response = await fetch(messageEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
        },
        body: JSON.stringify(messagePayload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        this.logger.error(`Zalo API error HTTP ${response.status}: ${JSON.stringify(result)}`);
        return { success: false, error: `Zalo API HTTP ${response.status}`, data: result };
      }

      this.logger.log(`Đã gửi tin nhắn Zalo thành công tới ${cleanPhone}: ${JSON.stringify(result)}`);

      // 2. Gửi lời mời kết bạn nếu được bật
      if (autoFriend) {
        try {
          const friendEndpoint = `${baseUrl}/bots/${botId}/friends/requests/send-batch`;
          const friendPayload = {
            recipients: [
              {
                phone: cleanPhone,
                alias: `${aliasPrefix}${buyerName}`.slice(0, 50),
              },
            ],
          };

          await fetch(friendEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey.trim(),
            },
            body: JSON.stringify(friendPayload),
          });
        } catch (friendErr: any) {
          this.logger.warn(`Không thể gửi lời mời kết bạn Zalo: ${friendErr?.message}`);
        }
      }

      return { success: true, data: result };
    } catch (error: any) {
      this.logger.error(`Lỗi kết nối tới Zalo Bot API: ${error?.message}`);
      return { success: false, error: error?.message };
    }
  }

  /**
   * Gửi tin nhắn kiểm tra kết nối từ Popup cài đặt
   */
  async testConnection(config: { baseUrl?: string; botId: string; apiKey: string; testPhone: string }) {
    const cleanPhone = this.formatPhone(config.testPhone);
    if (!cleanPhone || cleanPhone.length < 9) {
      throw new Error('Số điện thoại kiểm tra không hợp lệ');
    }

    const baseUrl = (config.baseUrl || 'https://sms-service.talab.io.vn/api/gateway/v1.0').replace(/\/+$/, '');
    const endpoint = `${baseUrl}/bots/${config.botId.trim()}/messages/send-batch`;

    const payload = {
      recipients: [{ phone: cleanPhone }],
      content: {
        type: 'text',
        data: {
          text: `🔔 [Invoice-AIR] Tin nhắn kiểm tra kết nối Zalo Bot thành công vào lúc ${new Date().toLocaleTimeString('vi-VN')}!`,
        },
      },
      mode: 'safe',
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey.trim(),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return { success: true, data };
  }
}
