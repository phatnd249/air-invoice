import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CompanyProfileItem {
  id: string;
  name: string;
  taxCode?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  bankAccountId?: string;
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

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const setting = await this.prisma.setting.findUnique({ where: { id: 'default' } });
    if (!setting) {
      const defaultCompany: CompanyProfileItem = {
        id: 'comp-default',
        name: 'CÔNG TY TNHH GIÁO DỤC AI ROBOTIC',
        taxCode: '3603893101',
        address: 'Số 10 Huỳnh Văn Nghệ, P. Trấn Biên, Đồng Nai',
        phone: '0900000000',
        email: 'contact@airobotics.edu.vn',
        isDefault: true,
      };

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
          companyName: defaultCompany.name,
          taxCode: defaultCompany.taxCode,
          address: defaultCompany.address,
          phone: defaultCompany.phone,
          email: defaultCompany.email,
          companies: JSON.stringify([defaultCompany]),
          bankCode: 'Vietcombank',
          bankAccount: 'SHYNNERI',
          bankAccountName: 'AI ROBOTIC',
          bankAccounts: JSON.stringify(defaultAccounts),
          qrTemplate: 'compact',
        },
      });
    }
  }

  async getSettings() {
    const setting = await this.prisma.setting.findUnique({ where: { id: 'default' } });
    if (!setting) return null;

    let companies: CompanyProfileItem[] = [];
    try {
      if ((setting as any).companies) {
        companies = JSON.parse((setting as any).companies);
      }
    } catch (e) {
      companies = [];
    }

    // Nếu chưa có danh sách companies, tự động tạo từ thông tin gốc hiện tại
    if (!companies || companies.length === 0) {
      companies = [
        {
          id: 'comp-1',
          name: setting.companyName || 'CÔNG TY TNHH GIÁO DỤC AI ROBOTIC',
          taxCode: setting.taxCode || '',
          address: setting.address || '',
          phone: setting.phone || '',
          email: setting.email || '',
          logoUrl: setting.logoUrl || '',
          isDefault: true,
        },
      ];
    }

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
      companies,
      bankAccounts,
    };
  }

  async updateSettings(data: any) {
    const updatePayload = { ...data };

    // Xử lý danh sách đơn vị cung cấp (companies)
    if (data.companies && Array.isArray(data.companies)) {
      const defaultComp =
        data.companies.find((c: CompanyProfileItem) => c.isDefault) || data.companies[0];

      if (defaultComp) {
        updatePayload.companyName = defaultComp.name;
        updatePayload.taxCode = defaultComp.taxCode;
        updatePayload.address = defaultComp.address;
        updatePayload.phone = defaultComp.phone;
        updatePayload.email = defaultComp.email;
        updatePayload.logoUrl = defaultComp.logoUrl;
      }

      try {
        updatePayload.companies = JSON.stringify(data.companies);
      } catch (e) {
        // ignore
      }
    }

    // Xử lý danh sách tài khoản ngân hàng (bankAccounts)
    if (data.bankAccounts && Array.isArray(data.bankAccounts)) {
      const defaultAcc =
        data.bankAccounts.find((a: BankAccountItem) => a.isDefault) || data.bankAccounts[0];

      if (defaultAcc) {
        updatePayload.bankCode = defaultAcc.bankCode;
        updatePayload.bankAccount = defaultAcc.bankAccount;
        updatePayload.bankAccountName = defaultAcc.bankAccountName;
        updatePayload.qrTemplate = defaultAcc.qrTemplate || 'compact';
      }

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
