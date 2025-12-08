# Setup Environment Variables - Quick Guide

## 🎯 Cara Mendapatkan Credentials dari Supabase

### Langkah 1: Database Connection Strings

1. Buka: https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp/settings/database
2. Scroll ke bagian **"Connection string"** atau **"Connection pooling"**
3. Jika tidak muncul, coba:
   - Settings → Database → Connection pooling tab
   - Settings → API → Scroll ke bagian Database
   - Atau buka: https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp/settings/database/connection-pooling

**Format yang dicari:**

#### Untuk DATABASE_URL (Connection Pooling):
- Port: `6543`
- Harus ada: `?pgbouncer=true`
- Format: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`

#### Untuk DIRECT_URL (Direct Connection):
- Port: `5432`
- Tanpa pgbouncer
- Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`

---

### Langkah 2: API Keys

1. Buka: https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp/settings/api
2. Ambil:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

---

### Langkah 3: Database Password

Jika belum ada password atau lupa:
1. Buka: Settings → Database
2. Klik **"Reset database password"**
3. Simpan password yang baru (penting! Anda tidak bisa melihatnya lagi)

---

## 🔧 Setup Manual (Jika Connection Strings Tidak Muncul)

Jika connection strings tidak muncul di dashboard, Anda bisa buat manual:

### Dapatkan PROJECT_REF:
- Dari URL project: `gmxntgpmoxpgmbyuupnp`
- Atau dari Settings → General → Reference ID

### Dapatkan REGION:
- Biasanya ada di URL database
- Atau dari Settings → General → Region

### Buat Connection Strings Manual:

```env
# Ganti dengan info project Anda:
# PROJECT_REF = gmxntgpmoxpgmbyuupnp (dari URL)
# PASSWORD = password database Anda (dari Reset database password)
# REGION = region project (cek di Settings > General)

DATABASE_URL="postgresql://postgres.gmxntgpmoxpgmbyuupnp:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.gmxntgpmoxpgmbyuupnp.supabase.co:5432/postgres"
```

---

## 📝 Setup File .env.local

1. Copy file `.env.local.example` ke `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` dan ganti semua placeholder:
   - `[PROJECT_REF]` → `gmxntgpmoxpgmbyuupnp`
   - `[YOUR-PASSWORD]` → Password database Anda
   - `[REGION]` → Region project (contoh: `us-east-1`, `ap-southeast-1`, dll)
   - `your-anon-key-here` → Anon key dari Settings > API
   - `your-service-role-key-here` → Service role key dari Settings > API
   - `your-super-secret-jwt-key-min-32-chars...` → Random string minimal 32 karakter

3. Generate JWT_SECRET (opsional):
   ```bash
   # Windows PowerShell:
   [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes(-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})))
   
   # Atau gunakan online generator:
   # https://generate-secret.vercel.app/32
   ```

---

## ✅ Verifikasi Setup

Setelah setup `.env.local`, test dengan:

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Test database connection
npx prisma db push

# 3. Seed database
npm run db:seed
```

Jika semua berhasil, Anda akan melihat:
- ✅ Prisma Client generated
- ✅ Schema pushed to database
- ✅ Seed data created

---

## 🔗 Quick Links untuk Project Anda

- **Dashboard**: https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp
- **Database Settings**: https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp/settings/database
- **API Settings**: https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp/settings/api
- **Storage**: https://supabase.com/dashboard/project/gmxntgpmoxpgmbyuupnp/storage/buckets

---

## 🆘 Troubleshooting

### Error: "Environment variable not found: DIRECT_URL"
- Pastikan `.env.local` sudah dibuat
- Pastikan `DIRECT_URL` ada di file
- Restart terminal/VS Code setelah edit `.env.local`

### Error: "Connection refused" atau "Connection timeout"
- Pastikan password database benar
- Pastikan PROJECT_REF dan REGION benar
- Pastikan project Supabase tidak paused

### Connection Strings Tidak Muncul
- Coba refresh halaman
- Coba incognito/private window
- Atau buat manual menggunakan format di atas

---

## 📞 Butuh Bantuan?

Jika masih kesulitan, kirimkan:
1. Screenshot halaman Settings > Database (full page)
2. Screenshot halaman Settings > API
3. Error message yang muncul

