const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- CRUD for Barang (Items) ---

// Get all items
app.get('/api/barang', (req, res) => {
    db.all("SELECT * FROM barang ORDER BY created_at DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

// Add new item
app.post('/api/barang', (req, res) => {
    const { barcode, nama_barang, harga_modal, harga_jual, stok, gambar, satuan } = req.body;
    const sql = `INSERT INTO barang (barcode, nama_barang, harga_modal, harga_jual, stok, gambar, satuan) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [barcode, nama_barang, harga_modal, harga_jual, stok, gambar || '', satuan || 'pcs'], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ id: this.lastID, message: "Barang berhasil ditambahkan" });
    });
});

// Update item
app.put('/api/barang/:id', (req, res) => {
    const { id } = req.params;
    const { barcode, nama_barang, harga_modal, harga_jual, stok, gambar, satuan } = req.body;
    const sql = `UPDATE barang SET barcode = ?, nama_barang = ?, harga_modal = ?, harga_jual = ?, stok = ?, gambar = ?, satuan = ? WHERE id = ?`;
    db.run(sql, [barcode, nama_barang, harga_modal, harga_jual, stok, gambar || '', satuan || 'pcs', id], function(err) {
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
    const { total_harga, total_bayar, total_kembalian, cart } = req.body;
    
    // Generate unique nomor_nota
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const uniqueNum = String(Date.now()).slice(-4);
    const nomor_nota = `INV-${dateStr}-${uniqueNum}`;

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
            `INSERT INTO transaksi (nomor_nota, total_harga, total_bayar, total_kembalian) VALUES (?, ?, ?, ?)`,
            [nomor_nota, total_harga, total_bayar, total_kembalian],
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
         WHERE DATE(tanggal_transaksi) = ?`,
        [today],
        (err, summary) => {
            if (err) return res.status(500).json({ error: err.message });

            // Laba bersih: SUM((harga_jual_saat_ini - harga_modal) * qty) untuk hari ini
            db.get(
                `SELECT COALESCE(SUM((dt.harga_jual_saat_ini - b.harga_modal) * dt.qty), 0) as laba_bersih
                 FROM detail_transaksi dt
                 JOIN transaksi t ON dt.transaksi_id = t.id
                 JOIN barang b ON dt.barang_id = b.id
                 WHERE DATE(t.tanggal_transaksi) = ?`,
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

// --- Get Transaction History ---

// Get all transactions
app.get('/api/transaksi', (req, res) => {
    db.all(`SELECT * FROM transaksi ORDER BY tanggal_transaksi DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
