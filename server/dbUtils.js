// Promise wrappers for sqlite3 callbacks dan LibSQL / Turso cloud.
// Semua modul server memakai helper ini agar kode async lebih mudah dibaca.

async function run(db, sql, params = []) {
  if (db && typeof db.execute === 'function') {
    const trimmed = String(sql || '').trim();
    if (/^BEGIN/i.test(trimmed)) {
      db._tx = await db.transaction('write');
      return { lastID: 0, changes: 0 };
    }
    if (/^COMMIT/i.test(trimmed)) {
      if (db._tx) {
        await db._tx.commit();
        db._tx = null;
      }
      return { lastID: 0, changes: 0 };
    }
    if (/^ROLLBACK/i.test(trimmed)) {
      if (db._tx) {
        try {
          await db._tx.rollback();
        } catch (_) {}
        db._tx = null;
      }
      return { lastID: 0, changes: 0 };
    }

    const target = db._tx || db;
    const res = await target.execute({ sql, args: params });
    return {
      lastID: Number(res.lastInsertRowid ?? 0),
      changes: Number(res.rowsAffected ?? 0),
    };
  }

  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function get(db, sql, params = []) {
  if (db && typeof db.execute === 'function') {
    const target = db._tx || db;
    const res = await target.execute({ sql, args: params });
    return res.rows[0] || null;
  }

  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function all(db, sql, params = []) {
  if (db && typeof db.execute === 'function') {
    const target = db._tx || db;
    const res = await target.execute({ sql, args: params });
    return Array.from(res.rows || []);
  }

  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function exec(db, sql) {
  if (db && typeof db.executeMultiple === 'function') {
    return await db.executeMultiple(sql);
  }
  if (db && typeof db.execute === 'function') {
    return await db.execute(sql);
  }

  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports = { run, get, all, exec };

