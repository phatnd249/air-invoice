import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

/**
 * Bảo vệ endpoint đối soát thanh toán (confirm-payment) bằng shared secret.
 *
 * - Secret lấy từ biến môi trường PAYMENT_WEBHOOK_SECRET.
 * - Client gửi qua header `x-webhook-secret` (hoặc `Authorization: Bearer <secret>`).
 * - FAIL CLOSED: nếu chưa cấu hình secret thì từ chối toàn bộ (503), không để endpoint mở.
 */
@Injectable()
export class PaymentWebhookGuard implements CanActivate {
  private readonly logger = new Logger(PaymentWebhookGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const expected = (process.env.PAYMENT_WEBHOOK_SECRET || '').trim();
    if (!expected) {
      this.logger.error(
        'PAYMENT_WEBHOOK_SECRET chưa được cấu hình — từ chối mọi yêu cầu confirm-payment',
      );
      throw new ServiceUnavailableException(
        'Cổng đối soát thanh toán chưa được cấu hình',
      );
    }

    const request = context.switchToHttp().getRequest();
    const rawHeader = request.headers['x-webhook-secret'];
    const authHeader = request.headers['authorization'];

    const headerSecret = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
    const bearerSecret =
      typeof authHeader === 'string'
        ? authHeader.replace(/^Bearer\s+/i, '').trim()
        : '';

    const provided = String(headerSecret || bearerSecret || '').trim();

    if (!provided || !this.safeEqual(provided, expected)) {
      throw new UnauthorizedException(
        'Thiếu hoặc sai mã xác thực webhook đối soát thanh toán',
      );
    }

    return true;
  }

  private safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  }
}
