import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { SettingsModule } from './settings/settings.module';
import { InvoicesModule } from './invoices/invoices.module';
import { AuthModule } from './auth/auth.module';
import { DeliveryModule } from './delivery/delivery.module';
import { ServicesCatalogModule } from './services-catalog/services-catalog.module';
import { UsersModule } from './users/users.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SettingsModule,
    InvoicesModule,
    AuthModule,
    DeliveryModule,
    ServicesCatalogModule,
    UsersModule,
    SubscriptionsModule,
  ],
})
export class AppModule { }
