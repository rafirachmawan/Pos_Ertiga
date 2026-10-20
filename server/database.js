const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { initializeSchema } = require('./migrations');
const dbUtils = require('./dbUtils');

// Produksi (Electron): USER_DATA_PATH diisi main.js dengan app.getPath('userData').
// Development: file database berada di folder server/.
let dbPath = path.resolve(__dirname, 'pos_database.sqlite');
if (process.env.USER_DATA_PATH) {
  dbPath = path.join(process.env.USER_DATA_PATH, 'pos_database.sqlite');
}

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

console.log('[DB] Menggunakan database:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[DB] Gagal membuka database:', err.message);
  } else {
    console.log('[DB] Terhubung ke SQLite.');
  }
});

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
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
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
