const express = require('express');
const { run, get, all } = require('../database');
const { asyncHandler, withWriteLock, httpError, toInt } = require('../helpers');

const router = express.Router();

// GET /api/flash-sale - Ambil settings dan semua items (admin)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    let settings = await get(`SELECT * FROM flash_sale_settings WHERE id = 1`);
    if (!settings) {
      settings = {
        id: 1,
        judul: 'FLASH SALE',
        subjudul: 'Promo Terbatas Hari Ini',
        badge_text: '⚡ FLASH SALE',
        aktif: 1,
        jam_selesai: '22:00',
        durasi_jam: 3,
      };
    }

    const items = await all(
      `SELECT fsi.*, b.nama_barang AS barang_nama, b.stok AS barang_stok, b.harga_jual AS barang_harga_jual
       FROM flash_sale_items fsi
       LEFT JOIN barang b ON fsi.barang_id = b.id
       ORDER BY fsi.urutan ASC, fsi.id ASC`
    );

    res.json({
      data: {
        settings,
        items,
      },
    });
  })
);

// PUT /api/flash-sale/settings - Update settings flash sale
router.put(
  '/settings',
  asyncHandler(async (req, res) => {
    const { judul, subjudul, badge_text, aktif, jam_selesai, durasi_jam } = req.body;

    await withWriteLock(() =>
      run(
        `UPDATE flash_sale_settings
         SET judul = ?, subjudul = ?, badge_text = ?, aktif = ?, jam_selesai = ?, durasi_jam = ?
         WHERE id = 1`,
        [
          String(judul || 'FLASH SALE').trim(),
          String(subjudul || 'Promo Terbatas Hari Ini').trim(),
          String(badge_text || '⚡ FLASH SALE').trim(),
          aktif === false || aktif === 0 || aktif === '0' ? 0 : 1,
          String(jam_selesai || '22:00').trim(),
          toInt(durasi_jam, 3),
        ]
      )
    );

    const updated = await get(`SELECT * FROM flash_sale_settings WHERE id = 1`);
    res.json({ data: updated });
  })
);

// POST /api/flash-sale/items - Tambah item flash sale baru
router.post(
  '/items',
  asyncHandler(async (req, res) => {
    const {
      barang_id,
      nama_item,
      gambar,
      harga_asli,
      harga_diskon,
      diskon_persen,
      terjual_pct,
      tipe,
      target_link,
      urutan,
      aktif,
    } = req.body;

    if (!nama_item || !nama_item.trim()) {
      throw httpError(400, 'Nama item flash sale wajib diisi');
    }

    const hAsli = toInt(harga_asli, 0);
    const hDiskon = toInt(harga_diskon, 0);

    // Auto-calculate diskon_persen jika tidak disediakan
    let pctText = diskon_persen;
    if (!pctText && hAsli > 0 && hDiskon < hAsli) {
      const calcPct = Math.round(((hAsli - hDiskon) / hAsli) * 100);
      pctText = `-${calcPct}%`;
    }

    const result = await withWriteLock(() =>
      run(
        `INSERT INTO flash_sale_items (
          barang_id, nama_item, gambar, harga_asli, harga_diskon,
          diskon_persen, terjual_pct, tipe, target_link, urutan, aktif
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          barang_id ? toInt(barang_id, null) : null,
          String(nama_item).trim(),
          String(gambar || '').trim(),
          hAsli,
          hDiskon,
          String(pctText || '-10%').trim(),
          Math.min(100, Math.max(0, toInt(terjual_pct, 75))),
          String(tipe || 'product').trim(),
          String(target_link || '').trim(),
          toInt(urutan, 0),
          aktif === false || aktif === 0 || aktif === '0' ? 0 : 1,
        ]
      )
    );

    const newItem = await get(`SELECT * FROM flash_sale_items WHERE id = ?`, [result.lastID]);
    res.status(201).json({ data: newItem });
  })
);

// PUT /api/flash-sale/items/:id - Update item flash sale
router.put(
  '/items/:id',
  asyncHandler(async (req, res) => {
    const existing = await get(`SELECT * FROM flash_sale_items WHERE id = ?`, [req.params.id]);
    if (!existing) throw httpError(404, 'Item flash sale tidak ditemukan');

    const {
      barang_id,
      nama_item,
      gambar,
      harga_asli,
      harga_diskon,
      diskon_persen,
      terjual_pct,
      tipe,
      target_link,
      urutan,
      aktif,
    } = req.body;

    const hAsli = harga_asli !== undefined ? toInt(harga_asli, 0) : existing.harga_asli;
    const hDiskon = harga_diskon !== undefined ? toInt(harga_diskon, 0) : existing.harga_diskon;

    let pctText = diskon_persen !== undefined ? diskon_persen : existing.diskon_persen;
    if (!pctText && hAsli > 0 && hDiskon < hAsli) {
      const calcPct = Math.round(((hAsli - hDiskon) / hAsli) * 100);
      pctText = `-${calcPct}%`;
    }

    await withWriteLock(() =>
      run(
        `UPDATE flash_sale_items SET
          barang_id = ?,
          nama_item = ?,
          gambar = ?,
          harga_asli = ?,
          harga_diskon = ?,
          diskon_persen = ?,
          terjual_pct = ?,
          tipe = ?,
          target_link = ?,
          urutan = ?,
          aktif = ?
        WHERE id = ?`,
        [
          barang_id !== undefined ? (barang_id ? toInt(barang_id, null) : null) : existing.barang_id,
          String(nama_item ?? existing.nama_item).trim(),
          String(gambar ?? existing.gambar).trim(),
          hAsli,
          hDiskon,
          String(pctText).trim(),
          Math.min(100, Math.max(0, toInt(terjual_pct ?? existing.terjual_pct, 75))),
          String(tipe ?? existing.tipe).trim(),
          String(target_link ?? existing.target_link).trim(),
          toInt(urutan ?? existing.urutan, 0),
          aktif !== undefined ? (aktif === false || aktif === 0 || aktif === '0' ? 0 : 1) : existing.aktif,
          req.params.id,
        ]
      )
    );

    const updated = await get(`SELECT * FROM flash_sale_items WHERE id = ?`, [req.params.id]);
    res.json({ data: updated });
  })
);

// DELETE /api/flash-sale/items/:id - Hapus item flash sale
router.delete(
  '/items/:id',
  asyncHandler(async (req, res) => {
    const existing = await get(`SELECT * FROM flash_sale_items WHERE id = ?`, [req.params.id]);
    if (!existing) throw httpError(404, 'Item flash sale tidak ditemukan');

    await withWriteLock(() =>
      run(`DELETE FROM flash_sale_items WHERE id = ?`, [req.params.id])
    );

    res.json({ ok: true, message: 'Item flash sale berhasil dihapus' });
  })
);

module.exports = router;
