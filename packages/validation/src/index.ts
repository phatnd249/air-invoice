import { z } from 'zod';

export const SellerInfoSchema = z.object({
  name: z.string().min(1, 'Tên đơn vị bán là bắt buộc'),
  taxCode: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  logoUrl: z.string().url('URL logo không hợp lệ').optional().or(z.literal('')),
});

export const BuyerInfoSchema = z.object({
  name: z.string().min(1, 'Tên người mua / khách hàng là bắt buộc'),
  companyName: z.string().optional(),
  taxCode: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  phone: z.string().optional(),
});

export const InvoiceItemSchema = z.object({
  id: z.string().optional(),
  sortOrder: z.number().default(0),
  description: z.string().min(1, 'Nội dung hàng hóa/dịch vụ là bắt buộc'),
  unit: z.string().default('cái'),
  quantity: z.number().min(0.001, 'Số lượng phải lớn hơn 0'),
  unitPrice: z.number().min(0, 'Đơn giá không được âm'),
  discountRate: z.number().min(0).max(100).default(0).optional(),
  discountAmount: z.number().min(0).default(0).optional(),
  taxRate: z.number().min(0).max(100).default(0).optional(),
  taxAmount: z.number().min(0).default(0).optional(),
  amount: z.number().min(0),
});

export const CreateInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Số hóa đơn là bắt buộc'),
  issueDate: z.string().min(1, 'Ngày lập là bắt buộc'),
  dueDate: z.string().optional(),
  currency: z.string().default('VND'),
  templateId: z.string().default('standard-a4'),
  notes: z.string().optional(),
  terms: z.string().optional(),
  seller: SellerInfoSchema,
  buyer: BuyerInfoSchema,
  items: z.array(InvoiceItemSchema).min(1, 'Hóa đơn phải có ít nhất 1 hàng hóa/dịch vụ'),
  otherFee: z.number().min(0).default(0).optional(),
});

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
