# 🎨 Hướng Dẫn Deploy Backend lên Render

## 📋 Yêu Cầu Trước Khi Deploy

- ✅ Tài khoản GitHub với repo `phatnd249/air-invoice`
- ✅ Tài khoản Render: https://render.com (đăng ký bằng GitHub)
- ✅ Database PostgreSQL đã setup (Supabase hoặc Render Postgres)
- ✅ Gmail App Password cho SMTP (tùy chọn)

---

## 🚀 Bước 1: Chuẩn Bị Environment Variables

### 1.1. Generate JWT Secrets

Chạy lệnh này để tạo JWT secrets mới:

```bash
cd backend
node -e "console.log('JWT_SECRET='+require('crypto').randomBytes(64).toString('hex')); console.log('REFRESH_TOKEN_SECRET='+require('crypto').randomBytes(64).toString('hex'))"
```

**Output mẫu** (copy để dùng ở bước sau):
```
JWT_SECRET=a1b2c3d4e5f6....(128 ký tự)
REFRESH_TOKEN_SECRET=x9y8z7w6v5u4....(128 ký tự)
```

### 1.2. Lấy DATABASE_URL từ Supabase

1. Vào Supabase Dashboard: https://supabase.com/dashboard
2. Chọn project → Settings → Database
3. Copy **Connection string** (URI format)
4. Thay `[YOUR-PASSWORD]` bằng password thật

**Format:**
```
postgresql://postgres.wuczeifawuadgjfzisyw:[YOUR-PASSWORD]@db.wuczeifawuadgjfzisyw.supabase.co:5432/postgres
```

### 1.3. Tạo Gmail App Password (Tùy chọn cho Email)

1. Vào https://myaccount.google.com/apppasswords
2. Tạo App Password mới cho "Mail"
3. Copy password 16 ký tự (dạng: `xxxx xxxx xxxx xxxx`)

---

## 🎯 Bước 2: Deploy lên Render

### Option A: Deploy bằng Blueprint (Khuyến nghị)

1. **Push render.yaml lên GitHub:**
```bash
git add render.yaml
git commit -m "chore: add Render deployment config"
git push origin develop
```

2. **Tạo Web Service trong Render:**
   - Vào https://dashboard.render.com
   - Click **"New +"** → **"Blueprint"**
   - Connect repo: `phatnd249/air-invoice`
   - Branch: `develop`
   - Click **"Apply"**

3. **Render sẽ hỏi các biến môi trường:**

### Option B: Deploy thủ công (Dễ hơn)

1. **Tạo Web Service:**
   - Vào https://dashboard.render.com
   - Click **"New +"** → **"Web Service"**
   - Connect repo: `phatnd249/air-invoice`
   - Configure:

| Setting | Value |
|---------|-------|
| **Name** | `invoice-air-backend` |
| **Region** | `Singapore` |
| **Branch** | `develop` |
| **Root Directory** | *(để trống)* |
| **Runtime** | `Docker` |
| **Dockerfile Path** | `./Dockerfile` |
| **Docker Context** | `.` |
| **Plan** | `Starter ($7/month)` ⚠️ Free sẽ crash |

2. **Scroll xuống "Environment Variables"** → Click **"Add Environment Variable"**

---

## 🔐 Bước 3: Thêm Environment Variables

Copy toàn bộ các biến này vào Render Dashboard:

### 🔹 Required Variables (BẮT BUỘC)

```bash
# Port & Environment
PORT=10000
NODE_ENV=production

# Database - THAY BẰNG SUPABASE URL CỦA BẠN
DATABASE_URL=postgresql://postgres.wuczeifawuadgjfzisyw:[YOUR-PASSWORD]@db.wuczeifawuadgjfzisyw.supabase.co:5432/postgres

# JWT Secrets - THAY BẰNG SECRETS BẠN GENERATE Ở BƯỚC 1.1
JWT_SECRET=your-128-char-secret-from-step-1.1
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-128-char-secret-from-step-1.1
REFRESH_TOKEN_EXPIRES_IN=7d
PASSWORD_RESET_TTL_MINUTES=60

# Frontend URLs
APP_URL=https://your-app.vercel.app
# '*' = PUBLIC API (mọi website gọi được) | hoặc danh sách domain cách nhau bởi dấu phẩy
CORS_ORIGINS=*

# PDF/Chromium Settings
PDF_BROWSER_IDLE_TIMEOUT_MS=60000
PDF_RENDER_TIMEOUT_MS=30000
```

### 🔹 Optional Variables (TÙY CHỌN - Cho email)

```bash
# SMTP - CHỈ HOẠT ĐỘNG VỚI STARTER PLAN ($7/mo)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM=your-email@gmail.com
```

---

## ⚙️ Bước 4: Advanced Settings

Trong Render dashboard, scroll xuống **"Advanced"**:

### Build Command
```bash
# Để trống - Dockerfile tự động build
```

### Start Command  
```bash
# Để trống - Dockerfile CMD sẽ chạy
```

### Health Check Path
```
/api
```

### Auto-Deploy
- ✅ **Enable** "Auto-Deploy" → Tự động deploy khi push code

---

## 🚀 Bước 5: Deploy!

1. Click **"Create Web Service"**
2. Đợi 5-10 phút để Render:
   - Pull Docker image (~1.5GB Playwright)
   - Build ứng dụng
   - Run migrations: `prisma migrate deploy`
   - Start server

3. Xem logs để theo dõi:
   - Click vào service name → Tab **"Logs"**
   - Tìm dòng: `✓ Application is running on: http://0.0.0.0:10000/api`

---

## ✅ Bước 6: Kiểm Tra Deployment

### 6.1. Lấy Backend URL

Render sẽ cấp URL dạng:
```
https://invoice-air-backend.onrender.com
```

### 6.2. Test API

```bash
# Test health check
curl https://invoice-air-backend.onrender.com/api

# Kết quả mong đợi:
# "Invoice-AIR API v1.0 - Production Ready"
```

### 6.3. Test đăng nhập

```bash
curl -X POST https://invoice-air-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@airobotics.edu.vn",
    "password": "Admin@123"
  }'
```

---

## 🔄 Bước 7: Update Frontend (Vercel)

Sau khi backend deploy xong, cần update frontend:

### 7.1. Update Vercel Environment Variable

Vào Vercel Dashboard:
```
Settings → Environment Variables → NEXT_PUBLIC_API_URL
Value: https://invoice-air-backend.onrender.com/api
```

### 7.2. Redeploy Frontend

> ⚠️ **Quan trọng:** production deploy từ branch `develop`, không phải `main`.
> Vercel Dashboard → Project → **Settings → Git → Production Branch** = `develop`.
> Nếu để `main`, code mới push lên `develop` sẽ chỉ tạo Preview Deployment và
> domain chính (invoice.share4happy.com) vẫn chạy bản cũ.

```bash
# Vercel sẽ tự động redeploy khi push develop, hoặc force redeploy:
vercel --prod
```

---

## 🔄 Bước 8: Cấu hình CORS trên Render

Mặc định API đang **public** (`CORS_ORIGINS=*`) — mọi landing page/CRM/n8n đều gọi được, **không cần thêm từng domain vào code**.

1. Vào Render Dashboard → Service → Environment
2. Biến `CORS_ORIGINS`:
```
# Mở public (khuyến nghị cho tích hợp landing page)
CORS_ORIGINS=*

# Hoặc chỉ giới hạn các domain được phép (hỗ trợ wildcard)
CORS_ORIGINS=https://invoice-air.vercel.app,https://*.share4happy.com
```
3. Update biến `APP_URL`:
```
APP_URL=https://invoice-air.vercel.app
```
4. Click **"Save Changes"** → Service sẽ tự động redeploy

---

## ⚠️ LƯU Ý QUAN TRỌNG

### 🔴 **KHÔNG dùng Free Plan cho project này!**

| Issue | Free Plan | Starter Plan ($7/mo) |
|-------|-----------|---------------------|
| **RAM** | 512MB | 512MB |
| **Sleep** | ✅ Sau 15 phút | ❌ Không sleep |
| **Chromium** | ❌ Crash thường xuyên | ✅ Chạy ổn định |
| **Cold start** | ~60 giây | Không có |
| **SMTP** | ❌ Bị chặn | ✅ Hoạt động |

### 🟡 **Starter Plan vẫn có hạn chế:**

- CPU: 0.5 CPU → PDF generation chậm hơn Railway/Fly.io
- RAM: 512MB → Chromium chiếm ~300MB, còn lại 200MB cho app
- Build time: Lâu hơn (Playwright image 1.5GB)

### 🟢 **Tips tối ưu:**

1. **Giảm RAM Chromium:** Thêm vào Dockerfile trước dòng `CMD`:
```dockerfile
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0
```

2. **Monitor RAM usage:**
   - Render Dashboard → Metrics → Memory
   - Nếu thấy >450MB → có thể bị OOM kill

3. **Set timeout hợp lý:**
```bash
PDF_RENDER_TIMEOUT_MS=30000  # Tăng lên 45000 nếu thường xuyên timeout
```

---

## 🐛 Troubleshooting

### Issue 1: Build failed - "Playwright browser not found"

**Giải pháp:**
```dockerfile
# Kiểm tra Dockerfile có dùng đúng base image:
FROM mcr.microsoft.com/playwright:v1.50.0-noble
```

### Issue 2: Container crashed - "Out of memory"

**Nguyên nhân:** Free plan không đủ RAM

**Giải pháp:**
- ✅ Nâng lên Starter plan
- ⚠️ Hoặc chuyển sang Fly.io / Railway

### Issue 3: "Health check failed"

**Kiểm tra:**
```bash
# SSH vào container (Render Shell)
curl http://localhost:10000/api

# Xem logs:
# Render Dashboard → Logs tab
```

### Issue 4: "Migration failed"

**Giải pháp:**
```bash
# Chạy migration thủ công từ local:
cd backend
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### Issue 5: CORS errors

**Kiểm tra:**
1. `CORS_ORIGINS` trong Render có đúng Vercel URL không?
2. Vercel URL có `https://` chưa? (không có `/` cuối)
3. Frontend `.env.local` có đúng backend URL không?

---

## 📊 So Sánh Deploy Options

| Platform | Cost | RAM | Sleep | Deploy Time | Khuyến nghị |
|----------|------|-----|-------|-------------|-------------|
| **Render Starter** | $7/mo | 512MB | ❌ | ~8 phút | ⭐⭐⭐ OK |
| **Railway Hobby** | $5/mo | 512MB | ❌ | ~5 phút | ⭐⭐⭐⭐⭐ Tốt nhất |
| **Fly.io** | $0-3/mo | 256MB×3 | ❌ | ~6 phút | ⭐⭐⭐⭐ Tốt |
| **Render Free** | $0 | 512MB | ✅ | ~8 phút | ❌ Không dùng |

---

## 📞 Cần Hỗ Trợ?

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- GitHub Issues: https://github.com/phatnd249/air-invoice/issues

---

## ✅ Checklist Deploy Hoàn Chỉnh

- [ ] Tạo Render account và connect GitHub
- [ ] Generate JWT secrets mới
- [ ] Copy DATABASE_URL từ Supabase
- [ ] Tạo Gmail App Password (nếu dùng email)
- [ ] Push render.yaml lên GitHub
- [ ] Tạo Web Service trong Render (Starter plan)
- [ ] Thêm tất cả environment variables
- [ ] Đợi build và deploy thành công (~8 phút)
- [ ] Test API endpoint: `/api`
- [ ] Test login endpoint: `/api/auth/login`
- [ ] Lấy Render URL và update vào Vercel
- [ ] Update CORS_ORIGINS trên Render với Vercel URL
- [ ] Test toàn bộ flow từ frontend

---

**Hoàn tất!** 🎉 Backend đã chạy trên Render.
