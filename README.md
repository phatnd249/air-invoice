# 🧾 Invoice-AIR – Hệ Thống Tạo & Quản Lý Hóa Đơn

Hệ thống tạo, quản lý và xuất hóa đơn tinh gọn, chuyên nghiệp (Invoice Generator & Manager) tích hợp mã thanh toán **VietQR (SePay)** và xem trước realtime.

---

## 🌟 Tính Năng Nổi Bật

* **Tạo hóa đơn với Split-View**: Nhập thông tin form bên trái và **xem trước (Preview realtime)** hóa đơn trực quan chuẩn khổ A4 bên phải.
* **Tự động sinh mã VietQR Napas / SePay**: Mã QR thanh toán tự động cập nhật ngay trên bản xem trước theo số tiền và cú pháp chuyển khoản chính xác.
* **Quản lý danh sách hóa đơn**: Bảng danh sách trực quan, tìm kiếm, lọc theo trạng thái (`Bản nháp`, `Đã phát hành`, `Đã gửi`).
* **Hỗ trợ In & Xuất tài liệu**: In ấn trực tiếp với Print Preview chuẩn trang A4 (không bị rớt chân trang).
* **Cấu hình Doanh nghiệp**: Khai báo một lần thông tin đơn vị bán hàng, mã số thuế, logo và thông tin tài khoản ngân hàng nhận tiền.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

* **Monorepo**: [pnpm Workspaces](https://pnpm.io/workspaces)
* **Frontend (`frontend/`)**:
  * [Next.js 15](https://nextjs.org/) (App Router, React 19, TypeScript)
  * [Tailwind CSS](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/)
  * [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
  * [TanStack Query v5](https://tanstack.com/query)
* **Backend (`backend/`)**:
  * [NestJS](https://nestjs.com/) (Modular REST API)
  * [Prisma ORM](https://www.prisma.io/) với cơ sở dữ liệu **SQLite**
* **Shared Packages**:
  * `packages/types`: Type definitions dùng chung
  * `packages/validation`: Zod validation schemas dùng chung

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### 1. Yêu Cầu Môi Trường
* **Node.js** >= 20.x
* **pnpm** >= 9.x (Khuyên dùng: kích hoạt bằng `corepack enable` hoặc `npm i -g pnpm`)

### 2. Cài Đặt Dependencies
Clone dự án về máy và chạy lệnh cài đặt:

```bash
# Cài đặt tất cả các package trong monorepo
pnpm install
```

### 3. Cấu Hình Biến Môi Trường (.env)
Tạo file `.env` trong thư mục `backend/`:

```bash
# backend/.env
PORT=4000
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key"
```

Khởi tạo cơ sở dữ liệu SQLite:
```bash
cd backend
npx prisma db push
cd ..
```

### 4. Khởi Chạy Môi Trường Phát Triển (Development)

Chạy đồng thời cả Frontend và Backend:
```bash
# Chạy cả 2 dịch vụ
pnpm dev:backend   # API Backend: http://localhost:4000/api
pnpm dev:frontend  # Web App Frontend: http://localhost:3000
```

---

## 📁 Cấu Trúc Dự Án

```text
invoice-AIR/
├── backend/            # NestJS REST API & Prisma ORM
│   ├── prisma/         # Prisma schema & SQLite database
│   └── src/            # Auth, Invoices, Settings modules
├── frontend/           # Next.js 15 App Router
│   └── src/app/        # Invoices, Templates, Settings pages
├── packages/
│   ├── types/          # Shared TypeScript Interfaces
│   ├── validation/     # Shared Zod Schemas
│   └── config/         # Shared configs
├── package.json        # Root workspace script
└── pnpm-workspace.yaml # Monorepo configuration
```

---

## 📄 Bản Quyền & Giấy Phép
Dự án được phát triển bởi đội ngũ Tetrasco / AI Robotic.
