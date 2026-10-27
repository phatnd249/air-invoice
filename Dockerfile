# ===================================================================
# 🐳 DOCKERFILE - Backend Production (Railway Deployment)
# ===================================================================
# Optimized for Railway.app deployment
# Includes Playwright/Chromium for PDF generation
# ===================================================================

# Sử dụng image chính thức từ Microsoft Playwright (chứa sẵn Node.js, Chromium và đầy đủ thư viện Linux)
FROM mcr.microsoft.com/playwright:v1.50.0-noble

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

# Generate Prisma Client
RUN cd backend && pnpm exec prisma generate

# Build backend
RUN pnpm --filter "./backend" build

# Railway automatically sets PORT environment variable
ENV PORT=4000
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:4000/api', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run migrations then start production server
CMD ["sh", "-c", "cd backend && pnpm exec prisma migrate deploy && cd .. && pnpm --filter ./backend start:prod"]
