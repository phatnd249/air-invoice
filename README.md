# Invoice-AIR 🧾

Hệ thống quản lý và tạo hoá đơn điện tử theo chuẩn Việt Nam.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 11.9.0+
- PostgreSQL (hoặc Supabase account)

### Development Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd invoice-AIR

# 2. Install dependencies
pnpm install

# 3. Setup environment variables
cp backend/.env.local.example backend/.env
node scripts/generate-secrets.js
# Copy JWT secrets vào backend/.env

# 4. Configure database
# Điền DATABASE_URL vào backend/.env

# 5. Run migrations
cd backend
pnpm prisma migrate dev

# 6. Start development servers
cd ..
pnpm dev
```

Backend sẽ chạy tại: http://localhost:4000  
Frontend sẽ chạy tại: http://localhost:3000

## 📦 Project Structure

```
invoice-AIR/
├── backend/          # NestJS API
│   ├── src/
│   ├── prisma/       # Database schema
│   └── .env         # ⚠️ KHÔNG commit file này
├── frontend/         # Next.js App
├── packages/         # Shared packages
├── scripts/          # Utility scripts
└── docs/            # Documentation
```

## 🔐 Security

**QUAN TRỌNG:** Đọc [SECURITY.md](./SECURITY.md) trước khi deploy production.

- ✅ File `.env` đã được gitignore
- ✅ JWT secrets cần generate riêng cho mỗi môi trường
- ✅ KHÔNG hardcode credentials trong code

Generate secrets mới:
```bash
node scripts/generate-secrets.js
```

## 🛠️ Tech Stack

- **Backend:** NestJS + Prisma + PostgreSQL
- **Frontend:** Next.js 15 + React 19 + TailwindCSS
- **Auth:** JWT + Refresh Tokens
- **PDF:** Playwright/Chromium
- **Email:** Nodemailer (SMTP)
- **Storage:** Cloudflare R2 (optional)

## 📚 Documentation

- [Tech Stack Details](./docs/TECH_STACK.md)
- [Project Plan](./docs/KE_HOACH_THUC_HIEN_DU_AN.md)
- [Invoice Template Spec](./docs/INVOICE_TEMPLATE_SPEC.md)
- [Email Template Spec](./docs/EMAIL_TEMPLATE_SPEC.md)

## 🚢 Deployment

**Xem hướng dẫn chi tiết:** [DEPLOYMENT.md](./DEPLOYMENT.md)

**Quick Links:**
- Backend → [Railway](https://railway.app) - $5/tháng
- Frontend → [Vercel](https://vercel.com) - Free
- Database → Supabase PostgreSQL (đã có)

**Tổng chi phí:** $5/tháng

## 📝 Scripts

```bash
# Development
pnpm dev              # Start cả backend + frontend
pnpm dev:backend      # Chỉ backend
pnpm dev:frontend     # Chỉ frontend

# Build
pnpm build            # Build cả backend + frontend
pnpm build:backend    # Build backend + install Playwright
pnpm build:frontend   # Build frontend

# Production
pnpm start:backend    # Start backend production mode
pnpm start:frontend   # Start frontend production mode

# Database
cd backend
pnpm prisma migrate dev    # Run migrations
pnpm prisma studio         # Open Prisma Studio
pnpm prisma generate       # Generate Prisma Client

# Security
node scripts/generate-secrets.js  # Generate JWT secrets mới
```

## 🧪 Default Credentials

**Admin account** (chỉ tạo khi database trống):
- Email: `admin@airobotics.edu.vn`
- Password: `admin123`

⚠️ **Đổi password ngay sau lần đầu login!**

## 📄 License

Private - All rights reserved

## 🤝 Contributing

1. Đọc [SECURITY.md](./SECURITY.md) trước
2. Tạo branch mới: `git checkout -b feature/ten-tinh-nang`
3. Commit: `git commit -m "feat: mo ta"`
4. Push: `git push origin feature/ten-tinh-nang`
5. Tạo Pull Request

## 📧 Support

- Email: support@your-company.com
- Issues: GitHub Issues
- Security: Xem [SECURITY.md](./SECURITY.md)
