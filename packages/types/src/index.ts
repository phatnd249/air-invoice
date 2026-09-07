export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  SENT = 'SENT',
}

export interface SellerInfo {
  name: string;
  taxCode?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
}

export interface BuyerInfo {
  name: string;
  companyName?: string;
  taxCode?: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface InvoiceItem {
  id?: string;
  sortOrder: number;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discountRate?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  amount: number;
}

export interface InvoiceSummary {
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  otherFee?: number;
  grandTotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  currency: string;
  templateId: string;
  status: InvoiceStatus;
  notes?: string;
  terms?: string;
  seller: SellerInfo;
  buyer: BuyerInfo;
  items: InvoiceItem[];
  summary: InvoiceSummary;
  createdAt: string;
  updatedAt: string;
}
