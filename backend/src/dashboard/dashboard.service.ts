import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus, QueueStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tính toán khoảng thời gian từ chuỗi query
   */
  private getDateFilter(period?: string): { gte?: Date; lte?: Date } | null {
    const now = new Date();
    if (!period || period === 'all') return null;

    if (period === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { gte: start, lte: end };
    }

    if (period === '7d') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { gte: start, lte: now };
    }

    if (period === '30d') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { gte: start, lte: now };
    }

    if (period === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return { gte: start, lte: now };
    }

    if (period === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { gte: start, lte: end };
    }

    if (period === 'this_quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), currentQuarter * 3, 1, 0, 0, 0, 0);
      return { gte: start, lte: now };
    }

    if (period === 'this_year') {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      return { gte: start, lte: now };
    }

    return null;
  }

  /**
   * Tổng hợp toàn bộ số liệu thống kê cho Dashboard
   */
  async getStats(period?: string) {
    const now = new Date();
    const dateRange = this.getDateFilter(period);

    // 1. Lọc hóa đơn theo khoảng thời gian (không tính thùng rác)
    const invoiceWhere: any = { deletedAt: null };
    if (dateRange) {
      invoiceWhere.issueDate = {
        ...(dateRange.gte ? { gte: dateRange.gte } : {}),
        ...(dateRange.lte ? { lte: dateRange.lte } : {}),
      };
    }

    // 2. Fetch danh sách hóa đơn trong kỳ
    const periodInvoices = await this.prisma.invoice.findMany({
      where: invoiceWhere,
      select: {
        id: true,
        grandTotal: true,
        status: true,
        issueDate: true,
        createdAt: true,
      },
    });

    // 3. Tính toán các chỉ số tài chính trong kỳ
    let paidRevenue = 0;
    let pendingRevenue = 0;
    let totalInvoicedRevenue = 0;
    let paidCount = 0;
    let issuedCount = 0;
    let sentCount = 0;
    let cancelledCount = 0;

    for (const inv of periodInvoices) {
      const amt = inv.grandTotal || 0;
      if (inv.status === InvoiceStatus.PAID) {
        paidRevenue += amt;
        paidCount++;
        totalInvoicedRevenue += amt;
      } else if (inv.status === InvoiceStatus.ISSUED) {
        pendingRevenue += amt;
        issuedCount++;
        totalInvoicedRevenue += amt;
      } else if (inv.status === InvoiceStatus.SENT) {
        pendingRevenue += amt;
        sentCount++;
        totalInvoicedRevenue += amt;
      } else if (inv.status === InvoiceStatus.CANCELLED) {
        cancelledCount++;
      }
    }

    const totalInvoiceCount = periodInvoices.length;
    const activeInvoiceCount = totalInvoiceCount - cancelledCount;
    const collectionRate = activeInvoiceCount > 0 ? Math.round((paidCount / activeInvoiceCount) * 100) : 0;
    const avgPaidOrderValue = paidCount > 0 ? Math.round(paidRevenue / paidCount) : 0;

    // 4. Tính toán doanh thu tháng này vs tháng trước (để so sánh tăng trưởng)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [thisMonthInvoices, lastMonthInvoices] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: {
          deletedAt: null,
          status: InvoiceStatus.PAID,
          issueDate: { gte: thisMonthStart },
        },
        _sum: { grandTotal: true },
        _count: { id: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          deletedAt: null,
          status: InvoiceStatus.PAID,
          issueDate: { gte: lastMonthStart, lte: lastMonthEnd },
        },
        _sum: { grandTotal: true },
        _count: { id: true },
      }),
    ]);

    const thisMonthRevenue = thisMonthInvoices._sum.grandTotal || 0;
    const lastMonthRevenue = lastMonthInvoices._sum.grandTotal || 0;
    let growthRate = 0;
    if (lastMonthRevenue > 0) {
      growthRate = Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
    } else if (thisMonthRevenue > 0) {
      growthRate = 100;
    }

    // 5. Thống kê Khách hàng & Dịch vụ (Subscriptions)
    const rawSubs = await this.prisma.customerSubscription.findMany();
    let subActive = 0;
    let subExpiringSoon = 0;
    let subExpired = 0;
    let subCancelled = 0;
    let subTotalAnnualValue = 0;

    const urgentSubscriptions: any[] = [];

    for (const sub of rawSubs) {
      const end = new Date(sub.endDate);
      const diffTime = end.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let calculatedStatus = sub.status;
      if (sub.status !== 'CANCELLED') {
        subTotalAnnualValue += sub.servicePrice || 0;
        if (daysRemaining < 0) {
          calculatedStatus = 'EXPIRED';
          subExpired++;
        } else if (daysRemaining <= 30) {
          calculatedStatus = 'EXPIRING_SOON';
          subExpiringSoon++;
        } else {
          calculatedStatus = 'ACTIVE';
          subActive++;
        }

        // Lưu vào danh sách cảnh báo gấp nếu đã quá hạn hoặc còn <= 30 ngày
        if (daysRemaining <= 30) {
          urgentSubscriptions.push({
            id: sub.id,
            customerName: sub.customerName,
            customerPhone: sub.customerPhone,
            customerEmail: sub.customerEmail,
            customerCompany: sub.customerCompany,
            serviceName: sub.serviceName,
            servicePrice: sub.servicePrice,
            endDate: sub.endDate,
            daysRemaining,
            status: calculatedStatus,
          });
        }
      } else {
        subCancelled++;
      }
    }

    // Sắp xếp các gói dịch vụ sắp hết hạn tăng dần (quá hạn trước, còn ít ngày nhất trước)
    urgentSubscriptions.sort((a, b) => a.daysRemaining - b.daysRemaining);
    const topUrgentSubscriptions = urgentSubscriptions.slice(0, 6);

    // Ước tính MRR (Doanh thu định kỳ hàng tháng): giả định chu kỳ 1 năm thì chia 12
    const estimatedMRR = Math.round(subTotalAnnualValue / 12);

    // 6. Thống kê Hàng chờ Request & Gửi tin (Queue)
    const [qTotal, qCompleted, qPending, qProcessing, qFailed] = await Promise.all([
      this.prisma.requestQueue.count(),
      this.prisma.requestQueue.count({ where: { status: QueueStatus.COMPLETED } }),
      this.prisma.requestQueue.count({ where: { status: QueueStatus.PENDING } }),
      this.prisma.requestQueue.count({ where: { status: QueueStatus.PROCESSING } }),
      this.prisma.requestQueue.count({ where: { status: QueueStatus.FAILED } }),
    ]);

    const queueSuccessRate = qTotal > 0 ? Math.round((qCompleted / qTotal) * 100) : 100;

    // 7. Biểu đồ xu hướng doanh thu 6 tháng gần nhất (Monthly Trend)
    const monthlyTrend: Array<{
      monthKey: string;
      label: string;
      paidRevenue: number;
      pendingRevenue: number;
      paidCount: number;
      totalCount: number;
    }> = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const label = `T${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      // Query nhanh trong tháng
      const monthInvs = await this.prisma.invoice.findMany({
        where: {
          deletedAt: null,
          issueDate: { gte: mStart, lte: mEnd },
        },
        select: { grandTotal: true, status: true },
      });

      let mPaidRev = 0;
      let mPendingRev = 0;
      let mPaidCount = 0;

      for (const inv of monthInvs) {
        if (inv.status === InvoiceStatus.PAID) {
          mPaidRev += inv.grandTotal || 0;
          mPaidCount++;
        } else if (inv.status === InvoiceStatus.ISSUED || inv.status === InvoiceStatus.SENT) {
          mPendingRev += inv.grandTotal || 0;
        }
      }

      monthlyTrend.push({
        monthKey,
        label,
        paidRevenue: mPaidRev,
        pendingRevenue: mPendingRev,
        paidCount: mPaidCount,
        totalCount: monthInvs.length,
      });
    }

    // 8. Cơ cấu trạng thái hóa đơn (Status Breakdown)
    const statusDistribution = [
      {
        status: 'PAID',
        label: 'Đã thanh toán',
        count: paidCount,
        amount: paidRevenue,
        percentage: totalInvoiceCount > 0 ? Math.round((paidCount / totalInvoiceCount) * 100) : 0,
        color: '#10b981', // emerald-500
      },
      {
        status: 'ISSUED',
        label: 'Đã phát hành',
        count: issuedCount,
        amount: periodInvoices.filter((i) => i.status === InvoiceStatus.ISSUED).reduce((s, c) => s + c.grandTotal, 0),
        percentage: totalInvoiceCount > 0 ? Math.round((issuedCount / totalInvoiceCount) * 100) : 0,
        color: '#3b82f6', // blue-500
      },
      {
        status: 'SENT',
        label: 'Đã gửi khách',
        count: sentCount,
        amount: periodInvoices.filter((i) => i.status === InvoiceStatus.SENT).reduce((s, c) => s + c.grandTotal, 0),
        percentage: totalInvoiceCount > 0 ? Math.round((sentCount / totalInvoiceCount) * 100) : 0,
        color: '#f59e0b', // amber-500
      },
      {
        status: 'CANCELLED',
        label: 'Đã hủy',
        count: cancelledCount,
        amount: periodInvoices.filter((i) => i.status === InvoiceStatus.CANCELLED).reduce((s, c) => s + c.grandTotal, 0),
        percentage: totalInvoiceCount > 0 ? Math.round((cancelledCount / totalInvoiceCount) * 100) : 0,
        color: '#94a3b8', // slate-400
      },
    ];

    // 9. Top 5 gói dịch vụ bán chạy nhất (Top Services)
    const items = await this.prisma.invoiceItem.findMany({
      where: {
        invoice: {
          deletedAt: null,
          status: { in: [InvoiceStatus.PAID, InvoiceStatus.ISSUED, InvoiceStatus.SENT] },
          ...(dateRange
            ? {
                issueDate: {
                  ...(dateRange.gte ? { gte: dateRange.gte } : {}),
                  ...(dateRange.lte ? { lte: dateRange.lte } : {}),
                },
              }
            : {}),
        },
      },
      select: {
        name: true,
        quantity: true,
        amount: true,
      },
    });

    const serviceMap = new Map<string, { quantity: number; revenue: number }>();
    let totalServicesRevenue = 0;

    for (const it of items) {
      const name = (it.name || 'Dịch vụ khác').trim();
      const existing = serviceMap.get(name) || { quantity: 0, revenue: 0 };
      existing.quantity += it.quantity || 1;
      existing.revenue += it.amount || 0;
      totalServicesRevenue += it.amount || 0;
      serviceMap.set(name, existing);
    }

    const topServices = Array.from(serviceMap.entries())
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        revenue: data.revenue,
        percentage: totalServicesRevenue > 0 ? Math.round((data.revenue / totalServicesRevenue) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 10. Danh sách 6 hóa đơn mới nhất (Recent Invoices)
    const recentInvoices = await this.prisma.invoice.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        invoiceNumber: true,
        buyerName: true,
        buyerEmail: true,
        buyerCompany: true,
        grandTotal: true,
        status: true,
        issueDate: true,
        createdAt: true,
        shareToken: true,
        items: {
          select: { name: true, quantity: true, unitPrice: true },
          take: 2,
        },
      },
    });

    return {
      period: period || 'all',
      revenue: {
        paid: paidRevenue,
        pending: pendingRevenue,
        totalInvoiced: totalInvoicedRevenue,
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        growthRate,
        avgPaidOrderValue,
      },
      invoices: {
        total: totalInvoiceCount,
        paid: paidCount,
        issued: issuedCount,
        sent: sentCount,
        cancelled: cancelledCount,
        collectionRate,
      },
      subscriptions: {
        total: rawSubs.length,
        active: subActive,
        expiringSoon: subExpiringSoon,
        expired: subExpired,
        cancelled: subCancelled,
        annualRevenue: subTotalAnnualValue,
        estimatedMRR,
      },
      queue: {
        total: qTotal,
        completed: qCompleted,
        pending: qPending,
        processing: qProcessing,
        failed: qFailed,
        successRate: queueSuccessRate,
      },
      monthlyTrend,
      statusDistribution,
      topServices,
      recentInvoices,
      urgentSubscriptions: topUrgentSubscriptions,
    };
  }
}
