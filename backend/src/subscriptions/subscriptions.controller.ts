import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('stats')
  async getStats() {
    return this.subscriptionsService.getStats();
  }

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.subscriptionsService.findAll(search, status);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
    return this.subscriptionsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }

  @Post(':id/preview-alert')
  async previewExpiryAlert(
    @Param('id') id: string,
    @Body('subject') subject?: string,
    @Body('message') message?: string,
  ) {
    return this.subscriptionsService.previewAlertEmail(id, subject, message);
  }

  @Post(':id/send-alert')
  async sendExpiryAlert(
    @Param('id') id: string,
    @Body('subject') subject?: string,
    @Body('message') message?: string,
  ) {
    return this.subscriptionsService.sendExpiryAlert(id, subject, message);
  }

  @Post('check-and-alert')
  async checkAndSendBatchAlerts() {
    return this.subscriptionsService.checkAndSendBatchAlerts();
  }

  @Post('bulk-send-alert')
  async bulkSendExpiryAlerts(
    @Body('ids') ids: string[],
    @Body('subject') subject?: string,
    @Body('message') message?: string,
  ) {
    return this.subscriptionsService.bulkSendExpiryAlerts(ids, subject, message);
  }
}
