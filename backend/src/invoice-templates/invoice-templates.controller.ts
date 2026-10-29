import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Patch,
} from '@nestjs/common';
import {
  InvoiceTemplatesService,
  CreateInvoiceTemplateDto,
} from './invoice-templates.service';

@Controller('invoice-templates')
export class InvoiceTemplatesController {
  constructor(
    private readonly invoiceTemplatesService: InvoiceTemplatesService,
  ) {}

  @Get()
  async findAll() {
    return this.invoiceTemplatesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.invoiceTemplatesService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateInvoiceTemplateDto) {
    return this.invoiceTemplatesService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateInvoiceTemplateDto>,
  ) {
    return this.invoiceTemplatesService.update(id, dto);
  }

  @Patch(':id/set-default')
  async setDefault(@Param('id') id: string) {
    return this.invoiceTemplatesService.setDefault(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.invoiceTemplatesService.delete(id);
  }
}

