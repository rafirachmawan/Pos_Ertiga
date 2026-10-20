const fs = require('fs');
const path = require('path');
const { run, get, all, exec } = require('./dbUtils');

// Naikkan angka ini setiap kali ada migration baru.
const LATEST_VERSION = 4;

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
