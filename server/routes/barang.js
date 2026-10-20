const express = require('express');
const { run, get, all } = require('../database');
const {
  httpError,
  asyncHandler,
  withWriteLock,
  toInt,
} = require('../helpers');

const router = express.Router();

function normalizeBarang(body) {
  const barcode = String(body.barcode ?? '').trim();
  const namaBarang = String(body.nama_barang ?? '').trim();

  if (!barcode) throw httpError(400, 'Barcode / SKU wajib diisi');
  if (barcode.length > 50) throw httpError(400, 'Barcode maksimal 50 karakter');
  if (!namaBarang) throw httpError(400, 'Nama barang wajib diisi');
  if (namaBarang.length > 250) {
    throw httpError(400, 'Nama barang maksimal 250 karakter');
  }

  const hargaModal = toInt(body.harga_modal, 0);
  const hargaJual = toInt(body.harga_jual, 0);
  const stok = toInt(body.stok, 0);

  if (hargaModal < 0 || hargaJual < 0 || stok < 0) {
    throw httpError(400, 'Harga dan stok tidak boleh negatif');
  }

  const gambar = String(body.gambar ?? '');
  if (gambar.length > 8 * 1024 * 1024) {
    throw httpError(400, 'Ukuran gambar terlalu besar (maksimal 8 MB)');
  }

  let kategoriId = body.kategori_id;
  if (kategoriId === '' || kategoriId === undefined || kategoriId === null) {
    kategoriId = null;
  } else {
    kategoriId = toInt(kategoriId, 0);
    if (kategoriId <= 0) kategoriId = null;
  }

  const beratGram = Math.max(0, toInt(body.berat_gram, 0));
  const tampilOnline =
    body.tampil_online === undefined ? 1 : Number(body.tampil_online) ? 1 : 0;

  return {
    barcode,
    nama_barang: namaBarang,
    harga_modal: hargaModal,
    harga_jual: hargaJual,
    stok,
    gambar,
    satuan: String(body.satuan || 'pcs').slice(0, 20),
    kategori_id: kategoriId,
    berat_gram: beratGram,
    tampil_online: tampilOnline,
  };
}

// Daftar barang. Default hanya yang aktif.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const showAll = req.query.semua === '1' || req.query.semua === 'true';
    const ringkas = req.query.ringkas === '1' || req.query.ringkas === 'true';

    const columns = ringkas
      ? `b.id, b.barcode, b.nama_barang, b.harga_modal, b.harga_jual,
         b.stok, b.satuan, b.kategori_id, b.berat_gram, b.tampil_online, b.aktif, b.created_at`
      : 'b.*';

    const where = showAll ? '' : 'WHERE b.aktif = 1';
    const rows = await all(
      `SELECT ${columns}, k.nama_kategori
       FROM barang b
       LEFT JOIN kategori k ON b.kategori_id = k.id
       ${where}
       ORDER BY b.created_at DESC, b.id DESC`
    );

    res.json({ data: rows });
  })
);

// Pencarian berdasarkan barcode (hanya barang aktif).
router.get(
  '/barcode/:barcode',
  asyncHandler(async (req, res) => {
    const row = await get(
      `SELECT * FROM barang WHERE barcode = ? AND aktif = 1`,
      [req.params.barcode]
    );
    if (!row) throw httpError(404, 'Barang tidak ditemukan');
    res.json({ data: row });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = normalizeBarang(req.body);

    if (data.kategori_id) {
      const kategori = await get('SELECT id FROM kategori WHERE id = ?', [
        data.kategori_id,
      ]);
      if (!kategori) throw httpError(400, 'Kategori tidak ditemukan');
    }

    try {
      const result = await run(
        `INSERT INTO barang
         (barcode, nama_barang, harga_modal, harga_jual, stok, gambar, satuan, kategori_id, berat_gram, tampil_online)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.barcode,
          data.nama_barang,
          data.harga_modal,
          data.harga_jual,
          data.stok,
          data.gambar,
          data.satuan,
          data.kategori_id,
          data.berat_gram,
          data.tampil_online,
        ]
      );

      res.json({
        id: result.lastID,
        message: 'Barang berhasil ditambahkan',
      });
    } catch (err) {
      if (String(err.message).includes('UNIQUE')) {
        throw httpError(400, 'Barcode / SKU sudah digunakan');
      }
      throw err;
    }
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = toInt(req.params.id, 0);
    if (id <= 0) throw httpError(400, 'ID barang tidak valid');

    const existing = await get('SELECT * FROM barang WHERE id = ?', [id]);
    if (!existing) throw httpError(404, 'Barang tidak ditemukan');

    const data = normalizeBarang({ ...existing, ...req.body });

    if (data.kategori_id) {
      const kategori = await get('SELECT id FROM kategori WHERE id = ?', [
        data.kategori_id,
      ]);
      if (!kategori) throw httpError(400, 'Kategori tidak ditemukan');
    }

    try {
      const result = await run(
        `UPDATE barang
         SET barcode = ?, nama_barang = ?, harga_modal = ?, harga_jual = ?,
             stok = ?, gambar = ?, satuan = ?, kategori_id = ?, berat_gram = ?, tampil_online = ?
         WHERE id = ?`,
        [
          data.barcode,
          data.nama_barang,
          data.harga_modal,
          data.harga_jual,
          data.stok,
          data.gambar,
          data.satuan,
          data.kategori_id,
          data.berat_gram,
          data.tampil_online,
          id,
        ]
      );

      res.json({
        changes: result.changes,
        message: 'Barang berhasil diupdate',
      });
    } catch (err) {
      if (String(err.message).includes('UNIQUE')) {
        throw httpError(400, 'Barcode / SKU sudah digunakan');
      }
      throw err;
    }
  })
);

// Soft delete jika barang sudah punya riwayat; hard delete jika belum.
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = toInt(req.params.id, 0);
    if (id <= 0) throw httpError(400, 'ID barang tidak valid');

    await withWriteLock(async () => {
      const existing = await get('SELECT id FROM barang WHERE id = ?', [id]);
      if (!existing) throw httpError(404, 'Barang tidak ditemukan');

      const usage = await get(
        `SELECT
           (SELECT COUNT(*) FROM detail_transaksi WHERE barang_id = ?) +
           (SELECT COUNT(*) FROM stok_masuk WHERE barang_id = ?) AS total`,
        [id, id]
      );

      if (usage && usage.total > 0) {
        await run(
          `UPDATE barang
           SET aktif = 0, deleted_at = datetime('now')
           WHERE id = ?`,
          [id]
        );
        res.json({
          changes: 1,
          softDeleted: true,
          message:
            'Barang sudah memiliki riwayat transaksi, jadi dinonaktifkan (tidak dihapus permanen).',
        });
        return;
      }

      const result = await run('DELETE FROM barang WHERE id = ?', [id]);
      res.json({
        changes: result.changes,
        softDeleted: false,
        message: 'Barang berhasil dihapus',
      });
    });
  })
);

router.post(
  '/:id/restore',
  asyncHandler(async (req, res) => {
    const id = toInt(req.params.id, 0);
    if (id <= 0) throw httpError(400, 'ID barang tidak valid');

    const result = await run(
      `UPDATE barang SET aktif = 1, deleted_at = NULL WHERE id = ?`,
      [id]
    );
    if (!result.changes) throw httpError(404, 'Barang tidak ditemukan');
    res.json({ message: 'Barang berhasil diaktifkan kembali' });
  })
);

module.exports = router;
