import { InvoiceDesignTemplate } from '@/components/InvoiceTemplateRenderer';

export type TemplateTabType = 'a4' | 'zalo' | 'email' | 'vietqr';

export interface AttachmentFile {
  id?: string;
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  channel: 'ZALO' | 'EMAIL';
  triggerType: 'INVOICE_CREATED' | 'PAYMENT_SUCCESS' | 'SUBSCRIPTION_ALERT' | 'CUSTOM';
  subject?: string;
  content: string;
  serviceIds: string[];
  attachments: AttachmentFile[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  unitPrice: number;
  unit: string;
  groupId?: string | null;
  group?: { id: string; name: string; color?: string } | null;
}

export interface MessageFormData {
  name: string;
  channel: 'ZALO' | 'EMAIL';
  triggerType: 'INVOICE_CREATED' | 'PAYMENT_SUCCESS';
  subject: string;
  content: string;
  applyAllServices: boolean;
  serviceIds: string[];
  attachments: AttachmentFile[];
  isDefault: boolean;
  isActive: boolean;
}

export type { InvoiceDesignTemplate };
