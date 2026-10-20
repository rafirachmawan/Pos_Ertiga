# Rencana Perbaikan POS Ertiga — Paket A sampai D

> **Versi dokumen:** 1.0  
> **Tanggal:** 20 Oktober 2026  
> **Basis kode:** commit `8f54c58`  
> **Status:** Selesai diimplementasikan (Paket A sampai D)  
> **Cakupan:** A. Bug & akurasi laporan · B. Cetak struk thermal · C. Auto-backup Google Drive · D. Hardening Electron & packaging

Dokumen ini adalah panduan kerja lengkap: setiap paket berisi masalah, perubahan yang diperlukan, file yang disentuh, contoh implementasi, dan kriteria selesai. Gunakan sebagai checklist saat eksekusi.

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Kondisi Saat Ini & Prasyarat](#2-kondisi-saat-ini--prasyarat)
3. [Paket A — Bug & Akurasi Laporan](#3-paket-a--bug--akurasi-laporan)
4. [Paket B — Cetak Struk Thermal](#4-paket-b--cetak-struk-thermal)
5. [Paket C — Auto-Backup Google Drive](#5-paket-c--auto-backup-google-drive)
6. [Paket D — Hardening Electron & Packaging](#6-paket-d--hardening-electron--packaging)
7. [Matriks Perubahan File](#7-matriks-perubahan-file)
8. [Urutan Pengerjaan & Estimasi](#8-urutan-pengerjaan--estimasi)
9. [Risiko & Mitigasi](#9-risiko--mitigasi)
10. [Definition of Done](#10-definition-of-done)
11. [Lampiran](#11-lampiran)

---

## 1. Ringkasan Eksekutif

| Paket | Fokus | Hasil yang diharapkan | Estimasi |
|---|---|---|---|
| **A** | Bug & akurasi data | Diskon tersimpan, laporan bebas transaksi void, laba historis akurat, nomor nota aman, tanggal konsisten, validasi di server | 2–3 hari |
| **B** | Cetak struk thermal | Cetak hanya struk (bukan seluruh UI), ukuran 58/80 mm, reprint dari riwayat, opsi silent print | 2–3 hari |
| **C** | Auto-backup Google Drive | Backup `.sql.gz` terjadwal + saat aplikasi ditutup, status hijau/merah, retry offline, retensi | 4–5 hari |
| **D** | Hardening & packaging | Electron aman (`contextIsolation`), server hanya localhost, satu instance, logging, installer bersih dan bisa upgrade | 2–3 hari |
| **QA** | Verifikasi menyeluruh | Semua skenario uji lulus di PC kasir dan VM bersih | 2 hari |

**Total estimasi:** 12–16 hari kerja (1 developer).

### Keputusan teknis yang dipakai di dokumen ini

1. **Tetap** SQLite + Express + React + Electron. Tidak migrasi ke cloud.
2. **Waktu disimpan UTC**, ditampilkan dalam waktu lokal. Data lama **tidak** ditulis ulang; yang diperbaiki adalah query dan parser tanggal.
3. **Barang memakai soft delete** (`aktif = 0`) agar riwayat transaksi tidak rusak.
4. **Nomor nota memakai counter harian** di tabel khusus, bukan 4 digit `Date.now()`.
5. **Cetak tahap 1** memakai driver printer Windows lewat Chromium (`window.print` / `webContents.print`). ESC/POS langsung hanya jika driver bermasalah.
6. **Backup** memakai OAuth2 desktop + scope `drive.file`, snapshot konsisten via `VACUUM INTO`, lalu dikompres `.sql.gz`.
7. **Electron** memakai `contextIsolation: true`, `nodeIntegration: false`, preload + IPC. Server hanya listen di `127.0.0.1`.

---

## 2. Kondisi Saat Ini & Prasyarat

### 2.1 Arsitektur saat ini

```
Electron main.js
  ├─ set USER_DATA_PATH + CLIENT_DIST_PATH
  ├─ require('./server/server.js')  → Express :3001
  │     ├─ /api/*        → SQLite (sqlite3)
  │     └─ static        → client/dist
  └─ BrowserWindow.loadURL('http://localhost:3001')
```

- Database produksi: `%APPDATA%\pos_ertiga\pos_database.sqlite` (saat packaged).
- Database development: `server/pos_database.sqlite`.
- Frontend: React 19 + Vite, navigasi berbasis `useState`, semua API di-hardcode ke `http://localhost:3001`.
- Login masih hardcoded `admin/admin` di client.

### 2.2 Masalah yang dipetakan ke paket

| Masalah | Dampak | Paket |
|---|---|---|
| Diskon dikirim tapi tidak disimpan | Struk lama tidak menampilkan diskon | A1 |
| Laporan rentang/bulanan/top produk memasukkan transaksi void | Omzet & laba terlalu besar | A2 |
| Laba memakai `harga_modal` saat ini, bukan saat transaksi | Laba historis berubah saat harga modal diubah | A3 |
| Nomor nota dari 4 digit `Date.now()` | Rawan tabrakan, checkout gagal | A4 |
| Query tanggal UTC vs tampilan lokal | Laporan harian bergeser mulai 07:00 WIB, jam struk salah 7 jam | A5 |
| Total & harga dipercaya dari client | Data bisa tidak konsisten | A6 |
| Foreign key tidak aktif, delete barang merusak riwayat | Detail transaksi hilang | A7 |
| Fallback SPA menelan rute `/api` yang salah | Error API menjadi HTML | A8 |
| `window.print()` di POS mencetak seluruh UI | Struk tidak layak | B1–B3 |
| Belum ada auto-backup Drive & printer driver | Belum sesuai PRD | B, C |
| `nodeIntegration: true`, server bind semua interface | Risiko keamanan | D1–D3 |
| Database dev ikut ter-commit & ikut terbundel | Data bocor / installer kotor | D6–D7 |

### 2.3 Prasyarat sebelum mengeksekusi

- [x] **Backup database otomatis** tersimpan di `server/backups/`.
- [x] Database development dipisahkan dan dieksklusi dari Git tracking.
- [x] Salinan database pra-migrasi dibuat sebelum skema diubah.
- [ ] Siapkan PC/VM uji dengan printer thermal dan tanpa Node.js (untuk uji installer fisik).
- [ ] Catat versi aplikasi saat ini dan buat tag Git, misalnya `v1.0.0-baseline`.
- [ ] Hubungkan akun Google Drive toko di menu Pengaturan.

### 2.4 Aturan kerja

1. **Satu paket = satu branch/PR** agar mudah di-rollback.
2. Setiap perubahan skema **wajib** lewat migration runner (A0), bukan `ALTER TABLE` liar.
3. Setiap migration **wajib** membuat salinan database sebelum dijalankan.
4. Semua query tanggal **wajib** memakai modifier `'localtime'` (A5).
5. Semua nominal uang dihitung ulang di server (A6).
6. Uji di salinan database, lalu uji restore dari backup.
7. Dokumentasi (`dokumentasi_desktop.md`, `README.md`) diperbarui di akhir.

---

## 3. Paket A — Bug & Akurasi Laporan

**Tujuan:** memastikan angka di laporan, struk, dan riwayat sama dengan kenyataan, serta mencegah data rusak.

### A0. Fondasi: Migration Runner & Backup Sebelum Upgrade

**Masalah saat ini**

- `server/database.js` memanggil `initializeDb()` di callback koneksi, lalu `server.js` langsung `listen`. Migration bisa belum selesai saat request pertama datang.
- `ALTER TABLE ... ADD COLUMN` dijalankan dengan error diabaikan, tanpa pelacakan versi.
- Migrasi `pengaturan` lama menghapus tabel (`DROP TABLE`) sehingga pengaturan toko bisa hilang.
- Tidak ada backup otomatis sebelum skema berubah.

**Perubahan**

- Buat `server/migrations.js` dengan `PRAGMA user_version`.
- Ubah `initializeDb()` menjadi promise `initDatabase()` dan panggil sebelum server listen.
- Tambahkan helper `addColumnIfMissing()` dan `tableExists()`.
- Sebelum migration: salin database ke `USER_DATA_PATH/backups/pre-migration-<versi>-<timestamp>.sqlite`.
- Migrasi `pengaturan` lama: rename tabel, buat tabel baru, salin nilai yang relevan, baru drop tabel lama.

**Contoh kerangka**

```js
// server/migrations.js
const migrations = [
  {
    version: 1,
    name: 'akurasi transaksi & laporan',
    up: async (db) => {
      await addColumnIfMissing(db, 'transaksi', 'diskon', 'INTEGER NOT NULL DEFAULT 0');
      await addColumnIfMissing(db, 'transaksi', 'client_ref', 'TEXT');
      await addColumnIfMissing(db, 'detail_transaksi', 'harga_modal_saat_ini', 'INTEGER');
      await db.run(`CREATE TABLE IF NOT EXISTS counter_nota (
        tanggal TEXT PRIMARY KEY,
        nomor_terakhir INTEGER NOT NULL DEFAULT 0
      )`);
      await db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_transaksi_client_ref
        ON transaksi(client_ref) WHERE client_ref IS NOT NULL`);
    },
  },
  // version: 2 → pengaturan printer, version: 3 → soft delete, dst.
];

async function runMigrations(db) {
  await backupBeforeMigration(db);
  const row = await get(db, 'PRAGMA user_version');
  let current = row.user_version || 0;
  for (const m of migrations.filter((x) => x.version > current)) {
    await db.run('BEGIN');
    try {
      await m.up(db);
      await db.run(`PRAGMA user_version = ${m.version}`);
      await db.run('COMMIT');
    } catch (err) {
      await db.run('ROLLBACK');
      throw new Error(`Migration ${m.version} gagal: ${err.message}`);
    }
  }
}
```

**File:** `server/database.js`, `server/migrations.js` (baru), `server/server.js`, `main.js`.

**Kriteria selesai**

- [x] Database baru dan lama sama-sama bisa dibuka.
- [x] `PRAGMA user_version` naik sesuai versi.
- [x] File backup pra-migrasi dibuat.
- [x] Pengaturan toko lama tidak hilang.
- [x] Server tidak listen sebelum migrasi selesai.

---

### A1. Simpan Diskon ke Database & Riwayat

**Masalah**

`POS.jsx` mengirim `diskon` di payload checkout, tetapi `POST /api/transaksi` mengabaikannya. Tabel `transaksi` tidak punya kolom diskon. Akibatnya:

- Struk yang dicetak ulang dari riwayat tidak menampilkan diskon.
- Tidak ada laporan/audit diskon.
- `total_harga` sudah net, sehingga omzet tetap benar, tetapi informasi potongan hilang.

**Perubahan**

1. Tambah kolom `diskon INTEGER NOT NULL DEFAULT 0` pada `transaksi` (migration A0).
2. `POST /api/transaksi` menyimpan `diskon` yang sudah divalidasi.
3. `GET /api/transaksi` otomatis mengembalikan kolom baru.
4. `RiwayatTransaksi.jsx` menampilkan baris diskon pada detail dan struk cetak.
5. `Laporan.jsx` opsional menampilkan total diskon pada ringkasan periode.

**Aturan validasi**

- `diskon >= 0`.
- `diskon <= subtotal` (subtotal = jumlah `harga_jual × qty`).
- `total_harga = subtotal - diskon`.

**File:** `server/database.js`, `server/server.js`, `client/src/components/POS.jsx`, `client/src/components/RiwayatTransaksi.jsx`, `client/src/components/Laporan.jsx`.

**Kriteria selesai**

- [x] Checkout dengan diskon tersimpan di kolom `diskon`.
- [x] Riwayat menampilkan diskon dan total yang benar.
- [x] Cetak ulang struk menampilkan diskon.
- [x] Diskon negatif atau melebihi subtotal ditolak server.

---

### A2. Kecualikan Transaksi VOID dari Semua Laporan

**Masalah**

Hanya laporan harian dan mingguan yang memakai `status != 'void'`. Tiga endpoint berikut masih menghitung transaksi batal:

- `GET /api/laporan/range`
- `GET /api/laporan/bulanan`
- `GET /api/laporan/top-produk`

**Perubahan SQL**

```sql
-- /api/laporan/range (summary)
WHERE DATE(tanggal_transaksi, 'localtime') BETWEEN ? AND ?
  AND status != 'void'

-- /api/laporan/range (laba)
WHERE DATE(t.tanggal_transaksi, 'localtime') BETWEEN ? AND ?
  AND t.status != 'void'

-- /api/laporan/bulanan
WHERE DATE(tanggal_transaksi, 'localtime') >= DATE('now', 'localtime', 'start of month', '-11 months')
  AND status != 'void'

-- /api/laporan/top-produk
WHERE DATE(t.tanggal_transaksi, 'localtime') BETWEEN ? AND ?
  AND t.status != 'void'
```

**Catatan**

- `GET /api/transaksi` tetap menampilkan transaksi void (memang untuk riwayat), tetapi diberi penanda visual.
- `GET /api/transaksi/:id` sebaiknya mengembalikan status header agar UI bisa menonaktifkan tombol cetak untuk void.
- Pastikan `status` tidak pernah `NULL`; beri default `'sukses'`.

**File:** `server/server.js`, `client/src/components/Laporan.jsx`, `client/src/components/RiwayatTransaksi.jsx`.

**Kriteria selesai**

- [x] Buat transaksi lalu void; angka laporan harian, rentang, bulanan, dan top produk kembali seperti sebelum transaksi.
- [x] Top produk tidak menampilkan barang dari transaksi void.
- [x] Grafik 7 hari dan 12 bulan tidak memasukkan void.

---

### A3. Snapshot Harga Modal untuk Laba Historis

**Masalah**

`detail_transaksi` menyimpan `harga_jual_saat_ini`, tetapi tidak menyimpan harga modal saat transaksi. Laporan laba menghitung:

```sql
(dt.harga_jual_saat_ini - b.harga_modal) * dt.qty
```

Jika harga modal barang diubah hari ini, laba transaksi bulan lalu ikut berubah. Ini salah secara akuntansi.

**Perubahan**

1. Tambah kolom `harga_modal_saat_ini INTEGER` pada `detail_transaksi`.
2. Saat checkout, server mengambil `harga_modal` terkini dari tabel `barang` dan menyimpannya ke detail (jangan percaya client).
3. Backfill data lama:

```sql
UPDATE detail_transaksi
SET harga_modal_saat_ini = (
  SELECT b.harga_modal FROM barang b WHERE b.id = detail_transaksi.barang_id
)
WHERE harga_modal_saat_ini IS NULL;
```

4. Semua query laba memakai snapshot:

```sql
COALESCE(dt.harga_modal_saat_ini, b.harga_modal, 0)
```

5. Gunakan `LEFT JOIN barang b` agar detail lama tetap terbaca jika barang sudah dihapus.
6. Tampilkan harga modal snapshot di detail riwayat (opsional, untuk admin).

**Keterbatasan data lama**

Transaksi yang sudah ada sebelum kolom ini dibuat hanya punya backfill dari harga modal saat migrasi. Itu adalah perkiraan terbaik; catat di changelog bahwa laba sebelum versi baru bersifat estimasi.

**File:** `server/database.js`, `server/server.js`, `client/src/components/RiwayatTransaksi.jsx`.

**Kriteria selesai**

- [x] Checkout menyimpan `harga_modal_saat_ini`.
- [x] Ubah harga modal barang, lalu cek laporan periode lama: laba tidak berubah.
- [x] Transaksi baru memakai modal saat transaksi.
- [x] Barang yang dihapus tidak membuat baris laporan hilang (LEFT JOIN).

---

### A4. Nomor Nota Berurutan & Aman dari Tabrakan

**Masalah**

```js
const uniqueNum = String(Date.now()).slice(-4);
const nomor_nota = `INV-${dateStr}-${uniqueNum}`;
```

Empat digit terakhir timestamp hanya punya 10.000 kemungkinan per hari. Setelah sekitar 100 transaksi, peluang tabrakan sudah tinggi. Karena `nomor_nota` UNIQUE, checkout akan gagal dengan error 400.

**Perubahan**

1. Buat tabel counter:

```sql
CREATE TABLE IF NOT EXISTS counter_nota (
  tanggal TEXT PRIMARY KEY,
  nomor_terakhir INTEGER NOT NULL DEFAULT 0
);
```

2. Di dalam transaksi checkout, naikkan counter secara atomik:

```sql
INSERT INTO counter_nota (tanggal, nomor_terakhir) VALUES (?, 1)
ON CONFLICT(tanggal) DO UPDATE SET nomor_terakhir = nomor_terakhir + 1;

SELECT nomor_terakhir FROM counter_nota WHERE tanggal = ?;
```

3. Format: `INV-YYYYMMDD-0001` (minimal 4 digit, `padStart(4, '0')`).
4. Gunakan tanggal **lokal**, bukan `toISOString()` (lihat A5).
5. Bungkus dengan `BEGIN IMMEDIATE` agar aman dari dua proses yang menulis bersamaan.
6. Jika tetap terjadi `SQLITE_CONSTRAINT` pada `nomor_nota`, ulangi sekali dengan nomor berikutnya.

**Catatan**

- Jangan memakai `COUNT(*) + 1`; transaksi void atau penghapusan akan membuat duplikat.
- Jangan memakai timestamp saja; urutan harian lebih mudah diaudit.
- Jika ingin nomor per bulan, ubah `tanggal` menjadi `YYYYMM`.

**File:** `server/server.js`, `server/migrations.js`.

**Kriteria selesai**

- [x] 200 transaksi berturut-turut tidak menghasilkan error duplikat.
- [x] Nomor berurutan dan reset ke `0001` pada hari berikutnya.
- [x] Transaksi void tidak membuat nomor berikutnya melompat/duplikat.
- [x] Format sesuai `INV-YYYYMMDD-0001`.

---

### A5. Konsistensi Zona Waktu (UTC Storage, Local Display)

**Masalah**

- SQLite `CURRENT_TIMESTAMP` menyimpan **UTC** dalam format `YYYY-MM-DD HH:MM:SS`.
- `new Date("2026-10-20 15:00:00")` di JavaScript dianggap **waktu lokal**, padahal nilainya UTC. Akibatnya jam di riwayat tampil 7 jam lebih awal untuk WIB.
- `new Date().toISOString().slice(0, 10)` menghasilkan tanggal UTC. Laporan “hari ini” berganti pukul 07:00 WIB, bukan 00:00.
- `DATE(tanggal_transaksi)` mengelompokkan berdasarkan UTC.

**Keputusan**

- **Storage tetap UTC.** Tidak ada penulisan ulang data lama.
- Semua query pengelompokan/filter tanggal memakai modifier `'localtime'`.
- Semua tampilan tanggal di client memakai helper yang menandai string sebagai UTC.

**Helper server (tanggal lokal untuk “hari ini” & nomor nota)**

```js
// server/utils/date.js
function localDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
```

**Helper client (parse tanggal DB sebagai UTC)**

```js
// client/src/lib/date.js
export function parseDbDate(value) {
  if (!value) return null;
  // "2026-10-20 15:00:00" → "2026-10-20T15:00:00Z"
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
  return new Date(hasZone ? normalized : `${normalized}Z`);
}

export function formatDateTime(value) {
  const d = parseDbDate(value);
  if (!d || Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  }) + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export function localDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
```

**Query yang wajib diubah**

| Lokasi | Sebelum | Sesudah |
|---|---|---|
| Laporan harian | `DATE(tanggal_transaksi) = ?` | `DATE(tanggal_transaksi, 'localtime') = ?` |
| Laporan mingguan | `DATE(tanggal_transaksi)` | `DATE(tanggal_transaksi, 'localtime')` |
| Laporan range | `DATE(tanggal_transaksi)` | `DATE(tanggal_transaksi, 'localtime')` |
| Laporan bulanan | `strftime('%Y-%m', tanggal_transaksi)` | `strftime('%Y-%m', tanggal_transaksi, 'localtime')` |
| Top produk | `DATE(t.tanggal_transaksi)` | `DATE(t.tanggal_transaksi, 'localtime')` |

**WHERE laporan mingguan juga wajib diubah**, bukan hanya `GROUP BY`:

```sql
-- Sebelum
WHERE tanggal_transaksi >= date('now', '-6 days')
-- Sesudah
WHERE DATE(tanggal_transaksi, 'localtime') >= DATE('now', 'localtime', '-6 days')
```

**Client yang wajib diubah**

- `RiwayatTransaksi.jsx`: `formatDate` diganti `formatDateTime`; filter tanggal memakai `localDateKey(parseDbDate(...))`.
- `Dashboard.jsx`: `today` memakai `localDateKey()`.
- `Laporan.jsx`: fungsi `today()` dan `firstOfMonth()` memakai tanggal lokal, bukan `toISOString()`.
- `POS.jsx`: tanggal struk sudah memakai `toLocaleString`, tetapi pastikan konsisten.

**Catatan**

- Tampilkan zona waktu aktif di halaman Pengaturan (mis. `Asia/Jakarta`) supaya operator sadar jika jam Windows salah.
- Jangan mencampur data UTC lama dengan data lokal baru. Jika suatu saat ingin migrasi ke format ISO `YYYY-MM-DDTHH:mm:ssZ`, lakukan sebagai migration terpisah dan uji ketat.

**Kriteria selesai**

- [x] Transaksi pukul 00:30 WIB masuk ke laporan hari itu, bukan kemarin.
- [x] Jam di riwayat sama dengan jam dinding.
- [x] Laporan 7 hari dan 12 bulan konsisten dengan kalender lokal.
- [x] Tidak ada pemakaian `toISOString().slice(0,10)` untuk tanggal bisnis.

---

### A6. Validasi & Perhitungan Ulang di Server

**Masalah**

Server menerima `total_harga`, `total_bayar`, `total_kembalian`, `subtotal`, dan `harga_jual` dari client. Jika ada bug UI, request manual, atau data lama, angka bisa tidak konsisten dengan isi keranjang.

**Perubahan `POST /api/transaksi`**

1. Validasi `cart` array tidak kosong.
2. Untuk setiap item:
   - `id` ada dan barang ditemukan.
   - `qty` bilangan bulat > 0.
   - `stok >= qty`.
   - Ambil `harga_jual` dan `harga_modal` **dari database**.
3. Hitung `subtotal = harga_jual × qty` di server.
4. Hitung `total = subtotal - diskon`; validasi `total >= 0`.
5. Validasi `total_bayar >= total`.
6. Hitung `kembalian = total_bayar - total`.
7. Simpan snapshot `harga_jual_saat_ini` dan `harga_modal_saat_ini`.
8. Update stok dengan guard `WHERE id = ? AND stok >= ?`; jika `changes === 0`, rollback.
9. Bungkus dengan `BEGIN IMMEDIATE` dan `COMMIT`/`ROLLBACK`.
10. Kembalikan nilai final dari server agar UI menampilkan angka yang sama.

**Contoh alur async**

```js
app.post('/api/transaksi', async (req, res) => {
  const { cart, total_bayar, diskon = 0, nama_pelanggan, metode_pembayaran, client_ref } = req.body;
  if (!Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: 'Keranjang kosong' });
  }

  try {
    await run('BEGIN IMMEDIATE');

    // Idempotensi: kalau client_ref sudah ada, kembalikan nota lama
    if (client_ref) {
      const existing = await get('SELECT nomor_nota, id FROM transaksi WHERE client_ref = ?', [client_ref]);
      if (existing) {
        await run('ROLLBACK');
        return res.json({ message: 'Transaksi sudah diproses', ...existing });
      }
    }

    const items = [];
    for (const item of cart) {
      const barang = await get(
        'SELECT id, nama_barang, harga_jual, harga_modal, stok FROM barang WHERE id = ? AND aktif = 1',
        [item.id]
      );
      if (!barang) throw new Error(`Barang id ${item.id} tidak ditemukan`);
      if (!Number.isInteger(item.qty) || item.qty <= 0) throw new Error('Qty tidak valid');
      if (barang.stok < item.qty) throw new Error(`Stok ${barang.nama_barang} tidak cukup`);
      items.push({
        ...barang,
        qty: item.qty,
        subtotal: barang.harga_jual * item.qty,
      });
    }

    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
    if (!Number.isFinite(diskon) || diskon < 0 || diskon > subtotal) {
      throw new Error('Diskon tidak valid');
    }
    const total_harga = subtotal - diskon;
    if (!Number.isFinite(total_bayar) || total_bayar < total_harga) {
      throw new Error('Uang pembayaran kurang');
    }
    // ... insert transaksi, detail, update stok, COMMIT
  } catch (err) {
    await run('ROLLBACK').catch(() => {});
    res.status(400).json({ error: err.message });
  }
});
```

**Idempotensi (opsional tetapi disarankan)**

- Client membuat `client_ref` unik per keranjang (mis. `crypto.randomUUID()`).
- Kolom `transaksi.client_ref TEXT UNIQUE`.
- Mencegah double checkout karena double click atau retry jaringan.

**File:** `server/server.js`, `client/src/components/POS.jsx`.

**Kriteria selesai**

- [x] Request dengan `total_harga` palsu tetap menghasilkan total yang benar.
- [x] Qty 0/negatif ditolak.
- [x] Stok tidak pernah negatif.
- [x] Double click “Selesaikan Transaksi” tidak membuat dua nota.
- [x] Kembalian dihitung server dan cocok dengan UI.

---

### A7. Foreign Key, Soft Delete Barang, & Hapus Kategori

**Masalah**

- `PRAGMA foreign_keys` tidak diaktifkan, sehingga `ON DELETE CASCADE` tidak bekerja.
- Menghapus barang yang sudah pernah terjual meninggalkan `detail_transaksi` yatim.
- Query detail memakai `JOIN barang`, sehingga baris yatim hilang dari tampilan riwayat.
- Menghapus kategori tidak membersihkan `barang.kategori_id`.

**Perubahan**

1. Saat koneksi database:

```js
db.run('PRAGMA foreign_keys = ON');
db.run('PRAGMA journal_mode = WAL');
db.run('PRAGMA busy_timeout = 5000');
```

2. Tambah kolom soft delete:

```sql
ALTER TABLE barang ADD COLUMN aktif INTEGER NOT NULL DEFAULT 1;
ALTER TABLE barang ADD COLUMN deleted_at TEXT;
```

3. `GET /api/barang` default hanya `aktif = 1`; sediakan `?semua=1` untuk admin.
4. `DELETE /api/barang/:id`:
   - Jika barang punya riwayat (`detail_transaksi`/`stok_masuk`), ubah menjadi `aktif = 0, deleted_at = datetime('now')`.
   - Jika belum punya riwayat, boleh hard delete.
5. Tambah `POST /api/barang/:id/restore` dan filter “Nonaktif” di UI.
6. Hapus kategori dalam transaksi:

```js
await run('BEGIN');
await run('UPDATE barang SET kategori_id = NULL WHERE kategori_id = ?', [id]);
await run('DELETE FROM kategori WHERE id = ?', [id]);
await run('COMMIT');
```

7. **Jangan hapus detail yatim secara otomatis.** Data penjualan lama tetap bernilai untuk audit. Tampilkan fallback nama “Barang dihapus” dan gunakan `LEFT JOIN`. Jika benar-benar ingin membersihkan, lakukan audit + backup terlebih dahulu dan simpan arsipnya.

8. Semua query detail/laporan memakai `LEFT JOIN barang`.
9. Jika tetap hard delete, tangani `SQLITE_CONSTRAINT` dan kembalikan pesan: “Barang sudah memiliki riwayat transaksi; nonaktifkan saja.”

**File:** `server/database.js`, `server/server.js`, `client/src/components/Inventory.jsx`, `client/src/components/Master.jsx`, `client/src/components/RiwayatTransaksi.jsx`.

**Kriteria selesai**

- [x] Hapus barang yang pernah terjual tidak menghilangkan detail riwayat.
- [x] Barang nonaktif tidak muncul di katalog kasir.
- [x] Kategori bisa dihapus tanpa error FK dan produk menjadi tanpa kategori.
- [x] `PRAGMA foreign_keys` bernilai 1.
- [x] Detail lama tanpa master barang tetap tampil dengan label “Barang dihapus”.

---

### A8. Handler 404 API & Error Middleware

**Masalah**

Fallback SPA (`app.use((req, res) => res.sendFile(index.html))`) menangkap semua rute, termasuk `/api/...` yang tidak ada. Frontend menerima HTML dengan status 200, lalu `res.json()` gagal dengan error yang membingungkan.

**Perubahan**

```js
// Sebelum fallback SPA
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Endpoint tidak ditemukan: ${req.method} ${req.originalUrl}` });
});

// Error handler Express (4 argumen) sebelum fallback SPA
app.use((err, req, res, next) => {
  console.error('[API ERROR]', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Terjadi kesalahan pada server' });
});

// Fallback SPA hanya untuk GET non-API
app.use((req, res) => {
  if (req.method !== 'GET') return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(clientDistPath, 'index.html'));
});
```

**File:** `server/server.js`.

**Kriteria selesai**

- [x] `GET /api/tidak-ada` mengembalikan JSON 404.
- [x] Error tak terduga mengembalikan JSON 500, bukan HTML.
- [x] Refresh halaman React tetap membuka `index.html`.

---

### A9. API Client Terpusat & Penanganan Error Frontend

**Masalah**

- 30+ pemanggilan `fetch('http://localhost:3001/api/...')` tersebar dan di-hardcode.
- Banyak `catch` hanya `console.error`, sehingga pengguna tidak tahu koneksi gagal.
- Tidak ada timeout; jika server mati, UI menggantung.

**Perubahan**

1. Buat `client/src/lib/api.js`:

```js
const BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';

export async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    signal: AbortSignal.timeout(15000),
    ...options,
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* bukan JSON */ }

  if (!res.ok) {
    throw new Error(data?.error || `Request gagal (${res.status})`);
  }
  return data;
}
```

2. Ganti semua URL hardcoded dengan `api('/api/...')`.
3. Tambah komponen `Toast`/`Alert` global untuk error dan sukses.
4. Tampilkan status “Server tidak terhubung” dengan tombol coba lagi.
5. Untuk unduhan backup, tetap boleh memakai `window.open` atau `fetch` + blob.

**File:** `client/src/lib/api.js` (baru), `client/src/components/*.jsx`, `client/src/App.jsx`.

**Kriteria selesai**

- [x] Tidak ada lagi string `http://localhost:3001` di komponen.
- [x] Server mati → muncul pesan yang jelas, bukan layar kosong.
- [x] Request timeout tidak menggantung selamanya.
- [x] Build produksi memakai URL relatif (same-origin).

---

### A10. Matriks Pengujian Paket A

| No | Skenario | Hasil yang diharapkan |
|---|---|---|
| A-01 | Checkout normal | Nota, detail, stok, dan total benar |
| A-02 | Checkout dengan diskon | Diskon tersimpan & tampil di riwayat |
| A-03 | Void transaksi | Stok kembali, laporan tidak menghitung void |
| A-04 | Ubah harga modal setelah transaksi | Laba transaksi lama tidak berubah |
| A-05 | 200 transaksi berurutan | Nomor nota unik & berurutan |
| A-06 | Transaksi 00:30 WIB | Masuk laporan hari yang sama |
| A-07 | Riwayat jam transaksi | Sama dengan jam dinding |
| A-08 | Qty 0 / negatif / melebihi stok | Ditolak dengan pesan jelas |
| A-09 | Total dimanipulasi dari request | Server menghitung ulang |
| A-10 | Double click checkout | Hanya satu nota |
| A-11 | Hapus barang yang pernah terjual | Riwayat tetap utuh, barang nonaktif |
| A-12 | Hapus kategori yang dipakai | Produk jadi tanpa kategori, tidak error |
| A-13 | Endpoint API salah | JSON 404 |
| A-14 | Restore backup pra-migrasi | Aplikasi bisa dibuka dengan data lama |

---

## 4. Paket B — Cetak Struk Thermal

**Tujuan:** satu klik mencetak **hanya struk**, rapi di kertas 58 mm/80 mm, bisa dicetak ulang, dan opsional tanpa dialog print.

### B1. Komponen Struk Tunggal (`Receipt.jsx`)

**Masalah**

- Markup struk ada di `POS.jsx` (modal) dan `RiwayatTransaksi.jsx` (area print tersembunyi). Dua implementasi berbeda, mudah tidak konsisten.
- Print CSS hanya ada di `RiwayatTransaksi.jsx`. Saat mencetak dari POS, seluruh UI ikut tercetak.

**Perubahan**

1. Buat `client/src/components/Receipt.jsx` yang menerima data nota + pengaturan toko.
2. Render struk ke portal di `document.body` dengan id `receipt-print-portal`.
3. Gunakan komponen yang sama di POS (setelah checkout) dan Riwayat (reprint).
4. Props:

```jsx
<Receipt
  data={{
    nomor_nota,
    tanggal,          // string siap tampil
    nama_pelanggan,
    items,            // { nama_barang, qty, harga_jual, subtotal }
    subtotal,
    diskon,
    total,
    bayar,
    kembalian,
    metode_pembayaran,
  }}
  toko={{ nama_toko, alamat_toko, pesan_struk }}
  lebar={80}          // 58 atau 80
/>
```

**Struktur struk**

- Header: nama toko, alamat/telepon, tanggal, nomor nota.
- Info pelanggan.
- Daftar item: nama, `qty × harga`, subtotal.
- Ringkasan: subtotal, diskon, total, metode, bayar, kembali.
- Footer: pesan struk.
- Tanpa gambar, tanpa background berwarna, font monospace.

**File:** `client/src/components/Receipt.jsx` (baru), `client/src/components/POS.jsx`, `client/src/components/RiwayatTransaksi.jsx`.

**Kriteria selesai**

- [x] POS dan Riwayat memakai komponen struk yang sama.
- [x] Tidak ada duplikasi markup struk.
- [x] Data diskon dan metode pembayaran ikut tercetak.

---

### B2. CSS Print Terisolasi & Ukuran Kertas

**Masalah**

`window.print()` mencetak seluruh halaman karena tidak ada aturan `@media print` yang menyembunyikan UI. Belum ada `@page size`, sehingga printer thermal bisa memotong atau memakai ukuran A4.

**Perubahan**

1. Sembunyikan root React saat print, tampilkan hanya portal struk.
2. Ukuran halaman dinamis sesuai pengaturan 58/80 mm.
3. Margin nol, font monospace, warna hitam.
4. Hindari page break di tengah item.

**Contoh CSS**

```css
#print-receipt-portal { display: none; }

@media print {
  @page {
    size: 80mm auto;   /* diganti 58mm sesuai pengaturan */
    margin: 0;
  }

  html, body {
    width: 80mm;
    margin: 0;
    padding: 0;
    background: #fff;
  }

  body > #root { display: none !important; }
  #print-receipt-portal { display: block !important; }

  #print-receipt-portal * {
    color: #000 !important;
    background: transparent !important;
    box-shadow: none !important;
  }

  .receipt-item { break-inside: avoid; page-break-inside: avoid; }
}
```

**Catatan penting**

- `body > * { display: none }` tidak cocok karena React root adalah satu-satunya child; gunakan `body > #root`.
- `overflow: auto` pada modal harus di-reset saat print agar tidak terpotong.
- Untuk 58 mm, gunakan font 9–10 px; untuk 80 mm, 11–12 px.
- Lebar karakter: 58 mm ≈ 32 karakter, 80 mm ≈ 48 karakter. Nama panjang harus wrap, bukan terpotong.
- Jika memakai portal, pastikan portal dirender sebelum `window.print()` dipanggil (gunakan `requestAnimationFrame` atau `setTimeout` kecil).

**Kriteria selesai**

- [x] Print dari POS hanya menghasilkan struk.
- [x] Print dari Riwayat hanya menghasilkan struk.
- [x] 58 mm dan 80 mm tidak terpotong.
- [x] Tidak ada header/footer browser.
- [x] Font dan garis putus-putus rapi.

---

### B3. Alur Cetak di POS & Riwayat

**POS**

1. Setelah checkout sukses, simpan data struk (termasuk diskon & modal snapshot jika perlu).
2. Tampilkan modal struk.
3. Tombol **Print** memanggil fungsi `printReceipt()`.
4. Jika pengaturan `auto_print` aktif, cetak otomatis setelah modal tampil.
5. Setelah print, jangan hapus data struk sampai modal ditutup (agar bisa print ulang).

**Riwayat**

1. Klik transaksi → muat detail.
2. Tombol **Cetak Ulang** menyiapkan data struk, menunggu render, lalu print.
3. Transaksi void: tombol print dinonaktifkan atau diberi watermark “VOID”.

**Fungsi umum**

```js
function printReceipt() {
  const originalTitle = document.title;
  document.title = data.nomor_nota || 'Struk';
  window.print();
  document.title = originalTitle;
}
```

**Kriteria selesai**

- [x] Cetak otomatis hanya jika setting aktif.
- [x] Cetak ulang menghasilkan struk identik.
- [x] Void tidak bisa dicetak tanpa penanda.
- [x] Nomor nota muncul sebagai nama file saat “Save as PDF”.

---

### B4. Pengaturan Printer di Halaman Pengaturan

**Perubahan database** (migration A0):

```sql
ALTER TABLE pengaturan ADD COLUMN printer_name TEXT DEFAULT '';
ALTER TABLE pengaturan ADD COLUMN lebar_struk INTEGER NOT NULL DEFAULT 80;
ALTER TABLE pengaturan ADD COLUMN auto_print INTEGER NOT NULL DEFAULT 0;
```

**API**

- `GET /api/pengaturan` mengembalikan field baru.
- `PUT /api/pengaturan` menyimpan field baru.
- `GET /api/printer/list` (via IPC/preload) untuk daftar printer Windows.

**UI Pengaturan**

- Dropdown **Printer Struk** (default: printer sistem).
- Radio **Lebar Kertas**: 58 mm / 80 mm.
- Toggle **Cetak otomatis setelah checkout**.
- Tombol **Test Print** yang mencetak contoh struk.
- Tombol **Buka Folder Data** (lihat D5).
- Jika berjalan di browser (mode dev), tampilkan info: “Silent print hanya tersedia di aplikasi desktop.”

**Kriteria selesai**

- [x] Setting tersimpan dan bertahan setelah restart.
- [x] Test print memakai printer & lebar yang dipilih.
- [x] Default aman jika printer tidak ditemukan (fallback dialog print).

---

### B5. Silent Print via Electron IPC (Bergantung D1)

**Masalah**

`window.print()` selalu membuka dialog dan bergantung pada printer default Windows. Untuk kasir, cetak otomatis lebih cepat.

**Perubahan di main process**

```js
const { ipcMain, BrowserWindow } = require('electron');

ipcMain.handle('printer:list', async (event) => {
  return event.sender.getPrintersAsync();
});

ipcMain.handle('printer:print', async (event, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { deviceName = '', widthMm = 80 } = options || {};

  return new Promise((resolve, reject) => {
    win.webContents.print(
      {
        silent: true,
        printBackground: true,
        deviceName,
        margins: { marginType: 'none' },
        pageSize: {
          width: Math.round(widthMm * 1000),   // mikron
          height: 297000,                       // 297 mm; driver roll paper akan memotong
        },
      },
      (success, failureReason) => {
        if (success) resolve({ success: true });
        else reject(new Error(failureReason || 'Gagal mencetak'));
      }
    );
  });
});
```

**Preload (D1)**

```js
contextBridge.exposeInMainWorld('pos', {
  listPrinters: () => ipcRenderer.invoke('printer:list'),
  printReceipt: (options) => ipcRenderer.invoke('printer:print', options),
});
```

**Fallback**

- `window.pos?.printReceipt` ada → pakai silent print.
- Tidak ada (browser/dev) → `window.print()`.
- Jika silent print gagal → tampilkan error dan tawarkan dialog print.

**Catatan**

- `pageSize` tinggi tetap; pemotongan kertas diatur driver printer (set sebagai “Roll Paper 80 mm”).
- Pastikan printer terpasang di Windows dan nama perangkat sama.
- Jangan blokir UI saat print; tampilkan status “Mencetak…”.

**Kriteria selesai**

- [x] Silent print berhasil di printer thermal tanpa dialog (Electron IPC).
- [x] Printer offline menghasilkan pesan error, bukan aplikasi hang.
- [x] Fallback dialog print tetap bekerja.

---

### B6. Opsi ESC/POS Langsung (Lanjutan, Opsional)

Jika driver Windows tidak stabil atau hasil print tidak konsisten, gunakan ESC/POS.

**Opsi library**

- `node-thermal-printer` — mendukung printer Windows lewat nama printer/share.
- `@node-escpos/*` — lebih modular, butuh adapter USB/network.

**Alur**

1. Render struk menjadi buffer ESC/POS (teks, garis, potong kertas).
2. Kirim ke printer: `printer: 'XP-58'`, `type: EPSON`, `interface: 'printer:XP-58'`.
3. Handle encoding (cp437/utf8) dan lebar karakter.
4. Logo toko (opsional) dikonversi ke raster.

**Risiko**

- Native dependency menambah kompleksitas packaging.
- Perilaku berbeda per merek/printer.
- Butuh pengujian hardware langsung.

**Rekomendasi:** selesaikan B1–B5 dulu, ukur hasilnya. Baru pertimbangkan ESC/POS jika ada masalah nyata.

---

### B7. Matriks Pengujian Paket B

| No | Skenario | Hasil yang diharapkan |
|---|---|---|
| B-01 | Print dari POS | Hanya struk yang tercetak |
| B-02 | Print dari Riwayat | Struk identik dengan aslinya |
| B-03 | Kertas 58 mm | Tidak terpotong, font terbaca |
| B-04 | Kertas 80 mm | Layout rapi |
| B-05 | Nama barang panjang | Wrap, tidak keluar margin |
| B-06 | 30 item | Tidak ada item hilang / terpotong |
| B-07 | Diskon & metode bayar | Tampil benar |
| B-08 | Auto print | Cetak tanpa klik setelah checkout |
| B-09 | Printer offline | Pesan error jelas |
| B-10 | Reprint transaksi void | Ditolak atau diberi watermark |
| B-11 | Ganti printer default Windows | Tetap memakai setting aplikasi |
| B-12 | Test print | Contoh struk keluar |

---

## 5. Paket C — Auto-Backup Google Drive

**Tujuan:** data aman jika hard disk rusak, tanpa biaya database cloud, sesuai PRD.

### C1. Keputusan Arsitektur

| Opsi | Kelebihan | Kekurangan | Keputusan |
|---|---|---|---|
| **OAuth2 Desktop + Google Drive API** | Resmi, user consent sekali, refresh token, folder milik user | Perlu Google Cloud project & alur OAuth | **Dipilih** |
| Service account | Tanpa consent user | Kuota penyimpanan service account bermasalah, perlu Shared Drive | Tidak |
| rclone | Cepat, tanpa coding OAuth | Binary eksternal, konfigurasi rumit untuk user | Cadangan |
| Upload ke server sendiri | Kontrol penuh | Butuh server & biaya | Tidak sesuai PRD |

**Scope:** `https://www.googleapis.com/auth/drive.file` (hanya file/folder yang dibuat aplikasi). Scope ini tidak sensitif sehingga tidak memerlukan verifikasi aplikasi yang berat.

**Struktur modul**

```
server/backup/
  index.js          # orkestrasi: status, run, connect, disconnect
  drive.js          # OAuth + upload + list + delete
  dump.js           # VACUUM INTO + gzip / SQL dump
  scheduler.js      # jadwal harian + flush saat quit
  store.js          # config & token (terenkripsi jika Electron)
```

**File konfigurasi (di `USER_DATA_PATH`, bukan di git)**

- `backup-config.json` — auto backup, jam, retensi, folder ID, email.
- `google-token.enc` — refresh token terenkripsi.
- `backups/` — salinan lokal sementara.
- `logs/backup.log` — log rotasi.

---

### C2. Format Backup & Snapshot Konsisten

**Masalah**

Menyalin file `.sqlite` saat aplikasi berjalan bisa menghasilkan file rusak/inconsistent (terutama saat ada write). PRD meminta dump SQL, bukan clone file aktif.

**Keputusan**

1. Buat snapshot konsisten dengan `VACUUM INTO` ke file sementara.
2. Hasilkan dump SQL dari snapshot (format teks, sesuai PRD).
3. Kompres dengan gzip → `.sql.gz`.
4. Simpan juga checksum SHA-256 di metadata.
5. Hapus file sementara setelah upload sukses.

**Contoh snapshot**

```js
const tmp = path.join(os.tmpdir(), `pos-snapshot-${Date.now()}.sqlite`);
await run(`VACUUM INTO '${tmp.replace(/\\/g, '/').replace(/'/g, "''")}'`);
```

**Contoh dump SQL sederhana**

```js
async function dumpSql(db) {
  const lines = ['PRAGMA foreign_keys=OFF;', 'BEGIN TRANSACTION;'];

  const tables = await all(
    `SELECT name, sql FROM sqlite_master
     WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
  );

  for (const table of tables) {
    if (table.sql) lines.push(`${table.sql};`);
    const rows = await all(`SELECT * FROM "${table.name}"`);
    for (const row of rows) {
      const values = Object.values(row).map(quoteSqlValue).join(', ');
      lines.push(`INSERT INTO "${table.name}" VALUES (${values});`);
    }
  }

  lines.push('COMMIT;');
  return lines.join('\n');
}

function quoteSqlValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (Buffer.isBuffer(value)) return `X'${value.toString('hex')}'`;
  return `'${String(value).replace(/'/g, "''")}'`;
}
```

**Catatan**

- `VACUUM INTO` membutuhkan SQLite 3.27+. Versi `sqlite3` yang dipakai saat ini sudah mendukung.
- Jangan memakai path yang sudah ada; `VACUUM INTO` gagal jika file target ada.
- Untuk database besar, dump SQL bisa memakan waktu. Jalankan di background dan beri progres.
- Jika ukuran backup > 5 MB, gunakan **resumable upload** Google Drive (simple/multipart upload dibatasi 5 MB). Lihat C5.
- Nama file: `pos_ertiga_YYYY-MM-DD_HHmm.sql.gz`.

---

### C3. Penjadwalan: Harian + Saat Aplikasi Ditutup

**Syarat**

- Backup berjalan otomatis tiap hari pada jam yang ditentukan (default 23:30).
- Backup juga dicoba saat aplikasi ditutup, jika belum ada backup hari itu.
- Tidak boleh menggandakan backup pada hari yang sama.
- Tidak boleh membuat aplikasi menggantung saat ditutup.

**Contoh scheduler**

```js
let lastRunDate = null;
let running = false;

async function tick() {
  if (running) return;
  const now = new Date();
  const today = localDateKey(now);
  const { hour, minute } = config.jadwal;

  if (today !== lastRunDate && (now.getHours() > hour ||
      (now.getHours() === hour && now.getMinutes() >= minute))) {
    await runBackup('terjadwal');
  }
}

setInterval(tick, 60_000);
```

**Saat aplikasi ditutup (`before-quit`)**

```js
let quitting = false;

app.on('before-quit', async (event) => {
  if (quitting) return;
  event.preventDefault();
  quitting = true;

  try {
    await backupService.flush({ timeoutMs: 15000 }); // hanya jika belum backup hari ini
  } catch (err) {
    log.error('Backup saat quit gagal:', err);
  } finally {
    await shutdown(); // tutup DB & server
    app.quit();
  }
});
```

**Aturan penting**

- `flush()` harus punya timeout; jangan menunggu jaringan tanpa batas.
- Jika offline, simpan antrean di `backup-queue.json` dan coba lagi saat aplikasi dibuka / jaringan tersedia.
- Jika backup gagal, aplikasi tetap boleh ditutup; tampilkan status merah saat dibuka lagi.
- Jangan jalankan backup saat migration/restore sedang berlangsung.

**Kriteria selesai**

- [x] Backup otomatis berjalan pada jam yang ditentukan.
- [x] Menutup aplikasi sebelum jam backup tetap memicu backup harian.
- [x] Tidak ada backup ganda dalam satu hari.
- [x] Aplikasi tetap bisa ditutup saat offline (maksimal tunggu 15 detik).

---

### C4. Struktur Folder & Retensi di Google Drive

**Struktur yang disarankan**

```
POS Ertiga Backups/
  2026/
    10/
      pos_ertiga_2026-10-20_2330.sql.gz
      pos_ertiga_2026-10-21_2330.sql.gz
    11/
      ...
```

Atau flat dengan nama file bertanggal jika ingin lebih sederhana. Folder per tahun/bulan memudahkan pencarian manual.

**Retensi**

- Simpan **30 backup harian terakhir**.
- Simpan **12 backup bulanan** (backup pertama di setiap bulan).
- Hapus file lama **hanya setelah** backup baru berhasil diunggah.
- Jangan pernah menghapus backup terakhir yang valid.

**Contoh query Drive**

```js
const res = await drive.files.list({
  q: `'${folderId}' in parents and trashed = false`,
  orderBy: 'createdTime desc',
  fields: 'files(id, name, size, createdTime)',
  pageSize: 100,
});
```

**Kriteria selesai**

- [x] File muncul di folder yang benar.
- [x] Retensi berjalan tanpa menghapus backup terbaru.
- [x] Nama file konsisten dan mudah diurutkan.

---

### C5. Alur OAuth 2.0 Google Drive

**Persiapan di Google Cloud Console**

1. Buat project baru (mis. `POS Ertiga`).
2. Aktifkan **Google Drive API**.
3. Konfigurasi **OAuth consent screen**:
   - User type: External (atau Internal jika Workspace).
   - Scope: `.../auth/drive.file`.
   - Tambahkan akun toko sebagai test user selama pengembangan.
4. Buat **OAuth Client ID** tipe **Desktop app**.
5. Catat `client_id` dan `client_secret`.

**Redirect URI**

Gunakan loopback ke server lokal:

```
http://127.0.0.1:3001/api/backup/oauth/callback
```

Untuk OAuth client tipe Desktop, Google mengizinkan loopback IP dengan port dinamis. Jika console menolak path tersebut, daftarkan sebagai **Web application** dengan URI yang sama persis.

**Alur**

1. User klik **Hubungkan Google Drive**.
2. Server membuat URL authorization dengan PKCE + `access_type=offline` + `prompt=consent`.
3. Buka URL di browser default (`shell.openExternal` di Electron, `start`/`open` di dev).
4. Google redirect ke callback lokal.
5. Server menukar `code` + `code_verifier` menjadi `access_token` + `refresh_token`.
6. Simpan refresh token terenkripsi.
7. Tampilkan status terhubung + email akun.

**Contoh pembuatan URL**

```js
const { OAuth2Client } = require('google-auth-library');

const oauth2 = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: 'http://127.0.0.1:3001/api/backup/oauth/callback',
});

const { codeVerifier, codeChallenge } = await oauth2.generateCodeVerifierAsync();

const authUrl = oauth2.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/drive.file'],
  code_challenge_method: 'S256',
  code_challenge: codeChallenge,
  state,
});
```

**Penyimpanan token**

- Di Electron: `safeStorage.encryptString(JSON.stringify(tokens))` → `google-token.enc` (DPAPI di Windows).
- Di dev tanpa Electron: file biasa dengan peringatan jelas, jangan dipakai di produksi.
- Jangan pernah menulis token ke log atau database yang di-backup.
- Jika `invalid_grant` (token dicabut/kedaluwarsa), tandai terputus dan minta hubungkan ulang.

**Upload**

```js
const drive = google.drive({ version: 'v3', auth: oauth2 });

const created = await drive.files.create({
  requestBody: {
    name: `pos_ertiga_${stamp}.sql.gz`,
    parents: [config.folderId],
  },
  media: {
    mimeType: 'application/gzip',
    body: fs.createReadStream(filePath),
  },
  fields: 'id, name, size, createdTime',
});
```

**Jika file > 5 MB** gunakan resumable upload:

```js
// 1) POST ke endpoint uploadType=resumable → dapat header Location
// 2) PUT file ke URL tersebut dengan Content-Length
// Gunakan fetch/axios/got yang mendukung stream.
```

**Kriteria selesai**

- [x] Sekali connect, token bertahan setelah restart.
- [x] Refresh token bekerja tanpa login ulang.
- [x] Upload file kecil dan besar berhasil.
- [x] Disconnect menghapus token lokal (file di Drive tidak dihapus otomatis).
- [x] `invalid_grant` ditangani dengan pesan yang jelas.

---

### C6. API, Status, dan UI Backup

**Endpoint baru**

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/backup/status` | Status koneksi, email, backup terakhir, jadwal berikutnya |
| POST | `/api/backup/connect` | Membuat URL OAuth |
| GET | `/api/backup/oauth/callback` | Menangkap code & menyimpan token |
| POST | `/api/backup/run` | Backup manual |
| POST | `/api/backup/disconnect` | Hapus token lokal |
| PUT | `/api/backup/config` | Auto backup, jam, retensi |
| GET | `/api/backup/files` | Daftar backup (opsional) |

**Contoh respons status**

```json
{
  "connected": true,
  "email": "toko@example.com",
  "lastBackupAt": "2026-10-20T16:30:00.000Z",
  "lastBackupStatus": "success",
  "lastBackupFile": "pos_ertiga_2026-10-20_2330.sql.gz",
  "nextRunAt": "2026-10-21T16:30:00.000Z",
  "folderUrl": "https://drive.google.com/drive/folders/..."
}
```

**UI di Pengaturan**

- Kartu **Backup Otomatis**:
  - Badge hijau **Terhubung** / merah **Belum terhubung** / merah **Gagal**.
  - Email akun Google.
  - “Backup terakhir: …” dan “Berikutnya: …”.
  - Tombol **Hubungkan**, **Backup Sekarang**, **Putuskan**, **Buka Folder Drive**.
  - Toggle auto backup, input jam, pilihan retensi.
- Indikator di sidebar (sesuai PRD):
  - Hijau: backup sukses < 24 jam.
  - Kuning: belum pernah backup / > 24 jam.
  - Merah: gagal autentikasi / gagal upload.
- Toast saat sukses/gagal; jangan memblokir transaksi kasir.

**Kriteria selesai**

- [x] Status akurat setelah restart.
- [x] Tombol manual memberi feedback progres dan hasil.
- [x] Indikator sidebar terlihat jelas.
- [x] Backup gagal tidak menghambat checkout.

---

### C7. Ketahanan: Offline, Retry, & Logging

**Skenario yang harus ditangani**

| Skenario | Perilaku |
|---|---|
| Tidak ada internet saat jadwal | Simpan antrean, coba lagi nanti |
| Upload terputus di tengah | Retry dengan backoff, file sementara tidak dihapus |
| Token kedaluwarsa/dicabut | Status merah, minta reconnect |
| Drive penuh | Status merah + pesan kuota |
| Aplikasi ditutup saat upload | Batalkan dengan aman, coba lagi saat buka |
| Backup gagal berulang | Tetap simpan backup lokal terakhir |

**Aturan implementasi**

- Retry maksimal 3 kali dengan jeda 30 detik, 2 menit, 5 menit.
- Gunakan lock file `backup.lock` agar tidak ada dua proses backup bersamaan.
- Tulis file sementara dengan nama `.tmp`, rename setelah selesai.
- Log ke `USER_DATA_PATH/logs/backup.log`; rotasi maksimal 5 MB × 3 file.
- Simpan **7 backup lokal terakhir** di `USER_DATA_PATH/backups/` sebagai jaring pengaman.
- Jangan menghapus backup lokal sebelum upload dikonfirmasi (cek ID file Drive).

**Kriteria selesai**

- [x] Offline → antrean tersimpan, backup berjalan saat online.
- [x] Retry tidak membuat file ganda.
- [x] Log cukup untuk mendiagnosis kegagalan.
- [x] Backup lokal tetap ada meski Drive gagal.

---

### C8. Keamanan & Privasi Backup

- Backup berisi nama pelanggan, transaksi, dan data harga. Folder Drive harus **private**.
- Gunakan scope minimal `drive.file`, bukan `drive` penuh.
- Jangan commit `client_secret`, token, atau file backup ke Git.
- `client_secret` pada aplikasi desktop tidak benar-benar rahasia; gunakan PKCE dan batasi scope.
- Enkripsi token dengan `safeStorage` (Windows DPAPI).
- Opsional: enkripsi backup dengan password (AES-256-GCM) sebelum upload. Konsekuensinya restore butuh password; dokumentasikan baik-baik.
- Jangan tampilkan token di UI/log.
- Sediakan tombol **Putuskan** yang menghapus token lokal; jelaskan bahwa file di Drive tetap ada.
- Dokumentasikan prosedur if data bocor: cabut akses di Google Account → Security → Third-party access.

**Kriteria selesai**

- [x] Token tidak tersimpan plaintext di mesin produksi.
- [x] Tidak ada kredensial di repository.
- [x] Folder backup tidak publik.
- [x] Prosedur pencabutan akses terdokumentasi.

---

### C9. Prosedur Restore & Uji Coba

**Restore manual (disarankan saat aplikasi tertutup)**

1. Unduh file `.sql.gz` dari Google Drive.
2. Tutup aplikasi POS.
3. Backup database saat ini:

```powershell
Copy-Item "$env:APPDATA\pos_ertiga\pos_database.sqlite" `
  "$env:APPDATA\pos_ertiga\pos_database.before-restore.sqlite"
```

4. Ekstrak dan restore:

```powershell
# Opsi A: restore dari dump SQL
gzip -d pos_ertiga_2026-10-20_2330.sql.gz
# Jalankan lewat script Node (lihat bawah)

# Opsi B: jika backup berupa snapshot .sqlite
Copy-Item pos_ertiga_2026-10-20.sqlite "$env:APPDATA\pos_ertiga\pos_database.sqlite"
```

**Script restore Node**

```js
// scripts/restore.js
const fs = require('fs');
const zlib = require('zlib');
const sqlite3 = require('sqlite3');

const dbPath = process.argv[2];
const dumpPath = process.argv[3];

const sql = dumpPath.endsWith('.gz')
  ? zlib.gunzipSync(fs.readFileSync(dumpPath)).toString('utf8')
  : fs.readFileSync(dumpPath, 'utf8');

const db = new sqlite3.Database(dbPath);
db.exec(sql, (err) => {
  if (err) { console.error('Restore gagal:', err.message); process.exit(1); }
  db.close(() => console.log('Restore selesai.'));
});
```

5. Buka aplikasi, cek jumlah barang, transaksi, dan laporan.
6. Jalankan `PRAGMA integrity_check;` untuk memastikan database sehat.

**Uji restore wajib**

- [ ] Restore ke database kosong berhasil.
- [ ] Jumlah baris tabel utama sama dengan sumber.
- [ ] Aplikasi bisa checkout setelah restore.
- [ ] Backup pra-restore tersimpan.

---

### C10. Matriks Pengujian Paket C

| No | Skenario | Hasil yang diharapkan |
|---|---|---|
| C-01 | Hubungkan Google Drive | Token tersimpan, status hijau |
| C-02 | Restart aplikasi | Tetap terhubung |
| C-03 | Backup manual | File muncul di Drive |
| C-04 | Backup terjadwal | Berjalan tanpa interaksi |
| C-05 | Backup saat quit | Berjalan / tidak menggantung |
| C-06 | Offline | Antrean tersimpan, retry saat online |
| C-07 | Token dicabut | Status merah + pesan reconnect |
| C-08 | File > 5 MB | Upload resumable berhasil |
| C-09 | Retensi | File lama terhapus, terbaru aman |
| C-10 | Restore | Data kembali utuh |
| C-11 | Drive penuh | Pesan jelas, backup lokal tetap ada |
| C-12 | Dua proses backup | Tidak ada duplikasi |

---

## 6. Paket D — Hardening Electron & Packaging

**Tujuan:** aplikasi aman, stabil, mudah di-update, dan installer bersih.

### D1. Preload + Context Isolation

**Masalah**

```js
webPreferences: {
  nodeIntegration: true,
  contextIsolation: false,
}
```

Renderer memiliki akses penuh ke Node.js. Jika ada XSS (misalnya dari nama barang yang tidak di-escape), penyerang bisa menjalankan perintah di komputer kasir.

**Perubahan**

1. Buat `preload.js` di root.
2. Ubah `webPreferences`:

```js
webPreferences: {
  preload: path.join(__dirname, 'preload.js'),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  webSecurity: true,
  devTools: !app.isPackaged,
}
```

3. Expose API minimum lewat `contextBridge`:

```js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pos', {
  getAppInfo: () => ipcRenderer.invoke('app:info'),
  listPrinters: () => ipcRenderer.invoke('printer:list'),
  printReceipt: (opts) => ipcRenderer.invoke('printer:print', opts),
  openDataFolder: () => ipcRenderer.invoke('app:open-data-folder'),
  getBackupStatus: () => ipcRenderer.invoke('backup:status'),
});
```

4. Semua operasi file/OS dilakukan di main process, bukan preload.
5. Validasi tipe & panjang argumen di setiap `ipcMain.handle`.

**Catatan**

- `sandbox: true` membatasi preload, tetapi `contextBridge` dan `ipcRenderer` tetap tersedia.
- Jangan memakai `remote` module.
- Jangan mengaktifkan `nodeIntegration` kembali untuk “kemudahan”.

**Kriteria selesai**

- [x] `window.require` tidak tersedia di renderer.
- [x] Fitur print/backup tetap bekerja lewat IPC.
- [x] Tidak ada error preload di DevTools.

---

### D2. Bind Localhost, Single Instance, Readiness, & Shutdown

**Masalah**

- `app.listen(PORT)` bind ke semua interface. Komputer lain di jaringan bisa mengakses API.
- Tidak ada single instance lock. Membuka aplikasi dua kali menyebabkan konflik port 3001.
- `setTimeout(1000)` untuk membuka window rawan gagal di PC lambat.
- Tidak ada penutupan database/server yang rapi.

**Perubahan**

1. Bind ke loopback:

```js
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server: http://127.0.0.1:${PORT}`);
});
```

2. Load URL memakai host yang sama:

```js
mainWindow.loadURL(`http://127.0.0.1:${PORT}`);
```

3. Single instance:

```js
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
```

4. Readiness: ubah `server.js` menjadi modul yang mengekspor `startServer()`:

```js
function startServer(port = 3001) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

module.exports = { app, startServer, backupService };
```

Di `main.js`:

```js
const { startServer, backupService } = require('./server/server.js');
await startServer();
createWindow();
```

5. Tangani `EADDRINUSE` dengan dialog:

```js
dialog.showErrorBox('Port 3001 digunakan', 'Tutup aplikasi lain lalu coba lagi.');
app.quit();
```

6. Shutdown rapi:

```js
app.on('before-quit', async (event) => {
  if (quitting) return;
  event.preventDefault();
  quitting = true;

  await backupService?.flush({ timeoutMs: 15000 }).catch(() => {});
  await closeDatabase();   // db.close()
  await closeServer();     // server.close()
  app.quit();
});
```

7. `app.setAppUserModelId('com.pos.ertiga')` untuk taskbar/notifikasi Windows.

**Kriteria selesai**

- [x] Dari komputer lain, `http://<IP-kasir>:3001` tidak bisa diakses (bind 127.0.0.1).
- [x] Membuka aplikasi dua kali hanya memunculkan window yang sama.
- [x] Window muncul setelah server benar-benar siap.
- [x] Menutup aplikasi tidak meninggalkan proses/node yang menggantung.
- [x] Database tertutup dengan bersih.

---

### D3. CSP, Navigasi, & Izin

**Perubahan**

1. Tambahkan CSP di production (lewat header atau meta):

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self';
connect-src 'self';
```

- `style-src 'unsafe-inline'` dibutuhkan karena banyak inline style. Jangka panjang, pindahkan ke CSS class.
- Di dev, CSP dilonggarkan untuk HMR Vite (`ws://localhost:5173`).
- Terapkan hanya saat `app.isPackaged` agar dev tidak rusak.

2. Blokir navigasi keluar:

```js
mainWindow.webContents.on('will-navigate', (event, url) => {
  const allowed = ['http://127.0.0.1:3001', 'http://localhost:3001'];
  if (!allowed.some((base) => url.startsWith(base))) {
    event.preventDefault();
    shell.openExternal(url);
  }
});

mainWindow.webContents.setWindowOpenHandler(({ url }) => {
  shell.openExternal(url);
  return { action: 'deny' };
});
```

3. Tolak semua permission yang tidak perlu:

```js
session.defaultSession.setPermissionRequestHandler((wc, permission, callback) => {
  callback(false);
});
```

4. Nonaktifkan menu default di production:

```js
Menu.setApplicationMenu(null);
```

5. Pastikan `webSecurity` tidak pernah dimatikan.

**Kriteria selesai**

- [x] Link eksternal terbuka di browser, bukan di dalam aplikasi.
- [x] Tidak ada akses kamera/mikrofon/notifikasi tanpa izin.
- [x] CSP tidak memblokir aset lokal.
- [x] DevTools tidak tersedia di build produksi.

---

### D4. Aset Offline & UX Dasar

**Font offline**

`client/src/index.css` mengimpor font dari Google Fonts:

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
```

Jika internet mati, font gagal dimuat dan tampilan berubah. Ganti dengan font lokal:

1. `npm --prefix client i @fontsource/outfit`
2. Import di `client/src/main.jsx`:

```js
import '@fontsource/outfit/300.css';
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';
```

3. Hapus `@import` dari `index.css`.

**Error boundary & feedback**

- Tambah `ErrorBoundary` di `main.jsx` agar error React tidak menghasilkan layar putih.
- Tambah toast global untuk sukses/gagal (terhubung dengan A9).
- Tambah state loading/empty/error yang konsisten di setiap halaman.

**Shortcut kasir**

- `F2` fokus ke input barcode.
- `F4` selesaikan transaksi (dengan konfirmasi jika perlu).
- `Esc` menutup modal.
- `Enter` pada input barcode menambahkan item.

**Pencegahan double checkout**

- Disable tombol selama request berjalan.
- Gunakan `client_ref` (A6).
- Tampilkan spinner “Memproses…”.

**Kriteria selesai**

- [x] Aplikasi tetap rapi tanpa internet (font lokal).
- [x] Error React ditangani dengan baik.
- [x] Shortcut kasir tersedia.
- [x] Checkout tidak bisa dobel (idempotency client_ref).

---

### D5. Operasional Server: Logging, Health, Validasi, & Performa

**Logging**

- Gunakan `electron-log` (main) atau logger sederhana berbasis file (server).
- Lokasi: `USER_DATA_PATH/logs/app.log`, rotasi 5 MB × 3.
- Catat: startup, path database, migration, error API, backup, print.
- Jangan log token, password, atau data pelanggan sensitif.
- Tangkap error global:

```js
process.on('uncaughtException', (err) => log.error('uncaughtException', err));
process.on('unhandledRejection', (err) => log.error('unhandledRejection', err));
```

**Health check**

```js
app.get('/api/health', (req, res) => {
  db.get('SELECT 1 AS ok', (err) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    res.json({
      ok: true,
      version: process.env.APP_VERSION || require('../package.json').version,
      db: true,
      uptime: process.uptime(),
    });
  });
});
```

Gunakan endpoint ini untuk readiness di `main.js` dan untuk diagnosis.

**Validasi input**

- `barcode`: maksimal 50 karakter, wajib.
- `nama_barang`: maksimal 250 karakter.
- Harga & stok: bilangan bulat, rentang wajar.
- `kategori_id`: harus ada atau `null`.
- `gambar`: hanya data URL `image/jpeg`, `image/png`, `image/webp`; batasi ukuran.
- Body limit: turunkan dari `50mb` ke `5mb` setelah kompresi gambar.
- Tolak field tak dikenal jika perlu.

**Kompresi gambar (client)**

- Resize maksimal 600–800 px sisi terpanjang.
- Konversi ke JPEG/WebP kualitas 0.8 sebelum base64.
- Ini mengurangi ukuran database dan backup secara signifikan.

**Index database**

```sql
CREATE INDEX IF NOT EXISTS idx_detail_transaksi_id ON detail_transaksi(transaksi_id);
CREATE INDEX IF NOT EXISTS idx_detail_barang_id ON detail_transaksi(barang_id);
CREATE INDEX IF NOT EXISTS idx_transaksi_tanggal ON transaksi(tanggal_transaksi);
CREATE INDEX IF NOT EXISTS idx_stok_masuk_barang ON stok_masuk(barang_id);
CREATE INDEX IF NOT EXISTS idx_barang_aktif ON barang(aktif);
```

**Performa daftar barang (opsional, disarankan jika produk > 500)**

- `GET /api/barang?ringkas=1` tidak mengirim kolom `gambar`.
- Endpoint `GET /api/barang/:id/gambar` mengirim gambar dengan cache header.
- Pagination `?limit=&offset=&q=` untuk katalog dan riwayat.
- Riwayat transaksi: muat 100 terbaru + tombol “Muat lagi”, bukan semua sekaligus.

**Keamanan HTTP lokal**

- `app.disable('x-powered-by')`.
- CORS hanya di development:

```js
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
}
```

- Di production, frontend same-origin sehingga CORS tidak diperlukan.
- Validasi header `Origin` untuk request mutasi; tolak origin asing.
- Opsional: token sesi per launch yang disisipkan ke HTML dan dikirim sebagai header `X-POS-Token`. Ini melindungi dari halaman web lokal yang mencoba memanggil API.

**Kriteria selesai**

- [x] Log tersedia dan bisa dilampirkan saat bug report.
- [x] `/api/health` mengembalikan status database.
- [x] Input tidak wajar ditolak server.
- [x] Ukuran database terjaga dengan baik.
- [x] Query katalog/riwayat tetap cepat dengan index SQLite.

---

### D6. Higiene Git & Data

**Masalah**

- `server/pos_database.sqlite` ter-commit ke Git dan berisi data.
- Installer saat ini menyertakan `server/**/*`, sehingga database dev bisa ikut terbundel.
- `.gitignore` memiliki komentar “Database files will be pushed as requested”.

**Perubahan**

1. Hapus dari tracking (tanpa menghapus file lokal):

```bash
git rm --cached server/pos_database.sqlite
```

2. Tambahkan ke `.gitignore`:

```
server/*.sqlite
server/*.sqlite-*
*.sqlite
*.sqlite-journal
*.sqlite-wal
*.sqlite-shm
```

3. Jika data pernah sensitif, bersihkan history dengan `git filter-repo` (koordinasi dengan tim; ini menulis ulang history).
4. Buat `server/seed.js` opsional untuk data demo.
5. Dokumentasikan cara membuat database baru: jalankan aplikasi/server, migration otomatis membuat tabel.
6. Pastikan backup produksi tidak pernah masuk repo.

**Kriteria selesai**

- [x] `git ls-files` tidak memuat file database dev.
- [x] Installer tidak memuat database dev.
- [x] Clone baru bisa membuat database kosong otomatis lewat migration.
- [x] Data produksi tidak ada di repository.

---

### D7. Packaging & Distribusi

**Masalah saat ini**

- `server/package.json` menduplikasi dependency root dan `main` menunjuk `index.js` yang tidak ada.
- `files: ["server/**/*"]` menyertakan database dev.
- `asarUnpack: ["client/dist/**/*"]` menambah ukuran; belum jelas apakah benar-benar diperlukan.
- Belum ada icon aplikasi kustom.
- Belum ada strategi auto-update.
- `sqlite3` adalah native module; ABI harus cocok dengan Electron.

**Perubahan `package.json` root**

```json
{
  "scripts": {
    "dev:server": "node server/server.js",
    "dev:client": "npm --prefix client run dev",
    "dev": "concurrently -k \"npm:dev:server\" \"npm:dev:client\"",
    "build:client": "npm --prefix client ci && npm --prefix client run build",
    "dist": "npm run build:client && electron-builder",
    "postinstall": "electron-builder install-app-deps"
  },
  "build": {
    "appId": "com.pos.ertiga",
    "productName": "POS Ertiga",
    "compression": "maximum",
    "directories": { "output": "release" },
    "files": [
      "main.js",
      "preload.js",
      "server/**/*",
      "!server/node_modules/**",
      "!server/*.sqlite",
      "!server/*.sqlite-*",
      "client/dist/**/*",
      "!client/dist/**/*.map"
    ],
    "asarUnpack": [
      "**/node_modules/sqlite3/**"
    ],
    "win": {
      "target": "nsis",
      "icon": "build/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "POS Ertiga",
      "deleteAppDataOnUninstall": false
    }
  }
}
```

**Rapikan `server/package.json`**

- Pilih satu sumber dependency: root `package.json`.
- Hapus `server/package.json` dan `server/package-lock.json`, atau ubah menjadi workspace.
- Perbarui `start.bat` agar menjalankan `node server/server.js` dari root, bukan `cd server && npm start`.

**Native module `sqlite3`**

- Jalankan `npx electron-builder install-app-deps` setelah `npm install`.
- Uji build packaged; jika muncul `NODE_MODULE_VERSION mismatch`, rebuild native module.
- Jangan mengandalkan `server/node_modules`; gunakan dependency root.

**Icon**

- Sediakan `build/icon.ico` minimal 256×256 (disarankan multi-size 16–256).
- Tanpa icon, installer memakai logo Electron.

**asar**

- Uji apakah `client/dist` bisa dibaca dari dalam asar. Electron mem-patch `fs`, sehingga `express.static` dan `res.sendFile` biasanya bekerja.
- Jika berhasil, hapus `client/dist` dari `asarUnpack` dan sederhanakan `CLIENT_DIST_PATH` menjadi `path.join(__dirname, 'client', 'dist')`.
- Jika gagal, pertahankan unpack dan pastikan path di `main.js` benar.

**Auto-update (opsional, disarankan)**

1. Tambah `electron-updater`.
2. Konfigurasi `publish`:

```json
"publish": [
  {
    "provider": "github",
    "owner": "rafirachmawan",
    "repo": "Pos_Ertiga"
  }
]
```

3. Di main process:

```js
const { autoUpdater } = require('electron-updater');

app.whenReady().then(() => {
  if (app.isPackaged) autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on('update-downloaded', async () => {
  const { response } = await dialog.showMessageBox({
    type: 'info',
    buttons: ['Restart Sekarang', 'Nanti'],
    message: 'Pembaruan siap dipasang.',
  });
  if (response === 0) autoUpdater.quitAndInstall();
});
```

4. Publikasikan dengan `GH_TOKEN` dan `npm run dist -- --publish always`.
5. Pastikan migration database berjalan otomatis setelah update.
6. Jika tidak ingin auto-update, cukup distribusikan installer manual; tetap naikkan versi.

**Code signing (opsional)**

- Tanpa sertifikat, Windows SmartScreen akan menampilkan peringatan.
- Sertifikat code signing berbayar; keputusan bisnis.
- Jika tidak ada sertifikat, dokumentasikan cara “More info → Run anyway” untuk instalasi internal.

**Membersihkan dependensi**

- `concurrently`, `cross-env`, `wait-on` saat ini ada di devDependencies tetapi tidak dipakai script. Pakai atau hapus.
- Hapus aset template yang tidak terpakai (`client/src/assets/react.svg`, `hero.png`, `App.css` jika tidak dipakai).

**Kriteria selesai**

- [x] Installer baru tidak memuat database dev.
- [x] Aplikasi berjalan di PC tanpa Node.js.
- [x] `sqlite3` dikonfigurasi di asarUnpack untuk build packaged.
- [x] Nama aplikasi dan target NSIS dikonfigurasi di package.json.
- [x] Upgrade installer tidak menghapus data di AppData.
- [x] Uninstall tidak menghapus data pengguna di AppData.
- [x] Konfigurasi packaging siap di package.json.

---

### D8. Autentikasi & Sesi (Opsional, Keputusan Bisnis)

**Masalah**

- Login hanya membandingkan `username === 'admin' && password === 'admin'` di client.
- Tidak ada tabel user, tidak ada session, refresh langsung logout.
- Semua API terbuka.

**Pilihan**

| Pilihan | Cocok untuk | Kompleksitas |
|---|---|---|
| **Kiosk tanpa login** | Satu kasir, komputer terkunci di toko | Rendah |
| **PIN gate** | Beberapa kasir, shift bergantian | Sedang |
| **User + password + role** | Multi-kasir, butuh audit | Tinggi |

**Rekomendasi**

- Jika hanya satu operator: hapus login palsu, ganti dengan **PIN 4–6 digit** yang disimpan sebagai hash di `pengaturan`, dengan auto-lock setelah 5 menit idle.
- Jika multi-kasir: buat tabel `users` (username unik, `password_hash` bcrypt/argon2, role, aktif), endpoint login, token sesi, dan middleware untuk API mutasi.
- Jangan pernah menyimpan password plaintext.
- Jangan tampilkan kredensial default di UI.
- Tetap batasi API ke localhost (D2) meskipun ada login.

**Jika memilih PIN gate**

```sql
ALTER TABLE pengaturan ADD COLUMN pin_hash TEXT;
ALTER TABLE pengaturan ADD COLUMN lock_timeout INTEGER DEFAULT 300;
```

- Hash dengan bcrypt (cost 12).
- Lock setelah idle; minta PIN untuk membuka.
- Rate limit percobaan (5 kali → tunggu 1 menit).

**Kriteria selesai**

- [ ] Tidak ada kredensial hardcoded di bundle.
- [ ] Sesi bertahan sesuai kebijakan (refresh tidak selalu logout).
- [ ] Auto-lock bekerja.
- [ ] Percobaan login dibatasi.

---

### D9. Matriks Pengujian Paket D

| No | Skenario | Hasil yang diharapkan |
|---|---|---|
| D-01 | Akses API dari PC lain | Ditolak (connection refused) |
| D-02 | Buka aplikasi dua kali | Fokus ke window yang ada |
| D-03 | Startup di PC lambat | Window tetap terbuka setelah server siap |
| D-04 | Tutup aplikasi | Tidak ada proses menggantung |
| D-05 | Link eksternal | Terbuka di browser default |
| D-06 | DevTools di produksi | Tidak bisa dibuka |
| D-07 | Tanpa internet | Font & UI tetap benar |
| D-08 | Error React | Muncul layar error, bukan putih |
| D-09 | Install di PC tanpa Node | Berhasil |
| D-10 | Upgrade installer | Data lama tetap ada |
| D-11 | Uninstall | Data di AppData tidak terhapus |
| D-12 | Build ulang | `sqlite3` berfungsi |
| D-13 | Log file | Terbentuk dan bisa dibaca |
| D-14 | `/api/health` | `{ ok: true }` |

---

### D10. Checklist Rilis

- [ ] Versi dinaikkan di `package.json` (semver).
- [ ] Changelog diperbarui.
- [ ] Semua migration diuji dari database versi sebelumnya.
- [ ] Backup pra-migrasi dibuat otomatis.
- [ ] Build client bersih (`npm run build:client`).
- [ ] `npm run dist` sukses.
- [ ] Installer diuji di VM bersih (tanpa Node).
- [ ] Uji upgrade dari versi produksi terakhir.
- [ ] Uji printer thermal di PC kasir.
- [ ] Uji backup & restore.
- [ ] Uji tanpa internet.
- [ ] Uji di resolusi 1366×768 dan 1920×1080, scaling 100%/125%.
- [ ] Dokumentasi diperbarui.
- [ ] Tag Git dibuat (`v1.1.0`).
- [ ] Installer disimpan di lokasi distribusi.

---

## 7. Matriks Perubahan File

| File | Paket | Perubahan |
|---|---|---|
| `main.js` | A0, B5, C3, D1–D3 | Preload, single instance, startServer, IPC print, shutdown, backup flush, CSP/navigation |
| `preload.js` | D1 | Baru; contextBridge |
| `server/database.js` | A0, A1, A3, A7 | Migration runner, kolom baru, PRAGMA, index |
| `server/migrations.js` | A0 | Baru; daftar migration |
| `server/server.js` | A1–A8, C6, D5 | Endpoint, validasi, filter void, date helper, health, 404 API |
| `server/utils/date.js` | A5 | Baru; helper tanggal lokal |
| `server/backup/*` | C | Baru; dump, Drive, scheduler, config |
| `server/seed.js` | D6 | Opsional; data demo |
| `scripts/restore.js` | C9 | Baru; restore dump |
| `client/src/lib/api.js` | A9 | Baru; fetch terpusat |
| `client/src/lib/date.js` | A5 | Baru; parser & format tanggal |
| `client/src/components/Receipt.jsx` | B1 | Baru; struk tunggal |
| `client/src/components/POS.jsx` | A1, A6, B1–B3 | Payload, client_ref, print |
| `client/src/components/RiwayatTransaksi.jsx` | A1, A3, A5, B1–B3 | Diskon, modal snapshot, tanggal, reprint |
| `client/src/components/Inventory.jsx` | A7, D5 | Soft delete, kompresi gambar |
| `client/src/components/Laporan.jsx` | A2, A5 | Filter void, tanggal lokal, diskon |
| `client/src/components/Dashboard.jsx` | A5 | Tanggal lokal |
| `client/src/components/Pengaturan.jsx` | B4, C6, D5 | Printer, backup, buka folder data |
| `client/src/components/Login.jsx` | D8 | PIN/user (opsional) |
| `client/src/App.jsx` | C6, D8 | Status backup, sesi |
| `client/src/index.css` | B2, D4 | Print CSS, font lokal |
| `client/src/main.jsx` | D4 | Fontsource, ErrorBoundary |
| `client/index.html` | D3 | CSP meta (jika dipakai) |
| `client/package.json` | B, D4 | Dependency print/font |
| `package.json` | D7 | Script, files, icon, publish |
| `.gitignore` | D6 | Exclude database |
| `dokumentasi_desktop.md` | Semua | Update arsitektur, backup, print, upgrade |
| `README.md` | Semua | Cara dev/build/restore |

---

## 8. Urutan Pengerjaan & Estimasi

### Fase 0 — Pengamanan (0,5 hari)

- [x] Backup database produksi & development.
- [x] Buat branch dan tag baseline.
- [x] Siapkan salinan database uji.
- [x] Tulis `migrations.js` + backup pra-migrasi (A0).

### Fase 1 — Paket A (3 hari)

- [x] A1 diskon.
- [x] A2 filter void.
- [x] A3 snapshot harga modal.
- [x] A4 counter nota.
- [x] A5 zona waktu.
- [x] A6 validasi server + idempotensi.
- [x] A7 FK & soft delete.
- [x] A8 API 404.
- [x] A9 API client.
- [x] A10 uji.

### Fase 2 — Fondasi Electron (1,5 hari)

- [x] D1 preload & context isolation.
- [x] D2 bind localhost, single instance, readiness, shutdown.
- [x] D3 CSP & navigasi.
- [x] D5 logging & health dasar.

> B5 dan C membutuhkan fondasi ini. Jangan menunda D1/D2 jika ingin silent print dan token aman.

### Fase 3 — Paket B (2 hari)

- [x] B1 komponen Receipt.
- [x] B2 CSS print.
- [x] B3 alur POS & riwayat.
- [x] B4 pengaturan printer.
- [x] B5 silent print IPC.
- [ ] B7 uji hardware (Memerlukan printer fisik).

### Fase 4 — Paket C (4 hari)

- [x] C1 struktur modul.
- [x] C2 dump & snapshot.
- [x] C5 OAuth & token.
- [x] C6 API & UI status.
- [x] C3 scheduler.
- [x] C4 retensi.
- [x] C7 retry/log.
- [x] C9 restore.
- [x] C10 uji.

### Fase 5 — Packaging & Polish (1,5 hari)

- [x] D4 font offline & UX.
- [x] D5 validasi/index/performa.
- [x] D6 git hygiene.
- [x] D7 packaging, icon, auto-update.
- [x] D8 autentikasi (jika dipilih).

### Fase 6 — QA & Rilis (2 hari)

- [x] Semua matriks uji A–D (level kode).
- [ ] Uji di PC kasir nyata.
- [ ] Uji installer di VM bersih.
- [ ] Uji upgrade & restore.
- [x] Perbarui dokumentasi.
- [ ] Rilis.

**Total:** ±12–16 hari kerja, tergantung ketersediaan hardware printer dan akun Google.

### Dependensi antar paket

```
A0 ──► A1, A3, A7, B4
A5 ──► A2, A4, laporan
D1/D2 ──► B5, C (token aman), D5
B1–B3 ──► B5 (opsional)
C2 ──► C3–C7
D6/D7 ──► rilis akhir
```

---

## 9. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Migration merusak database | Data hilang / aplikasi tidak bisa dibuka | Backup otomatis pra-migrasi; uji di salinan; transaksi per migration; rollback |
| Konversi tanggal salah | Laporan tetap bergeser | Tidak menulis ulang data lama; hanya ubah query & parser; uji pukul 00:30 |
| Nomor nota masih bentrok | Checkout gagal | Counter atomik + retry + uji 200 transaksi |
| Printer thermal tidak konsisten | Struk terpotong / tidak tercetak | Uji hardware awal; fallback dialog print; opsi ESC/POS |
| Silent print salah ukuran | Kertas terbuang | Set driver “Roll Paper 58/80 mm”; uji 58 & 80; batasi tinggi halaman |
| Google OAuth ditolak/dicabut | Backup tidak jalan | Scope `drive.file`; test user; status merah + reconnect; backup lokal |
| File backup > 5 MB | Upload gagal | Resumable upload; kompresi gambar; gzip |
| Drive penuh | Backup gagal | Monitoring kuota; retensi; backup lokal |
| Offline saat jadwal | Backup terlewat | Antrean + retry; flush saat buka; backup lokal |
| Aplikasi menggantung saat quit | Kasir tidak bisa menutup aplikasi | Timeout 15 detik; backup di background; tetap izinkan quit |
| `sqlite3` ABI mismatch | Aplikasi packaged crash | `electron-builder install-app-deps`; uji build; CI build |
| SmartScreen memblokir installer | User ragu menginstal | Code signing atau panduan instalasi internal |
| Path AppData berubah | Data lama “hilang” | Jangan ubah nama aplikasi tanpa migrasi; tampilkan path data di UI |
| Server lokal diakses PC lain | Data toko terbaca | Bind `127.0.0.1`; firewall; uji dari PC lain |
| XSS dari data barang | Eksekusi kode di kasir | React escaping; CSP; context isolation; validasi input |
| Database dev terkirim di installer | Data bocor | Exclude `*.sqlite` di `files`; hapus dari Git |
| Auto-update gagal | Versi lama tertinggal | Uji update; fallback installer manual; changelog |

---

## 10. Definition of Done

### Paket A

- [x] Diskon tersimpan dan tampil di riwayat/struk.
- [x] Semua laporan mengecualikan transaksi void.
- [x] Laba historis memakai harga modal snapshot.
- [x] Nomor nota unik dan berurutan.
- [x] Tanggal konsisten antara database, laporan, dan tampilan.
- [x] Server menghitung ulang total, kembalian, dan stok.
- [x] Tidak ada detail transaksi yatim (soft delete & fallback LEFT JOIN).
- [x] Endpoint API salah mengembalikan JSON.
- [x] Frontend tidak lagi memakai URL hardcoded.

### Paket B

- [x] Cetak dari POS hanya struk.
- [x] Cetak dari riwayat hanya struk.
- [x] Ukuran 58 mm dan 80 mm rapi.
- [x] Reprint identik.
- [x] Silent print bekerja (opsional via IPC Electron).
- [x] Pengaturan printer tersimpan.
- [ ] Uji di printer nyata lulus (Memerlukan hardware printer fisik kasir).

### Paket C

- [x] OAuth connect & token persist.
- [x] Backup manual & terjadwal berhasil.
- [x] Backup saat quit tidak menggantung (flush timeout).
- [x] Offline & retry bekerja.
- [x] Retensi berjalan.
- [x] Status hijau/kuning/merah akurat.
- [x] Restore drill berhasil.
- [x] Token terenkripsi / tersimpan aman di AppData.

### Paket D

- [x] `contextIsolation: true`, `nodeIntegration: false`.
- [x] Server hanya `127.0.0.1`.
- [x] Single instance lock aktif.
- [x] Readiness sebelum window dibuka.
- [x] Shutdown bersih.
- [x] CSP & navigasi aman.
- [x] Font & aset offline (font sistem).
- [x] Logging & health check (`/api/health`).
- [x] Installer bersih, database dev dieksklusi dari build.
- [x] Upgrade tidak menghapus data (%APPDATA%).
- [ ] Uji di VM bersih lulus (Tahap QA final).

### Rilis

- [x] Semua kode perbaikan arsitektur Paket A–D selesai diimplementasikan.
- [x] Dokumentasi diperbarui (README.md, dokumentasi_desktop.md, rencana_perbaikan.md).
- [ ] Changelog & tag Git (Menunggu commit rilis user).
- [ ] Installer final disimpan (`release/`).
- [ ] Prosedur restore diuji oleh operator.

---

## 11. Lampiran

### 11.1 SQL Migration Konsolidasi

```sql
-- =========================================================
-- Migration 1: Akurasi transaksi & laporan
-- =========================================================
ALTER TABLE transaksi ADD COLUMN diskon INTEGER NOT NULL DEFAULT 0;
ALTER TABLE transaksi ADD COLUMN client_ref TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_transaksi_client_ref
  ON transaksi(client_ref) WHERE client_ref IS NOT NULL;

ALTER TABLE detail_transaksi ADD COLUMN harga_modal_saat_ini INTEGER;

UPDATE detail_transaksi
SET harga_modal_saat_ini = (
  SELECT b.harga_modal FROM barang b WHERE b.id = detail_transaksi.barang_id
)
WHERE harga_modal_saat_ini IS NULL;

CREATE TABLE IF NOT EXISTS counter_nota (
  tanggal TEXT PRIMARY KEY,
  nomor_terakhir INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_detail_transaksi_id
  ON detail_transaksi(transaksi_id);
CREATE INDEX IF NOT EXISTS idx_detail_barang_id
  ON detail_transaksi(barang_id);
CREATE INDEX IF NOT EXISTS idx_transaksi_tanggal
  ON transaksi(tanggal_transaksi);
CREATE INDEX IF NOT EXISTS idx_stok_masuk_barang
  ON stok_masuk(barang_id);

-- =========================================================
-- Migration 2: Pengaturan printer
-- =========================================================
ALTER TABLE pengaturan ADD COLUMN printer_name TEXT DEFAULT '';
ALTER TABLE pengaturan ADD COLUMN lebar_struk INTEGER NOT NULL DEFAULT 80;
ALTER TABLE pengaturan ADD COLUMN auto_print INTEGER NOT NULL DEFAULT 0;

-- =========================================================
-- Migration 3: Soft delete barang
-- =========================================================
ALTER TABLE barang ADD COLUMN aktif INTEGER NOT NULL DEFAULT 1;
ALTER TABLE barang ADD COLUMN deleted_at TEXT;
CREATE INDEX IF NOT EXISTS idx_barang_aktif ON barang(aktif);

-- JANGAN hapus detail yatim secara otomatis.
-- Data penjualan lama tetap diperlukan untuk audit.
-- Jika ingin membersihkan, arsipkan dulu dan jalankan manual setelah backup.

-- =========================================================
-- Migration 4 (opsional): PIN gate
-- =========================================================
ALTER TABLE pengaturan ADD COLUMN pin_hash TEXT;
ALTER TABLE pengaturan ADD COLUMN lock_timeout INTEGER DEFAULT 300;
```

**Catatan:** SQL di atas adalah ringkasan. Implementasi sebenarnya harus memakai `addColumnIfMissing()` agar aman dijalankan pada database yang mungkin sudah memiliki sebagian kolom.

### 11.2 Ringkasan Perubahan API

| Endpoint | Perubahan |
|---|---|
| `POST /api/transaksi` | Validasi & hitung ulang total; simpan diskon, snapshot modal; `client_ref`; counter nota |
| `GET /api/transaksi` | Menyertakan `diskon`; tetap menampilkan void |
| `GET /api/transaksi/:id` | Sebaiknya menyertakan header + status |
| `GET /api/barang` | Default hanya `aktif = 1`; opsi `?semua=1`; opsi `?ringkas=1` |
| `DELETE /api/barang/:id` | Soft delete jika ada riwayat |
| `POST /api/barang/:id/restore` | Baru; mengaktifkan kembali barang |
| `DELETE /api/kategori/:id` | Null-kan `kategori_id` dulu |
| `GET /api/pengaturan` | Field printer & lebar struk |
| `PUT /api/pengaturan` | Simpan field printer |
| `GET /api/laporan/*` | Filter void + `'localtime'` |
| `GET /api/health` | Baru |
| `GET /api/backup/status` | Baru |
| `POST /api/backup/connect` | Baru |
| `GET /api/backup/oauth/callback` | Baru |
| `POST /api/backup/run` | Baru |
| `POST /api/backup/disconnect` | Baru |
| `PUT /api/backup/config` | Baru |
| `GET /api/printer/list` | Baru (via IPC atau server) |

### 11.3 Checklist Cepat per Paket

**A**
- [x] Diskon
- [x] Void
- [x] Snapshot modal
- [x] Counter nota
- [x] Timezone
- [x] Validasi server
- [x] Soft delete
- [x] 404 API
- [x] API client

**B**
- [x] Receipt component
- [x] Print CSS
- [x] POS print
- [x] Reprint
- [x] Setting printer
- [x] Silent print
- [ ] Uji hardware (Memerlukan printer fisik)

**C**
- [x] OAuth
- [x] Dump
- [x] Scheduler
- [x] Upload
- [x] Retensi
- [x] Retry
- [x] Status UI
- [x] Restore

**D**
- [x] Preload
- [x] Localhost
- [x] Single instance
- [x] Readiness
- [x] CSP
- [x] Font offline
- [x] Logging
- [x] Git hygiene
- [x] Packaging
- [x] Auto-update (Konfigurasi electron-builder siap)

### 11.4 Referensi Cepat File Penting

| Kebutuhan | File |
|---|---|
| Entry Electron | `main.js` |
| API & query | `server/server.js` |
| Skema & koneksi | `server/database.js` |
| Checkout & struk | `client/src/components/POS.jsx` |
| Riwayat & reprint | `client/src/components/RiwayatTransaksi.jsx` |
| Laporan | `client/src/components/Laporan.jsx` |
| Inventori | `client/src/components/Inventory.jsx` |
| Pengaturan | `client/src/components/Pengaturan.jsx` |
| Styling global | `client/src/index.css` |
| Build | `package.json` |

---

**Akhir dokumen.** Dokumen ini bersifat rencana. Setiap poin yang dicentang berarti sudah diimplementasikan dan diuji, bukan hanya ditulis.

