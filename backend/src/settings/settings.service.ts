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

export interface PaymentDescriptionRule {
  id: string;
  name: string;
  emailPattern: string;
  descriptionTemplate: string;
  isActive: boolean;
}

export const DEFAULT_PAYMENT_RULES: PaymentDescriptionRule[] = [
  {
    id: 'rule-lachong',
    name: 'Sinh viên Trường Đại Học Lạc Hồng',
    emailPattern: 'lachong.edu.vn',
    descriptionTemplate: '{studentId} / Trường Đại Học Lạc Hồng',
    isActive: true,
  },
];

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

  private static readonly SECRET_MASK = '••••••••';

  /**
   * Che bớt secret trước khi trả về client (giữ 6 ký tự đầu để nhận diện, ví dụ "zlite_").
   */
  private maskSecret(value?: string | null): string | null {
    if (!value) return null;
    const trimmed = String(value).trim();
    if (trimmed.length <= 6) return SettingsService.SECRET_MASK;
    return `${trimmed.slice(0, 6)}${SettingsService.SECRET_MASK}`;
  }

  
  /**
   * Sinh nội dung chuyển khoản VietQR dựa trên email và danh sách quy tắc đã cấu hình.
   */
  public formatPaymentDescription(
    buyerEmail?: string | null,
    paymentCode?: string | null,
    serviceName?: string | null,
    buyerName?: string | null,
    invoiceNumber?: string | null,
    customRules?: PaymentDescriptionRule[] | null,
    customDefaultTemplate?: string | null,
  ): string {
    const email = (buyerEmail || '').trim().toLowerCase();
    const code = paymentCode || invoiceNumber || 'HD';
    const sName = serviceName || 'Dich vu';
    const cName = buyerName || 'Khach hang';
    const invNum = invoiceNumber || code;

    const emailPrefix = email ? email.split('@')[0].trim() : '';
    const matchNumber = emailPrefix.match(/^(\d+)/);
    const studentId = matchNumber ? matchNumber[1] : emailPrefix;

    const rules = (customRules && customRules.length > 0) ? customRules : DEFAULT_PAYMENT_RULES;

    if (email) {
      for (const rule of rules) {
        if (!rule.isActive) continue;
        const pattern = (rule.emailPattern || '').trim().toLowerCase();
        if (pattern && email.includes(pattern)) {
          let desc = rule.descriptionTemplate || '{paymentCode} - {serviceName}';
          desc = desc.replace(/{studentId}/gi, studentId);
          desc = desc.replace(/{emailPrefix}/gi, emailPrefix);
          desc = desc.replace(/{paymentCode}/gi, code);
          desc = desc.replace(/{invoiceNumber}/gi, invNum);
          desc = desc.replace(/{serviceName}/gi, sName);
          desc = desc.replace(/{customerName}/gi, cName);
          return desc;
        }
      }
    }

    let defaultDesc = customDefaultTemplate || '{paymentCode} - {serviceName}';
    defaultDesc = defaultDesc.replace(/{studentId}/gi, studentId);
    defaultDesc = defaultDesc.replace(/{emailPrefix}/gi, emailPrefix);
    defaultDesc = defaultDesc.replace(/{paymentCode}/gi, code);
    defaultDesc = defaultDesc.replace(/{invoiceNumber}/gi, invNum);
    defaultDesc = defaultDesc.replace(/{serviceName}/gi, sName);
    defaultDesc = defaultDesc.replace(/{customerName}/gi, cName);
    return defaultDesc;
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

    // 🔒 Không trả nguyên văn API Key của gateway Zalo về client
    const { zaloApiKey, ...safeSetting } = setting as any;

    return {
      ...safeSetting,
      zaloApiKey: this.maskSecret(zaloApiKey),
      hasZaloApiKey: !!zaloApiKey,
      companies,
      bankAccounts,
    };
  }

  async updateSettings(data: any) {
    const updatePayload = { ...data };

    // 🔒 Nếu client gửi lại giá trị đã bị che thì giữ nguyên secret hiện có trong DB
    if (
      updatePayload.zaloApiKey !== undefined &&
      String(updatePayload.zaloApiKey ?? '').includes(SettingsService.SECRET_MASK)
    ) {
      delete updatePayload.zaloApiKey;
    }

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

    // Xử lý danh sách quy tắc nội dung chuyển khoản theo email (paymentRules)
    if (data.paymentRules && Array.isArray(data.paymentRules)) {
      try {
        updatePayload.paymentRules = JSON.stringify(data.paymentRules);
      } catch (e) {}
    }
    if (data.defaultPaymentDescription !== undefined) {
      updatePayload.defaultPaymentDescription = data.defaultPaymentDescription;
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
