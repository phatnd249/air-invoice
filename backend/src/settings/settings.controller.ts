import { Controller, Get, Put, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';

// 🔒 Protected by global JwtAuthGuard in app.module.ts
// Additional RolesGuard for ADMIN-only endpoints
@UseGuards(RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Roles('ADMIN')
  @Put()
  async updateSettings(@Body() data: any) {
    return this.settingsService.updateSettings(data);
  }
}
