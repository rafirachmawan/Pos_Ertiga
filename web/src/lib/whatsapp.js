import { formatRupiah, formatWeight } from './format';

export function generateWhatsAppOrderUrl({
  storePhone = '6281234567890',
  customer,
  items,
  subtotal,
  totalWeight,
}) {
  const cleanPhone = storePhone.replace(/[^0-9]/g, '');
  const finalPhone = cleanPhone.startsWith('0')
    ? '62' + cleanPhone.slice(1)
    : cleanPhone.startsWith('62')
    ? cleanPhone
    : '62' + cleanPhone;

  const dateStr = new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const lines = [
    `*HALO, SAYA INGIN MEMESAN DARI WEBSITE* 🛍️`,
    `_Waktu: ${dateStr}_`,
    ``,
    `*📋 DATA PENERIMA:*`,
    `• *Nama:* ${customer.nama || '-'}`,
    `• *No. HP/WA:* ${customer.telepon || '-'}`,
    `• *Alamat Pengiriman:* ${customer.alamat || '-'}`,
    customer.catatan ? `• *Catatan:* ${customer.catatan}` : null,
    ``,
    `*📦 DAFTAR PESANAN:*`,
  ];

  items.forEach((item, idx) => {
    const itemTotal = (item.harga_jual || 0) * item.qty;
    const itemWeight = (item.berat_gram || 0) * item.qty;
    lines.push(
      `${idx + 1}. *${item.nama_barang}*` +
        `\n   ${item.qty} ${item.satuan || 'pcs'} x Rp ${formatRupiah(item.harga_jual)} = *Rp ${formatRupiah(itemTotal)}*` +
        (itemWeight > 0 ? ` (${formatWeight(itemWeight)})` : '')
    );
  });

  lines.push(``);
  lines.push(`*⚖️ Total Estimasi Berat:* ${formatWeight(totalWeight)}`);
  lines.push(`*💰 Total Belanja:* *Rp ${formatRupiah(subtotal)}*`);
  lines.push(`_(Belum termasuk ongkos kirim)_`);
  lines.push(``);
  lines.push(`Mohon konfirmasi ketersediaan stok dan info total ongkos kirim ya Kak. Terima kasih! 🙏`);

  const message = lines.filter((l) => l !== null).join('\n');
  return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
}

// 1. WhatsApp Order untuk Jual Beli Emas
export function generateWhatsAppGoldUrl({
  storePhone = '6281234567890',
  mode, // 'buy' atau 'buyback'
  brand,
  gram,
  qty = 1,
  unitPrice = 0,
  totalPrice = 0,
  customer = {},
  deliveryOption = 'Ambil di Toko',
}) {
  const cleanPhone = storePhone.replace(/[^0-9]/g, '');
  const finalPhone = cleanPhone.startsWith('0')
    ? '62' + cleanPhone.slice(1)
    : cleanPhone.startsWith('62')
    ? cleanPhone
    : '62' + cleanPhone;

  const isBuy = mode === 'buy';
  const lines = [
    isBuy ? `*HALO, SAYA INGIN BELI EMAS* 🥇` : `*HALO, SAYA INGIN JUAL EMAS (BUYBACK)* 🔄`,
    ``,
    `*📋 DATA PELANGGAN:*`,
    `• *Nama:* ${customer.nama || '-'}`,
    `• *No. WhatsApp:* ${customer.telepon || '-'}`,
    customer.alamat ? `• *Alamat:* ${customer.alamat}` : null,
    ``,
    `*💎 RINCIAN EMAS:*`,
    `• *Kategori:* ${isBuy ? 'Pembelian Emas Baru' : 'Jual Emas ke Toko (Buyback)'}`,
    `• *Merk/Produsen:* ${brand || 'Mini Gold / Antam'}`,
    `• *Berat/Gramatur:* ${gram}`,
    `• *Jumlah:* ${qty} keping`,
    `• *Harga Satuan:* Rp ${formatRupiah(unitPrice)}`,
    `• *Total Estimasi:* *Rp ${formatRupiah(totalPrice)}*`,
    `• *Metode:* ${deliveryOption}`,
    customer.catatan ? `• *Catatan:* ${customer.catatan}` : null,
    ``,
    isBuy
      ? `Mohon info ketersediaan stok fisik dan nomor rekening pembayaran ya Admin. Terima kasih!`
      : `Mohon info prosedur penyerahan emas dan verifikasi keasliannya ya Admin. Terima kasih!`,
  ];

  const message = lines.filter((l) => l !== null).join('\n');
  return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
}

// 2. WhatsApp Order untuk PPOB (Pulsa, PLN, E-Wallet)
export function generateWhatsAppPpobUrl({
  storePhone = '6281234567890',
  categoryName,
  provider,
  targetNumber,
  nominal,
  price,
  customer = {},
}) {
  const cleanPhone = storePhone.replace(/[^0-9]/g, '');
  const finalPhone = cleanPhone.startsWith('0')
    ? '62' + cleanPhone.slice(1)
    : cleanPhone.startsWith('62')
    ? cleanPhone
    : '62' + cleanPhone;

  const lines = [
    `*HALO, SAYA INGIN ORDER PPOB / TOP-UP* ⚡`,
    ``,
    `*📋 DETAIL PESANAN:*`,
    `• *Layanan:* ${categoryName}`,
    `• *Provider/Operator:* ${provider}`,
    `• *Nomor / ID Tujuan:* *${targetNumber}*`,
    `• *Pilihan Produk:* ${nominal}`,
    `• *Total Tagihan:* *Rp ${formatRupiah(price)}*`,
    ``,
    `*👤 DATA PEMESAN:*`,
    `• *Nama Pemesan:* ${customer.nama || '-'}`,
    `• *No. WA Konfirmasi:* ${customer.telepon || '-'}`,
    ``,
    `Mohon kirimkan QRIS / Nomor Rekening untuk pembayaran ya Kak agar bisa segera diproses. Terima kasih! 🙏`,
  ];

  const message = lines.filter((l) => l !== null).join('\n');
  return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
}

// 3. WhatsApp Order untuk Rasxmedia SMM Booster
export function generateWhatsAppSmmUrl({
  storePhone = '6281234567890',
  platform,
  serviceName,
  targetLink,
  qty,
  price,
  customer = {},
}) {
  const cleanPhone = storePhone.replace(/[^0-9]/g, '');
  const finalPhone = cleanPhone.startsWith('0')
    ? '62' + cleanPhone.slice(1)
    : cleanPhone.startsWith('62')
    ? cleanPhone
    : '62' + cleanPhone;

  const lines = [
    `*HALO, SAYA INGIN ORDER BOOSTER RASXMEDIA* 🚀`,
    ``,
    `*🎯 DETAIL SOSIAL MEDIA:*`,
    `• *Platform:* ${platform}`,
    `• *Layanan:* ${serviceName}`,
    `• *Target Akun / Link Postingan:* *${targetLink}*`,
    `• *Jumlah / Kuantitas:* ${qty.toLocaleString('id-ID')}`,
    `• *Total Harga:* *Rp ${formatRupiah(price)}*`,
    ``,
    `*👤 DATA PEMESAN:*`,
    `• *Nama:* ${customer.nama || '-'}`,
    `• *No. WhatsApp:* ${customer.telepon || '-'}`,
    ``,
    `_Catatan: Akun sudah dipastikan publik (tidak private)._`,
    `Mohon info rekening pembayaran untuk segera dieksekusi ya Admin. Terima kasih! ✨`,
  ];

  const message = lines.filter((l) => l !== null).join('\n');
  return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
}

// 4. WhatsApp Konsultasi Jasa Pembuatan Aplikasi & Web
export function generateWhatsAppAppDevUrl({
  storePhone = '6281234567890',
  packageTitle,
  priceEstimate,
  estimatedDays,
  projectBrief,
  budgetRange,
  customer = {},
}) {
  const cleanPhone = storePhone.replace(/[^0-9]/g, '');
  const finalPhone = cleanPhone.startsWith('0')
    ? '62' + cleanPhone.slice(1)
    : cleanPhone.startsWith('62')
    ? cleanPhone
    : '62' + cleanPhone;

  const lines = [
    `*HALO, SAYA INGIN KONSULTASI JASA PEMBUATAN WEB / APLIKASI* 💻`,
    ``,
    `*📋 PILIHAN PAKET:*`,
    `• *Paket Layanan:* ${packageTitle}`,
    `• *Estimasi Biaya Dasar:* ${priceEstimate}`,
    `• *Estimasi Pengerjaan:* ${estimatedDays}`,
    ``,
    `*👤 DATA KLIEN:*`,
    `• *Nama / Nama Usaha:* ${customer.nama || '-'}`,
    `• *No. WhatsApp:* ${customer.telepon || '-'}`,
    customer.email ? `• *Email:* ${customer.email}` : null,
    ``,
    `*📝 KEBUTUHAN SISTEM & CATATAN:*`,
    `• *Rincian Kebutuhan:* ${projectBrief || 'Ingin konsultasi terlebih dahulu'}`,
    budgetRange ? `• *Budget Alokasi:* ${budgetRange}` : null,
    ``,
    `Mohon info ketersediaan jadwal konsultasi dan panduan teknisnya ya Kak. Terima kasih!`,
  ];

  const message = lines.filter((l) => l !== null).join('\n');
  return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
}

