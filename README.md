# POS Ertiga — Sistem Kasir Desktop & Web

Aplikasi Point of Sale (POS) modern, cepat, dan handal untuk toko retail dan UMKM. Dibangun menggunakan teknologi **Electron**, **React 19 (Vite)**, **Express**, dan **SQLite3**.

---

## 🚀 Fitur Unggulan

### 1. Akurasi Transaksi & Laporan (Paket A)
- **Kalkulasi & Validasi di Sisi Server:** Total harga, diskon, dan kembalian dihitung dan divalidasi ulang secara ketat di backend untuk mencegah manipulasi.
- **Pencatatan Diskon:** Diskon tersimpan permanen di database transaksi dan tercetak pada struk.
- **Laba Historis Akurat:** Menyimpan snapshot harga modal saat transaksi terjadi (`harga_modal_saat_ini`), sehingga perubahan harga modal di kemudian hari tidak mengubah laba masa lalu.
- **Nomor Nota Unik & Berurutan:** Format atomik `INV-YYYYMMDD-0001` dengan counter harian yang aman dari tabrakan/duplikasi.
- **Konsistensi Zona Waktu:** Penyimpanan UTC dan parsing lokal memastikan laporan pergantian hari akurat pukul 00:00 (WIB/lokal).
- **Integritas Data (Soft Delete):** Penghapusan barang tidak merusak riwayat transaksi yang sudah terjadi sebelumnya.
- **Proteksi Transaksi Batal (Void):** Laporan rentang tanggal, bulanan, dan produk terlaris otomatis mengecualikan transaksi yang di-void.

### 2. Cetak Struk Thermal (Paket B)
- **Komponen Struk Khusus (`Receipt.jsx`):** Pencetakan hanya mencetak struk belanja, bukan antarmuka aplikasi.
- **Mendukung Kertas 58 mm & 80 mm:** Layout fleksibel yang diatur di menu Pengaturan.
- **Cetak Ulang (Reprint):** Cetak ulang kapan saja langsung dari menu Riwayat Transaksi.
- **Silent Print & Driver Selection:** Terintegrasi langsung dengan printer Windows via Electron IPC tanpa memunculkan dialog cetak jika diaktifkan.

### 3. Auto-Backup Google Drive (Paket C)
- **Snapshot Konsisten:** Backup database SQLite menggunakan `VACUUM INTO` lalu dikompresi menjadi file `.sql.gz`.
- **Integrasi Google Drive:** Menggunakan OAuth2 desktop resmi dengan scope terbatas (`drive.file`) untuk keamanan maksimal.
- **Jadwal Otomatis & Saat Aplikasi Ditutup:** Backup berjalan otomatis pada jam tutup toko dan melakukan *flush* sebelum aplikasi Electron keluar.
- **Manajemen Retensi & Retry:** Otomatis menghapus backup lama (retensi harian/mingguan) dan menyimpan antrean retry saat offline.

### 4. Keamanan & Hardening Electron (Paket D)
- **Isolasi Konteks:** `contextIsolation: true`, `nodeIntegration: false`, dan `sandbox: true` via `preload.js`.
- **Keamanan Jaringan:** Backend Express hanya melakukan binding ke `127.0.0.1` (localhost), mencegah akses dari komputer lain di jaringan lokal.
- **Single Instance Lock:** Mencegah aplikasi dibuka ganda yang berpotensi menyebabkan konflik port dan database lock.
- **Font Offline & CSP:** Aplikasi tetap tampil sempurna tanpa koneksi internet dengan font sistem bawaan OS.
- **Graceful Shutdown:** Penutupan koneksi server dan database SQLite secara bersih saat aplikasi ditutup.

---

## 🛠️ Panduan Pengembangan (Development)

### Prasyarat
- Node.js (versi 18 ke atas disarankan)
- npm

### 1. Instalasi Dependensi
Jalankan perintah ini dari folder root proyek:
```bash
npm install
cd client && npm install && cd ..
```

### 2. Menjalankan Mode Pengembangan
Anda dapat menjalankan backend dan frontend secara bersamaan dengan salah satu cara berikut:

**Opsi A: Menggunakan file batch (paling mudah di Windows):**
Cukup klik dua kali `start.bat`.

**Opsi B: Menggunakan npm script:**
```bash
npm run dev
```

**Opsi C: Membuka di dua terminal terpisah:**
- Terminal 1 (Backend):
  ```bash
  node server/server.js
  ```
- Terminal 2 (Frontend):
  ```bash
  npm --prefix client run dev
  ```
Buka browser di `http://localhost:5173`.

### 3. Menjalankan Aplikasi Desktop (Electron)
Untuk menjalankan aplikasi di dalam jendela desktop Electron:
```bash
npm start
```

---

## 📦 Build Installer Desktop (.exe)

Untuk menghasilkan file instalasi Windows (`.exe` NSIS):

1. Pastikan frontend sudah ter-build:
   ```bash
   npm run build
   ```
2. Jalankan perintah packaging:
   ```bash
   npm run dist
   ```
3. Installer siap pakai akan dihasilkan di folder `release/` (misalnya: `release/POS Ertiga Setup 1.0.0.exe`).

---

## 📁 Struktur Proyek

```
Pos_Ertiga/
├── client/                     # Frontend React (Vite)
│   ├── src/
│   │   ├── components/         # Komponen halaman (POS, Inventory, Riwayat, Laporan, dsb.)
│   │   │   └── Receipt.jsx     # Komponen cetak struk thermal
│   │   ├── lib/                # API client, date helper, formatting, printer utility
│   │   ├── App.jsx             # Shell aplikasi dan navigasi tab
│   │   └── index.css           # Styling global dan CSS khusus cetak thermal
├── server/                     # Backend API & Database (Express)
│   ├── routes/                 # Endpoint modular (barang, transaksi, laporan, backup, dsb.)
│   ├── utils/                  # Helper tanggal & utility server
│   ├── backup.js               # Service Google Drive & local backup
│   ├── database.js             # Koneksi SQLite & inisialisasi skema
│   ├── migrations.js           # Database migration runner otomatis
│   └── server.js               # Express application & lifecycle management
├── main.js                     # Electron main process (IPC, single instance, window lifecycle)
├── preload.js                  # Electron context bridge yang aman
├── package.json                # Dependensi root & konfigurasi electron-builder
└── start.bat                   # Script peluncur cepat mode development
```

---

## 📄 Lisensi
Hak Cipta © 2026 POS Ertiga. Seluruh hak cipta dilindungi undang-undang.
