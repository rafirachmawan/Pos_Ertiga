const express = require('express');
const { run, get } = require('../database');
const {
  httpError,
  asyncHandler,
  normalizeBoolean,
  toInt,
} = require('../helpers');

const router = express.Router();

async function ensureRow() {
  await run(
    `INSERT OR IGNORE INTO pengaturan
     (id, nama_toko, alamat_toko, pesan_struk, telepon, printer_name, lebar_struk, auto_print)
     VALUES (1, 'POS ERTIGA', 'Point of Sale', 'Terima kasih telah berbelanja!', '', '', 80, 0)`
  );
  return get('SELECT * FROM pengaturan WHERE id = 1');
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const row = await ensureRow();
    res.json({ data: row });
  })
);

router.put(
  '/',
  asyncHandler(async (req, res) => {
    const current = await ensureRow();

    const namaToko = String(req.body.nama_toko ?? current.nama_toko).trim();
    if (!namaToko) throw httpError(400, 'Nama toko wajib diisi');
    if (namaToko.length > 100) {
      throw httpError(400, 'Nama toko maksimal 100 karakter');
    }

    const alamat = String(req.body.alamat_toko ?? current.alamat_toko ?? '');
    const pesan = String(req.body.pesan_struk ?? current.pesan_struk ?? '');
    const telepon = String(req.body.telepon ?? current.telepon ?? '').trim().slice(0, 30);
    const printerName = String(
      req.body.printer_name ?? current.printer_name ?? ''
    ).slice(0, 200);

    const lebarStruk = toInt(
      req.body.lebar_struk ?? current.lebar_struk ?? 80,
      80
    );
    if (![58, 80].includes(lebarStruk)) {
      throw httpError(400, 'Lebar struk harus 58 atau 80 mm');
    }

    const autoPrint = normalizeBoolean(
      req.body.auto_print ?? current.auto_print ?? 0
    );

    await run(
      `UPDATE pengaturan
       SET nama_toko = ?, alamat_toko = ?, pesan_struk = ?, telepon = ?,
           printer_name = ?, lebar_struk = ?, auto_print = ?
       WHERE id = 1`,
      [namaToko, alamat, pesan, telepon, printerName, lebarStruk, autoPrint]
    );

    res.json({ message: 'Pengaturan berhasil disimpan' });
  })
);

module.exports = router;
