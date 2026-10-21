const express = require('express');
const { run, get, all } = require('../database');
const { asyncHandler, withWriteLock, httpError, toInt, toFloat } = require('../helpers');

const router = express.Router();

// ── KATEGORI / MERK LOGAM MULIA ──────────────────────────────

// GET /api/logam-mulia/kategori - Semua merk logam mulia
router.get(
  '/kategori',
  asyncHandler(async (req, res) => {
    const rows = await all(
      `SELECT k.*, 
        (SELECT COUNT(*) FROM logam_mulia_item i WHERE i.kategori_id = k.id AND i.aktif = 1) AS total_item_aktif,
        (SELECT COUNT(*) FROM logam_mulia_item i WHERE i.kategori_id = k.id) AS total_item
       FROM logam_mulia_kategori k
       ORDER BY k.urutan ASC, k.id ASC`
    );
    res.json({ data: rows });
  })
);

// POST /api/logam-mulia/kategori - Tambah merk baru (e.g. Antam, UBS, Mini Gold)
router.post(
  '/kategori',
  asyncHandler(async (req, res) => {
    const { nama_merk, keterangan, urutan, aktif } = req.body;
    if (!nama_merk || !String(nama_merk).trim()) {
      throw httpError(400, 'Nama merk / produsen emas wajib diisi');
    }

    const result = await withWriteLock(() =>
      run(
        `INSERT INTO logam_mulia_kategori (nama_merk, keterangan, urutan, aktif)
         VALUES (?, ?, ?, ?)`,
        [
          String(nama_merk).trim(),
          String(keterangan || '').trim(),
          toInt(urutan, 0),
          aktif === false || aktif === 0 || aktif === '0' ? 0 : 1,
        ]
      )
    );

    const created = await get(`SELECT * FROM logam_mulia_kategori WHERE id = ?`, [result.lastID]);
    res.status(201).json({ data: created });
  })
);

// PUT /api/logam-mulia/kategori/:id - Update merk
router.put(
  '/kategori/:id',
  asyncHandler(async (req, res) => {
    const { nama_merk, keterangan, urutan, aktif } = req.body;
    const existing = await get(`SELECT * FROM logam_mulia_kategori WHERE id = ?`, [req.params.id]);
    if (!existing) throw httpError(404, 'Merk logam mulia tidak ditemukan');

    await withWriteLock(() =>
      run(
        `UPDATE logam_mulia_kategori SET nama_merk=?, keterangan=?, urutan=?, aktif=?
         WHERE id=?`,
        [
          String(nama_merk ?? existing.nama_merk).trim(),
          String(keterangan ?? existing.keterangan).trim(),
          toInt(urutan ?? existing.urutan, 0),
          aktif === false || aktif === 0 || aktif === '0' ? 0 : 1,
          req.params.id,
        ]
      )
    );

    const updated = await get(`SELECT * FROM logam_mulia_kategori WHERE id = ?`, [req.params.id]);
    res.json({ data: updated });
  })
);

// DELETE /api/logam-mulia/kategori/:id - Hapus merk dan seluruh item di dalamnya
router.delete(
  '/kategori/:id',
  asyncHandler(async (req, res) => {
    const existing = await get(`SELECT * FROM logam_mulia_kategori WHERE id = ?`, [req.params.id]);
    if (!existing) throw httpError(404, 'Merk logam mulia tidak ditemukan');

    await withWriteLock(async () => {
      await run(`DELETE FROM logam_mulia_item WHERE kategori_id = ?`, [req.params.id]);
      await run(`DELETE FROM logam_mulia_kategori WHERE id = ?`, [req.params.id]);
    });

    res.json({ message: 'Merk dan varian emas berhasil dihapus' });
  })
);


// ── ITEM / GRAMATUR LOGAM MULIA ──────────────────────────────

// GET /api/logam-mulia/item - Daftar gramatur
router.get(
  '/item',
  asyncHandler(async (req, res) => {
    const { kategori_id } = req.query;
    let query = `
      SELECT i.*, k.nama_merk 
      FROM logam_mulia_item i
      JOIN logam_mulia_kategori k ON i.kategori_id = k.id
    `;
    const params = [];
    if (kategori_id) {
      query += ` WHERE i.kategori_id = ?`;
      params.push(kategori_id);
    }
    query += ` ORDER BY k.urutan ASC, i.harga_jual ASC, i.id ASC`;

    const rows = await all(query, params);
    res.json({ data: rows });
  })
);

// POST /api/logam-mulia/item - Tambah gramatur baru
router.post(
  '/item',
  asyncHandler(async (req, res) => {
    const {
      kategori_id,
      gramatur,
      harga_jual,
      harga_beli,
      stok,
      deskripsi,
      gambar,
      is_favorit,
      aktif,
    } = req.body;

    if (!kategori_id) throw httpError(400, 'Pilih merk/kategori emas');
    if (!gramatur || !String(gramatur).trim()) throw httpError(400, 'Ukuran gramatur wajib diisi (mis. 1 gr)');

    const kat = await get(`SELECT id FROM logam_mulia_kategori WHERE id = ?`, [kategori_id]);
    if (!kat) throw httpError(404, 'Merk emas tidak ditemukan');

    const result = await withWriteLock(() =>
      run(
        `INSERT INTO logam_mulia_item 
         (kategori_id, gramatur, harga_jual, harga_beli, stok, deskripsi, gambar, is_favorit, aktif)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          toInt(kategori_id),
          String(gramatur).trim(),
          toFloat(harga_jual, 0),
          toFloat(harga_beli, 0),
          toInt(stok, 0),
          String(deskripsi || '').trim(),
          String(gambar || '').trim(),
          is_favorit ? 1 : 0,
          aktif === false || aktif === 0 || aktif === '0' ? 0 : 1,
        ]
      )
    );

    const created = await get(
      `SELECT i.*, k.nama_merk 
       FROM logam_mulia_item i 
       JOIN logam_mulia_kategori k ON i.kategori_id = k.id 
       WHERE i.id = ?`,
      [result.lastID]
    );
    res.status(201).json({ data: created });
  })
);

// PUT /api/logam-mulia/item/:id - Update gramatur
router.put(
  '/item/:id',
  asyncHandler(async (req, res) => {
    const existing = await get(`SELECT * FROM logam_mulia_item WHERE id = ?`, [req.params.id]);
    if (!existing) throw httpError(404, 'Item emas tidak ditemukan');

    const {
      kategori_id,
      gramatur,
      harga_jual,
      harga_beli,
      stok,
      deskripsi,
      gambar,
      is_favorit,
      aktif,
    } = req.body;

    await withWriteLock(() =>
      run(
        `UPDATE logam_mulia_item SET 
         kategori_id=?, gramatur=?, harga_jual=?, harga_beli=?, stok=?, deskripsi=?, gambar=?, is_favorit=?, aktif=?
         WHERE id=?`,
        [
          toInt(kategori_id ?? existing.kategori_id),
          String(gramatur ?? existing.gramatur).trim(),
          toFloat(harga_jual ?? existing.harga_jual, 0),
          toFloat(harga_beli ?? existing.harga_beli, 0),
          toInt(stok ?? existing.stok, 0),
          String(deskripsi ?? existing.deskripsi).trim(),
          String(gambar ?? existing.gambar).trim(),
          is_favorit !== undefined ? (is_favorit ? 1 : 0) : existing.is_favorit,
          aktif !== undefined ? (aktif === false || aktif === 0 || aktif === '0' ? 0 : 1) : existing.aktif,
          req.params.id,
        ]
      )
    );

    const updated = await get(
      `SELECT i.*, k.nama_merk 
       FROM logam_mulia_item i 
       JOIN logam_mulia_kategori k ON i.kategori_id = k.id 
       WHERE i.id = ?`,
      [req.params.id]
    );
    res.json({ data: updated });
  })
);

// DELETE /api/logam-mulia/item/:id - Hapus gramatur
router.delete(
  '/item/:id',
  asyncHandler(async (req, res) => {
    const existing = await get(`SELECT * FROM logam_mulia_item WHERE id = ?`, [req.params.id]);
    if (!existing) throw httpError(404, 'Item emas tidak ditemukan');

    await withWriteLock(() =>
      run(`DELETE FROM logam_mulia_item WHERE id = ?`, [req.params.id])
    );

    res.json({ message: 'Varian emas berhasil dihapus' });
  })
);

module.exports = router;
