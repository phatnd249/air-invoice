import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';

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
