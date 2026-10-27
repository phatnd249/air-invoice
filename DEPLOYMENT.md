# 🚀 Deployment Guide - Invoice-AIR

## Architecture Overview

```
Frontend (Next.js)  →  Vercel      →  https://your-app.vercel.app
Backend (NestJS)    →  Railway     →  https://your-app.up.railway.app
Database            →  Supabase    →  PostgreSQL (already configured)
```

---

## 📋 Pre-Deployment Checklist

### ✅ Before You Start

- [ ] Code pushed to GitHub: https://github.com/phatnd249/air-invoice
- [ ] `.env` files are gitignored (verified ✅)
- [ ] Database credentials ready (Supabase PostgreSQL)
- [ ] SMTP credentials ready (Gmail app password)
- [ ] JWT secrets generated (use `node scripts/generate-secrets.js`)

---

## 🔧 Step 1: Deploy Backend to Railway

### 1.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Authorize Railway to access your repositories

### 1.2 Create New Project
```
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose: phatnd249/air-invoice
4. Railway auto-detects Dockerfile ✅
```

### 1.3 Configure Environment Variables

Go to your service → Variables tab, add these:

```bash
# Required - App Configuration
NODE_ENV=production
PORT=4000

# Required - Database (copy from Supabase)
DATABASE_URL=postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres

# Required - JWT (generate new for production!)
JWT_SECRET=<run: node scripts/generate-secrets.js>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=<different secret from above>
REFRESH_TOKEN_EXPIRES_IN=7d
PASSWORD_RESET_TTL_MINUTES=60

# Required - CORS (your Vercel domain)
CORS_ORIGINS=https://your-app.vercel.app,https://your-app-preview.vercel.app
APP_URL=https://your-app.vercel.app

# Required - Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=your-email@gmail.com

# Optional - Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=invoice-air-storage
R2_PUBLIC_URL=
```

### 1.4 Deploy & Get URL

```
1. Railway automatically starts deployment
2. Wait for build to complete (~8-12 minutes first time)
3. Go to Settings → Networking → Generate Domain
4. Copy your backend URL: https://invoice-air-backend.up.railway.app
```

### 1.5 Verify Backend

```bash
# Test health endpoint
curl https://your-backend.up.railway.app/api

# Test auth endpoint
curl https://your-backend.up.railway.app/api/auth/check-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## 🌐 Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import project: phatnd249/air-invoice

### 2.2 Configure Project

**Framework Preset:** Next.js  
**Root Directory:** `frontend`  
**Build Command:** `cd .. && pnpm install && cd frontend && pnpm build`  
**Output Directory:** `frontend/.next`  
**Install Command:** `pnpm install`

### 2.3 Environment Variables

Add in Vercel Dashboard → Settings → Environment Variables:

```bash
# Production
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api

# Preview (for PR previews)
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api
```

**IMPORTANT:** Thay `your-backend.up.railway.app` bằng Railway URL thật của bạn!

### 2.4 Deploy

```
1. Click "Deploy"
2. Vercel auto-builds and deploys
3. Get your URL: https://your-app.vercel.app
```

### 2.5 Update Backend CORS

Quay lại Railway → Backend service → Variables:

```bash
# Update CORS_ORIGINS với Vercel URL thật
CORS_ORIGINS=https://your-actual-app.vercel.app
APP_URL=https://your-actual-app.vercel.app
```

Redeploy backend sau khi update CORS.

---

## 🔐 Step 3: Security Hardening

### 3.1 Rotate All Secrets

```bash
# Generate new production secrets (DIFFERENT from development)
node scripts/generate-secrets.js

# Update Railway environment variables
# Never reuse dev secrets in production!
```

### 3.2 Database Migration

Railway runs `prisma migrate deploy` automatically via Dockerfile CMD.  
Check logs to verify:

```
Railway Dashboard → Deployments → View Logs
Look for: "Migration deployed successfully"
```

### 3.3 Change Default Admin Password

```bash
# Login với account mặc định
Email: admin@airobotics.edu.vn
Password: admin123

# ĐỔI NGAY password sau khi login lần đầu!
```

---

## 📊 Step 4: Verify Full Stack

### Test Flow:

1. **Frontend loads:** https://your-app.vercel.app ✅
2. **Login page works** ✅
3. **Register new user** ✅
4. **Create invoice** ✅
5. **Generate PDF** ✅
6. **Send email** ✅
7. **Password reset** ✅

### Common Issues:

| Issue | Solution |
|---|---|
| CORS error | Update `CORS_ORIGINS` in Railway with exact Vercel domain |
| API 404 | Check `NEXT_PUBLIC_API_URL` ends with `/api` |
| Database connection failed | Verify `DATABASE_URL` in Railway |
| Email not sending | Check SMTP credentials, use Gmail app password |
| JWT invalid | Regenerate secrets, make sure they're 128 chars hex |

---

## 🔄 Continuous Deployment

Both platforms auto-deploy on git push:

```bash
git add .
git commit -m "feat: add new feature"
git push origin main

# Railway: auto-builds backend from Dockerfile
# Vercel: auto-builds frontend from /frontend
```

---

## 💰 Cost Estimate

| Service | Plan | Cost |
|---|---|---|
| **Railway Backend** | Hobby | $5/month |
| **Vercel Frontend** | Free | $0/month |
| **Supabase DB** | Free | $0/month (current usage) |
| **Total** | | **$5/month** |

---

## 📝 Post-Deployment Checklist

- [ ] Backend health check passing
- [ ] Frontend loads correctly
- [ ] Login/register works
- [ ] Invoice creation works
- [ ] PDF generation works
- [ ] Email sending works
- [ ] Password reset works
- [ ] Admin password changed
- [ ] Production secrets rotated
- [ ] CORS configured correctly
- [ ] Database migrations applied
- [ ] Monitoring/logs reviewed

---

## 🆘 Troubleshooting

### Backend won't start on Railway

```bash
# Check logs
Railway Dashboard → Deployments → Logs

# Common issues:
- Missing DATABASE_URL
- Missing JWT_SECRET
- Dockerfile build failed (check Playwright installation)
```

### Frontend can't connect to backend

```bash
# Verify environment variable
Vercel Dashboard → Settings → Environment Variables
Check: NEXT_PUBLIC_API_URL

# Test backend directly
curl https://your-backend.up.railway.app/api
```

### Database migration failed

```bash
# Railway logs should show prisma migrate deploy output
# If failed, manually run:
Railway CLI: railway run npx prisma migrate deploy
```

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Vercel Next.js Deployment](https://vercel.com/docs/frameworks/nextjs)
- [Prisma Railway Guide](https://www.prisma.io/docs/guides/deployment/railway)
- [Security Best Practices](./SECURITY.md)

---

## 🎉 Success!

Your Invoice-AIR system is now live:

- **Frontend:** https://your-app.vercel.app
- **Backend:** https://your-backend.up.railway.app
- **Database:** Supabase PostgreSQL (secure)

Happy invoicing! 🧾
