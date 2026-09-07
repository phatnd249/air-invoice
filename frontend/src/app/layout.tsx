import './globals.css';
import Providers from '@/components/Providers';
import { Sidebar } from '@/components/Sidebar';

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
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-y-auto min-h-screen bg-slate-50/50">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
