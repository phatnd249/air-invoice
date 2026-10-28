import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { SettingsModule } from '../settings/settings.module';
import { DeliveryModule } from '../delivery/delivery.module';

@Module({
  imports: [SettingsModule, DeliveryModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
