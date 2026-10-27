#!/usr/bin/env node
/**
 * Test Database Connection String
 * Usage: node scripts/test-database-connection.js
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function testConnection() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 DATABASE CONNECTION TEST');
  console.log('='.repeat(70) + '\n');

  // Check if DATABASE_URL is set, or read from backend/.env
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    const fs = require('fs');
    const path = require('path');
    const envPaths = [path.join(__dirname, '../backend/.env'), path.join(__dirname, '../.env')];
    for (const p of envPaths) {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf8');
        const match = content.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
        if (match) {
          dbUrl = match[1];
          console.log(`📁 Loaded DATABASE_URL from ${path.relative(process.cwd(), p)}`);
          break;
        }
      }
    }
  }
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not set in environment or backend/.env!');
    console.log('\nSet it in backend/.env or export DATABASE_URL="postgresql://..."');
    process.exit(1);
  }

  // Parse connection string (hide password)
  try {
    const url = new URL(dbUrl);
    const masked = dbUrl.replace(/:([^@]+)@/, ':***@');
    
    console.log('📝 Connection String (masked):');
    console.log(masked);
    console.log('');
    
    console.log('📊 Parsed Details:');
    console.log(`  Protocol: ${url.protocol}`);
    console.log(`  Host:     ${url.hostname}`);
    console.log(`  Port:     ${url.port}`);
    console.log(`  Database: ${url.pathname.slice(1)}`);
    console.log(`  Username: ${url.username}`);
    console.log(`  Password: ${url.password ? '***' + url.password.slice(-4) : 'MISSING!'}`);
    console.log(`  SSL Mode: ${url.searchParams.get('sslmode') || 'NOT SET'}`);
    console.log('');

    // Validation checks
    let hasErrors = false;

    console.log('✓ Validation Checks:\n');

    // Check protocol
    if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
      console.log('  ❌ Protocol must be postgresql:// or postgres://');
      hasErrors = true;
    } else {
      console.log('  ✅ Protocol is correct');
    }

    // Check host
    const isSupabase = url.hostname.includes('supabase.co') || url.hostname.includes('pooler.supabase.com');
    if (!isSupabase) {
      console.log('  ⚠️  Host does not appear to be Supabase');
    } else {
      console.log('  ✅ Host is Supabase');
    }

    // Check port
    if (url.port === '5432') {
      if (url.hostname.includes('pooler.supabase.com')) {
        console.log('  ✅ Port 5432 (Pooler - Session mode, works with IPv4)');
      } else {
        console.log('  ⚠️  Port 5432 (Direct connection - only supports IPv6 on Supabase free tier)');
      }
    } else if (url.port === '6543') {
      console.log('  ✅ Port 6543 (Pooler - Transaction mode)');
    } else {
      console.log(`  ⚠️  Unusual port: ${url.port}`);
    }

    // Check username format for Supabase
    if (url.hostname.includes('pooler.supabase.com')) {
      if (!url.username.includes('.')) {
        console.log('  ❌ Supabase pooler username must be in format: postgres.PROJECT_REF');
        console.log(`     Your username: ${url.username}`);
        console.log(`     Should be: postgres.wuczeifawuadgjfzisyw`);
        hasErrors = true;
      } else {
        console.log('  ✅ Username format is correct (postgres.PROJECT_REF)');
      }
    }

    // Check password
    if (!url.password) {
      console.log('  ❌ Password is missing!');
      hasErrors = true;
    } else if (url.password.includes('[') || url.password.includes(']')) {
      console.log('  ❌ Password still has placeholder [PASSWORD]');
      hasErrors = true;
    } else {
      console.log('  ✅ Password is set');
    }

    console.log('');

    if (hasErrors) {
      console.log('❌ VALIDATION FAILED - Fix the errors above\n');
      console.log('📋 Correct format for Direct connection:');
      console.log('postgresql://postgres.PROJECT_REF:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres?sslmode=require\n');
      console.log('📋 Correct format for Session mode (recommended):');
      console.log('postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres\n');
      process.exit(1);
    }

    // Try to connect with Prisma
    console.log('🔌 Testing connection with Prisma...\n');
    
    const { execSync } = require('child_process');
    const path = require('path');
    execSync('npx prisma db execute --schema prisma/schema.prisma --stdin', {
      cwd: path.join(__dirname, '../backend'),
      input: 'SELECT 1;\n',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, DATABASE_URL: dbUrl }
    });

    console.log('✅ CONNECTION SUCCESSFUL!\n');
    console.log('🎉 Your DATABASE_URL is correct and working!');
    console.log('📝 You can now use this in Render environment variables.\n');
    
  } catch (error) {
    console.log('❌ CONNECTION FAILED!\n');
    console.log('Error:', error.message);
    console.log('\n🔍 Possible issues:');
    console.log('  1. Password is incorrect');
    console.log('  2. Database server is down');
    console.log('  3. SSL mode is required but not set');
    console.log('  4. Firewall blocking connection\n');
    process.exit(1);
  }
}

testConnection();
