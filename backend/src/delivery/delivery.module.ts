import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { ZaloService } from './zalo.service';
import { DeliveryController } from './delivery.controller';
import { PdfService } from '../document/pdf.service';
import { MessageTemplatesModule } from '../message-templates/message-templates.module';

@Module({
  imports: [MessageTemplatesModule],
  controllers: [DeliveryController],
  providers: [DeliveryService, ZaloService, PdfService],
  exports: [DeliveryService, ZaloService, PdfService],
})
export class DeliveryModule {}
