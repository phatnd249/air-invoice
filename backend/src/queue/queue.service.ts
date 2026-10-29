import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryService } from '../delivery/delivery.service';
import { ZaloService } from '../delivery/zalo.service';
import { QueueStatus, QueueType } from '@prisma/client';

export interface EnqueueOptions {
  priority?: number;
  maxRetries?: number;
  delaySeconds?: number;
  apiName?: string;
  endpoint?: string;
  source?: string;
  title?: string;
  targetInfo?: string;
}

// Bảng thời gian thử lại sau vài phút khi có lỗi: 2 phút, 5 phút, 10 phút, 15 phút, 30 phút
const RETRY_DELAYS_MINUTES = [2, 5, 10, 15, 30];

/**
 * Lỗi "vĩnh viễn": thử lại 5 lần cũng không thể thành công
 * (email/số điện thoại sai, domain thử nghiệm bị Resend chặn, số chưa có Zalo...).
 * Gặp các lỗi này thì dừng ngay, tránh spam log và giữ job trong hàng chờ vô ích.
 */
const NON_RETRYABLE_PATTERNS: RegExp[] = [
  /Resend API HTTP 4(?!08|29)\d\d/i, // 4xx trừ 408 timeout / 429 rate limit
  /Invalid `?to`? field/i,
  /domain thử nghiệm/i,
  /Không thể resolve bất kỳ recipient nào/i,
  /không có địa chỉ email/i,
  /Số điện thoại không hợp lệ/i,
  /Hóa đơn không tồn tại/i,
];

function isNonRetryableError(message: string): boolean {
  return NON_RETRYABLE_PATTERNS.some((pattern) => pattern.test(message));
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
    this.logger.log('🚀 RequestQueue Worker đã khởi tạo - Chu kỳ tuần tự 5s');
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
   * Thêm một request vào hàng chờ (Queue) để lưu trữ bền vững, chạy tuần tự và tự động thử lại khi có lỗi
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
        apiName: options.apiName || 'Hệ thống',
        endpoint: options.endpoint || '/api/queue/enqueue',
        source: options.source || 'Tự động',
        title: options.title || `Xử lý tác vụ ${type}`,
        targetInfo: options.targetInfo || null,
      },
    });

    this.logger.log(
      `📥 [Queue] Đã tiếp nhận job ${job.id} (API: ${job.apiName}, Type: ${type}, Priority: ${priority})`,
    );

    // Kích hoạt xử lý ngay lập tức để chạy tuần tự không cần chờ chu kỳ 5s
    setImmediate(() => {
      this.processPendingJobs().catch(() => undefined);
    });

    return job;
  }

  /**
   * Quét và xử lý các job đang ở trạng thái PENDING và đã tới giờ chạy (nextRunAt <= now).
   * Đảm bảo chạy TUẦN TỰ (chạy lần lượt từng request, concurrency = 1).
   */
  async processPendingJobs() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = new Date();
      // Lấy tối đa 10 job sẵn sàng xử lý, ưu tiên priority cao trước, sau đó tới createdAt cũ nhất (FIFO)
      const jobs = await this.prisma.requestQueue.findMany({
        where: {
          status: QueueStatus.PENDING,
          nextRunAt: { lte: now },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' },
        ],
        take: 10,
      });

      // Chạy LẦN LƯỢT (tuần tự từng job một)
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
      // Job có thể đã được worker xử lý
      return;
    }

    this.logger.log(
      `⚙️ [Queue] Bắt đầu xử lý tuần tự job ${job.id} (API: ${job.apiName}, Type: ${job.type}, Lần thử: ${
        job.retryCount + 1
      }/${job.maxRetries})`,
    );

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

      this.logger.log(`✅ [Queue] Hoàn thành job ${job.id} (${job.title || job.type}) thành công!`);
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      const nextRetryCount = job.retryCount + 1;
      const permanent = isNonRetryableError(errorMsg);

      if (!permanent && nextRetryCount < job.maxRetries) {
        // Gửi sau vài phút: lần 1 (2p), lần 2 (5p), lần 3 (10p), lần 4 (15p), lần 5 (30p)
        const delayMinutes =
          RETRY_DELAYS_MINUTES[Math.min(nextRetryCount - 1, RETRY_DELAYS_MINUTES.length - 1)] || 5;
        const nextRunAt = new Date(Date.now() + delayMinutes * 60 * 1000);

        await this.prisma.requestQueue.update({
          where: { id: job.id },
          data: {
            status: QueueStatus.PENDING,
            retryCount: nextRetryCount,
            errorMessage: `[Lần ${nextRetryCount}/${job.maxRetries} lỗi - Sẽ gửi lại sau ${delayMinutes} phút]: ${errorMsg}`,
            nextRunAt,
          },
        });

        this.logger.warn(
          `⚠️ [Queue] Job ${job.id} (${job.title || job.type}) gửi lỗi lần ${nextRetryCount}/${
            job.maxRetries
          }: ${errorMsg}. Sẽ tự động thử lại sau ${delayMinutes} phút.`,
        );
      } else {
        // Hết lượt thử lại HOẶC lỗi không thể khắc phục -> DỪNG, nhưng vẫn giữ bản ghi để quản trị viên kiểm tra
        const reason = permanent
          ? `[Lỗi không thể khắc phục - dừng ngay, không thử lại]: ${errorMsg}`
          : `[Đã dừng thử lại sau ${nextRetryCount} lần thất bại]: ${errorMsg}`;

        await this.prisma.requestQueue.update({
          where: { id: job.id },
          data: {
            status: QueueStatus.FAILED,
            retryCount: nextRetryCount,
            errorMessage: reason,
            processedAt: new Date(),
          },
        });

        this.logger.error(
          permanent
            ? `❌ [Queue] Job ${job.id} (${job.title || job.type}) gặp lỗi không thể khắc phục, dừng ngay (lần ${nextRetryCount}): ${errorMsg}`
            : `❌ [Queue] Job ${job.id} (${job.title || job.type}) ĐÃ DỪNG THỬ LẠI sau ${nextRetryCount} lần: ${errorMsg}. Bản ghi vẫn được lưu trong hàng chờ.`,
        );
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
        if (!invoiceId) throw new Error('Thiếu invoiceId trong dữ liệu DELIVERY_EMAIL');
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
        const { invoiceId, emailOptions, zaloOptions } = payload;
        const results: any = {};
        if (emailOptions) {
          results.email = await this.deliveryService.sendPaymentSuccessEmail(invoiceId, emailOptions);
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
   * Thống kê tổng quan trạng thái hàng chờ
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
   * Danh sách các API hiện có hiển thị số lượng request của từng API đó
   */
  async getApiSummary() {
    // 1. Lấy danh sách API Key đã được đăng ký trong hệ thống
    const apiKeys = await this.prisma.apiKey.findMany({
      select: {
        id: true,
        name: true,
        prefix: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Thống kê theo apiName từ bảng RequestQueue
    const groupStats = await this.prisma.requestQueue.groupBy({
      by: ['apiName', 'status'],
      _count: { _all: true },
    });

    // Gom dữ liệu theo từng apiName
    const statsMap: Record<
      string,
      {
        total: number;
        pending: number;
        processing: number;
        completed: number;
        failed: number;
      }
    > = {};

    for (const row of groupStats) {
      const name = row.apiName || 'Hệ thống';
      if (!statsMap[name]) {
        statsMap[name] = { total: 0, pending: 0, processing: 0, completed: 0, failed: 0 };
      }
      const count = row._count._all;
      statsMap[name].total += count;
      if (row.status === QueueStatus.PENDING) statsMap[name].pending += count;
      if (row.status === QueueStatus.PROCESSING) statsMap[name].processing += count;
      if (row.status === QueueStatus.COMPLETED) statsMap[name].completed += count;
      if (row.status === QueueStatus.FAILED) statsMap[name].failed += count;
    }

    // 3. Lấy thời gian request gần nhất cho mỗi apiName
    const latestRequests = await this.prisma.requestQueue.findMany({
      orderBy: { createdAt: 'desc' },
      distinct: ['apiName'],
      select: { apiName: true, endpoint: true, createdAt: true },
    });
    const latestMap = new Map<string, { endpoint?: string | null; lastRequestAt: Date }>();
    for (const r of latestRequests) {
      if (r.apiName) {
        latestMap.set(r.apiName, { endpoint: r.endpoint, lastRequestAt: r.createdAt });
      }
    }

    // 4. Tổng hợp danh sách API: Kết hợp API Key đã cấu hình và các API xuất hiện trong Queue
    const resultList: Array<{
      apiName: string;
      endpoint?: string;
      isApiKey: boolean;
      isActive?: boolean;
      total: number;
      pending: number;
      processing: number;
      completed: number;
      failed: number;
      lastRequestAt?: Date | null;
    }> = [];

    const processedNames = new Set<string>();

    // Duyệt qua API Key đã đăng ký
    for (const key of apiKeys) {
      processedNames.add(key.name);
      const counts = statsMap[key.name] || { total: 0, pending: 0, processing: 0, completed: 0, failed: 0 };
      const latest = latestMap.get(key.name);
      resultList.push({
        apiName: key.name,
        endpoint: latest?.endpoint || '/api/invoices/quick-create',
        isApiKey: true,
        isActive: key.isActive,
        total: counts.total,
        pending: counts.pending,
        processing: counts.processing,
        completed: counts.completed,
        failed: counts.failed,
        lastRequestAt: latest?.lastRequestAt || key.lastUsedAt || null,
      });
    }

    // Duyệt qua các API khác trong Queue (ví dụ: 'AI WRITER', 'Hệ thống', 'Landing Page Form', 'Tạo Hóa Đơn Nhanh')
    for (const [name, counts] of Object.entries(statsMap)) {
      if (!processedNames.has(name)) {
        processedNames.add(name);
        const latest = latestMap.get(name);
        resultList.push({
          apiName: name,
          endpoint: latest?.endpoint || '/api/invoices/quick-create',
          isApiKey: false,
          isActive: true,
          total: counts.total,
          pending: counts.pending,
          processing: counts.processing,
          completed: counts.completed,
          failed: counts.failed,
          lastRequestAt: latest?.lastRequestAt || null,
        });
      }
    }

    // Sắp xếp: API có request đang chờ hoặc có nhiều request hơn lên đầu
    resultList.sort((a, b) => b.pending - a.pending || b.total - a.total);

    return resultList;
  }

  /**
   * Lấy danh sách job trong hàng chờ với bộ lọc linh hoạt
   */
  async getJobs(params: {
    status?: QueueStatus;
    type?: QueueType;
    apiName?: string;
    search?: string;
    limit?: number;
    page?: number;
  }) {
    const { status, type, apiName, search, limit = 50, page = 1 } = params;
    const where: any = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (apiName && apiName !== 'ALL') where.apiName = apiName;

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { targetInfo: { contains: q, mode: 'insensitive' } },
        { apiName: { contains: q, mode: 'insensitive' } },
        { endpoint: { contains: q, mode: 'insensitive' } },
        { id: { contains: q, mode: 'insensitive' } },
        { errorMessage: { contains: q, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.requestQueue.findMany({
        where,
        orderBy: [
          // Ưu tiên trạng thái PENDING & PROCESSING lên trước
          { createdAt: 'desc' },
        ],
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
   * Thử lại ngay một job (Manual Retry)
   */
  async retryJob(id: string) {
    const job = await this.prisma.requestQueue.findUnique({ where: { id } });
    if (!job) throw new Error('Job không tồn tại trong hàng chờ');

    const updated = await this.prisma.requestQueue.update({
      where: { id },
      data: {
        status: QueueStatus.PENDING,
        retryCount: 0,
        nextRunAt: new Date(),
        errorMessage: null,
      },
    });

    this.logger.log(`🔄 [Queue] Yêu cầu thử lại thủ công job ${id} (API: ${job.apiName})`);

    // Kích hoạt xử lý tuần tự ngay lập tức
    setImmediate(() => {
      this.processPendingJobs().catch(() => undefined);
    });

    return updated;
  }

  /**
   * Xóa 1 job khỏi hàng chờ
   */
  async deleteJob(id: string) {
    return this.prisma.requestQueue.delete({ where: { id } });
  }

  /**
   * Xóa nhiều job đã chọn khỏi hàng chờ
   */
  async deleteManyJobs(ids: string[]) {
    if (!ids || ids.length === 0) return { count: 0 };
    return this.prisma.requestQueue.deleteMany({
      where: { id: { in: ids } },
    });
  }

  /**
   * Xóa tất cả các job đã hoàn thành thành công để dọn dẹp hàng chờ
   */
  async clearCompletedJobs() {
    return this.prisma.requestQueue.deleteMany({
      where: { status: QueueStatus.COMPLETED },
    });
  }
}
