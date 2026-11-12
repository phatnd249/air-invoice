#!/bin/sh
# ===================================================================
# 🚀 PRODUCTION STARTUP SCRIPT
# ===================================================================
# Handles database migrations and service startup with proper logging
# ===================================================================

set -e  # Exit on error

echo "🚀 Starting Invoice-AIR Backend..."
echo "📍 Environment: ${NODE_ENV:-production}"
echo "🔌 Port: ${PORT:-4000}"

# Change to backend directory
cd backend || exit 1

# Run database migrations / schema sync
echo ""
echo "🔄 Running database migrations / schema sync..."
if pnpm exec prisma migrate deploy; then
    echo "✅ Migrations completed successfully"
elif pnpm exec prisma db push --skip-generate; then
    echo "✅ Database schema synced with prisma db push"
else
    echo "⚠️  Migration & db push failed"
    echo "📝 Continuing with server startup..."
fi

# Return to root directory
cd ..

# Start the production server
echo ""
echo "🎬 Starting production server..."
echo "📦 Command: pnpm --filter ./backend start:prod"
echo ""

exec pnpm --filter ./backend start:prod
