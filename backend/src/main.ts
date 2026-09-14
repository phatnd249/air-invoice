import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS origins cấu hình qua env (CORS_ORIGINS, phân tách bằng dấu phẩy)
  // để khi Deploy lên môi trường khác không phải chỉnh sửa code.
  const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Invoice-AIR Backend is running on: http://localhost:${port}/api`);
}
bootstrap();
