const express = require('express');
const { run, get, all } = require('../database');
const {
  httpError,
  asyncHandler,
  withWriteLock,
  toInt,
} = require('../helpers');

const router = express.Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const barangId = toInt(req.body.barang_id, 0);
    const qty = toInt(req.body.qty, 0);
    const keterangan = String(req.body.keterangan || 'Restock manual').slice(
      0,
      500
    );

    if (barangId <= 0) throw httpError(400, 'Barang tidak valid');
    if (qty <= 0) throw httpError(400, 'Qty harus lebih dari 0');

    const message = await withWriteLock(async () => {
      await run('BEGIN IMMEDIATE');
      try {
        const barang = await get('SELECT id FROM barang WHERE id = ?', [
          barangId,
        ]);
        if (!barang) throw httpError(404, 'Barang tidak ditemukan');

        await run(
          `INSERT INTO stok_masuk (barang_id, qty, keterangan)
           VALUES (?, ?, ?)`,
          [barangId, qty, keterangan]
        );

        await run('UPDATE barang SET stok = stok + ? WHERE id = ?', [
          qty,
          barangId,
        ]);

        await run('COMMIT');
        return 'Stok berhasil ditambahkan';
      } catch (err) {
        await run('ROLLBACK').catch(() => {});
        throw err;
      }
    });

    res.json({ message });
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await all(
      `SELECT sm.*,
              COALESCE(b.nama_barang, 'Barang dihapus') AS nama_barang,
              COALESCE(b.barcode, '-') AS barcode
       FROM stok_masuk sm
       LEFT JOIN barang b ON sm.barang_id = b.id
       ORDER BY sm.tanggal DESC, sm.id DESC`
    );
    res.json({ data: rows });
  })
);

module.exports = router;
