const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use custom path from Electron if available, otherwise default to server folder
let dbPath = path.resolve(__dirname, 'pos_database.sqlite');
if (process.env.USER_DATA_PATH) {
    dbPath = path.join(process.env.USER_DATA_PATH, 'pos_database.sqlite');
}

console.log('Using database path:', dbPath);
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
        db.run(`ALTER TABLE transaksi ADD COLUMN metode_pembayaran VARCHAR(50) DEFAULT 'Tunai'`, (err) => {});
        db.run(`ALTER TABLE transaksi ADD COLUMN status VARCHAR(20) DEFAULT 'sukses'`, (err) => {});

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

        // Table E: pengaturan — migrate if schema is old (key-value style)
        db.all(`PRAGMA table_info(pengaturan)`, (err, columns) => {
            const hasKunci = columns && columns.some(c => c.name === 'kunci');
            if (hasKunci) {
                // Old key-value schema detected — drop and recreate
                db.run(`DROP TABLE IF EXISTS pengaturan`, () => {
                    db.run(`CREATE TABLE pengaturan (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        nama_toko VARCHAR(100) DEFAULT 'POS ERTIGA',
                        alamat_toko TEXT DEFAULT 'Alamat Toko Belum Diatur',
                        pesan_struk TEXT DEFAULT 'Terima kasih sudah berbelanja!'
                    )`, () => {
                        db.run(`INSERT INTO pengaturan (id, nama_toko, alamat_toko, pesan_struk) VALUES (1, 'POS ERTIGA', 'Point of Sale', 'Terima kasih telah berbelanja!')`);
                    });
                });
            } else {
                db.run(`CREATE TABLE IF NOT EXISTS pengaturan (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nama_toko VARCHAR(100) DEFAULT 'POS ERTIGA',
                    alamat_toko TEXT DEFAULT 'Alamat Toko Belum Diatur',
                    pesan_struk TEXT DEFAULT 'Terima kasih sudah berbelanja!'
                )`, () => {
                    db.get(`SELECT id FROM pengaturan WHERE id = 1`, (err, row) => {
                        if (!row) {
                            db.run(`INSERT INTO pengaturan (id, nama_toko, alamat_toko, pesan_struk) VALUES (1, 'POS ERTIGA', 'Point of Sale', 'Terima kasih telah berbelanja!')`);
                        }
                    });
                });
            }
        });

        // Table F: kategori
        db.run(`CREATE TABLE IF NOT EXISTS kategori (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama_kategori VARCHAR(100) UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Add kategori_id to barang safely
        db.run(`ALTER TABLE barang ADD COLUMN kategori_id INTEGER REFERENCES kategori(id)`, (err) => {});
        
        console.log('Database tables initialized.');
    });

}

module.exports = db;
