# 🚀 Quick Setup Guide - IamJOS Project

## 📋 Step-by-Step Setup (5 Menit)

### Step 1: Setup File .env.local

File `.env.local` sudah dibuat dari template. Sekarang edit dan isi dengan credentials:

**Lokasi file:** `D:\v0-iamjos-siswanto-v06\.env.local`

### Step 2: Dapatkan Credentials dari Supabase

#### A. Database Connection Strings

**Project URL Anda:** https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp

1. **Buka Database Settings:**
   - https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp/settings/database

2. **Cari Connection Strings:**
   - Scroll ke bawah setelah "Connection pooling configuration"
   - Atau coba tab "Connection pooling"
   - Atau Settings → API → scroll ke bagian Database

3. **Jika tidak muncul, buat manual:**
   
   Dari project URL, PROJECT_REF Anda adalah: `gmxntgpmoxpgmbyuupnp`
   
   Format untuk `.env.local`:
   ```env
   DATABASE_URL="postgresql://postgres.gmxntgpmoxpgmbyuupnp:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres:[PASSWORD]@db.gmxntgpmoxpgmbyuupnp.supabase.co:5432/postgres"
   ```
   
   **Yang perlu diganti:**
   - `[PASSWORD]` → Database password (dapatkan dari "Reset database password")
   - `[REGION]` → Region project (cek di Settings → General, contoh: `us-east-1`, `ap-southeast-1`)

#### B. API Keys

1. **Buka API Settings:**
   - https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp/settings/api

2. **Copy:**
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

#### C. Database Password

1. **Reset Password (jika belum):**
   - Settings → Database
   - Klik "Reset database password"
   - **Simpan password!** (tidak bisa dilihat lagi)

#### D. Generate JWT_SECRET

```bash
# Windows PowerShell:
$jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
Write-Host $jwtSecret
```

Atau gunakan online generator: https://generate-secret.vercel.app/32

---

### Step 3: Edit .env.local

Buka file `.env.local` dan ganti semua placeholder:

```env
# Ganti [PASSWORD] dengan database password
DATABASE_URL="postgresql://postgres.gmxntgpmoxpgmbyuupnp:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.gmxntgpmoxpgmbyuupnp.supabase.co:5432/postgres"

# Ganti dengan Project URL dari Settings > API
NEXT_PUBLIC_SUPABASE_URL="https://gmxntgpmoxpgmbyuupnp.supabase.co"

# Ganti dengan keys dari Settings > API
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Ganti dengan JWT secret yang sudah di-generate
JWT_SECRET="your-generated-secret-min-32-chars"
```

---

### Step 4: Verify Setup

Jalankan script check:

```bash
npm run check-env
```

Script ini akan memeriksa apakah semua variables sudah di-set dengan benar.

---

### Step 5: Setup Database

Setelah semua variables sudah benar:

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Push schema ke database
npx prisma db push

# 3. Seed database
npm run db:seed
```

---

## 🔍 Troubleshooting

### Connection Strings Tidak Muncul di Dashboard?

**Solusi Manual:**

1. **Dapatkan Region:**
   - Settings → General → Scroll ke "Region"
   - Contoh: `us-east-1`, `ap-southeast-1`, `eu-west-1`

2. **Buat Connection Strings Manual:**
   ```env
   # Format dengan PROJECT_REF = gmxntgpmoxpgmbyuupnp
   DATABASE_URL="postgresql://postgres.gmxntgpmoxpgmbyuupnp:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres:[PASSWORD]@db.gmxntgpmoxpgmbyuupnp.supabase.co:5432/postgres"
   ```

3. **Ganti:**
   - `[PASSWORD]` → Database password (dari Reset database password)
   - `[REGION]` → Region project

---

## ✅ Checklist Final

Setelah setup:

- [ ] `.env.local` sudah dibuat dan diisi
- [ ] `DATABASE_URL` ada dengan format connection pooling (port 6543)
- [ ] `DIRECT_URL` ada dengan format direct connection (port 5432)
- [ ] `JWT_SECRET` sudah di-generate (min 32 chars)
- [ ] Semua API keys sudah di-copy dari Settings > API
- [ ] `npm run check-env` menunjukkan semua OK
- [ ] `npx prisma generate` berhasil
- [ ] `npx prisma db push` berhasil
- [ ] `npm run db:seed` berhasil

---

## 🎯 Quick Commands

```bash
# Check environment variables
npm run check-env

# Setup database
npx prisma generate
npx prisma db push
npm run db:seed

# Start development server
npm run dev
```

---

## 📞 Quick Links Project Anda

- **Dashboard**: https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp
- **Database Settings**: https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp/settings/database
- **API Settings**: https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp/settings/api
- **Storage**: https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp/storage/buckets
- **General Settings** (untuk cek Region): https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp/settings/general

