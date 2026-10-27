#!/usr/bin/env node
/**
 * ===================================================================
 * 🔐 GENERATE SECRETS FOR RENDER DEPLOYMENT
 * ===================================================================
 * Script tạo JWT secrets và hiển thị format sẵn sàng copy vào Render
 * 
 * Usage:
 *   node scripts/generate-render-secrets.js
 * ===================================================================
 */

const crypto = require('crypto');

console.log('\n' + '='.repeat(70));
console.log('🔐 RENDER ENVIRONMENT VARIABLES - JWT SECRETS');
console.log('='.repeat(70));
console.log('\n📋 Copy các dòng bên dưới vào Render Dashboard:\n');
console.log('Settings → Environment → Environment Variables\n');
console.log('-'.repeat(70));

const jwtSecret = crypto.randomBytes(64).toString('hex');
const refreshSecret = crypto.randomBytes(64).toString('hex');

console.log('JWT_SECRET=' + jwtSecret);
console.log('REFRESH_TOKEN_SECRET=' + refreshSecret);

console.log('-'.repeat(70));
console.log('\n✅ Secrets đã được generate thành công!');
console.log('⚠️  LƯU Ý: Mỗi secret dài 128 ký tự (hex format)\n');

console.log('📝 Các biến còn lại cần thêm vào Render:\n');

console.log('DATABASE_URL=postgresql://postgres.xxx:[PASSWORD]@db.xxx.supabase.co:5432/postgres');
console.log('APP_URL=https://your-app.vercel.app');
console.log('CORS_ORIGINS=https://your-app.vercel.app');
console.log('SMTP_USER=your-email@gmail.com');
console.log('SMTP_PASS=xxxx xxxx xxxx xxxx');
console.log('SMTP_FROM=your-email@gmail.com\n');

console.log('📚 Chi tiết: docs/RENDER_DEPLOYMENT.md');
console.log('📋 Template: docs/RENDER_ENV_VARIABLES.txt\n');
console.log('='.repeat(70) + '\n');
