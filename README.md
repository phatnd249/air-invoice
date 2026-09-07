# Invoice-AIR – Hệ Thống Tạo & Quản Lý Hóa Đơn

Hệ thống tạo, quản lý và xuất hóa đơn dịch vụ chuyên nghiệp, tích hợp tự động mã thanh toán **VietQR (SePay/Napas)**, xem trước realtime chuẩn khổ A4, xuất PDF/In ấn và gửi hóa đơn qua Email/Zalo.

## Yêu cầu

- **Node.js**: 20+
- **Package Manager**: `pnpm` (khuyên dùng) hoặc `npm`
- **Gotenberg / Chromium** (tùy chọn) — hỗ trợ convert HTML sang file PDF tự động

> SQLite được tích hợp sẵn qua `@prisma/client`, không cần cài đặt database server riêng biệt.

## Hướng dẫn nhanh

```bash
# Cài đặt dependencies toàn bộ monorepo
pnpm install

# Khởi tạo database
cd backend
npx prisma db push
cd ..

# Chạy ứng dụng
pnpm dev
```

## Cài đặt

```bash
# 1. Cài dependencies cho toàn bộ workspace (backend + frontend + packages)
pnpm install

# 2. Tạo file cấu hình môi trường .env
cp .env.example backend/.env

# 3. Setup database SQLite
cd backend
npx prisma generate
npx prisma db push
cd ..
```

## Cấu hình .env

File `backend/.env` (hoặc `.env` ở thư mục gốc) — các biến bắt buộc và quan trọng:

| Biến | Mô tả | Bắt buộc |
|------|-------|:--------:|
| `DATABASE_URL` | Đường dẫn file database SQLite (VD: `file:./dev.db`) | Có |
| `JWT_SECRET` | Khóa bí mật ký JWT access token | Có |
| `REFRESH_TOKEN_SECRET` | Khóa bí mật ký JWT refresh token | Có |

Các biến tùy chọn / tích hợp mở rộng:

| Biến | Mặc định | Mô tả |
|------|----------|-------|
| `PORT` | `4000` | Cổng chạy Backend API |
| `FRONTEND_PORT` | `3000` | Cổng chạy Next.js Frontend |
| `JWT_EXPIRES_IN` | `15m` | Thời hạn hiệu lực của access token |
| `REFRESH_TOKEN_EXPIRES_IN` | `7d` | Thời hạn hiệu lực của refresh token |
| `SMTP_HOST` | `smtp.example.com` | Máy chủ SMTP gửi mail thông báo hóa đơn |
| `SMTP_PORT` | `587` | Cổng kết nối SMTP |
| `SMTP_USER` | — | Tài khoản đăng nhập SMTP |
| `SMTP_PASS` | — | Mật khẩu ứng dụng SMTP |
| `SMTP_FROM` | `no-reply@invoice-air.com` | Tên email người gửi |
| `R2_ACCOUNT_ID` | — | Cloudflare R2 Account ID (Lưu trữ PDF/Logo) |
| `R2_ACCESS_KEY_ID` | — | Cloudflare R2 Access Key |
| `R2_SECRET_ACCESS_KEY` | — | Cloudflare R2 Secret Key |
| `R2_BUCKET_NAME` | `invoice-air-storage` | Tên bucket lưu file |
| `R2_PUBLIC_URL` | — | Domain CDN công khai file PDF |

## Development

```bash
# Chạy đồng thời cả Backend và Frontend
pnpm dev

# Hoặc chạy riêng từng service:
pnpm dev:backend   # NestJS API (http://localhost:4000)
pnpm dev:frontend  # Next.js App Router (http://localhost:3000)
```

- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000/api`

## Build & Deploy

```bash
# 1. Build toàn bộ dự án (packages, backend, frontend)
pnpm build

# 2. Chạy backend production
cd backend
pnpm start:prod
```

## Database

```bash
# Đồng bộ thay đổi schema vào database
npx prisma db push

# Tạo migration (nếu dùng Prisma migrate)
npx prisma migrate dev --name <ten_migration>

# Generate lại Prisma Client sau khi sửa schema.prisma
npx prisma generate

# Mở giao diện trực quan Prisma Studio quản lý dữ liệu
npx prisma studio
```

> *Lưu ý: Thực hiện các lệnh Prisma trong thư mục `backend/` hoặc thông qua scripts.*

## Cấu trúc thư mục

```text
invoice-AIR/
├── backend/                       # NestJS API & Prisma ORM
│   ├── prisma/                    # Schema database & migrations
│   │   ├── schema.prisma
│   │   └── dev.db
│   └── src/
│       ├── invoices/              # Quản lý hóa đơn, sinh mã, tính tiền
│       ├── services-catalog/      # Danh mục dịch vụ mẫu
│       ├── delivery/              # Gửi hóa đơn (Email, Zalo, Delivery Logs)
│       ├── document/              # Tạo tài liệu & xuất PDF
│       ├── settings/              # Cài đặt doanh nghiệp, VietQR, số nhảy
│       ├── auth/                  # Xác thực, tài khoản & JWT Guard
│       └── prisma/                # Prisma Service kết nối CSDL
├── frontend/                      # Next.js 15 App Router & Tailwind CSS
│   └── src/
│       ├── app/                   # App Router pages (invoices, services, history, settings)
│       ├── components/            # InvoiceTemplateRenderer, Sidebar, AppShell
│       └── lib/                   # API client, number-to-words VNĐ
├── packages/                      # Monorepo Shared Libraries
│   ├── types/                     # TypeScript interface & types dùng chung
│   └── validation/                # Zod validation schemas
├── .env.example                   # Mẫu cấu hình biến môi trường
├── pnpm-workspace.yaml            # Cấu hình workspace
└── package.json                   # Monorepo scripts gốc
```
