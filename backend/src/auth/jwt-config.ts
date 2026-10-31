import { ConfigService } from '@nestjs/config';

export type JwtSecretKey = 'JWT_SECRET' | 'REFRESH_TOKEN_SECRET';

/**
 * Lấy secret JWT từ biến môi trường.
 *
 * - Production: BẮT BUỘC phải có giá trị, nếu thiếu thì dừng ứng dụng (fail-fast).
 *   Trước đây code dùng chuỗi fallback hardcode trong source → ai đọc repo cũng ký được
 *   token ADMIN giả mạo nếu biến môi trường bị thiếu.
 * - Development: dùng giá trị cố định riêng cho dev để không phụ thuộc .env.
 */
export function getJwtSecret(
  configService: ConfigService,
  key: JwtSecretKey,
): string {
  const value = configService.get<string>(key)?.trim();
  if (value) return value;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `[SECURITY] Thiếu biến môi trường ${key}. Ứng dụng dừng để tránh ký JWT bằng secret mặc định.`,
    );
  }

  return key === 'JWT_SECRET'
    ? 'dev-only-jwt-secret-do-not-use-in-production'
    : 'dev-only-refresh-secret-do-not-use-in-production';
}
