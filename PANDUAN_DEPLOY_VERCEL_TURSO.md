# Panduan Lengkap Deploy POS ERTIGA (Low Budget / Rp 0 di Vercel & Turso)

Panduan ini berisi langkah-langkah praktis dan mudah untuk mempublikasikan database, API backend, web e-commerce, dan POS kasir secara online tanpa biaya (100% Free Tier) dan siap dimigrasi ke VPS di masa depan.

---

## Ringkasan Arsitektur yang Sudah Dikonfigurasi

Aplikasi Anda kini sudah mendukung arsitektur **Hybrid**:
1. **Lokal**: Tetap menggunakan SQLite lokal `pos_database.sqlite` (tidak terganggu sama sekali).
2. **Cloud**: Otomatis menggunakan **Turso LibSQL** ketika `TURSO_DATABASE_URL` diisi, tanpa perlu mengubah query SQL di backend.
3. **Backend API**: Siap di-deploy ke Vercel Serverless Function via `server/vercel.json` dan `server/api/index.js`.
4. **Web E-Commerce**: Siap di-deploy ke Vercel via folder `web`.
5. **POS Kasir Web**: Siap di-deploy ke Vercel via folder `client`.

---

## Langkah 1: Buat Database Gratis di Turso (5 Menit)

Turso memberikan free tier **9 GB storage** (sangat besar untuk POS toko) dan tidak pernah sleep/idle:

1. Buka [https://turso.tech](https://turso.tech) dan login / daftar menggunakan akun GitHub Anda.
2. Di dashboard Turso, klik **"Create Database"**:
   - Beri nama database, misal: `pos-ertiga-db`.
   - Pilih lokasi server terdekat: **Singapore (sin)** atau **Jakarta** (jika tersedia).
3. Setelah database dibuat, buka tab database Anda:
   - Salin **Database URL** (contoh: `libsql://pos-ertiga-db-username.turso.io`).
   - Buat token autentikasi di menu **"Tokens"** -> klik **"Create Token"**, lalu salin string token tersebut.

---

## Langkah 2: Sinkronkan Data dari Laptop ke Turso Cloud (1 Perintah)

Semua barang, kategori, banner, dan pengaturan yang sudah Anda buat di komputer lokal dapat langsung dipindahkan ke database Turso:

Buka terminal di folder project Anda (`Pos_Ertiga`), lalu jalankan perintah berikut (ganti dengan URL & Token Turso Anda):

```powershell
$env:TURSO_DATABASE_URL="libsql://pos-ertiga-db-username.turso.io"
$env:TURSO_AUTH_TOKEN="token-rahasia-turso-anda"
npm run sync:turso
```

Script akan otomatis:
- Membuat 18 tabel dan menjalankan seluruh 13 migrasi skema.
- Menyalin semua data barang, kategori, pengaturan, dan transaksi ke Turso Cloud.
- Menampilkan pesan sukses `🎉 SINKRONISASI SELESAI & SUKSES!`.

---

## Langkah 3: Deploy Backend API ke Vercel

1. Login ke [https://vercel.com](https://vercel.com) menggunakan akun GitHub.
2. Pastikan repository Anda sudah di-push ke GitHub:
   ```bash
   git add .
   git commit -m "feat: siapkan deployment vercel dan turso cloud db"
   git push origin main
   ```
3. Di dashboard Vercel, klik **"Add New..."** -> **"Project"**, lalu pilih repository `Pos_Ertiga`.
4. Pada form konfigurasi:
   - **Project Name**: `pos-ertiga-api`
   - **Root Directory**: Klik *Edit*, lalu pilih folder `server`
   - **Environment Variables**:
     - `TURSO_DATABASE_URL` = `libsql://pos-ertiga-db-username.turso.io`
     - `TURSO_AUTH_TOKEN` = `token-rahasia-turso-anda`
     - `ALLOWED_ORIGINS` = `*` (atau biarkan kosong, Vercel domains otomatis diizinkan)
5. Klik **"Deploy"**.
6. Setelah selesai, Anda akan mendapatkan URL Backend, misalnya:
   `https://pos-ertiga-api.vercel.app`
   *(Tes dengan membuka `https://pos-ertiga-api.vercel.app/api/health`, respon harus `ok: true`).*

---

## Langkah 4: Deploy Web E-Commerce ke Vercel

1. Di dashboard Vercel, klik **"Add New..."** -> **"Project"** lagi (dari repo yang sama).
2. Konfigurasi:
   - **Project Name**: `toko-ertiga` (atau sesuai nama toko Anda)
   - **Root Directory**: Klik *Edit*, pilih folder `web`
   - **Framework Preset**: Vite
   - **Environment Variables**:
     - `VITE_API_URL` = `https://pos-ertiga-api.vercel.app` (URL backend dari Langkah 3)
3. Klik **"Deploy"**.
4. Selesai! Web e-commerce toko Anda kini live di:
   `https://toko-ertiga.vercel.app`

---

## Langkah 5: Deploy POS Kasir Web (Opsional)

Jika Anda ingin kasir bisa login dari browser laptop / tablet mana pun tanpa install aplikasi:
1. Di Vercel, buat project baru dari folder `client`.
2. Beri nama misal `pos-ertiga-kasir`.
3. Tambahkan Environment Variable:
   - `VITE_API_URL` = `https://pos-ertiga-api.vercel.app`
4. Klik **"Deploy"**.
5. Kasir kini bisa membuka `https://pos-ertiga-kasir.vercel.app` langsung dari browser mana pun!

---

## Langkah 6: Roadmap Jangka Panjang (Pindah ke VPS)

Jika nanti Anda ingin beralih ke VPS pribadi:
1. Sewa VPS Linux Ubuntu murah (~Rp 40.000/bulan di IDCloudHost/DomaiNesia/RackH).
2. Beli domain murah `.my.id` (~Rp 12.000/tahun).
3. Database Turso Anda **tetap bisa dipakai** (tidak perlu dipindah lagi), atau diekspor ke SQLite lokal di VPS.
4. Di VPS cukup install Node.js + PM2 + Nginx.
5. Jalankan backend: `pm2 start server/server.js --name pos-server`.
6. Seluruh sistem akan berjalan 100% mandiri di server Anda.
