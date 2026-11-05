import React from 'react';
import { Building2, CreditCard, Sliders, Sparkles, Bell } from 'lucide-react';

export const POPULAR_BANKS = [
  { code: 'Vietcombank', name: 'Vietcombank (VCB - Ngoại thương)' },
  { code: 'MBBank', name: 'MB Bank (Quân Đội)' },
  { code: 'Techcombank', name: 'Techcombank (TCB - Kỹ Thương)' },
  { code: 'ACB', name: 'ACB (Á Châu)' },
  { code: 'VPBank', name: 'VPBank (Việt Nam Thịnh Vượng)' },
  { code: 'TPBank', name: 'TPBank (Tiên Phong)' },
  { code: 'BIDV', name: 'BIDV (Đầu tư & Phát triển)' },
  { code: 'VietinBank', name: 'VietinBank (Công Thương)' },
  { code: 'Agribank', name: 'Agribank (Nông Nghiệp)' },
  { code: 'Sacombank', name: 'Sacombank (Sài Gòn Thương Tín)' },
  { code: 'HDBank', name: 'HDBank (Phát triển TP.HCM)' },
  { code: 'VIB', name: 'VIB (Quốc Tế)' },
  { code: 'MSB', name: 'MSB (Hàng Hải)' },
  { code: 'SeABank', name: 'SeABank (Đông Nam Á)' },
  { code: 'OCB', name: 'OCB (Phương Đông)' },
];

export type SettingsTabId = 'companies' | 'banks' | 'formats' | 'rules' | 'notifications';

export const SETTINGS_TABS: {
  id: SettingsTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'companies', label: 'Đơn Vị Cung Cấp', icon: Building2 },
  { id: 'banks', label: 'Tài Khoản VietQR', icon: CreditCard },
  { id: 'formats', label: 'Định Dạng Nội Dung', icon: Sparkles },
  { id: 'rules', label: 'Quy Tắc Đánh Số & Thuế', icon: Sliders },
  { id: 'notifications', label: 'Cấu Hình Thông Báo (Zalo & Mail)', icon: Bell },
];

