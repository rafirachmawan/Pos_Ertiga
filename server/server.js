const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const {
  initializeDatabase,
  closeDatabase,
  dbPath,
} = require('./database');

const barangRoutes = require('./routes/barang');
const kategoriRoutes = require('./routes/kategori');
const pengaturanRoutes = require('./routes/pengaturan');
const transaksiRoutes = require('./routes/transaksi');
const laporanRoutes = require('./routes/laporan');
const stokMasukRoutes = require('./routes/stokMasuk');
const backupRoutes = require('./routes/backup');
const publicRoutes = require('./routes/public');
const bannerRoutes = require('./routes/banners');
const logamMuliaRoutes = require('./routes/logamMulia');
const smmRoutes = require('./routes/smm');

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '127.0.0.1';

const isPackaged = process.env.APP_PACKAGED === 'true';

const allowedOrigins = new Set([
  'http://127.0.0.1:3001',
  'http://localhost:3001',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5174',
  'http://localhost:5174',
  'http://127.0.0.1:5175',
  'http://localhost:5175',
]);

app.disable('x-powered-by');

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// CORS untuk development Vite (POS di 5173, Web Storefront di 5174/5175).
if (!isPackaged) {
  app.use(
    cors({
      origin: [
        'http://127.0.0.1:5173',
        'http://localhost:5173',
        'http://127.0.0.1:5174',
        'http://localhost:5174',
        'http://127.0.0.1:5175',
        'http://localhost:5175',
      ],
    })
  );
}

// Tolak request mutasi dari origin asing (mis. halaman web lain).
app.use('/api', (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.get('origin');
    if (origin && !allowedOrigins.has(origin)) {
      return res.status(403).json({ error: 'Origin tidak diizinkan' });
    }
  }
  next();
});

// CSP hanya di build produksi. Dev butuh aturan longgar untuk Vite HMR.
if (isPackaged) {
  app.use((req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self'",
      ].join('; ')
    );
    next();
  });
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const clientDistPath =
  process.env.CLIENT_DIST_PATH || path.join(__dirname, '../client/dist');

console.log('[SERVER] Static files:', clientDistPath);
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
} else {
  console.warn('[SERVER] client/dist belum ada. Jalankan build client.');
}

app.get('/api/health', async (req, res) => {
  try {
    const { get } = require('./database');
    await get('SELECT 1 AS ok');
    res.json({
      ok: true,
      version: process.env.APP_VERSION || require('../package.json').version,
      database: true,
      uptime: process.uptime(),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.use('/api/barang', barangRoutes);
app.use('/api/kategori', kategoriRoutes);
app.use('/api/pengaturan', pengaturanRoutes);
app.use('/api/transaksi', transaksiRoutes);
app.use('/api/laporan', laporanRoutes);
app.use('/api/stok-masuk', stokMasukRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/logam-mulia', logamMuliaRoutes);
app.use('/api/smm', smmRoutes);

// Endpoint API yang tidak dikenal harus tetap JSON.
app.use('/api', (req, res) => {
  res.status(404).json({
    error: `Endpoint tidak ditemukan: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  const status = err.status || 500;
  if (status >= 500) console.error('[API ERROR]', err);

  res.status(status).json({
    error: err.message || 'Terjadi kesalahan pada server',
  });
});

// Fallback SPA untuk refresh halaman React.
app.use((req, res) => {
  if (req.method !== 'GET') {
    return res.status(404).json({ error: 'Not found' });
  }
  if (fs.existsSync(clientDistPath)) {
    return res.sendFile(path.join(clientDistPath, 'index.html'));
  }
  return res
    .status(404)
    .send('Frontend build not found. Jalankan "npm run build" di folder client.');
});

let httpServer = null;

async function startServer(port = PORT, host = HOST) {
  if (httpServer) return httpServer;

  await initializeDatabase();

  return new Promise((resolve, reject) => {
    const server = app.listen(port, host, () => {
      httpServer = server;
      console.log(`[SERVER] Berjalan di http://${host}:${port}`);
      console.log('[SERVER] Database:', dbPath);
      resolve(server);
    });

    server.on('error', (err) => {
      httpServer = null;
      reject(err);
    });
  });
}

function closeServer() {
  return new Promise((resolve, reject) => {
    if (!httpServer) return resolve();
    httpServer.close((err) => {
      if (err) return reject(err);
      httpServer = null;
      resolve();
    });
  });
}

async function closeAll() {
  await closeServer().catch((err) => {
    console.error('[SERVER] Gagal menutup server:', err.message);
  });
  await closeDatabase().catch((err) => {
    console.error('[DB] Gagal menutup database:', err.message);
  });
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error('[SERVER] Gagal start:', err);
    process.exit(1);
  });
}

process.on('SIGINT', async () => {
  await closeAll();
  process.exit(0);
});

module.exports = {
  app,
  startServer,
  closeServer,
  closeAll,
};
