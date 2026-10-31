import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimitOptions {
  /** Số request tối đa trong 1 cửa sổ thời gian */
  limit: number;
  /** Độ dài cửa sổ thời gian (ms) */
  windowMs: number;
  /**
   * Tên field trong body dùng để giới hạn thêm (vd: 'email' cho login/forgot-password).
   * Mỗi giá trị tạo một "xô" riêng, song song với xô theo IP.
   */
  byBody?: string[];
  message?: string;
}

/**
 * Gắn giới hạn tần suất riêng cho một endpoint.
 * Không gắn => dùng giới hạn mặc định toàn cục trong RateLimitGuard.
 */
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);
