const path = require('path');
const fs = require('fs');
const { initializeSchema } = require('./migrations');
const dbUtils = require('./dbUtils');

// Cek apakah mode Cloud Turso / LibSQL aktif melalui Environment Variable
const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;

let db;
let dbPath;

if (tursoUrl) {
  const { createClient } = require('@libsql/client');
  const safeLogUrl = tursoUrl.replace(/:\/\/.*@/, '://***@');
  console.log('[DB] Mode Cloud: Terhubung ke Turso LibSQL (' + safeLogUrl + ')');
  db = createClient({
    url: tursoUrl,
    authToken: tursoToken,
  });
  dbPath = tursoUrl;
} else {
  const sqlite3 = require('sqlite3').verbose();
  // Produksi (Electron): USER_DATA_PATH diisi main.js dengan app.getPath('userData').
  // Development: file database berada di folder server/.
  dbPath = path.resolve(__dirname, 'pos_database.sqlite');
  if (process.env.USER_DATA_PATH) {
    dbPath = path.join(process.env.USER_DATA_PATH, 'pos_database.sqlite');
  }

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  console.log('[DB] Menggunakan database lokal:', dbPath);

  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('[DB] Gagal membuka database:', err.message);
    } else {
      console.log('[DB] Terhubung ke SQLite lokal.');
    }
  });
}

let initPromise = null;

function initializeDatabase() {
  if (initPromise) return initPromise;

  initPromise = initializeSchema(db, dbPath)
    .then((result) => {
      console.log(
        `[DB] Skema siap (versi ${result.version}).` +
          (result.backupPath ? ` Backup: ${result.backupPath}` : '')
      );
      return result;
    })
    .catch((error) => {
      console.error('[DB] Inisialisasi gagal:', error);
      throw error;
    });

  return initPromise;
}

function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (!db) return resolve();
    if (typeof db.close === 'function') {
      try {
        const res = db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
        if (res && typeof res.then === 'function') {
          res.then(resolve).catch(reject);
        }
      } catch (e) {
        resolve();
      }
    } else {
      resolve();
    }
  });
}

const run = (sql, params = []) => dbUtils.run(db, sql, params);
const get = (sql, params = []) => dbUtils.get(db, sql, params);
const all = (sql, params = []) => dbUtils.all(db, sql, params);
const exec = (sql) => dbUtils.exec(db, sql);

module.exports = {
  db,
  dbPath,
  initializeDatabase,
  closeDatabase,
  run,
  get,
  all,
  exec,
};
