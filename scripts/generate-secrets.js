#!/usr/bin/env node

/**
 * Generate secure JWT secrets for Invoice-AIR
 * Usage: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('='.repeat(60));
console.log('🔐 SECURE JWT SECRETS GENERATOR');
console.log('='.repeat(60));
console.log('');
console.log('Copy các giá trị này vào file backend/.env của bạn:\n');

const jwtSecret = crypto.randomBytes(64).toString('hex');
const refreshSecret = crypto.randomBytes(64).toString('hex');

console.log(`JWT_SECRET="${jwtSecret}"`);
console.log(`REFRESH_TOKEN_SECRET="${refreshSecret}"`);

console.log('');
console.log('='.repeat(60));
console.log('✅ Secrets đã được tạo thành công!');
console.log('⚠️  LƯU Ý: Mỗi lần generate sẽ tạo ra secrets mới.');
console.log('⚠️  Khi thay đổi secrets, tất cả user phải login lại.');
console.log('='.repeat(60));
