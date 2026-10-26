const express = require('express');
const { run, get, all } = require('../database');
const { asyncHandler, withWriteLock, httpError, toInt } = require('../helpers');

const router = express.Router();

// GET /api/banners - Semua banner (admin)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await all(
      `SELECT * FROM banners ORDER BY urutan ASC, id ASC`
    );
    res.json({ data: rows });
  })
);

// GET /api/banners/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const row = await get(`SELECT * FROM banners WHERE id = ?`, [req.params.id]);
    if (!row) throw httpError(404, 'Banner tidak ditemukan');
    res.json({ data: row });
  })
);

// POST /api/banners - Tambah banner baru
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { judul, subjudul, badge, gambar, warna_bg, warna_accent, link, urutan, aktif, tipe } = req.body;

    const result = await withWriteLock(() =>
      run(
        `INSERT INTO banners (judul, subjudul, badge, gambar, warna_bg, warna_accent, link, urutan, aktif, tipe)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          String(judul || '').trim(),
          String(subjudul || '').trim(),
          String(badge || '').trim(),
          String(gambar || '').trim(),
          String(warna_bg || 'linear-gradient(135deg, #0A4D2E 0%, #03AC0E 100%)').trim(),
          String(warna_accent || '#FFD700').trim(),
          String(link || '').trim(),
          toInt(urutan, 0),
          aktif === false || aktif === 0 || aktif === '0' ? 0 : 1,
          String(tipe || 'side').trim(),
        ]
      )
    );

    const newBanner = await get(`SELECT * FROM banners WHERE id = ?`, [result.lastID]);
    res.status(201).json({ data: newBanner });
  })
);

// PUT /api/banners/:id - Update banner
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { judul, subjudul, badge, gambar, warna_bg, warna_accent, link, urutan, aktif, tipe } = req.body;

    const existing = await get(`SELECT * FROM banners WHERE id = ?`, [req.params.id]);
    if (!existing) throw httpError(404, 'Banner tidak ditemukan');

    await withWriteLock(() =>
      run(
        `UPDATE banners SET judul=?, subjudul=?, badge=?, gambar=?, warna_bg=?, warna_accent=?, link=?, urutan=?, aktif=?, tipe=?
         WHERE id=?`,
        [
          String(judul ?? existing.judul).trim(),
          String(subjudul ?? existing.subjudul).trim(),
          String(badge ?? existing.badge).trim(),
          String(gambar ?? existing.gambar).trim(),
          String(warna_bg ?? existing.warna_bg).trim(),
          String(warna_accent ?? existing.warna_accent).trim(),
          String(link ?? existing.link).trim(),
          toInt(urutan ?? existing.urutan, 0),
          aktif === false || aktif === 0 || aktif === '0' ? 0 : 1,
          String(tipe ?? existing.tipe ?? 'side').trim(),
          req.params.id,
        ]
      )
    );

    const updated = await get(`SELECT * FROM banners WHERE id = ?`, [req.params.id]);
    res.json({ data: updated });
  })
);

// DELETE /api/banners/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await get(`SELECT * FROM banners WHERE id = ?`, [req.params.id]);
    if (!existing) throw httpError(404, 'Banner tidak ditemukan');

    await withWriteLock(() =>
      run(`DELETE FROM banners WHERE id = ?`, [req.params.id])
    );

    res.json({ message: 'Banner berhasil dihapus' });
  })
);

module.exports = router;
