# 🔧 Setup Supabase untuk Project gmxntgpmoxpgmbyuupnp

## 🎯 Project Information

- **Project Reference**: `gmxntgpmoxpgmbyuupnp`
- **Dashboard URL**: https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp

---

## 📝 Langkah-langkah Lengkap

### STEP 1: Dapatkan Database Password

1. Buka: https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp/settings/database
2. Scroll ke bagian **"Database password"**
3. Klik **"Reset database password"**
4. **SALIN dan SIMPAN PASSWORD** (penting! tidak bisa dilihat lagi)

---

### STEP 2: Dapatkan Connection Strings

#### Cara A: Dari Connection Pooling Page (Recommended)

1. Buka: https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp/settings/database/connection-pooling

2. Di halaman ini, Anda akan melihat beberapa tab:
   - **Transaction mode** → Untuk `DATABASE_URL`
   - **Session mode** → Alternatif untuk `DATABASE_URL`
   - **Direct connection** → Untuk `DIRECT_URL`

3. **Untuk DATABASE_URL:**
   - Pilih tab **"Transaction mode"** atau **"Session mode"**
   - Copy connection string yang muncul
   - Pastikan formatnya: `postgresql://postgres.gmxntgpmoxpgmbyuupnp:...@...pooler.supabase.com:6543/...?pgbouncer=true`

4. **Untuk DIRECT_URL:**
   - Pilih tab **"Direct connection"**
   - Copy connection string
   - Pastikan formatnya: `postgresql://postgres:...@db.gmxntgpmoxpgmbyuupnp.supabase.co:5432/...`

#### Cara B: Jika Connection Strings Tidak Muncul

Jika halaman connection pooling tidak menunjukkan connection strings, ikuti langkah ini:

1. **Dapatkan REGION:**
   - Buka: https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp/settings/general
   - Scroll ke bagian "Project Information"
   - Cari **"Region"** (contoh: `us-east-1`, `ap-southeast-1`, `eu-west-1`)

2. **Buat Connection Strings Manual:**

   Ganti placeholder berikut:
   - `[YOUR-PASSWORD]` → Password database dari Step 1
   - `[REGION]` → Region dari Settings > General

   **DATABASE_URL:**
   ```
   postgresql://postgres.gmxntgpmoxpgmbyuupnp:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

   **DIRECT_URL:**
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.gmxntgpmoxpgmbyuupnp.supabase.co:5432/postgres
   ```

   **Contoh jika REGION = `us-east-1`:**
   ```env
   DATABASE_URL="postgresql://postgres.gmxntgpmoxpgmbyuupnp:myPassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres:myPassword123@db.gmxntgpmoxpgmbyuupnp.supabase.co:5432/postgres"
   ```

---

### STEP 3: Dapatkan API Keys

1. Buka: https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp/settings/api

2. Di halaman ini Anda akan melihat:

   **Project URL:**
   - Copy URL yang muncul (format: `https://gmxntgpmoxpgmbyuupnp.supabase.co`)
   - Ini untuk `NEXT_PUBLIC_SUPABASE_URL`

   **Project API keys:**
   - **anon public** → Copy key ini untuk `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → Copy key ini untuk `SUPABASE_SERVICE_ROLE_KEY`
     - ⚠️ **PENTING:** Service role key sangat sensitif, jangan share!

---

### STEP 4: Generate JWT_SECRET

Jalankan command ini di PowerShell:

```powershell
# Generate random 32-character string
$jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
Write-Host "JWT_SECRET: $jwtSecret"
```

Atau gunakan online generator: https://generate-secret.vercel.app/32

---

### STEP 5: Edit File .env.local

1. Buka file: `D:\v0-iamjos-siswanto-v06\.env.local`

2. Ganti semua placeholder dengan nilai yang sudah didapat:

```env
# Database (ganti [YOUR-PASSWORD] dan [REGION])
DATABASE_URL="postgresql://postgres.gmxntgpmoxpgmbyuupnp:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.gmxntgpmoxpgmbyuupnp.supabase.co:5432/postgres"

# Supabase API (ganti dengan nilai dari Settings > API)
NEXT_PUBLIC_SUPABASE_URL="https://gmxntgpmoxpgmbyuupnp.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# JWT (ganti dengan generated secret)
JWT_SECRET="your-generated-secret-min-32-chars"
JWT_EXPIRES_IN="7d"
```

---

### STEP 6: Verify Setup

Jalankan:

```bash
npm run check-env
```

Pastikan semua menunjukkan ✅ (tidak ada ❌).

---

### STEP 7: Setup Database

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Push schema ke database
npx prisma db push

# 3. Seed database
npm run db:seed
```

---

## 🔗 Quick Links

### Database Settings:
- **Main**: https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp/settings/database
- **Connection Pooling**: https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp/settings/database/connection-pooling

### API Settings:
- https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp/settings/api

### General Settings (untuk cek Region):
- https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp/settings/general

### Storage (untuk setup bucket):
- https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp/storage/buckets

---

## 🆘 Troubleshooting

### "Connection pooling page not found"
- Coba langsung: https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp/settings/database
- Scroll ke bawah setelah "Connection pooling configuration"
- Atau gunakan Cara B (manual) di atas

### "Region tidak diketahui"
- Buka Settings → General
- Atau cek di URL database (ada di bagian hostname)

### Connection Strings tidak muncul
- Refresh halaman
- Coba browser lain
- Atau gunakan format manual dengan PROJECT_REF = `gmxntgpmoxpgmbyuupnp`

---

## ✅ Checklist

Setelah selesai, pastikan:

- [ ] Database password sudah di-reset dan disimpan
- [ ] DATABASE_URL sudah diisi (port 6543, dengan pgbouncer=true)
- [ ] DIRECT_URL sudah diisi (port 5432, tanpa pgbouncer)
- [ ] NEXT_PUBLIC_SUPABASE_URL sudah diisi
- [ ] SUPABASE_SERVICE_ROLE_KEY sudah diisi
- [ ] JWT_SECRET sudah di-generate (min 32 chars)
- [ ] `npm run check-env` menunjukkan semua ✅
- [ ] `npx prisma db push` berhasil
- [ ] `npm run db:seed` berhasil

---

**Setelah semua setup selesai, project Anda siap untuk digunakan!** 🎉

