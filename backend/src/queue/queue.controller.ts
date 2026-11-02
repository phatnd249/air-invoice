import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { Public } from '../auth/decorators/public.decorator';
import { QueueStatus, QueueType } from '@prisma/client';
import { RateLimit } from '../common/rate-limit.decorator';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  // 🔒 Chỉ người dùng đã đăng nhập / API key mới xem được thống kê hệ thống
  @Get('stats')
  async getStats() {
    return this.queueService.getStats();
  }

  // 🔒 Danh sách API và số request là thông tin nội bộ
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
  @RateLimit({
    limit: 60,
    windowMs: 60_000,
    message: 'Bạn đã gửi quá nhiều yêu cầu vào hàng chờ. Vui lòng thử lại sau.',
  })
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
    const requestedType = body.type || QueueType.CUSTOM;

    if (!Object.values(QueueType).includes(requestedType)) {
      throw new BadRequestException('Loại job không hợp lệ');
    }

    // 🔒 Request công khai chỉ được tạo job CUSTOM. Các loại job có tác dụng
    // phụ (gửi email/Zalo, xác nhận thanh toán...) bắt buộc phải có API Key
    // hoặc tài khoản ADMIN để tránh bị lợi dụng spam/đổi trạng thái hóa đơn.
    const isTrustedCaller =
      !!req?.apiKey ||
      req?.user?.role === 'ADMIN' ||
      req?.user?.role === 'API_KEY';

    if (!isTrustedCaller && requestedType !== QueueType.CUSTOM) {
      throw new ForbiddenException(
        'Loại job này yêu cầu API Key hoặc tài khoản quản trị',
      );
    }

    const toBoundedInt = (
      value: unknown,
      fallback: number,
      min: number,
      max: number,
    ): number => {
      const num = Number(value);
      if (!Number.isFinite(num)) return fallback;
      return Math.min(Math.max(Math.trunc(num), min), max);
    };

    const apiName =
      body.apiName ||
      req?.apiKey?.name ||
      (req?.headers?.['x-api-key'] ? 'API Key' : 'Hệ thống');

    const job = await this.queueService.enqueue(
      requestedType,
      body.payload && typeof body.payload === 'object' ? body.payload : {},
      {
        priority: toBoundedInt(body.priority, 0, 0, 100),
        maxRetries: toBoundedInt(body.maxRetries, 5, 1, 10),
        delaySeconds: toBoundedInt(body.delaySeconds, 0, 0, 604800),
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
