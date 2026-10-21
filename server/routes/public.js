const express = require('express');
const { all, get } = require('../database');
const { asyncHandler } = require('../helpers');

const router = express.Router();

// GET /api/public/toko - Informasi toko untuk header & kontak website
router.get(
  '/toko',
  asyncHandler(async (req, res) => {
    const toko = await get(
      `SELECT nama_toko, alamat_toko, pesan_struk, telepon FROM pengaturan WHERE id = 1`
    );
    res.json({
      data: toko || {
        nama_toko: 'POS ERTIGA',
        alamat_toko: 'Point of Sale Store',
        pesan_struk: 'Terima kasih telah berbelanja!',
        telepon: '',
      },
    });
  })
);

// GET /api/public/kategori - Kategori produk yang aktif untuk toko online
router.get(
  '/kategori',
  asyncHandler(async (req, res) => {
    const categories = await all(
      `SELECT id, nama_kategori
       FROM kategori
       ORDER BY nama_kategori ASC`
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
              b.gambar, b.berat_gram, b.deskripsi, b.kategori_id, k.nama_kategori
       FROM barang b
       LEFT JOIN kategori k ON b.kategori_id = k.id
       WHERE b.aktif = 1 AND b.tampil_online = 1 AND (b.deleted_at IS NULL)
       ORDER BY b.nama_barang ASC`
    );
    res.json({ data: rows });
  })
);

// GET /api/public/banners - Banner slider untuk web storefront
router.get(
  '/banners',
  asyncHandler(async (req, res) => {
    const rows = await all(
      `SELECT id, judul, subjudul, badge, gambar, warna_bg, warna_accent, link
       FROM banners
       WHERE aktif = 1
       ORDER BY urutan ASC, id ASC`
    );
    res.json({ data: rows });
  })
);

// GET /api/public/logam-mulia - Katalog emas dan gramatur siap order untuk web storefront
router.get(
  '/logam-mulia',
  asyncHandler(async (req, res) => {
    const merks = await all(
      `SELECT id, nama_merk, keterangan, urutan
       FROM logam_mulia_kategori
       WHERE aktif = 1
       ORDER BY urutan ASC, id ASC`
    );

    const items = await all(
      `SELECT id, kategori_id, gramatur, harga_jual, harga_beli, stok, deskripsi, gambar, is_favorit
       FROM logam_mulia_item
       WHERE aktif = 1
       ORDER BY harga_jual ASC, id ASC`
    );

    // Group items under each merk
    const data = merks.map((m) => ({
      ...m,
      items: items.filter((it) => it.kategori_id === m.id),
    }));

    res.json({ data });
  })
);

// GET /api/public/smm - Daftar platform, layanan & paket booster sosmed aktif untuk etalase web
router.get(
  '/smm',
  asyncHandler(async (req, res) => {
    const platforms = await all(
      `SELECT id, nama_platform, slug, color, icon, deskripsi, urutan
       FROM smm_platform
       WHERE aktif = 1
       ORDER BY urutan ASC, id ASC`
    );

    const services = await all(
      `SELECT id, platform_id, nama_layanan, target_type, deskripsi, urutan
       FROM smm_layanan
       WHERE aktif = 1
       ORDER BY urutan ASC, id ASC`
    );

    const packages = await all(
      `SELECT id, layanan_id, jumlah_order, harga_jual, is_popular, deskripsi, urutan
       FROM smm_paket
       WHERE aktif = 1
       ORDER BY urutan ASC, harga_jual ASC, id ASC`
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

// GET /api/public/flash-sale - Data flash sale aktif untuk etalase toko online
router.get(
  '/flash-sale',
  asyncHandler(async (req, res) => {
    let settings = await get(
      `SELECT judul, subjudul, badge_text, aktif, jam_selesai, durasi_jam
       FROM flash_sale_settings
       WHERE id = 1`
    );
    if (!settings) {
      settings = {
        judul: 'FLASH SALE',
        subjudul: 'Promo Terbatas Hari Ini',
        badge_text: '⚡ FLASH SALE',
        aktif: 1,
        jam_selesai: '22:00',
        durasi_jam: 3,
      };
    }

    const items = await all(
      `SELECT fsi.id, fsi.barang_id, fsi.nama_item, fsi.gambar, fsi.harga_asli, fsi.harga_diskon,
              fsi.diskon_persen, fsi.terjual_pct, fsi.tipe, fsi.target_link, fsi.urutan,
              b.barcode, b.nama_barang, b.satuan, b.stok, b.berat_gram, b.deskripsi, b.kategori_id
       FROM flash_sale_items fsi
       LEFT JOIN barang b ON fsi.barang_id = b.id
       WHERE fsi.aktif = 1
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

module.exports = router;
