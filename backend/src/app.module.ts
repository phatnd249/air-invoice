import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { SettingsModule } from './settings/settings.module';
import { InvoicesModule } from './invoices/invoices.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { DeliveryModule } from './delivery/delivery.module';
import { ServicesCatalogModule } from './services-catalog/services-catalog.module';
import { UsersModule } from './users/users.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { HealthModule } from './health/health.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { RequestLoggerMiddleware } from './common/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ApiKeysModule,
    AuthModule, // Must be imported before using JwtAuthGuard
    HealthModule, // Health check endpoints (public)
    SettingsModule,
    InvoicesModule,
    DeliveryModule,
    ServicesCatalogModule,
    UsersModule,
    SubscriptionsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // 🔒 Global JWT Guard - all endpoints protected by default
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
