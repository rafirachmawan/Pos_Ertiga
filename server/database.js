const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'pos_database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeDb();
    }
});

function initializeDb() {
    db.serialize(() => {
        // Table A: barang
        db.run(`CREATE TABLE IF NOT EXISTS barang (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            barcode VARCHAR(50) UNIQUE,
            nama_barang VARCHAR(250),
            harga_modal INTEGER,
            harga_jual INTEGER,
            stok INTEGER,
            gambar TEXT,
            satuan VARCHAR(20) DEFAULT 'pcs',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Add columns safely for existing databases (ignores errors if columns exist)
        db.run(`ALTER TABLE barang ADD COLUMN gambar TEXT`, (err) => {});
        db.run(`ALTER TABLE barang ADD COLUMN satuan VARCHAR(20) DEFAULT 'pcs'`, (err) => {});

        // Table B: transaksi
        db.run(`CREATE TABLE IF NOT EXISTS transaksi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nomor_nota VARCHAR(50) UNIQUE,
            nama_pelanggan VARCHAR(100) DEFAULT 'Umum',
            total_harga INTEGER,
            total_bayar INTEGER,
            total_kembalian INTEGER,
            tanggal_transaksi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Add column safely for existing databases
        db.run(`ALTER TABLE transaksi ADD COLUMN nama_pelanggan VARCHAR(100) DEFAULT 'Umum'`, (err) => {});

        // Table C: detail_transaksi
        db.run(`CREATE TABLE IF NOT EXISTS detail_transaksi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaksi_id INTEGER,
            barang_id INTEGER,
            harga_jual_saat_ini INTEGER,
            qty INTEGER,
            subtotal INTEGER,
            FOREIGN KEY (transaksi_id) REFERENCES transaksi(id) ON DELETE CASCADE,
            FOREIGN KEY (barang_id) REFERENCES barang(id)
        )`);

        // Table D: stok_masuk
        db.run(`CREATE TABLE IF NOT EXISTS stok_masuk (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            barang_id INTEGER,
            qty INTEGER,
            keterangan TEXT,
            tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (barang_id) REFERENCES barang(id)
        )`);
        
        console.log('Database tables initialized.');
    });
}

module.exports = db;
