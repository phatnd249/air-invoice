import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesCatalogService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Tự động khởi tạo dữ liệu mẫu nếu danh mục dịch vụ chưa có
    const count = await this.prisma.serviceCatalog.count();
    if (count === 0) {
      await this.prisma.serviceCatalog.createMany({
        data: [
          {
            name: 'Hosting WordPress - Gói Doanh Nghiệp',
            description: 'NVMe SSD 20GB, Băng thông không giới hạn, cPanel',
            metaInfo: 'Thời hạn: 1 Năm (12 Tháng)',
            unit: 'gói',
            unitPrice: 660000,
          },
          {
            name: 'Tên Miền Quốc Tế (.com / .net)',
            description: 'Đăng ký & Quản lý DNS miễn phí',
            metaInfo: 'Thời hạn: 1 Năm (12 Tháng)',
            unit: 'tên miền',
            unitPrice: 280000,
          },
          {
            name: 'Chứng Chỉ Bảo Mật SSL EV Wildcard',
            description: 'Mã hóa giao dịch 256-bit bảo mật cao',
            metaInfo: 'Thời hạn: 1 Năm (12 Tháng)',
            unit: 'chứng chỉ',
            unitPrice: 660000,
          },
          {
            name: 'Bảo Trì & Vận Hành Hệ Thống Website',
            description: 'Backup hàng tuần, tối ưu tốc độ và an ninh mạng',
            metaInfo: 'Gói định kỳ hàng tháng',
            unit: 'tháng',
            unitPrice: 1500000,
          },
        ],
      });
    }
  }

  async getAllServices(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }
    return this.prisma.serviceCatalog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getServiceById(id: string) {
    return this.prisma.serviceCatalog.findUnique({ where: { id } });
  }

  async createService(data: {
    name: string;
    description?: string;
    metaInfo?: string;
    unit?: string;
    unitPrice?: number;
  }) {
    return this.prisma.serviceCatalog.create({
      data: {
        name: data.name,
        description: data.description,
        metaInfo: data.metaInfo,
        unit: data.unit || 'gói',
        unitPrice: Number(data.unitPrice) || 0,
      },
    });
  }

  async updateService(
    id: string,
    data: {
      name?: string;
      description?: string;
      metaInfo?: string;
      unit?: string;
      unitPrice?: number;
    }
  ) {
    return this.prisma.serviceCatalog.update({
      where: { id },
      data: {
        ...data,
        unitPrice: data.unitPrice !== undefined ? Number(data.unitPrice) : undefined,
      },
    });
  }

  async deleteService(id: string) {
    return this.prisma.serviceCatalog.delete({ where: { id } });
  }
}
