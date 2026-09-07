import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Tự động khởi tạo Setting mặc định nếu chưa có
    const setting = await this.prisma.setting.findUnique({ where: { id: 'default' } });
    if (!setting) {
      await this.prisma.setting.create({
        data: {
          id: 'default',
          companyName: 'CÔNG TY TNHH GIÁO DỤC AI ROBOTIC',
          taxCode: '3603893101',
          address: 'Số 10 Huỳnh Văn Nghệ, P. Trấn Biên, Đồng Nai',
          phone: '0900000000',
          email: 'contact@airobotics.edu.vn',
          bankCode: 'Vietcombank',
          bankAccount: 'SHYNNERI',
          bankAccountName: 'AI ROBOTIC',
        },
      });
    }
  }

  async getSettings() {
    return this.prisma.setting.findUnique({ where: { id: 'default' } });
  }

  async updateSettings(data: any) {
    return this.prisma.setting.upsert({
      where: { id: 'default' },
      update: data,
      create: { ...data, id: 'default' },
    });
  }
}
