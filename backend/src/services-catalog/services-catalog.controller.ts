import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ServicesCatalogService } from './services-catalog.service';

@Controller('services')
export class ServicesCatalogController {
  constructor(private readonly servicesCatalogService: ServicesCatalogService) {}

  @Get()
  async getAllServices(@Query('search') search?: string) {
    return this.servicesCatalogService.getAllServices(search);
  }

  @Get(':id')
  async getServiceById(@Param('id') id: string) {
    return this.servicesCatalogService.getServiceById(id);
  }

  @Post()
  async createService(@Body() dto: any) {
    return this.servicesCatalogService.createService(dto);
  }

  @Put(':id')
  async updateService(@Param('id') id: string, @Body() dto: any) {
    return this.servicesCatalogService.updateService(id, dto);
  }

  @Delete(':id')
  async deleteService(@Param('id') id: string) {
    return this.servicesCatalogService.deleteService(id);
  }
}
