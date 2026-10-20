# POS ERTIGA E-Commerce Storefront

Toko online resmi yang terintegrasi langsung dengan sistem kasir desktop **POS ERTIGA**.

## Fitur Utama

1. **Katalog Produk Real-Time**:
   - Menampilkan produk dari database POS ERTIGA yang memiliki opsi `tampil_online = 1`.
   - Filter kategori cepat (Semua, Pakaian, Hijab, dll).
   - Pencarian instan berdasarkan nama barang dan kategori.
   - Indikator status stok (Tersedia, Stok Menipis, Stok Habis).
   - Informasi berat produk per gram untuk estimasi ongkir.

2. **Keranjang Belanja (Shopping Cart)**:
   - Slide-in Cart Drawer modern.
   - Atur kuantitas barang (+ / -) dengan batas maksimal stok nyata toko.
   - Perhitungan total kuantitas, total estimasi berat (gram / kg), dan subtotal belanja.
   - Tersimpan di `localStorage` agar keranjang pembeli tidak hilang saat halaman di-refresh.

3. **Checkout Otomatis via WhatsApp**:
   - Pembeli mengisi nama, no. WhatsApp, alamat pengiriman, dan catatan pesanan.
   - Menghasilkan format pesan pesanan WhatsApp rapi dan terstruktur.
   - Langsung membuka WhatsApp CS Toko (`wa.me`) dengan rincian pesanan lengkap.

4. **Konektivitas & Ketahanan Offline**:
   - Mengambil data dari endpoint publik POS:
     - `GET /api/public/barang`
     - `GET /api/public/kategori`
     - `GET /api/public/toko`
   - Dilengkapi **Smart Fallback Data**: Toko online tetap dapat dibuka dan berfungsi lancar meski backend POS sedang offline atau dalam tahap development.

---

## Struktur Folder `web/`

```
web/
├── index.html                  # HTML template & Google Fonts (Plus Jakarta Sans)
├── package.json                # Dependencies React & Vite
├── vite.config.js              # Vite server & proxy ke backend POS (:3001)
├── src/
│   ├── main.jsx                # Entry point React
│   ├── App.jsx                 # State katalog, keranjang belanja & koordinasi modal
│   ├── index.css               # Design system, glassmorphism, micro-animations
│   ├── components/
│   │   ├── Navbar.jsx          # Header, brand, search bar, & cart counter
│   │   ├── HeroBanner.jsx      # Banner sambutan & badge USP toko
│   │   ├── CategoryFilter.jsx  # Filter pil kategori produk
│   │   ├── ProductCard.jsx     # Kartu produk, foto, harga, status stok, & tombol +keranjang
│   │   ├── ProductDetailModal.jsx # Modal rincian produk, SKU, & pemilih kuantitas
│   │   ├── CartDrawer.jsx      # Drawer samping keranjang belanja
│   │   ├── CheckoutModal.jsx   # Form alamat penerima & redirect WhatsApp
│   │   └── Footer.jsx          # Informasi jam buka, alamat, & copyright toko
│   └── lib/
│       ├── api.js              # Client API publik dengan fallback data otomatis
│       ├── format.js           # Helper format Rupiah & format berat (g / kg)
│       └── whatsapp.js         # Generator template teks WhatsApp checkout
```

---

## Cara Menjalankan

Dari root project `Pos_Ertiga`:
```bash
# Menjalankan website e-commerce saja (port 5174):
npm run dev:web

# Atau menjalankan semua sekaligus (Server API + POS Kasir + Website):
npm run dev:all
```

Buka di browser:
- Website E-Commerce: **http://localhost:5174/**
- Aplikasi Kasir POS: **http://localhost:5173/**
- Backend API POS: **http://localhost:3001/**
