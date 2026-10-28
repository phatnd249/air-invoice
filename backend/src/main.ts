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

  // CORS origins: kết hợp CORS_ORIGINS từ env và các domain mặc định
  const envCors = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const defaultOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://invoice.share4happy.com',
  ];
  const allowedOrigins = new Set([...defaultOrigins, ...envCors]);

  app.enableCors({
    origin: (origin, callback) => {
      // Cho phép tất cả các nguồn gọi API (bao gồm các Landing Page, aiwriter.ntcore.io.vn, v.v.)
      return callback(null, true);
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
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Invoice-AIR Backend is running on: http://localhost:${port}/api`);
}
bootstrap();
