// Fallback mock data in case POS backend is offline or starting up
const FALLBACK_TOKO = {
  nama_toko: 'POS ERTIGA STORE',
  alamat_toko: 'Jl. Pemuda No. 88, Jakarta Pusat\nWhatsApp: 0812-3456-7890',
  pesan_struk: 'Toko Online Fashion & Retail Resmi POS ERTIGA',
  telepon: '081234567890',
};

const FALLBACK_CATEGORIES = [
  { id: 1, nama_kategori: 'Pakaian Pria' },
  { id: 2, nama_kategori: 'Hijab & Muslimah' },
  { id: 3, nama_kategori: 'Aksesoris' },
];

const FALLBACK_PRODUCTS = [
  {
    id: 1,
    barcode: 'TSH-SLV-01',
    nama_barang: 'Kaos Hitam Salvador Cotton Combed 24s',
    harga_jual: 100000,
    stok: 16,
    satuan: 'pcs',
    kategori_id: 1,
    nama_kategori: 'Pakaian Pria',
    berat_gram: 220,
    tampil_online: 1,
    gambar: null,
  },
  {
    id: 2,
    barcode: 'HJB-ANS-02',
    nama_barang: 'Kerudung Ansya Pashmina Ceruty Babydoll',
    harga_jual: 45000,
    stok: 25,
    satuan: 'pcs',
    kategori_id: 2,
    nama_kategori: 'Hijab & Muslimah',
    berat_gram: 150,
    tampil_online: 1,
    gambar: null,
  },
  {
    id: 3,
    barcode: 'ACC-TOTE-03',
    nama_barang: 'Canvas Tote Bag Aesthetic Minimalis',
    harga_jual: 65000,
    stok: 8,
    satuan: 'pcs',
    kategori_id: 3,
    nama_kategori: 'Aksesoris',
    berat_gram: 180,
    tampil_online: 1,
    gambar: null,
  },
];

export async function fetchTokoInfo() {
  try {
    const res = await fetch('/api/public/toko');
    if (!res.ok) throw new Error('Failed to fetch');
    const json = await res.json();
    return json.data || FALLBACK_TOKO;
  } catch (err) {
    console.warn('[API] Menggunakan data fallback toko:', err.message);
    return FALLBACK_TOKO;
  }
}

export async function fetchPublicCategories() {
  try {
    const res = await fetch('/api/public/kategori');
    if (!res.ok) throw new Error('Failed to fetch');
    const json = await res.json();
    return json.data && json.data.length > 0 ? json.data : FALLBACK_CATEGORIES;
  } catch (err) {
    console.warn('[API] Menggunakan data fallback kategori:', err.message);
    return FALLBACK_CATEGORIES;
  }
}

export async function fetchPublicProducts() {
  try {
    const res = await fetch('/api/public/barang');
    if (!res.ok) throw new Error('Failed to fetch');
    const json = await res.json();
    return json.data && json.data.length > 0 ? json.data : FALLBACK_PRODUCTS;
  } catch (err) {
    console.warn('[API] Menggunakan data fallback produk:', err.message);
    return FALLBACK_PRODUCTS;
  }
}
