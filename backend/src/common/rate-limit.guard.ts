import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_KEY, RateLimitOptions } from './rate-limit.decorator';

interface Bucket {
  count: number;
  resetAt: number;
}

/** Giới hạn mặc định cho các route không gắn @RateLimit(): 300 request / phút / IP. */
const DEFAULT_LIMIT = 300;
const DEFAULT_WINDOW_MS = 60_000;
/** Chặn phình bộ nhớ nếu bị spam nhiều IP/route khác nhau. */
const MAX_BUCKETS = 20_000;
const CLEANUP_INTERVAL_MS = 5 * 60_000;

/**
 * Rate limiting in-memory (không cần dependency ngoài, không cần Redis).
 *
 * - Mặc định mỗi route + IP có một "xô" 300 request/phút.
 * - Route nhạy cảm gắn @RateLimit() để siết chặt hơn.
 * - `byBody` tạo thêm xô theo giá trị body (vd: email) để chặn brute-force
 *   xoay vòng IP cho cùng một tài khoản.
 *
 * Lưu ý: bộ đếm nằm trong RAM của từng instance. Nếu chạy nhiều instance
 * (Render scale > 1) thì giới hạn thực tế sẽ nhân lên theo số instance.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly buckets = new Map<string, Bucket>();
  private lastCleanup = Date.now();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;

    const req = context.switchToHttp().getRequest();
    // Preflight không tính vào giới hạn.
    if (req.method === 'OPTIONS') return true;

    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    const limit = options?.limit ?? DEFAULT_LIMIT;
    const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
    const now = Date.now();
    this.cleanup(now);

    const route = this.getRouteKey(req);
    const keys = [`ip:${route}:${this.getClientIp(req)}`];

    for (const field of options?.byBody ?? []) {
      const value = req.body?.[field];
      if (typeof value === 'string' && value.trim()) {
        keys.push(`body:${route}:${field}:${value.trim().toLowerCase()}`);
      }
    }

    let retryAfterMs = 0;
    for (const key of keys) {
      retryAfterMs = Math.max(
        retryAfterMs,
        this.hit(key, limit, windowMs, now),
      );
    }

    if (retryAfterMs > 0) {
      const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1000));
      const res = context.switchToHttp().getResponse();
      res?.setHeader?.('Retry-After', String(retryAfterSec));

      throw new HttpException(
        options?.message ??
          `Quá nhiều yêu cầu. Vui lòng thử lại sau ${retryAfterSec} giây.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  /**
   * Ghi nhận 1 lượt cho khoá.
   * @returns 0 nếu còn lượt, ngược lại là số ms phải chờ.
   */
  private hit(
    key: string,
    limit: number,
    windowMs: number,
    now: number,
  ): number {
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return 0;
    }

    if (bucket.count >= limit) {
      return bucket.resetAt - now;
    }

    bucket.count += 1;
    return 0;
  }

  private getRouteKey(req: any): string {
    const raw =
      req.route?.path ??
      String(req.originalUrl ?? req.url ?? '').split('?')[0] ??
      'unknown';
    return `${req.method}:${raw}`;
  }

  /**
   * Lấy IP client. Cần `app.set('trust proxy', ...)` trong main.ts để
   * req.ip phản ánh IP thật khi chạy sau proxy của Render.
   */
  private getClientIp(req: any): string {
    return (
      req.ip ||
      req.socket?.remoteAddress ||
      req.connection?.remoteAddress ||
      'unknown'
    );
  }

  private cleanup(now: number): void {
    if (
      this.buckets.size < MAX_BUCKETS &&
      now - this.lastCleanup < CLEANUP_INTERVAL_MS
    ) {
      return;
    }

    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
    this.lastCleanup = now;

    if (this.buckets.size > MAX_BUCKETS) {
      // Map giữ thứ tự chèn -> xoá các khoá cũ nhất trước.
      const overflow = this.buckets.size - MAX_BUCKETS;
      let removed = 0;
      for (const key of this.buckets.keys()) {
        if (removed >= overflow) break;
        this.buckets.delete(key);
        removed += 1;
      }
      this.logger.warn(
        `[RateLimit] Bộ đếm vượt ${MAX_BUCKETS} khoá, đã xoá ${removed} khoá cũ nhất`,
      );
    }
  }
}
