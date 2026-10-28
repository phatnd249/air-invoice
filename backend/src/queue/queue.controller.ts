import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
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

  @Get('jobs')
  async getJobs(
    @Query('status') status?: QueueStatus,
    @Query('type') type?: QueueType,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.queueService.getJobs(
      status,
      type,
      limit ? parseInt(limit, 10) : 50,
      page ? parseInt(page, 10) : 1,
    );
  }

  @Public() // Cho phép đẩy job/request từ bên ngoài vào hàng chờ (Landing Page, N8N, Webhooks)
  @Post('enqueue')
  async enqueue(
    @Body()
    body: {
      type: QueueType;
      payload: any;
      priority?: number;
      maxRetries?: number;
      delaySeconds?: number;
    },
  ) {
    const job = await this.queueService.enqueue(
      body.type || QueueType.CUSTOM,
      body.payload || {},
      {
        priority: body.priority,
        maxRetries: body.maxRetries,
        delaySeconds: body.delaySeconds,
      },
    );

    return {
      success: true,
      message: 'Request đã được tiếp nhận vào hàng chờ thành công',
      jobId: job.id,
      status: job.status,
      type: job.type,
      nextRunAt: job.nextRunAt,
    };
  }

  @Post('jobs/:id/retry')
  async retryJob(@Param('id') id: string) {
    return this.queueService.retryJob(id);
  }

  @Post('process')
  async triggerProcess() {
    this.queueService.processPendingJobs().catch(() => undefined);
    return { success: true, message: 'Đã kích hoạt xử lý hàng chờ' };
  }
}
