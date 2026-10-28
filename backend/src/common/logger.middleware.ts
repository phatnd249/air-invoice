import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('API-REQUEST');

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, originalUrl } = req;

    // Lấy client IP từ các proxy header (Render, Cloudflare, Nginx)
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : Array.isArray(forwarded)
        ? forwarded[0]
        : req.socket.remoteAddress || req.ip;

    // Định dạng thời gian theo múi giờ Việt Nam (Asia/Ho_Chi_Minh, GMT+7)
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const m: Record<string, string> = {};
    for (const p of parts) m[p.type] = p.value;
    const vnTime = `${m.day}/${m.month}/${m.year} ${m.hour}:${m.minute}:${m.second}`;

    // Lấy thông tin nguồn gọi (API Key hoặc Bearer JWT)
    const apiKey = (req.headers['x-api-key'] || req.headers['x-api-token']) as string | undefined;
    const authHeader = req.headers['authorization'];
    const callerInfo = apiKey
      ? `[Key: ${apiKey.slice(0, 8)}...]`
      : authHeader
        ? `[Auth: Bearer]`
        : `[Public]`;

    // Rút gọn và ẩn các trường dữ liệu nhạy cảm trong body
    let bodySnippet = '';
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
      try {
        const sanitized = { ...req.body };
        const sensitiveFields = ['password', 'token', 'refreshToken', 'secret', 'key'];
        for (const k of Object.keys(sanitized)) {
          if (sensitiveFields.some((f) => k.toLowerCase().includes(f))) {
            sanitized[k] = '***';
          }
        }
        const json = JSON.stringify(sanitized);
        bodySnippet = json.length > 200 ? json.slice(0, 200) + '...' : json;
      } catch {
        bodySnippet = '[Object]';
      }
    }

    // Bắt sự kiện khi response hoàn tất
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Không spam log đối với health check định kỳ nếu thành công (200)
      const isHealthCheck = originalUrl === '/api' || originalUrl === '/api/health';
      if (isHealthCheck && statusCode < 400) {
        return;
      }

      const logMsg = `[${vnTime}] ${method} ${originalUrl} -> ${statusCode} (${duration}ms) | IP: ${clientIp} ${callerInfo}${
        bodySnippet ? ` | Body: ${bodySnippet}` : ''
      }`;

      if (statusCode >= 500) {
        this.logger.error(logMsg);
      } else if (statusCode >= 400) {
        this.logger.warn(logMsg);
      } else {
        this.logger.log(logMsg);
      }
    });

    next();
  }
}
