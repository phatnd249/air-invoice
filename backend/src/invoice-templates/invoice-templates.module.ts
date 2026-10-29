import { Module } from '@nestjs/common';
import { InvoiceTemplatesService } from './invoice-templates.service';
import { InvoiceTemplatesController } from './invoice-templates.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InvoiceTemplatesController],
  providers: [InvoiceTemplatesService],
  exports: [InvoiceTemplatesService],
})
export class InvoiceTemplatesModule {}
