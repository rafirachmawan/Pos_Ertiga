/**
 * Script untuk menyinkronkan skema dan data dari SQLite lokal ke Turso Cloud DB.
 *
 * Cara menjalankan:
 * TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." node server/scripts/sync-to-turso.js
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@libsql/client');
const { initializeSchema } = require('../migrations');
const dbUtils = require('../dbUtils');

const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;

if (!tursoUrl) {
  console.error('\n❌ ERROR: TURSO_DATABASE_URL wajib diisi!');
  console.error('Contoh:');
  console.error('  npx cross-env TURSO_DATABASE_URL="libsql://db-anda.turso.io" TURSO_AUTH_TOKEN="token-anda" node server/scripts/sync-to-turso.js\n');
  process.exit(1);
}

const localDbPath = path.resolve(__dirname, '../pos_database.sqlite');
console.log('==================================================');
console.log('  Sinkronisasi Data POS ERTIGA -> Turso Cloud DB');
console.log('==================================================');
console.log('📁 Database Lokal:', localDbPath);
console.log('☁️ Turso URL     :', tursoUrl.replace(/:\/\/.*@/, '://***@'));

const localDb = new sqlite3.Database(localDbPath);
const tursoClient = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

const TABLES_TO_SYNC = [
  'pengaturan',
  'kategori',
  'barang',
  'banners',
  'logam_mulia_kategori',
  'logam_mulia_item',
  'smm_platform',
  'smm_layanan',
  'smm_paket',
  'flash_sale_settings',
  'flash_sale_items',
  'ppob_kategori',
  'ppob_item',
  'counter_nota',
  'stok_masuk',
  'transaksi',
  'detail_transaksi',
];

async function runSync() {
  try {
    console.log('\n[1/3] Menyiapkan skema tabel di Turso Cloud...');
    await initializeSchema(tursoClient, '');
    console.log('✅ Skema tabel siap di Turso.');

    console.log('\n[2/3] Menyalin data dari SQLite lokal ke Turso Cloud...');
    for (const table of TABLES_TO_SYNC) {
      // Ambil data lokal
      const rows = await new Promise((resolve, reject) => {
        localDb.all(`SELECT * FROM "${table}"`, (err, res) => {
          if (err) resolve([]); // jika tabel belum ada di lokal, skip
          else resolve(res || []);
        });
      });

      if (rows.length === 0) {
        console.log(` - Tabel "${table}": 0 data (lewati)`);
        continue;
      }

      // Batch insert ke Turso
      const columns = Object.keys(rows[0]);
      const placeholders = columns.map(() => '?').join(', ');
      const colNames = columns.map((c) => `"${c}"`).join(', ');
      const sql = `INSERT OR REPLACE INTO "${table}" (${colNames}) VALUES (${placeholders})`;

      let inserted = 0;
      for (const row of rows) {
        const values = columns.map((c) => row[c]);
        await dbUtils.run(tursoClient, sql, values);
        inserted++;
      }

      console.log(` - Tabel "${table}": ${inserted} data berhasil disalin ✅`);
    }

    console.log('\n[3/3] Memverifikasi data di Turso Cloud...');
    const checkBarang = await dbUtils.get(tursoClient, 'SELECT COUNT(*) AS total FROM barang');
    const checkPengaturan = await dbUtils.get(tursoClient, 'SELECT nama_toko FROM pengaturan LIMIT 1');

    console.log('==================================================');
    console.log('🎉 SINKRONISASI SELESAI & SUKSES!');
    console.log('📦 Total Barang di Turso:', checkBarang?.total || 0);
    console.log('🏪 Nama Toko di Turso   :', checkPengaturan?.nama_toko || '-');
    console.log('==================================================\n');
  } catch (err) {
    console.error('\n❌ Terjadi kesalahan saat sinkronisasi:', err);
    process.exit(1);
  } finally {
    localDb.close();
    if (typeof tursoClient.close === 'function') tursoClient.close();
  }
}

runSync();
