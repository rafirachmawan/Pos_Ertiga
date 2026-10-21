const fs = require('fs');
const path = require('path');
const { run, get, all, exec } = require('./dbUtils');

// Naikkan angka ini setiap kali ada migration baru.
const LATEST_VERSION = 13;

async function tableExists(db, table) {
  const row = await get(
    db,
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
    [table]
  );
  return Boolean(row);
}

async function addColumnIfMissing(db, table, column, definition) {
  const columns = await all(db, `PRAGMA table_info("${table}")`);
  if (columns.some((c) => c.name === column)) return false;
  await run(db, `ALTER TABLE "${table}" ADD COLUMN ${column} ${definition}`);
  return true;
}

async function backupBeforeMigration(db, dbPath) {
  if (!fs.existsSync(dbPath)) return null;

  const stat = fs.statSync(dbPath);
  if (stat.size === 0) return null;

  const tables = await get(
    db,
    `SELECT COUNT(*) AS count FROM sqlite_master
     WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`
  );
  if (!tables || tables.count === 0) return null;

  const versionRow = await get(db, 'PRAGMA user_version');
  const currentVersion = versionRow?.user_version || 0;
  if (currentVersion >= LATEST_VERSION) return null;

  const backupDir = path.join(path.dirname(dbPath), 'backups');
  fs.mkdirSync(backupDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(
    backupDir,
    `pre-migration-v${currentVersion}-${stamp}.sqlite`
  );

  try {
    // Snapshot konsisten, termasuk saat database sedang memakai WAL.
    const sqlPath = target.replace(/\\/g, '/').replace(/'/g, "''");
    await run(db, `VACUUM INTO '${sqlPath}'`);
  } catch (err) {
    // Fallback untuk SQLite lama / kondisi khusus.
    try {
      await run(db, 'PRAGMA wal_checkpoint(TRUNCATE)');
    } catch (_) {
      // abaikan; copy tetap dicoba
    }
    fs.copyFileSync(dbPath, target);
  }

  console.log('[DB] Backup pra-migrasi dibuat:', target);
  return target;
}

async function createPengaturanTable(db) {
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS pengaturan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_toko VARCHAR(100) DEFAULT 'POS ERTIGA',
      alamat_toko TEXT DEFAULT 'Alamat Toko Belum Diatur',
      pesan_struk TEXT DEFAULT 'Terima kasih sudah berbelanja!',
      telepon VARCHAR(30) DEFAULT '',
      printer_name TEXT DEFAULT '',
      lebar_struk INTEGER NOT NULL DEFAULT 80,
      auto_print INTEGER NOT NULL DEFAULT 0
    )`
  );
}

async function migrateLegacyPengaturan(db) {
  const columns = await all(db, 'PRAGMA table_info("pengaturan")');
  const keyColumn = columns.find((c) => c.name === 'kunci' || c.name === 'key');
  const valueColumn = columns.find((c) => c.name === 'nilai' || c.name === 'value');

  if (!keyColumn || !valueColumn) {
    await createPengaturanTable(db);
    await run(
      db,
      `INSERT OR IGNORE INTO pengaturan
       (id, nama_toko, alamat_toko, pesan_struk)
       VALUES (1, 'POS ERTIGA', 'Point of Sale', 'Terima kasih telah berbelanja!')`
    );
    return;
  }

  console.log('[DB] Migrasi tabel pengaturan format lama...');

  await run(db, 'ALTER TABLE pengaturan RENAME TO pengaturan_legacy');
  await createPengaturanTable(db);

  const rows = await all(db, 'SELECT * FROM pengaturan_legacy');
  const values = {};
  for (const row of rows) {
    const key = row[keyColumn.name];
    if (key) values[key] = row[valueColumn.name];
  }

  const namaToko =
    values.nama_toko || values.namaToko || values.store_name || 'POS ERTIGA';
  const alamatToko =
    values.alamat_toko || values.alamatToko || values.address || 'Point of Sale';
  const pesanStruk =
    values.pesan_struk ||
    values.pesanStruk ||
    values.footer ||
    'Terima kasih telah berbelanja!';

  await run(
    db,
    `INSERT INTO pengaturan (id, nama_toko, alamat_toko, pesan_struk)
     VALUES (1, ?, ?, ?)`,
    [namaToko, alamatToko, pesanStruk]
  );

  await run(db, 'DROP TABLE pengaturan_legacy');
}

async function createBaselineTables(db) {
  // Tabel kategori harus dibuat sebelum barang (foreign key).
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS kategori (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_kategori VARCHAR(100) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS barang (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode VARCHAR(50) UNIQUE,
      nama_barang VARCHAR(250),
      harga_modal INTEGER,
      harga_jual INTEGER,
      stok INTEGER,
      gambar TEXT,
      satuan VARCHAR(20) DEFAULT 'pcs',
      kategori_id INTEGER REFERENCES kategori(id),
      berat_gram INTEGER NOT NULL DEFAULT 0,
      tampil_online INTEGER NOT NULL DEFAULT 1,
      aktif INTEGER NOT NULL DEFAULT 1,
      deleted_at TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS transaksi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nomor_nota VARCHAR(50) UNIQUE,
      nama_pelanggan VARCHAR(100) DEFAULT 'Umum',
      total_harga INTEGER,
      total_bayar INTEGER,
      total_kembalian INTEGER,
      diskon INTEGER NOT NULL DEFAULT 0,
      metode_pembayaran VARCHAR(50) DEFAULT 'Tunai',
      status VARCHAR(20) DEFAULT 'sukses',
      client_ref TEXT,
      tanggal_transaksi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS detail_transaksi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaksi_id INTEGER,
      barang_id INTEGER,
      harga_jual_saat_ini INTEGER,
      harga_modal_saat_ini INTEGER,
      qty INTEGER,
      subtotal INTEGER,
      FOREIGN KEY (transaksi_id) REFERENCES transaksi(id) ON DELETE CASCADE,
      FOREIGN KEY (barang_id) REFERENCES barang(id)
    )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS stok_masuk (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barang_id INTEGER,
      qty INTEGER,
      keterangan TEXT,
      tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (barang_id) REFERENCES barang(id)
    )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS counter_nota (
      tanggal TEXT PRIMARY KEY,
      nomor_terakhir INTEGER NOT NULL DEFAULT 0
    )`
  );

  await createPengaturanTable(db);

  await run(
    db,
    `CREATE INDEX IF NOT EXISTS idx_detail_transaksi_id ON detail_transaksi(transaksi_id)`
  );
  await run(
    db,
    `CREATE INDEX IF NOT EXISTS idx_detail_barang_id ON detail_transaksi(barang_id)`
  );
  await run(
    db,
    `CREATE INDEX IF NOT EXISTS idx_transaksi_tanggal ON transaksi(tanggal_transaksi)`
  );
  await run(
    db,
    `CREATE INDEX IF NOT EXISTS idx_stok_masuk_barang ON stok_masuk(barang_id)`
  );
}

const migrations = [
  {
    version: 1,
    name: 'akurasi transaksi & laporan',
    async up(db) {
      await addColumnIfMissing(db, 'transaksi', 'diskon', 'INTEGER NOT NULL DEFAULT 0');
      await addColumnIfMissing(db, 'transaksi', 'client_ref', 'TEXT');
      await addColumnIfMissing(
        db,
        'detail_transaksi',
        'harga_modal_saat_ini',
        'INTEGER'
      );

      await run(
        db,
        `CREATE TABLE IF NOT EXISTS counter_nota (
          tanggal TEXT PRIMARY KEY,
          nomor_terakhir INTEGER NOT NULL DEFAULT 0
        )`
      );

      await run(
        db,
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_transaksi_client_ref
         ON transaksi(client_ref) WHERE client_ref IS NOT NULL`
      );

      // Backfill snapshot modal untuk transaksi lama.
      await run(
        db,
        `UPDATE detail_transaksi
         SET harga_modal_saat_ini = (
           SELECT b.harga_modal FROM barang b
           WHERE b.id = detail_transaksi.barang_id
         )
         WHERE harga_modal_saat_ini IS NULL`
      );
    },
  },
  {
    version: 2,
    name: 'pengaturan printer',
    async up(db) {
      await addColumnIfMissing(db, 'pengaturan', 'printer_name', "TEXT DEFAULT ''");
      await addColumnIfMissing(
        db,
        'pengaturan',
        'lebar_struk',
        'INTEGER NOT NULL DEFAULT 80'
      );
      await addColumnIfMissing(
        db,
        'pengaturan',
        'auto_print',
        'INTEGER NOT NULL DEFAULT 0'
      );
    },
  },
  {
    version: 3,
    name: 'soft delete barang',
    async up(db) {
      await addColumnIfMissing(
        db,
        'barang',
        'aktif',
        'INTEGER NOT NULL DEFAULT 1'
      );
      await addColumnIfMissing(db, 'barang', 'deleted_at', 'TEXT');
      await run(
        db,
        `CREATE INDEX IF NOT EXISTS idx_barang_aktif ON barang(aktif)`
      );
      await run(
        db,
        `CREATE INDEX IF NOT EXISTS idx_barang_kategori ON barang(kategori_id)`
      );
    },
  },
  {
    version: 4,
    name: 'ecommerce preparation (berat_gram & tampil_online)',
    async up(db) {
      await addColumnIfMissing(
        db,
        'barang',
        'berat_gram',
        'INTEGER NOT NULL DEFAULT 0'
      );
      await addColumnIfMissing(
        db,
        'barang',
        'tampil_online',
        'INTEGER NOT NULL DEFAULT 1'
      );
      await run(
        db,
        `CREATE INDEX IF NOT EXISTS idx_barang_tampil_online ON barang(tampil_online)`
      );
    },
  },
  {
    version: 5,
    name: 'store contact (telepon in pengaturan)',
    async up(db) {
      await addColumnIfMissing(
        db,
        'pengaturan',
        'telepon',
        "VARCHAR(30) DEFAULT ''"
      );
    },
  },
  {
    version: 6,
    name: 'banner slider management',
    async up(db) {
      await run(
        db,
        `CREATE TABLE IF NOT EXISTS banners (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          judul VARCHAR(200) NOT NULL DEFAULT '',
          subjudul VARCHAR(300) DEFAULT '',
          badge VARCHAR(100) DEFAULT '',
          gambar TEXT DEFAULT '',
          warna_bg VARCHAR(200) DEFAULT 'linear-gradient(135deg, #0A4D2E 0%, #03AC0E 100%)',
          warna_accent VARCHAR(30) DEFAULT '#FFD700',
          link TEXT DEFAULT '',
          urutan INTEGER NOT NULL DEFAULT 0,
          aktif INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      );
      await run(
        db,
        `CREATE INDEX IF NOT EXISTS idx_banners_aktif ON banners(aktif)`
      );
      await run(
        db,
        `CREATE INDEX IF NOT EXISTS idx_banners_urutan ON banners(urutan)`
      );

      // Seed 3 banner default agar langsung tampil
      const count = await get(db, `SELECT COUNT(*) AS total FROM banners`);
      if (!count || count.total === 0) {
        await run(
          db,
          `INSERT INTO banners (judul, subjudul, badge, gambar, warna_bg, warna_accent, link, urutan, aktif)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'Diskon Spesial Koleksi Fashion & Apparel',
            'Koleksi Kaos Distro, Hijab Muslimah & Aksesoris Terlengkap',
            'PROMO BULAN INI',
            '',
            'linear-gradient(135deg, #0A4D2E 0%, #03AC0E 100%)',
            '#FFD700',
            '',
            0,
            1,
          ]
        );
        await run(
          db,
          `INSERT INTO banners (judul, subjudul, badge, gambar, warna_bg, warna_accent, link, urutan, aktif)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'Top-Up Pulsa, Data & Token PLN Kilat',
            'Isi ulang all operator 24 Jam & bayar tagihan dengan harga grosir',
            'LAYANAN DIGITAL',
            '',
            'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
            '#93C5FD',
            '',
            1,
            1,
          ]
        );
        await run(
          db,
          `INSERT INTO banners (judul, subjudul, badge, gambar, warna_bg, warna_accent, link, urutan, aktif)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'Investasi Logam Mulia Emas 24K Asli',
            'Antam & Mini Gold bersertifikat resmi, melayani jual & buyback',
            'HEMAT & BERKAH',
            '',
            'linear-gradient(135deg, #78350F 0%, #D97706 100%)',
            '#FDE68A',
            '',
            2,
            1,
          ]
        );
      }
    },
  },
  {
    version: 7,
    name: 'product description (deskripsi in barang)',
    async up(db) {
      await addColumnIfMissing(db, 'barang', 'deskripsi', "TEXT DEFAULT ''");
    },
  },
  {
    version: 8,
    name: 'logam mulia kategori and items',
    async up(db) {
      await run(
        db,
        `CREATE TABLE IF NOT EXISTS logam_mulia_kategori (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nama_merk VARCHAR(100) NOT NULL,
          keterangan TEXT DEFAULT '',
          urutan INTEGER DEFAULT 0,
          aktif INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      );

      await run(
        db,
        `CREATE TABLE IF NOT EXISTS logam_mulia_item (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          kategori_id INTEGER NOT NULL REFERENCES logam_mulia_kategori(id) ON DELETE CASCADE,
          gramatur VARCHAR(50) NOT NULL,
          harga_jual REAL NOT NULL DEFAULT 0,
          harga_beli REAL DEFAULT 0,
          stok INTEGER DEFAULT 1,
          deskripsi TEXT DEFAULT '',
          gambar TEXT DEFAULT '',
          is_favorit INTEGER DEFAULT 0,
          aktif INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      );

      // Seed initial data if table empty
      const existing = await get(db, `SELECT COUNT(*) as total FROM logam_mulia_kategori`);
      if (!existing || existing.total === 0) {
        const resAntam = await run(
          db,
          `INSERT INTO logam_mulia_kategori (nama_merk, keterangan, urutan, aktif) VALUES (?, ?, ?, ?)`,
          ['Antam Logam Mulia', 'Emas batangan murni 24 Karat kemurnian 999.9% bersertifikat resmi LBMA & CertiCard', 0, 1]
        );
        const resMini = await run(
          db,
          `INSERT INTO logam_mulia_kategori (nama_merk, keterangan, urutan, aktif) VALUES (?, ?, ?, ?)`,
          ['Mini Gold', 'Sarana menabung emas mulai dari gramatur mikro bersertifikat resmi 24K', 1, 1]
        );
        const resUbs = await run(
          db,
          `INSERT INTO logam_mulia_kategori (nama_merk, keterangan, urutan, aktif) VALUES (?, ?, ?, ?)`,
          ['UBS Gold', 'Emas batangan PT Untung Bersama Sejahtera kemurnian 99.99% segel hologram', 2, 1]
        );

        // Seed Antam items
        const antamId = resAntam.lastID;
        const antamItems = [
          ['0.5 gr', 790000, 710000, 8, 'CertiCard Redesigned Press resmi Antam 2024 kemurnian 99.99%', 1],
          ['1.0 gr', 1485000, 1350000, 10, 'CertiCard kemurnian 99.99% terakreditasi LBMA resmi Antam', 1],
          ['2.0 gr', 2920000, 2680000, 5, 'Emas batangan 2 gram press segel resmi Antam kemurnian 999.9', 0],
          ['5.0 gr', 7220000, 6650000, 3, 'Emas batangan 5 gram segel CertiCard resmi kemurnian 99.99%', 0],
          ['10.0 gr', 14350000, 13200000, 2, 'Emas batangan 10 gram press segel resmi Antam investasi premium', 0],
        ];
        for (const [gram, hj, hb, stk, desc, fav] of antamItems) {
          await run(
            db,
            `INSERT INTO logam_mulia_item (kategori_id, gramatur, harga_jual, harga_beli, stok, deskripsi, is_favorit, aktif)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [antamId, gram, hj, hb, stk, desc, fav]
          );
        }

        // Seed Mini Gold items
        const miniId = resMini.lastID;
        const miniItems = [
          ['0.025 gr', 48000, 40000, 25, 'Mini Gold Black Series kemurnian 24K 99.9% bersertifikat', 0],
          ['0.05 gr', 92000, 78000, 20, 'Mini Gold Souvenir Series kemurnian 24K 99.9% bersertifikat', 0],
          ['0.1 gr', 175000, 150000, 15, 'Mini Gold Classic 0.1 gram kemurnian 24 Karat bersertifikat', 1],
          ['0.25 gr', 415000, 360000, 10, 'Mini Gold White Series 0.25 gram kemurnian 24K bersertifikat', 0],
          ['0.5 gr', 780000, 700000, 6, 'Mini Gold Reguler 0.5 gram kemurnian 24 Karat bersertifikat', 1],
        ];
        for (const [gram, hj, hb, stk, desc, fav] of miniItems) {
          await run(
            db,
            `INSERT INTO logam_mulia_item (kategori_id, gramatur, harga_jual, harga_beli, stok, deskripsi, is_favorit, aktif)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [miniId, gram, hj, hb, stk, desc, fav]
          );
        }

        // Seed UBS items
        const ubsId = resUbs.lastID;
        const ubsItems = [
          ['0.5 gr', 785000, 705000, 5, 'UBS Gold kemurnian 99.99% segel press hologram resmi', 0],
          ['1.0 gr', 1475000, 1340000, 8, 'UBS Gold 1 gram kemurnian 99.99% hologram resmi bergaransi', 1],
          ['2.0 gr', 2900000, 2660000, 4, 'UBS Gold 2 gram kemurnian 99.99% segel resmi PT UBS', 0],
          ['5.0 gr', 7180000, 6610000, 2, 'UBS Gold 5 gram kemurnian 99.99% segel resmi PT UBS', 0],
        ];
        for (const [gram, hj, hb, stk, desc, fav] of ubsItems) {
          await run(
            db,
            `INSERT INTO logam_mulia_item (kategori_id, gramatur, harga_jual, harga_beli, stok, deskripsi, is_favorit, aktif)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [ubsId, gram, hj, hb, stk, desc, fav]
          );
        }
      }
    },
  },
  {
    version: 9,
    name: 'smm booster sosmed platform layanan paket',
    async up(db) {
      await run(
        db,
        `CREATE TABLE IF NOT EXISTS smm_platform (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nama_platform TEXT NOT NULL,
          slug TEXT,
          color TEXT DEFAULT '#000000',
          icon TEXT DEFAULT '',
          deskripsi TEXT DEFAULT '',
          urutan INTEGER DEFAULT 0,
          aktif INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      );

      await run(
        db,
        `CREATE TABLE IF NOT EXISTS smm_layanan (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          platform_id INTEGER NOT NULL,
          nama_layanan TEXT NOT NULL,
          target_type TEXT DEFAULT 'Link / Username',
          deskripsi TEXT DEFAULT '',
          urutan INTEGER DEFAULT 0,
          aktif INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (platform_id) REFERENCES smm_platform(id) ON DELETE CASCADE
        )`
      );

      await run(
        db,
        `CREATE TABLE IF NOT EXISTS smm_paket (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          layanan_id INTEGER NOT NULL,
          jumlah_order INTEGER NOT NULL,
          harga_jual REAL NOT NULL,
          harga_modal REAL DEFAULT 0,
          is_popular INTEGER DEFAULT 0,
          deskripsi TEXT DEFAULT '',
          urutan INTEGER DEFAULT 0,
          aktif INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (layanan_id) REFERENCES smm_layanan(id) ON DELETE CASCADE
        )`
      );

      await run(db, `CREATE INDEX IF NOT EXISTS idx_smm_layanan_platform ON smm_layanan(platform_id)`);
      await run(db, `CREATE INDEX IF NOT EXISTS idx_smm_paket_layanan ON smm_paket(layanan_id)`);

      // Seed default platforms, services, and packages if empty
      const existing = await get(db, `SELECT COUNT(*) as total FROM smm_platform`);
      if (!existing || existing.total === 0) {
        // 1. TikTok
        const resTt = await run(
          db,
          `INSERT INTO smm_platform (nama_platform, slug, color, icon, deskripsi, urutan, aktif)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          ['TikTok', 'tiktok', '#000000', 'tiktok', 'Follower, Like Video & Viral Views TikTok Terpercaya', 0]
        );
        const ttId = resTt.lastID;

        // TikTok Layanan 1: Followers
        const resTtFol = await run(
          db,
          `INSERT INTO smm_layanan (platform_id, nama_layanan, target_type, deskripsi, urutan, aktif)
           VALUES (?, ?, ?, ?, ?, 1)`,
          [ttId, 'TikTok Followers (Aktif / HQ)', 'Username / Profil TikTok (Contoh: @akun_kamu)', 'Akun real & mix aktif untuk naikkan kredibilitas profil', 0]
        );
        const ttFolId = resTtFol.lastID;
        const ttFolPaket = [
          [250, 25000, 18000, 0],
          [500, 45000, 32000, 0],
          [1000, 79000, 58000, 1],
          [2500, 185000, 140000, 0],
          [5000, 350000, 270000, 0],
        ];
        for (const [qty, hj, hb, pop] of ttFolPaket) {
          await run(
            db,
            `INSERT INTO smm_paket (layanan_id, jumlah_order, harga_jual, harga_modal, is_popular, aktif)
             VALUES (?, ?, ?, ?, ?, 1)`,
            [ttFolId, qty, hj, hb, pop]
          );
        }

        // TikTok Layanan 2: Views
        const resTtView = await run(
          db,
          `INSERT INTO smm_layanan (platform_id, nama_layanan, target_type, deskripsi, urutan, aktif)
           VALUES (?, ?, ?, ?, ?, 1)`,
          [ttId, 'TikTok Video Views (Cepat & Viral)', 'Link Video TikTok (URL VT)', 'Proses super cepat langsung FYP masuk bertahap', 1]
        );
        const ttViewId = resTtView.lastID;
        const ttViewPaket = [
          [5000, 10000, 5000, 0],
          [10000, 18000, 9000, 1],
          [50000, 75000, 40000, 0],
          [100000, 135000, 75000, 0],
        ];
        for (const [qty, hj, hb, pop] of ttViewPaket) {
          await run(
            db,
            `INSERT INTO smm_paket (layanan_id, jumlah_order, harga_jual, harga_modal, is_popular, aktif)
             VALUES (?, ?, ?, ?, ?, 1)`,
            [ttViewId, qty, hj, hb, pop]
          );
        }

        // TikTok Layanan 3: Likes
        const resTtLike = await run(
          db,
          `INSERT INTO smm_layanan (platform_id, nama_layanan, target_type, deskripsi, urutan, aktif)
           VALUES (?, ?, ?, ?, ?, 1)`,
          [ttId, 'TikTok Likes Video', 'Link Video TikTok (URL VT)', 'Like organik stabil untuk tingkatkan interaksi video', 2]
        );
        const ttLikeId = resTtLike.lastID;
        const ttLikePaket = [
          [200, 15000, 8000, 0],
          [500, 30000, 16000, 1],
          [1000, 55000, 30000, 0],
          [2500, 125000, 70000, 0],
        ];
        for (const [qty, hj, hb, pop] of ttLikePaket) {
          await run(
            db,
            `INSERT INTO smm_paket (layanan_id, jumlah_order, harga_jual, harga_modal, is_popular, aktif)
             VALUES (?, ?, ?, ?, ?, 1)`,
            [ttLikeId, qty, hj, hb, pop]
          );
        }

        // 2. Instagram
        const resIg = await run(
          db,
          `INSERT INTO smm_platform (nama_platform, slug, color, icon, deskripsi, urutan, aktif)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          ['Instagram', 'instagram', '#E1306C', 'instagram', 'Followers Real/Mix, Likes Foto & Reels Views Instagram', 1]
        );
        const igId = resIg.lastID;

        // IG Layanan 1: Followers
        const resIgFol = await run(
          db,
          `INSERT INTO smm_layanan (platform_id, nama_layanan, target_type, deskripsi, urutan, aktif)
           VALUES (?, ?, ?, ?, ?, 1)`,
          [igId, 'Instagram Followers (Real / Mix)', 'Username Profil IG (Contoh: @akun_kamu)', 'Peningkatan follower aman tanpa password', 0]
        );
        const igFolId = resIgFol.lastID;
        const igFolPaket = [
          [250, 28000, 19000, 0],
          [500, 50000, 35000, 0],
          [1000, 89000, 65000, 1],
          [2500, 210000, 155000, 0],
        ];
        for (const [qty, hj, hb, pop] of igFolPaket) {
          await run(
            db,
            `INSERT INTO smm_paket (layanan_id, jumlah_order, harga_jual, harga_modal, is_popular, aktif)
             VALUES (?, ?, ?, ?, ?, 1)`,
            [igFolId, qty, hj, hb, pop]
          );
        }

        // IG Layanan 2: Likes
        const resIgLike = await run(
          db,
          `INSERT INTO smm_layanan (platform_id, nama_layanan, target_type, deskripsi, urutan, aktif)
           VALUES (?, ?, ?, ?, ?, 1)`,
          [igId, 'Instagram Likes Postingan/Reels', 'Link Foto / Reels Instagram', 'Like masuk cepat dan natural', 1]
        );
        const igLikeId = resIgLike.lastID;
        const igLikePaket = [
          [250, 12000, 6000, 0],
          [500, 22000, 12000, 1],
          [1000, 38000, 20000, 0],
          [2500, 85000, 48000, 0],
        ];
        for (const [qty, hj, hb, pop] of igLikePaket) {
          await run(
            db,
            `INSERT INTO smm_paket (layanan_id, jumlah_order, harga_jual, harga_modal, is_popular, aktif)
             VALUES (?, ?, ?, ?, ?, 1)`,
            [igLikeId, qty, hj, hb, pop]
          );
        }

        // IG Layanan 3: Reels Views
        const resIgView = await run(
          db,
          `INSERT INTO smm_layanan (platform_id, nama_layanan, target_type, deskripsi, urutan, aktif)
           VALUES (?, ?, ?, ?, ?, 1)`,
          [igId, 'Instagram Reels Views', 'Link Reels Instagram', 'Bantu Reels masuk explore dan rekomendasi IG', 2]
        );
        const igViewId = resIgView.lastID;
        const igViewPaket = [
          [2000, 12000, 6000, 0],
          [5000, 25000, 13000, 1],
          [10000, 45000, 24000, 0],
          [25000, 95000, 52000, 0],
        ];
        for (const [qty, hj, hb, pop] of igViewPaket) {
          await run(
            db,
            `INSERT INTO smm_paket (layanan_id, jumlah_order, harga_jual, harga_modal, is_popular, aktif)
             VALUES (?, ?, ?, ?, ?, 1)`,
            [igViewId, qty, hj, hb, pop]
          );
        }

        // 3. YouTube
        const resYt = await run(
          db,
          `INSERT INTO smm_platform (nama_platform, slug, color, icon, deskripsi, urutan, aktif)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          ['YouTube', 'youtube', '#FF0000', 'youtube', 'Penambahan Jam Tayang, Views & Subscribers Channel YouTube', 2]
        );
        const ytId = resYt.lastID;

        // YT Layanan 1: Views
        const resYtView = await run(
          db,
          `INSERT INTO smm_layanan (platform_id, nama_layanan, target_type, deskripsi, urutan, aktif)
           VALUES (?, ?, ?, ?, ?, 1)`,
          [ytId, 'YouTube Views Video', 'Link Video YouTube', 'High retention views aman algoritma YouTube', 0]
        );
        const ytViewId = resYtView.lastID;
        const ytViewPaket = [
          [1000, 45000, 28000, 0],
          [2500, 105000, 68000, 1],
          [5000, 195000, 125000, 0],
        ];
        for (const [qty, hj, hb, pop] of ytViewPaket) {
          await run(
            db,
            `INSERT INTO smm_paket (layanan_id, jumlah_order, harga_jual, harga_modal, is_popular, aktif)
             VALUES (?, ?, ?, ?, ?, 1)`,
            [ytViewId, qty, hj, hb, pop]
          );
        }

        // YT Layanan 2: Subs
        const resYtSub = await run(
          db,
          `INSERT INTO smm_layanan (platform_id, nama_layanan, target_type, deskripsi, urutan, aktif)
           VALUES (?, ?, ?, ?, ?, 1)`,
          [ytId, 'YouTube Subscribers', 'Link Channel YouTube', 'Subscribers permanen untuk syarat monetisasi', 1]
        );
        const ytSubId = resYtSub.lastID;
        const ytSubPaket = [
          [100, 65000, 45000, 0],
          [250, 155000, 105000, 1],
          [500, 295000, 205000, 0],
        ];
        for (const [qty, hj, hb, pop] of ytSubPaket) {
          await run(
            db,
            `INSERT INTO smm_paket (layanan_id, jumlah_order, harga_jual, harga_modal, is_popular, aktif)
             VALUES (?, ?, ?, ?, ?, 1)`,
            [ytSubId, qty, hj, hb, pop]
          );
        }
      }
    },
  },
  {
    version: 10,
    name: 'flash_sale_system',
    up: async (db) => {
      await run(
        db,
        `CREATE TABLE IF NOT EXISTS flash_sale_settings (
          id INTEGER PRIMARY KEY,
          judul VARCHAR(100) DEFAULT 'FLASH SALE',
          subjudul VARCHAR(150) DEFAULT 'Promo Terbatas Hari Ini',
          badge_text VARCHAR(50) DEFAULT '⚡ FLASH SALE',
          aktif INTEGER DEFAULT 1,
          jam_selesai VARCHAR(10) DEFAULT '22:00',
          durasi_jam INTEGER DEFAULT 3
        )`
      );

      await run(
        db,
        `CREATE TABLE IF NOT EXISTS flash_sale_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          barang_id INTEGER,
          nama_item VARCHAR(200) NOT NULL,
          gambar TEXT,
          harga_asli INTEGER NOT NULL,
          harga_diskon INTEGER NOT NULL,
          diskon_persen VARCHAR(20) DEFAULT '-15%',
          terjual_pct INTEGER DEFAULT 75,
          tipe VARCHAR(20) DEFAULT 'product',
          target_link TEXT DEFAULT '',
          urutan INTEGER DEFAULT 0,
          aktif INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      );

      const existingSettings = await get(db, `SELECT id FROM flash_sale_settings WHERE id = 1`);
      if (!existingSettings) {
        await run(
          db,
          `INSERT INTO flash_sale_settings (id, judul, subjudul, badge_text, aktif, jam_selesai, durasi_jam)
           VALUES (1, 'FLASH SALE', 'Promo Terbatas Hari Ini', '⚡ FLASH SALE', 1, '22:00', 3)`
        );
      }

      const existingItems = await all(db, `SELECT id FROM flash_sale_items LIMIT 1`);
      if (existingItems.length === 0) {
        const sampleBarang = await all(db, `SELECT id, nama_barang, harga_jual, gambar FROM barang WHERE aktif = 1 AND (deleted_at IS NULL) LIMIT 2`);
        
        if (sampleBarang.length > 0) {
          const b1 = sampleBarang[0];
          const diskon1 = Math.round(b1.harga_jual * 0.85);
          await run(
            db,
            `INSERT INTO flash_sale_items (barang_id, nama_item, gambar, harga_asli, harga_diskon, diskon_persen, terjual_pct, tipe, urutan, aktif)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'product', 0, 1)`,
            [b1.id, b1.nama_barang, b1.gambar || '', b1.harga_jual, diskon1, '-15%', 75]
          );
        } else {
          await run(
            db,
            `INSERT INTO flash_sale_items (barang_id, nama_item, gambar, harga_asli, harga_diskon, diskon_persen, terjual_pct, tipe, urutan, aktif)
             VALUES (NULL, 'Kaos Hitam Polos', '', 49000, 40000, '-15%', 75, 'product', 0, 1)`
          );
        }

        if (sampleBarang.length > 1) {
          const b2 = sampleBarang[1];
          const diskon2 = Math.round(b2.harga_jual * 0.8);
          await run(
            db,
            `INSERT INTO flash_sale_items (barang_id, nama_item, gambar, harga_asli, harga_diskon, diskon_persen, terjual_pct, tipe, urutan, aktif)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'product', 1, 1)`,
            [b2.id, b2.nama_barang, b2.gambar || '', b2.harga_jual, diskon2, '-20%', 80]
          );
        } else {
          await run(
            db,
            `INSERT INTO flash_sale_items (barang_id, nama_item, gambar, harga_asli, harga_diskon, diskon_persen, terjual_pct, tipe, urutan, aktif)
             VALUES (NULL, 'Kaos hitam Salvador', '', 120000, 100000, '-20%', 80, 'product', 1, 1)`
          );
        }

        await run(
          db,
          `INSERT INTO flash_sale_items (barang_id, nama_item, gambar, harga_asli, harga_diskon, diskon_persen, terjual_pct, tipe, target_link, urutan, aktif)
           VALUES (NULL, 'Logam Mulia Mini Gold 0.1 gr', 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=400&q=80', 195000, 175000, '-10%', 85, 'digital', 'deal-emas', 2, 1)`
        );

        await run(
          db,
          `INSERT INTO flash_sale_items (barang_id, nama_item, gambar, harga_asli, harga_diskon, diskon_persen, terjual_pct, tipe, target_link, urutan, aktif)
           VALUES (NULL, 'Token Listrik PLN 50.000', 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=400&q=80', 54000, 51000, '-5%', 92, 'digital', 'ppob', 3, 1)`
        );
      }
    },
  },
  {
    version: 11,
    name: 'populate default images for logam mulia items',
    async up(db) {
      const imgAntam = 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=500&q=80';
      const imgMini = 'https://images.unsplash.com/photo-1624365169365-27a3d3c8c73d?auto=format&fit=crop&w=500&q=80';
      const imgUbs = 'https://images.unsplash.com/photo-1605792657660-596af9009e82?auto=format&fit=crop&w=500&q=80';

      await run(
        db,
        `UPDATE logam_mulia_item 
         SET gambar = ?
         WHERE (gambar IS NULL OR gambar = '') 
           AND kategori_id IN (SELECT id FROM logam_mulia_kategori WHERE nama_merk LIKE '%Antam%')`,
        [imgAntam]
      );

      await run(
        db,
        `UPDATE logam_mulia_item 
         SET gambar = ?
         WHERE (gambar IS NULL OR gambar = '') 
           AND kategori_id IN (SELECT id FROM logam_mulia_kategori WHERE nama_merk LIKE '%Mini%')`,
        [imgMini]
      );

      await run(
        db,
        `UPDATE logam_mulia_item 
         SET gambar = ?
         WHERE (gambar IS NULL OR gambar = '') 
           AND kategori_id IN (SELECT id FROM logam_mulia_kategori WHERE nama_merk LIKE '%UBS%')`,
        [imgUbs]
      );

      await run(
        db,
        `UPDATE logam_mulia_item 
         SET gambar = ?
         WHERE gambar IS NULL OR gambar = ''`,
        [imgAntam]
      );
    },
  },
  {
    version: 12,
    name: 'tambah kolom kondisi pada barang',
    async up(db) {
      await addColumnIfMissing(
        db,
        'barang',
        'kondisi',
        "VARCHAR(50) DEFAULT 'Baru'"
      );
      await run(
        db,
        `UPDATE barang 
         SET kondisi = 'Baru' 
         WHERE kondisi IS NULL OR kondisi = ''`
      );
    },
  },
  {
    version: 13,
    name: 'transaksi custom kasir & sistem ppob digital',
    async up(db) {
      // 1. Tambah kolom nama_barang di detail_transaksi agar transaksi custom kasir (pulsa, jasa, token, dll) tercatat rapi
      await addColumnIfMissing(
        db,
        'detail_transaksi',
        'nama_barang',
        "TEXT DEFAULT ''"
      );

      // Backfill nama_barang untuk transaksi lama dari tabel barang
      await run(
        db,
        `UPDATE detail_transaksi 
         SET nama_barang = (
           SELECT b.nama_barang FROM barang b WHERE b.id = detail_transaksi.barang_id
         )
         WHERE (nama_barang IS NULL OR nama_barang = '') AND barang_id IS NOT NULL`
      );

      // 2. Buat tabel kategori PPOB
      await run(
        db,
        `CREATE TABLE IF NOT EXISTS ppob_kategori (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          kode VARCHAR(50) UNIQUE NOT NULL,
          nama VARCHAR(100) NOT NULL,
          deskripsi TEXT DEFAULT '',
          icon VARCHAR(50) DEFAULT 'mobile',
          urutan INTEGER DEFAULT 0,
          aktif INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      );

      // 3. Buat tabel item / produk PPOB
      await run(
        db,
        `CREATE TABLE IF NOT EXISTS ppob_item (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          kategori_kode VARCHAR(50) NOT NULL,
          operator VARCHAR(100) NOT NULL,
          nama_produk VARCHAR(200) NOT NULL,
          nominal VARCHAR(100) NOT NULL,
          harga_modal INTEGER DEFAULT 0,
          harga_jual INTEGER NOT NULL,
          urutan INTEGER DEFAULT 0,
          aktif INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      );

      await run(db, `CREATE INDEX IF NOT EXISTS idx_ppob_item_kat ON ppob_item(kategori_kode)`);
      await run(db, `CREATE INDEX IF NOT EXISTS idx_ppob_item_op ON ppob_item(operator)`);

      // 4. Seed kategori PPOB
      const countKat = await get(db, `SELECT COUNT(*) as total FROM ppob_kategori`);
      if (!countKat || countKat.total === 0) {
        await run(
          db,
          `INSERT INTO ppob_kategori (kode, nama, deskripsi, icon, urutan, aktif) VALUES
           ('pulsa', 'Pulsa Seluler', 'Isi ulang pulsa reguler all operator', 'phone', 0, 1),
           ('paket_data', 'Paket Data Internet', 'Kuota data internet harian & bulanan', 'wifi', 1, 1),
           ('listrik', 'Listrik PLN', 'Token listrik prabayar & tagihan PLN', 'zap', 2, 1),
           ('ewallet', 'Top-Up E-Wallet', 'Isi saldo DANA, GoPay, OVO, ShopeePay', 'wallet', 3, 1)`
        );

        // Seed item PPOB
        const seedItems = [
          // Pulsa Telkomsel
          ['pulsa', 'Telkomsel', 'Pulsa Telkomsel 5.000', '5.000', 5800, 7000, 0],
          ['pulsa', 'Telkomsel', 'Pulsa Telkomsel 10.000', '10.000', 10600, 12000, 1],
          ['pulsa', 'Telkomsel', 'Pulsa Telkomsel 20.000', '20.000', 20300, 22000, 2],
          ['pulsa', 'Telkomsel', 'Pulsa Telkomsel 25.000', '25.000', 25100, 27000, 3],
          ['pulsa', 'Telkomsel', 'Pulsa Telkomsel 50.000', '50.000', 49800, 52000, 4],
          ['pulsa', 'Telkomsel', 'Pulsa Telkomsel 100.000', '100.000', 98500, 101000, 5],
          // Pulsa Indosat
          ['pulsa', 'Indosat', 'Pulsa Indosat 5.000', '5.000', 5800, 7000, 10],
          ['pulsa', 'Indosat', 'Pulsa Indosat 10.000', '10.000', 10600, 12000, 11],
          ['pulsa', 'Indosat', 'Pulsa Indosat 25.000', '25.000', 25100, 27000, 12],
          ['pulsa', 'Indosat', 'Pulsa Indosat 50.000', '50.000', 49800, 52000, 13],
          ['pulsa', 'Indosat', 'Pulsa Indosat 100.000', '100.000', 98500, 101000, 14],
          // Pulsa XL
          ['pulsa', 'XL / Axis', 'Pulsa XL 5.000', '5.000', 5800, 7000, 20],
          ['pulsa', 'XL / Axis', 'Pulsa XL 10.000', '10.000', 10600, 12000, 21],
          ['pulsa', 'XL / Axis', 'Pulsa XL 25.000', '25.000', 25100, 27000, 22],
          ['pulsa', 'XL / Axis', 'Pulsa XL 50.000', '50.000', 49800, 52000, 23],
          ['pulsa', 'XL / Axis', 'Pulsa XL 100.000', '100.000', 98500, 101000, 24],
          // Listrik PLN
          ['listrik', 'PLN Prabayar', 'Token PLN 20.000', '20.000', 20500, 22500, 30],
          ['listrik', 'PLN Prabayar', 'Token PLN 50.000', '50.000', 50500, 52500, 31],
          ['listrik', 'PLN Prabayar', 'Token PLN 100.000', '100.000', 100500, 102500, 32],
          ['listrik', 'PLN Prabayar', 'Token PLN 200.000', '200.000', 200500, 202500, 33],
          ['listrik', 'PLN Prabayar', 'Token PLN 500.000', '500.000', 500500, 502500, 34],
          // E-Wallet DANA
          ['ewallet', 'DANA', 'Saldo DANA 20.000', '20.000', 20500, 22000, 40],
          ['ewallet', 'DANA', 'Saldo DANA 50.000', '50.000', 50500, 52000, 41],
          ['ewallet', 'DANA', 'Saldo DANA 100.000', '100.000', 100500, 102000, 42],
          // E-Wallet GoPay
          ['ewallet', 'GoPay', 'Saldo GoPay 20.000', '20.000', 20500, 22000, 50],
          ['ewallet', 'GoPay', 'Saldo GoPay 50.000', '50.000', 50500, 52000, 51],
          ['ewallet', 'GoPay', 'Saldo GoPay 100.000', '100.000', 100500, 102000, 52],
        ];

        for (const [kat, op, nama, nom, modal, jual, urut] of seedItems) {
          await run(
            db,
            `INSERT INTO ppob_item (kategori_kode, operator, nama_produk, nominal, harga_modal, harga_jual, urutan, aktif)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [kat, op, nama, nom, modal, jual, urut]
          );
        }
      }
    },
  },
];

async function runMigrations(db) {
  const row = await get(db, 'PRAGMA user_version');
  let current = row?.user_version || 0;

  for (const migration of migrations) {
    if (migration.version <= current) continue;

    console.log(
      `[DB] Menjalankan migration ${migration.version}: ${migration.name}`
    );

    await run(db, 'BEGIN');
    try {
      await migration.up(db);
      await run(db, `PRAGMA user_version = ${migration.version}`);
      await run(db, 'COMMIT');
      current = migration.version;
    } catch (err) {
      await run(db, 'ROLLBACK').catch(() => {});
      throw new Error(
        `Migration ${migration.version} (${migration.name}) gagal: ${err.message}`
      );
    }
  }

  await run(db, `PRAGMA user_version = ${Math.max(current, LATEST_VERSION)}`);
}

async function initializeSchema(db, dbPath) {
  await run(db, 'PRAGMA foreign_keys = ON');

  try {
    await get(db, 'PRAGMA journal_mode = WAL');
  } catch (err) {
    console.warn('[DB] Gagal mengaktifkan WAL:', err.message);
  }

  await run(db, 'PRAGMA busy_timeout = 5000');

  const backupPath = await backupBeforeMigration(db, dbPath);

  await createBaselineTables(db);
  await migrateLegacyPengaturan(db);
  await runMigrations(db);

  return { backupPath, version: LATEST_VERSION };
}

module.exports = {
  LATEST_VERSION,
  initializeSchema,
  addColumnIfMissing,
  tableExists,
  backupBeforeMigration,
  createBaselineTables,
  migrateLegacyPengaturan,
  runMigrations,
};
