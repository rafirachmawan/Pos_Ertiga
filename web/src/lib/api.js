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

export const FALLBACK_LOGAM_MULIA = [
  {
    id: 1,
    nama_merk: 'Antam Logam Mulia',
    keterangan: 'Emas batangan murni 24 Karat kemurnian 999.9% bersertifikat resmi LBMA & CertiCard',
    items: [
      { id: 101, gramatur: '0.5 gr', harga_jual: 790000, harga_beli: 710000, stok: 8, deskripsi: 'CertiCard Redesigned Press resmi Antam 2024 kemurnian 99.99%', is_favorit: 1 },
      { id: 102, gramatur: '1.0 gr', harga_jual: 1485000, harga_beli: 1350000, stok: 10, deskripsi: 'CertiCard kemurnian 99.99% terakreditasi LBMA resmi Antam', is_favorit: 1 },
      { id: 103, gramatur: '2.0 gr', harga_jual: 2920000, harga_beli: 2680000, stok: 5, deskripsi: 'Emas batangan 2 gram press segel resmi Antam kemurnian 999.9', is_favorit: 0 },
      { id: 104, gramatur: '5.0 gr', harga_jual: 7220000, harga_beli: 6650000, stok: 3, deskripsi: 'Emas batangan 5 gram segel CertiCard resmi kemurnian 99.99%', is_favorit: 0 },
      { id: 105, gramatur: '10.0 gr', harga_jual: 14350000, harga_beli: 13200000, stok: 2, deskripsi: 'Emas batangan 10 gram press segel resmi Antam investasi premium', is_favorit: 0 },
    ],
  },
  {
    id: 2,
    nama_merk: 'Mini Gold',
    keterangan: 'Sarana menabung emas mulai dari gramatur mikro bersertifikat resmi 24K',
    items: [
      { id: 201, gramatur: '0.025 gr', harga_jual: 48000, harga_beli: 40000, stok: 25, deskripsi: 'Mini Gold Black Series kemurnian 24K 99.9% bersertifikat', is_favorit: 0 },
      { id: 202, gramatur: '0.05 gr', harga_jual: 92000, harga_beli: 78000, stok: 20, deskripsi: 'Mini Gold Souvenir Series kemurnian 24K 99.9% bersertifikat', is_favorit: 0 },
      { id: 203, gramatur: '0.1 gr', harga_jual: 175000, harga_beli: 150000, stok: 15, deskripsi: 'Mini Gold Classic 0.1 gram kemurnian 24 Karat bersertifikat', is_favorit: 1 },
      { id: 204, gramatur: '0.25 gr', harga_jual: 415000, harga_beli: 360000, stok: 10, deskripsi: 'Mini Gold White Series 0.25 gram kemurnian 24K bersertifikat', is_favorit: 0 },
      { id: 205, gramatur: '0.5 gr', harga_jual: 780000, harga_beli: 700000, stok: 6, deskripsi: 'Mini Gold Reguler 0.5 gram kemurnian 24 Karat bersertifikat', is_favorit: 1 },
    ],
  },
  {
    id: 3,
    nama_merk: 'UBS Gold',
    keterangan: 'Emas batangan PT Untung Bersama Sejahtera kemurnian 99.99% segel hologram',
    items: [
      { id: 301, gramatur: '0.5 gr', harga_jual: 785000, harga_beli: 705000, stok: 5, deskripsi: 'UBS Gold kemurnian 99.99% segel press hologram resmi', is_favorit: 0 },
      { id: 302, gramatur: '1.0 gr', harga_jual: 1475000, harga_beli: 1340000, stok: 8, deskripsi: 'UBS Gold 1 gram kemurnian 99.99% hologram resmi bergaransi', is_favorit: 1 },
      { id: 303, gramatur: '2.0 gr', harga_jual: 2900000, harga_beli: 2660000, stok: 4, deskripsi: 'UBS Gold 2 gram kemurnian 99.99% segel resmi PT UBS', is_favorit: 0 },
      { id: 304, gramatur: '5.0 gr', harga_jual: 7180000, harga_beli: 6610000, stok: 2, deskripsi: 'UBS Gold 5 gram kemurnian 99.99% segel resmi PT UBS', is_favorit: 0 },
    ],
  },
];

export async function fetchPublicLogamMulia() {
  try {
    const res = await fetch('/api/public/logam-mulia');
    if (!res.ok) throw new Error('Failed to fetch');
    const json = await res.json();
    return json.data && json.data.length > 0 ? json.data : FALLBACK_LOGAM_MULIA;
  } catch (err) {
    console.warn('[API] Menggunakan data fallback logam mulia:', err.message);
    return FALLBACK_LOGAM_MULIA;
  }
}

export const FALLBACK_SMM = [
  {
    id: 1,
    nama_platform: 'TikTok',
    slug: 'tiktok',
    color: '#000000',
    deskripsi: 'Follower, Like Video & Viral Views TikTok Terpercaya',
    services: [
      {
        id: 1,
        nama_layanan: 'TikTok Followers (Aktif / HQ)',
        target_type: 'Username / Profil TikTok (Contoh: @akun_kamu)',
        packages: [
          { id: 1, jumlah_order: 250, harga_jual: 25000, is_popular: 0 },
          { id: 2, jumlah_order: 500, harga_jual: 45000, is_popular: 0 },
          { id: 3, jumlah_order: 1000, harga_jual: 79000, is_popular: 1 },
          { id: 4, jumlah_order: 2500, harga_jual: 185000, is_popular: 0 },
          { id: 5, jumlah_order: 5000, harga_jual: 350000, is_popular: 0 },
        ],
      },
    ],
  },
  {
    id: 2,
    nama_platform: 'Instagram',
    slug: 'instagram',
    color: '#E1306C',
    deskripsi: 'Followers Real/Mix, Likes Foto & Reels Views Instagram',
    services: [
      {
        id: 4,
        nama_layanan: 'Instagram Followers (Real / Mix)',
        target_type: 'Username Profil IG (Contoh: @akun_kamu)',
        packages: [
          { id: 14, jumlah_order: 250, harga_jual: 28000, is_popular: 0 },
          { id: 15, jumlah_order: 1000, harga_jual: 89000, is_popular: 1 },
        ],
      },
    ],
  },
  {
    id: 3,
    nama_platform: 'YouTube',
    slug: 'youtube',
    color: '#FF0000',
    deskripsi: 'Penambahan Jam Tayang, Views & Subscribers Channel YouTube',
    services: [
      {
        id: 7,
        nama_layanan: 'YouTube Views Video',
        target_type: 'Link Video YouTube',
        packages: [
          { id: 24, jumlah_order: 1000, harga_jual: 45000, is_popular: 0 },
          { id: 25, jumlah_order: 2500, harga_jual: 105000, is_popular: 1 },
        ],
      },
    ],
  },
];

export async function fetchPublicSmm() {
  try {
    const res = await fetch('/api/public/smm');
    if (!res.ok) throw new Error('Failed to fetch');
    const json = await res.json();
    return json.data && json.data.length > 0 ? json.data : FALLBACK_SMM;
  } catch (err) {
    console.warn('[API] Menggunakan data fallback booster sosmed:', err.message);
    return FALLBACK_SMM;
  }
}

