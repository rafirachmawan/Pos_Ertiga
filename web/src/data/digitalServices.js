// web/src/data/digitalServices.js
// Konfigurasi Layanan Digital & Jasa (Model Broker / Manual Third-Party Fulfillment)

export const DIGITAL_SERVICES_META = [
  {
    id: 'emas',
    title: 'Jual Beli Emas',
    tagline: 'Logam Mulia 24K & Mini Gold',
    description: 'Investasi aman kepingan emas Antam, UBS, dan Mini Gold. Melayani beli baru & buyback resmi.',
    badge: 'Fisik & Bersertifikat',
    badgeColor: '#D97706',
    iconColor: '#F59E0B',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  {
    id: 'ppob',
    title: 'PPOB & Top-Up',
    tagline: 'Pulsa, Listrik & E-Wallet',
    description: 'Isi ulang pulsa all operator, paket internet hemat, token PLN, serta saldo e-wallet proses instan.',
    badge: 'Proses Cepat',
    badgeColor: '#2563EB',
    iconColor: '#3B82F6',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  {
    id: 'rasxmedia',
    title: 'Rasxmedia SMM Booster',
    tagline: 'Follower, Like & View Sosmed',
    description: 'Tingkatkan kredibilitas akun TikTok, Instagram, dan YouTube Anda. 100% aman tanpa password!',
    badge: 'Garansi & Aman',
    badgeColor: '#7C3AED',
    iconColor: '#8B5CF6',
    bgColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  {
    id: 'appdev',
    title: 'Jasa Web & Aplikasi',
    tagline: 'Custom Software & E-Commerce',
    description: 'Pembuatan website profesional, toko online, sistem kasir POS, dan solusi digital custom bisnis Anda.',
    badge: 'Profesional & Bergaransi',
    badgeColor: '#059669',
    iconColor: '#10B981',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
];

// 1. Data Jual Beli Emas
export const GOLD_DATA = {
  brands: ['Mini Gold', 'Antam Logam Mulia', 'UBS Gold'],
  tiers: [
    { gram: '0.025 gr', buyPrice: 48000, buybackPrice: 42000, popular: false },
    { gram: '0.05 gr', buyPrice: 92000, buybackPrice: 83000, popular: false },
    { gram: '0.1 gr', buyPrice: 175000, buybackPrice: 158000, popular: true },
    { gram: '0.25 gr', buyPrice: 415000, buybackPrice: 380000, popular: false },
    { gram: '0.5 gr', buyPrice: 790000, buybackPrice: 730000, popular: true },
    { gram: '1.0 gr', buyPrice: 1485000, buybackPrice: 1390000, popular: true },
    { gram: '2.0 gr', buyPrice: 2920000, buybackPrice: 2750000, popular: false },
    { gram: '5.0 gr', buyPrice: 7220000, buybackPrice: 6850000, popular: false },
  ],
  notes: [
    'Semua kepingan emas 100% Asli bersertifikat resmi 24 Karat (99.9%).',
    'Melayani pengiriman berasuransi ke seluruh Indonesia atau ambil langsung di toko.',
    'Harga buyback (jual kembali) dihitung berdasarkan kondisi fisik & kelengkapan sertifikat.',
  ],
};

// 2. Data PPOB
export const PPOB_DATA = {
  categories: [
    {
      id: 'pulsa',
      name: 'Pulsa Reguler',
      providers: ['Telkomsel', 'Indosat Ooredoo', 'XL Axiata', 'Tri (3)', 'Smartfren', 'Axis'],
      items: {
        'Telkomsel': [
          { nominal: '5.000', price: 6500 },
          { nominal: '10.000', price: 11800 },
          { nominal: '20.000', price: 21500 },
          { nominal: '25.000', price: 26500 },
          { nominal: '50.000', price: 51500 },
          { nominal: '100.000', price: 100500 },
        ],
        'Indosat Ooredoo': [
          { nominal: '5.000', price: 6300 },
          { nominal: '10.000', price: 11500 },
          { nominal: '25.000', price: 26000 },
          { nominal: '50.000', price: 51000 },
          { nominal: '100.000', price: 99500 },
        ],
        'XL Axiata': [
          { nominal: '5.000', price: 6500 },
          { nominal: '10.000', price: 11700 },
          { nominal: '25.000', price: 26300 },
          { nominal: '50.000', price: 51200 },
          { nominal: '100.000', price: 100000 },
        ],
        'Tri (3)': [
          { nominal: '5.000', price: 6000 },
          { nominal: '10.000', price: 11200 },
          { nominal: '20.000', price: 21000 },
          { nominal: '50.000', price: 50500 },
          { nominal: '100.000', price: 99000 },
        ],
        'Smartfren': [
          { nominal: '10.000', price: 11500 },
          { nominal: '20.000', price: 21000 },
          { nominal: '50.000', price: 50500 },
          { nominal: '100.000', price: 99500 },
        ],
        'Axis': [
          { nominal: '5.000', price: 6300 },
          { nominal: '10.000', price: 11500 },
          { nominal: '25.000', price: 26000 },
          { nominal: '50.000', price: 51000 },
          { nominal: '100.000', price: 99800 },
        ],
      },
    },
    {
      id: 'listrik',
      name: 'Token Listrik PLN',
      providers: ['PLN Prabayar'],
      items: {
        'PLN Prabayar': [
          { nominal: 'Token 20.000', price: 22500 },
          { nominal: 'Token 50.000', price: 52500 },
          { nominal: 'Token 100.000', price: 102500 },
          { nominal: 'Token 200.000', price: 202500 },
          { nominal: 'Token 500.000', price: 502500 },
        ],
      },
    },
    {
      id: 'ewallet',
      name: 'Top-Up E-Wallet',
      providers: ['DANA', 'GoPay', 'OVO', 'ShopeePay'],
      items: {
        'DANA': [
          { nominal: 'Saldo 20.000', price: 21500 },
          { nominal: 'Saldo 50.000', price: 51500 },
          { nominal: 'Saldo 100.000', price: 101500 },
          { nominal: 'Saldo 200.000', price: 202000 },
        ],
        'GoPay': [
          { nominal: 'Saldo 20.000', price: 21500 },
          { nominal: 'Saldo 50.000', price: 51500 },
          { nominal: 'Saldo 100.000', price: 101500 },
          { nominal: 'Saldo 200.000', price: 202000 },
        ],
        'OVO': [
          { nominal: 'Saldo 20.000', price: 21500 },
          { nominal: 'Saldo 50.000', price: 51500 },
          { nominal: 'Saldo 100.000', price: 101500 },
        ],
        'ShopeePay': [
          { nominal: 'Saldo 20.000', price: 21500 },
          { nominal: 'Saldo 50.000', price: 51500 },
          { nominal: 'Saldo 100.000', price: 101500 },
        ],
      },
    },
    {
      id: 'paket_data',
      name: 'Paket Kuota Data',
      providers: ['Telkomsel', 'Indosat', 'XL'],
      items: {
        'Telkomsel': [
          { nominal: 'Maxstream 10 GB (30 Hari)', price: 38000 },
          { nominal: 'Internet OMG! 14 GB (30 Hari)', price: 68000 },
          { nominal: 'Internet Sakti 30 GB (30 Hari)', price: 95000 },
        ],
        'Indosat': [
          { nominal: 'Freedom Internet 7 GB (30 Hari)', price: 32000 },
          { nominal: 'Freedom Internet 18 GB (30 Hari)', price: 58000 },
          { nominal: 'Freedom Internet 42 GB (30 Hari)', price: 98000 },
        ],
        'XL': [
          { nominal: 'Xtra Combo Flex 12 GB (30 Hari)', price: 42000 },
          { nominal: 'Xtra Combo Flex 26 GB (30 Hari)', price: 65000 },
          { nominal: 'Xtra Combo Flex 55 GB (30 Hari)', price: 105000 },
        ],
      },
    },
  ],
};

// 3. Data Rasxmedia SMM
export const RASXMEDIA_DATA = {
  platforms: [
    {
      id: 'tiktok',
      name: 'TikTok',
      color: '#000000',
      services: [
        {
          name: 'TikTok Followers (Aktif / HQ)',
          tiers: [
            { qty: 250, price: 25000 },
            { qty: 500, price: 45000 },
            { qty: 1000, price: 79000, popular: true },
            { qty: 2500, price: 185000 },
            { qty: 5000, price: 350000 },
          ],
          targetType: 'Username / Profil TikTok (Contoh: @akun_kamu)',
        },
        {
          name: 'TikTok Video Views (Cepat & Viral)',
          tiers: [
            { qty: 5000, price: 10000 },
            { qty: 10000, price: 18000, popular: true },
            { qty: 50000, price: 75000 },
            { qty: 100000, price: 135000 },
          ],
          targetType: 'Link Video TikTok (URL VT)',
        },
        {
          name: 'TikTok Likes Video',
          tiers: [
            { qty: 200, price: 15000 },
            { qty: 500, price: 30000, popular: true },
            { qty: 1000, price: 55000 },
            { qty: 2500, price: 125000 },
          ],
          targetType: 'Link Video TikTok (URL VT)',
        },
      ],
    },
    {
      id: 'instagram',
      name: 'Instagram',
      color: '#E1306C',
      services: [
        {
          name: 'Instagram Followers (Real / Mix)',
          tiers: [
            { qty: 250, price: 28000 },
            { qty: 500, price: 50000 },
            { qty: 1000, price: 89000, popular: true },
            { qty: 2500, price: 210000 },
          ],
          targetType: 'Username Profil IG (Contoh: @akun_kamu)',
        },
        {
          name: 'Instagram Likes Postingan/Reels',
          tiers: [
            { qty: 250, price: 12000 },
            { qty: 500, price: 22000, popular: true },
            { qty: 1000, price: 38000 },
            { qty: 2500, price: 85000 },
          ],
          targetType: 'Link Foto / Reels Instagram',
        },
        {
          name: 'Instagram Reels Views',
          tiers: [
            { qty: 2000, price: 12000 },
            { qty: 5000, price: 25000, popular: true },
            { qty: 10000, price: 45000 },
            { qty: 25000, price: 95000 },
          ],
          targetType: 'Link Reels Instagram',
        },
      ],
    },
    {
      id: 'youtube',
      name: 'YouTube',
      color: '#FF0000',
      services: [
        {
          name: 'YouTube Views Video',
          tiers: [
            { qty: 1000, price: 45000 },
            { qty: 2500, price: 105000, popular: true },
            { qty: 5000, price: 195000 },
          ],
          targetType: 'Link Video YouTube',
        },
        {
          name: 'YouTube Subscribers',
          tiers: [
            { qty: 100, price: 65000 },
            { qty: 250, price: 155000, popular: true },
            { qty: 500, price: 295000 },
          ],
          targetType: 'Link Channel YouTube',
        },
      ],
    },
  ],
  safetyNotes: [
    '100% AMAN: HANYA butuh link / username. KAMI TIDAK PERNAH meminta password akun Anda.',
    'Akun / postingan WAJIB dipublikasikan (TIDAK BOLEH di-private) selama proses pengiriman.',
    'Proses masuk secara natural dan bertahap dalam kurun waktu 1 - 24 jam.',
  ],
};

// 4. Data Jasa Pembuatan Web & Aplikasi
export const APP_DEV_DATA = {
  packages: [
    {
      id: 'landing_page',
      title: 'Landing Page & Company Profile',
      tagline: 'Solusi Cepat Branding Usaha',
      priceEstimate: 'Mulai Rp 750.000',
      estimatedDays: '3 - 5 Hari Kerja',
      features: [
        'Desain Elegan, Mewah & Mobile Friendly (Responsif HP & PC)',
        'Domain .com & Hosting Cepat 1 Tahun',
        'Tombol Direct Order / Call to WhatsApp',
        'SEO Friendly agar mudah ditemukan di Google',
        'Gratis Revisi & Bimbingan Penggunaan',
      ],
    },
    {
      id: 'ecommerce',
      title: 'Website Toko Online / E-Commerce',
      tagline: 'Katalog Produk & Checkout Otomatis',
      popular: true,
      priceEstimate: 'Mulai Rp 1.800.000',
      estimatedDays: '7 - 14 Hari Kerja',
      features: [
        'Katalog Produk lengkap (Foto, Varian, Berat, Diskon)',
        'Integrasi Keranjang Belanja & Direct WA Order',
        'Panel Admin Pengelolaan Produk & Pesanan',
        'Bisa Sinkronisasi dengan Aplikasi Kasir POS Toko',
        'Free Setup Domain .com & Cloud Server',
      ],
    },
    {
      id: 'pos_cashier',
      title: 'Aplikasi Kasir POS & Manajemen Stok',
      tagline: 'Sistem Kasir Offline / Online Toko',
      priceEstimate: 'Mulai Rp 2.500.000',
      estimatedDays: '10 - 20 Hari Kerja',
      features: [
        'Kasir Cepat Barcode Scanner & Cetak Struk Bluetooth / Thermal',
        'Manajemen Stok, HPP, Riwayat Restock, & Laba Bersih',
        'Laporan Penjualan Harian, Bulanan & Cetak PDF / Excel',
        'Multi User (Admin & Kasir) dengan Hak Akses',
        'Training & Garansi Maintenance Sistem',
      ],
    },
    {
      id: 'custom',
      title: 'Custom Software & Integrasi Khusus',
      tagline: 'Sesuai Kebutuhan & Alur Bisnis Anda',
      priceEstimate: 'Sesuai Spesifikasi (Diskusikan)',
      estimatedDays: 'Fleksibel',
      features: [
        'Sistem Keuangan / Akuntansi Custom',
        'Aplikasi Android & iOS (React Native / Flutter)',
        'Integrasi WhatsApp API Gateway & Notifikasi Otomatis',
        'Konsultasi Arsitektur Software Bebas Biaya',
      ],
    },
  ],
};
