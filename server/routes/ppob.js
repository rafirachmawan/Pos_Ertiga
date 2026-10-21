const express = require('express');
const { run, get, all } = require('../database');
const { asyncHandler, withWriteLock, httpError, toInt } = require('../helpers');

const router = express.Router();

// GET /api/ppob - Semua kategori & item PPOB untuk POS Manager
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const categories = await all(
      `SELECT * FROM ppob_kategori ORDER BY urutan ASC, id ASC`
    );

    const items = await all(
      `SELECT * FROM ppob_item ORDER BY urutan ASC, harga_jual ASC, id ASC`
    );

    const data = categories.map((cat) => ({
      ...cat,
      items: items.filter((it) => it.kategori_kode === cat.kode),
    }));

    res.json({ data, rawItems: items });
  })
);

// GET /api/ppob/items - Daftar flat semua item untuk quick select di kasir
router.get(
  '/items',
  asyncHandler(async (req, res) => {
    const items = await all(
      `SELECT pi.*, pk.nama AS nama_kategori
       FROM ppob_item pi
       LEFT JOIN ppob_kategori pk ON pi.kategori_kode = pk.kode
       WHERE pi.aktif = 1
       ORDER BY pi.kategori_kode ASC, pi.operator ASC, pi.harga_jual ASC`
    );
    res.json({ data: items });
  })
);

// POST /api/ppob/item - Tambah produk/layanan PPOB baru
router.post(
  '/item',
  asyncHandler(async (req, res) => {
    const {
      kategori_kode,
      operator,
      nama_produk,
      nominal,
      harga_modal,
      harga_jual,
      urutan,
      aktif,
    } = req.body;

    if (!kategori_kode) throw httpError(400, 'Kategori wajib dipilih');
    if (!operator) throw httpError(400, 'Operator / Provider wajib diisi');
    if (!nama_produk) throw httpError(400, 'Nama produk wajib diisi');
    if (harga_jual === undefined || harga_jual === null) {
      throw httpError(400, 'Harga jual wajib diisi');
    }

    const result = await withWriteLock(() =>
      run(
        `INSERT INTO ppob_item
         (kategori_kode, operator, nama_produk, nominal, harga_modal, harga_jual, urutan, aktif)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          String(kategori_kode).trim(),
          String(operator).trim(),
          String(nama_produk).trim(),
          String(nominal || '').trim(),
          toInt(harga_modal, 0),
          toInt(harga_jual, 0),
          toInt(urutan, 0),
          aktif === false || aktif === 0 || aktif === '0' ? 0 : 1,
        ]
      )
    );

    const newItem = await get(`SELECT * FROM ppob_item WHERE id = ?`, [
      result.lastID,
    ]);
    res.status(201).json({ data: newItem });
  })
);

// PUT /api/ppob/item/:id - Update item PPOB
router.put(
  '/item/:id',
  asyncHandler(async (req, res) => {
    const id = toInt(req.params.id, 0);
    const existing = await get(`SELECT * FROM ppob_item WHERE id = ?`, [id]);
    if (!existing) throw httpError(404, 'Item PPOB tidak ditemukan');

    const {
      kategori_kode,
      operator,
      nama_produk,
      nominal,
      harga_modal,
      harga_jual,
      urutan,
      aktif,
    } = req.body;

    await withWriteLock(() =>
      run(
        `UPDATE ppob_item
         SET kategori_kode = ?, operator = ?, nama_produk = ?, nominal = ?,
             harga_modal = ?, harga_jual = ?, urutan = ?, aktif = ?
         WHERE id = ?`,
        [
          kategori_kode ? String(kategori_kode).trim() : existing.kategori_kode,
          operator ? String(operator).trim() : existing.operator,
          nama_produk ? String(nama_produk).trim() : existing.nama_produk,
          nominal !== undefined ? String(nominal).trim() : existing.nominal,
          harga_modal !== undefined ? toInt(harga_modal, 0) : existing.harga_modal,
          harga_jual !== undefined ? toInt(harga_jual, 0) : existing.harga_jual,
          urutan !== undefined ? toInt(urutan, 0) : existing.urutan,
          aktif !== undefined
            ? aktif === false || aktif === 0 || aktif === '0'
              ? 0
              : 1
            : existing.aktif,
          id,
        ]
      )
    );

    const updated = await get(`SELECT * FROM ppob_item WHERE id = ?`, [id]);
    res.json({ data: updated });
  })
);

// PATCH /api/ppob/item/:id/toggle - Toggle status aktif item
router.patch(
  '/item/:id/toggle',
  asyncHandler(async (req, res) => {
    const id = toInt(req.params.id, 0);
    const item = await get(`SELECT id, aktif FROM ppob_item WHERE id = ?`, [id]);
    if (!item) throw httpError(404, 'Item tidak ditemukan');

    const newStatus = item.aktif === 1 ? 0 : 1;
    await withWriteLock(() =>
      run(`UPDATE ppob_item SET aktif = ? WHERE id = ?`, [newStatus, id])
    );

    res.json({ data: { id, aktif: newStatus } });
  })
);

// DELETE /api/ppob/item/:id - Hapus item PPOB
router.delete(
  '/item/:id',
  asyncHandler(async (req, res) => {
    const id = toInt(req.params.id, 0);
    const item = await get(`SELECT id FROM ppob_item WHERE id = ?`, [id]);
    if (!item) throw httpError(404, 'Item tidak ditemukan');

    await withWriteLock(() =>
      run(`DELETE FROM ppob_item WHERE id = ?`, [id])
    );

    res.json({ message: 'Item PPOB berhasil dihapus' });
  })
);

module.exports = router;
