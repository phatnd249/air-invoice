import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// 🔒 Protected by global JwtAuthGuard + ADMIN-only RolesGuard
@UseGuards(RolesGuard)
@Roles('ADMIN')
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  async listApiKeys() {
    return this.apiKeysService.listApiKeys();
  }

  @Post()
  async createApiKey(@Body() body: { name: string; permissions?: string; expiresInDays?: number }) {
    return this.apiKeysService.createApiKey(body);
  }

  @Patch(':id/toggle')
  async toggleApiKey(@Param('id') id: string) {
    return this.apiKeysService.toggleApiKey(id);
  }

  @Delete(':id')
  async deleteApiKey(@Param('id') id: string) {
    return this.apiKeysService.deleteApiKey(id);
  }
}
