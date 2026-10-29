import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateInvoiceTemplateDto {
  name: string;
  code?: string;
  description?: string;
  primaryColor?: string;
  headerBgColor?: string;
  textColor?: string;
  fontFamily?: string;
  customTitle?: string;
  subtitle?: string;
  showTaxCodeBadge?: boolean;
  slogan?: string;
  showSellerInfo?: boolean;
  showBuyerInfo?: boolean;
  showBuyerCompany?: boolean;
  showBuyerAddress?: boolean;
  showBuyerPhone?: boolean;
  showBuyerEmail?: boolean;
  showDueDate?: boolean;
  showServiceUnit?: boolean;
  showMetaInfo?: boolean;
  showTotalInWords?: boolean;
  showQrCode?: boolean;
  showBankInfo?: boolean;
  qrLayout?: string;
  showSignatures?: boolean;
  customerSignTitle?: string;
  customerSignSub?: string;
  sellerSignTitle?: string;
  sellerSignSub?: string;
  footerNote?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

const DEFAULT_PRESETS = [
  {
    name: 'Mẫu Chuẩn Doanh Nghiệp',
    code: 'standard-classic',
    description: 'Mẫu hóa đơn GTGT trang trọng theo quy chuẩn doanh nghiệp Việt Nam, bố cục thanh lịch.',
    primaryColor: '#1e3a8a',
    headerBgColor: '#f8fafc',
    textColor: '#1e293b',
    fontFamily: 'serif',
    showTaxCodeBadge: false,
    showSellerInfo: false,
    showBuyerInfo: true,
    showBuyerCompany: true,
    showBuyerAddress: true,
    showBuyerPhone: true,
    showBuyerEmail: true,
    showDueDate: true,
    showServiceUnit: true,
    showMetaInfo: true,
    showTotalInWords: true,
    showQrCode: true,
    showBankInfo: true,
    qrLayout: 'side-by-side',
    showSignatures: false,
    customerSignTitle: 'ĐẠI DIỆN KHÁCH HÀNG',
    customerSignSub: '(Ký và ghi rõ họ tên)',
    sellerSignTitle: 'NGƯỜI LẬP HÓA ĐƠN',
    sellerSignSub: '(Ký và ghi rõ họ tên)',
    footerNote: '',
    isDefault: true,
    isActive: true,
  },
  {
    name: 'Mẫu Tối Giản Hiện Đại',
    code: 'modern-minimalist',
    description: 'Phong cách tối giản Clean & Sharp, phông chữ Sans-serif hiện đại, đường nét mỏng tinh tế.',
    primaryColor: '#0f172a',
    headerBgColor: '#f1f5f9',
    textColor: '#0f172a',
    fontFamily: 'sans',
    showTaxCodeBadge: false,
    showSellerInfo: false,
    showBuyerInfo: true,
    showBuyerCompany: true,
    showBuyerAddress: true,
    showBuyerPhone: true,
    showBuyerEmail: true,
    showDueDate: true,
    showServiceUnit: true,
    showMetaInfo: true,
    showTotalInWords: true,
    showQrCode: true,
    showBankInfo: true,
    qrLayout: 'side-by-side',
    showSignatures: false,
    customerSignTitle: 'ĐẠI DIỆN KHÁCH HÀNG',
    customerSignSub: '(Ký và ghi rõ họ tên)',
    sellerSignTitle: 'NGƯỜI LẬP HÓA ĐƠN',
    sellerSignSub: '(Ký và ghi rõ họ tên)',
    footerNote: 'Cảm ơn quý khách đã tin tưởng và đồng hành cùng chúng tôi!',
    isDefault: false,
    isActive: true,
  },
  {
    name: 'Mẫu Xanh Lục Bảo Công Nghệ',
    code: 'tech-emerald',
    description: 'Tông màu xanh ngọc lục bảo trẻ trung năng động, hoàn hảo cho các dịch vụ SaaS, AI & Công nghệ.',
    primaryColor: '#059669',
    headerBgColor: '#ecfdf5',
    textColor: '#064e3b',
    fontFamily: 'sans',
    showTaxCodeBadge: false,
    showSellerInfo: false,
    showBuyerInfo: true,
    showBuyerCompany: true,
    showBuyerAddress: true,
    showBuyerPhone: true,
    showBuyerEmail: true,
    showDueDate: true,
    showServiceUnit: true,
    showMetaInfo: true,
    showTotalInWords: true,
    showQrCode: true,
    showBankInfo: true,
    qrLayout: 'side-by-side',
    showSignatures: false,
    customerSignTitle: 'ĐẠI DIỆN KHÁCH HÀNG',
    customerSignSub: '(Ký và ghi rõ họ tên)',
    sellerSignTitle: 'NGƯỜI LẬP HÓA ĐƠN',
    sellerSignSub: '(Ký và ghi rõ họ tên)',
    footerNote: 'Hóa đơn điện tử được khởi tạo và lưu trữ trên hệ thống AI Cloud.',
    isDefault: false,
    isActive: true,
  },
  {
    name: 'Mẫu Hành Chính Đầy Đủ (Có Chữ Ký)',
    code: 'formal-administrative',
    description: 'Bố cục truyền thống đầy đủ khối chữ ký Đại diện khách hàng / Người lập hóa đơn và ghi chú thuế.',
    primaryColor: '#831843',
    headerBgColor: '#fdf2f8',
    textColor: '#1e293b',
    fontFamily: 'serif',
    showTaxCodeBadge: true,
    subtitle: '(Có mã của cơ quan thuế)',
    showSellerInfo: true,
    showBuyerInfo: true,
    showBuyerCompany: true,
    showBuyerAddress: true,
    showBuyerPhone: true,
    showBuyerEmail: true,
    showDueDate: true,
    showServiceUnit: true,
    showMetaInfo: true,
    showTotalInWords: true,
    showQrCode: true,
    showBankInfo: true,
    qrLayout: 'stacked',
    showSignatures: true,
    customerSignTitle: 'ĐẠI DIỆN KHÁCH HÀNG',
    customerSignSub: '(Ký và ghi rõ họ tên)',
    sellerSignTitle: 'NGƯỜI LẬP HÓA ĐƠN',
    sellerSignSub: '(Ký và ghi rõ họ tên)',
    footerNote: '',
    isDefault: false,
    isActive: true,
  },
];

@Injectable()
export class InvoiceTemplatesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultPresets();
  }

  async seedDefaultPresets() {
    try {
      const count = await this.prisma.invoiceDesignTemplate.count();
      if (count === 0) {
        for (const preset of DEFAULT_PRESETS) {
          await this.prisma.invoiceDesignTemplate.create({
            data: preset,
          });
        }
      }
    } catch {
      // Bỏ qua nếu bảng chưa sẵn sàng lúc build
    }
  }

  async findAll() {
    return this.prisma.invoiceDesignTemplate.findMany({
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(idOrCode: string) {
    const template = await this.prisma.invoiceDesignTemplate.findFirst({
      where: {
        OR: [{ id: idOrCode }, { code: idOrCode }],
      },
    });
    if (!template) {
      throw new NotFoundException(`Không tìm thấy mẫu thiết kế: ${idOrCode}`);
    }
    return template;
  }

  async create(dto: CreateInvoiceTemplateDto) {
    const code =
      dto.code ||
      dto.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') +
        '-' +
        Date.now().toString(36);

    if (dto.isDefault) {
      await this.prisma.invoiceDesignTemplate.updateMany({
        data: { isDefault: false },
      });
    }

    return this.prisma.invoiceDesignTemplate.create({
      data: {
        ...dto,
        code,
      },
    });
  }

  async update(id: string, dto: Partial<CreateInvoiceTemplateDto>) {
    await this.findOne(id);

    if (dto.isDefault) {
      await this.prisma.invoiceDesignTemplate.updateMany({
        where: { id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.invoiceDesignTemplate.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    const template = await this.findOne(id);
    if (template.code === 'standard-classic') {
      throw new Error('Không thể xóa mẫu mặc định hệ thống');
    }
    return this.prisma.invoiceDesignTemplate.delete({
      where: { id },
    });
  }

  async setDefault(id: string) {
    await this.findOne(id);
    await this.prisma.invoiceDesignTemplate.updateMany({
      data: { isDefault: false },
    });
    return this.prisma.invoiceDesignTemplate.update({
      where: { id },
      data: { isDefault: true },
    });
  }
}

