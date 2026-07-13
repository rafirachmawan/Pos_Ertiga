const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- CRUD for Barang (Items) ---

// Get all items (with kategori name)
app.get('/api/barang', (req, res) => {
    db.all(`SELECT b.*, k.nama_kategori FROM barang b LEFT JOIN kategori k ON b.kategori_id = k.id ORDER BY b.created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

// Add new item
app.post('/api/barang', (req, res) => {
    const { barcode, nama_barang, harga_modal, harga_jual, stok, gambar, satuan, kategori_id } = req.body;
    const sql = `INSERT INTO barang (barcode, nama_barang, harga_modal, harga_jual, stok, gambar, satuan, kategori_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [barcode, nama_barang, harga_modal, harga_jual, stok, gambar || '', satuan || 'pcs', kategori_id || null], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ id: this.lastID, message: "Barang berhasil ditambahkan" });
    });
});

// Update item
app.put('/api/barang/:id', (req, res) => {
    const { id } = req.params;
    const { barcode, nama_barang, harga_modal, harga_jual, stok, gambar, satuan, kategori_id } = req.body;
    const sql = `UPDATE barang SET barcode = ?, nama_barang = ?, harga_modal = ?, harga_jual = ?, stok = ?, gambar = ?, satuan = ?, kategori_id = ? WHERE id = ?`;
    db.run(sql, [barcode, nama_barang, harga_modal, harga_jual, stok, gambar || '', satuan || 'pcs', kategori_id || null, id], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ changes: this.changes, message: "Barang berhasil diupdate" });
    });
});

// Delete item
app.delete('/api/barang/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM barang WHERE id = ?`, id, function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ changes: this.changes, message: "Barang berhasil dihapus" });
    });
});

// --- Kategori ---
app.get('/api/kategori', (req, res) => {
    db.all(`SELECT * FROM kategori ORDER BY nama_kategori ASC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});
app.post('/api/kategori', (req, res) => {
    const { nama_kategori } = req.body;
    if (!nama_kategori) return res.status(400).json({ error: 'Nama kategori wajib diisi' });
    db.run(`INSERT INTO kategori (nama_kategori) VALUES (?)`, [nama_kategori], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ id: this.lastID, nama_kategori, message: 'Kategori ditambahkan' });
    });
});
app.delete('/api/kategori/:id', (req, res) => {
    db.run(`DELETE FROM kategori WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: 'Kategori dihapus' });
    });
});

// --- Pengaturan Toko ---
app.get('/api/pengaturan', (req, res) => {
    db.all(`SELECT kunci, nilai FROM pengaturan`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const result = {};
        rows.forEach(r => { result[r.kunci] = r.nilai; });
        res.json({ data: result });
    });
});
app.put('/api/pengaturan', (req, res) => {
    const updates = req.body; // { kunci: nilai, ... }
    const stmt = db.prepare(`INSERT OR REPLACE INTO pengaturan (kunci, nilai) VALUES (?, ?)`);
    Object.entries(updates).forEach(([k, v]) => stmt.run([k, v]));
    stmt.finalize((err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Pengaturan disimpan' });
    });
});

// Search item by barcode
app.get('/api/barang/barcode/:barcode', (req, res) => {
    const { barcode } = req.params;
    db.get(`SELECT * FROM barang WHERE barcode = ?`, [barcode], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Barang tidak ditemukan" });
        res.json({ data: row });
    });
});

// --- Checkout Transaction ---

app.post('/api/transaksi', (req, res) => {
    const { total_harga, total_bayar, total_kembalian, cart, nama_pelanggan, metode_pembayaran } = req.body;
    
    // Generate unique nomor_nota
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const uniqueNum = String(Date.now()).slice(-4);
    const nomor_nota = `INV-${dateStr}-${uniqueNum}`;

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
            `INSERT INTO transaksi (nomor_nota, nama_pelanggan, metode_pembayaran, total_harga, total_bayar, total_kembalian) VALUES (?, ?, ?, ?, ?, ?)`,
            [nomor_nota, nama_pelanggan || 'Umum', metode_pembayaran || 'Tunai', total_harga, total_bayar, total_kembalian],
            function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(400).json({ error: err.message });
                }
                const transaksi_id = this.lastID;

                // Insert details and update stock
                const stmt_detail = db.prepare(`INSERT INTO detail_transaksi (transaksi_id, barang_id, harga_jual_saat_ini, qty, subtotal) VALUES (?, ?, ?, ?, ?)`);
                const stmt_stok = db.prepare(`UPDATE barang SET stok = stok - ? WHERE id = ? AND stok >= ?`);

                let hasError = false;

                cart.forEach((item, index) => {
                    if (hasError) return; // Skip if error occurred in previous iterations
                    
                    stmt_detail.run([transaksi_id, item.id, item.harga_jual, item.qty, item.subtotal], (err) => {
                        if(err) hasError = true;
                    });
                    
                    stmt_stok.run([item.qty, item.id, item.qty], function(err) {
                        if(err) hasError = true;
                        // Checking if stock was actually reduced (prevents negative stock implicitly based on WHERE condition)
                        if (this.changes === 0) hasError = true; 
                    });
                });

                stmt_detail.finalize();
                stmt_stok.finalize(() => {
                    if (hasError) {
                        db.run('ROLLBACK');
                        return res.status(400).json({ error: "Gagal transaksi. Stok mungkin tidak mencukupi." });
                    } else {
                        db.run('COMMIT');
                        res.json({ message: "Transaksi berhasil", nomor_nota, transaksi_id });
                    }
                });
            }
        );
    });
});

// --- Laporan Keuangan ---

// Laporan harian: total transaksi, total pendapatan, laba bersih
app.get('/api/laporan/harian', (req, res) => {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Total transaksi & pendapatan hari ini
    db.get(
        `SELECT 
            COUNT(id) as total_transaksi,
            COALESCE(SUM(total_harga), 0) as total_pendapatan,
            COALESCE(SUM(total_bayar), 0) as total_bayar
         FROM transaksi 
         WHERE DATE(tanggal_transaksi) = ? AND status != 'void'`,
        [today],
        (err, summary) => {
            if (err) return res.status(500).json({ error: err.message });

            // Laba bersih: SUM((harga_jual_saat_ini - harga_modal) * qty) untuk hari ini
            db.get(
                `SELECT COALESCE(SUM((dt.harga_jual_saat_ini - b.harga_modal) * dt.qty), 0) as laba_bersih
                 FROM detail_transaksi dt
                 JOIN transaksi t ON dt.transaksi_id = t.id
                 JOIN barang b ON dt.barang_id = b.id
                 WHERE DATE(t.tanggal_transaksi) = ? AND t.status != 'void'`,
                [today],
                (err2, profitRow) => {
                    if (err2) return res.status(500).json({ error: err2.message });
                    res.json({
                        data: {
                            total_transaksi: summary.total_transaksi,
                            total_pendapatan: summary.total_pendapatan,
                            laba_bersih: profitRow.laba_bersih
                        }
                    });
                }
            );
        }
    );
});

// Laporan Mingguan (7 Hari Terakhir) untuk Grafik
app.get('/api/laporan/mingguan', (req, res) => {
    db.all(
        `SELECT 
            DATE(tanggal_transaksi) as tanggal,
            SUM(total_harga) as pendapatan,
            COUNT(id) as transaksi
         FROM transaksi 
         WHERE tanggal_transaksi >= date('now', '-6 days') AND status != 'void'
         GROUP BY DATE(tanggal_transaksi)
         ORDER BY tanggal ASC`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Format data to ensure all 7 days exist even if 0
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().slice(0, 10);
                
                const found = rows.find(r => r.tanggal === dateStr);
                last7Days.push({
                    tanggal: dateStr,
                    hari: d.toLocaleDateString('id-ID', { weekday: 'short' }),
                    pendapatan: found ? found.pendapatan : 0,
                    transaksi: found ? found.transaksi : 0
                });
            }
            
            res.json({ data: last7Days });
        }
    );
});

// --- Get Transaction History ---

// Get all transactions
app.get('/api/transaksi', (req, res) => {
    db.all(`SELECT * FROM transaksi ORDER BY tanggal_transaksi DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

// Void Transaction
app.put('/api/transaksi/:id/void', (req, res) => {
    const { id } = req.params;
    
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Cek status transaksi dulu
        db.get('SELECT status FROM transaksi WHERE id = ?', [id], (err, row) => {
            if (err) { db.run('ROLLBACK'); return res.status(500).json({ error: err.message }); }
            if (!row) { db.run('ROLLBACK'); return res.status(404).json({ error: "Transaksi tidak ditemukan" }); }
            if (row.status === 'void') { db.run('ROLLBACK'); return res.status(400).json({ error: "Transaksi sudah di-void sebelumnya" }); }
            
            // Update status ke void
            db.run('UPDATE transaksi SET status = "void" WHERE id = ?', [id], (err) => {
                if (err) { db.run('ROLLBACK'); return res.status(500).json({ error: err.message }); }
                
                // Kembalikan stok
                db.all('SELECT barang_id, qty FROM detail_transaksi WHERE transaksi_id = ?', [id], (err, items) => {
                    if (err) { db.run('ROLLBACK'); return res.status(500).json({ error: err.message }); }
                    
                    const stmt = db.prepare('UPDATE barang SET stok = stok + ? WHERE id = ?');
                    items.forEach(item => {
                        stmt.run([item.qty, item.barang_id]);
                    });
                    stmt.finalize((err) => {
                        if (err) { db.run('ROLLBACK'); return res.status(500).json({ error: err.message }); }
                        db.run('COMMIT');
                        res.json({ message: "Transaksi berhasil dibatalkan (VOID) dan stok telah dikembalikan." });
                    });
                });
            });
        });
    });
});

// Get transaction detail by ID
app.get('/api/transaksi/:id', (req, res) => {
    const { id } = req.params;
    db.all(
        `SELECT dt.*, b.nama_barang, b.barcode 
         FROM detail_transaksi dt 
         JOIN barang b ON dt.barang_id = b.id 
         WHERE dt.transaksi_id = ?`,
        [id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ data: rows });
        }
    );
});

// --- Stok Masuk ---

app.post('/api/stok-masuk', (req, res) => {
    const { barang_id, qty, keterangan } = req.body;
    
    if (!barang_id || !qty || qty <= 0) {
        return res.status(400).json({ error: "Data tidak valid" });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
            `INSERT INTO stok_masuk (barang_id, qty, keterangan) VALUES (?, ?, ?)`,
            [barang_id, qty, keterangan || 'Restock manual'],
            function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(400).json({ error: err.message });
                }

                db.run(
                    `UPDATE barang SET stok = stok + ? WHERE id = ?`,
                    [qty, barang_id],
                    function(err) {
                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(400).json({ error: err.message });
                        }
                        db.run('COMMIT');
                        res.json({ message: "Stok berhasil ditambahkan" });
                    }
                );
            }
        );
    });
});

app.get('/api/stok-masuk', (req, res) => {
    db.all(
        `SELECT sm.*, b.nama_barang, b.barcode 
         FROM stok_masuk sm 
         JOIN barang b ON sm.barang_id = b.id 
         ORDER BY sm.tanggal DESC`, 
        [], 
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ data: rows });
        }
    );
});

// --- Backup Database ---
const fs = require('fs');
const path = require('path');
app.get('/api/backup', (req, res) => {
    const dbPath = path.resolve(__dirname, 'pos_database.sqlite');
    res.download(dbPath, `backup_pos_ertiga_${new Date().toISOString().slice(0, 10)}.sqlite`);
});

// --- Pengaturan Toko ---
app.get('/api/pengaturan', (req, res) => {
    db.get('SELECT * FROM pengaturan WHERE id = 1', (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: row });
    });
});

app.put('/api/pengaturan', (req, res) => {
    const { nama_toko, alamat_toko, pesan_struk } = req.body;
    db.run(
        `UPDATE pengaturan SET nama_toko = ?, alamat_toko = ?, pesan_struk = ? WHERE id = 1`,
        [nama_toko, alamat_toko, pesan_struk],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Pengaturan berhasil disimpan" });
        }
    );
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// --- Laporan Endpoints ---

// Laporan berdasarkan rentang tanggal
app.get('/api/laporan/range', (req, res) => {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ error: 'Parameter start dan end wajib diisi' });

    db.get(
        `SELECT 
            COUNT(id) as total_transaksi,
            COALESCE(SUM(total_harga), 0) as total_pendapatan,
            COALESCE(SUM(total_bayar), 0) as total_bayar
         FROM transaksi 
         WHERE DATE(tanggal_transaksi) BETWEEN ? AND ?`,
        [start, end],
        (err, summary) => {
            if (err) return res.status(500).json({ error: err.message });

            db.get(
                `SELECT COALESCE(SUM((dt.harga_jual_saat_ini - b.harga_modal) * dt.qty), 0) as laba_bersih
                 FROM detail_transaksi dt
                 JOIN transaksi t ON dt.transaksi_id = t.id
                 JOIN barang b ON dt.barang_id = b.id
                 WHERE DATE(t.tanggal_transaksi) BETWEEN ? AND ?`,
                [start, end],
                (err2, profitRow) => {
                    if (err2) return res.status(500).json({ error: err2.message });
                    res.json({
                        data: {
                            total_transaksi: summary.total_transaksi,
                            total_pendapatan: summary.total_pendapatan,
                            laba_bersih: profitRow.laba_bersih
                        }
                    });
                }
            );
        }
    );
});

// Laporan bulanan (12 bulan terakhir)
app.get('/api/laporan/bulanan', (req, res) => {
    db.all(
        `SELECT 
            strftime('%Y-%m', tanggal_transaksi) as bulan,
            COUNT(id) as total_transaksi,
            SUM(total_harga) as pendapatan
         FROM transaksi
         WHERE tanggal_transaksi >= date('now', '-11 months', 'start of month')
         GROUP BY strftime('%Y-%m', tanggal_transaksi)
         ORDER BY bulan ASC`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            // Ensure all 12 months present
            const result = [];
            for (let i = 11; i >= 0; i--) {
                const d = new Date();
                d.setDate(1);
                d.setMonth(d.getMonth() - i);
                const key = d.toISOString().slice(0, 7);
                const found = rows.find(r => r.bulan === key);
                result.push({
                    bulan: key,
                    label: d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
                    total_transaksi: found ? found.total_transaksi : 0,
                    pendapatan: found ? found.pendapatan : 0,
                });
            }
            res.json({ data: result });
        }
    );
});

// Top 5 produk terlaris
app.get('/api/laporan/top-produk', (req, res) => {
    const { start, end } = req.query;
    let whereClause = '';
    let params = [];
    if (start && end) {
        whereClause = 'WHERE DATE(t.tanggal_transaksi) BETWEEN ? AND ?';
        params = [start, end];
    }
    db.all(
        `SELECT b.nama_barang, b.satuan,
            SUM(dt.qty) as total_terjual,
            SUM(dt.subtotal) as total_omzet
         FROM detail_transaksi dt
         JOIN barang b ON dt.barang_id = b.id
         JOIN transaksi t ON dt.transaksi_id = t.id
         ${whereClause}
         GROUP BY dt.barang_id
         ORDER BY total_terjual DESC
         LIMIT 5`,
        params,
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ data: rows });
        }
    );
});

