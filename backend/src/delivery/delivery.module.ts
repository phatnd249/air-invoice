import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { PdfService } from '../document/pdf.service';

@Module({
  controllers: [DeliveryController],
  providers: [DeliveryService, PdfService],
  exports: [DeliveryService, PdfService],
})
export class DeliveryModule {}
