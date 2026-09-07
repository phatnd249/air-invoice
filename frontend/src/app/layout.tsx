import './globals.css';
import Providers from '@/components/Providers';
import { AppShell } from '@/components/AppShell';

export const metadata = {
  title: 'Invoice-AIR - Hệ Thống Tạo & Quản Lý Hóa Đơn',
  description: 'Hệ thống tạo, xuất PDF và quản lý hóa đơn chuyên nghiệp kèm mã VietQR',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased bg-slate-50 text-slate-900">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
