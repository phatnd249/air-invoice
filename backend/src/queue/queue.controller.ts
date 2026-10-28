import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { Public } from '../auth/decorators/public.decorator';
import { QueueStatus, QueueType } from '@prisma/client';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Public() // Cho phép kiểm tra trạng thái hàng chờ
  @Get('stats')
  async getStats() {
    return this.queueService.getStats();
  }

  @Public() // Danh sách API hiện có và số request đang có của từng API
  @Get('apis')
  async getApiSummary() {
    return this.queueService.getApiSummary();
  }

  @Get('jobs')
  async getJobs(
    @Query('status') status?: QueueStatus,
    @Query('type') type?: QueueType,
    @Query('apiName') apiName?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.queueService.getJobs({
      status,
      type,
      apiName,
      search,
      limit: limit ? parseInt(limit, 10) : 50,
      page: page ? parseInt(page, 10) : 1,
    });
  }

  @Public() // Cho phép tiếp nhận request từ bên ngoài vào hàng chờ (Landing Page, N8N, Webhooks, Form)
  @Post('enqueue')
  async enqueue(
    @Body()
    body: {
      type: QueueType;
      payload: any;
      priority?: number;
      maxRetries?: number;
      delaySeconds?: number;
      apiName?: string;
      endpoint?: string;
      source?: string;
      title?: string;
      targetInfo?: string;
    },
    @Req() req: any,
  ) {
    const apiName =
      body.apiName ||
      req?.apiKey?.name ||
      (req?.headers?.['x-api-key'] ? 'API Key' : 'Hệ thống');

    const job = await this.queueService.enqueue(
      body.type || QueueType.CUSTOM,
      body.payload || {},
      {
        priority: body.priority,
        maxRetries: body.maxRetries,
        delaySeconds: body.delaySeconds,
        apiName,
        endpoint: body.endpoint || req?.originalUrl || '/api/queue/enqueue',
        source: body.source || (req?.apiKey ? `API Key: ${req.apiKey.name}` : 'External API'),
        title: body.title,
        targetInfo: body.targetInfo,
      },
    );

    return {
      success: true,
      message: 'Request đã được tiếp nhận vào hàng chờ thành công',
      jobId: job.id,
      apiName: job.apiName,
      status: job.status,
      type: job.type,
      nextRunAt: job.nextRunAt,
    };
  }

  @Post('jobs/:id/retry')
  async retryJob(@Param('id') id: string) {
    return this.queueService.retryJob(id);
  }

  @Delete('jobs/:id')
  async deleteJob(@Param('id') id: string) {
    return this.queueService.deleteJob(id);
  }

  @Post('jobs/bulk-delete')
  async bulkDeleteJobs(@Body() body: { ids: string[] }) {
    return this.queueService.deleteManyJobs(body.ids || []);
  }

  @Post('clear-completed')
  async clearCompleted() {
    return this.queueService.clearCompletedJobs();
  }

  @Post('process')
  async triggerProcess() {
    this.queueService.processPendingJobs().catch(() => undefined);
    return { success: true, message: 'Đã kích hoạt xử lý hàng chờ tuần tự' };
  }
}
