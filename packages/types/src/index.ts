export enum InvoiceStatus {
  ISSUED = 'ISSUED',
  SENT = 'SENT',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

// Loại hoá đơn theo quy định Việt Nam (Nghị định 123/2020/NĐ-CP)
export enum InvoiceType {
  GTGT = 'GTGT',
  BAN_HANG = 'BAN_HANG',
  TAI_SAN_CONG = 'TAI_SAN_CONG',
  DU_TRU_QG = 'DU_TRU_QG',
}

// Hình thức hoá đơn điện tử
export enum InvoiceForm {
  WITH_TAX_CODE = 'WITH_TAX_CODE',
  WITHOUT_TAX_CODE = 'WITHOUT_TAX_CODE',
  POS_CONNECTED = 'POS_CONNECTED',
}

// Config metadata cho hiển thị UI — dễ mở rộng khi thêm loại mới
export const INVOICE_TYPE_CONFIG: Record<InvoiceType, {
  label: string;
  shortLabel: string;
  description: string;
  seriesPrefix: string;
  hasVatColumn: boolean;
}> = {
  [InvoiceType.GTGT]: {
    label: 'Hoá đơn giá trị gia tăng',
    shortLabel: 'HĐ GTGT',
    description: 'Dùng cho doanh nghiệp khai thuế GTGT theo phương pháp khấu trừ',
    seriesPrefix: '1',
    hasVatColumn: true,
  },
  [InvoiceType.BAN_HANG]: {
    label: 'Hoá đơn bán hàng',
    shortLabel: 'HĐ Bán hàng',
    description: 'Dùng cho tổ chức/cá nhân khai thuế theo phương pháp trực tiếp',
    seriesPrefix: '2',
    hasVatColumn: false,
  },
  [InvoiceType.TAI_SAN_CONG]: {
    label: 'Hoá đơn bán tài sản công',
    shortLabel: 'HĐ Tài sản công',
    description: 'Dùng cho giao dịch bán tài sản công theo quy định',
    seriesPrefix: '3',
    hasVatColumn: true,
  },
  [InvoiceType.DU_TRU_QG]: {
    label: 'Hoá đơn bán hàng dự trữ quốc gia',
    shortLabel: 'HĐ DTQG',
    description: 'Dùng cho hoạt động bán hàng dự trữ quốc gia',
    seriesPrefix: '4',
    hasVatColumn: true,
  },
};

export const INVOICE_FORM_CONFIG: Record<InvoiceForm, {
  label: string;
  shortLabel: string;
  description: string;
}> = {
  [InvoiceForm.WITH_TAX_CODE]: {
    label: 'Có mã của cơ quan thuế',
    shortLabel: 'Có mã CQT',
    description: 'Hoá đơn được cấp mã xác thực từ cơ quan thuế',
  },
  [InvoiceForm.WITHOUT_TAX_CODE]: {
    label: 'Không có mã của cơ quan thuế',
    shortLabel: 'Không mã CQT',
    description: 'Hoá đơn do doanh nghiệp tự phát hành, không qua cơ quan thuế',
  },
  [InvoiceForm.POS_CONNECTED]: {
    label: 'Từ máy tính tiền',
    shortLabel: 'Máy tính tiền',
    description: 'Hoá đơn khởi tạo từ máy tính tiền có kết nối dữ liệu với cơ quan thuế',
  },
};

export interface CompanyProfile {
  id: string;
  name: string;
  taxCode?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  bankAccountId?: string; // ID tài khoản ngân hàng mặc định liên kết
  isDefault?: boolean;
}

export interface BankAccountItem {
  id: string;
  bankCode: string;
  bankAccount: string;
  bankAccountName: string;
  label?: string;
  qrTemplate?: string;
  isDefault?: boolean;
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
  invoiceType: InvoiceType;
  invoiceForm: InvoiceForm;
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
