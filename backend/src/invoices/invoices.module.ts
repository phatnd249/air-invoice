import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { SettingsModule } from '../settings/settings.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { QueueModule } from '../queue/queue.module';
import { ServicesCatalogModule } from '../services-catalog/services-catalog.module';

@Module({
  imports: [SettingsModule, DeliveryModule, QueueModule, ServicesCatalogModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
