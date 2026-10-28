import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryService } from '../delivery/delivery.service';
import { ZaloService } from '../delivery/zalo.service';
import { QueueStatus, QueueType } from '@prisma/client';

export interface EnqueueOptions {
  priority?: number;
  maxRetries?: number;
  delaySeconds?: number;
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private timer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly deliveryService: DeliveryService,
    private readonly zaloService: ZaloService,
  ) {}

  onModuleInit() {
    this.logger.log('🚀 RequestQueue Worker đã khởi tạo - Chu kỳ kiểm tra 5s');
    // Chạy định kỳ mỗi 5 giây để kiểm tra và xử lý các request đang chờ hoặc đến hạn thử lại
    this.timer = setInterval(() => {
      this.processPendingJobs().catch((err) => {
        this.logger.error('Lỗi trong chu kỳ xử lý hàng chờ:', err?.message);
      });
    }, 5000);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Thêm một request vào hàng chờ (Queue) để lưu trữ bền vững và tự động thử lại khi có lỗi
   */
  async enqueue(type: QueueType, payload: any, options: EnqueueOptions = {}) {
    const priority = options.priority || 0;
    const maxRetries = options.maxRetries || 5;
    const nextRunAt = options.delaySeconds
      ? new Date(Date.now() + options.delaySeconds * 1000)
      : new Date();

    const job = await this.prisma.requestQueue.create({
      data: {
        type,
        payload,
        priority,
        maxRetries,
        nextRunAt,
        status: QueueStatus.PENDING,
      },
    });

    this.logger.log(`📥 [Queue] Đã tiếp nhận job ${job.id} (Type: ${type}, Priority: ${priority})`);

    // Kích hoạt xử lý ngay lập tức để người dùng không phải chờ chu kỳ 5s
    setImmediate(() => {
      this.processPendingJobs().catch(() => undefined);
    });

    return job;
  }

  /**
   * Quét và xử lý các job đang ở trạng thái PENDING và đã tới giờ chạy (nextRunAt <= now)
   */
  async processPendingJobs() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = new Date();
      // Lấy tối đa 5 job sẵn sàng xử lý, ưu tiên priority cao trước
      const jobs = await this.prisma.requestQueue.findMany({
        where: {
          status: QueueStatus.PENDING,
          nextRunAt: { lte: now },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' },
        ],
        take: 5,
      });

      for (const job of jobs) {
        await this.executeJob(job);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Thực thi một job cụ thể
   */
  private async executeJob(job: any) {
    // Đánh dấu job chuyển sang PROCESSING (ngăn việc xử lý trùng lặp)
    try {
      await this.prisma.requestQueue.update({
        where: { id: job.id, status: QueueStatus.PENDING },
        data: { status: QueueStatus.PROCESSING },
      });
    } catch {
      // Job có thể đã được worker khác nhặt
      return;
    }

    this.logger.log(`⚙️ [Queue] Bắt đầu xử lý job ${job.id} (Type: ${job.type}, Lần thử: ${job.retryCount + 1}/${job.maxRetries})`);

    try {
      const result = await this.dispatchHandler(job.type, job.payload);

      // Xử lý thành công -> đánh dấu COMPLETED
      await this.prisma.requestQueue.update({
        where: { id: job.id },
        data: {
          status: QueueStatus.COMPLETED,
          result: result || {},
          errorMessage: null,
          processedAt: new Date(),
        },
      });

      this.logger.log(`✅ [Queue] Hoàn thành job ${job.id} thành công!`);
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      const nextRetryCount = job.retryCount + 1;

      if (nextRetryCount < job.maxRetries) {
        // Áp dụng exponential backoff: 5s, 10s, 20s, 40s, tối đa 300s
        const backoffSeconds = Math.min(300, Math.pow(2, nextRetryCount) * 5);
        const nextRunAt = new Date(Date.now() + backoffSeconds * 1000);

        await this.prisma.requestQueue.update({
          where: { id: job.id },
          data: {
            status: QueueStatus.PENDING,
            retryCount: nextRetryCount,
            errorMessage: errorMsg,
            nextRunAt,
          },
        });

        this.logger.warn(`⚠️ [Queue] Job ${job.id} thất bại (Lần ${nextRetryCount}/${job.maxRetries}): ${errorMsg}. Sẽ thử lại sau ${backoffSeconds}s`);
      } else {
        // Đã hết số lần thử lại -> FAILED
        await this.prisma.requestQueue.update({
          where: { id: job.id },
          data: {
            status: QueueStatus.FAILED,
            retryCount: nextRetryCount,
            errorMessage: errorMsg,
          },
        });

        this.logger.error(`❌ [Queue] Job ${job.id} THẤT BẠI HOÀN TOÀN sau ${nextRetryCount} lần thử: ${errorMsg}`);
      }
    }
  }

  /**
   * Phân luồng xử lý theo loại Job
   */
  private async dispatchHandler(type: QueueType, payload: any): Promise<any> {
    switch (type) {
      case QueueType.DELIVERY_EMAIL: {
        const { invoiceId, options, isPaymentSuccess } = payload;
        if (!invoiceId) throw new Error('Missing invoiceId in DELIVERY_EMAIL payload');
        if (isPaymentSuccess) {
          return await this.deliveryService.sendPaymentSuccessEmail(invoiceId, options);
        } else {
          return await this.deliveryService.sendInvoiceEmail(invoiceId, options);
        }
      }

      case QueueType.DELIVERY_ZALO: {
        const { isPaymentSuccess, zaloOptions } = payload;
        if (isPaymentSuccess) {
          const res = await this.zaloService.sendPaymentSuccessZalo(zaloOptions);
          if (!res.success) throw new Error(res.error || 'Lỗi gửi tin nhắn Zalo thanh toán');
          return res;
        } else {
          const res = await this.zaloService.sendInvoiceZalo(zaloOptions);
          if (!res.success) throw new Error(res.error || 'Lỗi gửi tin nhắn Zalo đăng ký');
          return res;
        }
      }

      case QueueType.PAYMENT_CONFIRMATION: {
        // Tự động kích hoạt email + zalo biên lai thanh toán
        const { invoiceId, emailOptions, zaloOptions } = payload;
        const results: any = {};
        if (emailOptions) {
          try {
            results.email = await this.deliveryService.sendPaymentSuccessEmail(invoiceId, emailOptions);
          } catch (err: any) {
            results.emailError = err?.message;
            throw err;
          }
        }
        if (zaloOptions) {
          const zRes = await this.zaloService.sendPaymentSuccessZalo(zaloOptions);
          results.zalo = zRes;
          if (!zRes.success) throw new Error(zRes.error || 'Lỗi gửi Zalo thanh toán thành công');
        }
        return results;
      }

      case QueueType.WEBHOOK_EVENT:
      case QueueType.QUICK_CREATE_INVOICE:
      case QueueType.CUSTOM:
      default: {
        this.logger.log(`[Queue] Xử lý generic payload cho type ${type}`);
        return { acknowledged: true, type, timestamp: new Date().toISOString() };
      }
    }
  }

  /**
   * Thống kê trạng thái hàng chờ
   */
  async getStats() {
    const [total, pending, processing, completed, failed] = await Promise.all([
      this.prisma.requestQueue.count(),
      this.prisma.requestQueue.count({ where: { status: QueueStatus.PENDING } }),
      this.prisma.requestQueue.count({ where: { status: QueueStatus.PROCESSING } }),
      this.prisma.requestQueue.count({ where: { status: QueueStatus.COMPLETED } }),
      this.prisma.requestQueue.count({ where: { status: QueueStatus.FAILED } }),
    ]);

    return { total, pending, processing, completed, failed };
  }

  /**
   * Lấy danh sách job
   */
  async getJobs(status?: QueueStatus, type?: QueueType, limit = 50, page = 1) {
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.requestQueue.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.requestQueue.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Thử lại một job đã thất bại
   */
  async retryJob(id: string) {
    const job = await this.prisma.requestQueue.findUnique({ where: { id } });
    if (!job) throw new Error('Job không tồn tại');

    const updated = await this.prisma.requestQueue.update({
      where: { id },
      data: {
        status: QueueStatus.PENDING,
        retryCount: 0,
        nextRunAt: new Date(),
        errorMessage: null,
      },
    });

    setImmediate(() => {
      this.processPendingJobs().catch(() => undefined);
    });

    return updated;
  }
}
