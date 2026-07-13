const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

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
    const { barcode, nama_barang, harga_modal, harga_jual, stok } = req.body;
    const sql = `INSERT INTO barang (barcode, nama_barang, harga_modal, harga_jual, stok) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [barcode, nama_barang, harga_modal, harga_jual, stok], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ id: this.lastID, message: "Barang berhasil ditambahkan" });
    });
});

// Update item
app.put('/api/barang/:id', (req, res) => {
    const { id } = req.params;
    const { barcode, nama_barang, harga_modal, harga_jual, stok } = req.body;
    const sql = `UPDATE barang SET barcode = ?, nama_barang = ?, harga_modal = ?, harga_jual = ?, stok = ? WHERE id = ?`;
    db.run(sql, [barcode, nama_barang, harga_modal, harga_jual, stok, id], function(err) {
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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
