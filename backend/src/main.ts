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
  //   '*'                        -> PUBLIC API: mọi website đều gọi được (mặc định)
  //   'https://a.com,https://b'  -> chỉ các domain này
  //   'https://*.vercel.app'     -> hỗ trợ wildcard subdomain
  const envOrigins = (process.env.CORS_ORIGINS ?? '*')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, '')) // bỏ dấu '/' cuối
    .filter(Boolean);

  const defaultOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://invoice.share4happy.com',
  ];

  // Mở public khi có '*' hoặc không cấu hình gì
  const allowAllOrigins = envOrigins.length === 0 || envOrigins.includes('*');
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
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'x-api-key',
      'x-api-token',
      'X-Requested-With',
      'Origin',
    ],
    // Cho phép JS đọc các header này từ response (tải PDF, xem dung lượng...)
    exposedHeaders: ['Content-Disposition', 'Content-Length'],
    maxAge: 86400, // cache preflight 1 ngày
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Invoice-AIR Backend is running on: http://localhost:${port}/api`);
}
bootstrap();
