# 🔧 TROUBLESHOOTING: Email Tidak Terkirim

**Masalah**: Tidak ada notifikasi email yang masuk ke inbox

---

## ✅ CHECKLIST CEPAT

### 1. Cek Konfigurasi SMTP di `.env.local`

Pastikan file `.env.local` berisi:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=email-anda@gmail.com
SMTP_PASS=app-password-anda
SMTP_FROM="Nama Jurnal <noreply@jurnal.com>"

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_JOURNAL_NAME=Nama Jurnal Anda
```

**PENTING**: 
- Gunakan **App Password** Gmail, bukan password biasa
- Cara buat App Password: https://myaccount.google.com/apppasswords

---

### 2. Restart Dev Server

Setelah mengubah `.env.local`, **WAJIB restart**:

```bash
# Stop server (Ctrl+C)
npm run dev
```

Environment variables hanya dibaca saat server start!

---

### 3. Cek Log Server

Lihat output terminal `npm run dev` untuk error:

**Yang BAIK** (email berhasil):
```
[INFO] Email sent successfully
[INFO] Review assignment email sent
```

**Yang BURUK** (email gagal):
```
[ERROR] Failed to send email
[ERROR] SMTP connection failed
[ERROR] Invalid login
```

---

## 🔍 DIAGNOSA MASALAH

### Masalah 1: SMTP Credentials Invalid

**Error di log**:
```
Invalid login: 535-5.7.8 Username and Password not accepted
```

**Solusi**:
1. Pastikan menggunakan **App Password**, bukan password Gmail biasa
2. Cara buat App Password:
   - Buka: https://myaccount.google.com/apppasswords
   - Login Gmail
   - Pilih "Mail" dan "Other (Custom name)"
   - Masukkan nama: "OJS Email"
   - Copy password yang dihasilkan (16 karakter)
   - Paste ke `SMTP_PASS` di `.env.local`
3. Restart server

---

### Masalah 2: SMTP Connection Timeout

**Error di log**:
```
Connection timeout
ETIMEDOUT
```

**Solusi**:
1. Cek koneksi internet
2. Cek firewall tidak memblokir port 587
3. Coba gunakan port alternatif:
   ```env
   SMTP_PORT=465
   SMTP_SECURE=true
   ```

---

### Masalah 3: Environment Variables Tidak Terbaca

**Cek apakah env terbaca**:

Tambahkan log sementara di `lib/email/sender.ts`:

```typescript
export async function sendEmail(options: EmailOptions) {
    // TAMBAHKAN INI UNTUK DEBUG
    console.log('🔍 SMTP Config:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        hasPassword: !!process.env.SMTP_PASS
    })
    
    // ... kode lainnya
}
```

Jika output menunjukkan `undefined`, berarti env tidak terbaca.

**Solusi**:
1. Pastikan file bernama `.env.local` (bukan `.env` atau `env.local`)
2. Pastikan file di root project (sejajar dengan `package.json`)
3. Restart server

---

### Masalah 4: Email Masuk Spam

**Cek folder spam** di email penerima!

**Solusi**:
1. Cek folder spam/junk
2. Tandai sebagai "Not Spam"
3. Tambahkan sender ke kontak

---

## 🧪 TEST SMTP CONNECTION

Buat file `test-smtp.js` di root project:

```javascript
// test-smtp.js
const nodemailer = require('nodemailer');

// GANTI dengan kredensial Anda
const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'email-anda@gmail.com',
    pass: 'app-password-16-karakter'
  }
});

console.log('🔍 Testing SMTP connection...');

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ SMTP Error:', error);
  } else {
    console.log('✅ SMTP connection successful!');
    
    // Test send email
    transporter.sendMail({
      from: '"Test" <email-anda@gmail.com>',
      to: 'email-anda@gmail.com', // kirim ke diri sendiri
      subject: 'Test Email',
      text: 'Ini test email dari OJS'
    }, (err, info) => {
      if (err) {
        console.log('❌ Send failed:', err);
      } else {
        console.log('✅ Email sent!', info.messageId);
      }
    });
  }
});
```

Jalankan:
```bash
node test-smtp.js
```

**Hasil yang diharapkan**:
```
🔍 Testing SMTP connection...
✅ SMTP connection successful!
✅ Email sent! <message-id>
```

---

## 📋 SOLUSI STEP-BY-STEP

### Langkah 1: Setup Gmail App Password

1. Buka: https://myaccount.google.com/security
2. Aktifkan **2-Step Verification** (jika belum)
3. Buka: https://myaccount.google.com/apppasswords
4. Pilih:
   - App: Mail
   - Device: Other (Custom name)
   - Nama: "OJS Email System"
5. Klik "Generate"
6. **COPY password 16 karakter** yang muncul

### Langkah 2: Update `.env.local`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=email-anda@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # 16 karakter dari step 1
SMTP_FROM="Test Journal <noreply@testjournal.com>"
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_JOURNAL_NAME=Test Journal
```

**PENTING**: Hapus spasi di App Password, jadi: `abcdefghijklmnop`

### Langkah 3: Restart Server

```bash
# Stop (Ctrl+C)
npm run dev
```

### Langkah 4: Test dengan Assign Reviewer

1. Login sebagai Editor
2. Assign reviewer ke submission
3. Cek log terminal untuk:
   ```
   [INFO] Email sent successfully
   [INFO] Review assignment email sent to reviewer
   ```
4. Cek inbox reviewer (tunggu 1-2 menit)
5. Cek folder spam jika tidak ada di inbox

---

## 🔧 ALTERNATIF: Gunakan Mailtrap (Development)

Jika Gmail tidak work, gunakan **Mailtrap** untuk testing:

1. Daftar gratis: https://mailtrap.io
2. Buat inbox baru
3. Copy kredensial SMTP
4. Update `.env.local`:

```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-pass
SMTP_FROM="Test Journal <test@journal.com>"
```

**Keuntungan Mailtrap**:
- Tidak perlu App Password
- Semua email tertangkap di dashboard
- Bisa lihat HTML preview
- Tidak masuk spam
- Gratis untuk development

---

## 📊 CHECKLIST DEBUGGING

- [ ] File `.env.local` ada di root project
- [ ] Semua SMTP_* variables terisi
- [ ] Menggunakan Gmail App Password (bukan password biasa)
- [ ] Server sudah di-restart setelah edit `.env.local`
- [ ] Tidak ada error di log terminal
- [ ] Sudah cek folder spam
- [ ] Test SMTP connection berhasil (`test-smtp.js`)
- [ ] nodemailer sudah terinstall (`npm install nodemailer`)

---

## 🆘 JIKA MASIH TIDAK WORK

**Kirim informasi berikut**:

1. **Output log** saat assign reviewer (copy dari terminal)
2. **Error message** (jika ada)
3. **SMTP config** (tanpa password):
   ```
   SMTP_HOST=?
   SMTP_PORT=?
   SMTP_USER=?
   ```
4. **Hasil test-smtp.js**

Dengan informasi ini saya bisa bantu troubleshoot lebih spesifik!

---

## ✅ QUICK FIX CHECKLIST

```bash
# 1. Install nodemailer (jika belum)
npm install nodemailer

# 2. Buat App Password Gmail
# https://myaccount.google.com/apppasswords

# 3. Edit .env.local
# Tambahkan SMTP_* variables

# 4. Restart server
# Ctrl+C, lalu npm run dev

# 5. Test assign reviewer
# Cek log untuk "Email sent successfully"

# 6. Cek inbox (dan spam folder)
```

---

**Kemungkinan Besar Masalahnya**:
1. ❌ Belum restart server setelah edit `.env.local`
2. ❌ Menggunakan password Gmail biasa (bukan App Password)
3. ❌ nodemailer belum terinstall
4. ❌ Email masuk spam

**Solusi Tercepat**: Gunakan Mailtrap untuk testing!
