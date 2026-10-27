# Công Nghệ Sử Dụng Trong Dự Án (Tech Stack)

Dự án: **Invoice System (Hệ thống tạo & quản lý hóa đơn)**

---

## 1. Kiến trúc Tổng thể & Monorepo
* **Package Manager**: `pnpm` (Workspace Monorepo)
* **Cấu trúc thư mục**:
  * `frontend/`: Ứng dụng Frontend (Next.js)
  * `backend/`: REST API Backend (NestJS)
  * `packages/types/`: Chứa TypeScript interfaces / DTOs dùng chung
  * `packages/validation/`: Chứa Zod schema xác thực dữ liệu chung
  * `packages/config/`: ESLint, Prettier, TypeScript configs dùng chung

---

## 2. Frontend (`frontend/`)
* **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
* **Ngôn ngữ**: TypeScript
* **Styling**: Tailwind CSS
* **UI Components**: shadcn/ui & Lucide Icons
* **Form & Validation**: React Hook Form + Zod (`@hookform/resolvers`)
* **State Management & Data Fetching**: TanStack Query (React Query)
* **HTTP Client**: Axios / Fetch API

---

## 3. Backend (`backend/`)
* **Framework**: [NestJS](https://nestjs.com/) (Module-based Architecture)
* **Ngôn ngữ**: TypeScript
* **ORM & Database Client**: Prisma ORM
* **Modules Ban đầu**:
  1. `AuthModule`: Xác thực người dùng, cấp phát JWT & Refresh token
  2. `InvoicesModule`: Quản lý hóa đơn (CRUD, draft, autosave, change history)
  3. `TemplatesModule`: Quản lý mẫu hóa đơn
  4. `SettingsModule`: Cài đặt thông tin doanh nghiệp, số hóa đơn, ngân hàng
  5. `FilesModule`: Quản lý upload & liên kết tài nguyên trên Cloudflare R2
  6. `DeliveryModule`: Gửi email hóa đơn & tạo liên kết xem trực tuyến

---

## 4. Cơ sở dữ liệu (Database)
* **Database**: **SQLite / libSQL** (Chuẩn bị sẵn sàng đồng bộ hoặc deploy qua Turso/libSQL)
* **ORM**: **Prisma**
* *Lưu ý*: Không sử dụng PostgreSQL / MongoDB trong giai đoạn MVP.

---

## 5. Xuất tài liệu & Render PDF (Document Engine)
* **Template Engine**: HTML5 + CSS (Pixel-perfect, đồng bộ giữa Preview trên Web và file PDF)
* **PDF Generator**: [Playwright](https://playwright.dev/) headless browser render HTML sang PDF
* **Khổ giấy hỗ trợ ban đầu**: A4, A5 (mở rộng Thermal 80mm sau)

---

## 6. Lưu trữ tệp tin (File Storage)
* **Dịch vụ**: **Cloudflare R2** (S3-compatible Object Storage)
* **Dữ liệu lưu trữ**: Logo doanh nghiệp, file Invoice PDF đã tạo, Template assets
* *Nguyên tắc*: Không lưu binary files trực tiếp vào database.

---

## 7. Email & Giao tiếp (Delivery)
* **Dịch vụ**: **SMTP** / **Resend**
* **Nhiệm vụ**: Gửi hóa đơn đính kèm file PDF, gửi email thông báo kèm đường link xem hóa đơn trực tuyến.

---

## 8. Bảo mật & Xác thực (Auth & Security)
* **Cơ chế**: JWT Access Token (ngắn hạn) + Refresh Token (dài hạn lưu an toàn)
* **Mã hóa mật khẩu**: `bcrypt` / `argon2`
* **Tính năng MVP**: Đăng nhập, Đăng xuất, Refresh Token, Đổi mật khẩu.

---

## 9. Hạ tầng & Triển khai (DevOps & Deployment)
* **Containerization**: Docker & Docker Compose
* **Web Server / Reverse Proxy**: Nginx
* **Môi trường**: VPS Linux
* **Sơ đồ triển khai MVP**:
  ```
  [User Browser]
         │
      (Nginx)
     ┌───┴───┐
     ▼       ▼
  Next.js   NestJS ──► SQLite/libSQL (Prisma)
     │       │
     │       ├──► Playwright (Render PDF)
     │       ├──► Cloudflare R2 (S3 Storage)
     │       └──► SMTP / Resend (Gửi mail)
  ```

---

## 10. Giới hạn phạm vi MVP (Không triển khai)
* Không tích hợp: Redis, BullMQ, MongoDB, PostgreSQL, Elasticsearch, Kubernetes, Microservices.
* Không triển khai: Quản lý kho (Inventory), Quản lý sản phẩm nâng cao, POS bán hàng, CRM khách hàng, Kế toán công nợ chuyên sâu.
