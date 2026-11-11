export type PeriodType = 'all' | 'today' | '7d' | '30d' | 'this_month' | 'last_month' | 'this_quarter' | 'this_year';

export interface DashboardStatsResponse {
  period: string;
  revenue: {
    paid: number;
    pending: number;
    totalInvoiced: number;
    thisMonth: number;
    lastMonth: number;
    growthRate: number;
    avgPaidOrderValue: number;
  };
  invoices: {
    total: number;
    paid: number;
    issued: number;
    sent: number;
    cancelled: number;
    collectionRate: number;
  };
  subscriptions: {
    total: number;
    active: number;
    expiringSoon: number;
    expired: number;
    cancelled: number;
    annualRevenue: number;
    estimatedMRR: number;
  };
  queue: {
    total: number;
    completed: number;
    pending: number;
    processing: number;
    failed: number;
    successRate: number;
  };
  monthlyTrend: Array<{
    monthKey: string;
    label: string;
    paidRevenue: number;
    pendingRevenue: number;
    paidCount: number;
    totalCount: number;
  }>;
  statusDistribution: Array<{
    status: string;
    label: string;
    count: number;
    amount: number;
    percentage: number;
    color: string;
  }>;
  topServices: Array<{
    name: string;
    quantity: number;
    revenue: number;
    percentage: number;
  }>;
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    buyerName: string;
    buyerEmail?: string;
    buyerCompany?: string;
    grandTotal: number;
    status: string;
    issueDate: string;
    createdAt: string;
    shareToken?: string;
    items?: Array<{ name: string; quantity: number; unitPrice: number }>;
  }>;
  urgentSubscriptions: Array<{
    id: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    customerCompany?: string;
    serviceName: string;
    servicePrice: number;
    endDate: string;
    daysRemaining: number;
    status: string;
  }>;
}
