import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MessageTemplatesService, MessageTemplateDto } from './message-templates.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

// 🔒 Protected by global JwtAuthGuard in app.module.ts
@Controller('message-templates')
export class MessageTemplatesController {
  constructor(private readonly messageTemplatesService: MessageTemplatesService) {}

  @Get()
  async getAllTemplates(
    @Query('channel') channel?: 'ZALO' | 'EMAIL',
    @Query('triggerType') triggerType?: string,
  ) {
    return this.messageTemplatesService.getAllTemplates(channel, triggerType);
  }

  @Get(':id')
  async getTemplateById(@Param('id') id: string) {
    return this.messageTemplatesService.getTemplateById(id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post()
  async createTemplate(@Body() dto: MessageTemplateDto) {
    return this.messageTemplatesService.createTemplate(dto);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Put(':id')
  async updateTemplate(@Param('id') id: string, @Body() dto: Partial<MessageTemplateDto>) {
    return this.messageTemplatesService.updateTemplate(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  async deleteTemplate(@Param('id') id: string) {
    return this.messageTemplatesService.deleteTemplate(id);
  }

  @Post('preview')
  async previewTemplate(
    @Body('template') template: any,
    @Body('sampleData') sampleData: any,
  ) {
    return this.messageTemplatesService.renderTemplateContent(template, sampleData || {});
  }
}

