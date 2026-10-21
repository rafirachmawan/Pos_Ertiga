const express = require('express');
const { run, get, all } = require('../database');
const {
  httpError,
  asyncHandler,
  withWriteLock,
  toInt,
} = require('../helpers');
const { localDateKey } = require('../utils/date');

const router = express.Router();

function normalizeMetode(value) {
  const text = String(value || 'Tunai').trim();
  return text.slice(0, 50) || 'Tunai';
}

// Checkout transaksi.
// Semua nominal dihitung ulang di server; nilai dari client tidak dipercaya.
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const result = await withWriteLock(async () => {
      const cart = req.body.cart;
      if (!Array.isArray(cart) || cart.length === 0) {
        throw httpError(400, 'Keranjang kosong');
      }

      const clientRef = String(req.body.client_ref || '').trim() || null;
      if (clientRef && clientRef.length > 64) {
        throw httpError(400, 'client_ref maksimal 64 karakter');
      }

      const diskon = toInt(req.body.diskon, 0);
      if (diskon < 0) throw httpError(400, 'Diskon tidak valid');

      const totalBayar = toInt(req.body.total_bayar, 0);
      const namaPelanggan =
        String(req.body.nama_pelanggan || 'Umum').trim().slice(0, 100) ||
        'Umum';
      const metodePembayaran = normalizeMetode(req.body.metode_pembayaran);

      await run('BEGIN IMMEDIATE');

      try {
        if (clientRef) {
          const existing = await get(
            `SELECT id, nomor_nota, total_harga, total_bayar,
                    total_kembalian, diskon
             FROM transaksi WHERE client_ref = ?`,
            [clientRef]
          );
          if (existing) {
            await run('ROLLBACK');
            return {
              duplicate: true,
              message: 'Transaksi sudah diproses',
              nomor_nota: existing.nomor_nota,
              transaksi_id: existing.id,
              total_harga: existing.total_harga,
              total_bayar: existing.total_bayar,
              total_kembalian: existing.total_kembalian,
              diskon: existing.diskon,
            };
          }
        }

        const items = [];

        for (const rawItem of cart) {
          const qty = toInt(rawItem.qty, 0);
          if (qty <= 0) throw httpError(400, 'Qty harus lebih dari 0');

          const isCustom = Boolean(
            rawItem.is_custom ||
            rawItem.tipe === 'custom' ||
            rawItem.tipe === 'digital' ||
            !rawItem.id ||
            Number(rawItem.id) <= 0 ||
            typeof rawItem.id === 'string'
          );

          if (isCustom) {
            const namaBarang = String(rawItem.nama_barang || '').trim();
            if (!namaBarang) {
              throw httpError(400, 'Nama item/layanan custom wajib diisi');
            }
            const hargaJual = toInt(rawItem.harga_jual, 0);
            if (hargaJual < 0) {
              throw httpError(400, 'Harga jual tidak boleh bernilai negatif');
            }
            const hargaModal = toInt(rawItem.harga_modal, 0);

            items.push({
              id: null,
              is_custom: true,
              nama_barang: namaBarang,
              harga_jual: hargaJual,
              harga_modal: hargaModal,
              qty,
              subtotal: hargaJual * qty,
            });
          } else {
            const barangId = toInt(rawItem.id, 0);
            if (barangId <= 0) throw httpError(400, 'ID barang tidak valid');

            const barang = await get(
              `SELECT id, nama_barang, harga_jual, harga_modal, stok
               FROM barang WHERE id = ? AND aktif = 1`,
              [barangId]
            );

            if (!barang) {
              throw httpError(400, `Barang id ${barangId} tidak ditemukan`);
            }
            if (barang.stok < qty) {
              throw httpError(
                400,
                `Stok ${barang.nama_barang} tidak cukup (tersisa ${barang.stok})`
              );
            }

            items.push({
              id: barang.id,
              is_custom: false,
              nama_barang: barang.nama_barang,
              harga_jual: barang.harga_jual,
              harga_modal: barang.harga_modal,
              qty,
              subtotal: barang.harga_jual * qty,
            });
          }
        }

        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        if (diskon > subtotal) {
          throw httpError(400, 'Diskon melebihi subtotal');
        }

        const totalHarga = subtotal - diskon;
        if (totalBayar < totalHarga) {
          throw httpError(400, 'Uang pembayaran kurang');
        }
        const kembalian = totalBayar - totalHarga;

        const tanggal = localDateKey();
        await run(
          `INSERT INTO counter_nota (tanggal, nomor_terakhir)
           VALUES (?, 1)
           ON CONFLICT(tanggal) DO UPDATE
           SET nomor_terakhir = nomor_terakhir + 1`,
          [tanggal]
        );
        const counter = await get(
          'SELECT nomor_terakhir FROM counter_nota WHERE tanggal = ?',
          [tanggal]
        );
        const nomorNota = `INV-${tanggal.replace(/-/g, '')}-${String(
          counter.nomor_terakhir
        ).padStart(4, '0')}`;

        const transaksi = await run(
          `INSERT INTO transaksi
           (nomor_nota, nama_pelanggan, total_harga, total_bayar,
            total_kembalian, diskon, metode_pembayaran, status, client_ref)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'sukses', ?)`,
          [
            nomorNota,
            namaPelanggan,
            totalHarga,
            totalBayar,
            kembalian,
            diskon,
            metodePembayaran,
            clientRef,
          ]
        );

        const transaksiId = transaksi.lastID;

        for (const item of items) {
          await run(
            `INSERT INTO detail_transaksi
             (transaksi_id, barang_id, nama_barang, harga_jual_saat_ini,
              harga_modal_saat_ini, qty, subtotal)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              transaksiId,
              item.id,
              item.nama_barang,
              item.harga_jual,
              item.harga_modal,
              item.qty,
              item.subtotal,
            ]
          );

          // Hanya kurangi stok jika barang fisik (ada ID barang)
          if (!item.is_custom && item.id) {
            const stockUpdate = await run(
              `UPDATE barang SET stok = stok - ?
               WHERE id = ? AND stok >= ?`,
              [item.qty, item.id, item.qty]
            );

            if (stockUpdate.changes !== 1) {
              throw httpError(400, 'Stok berubah saat transaksi, silakan ulangi');
            }
          }
        }

        await run('COMMIT');

        return {
          message: 'Transaksi berhasil',
          nomor_nota: nomorNota,
          transaksi_id: transaksiId,
          subtotal,
          diskon,
          total_harga: totalHarga,
          total_bayar: totalBayar,
          total_kembalian: kembalian,
        };
      } catch (err) {
        await run('ROLLBACK').catch(() => {});
        throw err;
      }
    });

    res.json(result);
  })
);

// Riwayat transaksi.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await all(
      `SELECT * FROM transaksi
       ORDER BY tanggal_transaksi DESC, id DESC`
    );
    res.json({ data: rows });
  })
);

// Void transaksi + kembalikan stok.
router.put(
  '/:id/void',
  asyncHandler(async (req, res) => {
    const id = toInt(req.params.id, 0);
    if (id <= 0) throw httpError(400, 'ID transaksi tidak valid');

    const message = await withWriteLock(async () => {
      await run('BEGIN IMMEDIATE');
      try {
        const header = await get(
          'SELECT id, status FROM transaksi WHERE id = ?',
          [id]
        );
        if (!header) throw httpError(404, 'Transaksi tidak ditemukan');
        if (header.status === 'void') {
          throw httpError(400, 'Transaksi sudah di-void sebelumnya');
        }

        await run(`UPDATE transaksi SET status = 'void' WHERE id = ?`, [id]);

        const items = await all(
          'SELECT barang_id, qty FROM detail_transaksi WHERE transaksi_id = ? AND barang_id IS NOT NULL',
          [id]
        );

        for (const item of items) {
          if (item.barang_id) {
            await run(
              'UPDATE barang SET stok = stok + ? WHERE id = ?',
              [item.qty, item.barang_id]
            );
          }
        }

        await run('COMMIT');
        return 'Transaksi berhasil dibatalkan (VOID) dan stok telah dikembalikan.';
      } catch (err) {
        await run('ROLLBACK').catch(() => {});
        throw err;
      }
    });

    res.json({ message });
  })
);

// Detail transaksi + header.
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = toInt(req.params.id, 0);
    if (id <= 0) throw httpError(400, 'ID transaksi tidak valid');

    const header = await get('SELECT * FROM transaksi WHERE id = ?', [id]);
    if (!header) throw httpError(404, 'Transaksi tidak ditemukan');

    const rows = await all(
      `SELECT dt.*,
              COALESCE(NULLIF(dt.nama_barang, ''), b.nama_barang, 'Barang') AS nama_barang,
              COALESCE(b.barcode, '-') AS barcode
       FROM detail_transaksi dt
       LEFT JOIN barang b ON dt.barang_id = b.id
       WHERE dt.transaksi_id = ?
       ORDER BY dt.id ASC`,
      [id]
    );

    res.json({ data: rows, header });
  })
);

module.exports = router;
