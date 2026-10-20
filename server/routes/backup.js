const express = require('express');
const path = require('path');
const { dbPath } = require('../database');
const {
  createLocalBackup,
  listLocalBackups,
  getLocalBackupStatus,
  resolveLocalBackup,
} = require('../backup');
const { asyncHandler, withWriteLock, httpError } = require('../helpers');

const router = express.Router();

// Unduhan database mentah (kompatibilitas dengan tombol lama).
router.get('/', (req, res) => {
  const fileName = `backup_pos_ertiga_${new Date()
    .toISOString()
    .slice(0, 10)}.sqlite`;
  res.download(dbPath, fileName);
});

// Status backup lokal. Status Google Drive akan ditambahkan pada paket C.
router.get(
  '/status',
  asyncHandler(async (req, res) => {
    res.json({ data: getLocalBackupStatus() });
  })
);

// Buat backup .sql.gz konsisten (VACUUM INTO + dump + gzip).
router.post(
  '/run',
  asyncHandler(async (req, res) => {
    const backup = await withWriteLock(createLocalBackup);
    res.json({
      message: 'Backup lokal berhasil dibuat',
      data: {
        ...backup,
        status: getLocalBackupStatus(),
      },
    });
  })
);

router.get(
  '/files',
  asyncHandler(async (req, res) => {
    res.json({ data: listLocalBackups() });
  })
);

router.get(
  '/download/:file',
  asyncHandler(async (req, res) => {
    const filePath = resolveLocalBackup(req.params.file);
    if (!filePath) throw httpError(404, 'File backup tidak ditemukan');
    res.download(filePath, path.basename(filePath));
  })
);

module.exports = router;
