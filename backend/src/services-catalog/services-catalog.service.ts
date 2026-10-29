import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesCatalogService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // 1. Tự động khởi tạo nhóm gói mẫu nếu chưa có
    const groupCount = await this.prisma.serviceGroup.count();
    let defaultGroup: any = null;
    if (groupCount === 0) {
      defaultGroup = await this.prisma.serviceGroup.create({
        data: {
          name: 'AI Writer - Nền Tảng Viết Bài Tự Động',
          code: 'ai-writer',
          website: 'https://aiwriter.ntcore.io.vn',
          description: 'Các gói bản quyền & tính năng cho web AI Writer',
          color: '#2563eb',
          sortOrder: 1,
        },
      });

      await this.prisma.serviceGroup.create({
        data: {
          name: 'Dịch Vụ Cloud & Hạ Tầng Số',
          code: 'cloud-infra',
          website: 'https://invoice.share4happy.com',
          description: 'Hosting, Tên miền, SSL và Bảo trì hệ thống',
          color: '#059669',
          sortOrder: 2,
        },
      });
    }

    // 2. Tự động khởi tạo dữ liệu mẫu nếu danh mục dịch vụ chưa có
    const count = await this.prisma.serviceCatalog.count();
    if (count === 0) {
      await this.prisma.serviceCatalog.createMany({
        data: [
          {
            name: 'Gói AI WRITER - 1 Năm Bản Quyền',
            description: 'Tạo nội dung AI không giới hạn, hỗ trợ chuẩn SEO & WordPress',
            metaInfo: 'Thời hạn: 1 Năm (12 Tháng)',
            unit: 'gói',
            unitPrice: 1200000,
            groupId: defaultGroup?.id || null,
            sortOrder: 1,
          },
          {
            name: 'Hosting WordPress - Gói Doanh Nghiệp',
            description: 'NVMe SSD 20GB, Băng thông không giới hạn, cPanel',
            metaInfo: 'Thời hạn: 1 Năm (12 Tháng)',
            unit: 'gói',
            unitPrice: 660000,
            sortOrder: 2,
          },
          {
            name: 'Tên Miền Quốc Tế (.com / .net)',
            description: 'Đăng ký & Quản lý DNS miễn phí',
            metaInfo: 'Thời hạn: 1 Năm (12 Tháng)',
            unit: 'tên miền',
            unitPrice: 280000,
            sortOrder: 3,
          },
          {
            name: 'Chứng Chỉ Bảo Mật SSL EV Wildcard',
            description: 'Mã hóa giao dịch 256-bit bảo mật cao',
            metaInfo: 'Thời hạn: 1 Năm (12 Tháng)',
            unit: 'chứng chỉ',
            unitPrice: 660000,
            sortOrder: 4,
          },
        ],
      });
    }
  }

  // ================= QUẢN LÝ DỊCH VỤ =================

  async getAllServices(search?: string, groupId?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (groupId) {
      where.groupId = groupId === 'unassigned' ? null : groupId;
    }
    return this.prisma.serviceCatalog.findMany({
      where,
      include: {
        group: {
          select: {
            id: true,
            name: true,
            code: true,
            website: true,
            color: true,
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getServiceById(id: string) {
    return this.prisma.serviceCatalog.findUnique({
      where: { id },
      include: { group: true },
    });
  }

  async createService(data: {
    name: string;
    description?: string;
    metaInfo?: string;
    unit?: string;
    unitPrice?: number;
    groupId?: string;
    sortOrder?: number;
  }) {
    return this.prisma.serviceCatalog.create({
      data: {
        name: data.name,
        description: data.description,
        metaInfo: data.metaInfo,
        unit: data.unit || 'gói',
        unitPrice: Number(data.unitPrice) || 0,
        groupId: data.groupId || null,
        sortOrder: Number(data.sortOrder) || 0,
      },
      include: { group: true },
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
      groupId?: string | null;
      sortOrder?: number;
    },
  ) {
    return this.prisma.serviceCatalog.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        metaInfo: data.metaInfo,
        unit: data.unit,
        unitPrice: data.unitPrice !== undefined ? Number(data.unitPrice) : undefined,
        groupId: data.groupId !== undefined ? data.groupId : undefined,
        sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : undefined,
      },
      include: { group: true },
    });
  }

  async deleteService(id: string) {
    return this.prisma.serviceCatalog.delete({ where: { id } });
  }

  /**
   * Kéo thả gán nhanh gói dịch vụ vào nhóm mới (hoặc bỏ nhóm)
   */
  async assignServiceGroup(serviceId: string, groupId: string | null) {
    return this.prisma.serviceCatalog.update({
      where: { id: serviceId },
      data: { groupId: groupId || null },
      include: { group: true },
    });
  }

  /**
   * Tự động thêm gói từ hóa đơn vào hệ thống nếu gói này chưa có trong danh mục
   */
  async findOrCreateService(data: {
    name: string;
    description?: string;
    metaInfo?: string;
    unit?: string;
    unitPrice?: number;
    groupId?: string;
  }) {
    const cleanName = (data.name || '').trim();
    if (!cleanName) return null;

    // Kiểm tra xem đã tồn tại gói cùng tên chưa
    const existing = await this.prisma.serviceCatalog.findFirst({
      where: { name: { equals: cleanName, mode: 'insensitive' } },
      include: { group: true },
    });

    if (existing) {
      return { service: existing, isNew: false };
    }

    // Nếu chưa có, tự động tạo mới vào danh mục
    const created = await this.prisma.serviceCatalog.create({
      data: {
        name: cleanName,
        description: data.description || '',
        metaInfo: data.metaInfo || '',
        unit: data.unit || 'gói',
        unitPrice: Number(data.unitPrice) || 0,
        groupId: data.groupId || null,
      },
      include: { group: true },
    });

    return { service: created, isNew: true };
  }

  // ================= QUẢN LÝ NHÓM GÓI (SERVICE GROUPS) =================

  async getAllGroups() {
    return this.prisma.serviceGroup.findMany({
      include: {
        services: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getGroupById(id: string) {
    return this.prisma.serviceGroup.findUnique({
      where: { id },
      include: {
        services: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        },
      },
    });
  }

  async createGroup(data: {
    name: string;
    code?: string;
    website?: string;
    description?: string;
    color?: string;
    sortOrder?: number;
  }) {
    return this.prisma.serviceGroup.create({
      data: {
        name: data.name,
        code: data.code || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        website: data.website,
        description: data.description,
        color: data.color || '#2563eb',
        sortOrder: Number(data.sortOrder) || 0,
      },
      include: { services: true },
    });
  }

  async updateGroup(
    id: string,
    data: {
      name?: string;
      code?: string;
      website?: string;
      description?: string;
      color?: string;
      sortOrder?: number;
    },
  ) {
    return this.prisma.serviceGroup.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        website: data.website,
        description: data.description,
        color: data.color,
        sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : undefined,
      },
      include: { services: true },
    });
  }

  async deleteGroup(id: string) {
    // Tự động bỏ liên kết nhóm cho các dịch vụ thuộc nhóm này trước khi xóa
    await this.prisma.serviceCatalog.updateMany({
      where: { groupId: id },
      data: { groupId: null },
    });
    return this.prisma.serviceGroup.delete({ where: { id } });
  }
}
