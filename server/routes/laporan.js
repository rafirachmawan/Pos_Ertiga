const express = require('express');
const { get, all } = require('../database');
const { httpError, asyncHandler } = require('../helpers');
const { localDateKey, localMonthKey, isDateKey } = require('../utils/date');

const router = express.Router();

const PROFIT_SQL = `
  SELECT COALESCE(
    SUM(
      (dt.harga_jual_saat_ini -
       COALESCE(dt.harga_modal_saat_ini, b.harga_modal, 0)) * dt.qty
    ),
    0
  ) AS laba_bersih
  FROM detail_transaksi dt
  JOIN transaksi t ON dt.transaksi_id = t.id
  LEFT JOIN barang b ON dt.barang_id = b.id
`;

function validateRange(start, end) {
  if (!isDateKey(start) || !isDateKey(end)) {
    throw httpError(400, 'Parameter start dan end wajib berformat YYYY-MM-DD');
  }
  if (start > end) {
    throw httpError(400, 'Tanggal start tidak boleh setelah end');
  }
}

router.get(
  '/harian',
  asyncHandler(async (req, res) => {
    const today = localDateKey();

    const summary = await get(
      `SELECT
         COUNT(id) AS total_transaksi,
         COALESCE(SUM(total_harga), 0) AS total_pendapatan,
         COALESCE(SUM(total_bayar), 0) AS total_bayar,
         COALESCE(SUM(diskon), 0) AS total_diskon
       FROM transaksi
       WHERE DATE(tanggal_transaksi, 'localtime') = ?
         AND COALESCE(status, 'sukses') != 'void'`,
      [today]
    );

    const profit = await get(
      `${PROFIT_SQL}
       WHERE DATE(t.tanggal_transaksi, 'localtime') = ?
         AND COALESCE(t.status, 'sukses') != 'void'`,
      [today]
    );

    res.json({
      data: {
        tanggal: today,
        total_transaksi: summary.total_transaksi,
        total_pendapatan: summary.total_pendapatan,
        total_bayar: summary.total_bayar,
        total_diskon: summary.total_diskon,
        laba_bersih: profit.laba_bersih,
      },
    });
  })
);

router.get(
  '/mingguan',
  asyncHandler(async (req, res) => {
    const rows = await all(
      `SELECT
         DATE(tanggal_transaksi, 'localtime') AS tanggal,
         COALESCE(SUM(total_harga), 0) AS pendapatan,
         COUNT(id) AS transaksi
       FROM transaksi
       WHERE DATE(tanggal_transaksi, 'localtime')
             >= DATE('now', 'localtime', '-6 days')
         AND COALESCE(status, 'sukses') != 'void'
       GROUP BY DATE(tanggal_transaksi, 'localtime')
       ORDER BY tanggal ASC`
    );

    const last7Days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = localDateKey(d);
      const found = rows.find((row) => row.tanggal === key);

      last7Days.push({
        tanggal: key,
        hari: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        pendapatan: found ? found.pendapatan : 0,
        transaksi: found ? found.transaksi : 0,
      });
    }

    res.json({ data: last7Days });
  })
);

router.get(
  '/range',
  asyncHandler(async (req, res) => {
    const { start, end } = req.query;
    validateRange(start, end);

    const summary = await get(
      `SELECT
         COUNT(id) AS total_transaksi,
         COALESCE(SUM(total_harga), 0) AS total_pendapatan,
         COALESCE(SUM(total_bayar), 0) AS total_bayar,
         COALESCE(SUM(diskon), 0) AS total_diskon
       FROM transaksi
       WHERE DATE(tanggal_transaksi, 'localtime') BETWEEN ? AND ?
         AND COALESCE(status, 'sukses') != 'void'`,
      [start, end]
    );

    const profit = await get(
      `${PROFIT_SQL}
       WHERE DATE(t.tanggal_transaksi, 'localtime') BETWEEN ? AND ?
         AND COALESCE(t.status, 'sukses') != 'void'`,
      [start, end]
    );

    res.json({
      data: {
        start,
        end,
        total_transaksi: summary.total_transaksi,
        total_pendapatan: summary.total_pendapatan,
        total_bayar: summary.total_bayar,
        total_diskon: summary.total_diskon,
        laba_bersih: profit.laba_bersih,
      },
    });
  })
);

router.get(
  '/bulanan',
  asyncHandler(async (req, res) => {
    const rows = await all(
      `SELECT
         strftime('%Y-%m', tanggal_transaksi, 'localtime') AS bulan,
         COUNT(id) AS total_transaksi,
         COALESCE(SUM(total_harga), 0) AS pendapatan
       FROM transaksi
       WHERE DATE(tanggal_transaksi, 'localtime')
             >= DATE('now', 'localtime', 'start of month', '-11 months')
         AND COALESCE(status, 'sukses') != 'void'
       GROUP BY strftime('%Y-%m', tanggal_transaksi, 'localtime')
       ORDER BY bulan ASC`
    );

    const result = [];
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = localMonthKey(d);
      const found = rows.find((row) => row.bulan === key);

      result.push({
        bulan: key,
        label: d.toLocaleDateString('id-ID', {
          month: 'short',
          year: '2-digit',
        }),
        total_transaksi: found ? found.total_transaksi : 0,
        pendapatan: found ? found.pendapatan : 0,
      });
    }

    res.json({ data: result });
  })
);

router.get(
  '/top-produk',
  asyncHandler(async (req, res) => {
    const { start, end } = req.query;
    let where = `WHERE COALESCE(t.status, 'sukses') != 'void'`;
    const params = [];

    if (start || end) {
      validateRange(start, end);
      where += ` AND DATE(t.tanggal_transaksi, 'localtime') BETWEEN ? AND ?`;
      params.push(start, end);
    }

    const rows = await all(
      `SELECT
         COALESCE(NULLIF(dt.nama_barang, ''), b.nama_barang, 'Barang') AS nama_barang,
         COALESCE(b.satuan, 'transaksi') AS satuan,
         SUM(dt.qty) AS total_terjual,
         SUM(dt.subtotal) AS total_omzet
       FROM detail_transaksi dt
       LEFT JOIN barang b ON dt.barang_id = b.id
       JOIN transaksi t ON dt.transaksi_id = t.id
       ${where}
       GROUP BY COALESCE(NULLIF(dt.nama_barang, ''), b.nama_barang), b.satuan
       ORDER BY total_terjual DESC
       LIMIT 5`,
      params
    );

    res.json({ data: rows });
  })
);

module.exports = router;
