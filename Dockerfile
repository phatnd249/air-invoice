# Sử dụng image chính thức từ Microsoft Playwright (chứa sẵn Node.js, Chromium và đầy đủ thư viện Linux)
FROM mcr.microsoft.com/playwright:v1.50.0-noble

WORKDIR /app

# Cài đặt pnpm
RUN npm install -g pnpm@11.9.0

# Copy mã nguồn monorepo
COPY . .

# Cài đặt toàn bộ dependencies trong workspace
RUN pnpm install

# Build backend (đã bao gồm prisma generate)
RUN pnpm --filter "./backend" build

# Render sẽ tự động gán biến môi trường PORT (mặc định 4000)
ENV PORT=4000
EXPOSE 4000

# Khởi chạy backend production server
CMD ["pnpm", "--filter", "./backend", "start:prod"]
