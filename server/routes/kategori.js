const express = require('express');
const { run, get, all } = require('../database');
const {
  httpError,
  asyncHandler,
  withWriteLock,
  toInt,
} = require('../helpers');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await all(
      `SELECT k.*, 
              COUNT(CASE WHEN b.aktif = 1 AND b.deleted_at IS NULL THEN b.id END) AS total_produk
       FROM kategori k
       LEFT JOIN barang b ON b.kategori_id = k.id
       GROUP BY k.id
       ORDER BY k.nama_kategori ASC`
    );
    res.json({ data: rows });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const nama = String(req.body.nama_kategori ?? '').trim();
    if (!nama) throw httpError(400, 'Nama kategori wajib diisi');
    if (nama.length > 100) {
      throw httpError(400, 'Nama kategori maksimal 100 karakter');
    }

    try {
      const result = await run(
        'INSERT INTO kategori (nama_kategori) VALUES (?)',
        [nama]
      );
      res.json({
        id: result.lastID,
        nama_kategori: nama,
        message: 'Kategori ditambahkan',
      });
    } catch (err) {
      if (String(err.message).includes('UNIQUE')) {
        throw httpError(400, 'Kategori sudah ada');
      }
      throw err;
    }
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = toInt(req.params.id, 0);
    const nama = String(req.body.nama_kategori ?? '').trim();
    if (id <= 0) throw httpError(400, 'ID kategori tidak valid');
    if (!nama) throw httpError(400, 'Nama kategori wajib diisi');

    try {
      const result = await run(
        'UPDATE kategori SET nama_kategori = ? WHERE id = ?',
        [nama, id]
      );
      if (!result.changes) throw httpError(404, 'Kategori tidak ditemukan');
      res.json({ message: 'Kategori berhasil diupdate' });
    } catch (err) {
      if (String(err.message).includes('UNIQUE')) {
        throw httpError(400, 'Kategori sudah ada');
      }
      throw err;
    }
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = toInt(req.params.id, 0);
    if (id <= 0) throw httpError(400, 'ID kategori tidak valid');

    await withWriteLock(async () => {
      const existing = await get('SELECT id FROM kategori WHERE id = ?', [id]);
      if (!existing) throw httpError(404, 'Kategori tidak ditemukan');

      await run('BEGIN IMMEDIATE');
      try {
        // Lepaskan referensi dari produk sebelum menghapus kategori.
        await run('UPDATE barang SET kategori_id = NULL WHERE kategori_id = ?', [
          id,
        ]);
        await run('DELETE FROM kategori WHERE id = ?', [id]);
        await run('COMMIT');
        res.json({ message: 'Kategori dihapus' });
      } catch (err) {
        await run('ROLLBACK').catch(() => {});
        throw err;
      }
    });
  })
);

module.exports = router;
