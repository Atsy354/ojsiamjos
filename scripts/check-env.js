// scripts/check-env.js
// Script untuk mengecek apakah semua environment variables sudah di-set

const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');

console.log('🔍 Checking environment variables...\n');

if (!fs.existsSync(envPath)) {
  console.error('❌ File .env.local tidak ditemukan!');
  console.log('\n📝 Langkah-langkah:');
  console.log('1. Copy .env.local.example ke .env.local:');
  console.log('   cp .env.local.example .env.local');
  console.log('\n2. Edit .env.local dan isi dengan credentials dari Supabase');
  console.log('\n3. Jalankan script ini lagi untuk verifikasi');
  process.exit(1);
}

// Load .env.local
require('dotenv').config({ path: envPath });

const requiredVars = {
  'DATABASE_URL': 'Supabase Connection Pooling URL',
  'DIRECT_URL': 'Supabase Direct Connection URL',
  'JWT_SECRET': 'JWT Secret Key',
  'NEXT_PUBLIC_SUPABASE_URL': 'Supabase Project URL',
  'SUPABASE_SERVICE_ROLE_KEY': 'Supabase Service Role Key',
};

const optionalVars = {
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Supabase Anon Key (optional)',
  'JWT_EXPIRES_IN': 'JWT Expiration (optional, default: 7d)',
};

let hasError = false;
let hasWarning = false;

console.log('✅ Required Variables:\n');
for (const [key, description] of Object.entries(requiredVars)) {
  const value = process.env[key];
  if (!value || value.includes('[PROJECT_REF]') || value.includes('[YOUR-PASSWORD]') || value.includes('your-')) {
    console.log(`❌ ${key}: MISSING atau masih placeholder`);
    console.log(`   → ${description}`);
    hasError = true;
  } else {
    // Mask sensitive data
    const masked = key.includes('SECRET') || key.includes('KEY') || key.includes('PASSWORD')
      ? value.substring(0, 10) + '...' + value.substring(value.length - 5)
      : value.substring(0, 50) + (value.length > 50 ? '...' : '');
    console.log(`✅ ${key}: OK`);
    console.log(`   → ${masked}`);
  }
}

console.log('\n⚠️  Optional Variables:\n');
for (const [key, description] of Object.entries(optionalVars)) {
  const value = process.env[key];
  if (!value || value.includes('your-')) {
    console.log(`⚠️  ${key}: Not set (optional)`);
    console.log(`   → ${description}`);
    hasWarning = true;
  } else {
    console.log(`✅ ${key}: OK`);
  }
}

// Validation checks
console.log('\n🔍 Validation Checks:\n');

// Check DATABASE_URL format
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl.includes('pgbouncer=true')) {
    console.log('⚠️  DATABASE_URL: Tidak ada pgbouncer=true');
    hasWarning = true;
  }
  if (!dbUrl.includes(':6543')) {
    console.log('⚠️  DATABASE_URL: Port harus 6543 untuk connection pooling');
    hasWarning = true;
  } else {
    console.log('✅ DATABASE_URL: Format connection pooling OK');
  }
}

// Check DIRECT_URL format
if (process.env.DIRECT_URL) {
  const directUrl = process.env.DIRECT_URL;
  if (directUrl.includes('pgbouncer')) {
    console.log('⚠️  DIRECT_URL: Seharusnya tidak ada pgbouncer');
    hasWarning = true;
  }
  if (!directUrl.includes(':5432')) {
    console.log('⚠️  DIRECT_URL: Port harus 5432 untuk direct connection');
    hasWarning = true;
  } else {
    console.log('✅ DIRECT_URL: Format direct connection OK');
  }
}

// Check JWT_SECRET length
if (process.env.JWT_SECRET) {
  if (process.env.JWT_SECRET.length < 32) {
    console.log('⚠️  JWT_SECRET: Minimal 32 karakter (current: ' + process.env.JWT_SECRET.length + ')');
    hasWarning = true;
  } else {
    console.log('✅ JWT_SECRET: Panjang OK (' + process.env.JWT_SECRET.length + ' chars)');
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasError) {
  console.log('❌ Setup belum lengkap!');
  console.log('\nSilakan edit .env.local dan isi semua required variables.');
  process.exit(1);
} else if (hasWarning) {
  console.log('⚠️  Setup hampir selesai, ada beberapa warnings.');
  console.log('\nAnda bisa melanjutkan, tapi sebaiknya perbaiki warnings di atas.');
} else {
  console.log('✅ Semua environment variables sudah di-set dengan benar!');
  console.log('\nLangkah selanjutnya:');
  console.log('1. npx prisma generate');
  console.log('2. npx prisma db push');
  console.log('3. npm run db:seed');
}
console.log('='.repeat(50));

