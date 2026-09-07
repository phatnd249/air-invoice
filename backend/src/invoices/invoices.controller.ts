import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  async getInvoices(@Query('status') status?: string, @Query('search') search?: string) {
    return this.invoicesService.getInvoices(status, search);
  }

  @Get('next-number')
  async getNextInvoiceNumber() {
    const nextNumber = await this.invoicesService.getNextInvoiceNumber();
    return { nextNumber };
  }

  @Get(':id')
  async getInvoiceById(@Param('id') id: string) {
    return this.invoicesService.getInvoiceById(id);
  }

  @Post()
  async createInvoice(@Body() dto: any) {
    return this.invoicesService.createInvoice(dto);
  }

  @Put(':id')
  async updateInvoice(@Param('id') id: string, @Body() dto: any) {
    return this.invoicesService.updateInvoice(id, dto);
  }

  @Delete(':id')
  async deleteInvoice(@Param('id') id: string) {
    return this.invoicesService.deleteInvoice(id);
  }
}
