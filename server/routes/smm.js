const express = require('express');
const { run, get, all } = require('../database');
const { asyncHandler, withWriteLock, httpError, toInt, toFloat } = require('../helpers');

const router = express.Router();

// ── GET ALL HIERARCHICAL DATA (For Admin UI) ─────────────────
router.get(
  '/all',
  asyncHandler(async (req, res) => {
    const platforms = await all(
      `SELECT * FROM smm_platform ORDER BY urutan ASC, id ASC`
    );
    const services = await all(
      `SELECT * FROM smm_layanan ORDER BY urutan ASC, id ASC`
    );
    const packages = await all(
      `SELECT * FROM smm_paket ORDER BY urutan ASC, harga_jual ASC, id ASC`
    );

    const data = platforms.map((p) => {
      const pServices = services
        .filter((s) => s.platform_id === p.id)
        .map((s) => ({
          ...s,
          packages: packages.filter((pkg) => pkg.layanan_id === s.id),
        }));
      return {
        ...p,
        services: pServices,
      };
    });

    res.json({ data });
  })
);

// ── PLATFORM CRUD ─────────────────────────────────────────────
router.get(
  '/platform',
  asyncHandler(async (req, res) => {
    const rows = await all(
      `SELECT p.*,
        (SELECT COUNT(*) FROM smm_layanan l WHERE l.platform_id = p.id) as total_layanan,
        (SELECT COUNT(*) FROM smm_paket k JOIN smm_layanan l ON k.layanan_id = l.id WHERE l.platform_id = p.id) as total_paket
       FROM smm_platform p
       ORDER BY p.urutan ASC, p.id ASC`
    );
    res.json({ data: rows });
  })
);

router.post(
  '/platform',
  asyncHandler(async (req, res) => {
    const { nama_platform, slug, color, icon, deskripsi, urutan, aktif } = req.body;
    if (!nama_platform || !String(nama_platform).trim()) {
      throw httpError(400, 'Nama platform wajib diisi');
    }

    const result = await withWriteLock(() =>
      run(
        `INSERT INTO smm_platform (nama_platform, slug, color, icon, deskripsi, urutan, aktif)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          String(nama_platform).trim(),
          String(slug || nama_platform).toLowerCase().replace(/[^a-z0-9]/g, ''),
          String(color || '#000000').trim(),
          String(icon || '').trim(),
          String(deskripsi || '').trim(),
          toInt(urutan, 0),
          aktif === false || aktif === 0 || aktif === '0' ? 0 : 1,
        ]
      )
    );

    const created = await get(`SELECT * FROM smm_platform WHERE id = ?`, [result.lastID]);
    res.status(201).json({ data: created });
  })
);

router.put(
  '/platform/:id',
  asyncHandler(async (req, res) => {
    const { nama_platform, slug, color, icon, deskripsi, urutan, aktif } = req.body;
    const existing = await get(`SELECT * FROM smm_platform WHERE id = ?`, [req.params.id]);
    if (!existing) throw httpError(404, 'Platform tidak ditemukan');

    await withWriteLock(() =>
      run(
        `UPDATE smm_platform SET nama_platform=?, slug=?, color=?, icon=?, deskripsi=?, urutan=?, aktif=?
         WHERE id=?`,
        [
          String(nama_platform ?? existing.nama_platform).trim(),
          String(slug ?? existing.slug).toLowerCase().replace(/[^a-z0-9]/g, ''),
          String(color ?? existing.color).trim(),
          String(icon ?? existing.icon).trim(),
          String(deskripsi ?? existing.deskripsi).trim(),
          toInt(urutan ?? existing.urutan, 0),
          aktif === false || aktif === 0 || aktif === '0' ? 0 : 1,
          req.params.id,
        ]
      )
    );

    const updated = await get(`SELECT * FROM smm_platform WHERE id = ?`, [req.params.id]);
    res.json({ data: updated });
  })
);

router.delete(
  '/platform/:id',
  asyncHandler(async (req, res) => {
    const existing = await get(`SELECT * FROM smm_platform WHERE id = ?`, [req.params.id]);
    if (!existing) throw httpError(404, 'Platform tidak ditemukan');

    await withWriteLock(async () => {
      // Delete cascade packages and services
      await run(
        `DELETE FROM smm_paket WHERE layanan_id IN (SELECT id FROM smm_layanan WHERE platform_id = ?)`,
        [req.params.id]
      );
      await run(`DELETE FROM smm_layanan WHERE platform_id = ?`, [req.params.id]);
      await run(`DELETE FROM smm_platform WHERE id = ?`, [req.params.id]);
    });

    res.json({ message: 'Platform dan seluruh layanan berhasil dihapus' });
  })
);

// ── LAYANAN CRUD ──────────────────────────────────────────────
router.get(
  '/layanan',
  asyncHandler(async (req, res) => {
    const { platform_id } = req.query;
    let query = `
      SELECT l.*, p.nama_platform,
        (SELECT COUNT(*) FROM smm_paket k WHERE k.layanan_id = l.id) as total_paket
      FROM smm_layanan l
      JOIN smm_platform p ON l.platform_id = p.id
    `;
    const params = [];
    if (platform_id) {
      query += ` WHERE l.platform_id = ?`;
      params.push(platform_id);
    }
    query += ` ORDER BY p.urutan ASC, l.urutan ASC, l.id ASC`;

    const rows = await all(query, params);
    res.json({ data: rows });
  })
);

router.post(
  '/layanan',
  asyncHandler(async (req, res) => {
    const { platform_id, nama_layanan, target_type, deskripsi, urutan, aktif } = req.body;
    if (!platform_id) throw httpError(400, 'Pilih platform media sosial');
    if (!nama_layanan || !String(nama_layanan).trim()) {
      throw httpError(400, 'Nama layanan wajib diisi');
    }

    const plat = await get(`SELECT id FROM smm_platform WHERE id = ?`, [platform_id]);
    if (!plat) throw httpError(404, 'Platform tidak ditemukan');

    const result = await withWriteLock(() =>
      run(
        `INSERT INTO smm_layanan (platform_id, nama_layanan, target_type, deskripsi, urutan, aktif)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          toInt(platform_id),
          String(nama_layanan).trim(),
          String(target_type || 'Username / Profil').trim(),
          String(deskripsi || '').trim(),
          toInt(urutan, 0),
          aktif === false || aktif === 0 || aktif === '0' ? 0 : 1,
        ]
      )
    );

    const created = await get(`SELECT * FROM smm_layanan WHERE id = ?`, [result.lastID]);
    res.status(201).json({ data: created });
  })
);

router.put(
  '/layanan/:id',
  asyncHandler(async (req, res) => {
    const { platform_id, nama_layanan, target_type, deskripsi, urutan, aktif } = req.body;
    const existing = await get(`SELECT * FROM smm_layanan WHERE id = ?`, [req.params.id]);
    if (!existing) throw httpError(404, 'Layanan tidak ditemukan');

    await withWriteLock(() =>
      run(
        `UPDATE smm_layanan SET platform_id=?, nama_layanan=?, target_type=?, deskripsi=?, urutan=?, aktif=?
         WHERE id=?`,
        [
          toInt(platform_id ?? existing.platform_id),
          String(nama_layanan ?? existing.nama_layanan).trim(),
          String(target_type ?? existing.target_type).trim(),
          String(deskripsi ?? existing.deskripsi).trim(),
          toInt(urutan ?? existing.urutan, 0),
          aktif === false || aktif === 0 || aktif === '0' ? 0 : 1,
          req.params.id,
        ]
      )
    );

    const updated = await get(`SELECT * FROM smm_layanan WHERE id = ?`, [req.params.id]);
    res.json({ data: updated });
  })
);

router.delete(
  '/layanan/:id',
  asyncHandler(async (req, res) => {
    const existing = await get(`SELECT * FROM smm_layanan WHERE id = ?`, [req.params.id]);
    if (!existing) throw httpError(404, 'Layanan tidak ditemukan');

    await withWriteLock(async () => {
      await run(`DELETE FROM smm_paket WHERE layanan_id = ?`, [req.params.id]);
      await run(`DELETE FROM smm_layanan WHERE id = ?`, [req.params.id]);
    });

    res.json({ message: 'Layanan dan paket berhasil dihapus' });
  })
);

// ── PAKET / TIERS CRUD ────────────────────────────────────────
router.get(
  '/paket',
  asyncHandler(async (req, res) => {
    const { layanan_id } = req.query;
    let query = `
      SELECT k.*, l.nama_layanan, p.nama_platform
      FROM smm_paket k
      JOIN smm_layanan l ON k.layanan_id = l.id
      JOIN smm_platform p ON l.platform_id = p.id
    `;
    const params = [];
    if (layanan_id) {
      query += ` WHERE k.layanan_id = ?`;
      params.push(layanan_id);
    }
    query += ` ORDER BY p.urutan ASC, l.urutan ASC, k.harga_jual ASC, k.id ASC`;

    const rows = await all(query, params);
    res.json({ data: rows });
  })
);

router.post(
  '/paket',
  asyncHandler(async (req, res) => {
    const { layanan_id, jumlah_order, harga_jual, harga_modal, is_popular, deskripsi, urutan, aktif } = req.body;
    if (!layanan_id) throw httpError(400, 'Pilih layanan sosmed');
    if (!jumlah_order || toInt(jumlah_order, 0) <= 0) {
      throw httpError(400, 'Jumlah kuantitas order harus lebih dari 0');
    }
    if (harga_jual === undefined || toFloat(harga_jual, 0) < 0) {
      throw httpError(400, 'Harga jual wajib diisi');
    }

    const lay = await get(`SELECT id FROM smm_layanan WHERE id = ?`, [layanan_id]);
    if (!lay) throw httpError(404, 'Layanan sosmed tidak ditemukan');

    const result = await withWriteLock(() =>
      run(
        `INSERT INTO smm_paket (layanan_id, jumlah_order, harga_jual, harga_modal, is_popular, deskripsi, urutan, aktif)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          toInt(layanan_id),
          toInt(jumlah_order),
          toFloat(harga_jual, 0),
          toFloat(harga_modal, 0),
          is_popular === true || is_popular === 1 || is_popular === '1' ? 1 : 0,
          String(deskripsi || '').trim(),
          toInt(urutan, 0),
          aktif === false || aktif === 0 || aktif === '0' ? 0 : 1,
        ]
      )
    );

    const created = await get(`SELECT * FROM smm_paket WHERE id = ?`, [result.lastID]);
    res.status(201).json({ data: created });
  })
);

router.put(
  '/paket/:id',
  asyncHandler(async (req, res) => {
    const { layanan_id, jumlah_order, harga_jual, harga_modal, is_popular, deskripsi, urutan, aktif } = req.body;
    const existing = await get(`SELECT * FROM smm_paket WHERE id = ?`, [req.params.id]);
    if (!existing) throw httpError(404, 'Paket tidak ditemukan');

    await withWriteLock(() =>
      run(
        `UPDATE smm_paket SET
          layanan_id=?, jumlah_order=?, harga_jual=?, harga_modal=?, is_popular=?, deskripsi=?, urutan=?, aktif=?
         WHERE id=?`,
        [
          toInt(layanan_id ?? existing.layanan_id),
          toInt(jumlah_order ?? existing.jumlah_order),
          toFloat(harga_jual ?? existing.harga_jual, 0),
          toFloat(harga_modal ?? existing.harga_modal, 0),
          is_popular === true || is_popular === 1 || is_popular === '1' ? 1 : 0,
          String(deskripsi ?? existing.deskripsi).trim(),
          toInt(urutan ?? existing.urutan, 0),
          aktif === false || aktif === 0 || aktif === '0' ? 0 : 1,
          req.params.id,
        ]
      )
    );

    const updated = await get(`SELECT * FROM smm_paket WHERE id = ?`, [req.params.id]);
    res.json({ data: updated });
  })
);

router.delete(
  '/paket/:id',
  asyncHandler(async (req, res) => {
    const existing = await get(`SELECT * FROM smm_paket WHERE id = ?`, [req.params.id]);
    if (!existing) throw httpError(404, 'Paket tidak ditemukan');

    await withWriteLock(() =>
      run(`DELETE FROM smm_paket WHERE id = ?`, [req.params.id])
    );

    res.json({ message: 'Paket berhasil dihapus' });
  })
);

module.exports = router;
