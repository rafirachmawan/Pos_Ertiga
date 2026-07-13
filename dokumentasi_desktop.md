# Dokumentasi Migrasi Desktop (Electron) POS Ertiga

Dokumen ini berisi catatan mengenai bagaimana aplikasi POS Ertiga diubah dari aplikasi web berbasis React + Node.js menjadi aplikasi desktop mandiri (`.exe`) menggunakan Electron.

## 1. Arsitektur Aplikasi Desktop
Meskipun tampilannya sama persis seperti versi web, di balik layar aplikasinya berjalan dengan 3 komponen utama secara bersamaan:

*   **Electron:** Berfungsi sebagai "wadah browser khusus" (berbasis Chromium) yang membungkus aplikasi. Ia bertugas membuat jendela desktop (`mainWindow`) agar aplikasi terlihat seperti perangkat lunak native Windows, bukan halaman yang dibuka di Google Chrome biasa.
*   **Express Server (Backend):** Server Node.js berjalan secara otomatis di latar belakang (background) pada Port 3001 saat aplikasi dibuka. Server ini membaca database SQLite dan menyediakan API yang dibutuhkan.
*   **React (Frontend):** File React yang sudah melalui tahap *build* (berada di folder `client/dist`) dibaca dan disajikan langsung oleh server Express agar antarmukanya bisa dirender di layar Electron.

## 2. Resolusi Isu "Cannot GET /" dan Layar Putih (Blank Screen)
Selama proses migrasi, sempat terjadi dua kendala utama saat aplikasi dibuka: pesan error `Cannot GET /` dan layar putih kosong.

### Penyebab dan Solusi:
1. **Routing Frontend:** 
   Awalnya, server backend hanya didesain untuk merespon panggilan API (seperti `/api/barang`). Saat Electron memuat root URL (`/`), server tidak tahu harus mengembalikan file apa karena React dan Express dijalankan secara terpisah saat tahap pengembangan (development).
   *Solusi:* Menambahkan baris kode *static file serving* agar Express bertugas memanggil dan menyajikan file `index.html` dari hasil build React.
2. **Konflik Versi Express 5:**
   Awalnya digunakan sintaks `app.get('*')` untuk menangkap semua rute frontend yang tidak dikenali agar diarahkan ke `index.html`. Namun, versi **Express 5** memperbarui parser *routing*-nya dan tidak lagi mengenali simbol bintang (`*`) sebagai penangkap semua rute. Hal ini menyebabkan server mengalami *crash* dan mati secara instan. Karena server mati, layar Electron menjadi putih karena gagal terkoneksi.
   *Solusi:* Sintaks tersebut diganti dengan fungsi middleware bawaan `app.use((req, res) => { ... })` yang bekerja dengan aman sebagai penangkap *error 404* tanpa menyebabkan *crash* pada Express 5.

## 3. Keamanan Data dan Persistensi Database (SQLite)
Perubahan paling krusial untuk memastikan aplikasi ini siap digunakan untuk produksi ada pada pengaturan lokasi file `pos_database.sqlite` (berada di `database.js` dan `server.js`).

*   **Sebelumnya:** Database tersimpan tepat di dalam folder source code (`server/`). Hal ini berbahaya jika aplikasi di-*update*, karena file database akan tertimpa dan data lama hilang.
*   **Setelah Migrasi:** Saat aplikasi `.exe` berjalan dalam mode produksi (*packaged*), databasenya akan secara otomatis diarahkan untuk disimpan dan dibaca dari folder sistem **AppData** Windows pengguna (biasanya berlokasi di `C:\Users\NamaUser\AppData\Roaming\pos_ertiga`).
*   **Keuntungan:** Lokasi `AppData` aman dari proses uninstalasi atau pembaruan. Jika besok terdapat pembaruan fitur (installer `.exe` baru), data master barang maupun transaksi yang sudah pernah dimasukkan kasir tidak akan hilang saat aplikasi baru ditimpa ke aplikasi lama.

---

## 4. Panduan Clone, Development & Build (Untuk PC Baru)
Karena proyek ini menggunakan Node.js dan terbagi menjadi dua bagian (Backend dan Frontend React), berikut adalah langkah-langkah yang harus dilakukan jika Anda men-*clone* proyek ini ke PC lain di masa depan.

> [!WARNING]
> Folder `node_modules` dan `release` **TIDAK BOLEH** di-push ke GitHub karena ukurannya sangat besar dan spesifik terhadap perangkat. Cukup jalankan perintah install di bawah ini untuk membuatnya ulang secara otomatis.

### Langkah Clone & Install
1. **Clone repositori:**
   ```bash
   git clone <url-github-anda>
   ```
2. **Masuk ke folder proyek utama:**
   ```bash
   cd Pos_Ertiga
   ```
3. **Install dependency utama (Backend & Electron):**
   ```bash
   npm install
   ```
4. **Install dependency frontend (React):**
   ```bash
   cd client
   npm install
   ```

### Cara Membuka & Mengedit (Development)
Jika Anda ingin menambahkan fitur atau memperbaiki *bug* tanpa harus membuat `.exe`, gunakan dua terminal:
*   **Terminal 1 (Jalankan API Server):** Buka di folder utama (Pos_Ertiga), lalu jalankan:
    ```bash
    node server/server.js
    ```
*   **Terminal 2 (Jalankan React):** Buka di folder `client`, lalu jalankan:
    ```bash
    npm run dev
    ```
*(Buka URL React (biasanya `localhost:5173`) di browser untuk melihat perubahan kode secara *real-time*).*

### Cara Membangun Pembaruan (Build Ulang ke .exe)
Jika proses *coding* sudah selesai dan Anda ingin membuat versi `.exe` yang baru untuk diinstal di komputer kasir:
1. Buka terminal di folder proyek paling luar (utama / `Pos_Ertiga`).
2. Jalankan perintah build:
   ```bash
   npm run dist
   ```
3. Tunggu hingga proses selesai (biasanya memakan waktu sekitar 1-2 menit).
4. Installer `.exe` yang baru akan otomatis muncul di dalam folder `release/` dan siap digunakan!
