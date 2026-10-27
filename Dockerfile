# ===================================================================
# 🐳 DOCKERFILE - Backend Production (Railway Deployment)
# ===================================================================
# Optimized for Railway.app deployment
# Includes Playwright/Chromium for PDF generation
# ===================================================================

# Sử dụng image chính thức từ Microsoft Playwright (chứa sẵn Node.js, Chromium và đầy đủ thư viện Linux)
# ⚠️ Version PHẢI khớp với dependency "playwright" trong backend/package.json (1.63.0).
#    Lệch version => Chromium báo "Executable doesn't exist" khi xuất PDF.
FROM mcr.microsoft.com/playwright:v1.63.0-noble

WORKDIR /app

# Cài đặt pnpm
RUN npm install -g pnpm@11.9.0

# Copy package files for dependency installation
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json ./backend/
COPY packages/types/package.json ./packages/types/
COPY packages/validation/package.json ./packages/validation/
COPY packages/config ./packages/config/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY backend ./backend
COPY packages ./packages

# Copy startup script
COPY backend/start.sh ./backend/start.sh
RUN chmod +x ./backend/start.sh

# Generate Prisma Client
RUN cd backend && pnpm exec prisma generate

# Build backend
RUN pnpm --filter "./backend" build

# Platform (Railway/Render/Fly.io) will set PORT via environment
# Default to 4000 if not set
ENV PORT=4000
EXPOSE 4000 10000

# Giới hạn V8 heap để Node không phình quá mức trong container 512MB.
# (Đặt sau bước build để không giới hạn RAM của tsc/nest build)
ENV NODE_OPTIONS="--max-old-space-size=256"

# Health check - use PORT from env
# /api trả về text nên check status < 500
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+process.env.PORT+'/api',(r)=>{process.exit(r.statusCode<500?0:1)}).on('error',()=>process.exit(1))"

# Run migrations then start production server
CMD ["./backend/start.sh"]
