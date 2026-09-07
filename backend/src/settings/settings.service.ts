import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface BankAccountItem {
  id: string;
  bankCode: string;
  bankAccount: string;
  bankAccountName: string;
  label?: string;
  qrTemplate?: string;
  isDefault?: boolean;
}

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const setting = await this.prisma.setting.findUnique({ where: { id: 'default' } });
    if (!setting) {
      const defaultAccounts: BankAccountItem[] = [
        {
          id: 'acc-default',
          bankCode: 'Vietcombank',
          bankAccount: 'SHYNNERI',
          bankAccountName: 'AI ROBOTIC',
          label: 'Tài khoản chính (Vietcombank)',
          qrTemplate: 'compact',
          isDefault: true,
        },
      ];

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
          qrTemplate: 'compact',
        },
      });
    }
  }

  async getSettings() {
    const setting = await this.prisma.setting.findUnique({ where: { id: 'default' } });
    if (!setting) return null;

    let bankAccounts: BankAccountItem[] = [];
    try {
      if ((setting as any).bankAccounts) {
        bankAccounts = JSON.parse((setting as any).bankAccounts);
      }
    } catch (e) {
      bankAccounts = [];
    }

    // Nếu chưa có danh sách bankAccounts, tự động tạo từ thông tin ngân hàng hiện tại
    if (!bankAccounts || bankAccounts.length === 0) {
      if (setting.bankCode && setting.bankAccount) {
        bankAccounts = [
          {
            id: 'acc-1',
            bankCode: setting.bankCode,
            bankAccount: setting.bankAccount,
            bankAccountName: setting.bankAccountName || 'AI ROBOTIC',
            label: 'Tài khoản chính',
            qrTemplate: setting.qrTemplate || 'compact',
            isDefault: true,
          },
        ];
      }
    }

    return {
      ...setting,
      bankAccounts,
    };
  }

  async updateSettings(data: any) {
    const updatePayload = { ...data };

    if (data.bankAccounts && Array.isArray(data.bankAccounts)) {
      // Đồng bộ tài khoản mặc định vào các trường gốc (bankCode, bankAccount, bankAccountName)
      const defaultAcc =
        data.bankAccounts.find((a: BankAccountItem) => a.isDefault) || data.bankAccounts[0];

      if (defaultAcc) {
        updatePayload.bankCode = defaultAcc.bankCode;
        updatePayload.bankAccount = defaultAcc.bankAccount;
        updatePayload.bankAccountName = defaultAcc.bankAccountName;
        updatePayload.qrTemplate = defaultAcc.qrTemplate || 'compact';
      }

      // Lưu trữ dạng JSON string an toàn
      try {
        updatePayload.bankAccounts = JSON.stringify(data.bankAccounts);
      } catch (e) {
        // ignore
      }
    }

    return this.prisma.setting.upsert({
      where: { id: 'default' },
      update: updatePayload,
      create: { ...updatePayload, id: 'default' },
    });
  }
}
