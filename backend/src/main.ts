import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

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
      if (
        !origin ||
        allowedOrigins.has('*') ||
        allowedOrigins.has(origin) ||
        origin.endsWith('.share4happy.com') ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Invoice-AIR Backend is running on: http://localhost:${port}/api`);
}
bootstrap();
