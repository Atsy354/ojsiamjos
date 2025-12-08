# Setup Supabase - IamJOS

Panduan lengkap untuk setup Supabase pada proyek IamJOS.

## 📋 Prerequisites

- Node.js 18+ terinstall
- Akun Supabase (gratis di https://supabase.com)
- Supabase project sudah dibuat

## 🚀 Langkah-langkah Setup

### 1. Install Dependencies

```bash
npm install
```

Ini akan menginstall semua dependencies termasuk:
- `@prisma/client` - Prisma ORM
- `@supabase/supabase-js` - Supabase client
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `nodemailer` - Email service

### 2. Setup Supabase Project

1. Buka https://supabase.com/dashboard
2. Buat project baru atau pilih project yang sudah ada
3. Tunggu hingga database siap (sekitar 2 menit)

### 3. Ambil Credentials dari Supabase

1. **Database Connection Strings:**
   - Buka Settings > Database
   - Copy **Connection Pooling** string → untuk `DATABASE_URL`
   - Copy **Direct Connection** string → untuk `DIRECT_URL`

2. **API Keys:**
   - Buka Settings > API
   - Copy **Project URL** → untuk `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon public** key → untuk `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role** key → untuk `SUPABASE_SERVICE_ROLE_KEY`

### 4. Setup Storage Bucket

1. Buka **Storage** di sidebar Supabase Dashboard
2. Klik **New bucket**
3. Konfigurasi:
   - **Bucket name**: `submissions`
   - **Public bucket**: OFF (Private)
   - **Restrict file size**: ON (10 MB)
   - **Restrict MIME types**: ON (opsional, tambahkan: `application/pdf`, `application/msword`, dll)
4. Klik **Create**

### 5. Setup Environment Variables

Buat file `.env.local` di root project dengan isi berikut:

```env
# Supabase Database
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# Supabase API
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-min-32-chars-change-in-production"
JWT_EXPIRES_IN="7d"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@iamjos.org"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# File Upload
MAX_FILE_SIZE=10485760
```

**Catatan:**
- Ganti `[PROJECT_REF]`, `[PASSWORD]`, `[REGION]` dengan nilai dari Supabase Dashboard
- Untuk JWT_SECRET, generate random string minimal 32 karakter (untuk production)
- Untuk Gmail SMTP, gunakan App Password (bukan password biasa)

### 6. Setup Database dengan Prisma

```bash
# Generate Prisma Client
npx prisma generate

# Push schema ke database
npx prisma db push

# Seed initial data
npm run db:seed
```

Atau gunakan migration (recommended untuk production):

```bash
# Create migration
npx prisma migrate dev --name init

# Seed data
npm run db:seed
```

### 7. Verify Setup

Jalankan development server:

```bash
npm run dev
```

Buka browser ke http://localhost:3000

## 🧪 Test Credentials

Setelah seed, Anda bisa login dengan:

- **Admin**: `admin@iamjos.org` / `admin123`
- **Editor**: `editor@jcst.org` / `editor123`
- **Author**: `author@jcst.org` / `author123`
- **Reviewer**: `reviewer@jcst.org` / `reviewer123`

## 📁 Struktur File yang Dibuat

```
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed script
├── lib/
│   ├── prisma.ts              # Prisma client
│   ├── supabase/
│   │   ├── client.ts          # Supabase client (browser)
│   │   └── server.ts          # Supabase admin (server)
│   ├── auth/
│   │   ├── jwt.ts             # JWT utilities
│   │   ├── password.ts        # Password hashing
│   │   └── middleware.ts      # Auth middleware
│   ├── storage/
│   │   └── supabase-storage.ts # File upload helper
│   └── email/
│       └── email-service.ts   # Email service
└── app/api/
    ├── auth/
    │   ├── register/route.ts
    │   ├── login/route.ts
    │   └── me/route.ts
    └── submissions/
        └── [id]/files/
            └── [fileId]/download/route.ts
```

## 🔧 Troubleshooting

### Error: Missing Supabase environment variables
- Pastikan `.env.local` sudah dibuat
- Pastikan semua variable sudah diisi dengan benar
- Restart development server setelah mengubah `.env.local`

### Error: Prisma schema tidak terdeteksi
```bash
npx prisma generate
```

### Error: Connection to database failed
- Pastikan `DATABASE_URL` menggunakan connection pooling
- Pastikan `DIRECT_URL` untuk migrations menggunakan direct connection
- Check apakah Supabase project sudah aktif

### Error: Storage bucket tidak ditemukan
- Pastikan bucket `submissions` sudah dibuat di Supabase Dashboard
- Pastikan nama bucket sesuai (case-sensitive)

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

## ✅ Checklist Setup

- [ ] Install dependencies (`npm install`)
- [ ] Buat Supabase project
- [ ] Ambil credentials (Database & API)
- [ ] Buat storage bucket `submissions`
- [ ] Setup `.env.local` dengan credentials
- [ ] Run `npx prisma generate`
- [ ] Run `npx prisma db push`
- [ ] Run `npm run db:seed`
- [ ] Test dengan `npm run dev`

## 🎉 Selesai!

Setup selesai! Project Anda sekarang siap untuk production dengan Supabase sebagai backend.


