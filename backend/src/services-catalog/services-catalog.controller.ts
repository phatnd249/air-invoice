import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ServicesCatalogService } from './services-catalog.service';

// 🔒 Protected by global JwtAuthGuard in app.module.ts
@Controller('services')
export class ServicesCatalogController {
  constructor(private readonly servicesCatalogService: ServicesCatalogService) {}

  // ================= NHÓM GÓI DỊCH VỤ (SERVICE GROUPS) =================
  // Đặt trước các route có :id để tránh NestJS match nhầm

  @Get('groups')
  async getAllGroups() {
    return this.servicesCatalogService.getAllGroups();
  }

  @Get('groups/:id')
  async getGroupById(@Param('id') id: string) {
    return this.servicesCatalogService.getGroupById(id);
  }

  @Post('groups')
  async createGroup(@Body() dto: any) {
    return this.servicesCatalogService.createGroup(dto);
  }

  @Put('groups/:id')
  async updateGroup(@Param('id') id: string, @Body() dto: any) {
    return this.servicesCatalogService.updateGroup(id, dto);
  }

  @Delete('groups/:id')
  async deleteGroup(@Param('id') id: string) {
    return this.servicesCatalogService.deleteGroup(id);
  }

  // ================= TỰ ĐỘNG LƯU GÓI TỪ HÓA ĐƠN =================

  @Post('auto-save')
  async autoSaveService(@Body() dto: any) {
    return this.servicesCatalogService.findOrCreateService(dto);
  }

  // ================= KÉO THẢ GÁN GÓI VÀO NHÓM =================

  @Put(':id/assign-group')
  async assignServiceGroup(
    @Param('id') id: string,
    @Body('groupId') groupId: string | null,
  ) {
    return this.servicesCatalogService.assignServiceGroup(id, groupId);
  }

  // ================= QUẢN LÝ GÓI DỊCH VỤ =================

  @Get()
  async getAllServices(
    @Query('search') search?: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.servicesCatalogService.getAllServices(search, groupId);
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
