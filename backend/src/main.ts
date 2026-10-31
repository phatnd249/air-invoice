// ⏰ Thiết lập múi giờ mặc định cho hệ thống là Giờ Việt Nam (Asia/Ho_Chi_Minh, GMT+7)
process.env.TZ = 'Asia/Ho_Chi_Minh';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dns from 'node:dns';

// Ép Node.js ưu tiên phân giải địa chỉ IPv4 trước IPv6 để tránh lỗi ENETUNREACH trên Render/Docker container
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Bỏ qua nếu môi trường Node không hỗ trợ
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ================= CORS =================
  // CORS_ORIGINS có thể là:
  //   'https://a.com,https://b'  -> chỉ các domain này (khuyến nghị)
  //   'https://*.vercel.app'     -> hỗ trợ wildcard subdomain
  //   '*'                        -> mở cho mọi website (CHỈ dùng khi thật cần, sẽ cảnh báo)
  // Không cấu hình => chỉ dùng danh sách mặc định bên dưới (không fallback về '*').
  const envOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, '')) // bỏ dấu '/' cuối
    .filter(Boolean);

  const defaultOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://invoice.share4happy.com',
  ];

  // Chỉ mở public khi cấu hình TƯỜNG MINH '*'
  const allowAllOrigins = envOrigins.includes('*');
  if (allowAllOrigins) {
    console.warn(
      '[CORS] CORS_ORIGINS="*" — mọi website đều gọi được API. Nên đặt allowlist domain cụ thể.',
    );
  }
  const allowedPatterns = [...new Set([...defaultOrigins, ...envOrigins])];

  const isOriginAllowed = (origin: string): boolean => {
    if (allowAllOrigins) return true;

    const value = origin.replace(/\/+$/, '');
    return allowedPatterns.some((pattern) => {
      if (pattern === '*') return true;
      if (!pattern.includes('*')) return pattern === value;

      // 'https://*.vercel.app' -> '^https://.*\.vercel\.app$'
      const regex = new RegExp(
        '^' +
          pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') +
          '$',
      );
      return regex.test(value);
    });
  };

  app.enableCors({
    origin: (origin, callback) => {
      // Không có Origin (curl, Postman, n8n, webhook, health check) → luôn cho qua
      if (!origin) return callback(null, true);

      if (isOriginAllowed(origin)) return callback(null, true);

      console.warn(`[CORS] Từ chối origin: ${origin}`);
      return callback(null, false); // không gắn header CORS → browser chặn
    },
    // App dùng Bearer token trong header (không dùng cookie) → không cần credentials
    credentials: false,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'x-api-key',
      'x-api-token',
      'x-webhook-secret',
      'X-Requested-With',
      'Origin',
    ],
    // Cho phép JS đọc các header này từ response (tải PDF, xem dung lượng...)
    exposedHeaders: ['Content-Disposition', 'Content-Length'],
    maxAge: 86400, // cache preflight 1 ngày
  });

  // ================= SECURITY HEADERS =================
  // Thiết lập thủ công để không phải thêm dependency helmet
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.use((_req: any, res: any, next: () => void) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()',
    );
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );
    // API trả PDF/ảnh cho frontend domain khác → cho phép nhúng tài nguyên
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    // API không render HTML → chặn mọi tài nguyên
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    );
    next();
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Invoice-AIR Backend is running on: http://localhost:${port}/api`);
}
bootstrap();
