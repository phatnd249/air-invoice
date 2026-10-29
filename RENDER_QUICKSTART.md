# 🚀 Deploy Backend lên Render - Quick Start

## ⚡ 5 Bước Deploy Nhanh

### 1️⃣ Generate Secrets
```bash
node scripts/generate-render-secrets.js
```
Copy output để dùng ở bước 3.

### 2️⃣ Tạo Render Account
- Đăng ký: https://render.com (dùng GitHub)
- Connect repo: `phatnd249/air-invoice`

### 3️⃣ Deploy Web Service

**Option A: Blueprint (Khuyến nghị)**
```bash
git add render.yaml
git commit -m "chore: add Render config"
git push origin main
```
Sau đó: Render Dashboard → New → Blueprint → Apply

**Option B: Thủ công**

Render Dashboard → New → Web Service:

| Setting | Value |
|---------|-------|
| Runtime | Docker |
| Branch | develop |
| Dockerfile | `./Dockerfile` |
| **Plan** | **Starter ($7/mo)** ⚠️ |
| Region | Singapore |

### 4️⃣ Thêm Environment Variables

Click "Add Environment Variable" và paste:

```bash
PORT=10000
NODE_ENV=production

# Từ output của bước 1:
JWT_SECRET=<copy từ generate script>
REFRESH_TOKEN_SECRET=<copy từ generate script>

# Từ Supabase:
DATABASE_URL=postgresql://postgres.xxx:[PASSWORD]@db.xxx.supabase.co:5432/postgres

# Sẽ update sau khi deploy Vercel:
APP_URL=https://your-app.vercel.app
CORS_ORIGINS=https://your-app.vercel.app

# PDF settings:
PDF_BROWSER_IDLE_TIMEOUT_MS=60000
PDF_RENDER_TIMEOUT_MS=30000

# Email (tùy chọn):
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM=your-email@gmail.com
```

### 5️⃣ Deploy & Test

Click "Create Web Service" → Đợi 8 phút

Test API:
```bash
curl https://invoice-air-backend.onrender.com/api
```

---

## ⚠️ QUAN TRỌNG

- ❌ **KHÔNG dùng Free plan** - Chromium sẽ crash
- ✅ **Phải dùng Starter ($7/mo)** - 512MB RAM, không sleep
- 🔐 **Generate secrets MỚI** - Không dùng lại secrets cũ
- 🔄 **Update CORS** sau khi deploy Vercel

---

## 📚 Chi Tiết

- **Hướng dẫn đầy đủ:** `docs/RENDER_DEPLOYMENT.md`
- **Template ENV:** `docs/RENDER_ENV_VARIABLES.txt`
- **Troubleshooting:** Xem phần cuối `docs/RENDER_DEPLOYMENT.md`

---

## ✅ Checklist

- [ ] Generate secrets mới
- [ ] Tạo Render account
- [ ] Chọn **Starter plan** (không phải Free)
- [ ] Thêm DATABASE_URL từ Supabase
- [ ] Thêm JWT secrets từ script
- [ ] Deploy thành công
- [ ] Test API endpoint
- [ ] Deploy frontend lên Vercel
- [ ] Update CORS_ORIGINS với Vercel URL

---

**Need help?** Xem `docs/RENDER_DEPLOYMENT.md` để biết chi tiết!
