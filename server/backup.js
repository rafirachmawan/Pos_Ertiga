const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
let sqlite3;
try {
  sqlite3 = require('sqlite3');
} catch (_) {}

const { dbPath, run } = require('./database');
const { get, all } = require('./dbUtils');
const { localDateKey } = require('./utils/date');

const BACKUP_DIR = path.join(path.dirname(dbPath), 'backups');
const MAX_LOCAL_BACKUPS = 7;

function ensureBackupDir() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  return BACKUP_DIR;
}

function openDatabase(file) {
  if (!sqlite3) {
    return Promise.reject(new Error('SQLite driver tidak tersedia di runtime ini'));
  }
  return new Promise((resolve, reject) => {
    const connection = new sqlite3.Database(file, (err) => {
      if (err) reject(err);
      else resolve(connection);
    });
  });
}

function closeConnection(connection) {
  return new Promise((resolve, reject) => {
    connection.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function quoteValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (Buffer.isBuffer(value)) return `X'${value.toString('hex')}'`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function buildSqlDump(connection) {
  const versionRow = await get(connection, 'PRAGMA user_version');
  const tables = await all(
    connection,
    `SELECT name FROM sqlite_master
     WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
     ORDER BY name`
  );

  const lines = [
    '-- Backup POS Ertiga',
    `-- Dibuat: ${new Date().toISOString()}`,
    'PRAGMA foreign_keys = OFF;',
  ];

  if (versionRow?.user_version) {
    lines.push(`PRAGMA user_version = ${Number(versionRow.user_version)};`);
  }

  lines.push('BEGIN TRANSACTION;');

  for (const table of tables) {
    const tableName = table.name;
    const schema = await get(
      connection,
      `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?`,
      [tableName]
    );
    if (schema?.sql) lines.push(`${schema.sql};`);

    const columns = await all(
      connection,
      `PRAGMA table_info(${quoteIdentifier(tableName)})`
    );
    const columnNames = columns.map((column) => column.name);

    const rows = await all(
      connection,
      `SELECT * FROM ${quoteIdentifier(tableName)}`
    );

    for (const row of rows) {
      const values = columnNames.map((name) => quoteValue(row[name]));
      lines.push(
        `INSERT INTO ${quoteIdentifier(tableName)} (${columnNames
          .map(quoteIdentifier)
          .join(', ')}) VALUES (${values.join(', ')});`
      );
    }
  }

  lines.push('COMMIT;');
  return lines.join('\n');
}

function gzip(buffer) {
  return new Promise((resolve, reject) => {
    zlib.gzip(buffer, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function timestampForFile(date = new Date()) {
  const time = [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((part) => String(part).padStart(2, '0'))
    .join('');
  return `${localDateKey(date)}_${time}`;
}

async function createLocalBackup() {
  ensureBackupDir();

  const now = new Date();
  const fileName = `pos_ertiga_${timestampForFile(now)}.sql.gz`;
  const target = path.join(BACKUP_DIR, fileName);
  const snapshot = path.join(
    os.tmpdir(),
    `pos-ertiga-snapshot-${Date.now()}.sqlite`
  );

  try {
    const snapshotSql = snapshot.replace(/\\/g, '/').replace(/'/g, "''");
    await run(`VACUUM INTO '${snapshotSql}'`);

    const connection = await openDatabase(snapshot);
    let sql;
    try {
      sql = await buildSqlDump(connection);
    } finally {
      await closeConnection(connection);
    }

    const compressed = await gzip(Buffer.from(sql, 'utf8'));
    fs.writeFileSync(target, compressed);

    pruneOldBackups();

    const stat = fs.statSync(target);
    return {
      file: fileName,
      path: target,
      size: stat.size,
      createdAt: now.toISOString(),
    };
  } finally {
    fs.rmSync(snapshot, { force: true });
  }
}

function listLocalBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs
    .readdirSync(BACKUP_DIR)
    .filter((name) => name.endsWith('.sql.gz'))
    .map((name) => {
      const filePath = path.join(BACKUP_DIR, name);
      const stat = fs.statSync(filePath);
      return {
        file: name,
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      };
    })
    .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
}

function pruneOldBackups() {
  const backups = listLocalBackups();
  for (const backup of backups.slice(MAX_LOCAL_BACKUPS)) {
    fs.rmSync(path.join(BACKUP_DIR, backup.file), { force: true });
  }
}

function getLocalBackupStatus() {
  const backups = listLocalBackups();
  return {
    mode: 'local',
    directory: BACKUP_DIR,
    count: backups.length,
    lastBackupAt: backups[0]?.modifiedAt || null,
    lastBackupFile: backups[0]?.file || null,
    maxLocalBackups: MAX_LOCAL_BACKUPS,
  };
}

function resolveLocalBackup(fileName) {
  const safeName = path.basename(String(fileName || ''));
  if (!safeName.endsWith('.sql.gz')) return null;
  const filePath = path.join(BACKUP_DIR, safeName);
  return fs.existsSync(filePath) ? filePath : null;
}

module.exports = {
  BACKUP_DIR,
  createLocalBackup,
  listLocalBackups,
  getLocalBackupStatus,
  resolveLocalBackup,
};
