# 🔐 Security Guidelines - Invoice-AIR

## Environment Variables & Secrets

### ⚠️ QUY TẮC VÀNG

1. **KHÔNG BAO GIỜ commit file `.env` vào git**
2. **KHÔNG BAO GIỜ share secrets qua Slack/Discord/Email**
3. **KHÔNG BAO GIỜ hardcode credentials trong code**
4. **LUÔN LUÔN rotate secrets khi có nghi ngờ bị lộ**

### Setup môi trường Development

```bash
# 1. Copy file mẫu
cp backend/.env.local.example backend/.env

# 2. Generate JWT secrets mới
node scripts/generate-secrets.js

# 3. Copy secrets vào backend/.env
# 4. Điền database URL và SMTP credentials
```

### Setup môi trường Production

**Railway / Render:**
1. Vào dashboard → Environment Variables
2. Add từng biến một (không upload file .env)
3. Generate secrets mới cho production (KHÁC với dev)

**Biến BẮT BUỘC:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - 128 ký tự hex
- `REFRESH_TOKEN_SECRET` - 128 ký tự hex
- `CORS_ORIGINS` - Domain frontend production
- `SMTP_USER`, `SMTP_PASS` - Email credentials

**Biến TÙY CHỌN:**
- `R2_*` - Cloudflare R2 storage (nếu dùng)
- `APP_URL` - Frontend URL (fallback)

### Generate Secrets

```bash
# Method 1: Dùng script có sẵn
node scripts/generate-secrets.js

# Method 2: Manual với Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Method 3: Manual với OpenSSL
openssl rand -hex 64
```

### Rotation Schedule

- **JWT Secrets**: Mỗi 6 tháng hoặc khi có breach
- **Database Password**: Mỗi 3 tháng
- **SMTP Password**: Khi có cảnh báo từ provider
- **R2 Keys**: Mỗi năm hoặc khi staff rời công ty

### Phát hiện Secrets bị lộ

Nếu secrets bị commit nhầm vào git:

```bash
# 1. Rotate TẤT CẢ secrets ngay lập tức
node scripts/generate-secrets.js

# 2. Update credentials trong production
# 3. Force logout tất cả users
# 4. Xóa secrets khỏi git history (nếu đã push)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env" \
  --prune-empty --tag-name-filter cat -- --all

# 5. Force push (cẩn thận!)
git push origin --force --all
```

### Checklist trước khi Deploy

- [ ] File `.env` không có trong git (`git status` không hiện)
- [ ] Secrets production KHÁC hoàn toàn với dev
- [ ] `CORS_ORIGINS` chứa domain production
- [ ] Database URL trỏ đúng database production
- [ ] SMTP credentials valid và không dùng chung với dev
- [ ] Đã test login/register trên staging

### Compliance

- **OWASP A02:2021** - Cryptographic Failures ✅
- **OWASP A07:2021** - Identification and Authentication Failures ✅
- **OWASP A05:2021** - Security Misconfiguration ✅

### Contact

Nếu phát hiện security vulnerability, liên hệ:
- Email: security@your-company.com
- Không public issue trên GitHub cho đến khi đã patch
