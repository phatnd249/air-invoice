import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo API Key mới cho hệ thống
   * Key có định dạng: air_live_<40 ký tự ngẫu nhiên base64url/hex>
   * Lưu SHA-256 hash vào DB để bảo mật tối đa (giống chuẩn Stripe / GitHub)
   */
  async createApiKey(dto: { name: string; permissions?: string; expiresInDays?: number }) {
    const name = (dto.name || '').trim();
    if (!name) {
      throw new BadRequestException('Vui lòng nhập tên gợi nhớ cho API Key (VD: Landing Page Tuyển Sinh)');
    }

    // 1. Tạo chuỗi bí mật ngẫu nhiên mã hóa mạnh
    const randomSecret = crypto.randomBytes(24).toString('hex');
    const rawKey = `air_live_${randomSecret}`;

    // 2. Băm SHA-256 để lưu DB
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    // 3. Tiền tố và hậu tố để hiển thị trên giao diện quản lý
    const prefix = `${rawKey.slice(0, 13)}••••`;
    const lastChars = rawKey.slice(-4);

    // 4. Thời hạn hết hạn (nếu có)
    let expiresAt: Date | null = null;
    if (dto.expiresInDays && dto.expiresInDays > 0) {
      expiresAt = new Date(Date.now() + dto.expiresInDays * 24 * 60 * 60 * 1000);
    }

    const created = await this.prisma.apiKey.create({
      data: {
        name,
        keyHash,
        prefix,
        lastChars,
        permissions: dto.permissions || 'all',
        isActive: true,
        expiresAt,
      },
    });

    // Trả về full key để người dùng sao chép 1 LẦN DUY NHẤT
    return {
      id: created.id,
      name: created.name,
      apiKey: rawKey,
      prefix: created.prefix,
      lastChars: created.lastChars,
      permissions: created.permissions,
      isActive: created.isActive,
      expiresAt: created.expiresAt,
      createdAt: created.createdAt,
    };
  }

  /**
   * Lấy danh sách tất cả API Key (không kèm keyHash để bảo mật)
   */
  async listApiKeys() {
    return this.prisma.apiKey.findMany({
      select: {
        id: true,
        name: true,
        prefix: true,
        lastChars: true,
        permissions: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Bật / Tắt trạng thái hoạt động của API Key
   */
  async toggleApiKey(id: string) {
    const existing = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Không tìm thấy API Key');

    return this.prisma.apiKey.update({
      where: { id },
      data: { isActive: !existing.isActive },
      select: {
        id: true,
        name: true,
        prefix: true,
        lastChars: true,
        isActive: true,
        lastUsedAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Xóa / Thu hồi vĩnh viễn API Key
   */
  async deleteApiKey(id: string) {
    const existing = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Không tìm thấy API Key');

    await this.prisma.apiKey.delete({ where: { id } });
    return { success: true, message: 'Đã xóa API Key thành công' };
  }

  /**
   * Kiểm tra và xác thực API Key từ request bên ngoài (Header x-api-key hoặc Authorization)
   */
  async validateApiKey(rawKey: string) {
    if (!rawKey || typeof rawKey !== 'string') return null;
    const cleanKey = rawKey.trim().replace(/^Bearer\s+/i, '').replace(/^ApiKey\s+/i, '');

    if (!cleanKey.startsWith('air_live_')) return null;

    const keyHash = crypto.createHash('sha256').update(cleanKey).digest('hex');

    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
    });

    if (!apiKey || !apiKey.isActive) return null;

    // Kiểm tra hết hạn
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return null;
    }

    // Cập nhật lastUsedAt không đồng bộ (fire and forget) để không làm chậm request
    this.prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch((err) => console.warn('[ApiKey] Không thể cập nhật lastUsedAt:', err?.message));

    return apiKey;
  }
}
