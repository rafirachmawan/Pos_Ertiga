const express = require('express');
const { all, get } = require('../database');
const { asyncHandler } = require('../helpers');

const router = express.Router();

// GET /api/public/toko - Informasi toko untuk header & kontak website
router.get(
  '/toko',
  asyncHandler(async (req, res) => {
    const toko = await get(
      `SELECT nama_toko, alamat_toko, pesan_struk FROM pengaturan WHERE id = 1`
    );
    res.json({
      data: toko || {
        nama_toko: 'POS ERTIGA',
        alamat_toko: 'Point of Sale Store',
        pesan_struk: 'Terima kasih telah berbelanja!',
      },
    });
  })
);

// GET /api/public/kategori - Kategori produk yang aktif untuk toko online
router.get(
  '/kategori',
  asyncHandler(async (req, res) => {
    const categories = await all(
      `SELECT DISTINCT k.id, k.nama_kategori
       FROM kategori k
       JOIN barang b ON b.kategori_id = k.id
       WHERE b.aktif = 1 AND b.tampil_online = 1 AND (b.deleted_at IS NULL)
       ORDER BY k.nama_kategori ASC`
    );
    res.json({ data: categories });
  })
);

// GET /api/public/barang - Katalog produk e-commerce
router.get(
  '/barang',
  asyncHandler(async (req, res) => {
    const rows = await all(
      `SELECT b.id, b.barcode, b.nama_barang, b.harga_jual, b.stok, b.satuan,
              b.gambar, b.berat_gram, b.kategori_id, k.nama_kategori
       FROM barang b
       LEFT JOIN kategori k ON b.kategori_id = k.id
       WHERE b.aktif = 1 AND b.tampil_online = 1 AND (b.deleted_at IS NULL)
       ORDER BY b.nama_barang ASC`
    );
    res.json({ data: rows });
  })
);

module.exports = router;
