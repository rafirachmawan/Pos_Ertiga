import React from 'react';

export default function Footer({
  storeInfo,
  onSelectSpecialTab,
  onScrollToCatalog,
  onScrollToFlashSale,
  onOpenCart,
}) {
  const storeName = storeInfo?.nama_toko || 'Ertiga Store';
  const cleanPhone = String(storeInfo?.telepon || '085196221716').replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('0')
    ? '62' + cleanPhone.slice(1)
    : cleanPhone.startsWith('62')
    ? cleanPhone
    : '62' + cleanPhone;

  const displayPhone = storeInfo?.telepon || '0851-9622-1716';
  const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
    'Halo ' + storeName + ', saya ingin bertanya mengenai pemesanan produk dan layanan toko.'
  )}`;

  return (
    <footer className="mp-footer">
      <div className="marketplace-container">
        <div className="mp-footer-main">
          <div className="mp-footer-grid">
            
            {/* Kolom 1: Profil Toko & Kontak WhatsApp */}
            <div>
              <div className="mp-footer-brand-header">
                <div className="mp-footer-logo-box">
                  {storeInfo?.logo_url ? (
                    <img
                      src={storeInfo.logo_url}
                      alt={storeName}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span>{storeInfo?.logo_text || (storeName ? storeName.charAt(0).toUpperCase() : 'E')}</span>
                  )}
                </div>
                <div>
                  <div className="mp-footer-brand-name">{storeName}</div>
                  <span className="mp-footer-brand-badge">OFFICIAL STORE</span>
                </div>
              </div>

              <p className="mp-footer-desc">
                {storeInfo?.alamat_toko || 'Desa Sumberjo Kulon, Kec. Ngunut, Kab. Tulungagung'}
              </p>

              <div className="mp-footer-info-row">
                <strong>Jam Operasional:</strong> 08:00 - 21:00 WIB
              </div>
              <div className="mp-footer-info-row">
                <strong>Hari Buka:</strong> Setiap Hari (Senin - Minggu)
              </div>

              <div className="mp-footer-wa-action">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mp-footer-wa-clean-btn"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  <span>Chat WhatsApp ({displayPhone})</span>
                </a>
              </div>
            </div>

            {/* Kolom 2: Katalog & Produk */}
            <div>
              <h4 className="mp-footer-title">Katalog & Produk</h4>
              <ul className="mp-footer-link-list">
                <li>
                  <button onClick={onScrollToCatalog}>
                    Katalog Pakaian
                  </button>
                </li>
                <li>
                  <button onClick={onScrollToFlashSale}>
                    Promo Flash Sale
                  </button>
                </li>
                <li>
                  <button onClick={onOpenCart}>
                    Keranjang Belanja
                  </button>
                </li>
                <li>
                  <a href={waUrl} target="_blank" rel="noreferrer">
                    Cara Pesan via WhatsApp
                  </a>
                </li>
              </ul>
            </div>

            {/* Kolom 3: Layanan Digital & Jasa */}
            <div>
              <h4 className="mp-footer-title">Layanan Digital & Jasa</h4>
              <ul className="mp-footer-link-list">
                <li>
                  <button onClick={() => onSelectSpecialTab && onSelectSpecialTab('gold')}>
                    Logam Mulia Emas 24K
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectSpecialTab && onSelectSpecialTab('ppob')}>
                    Top Up Pulsa & Kuota
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectSpecialTab && onSelectSpecialTab('ppob')}>
                    Token Listrik PLN
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectSpecialTab && onSelectSpecialTab('smm')}>
                    Booster Sosmed SMM
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectSpecialTab && onSelectSpecialTab('webdev')}>
                    Jasa Web & Kasir POS
                  </button>
                </li>
              </ul>
            </div>

            {/* Kolom 4: Pemesanan & Pengiriman */}
            <div>
              <h4 className="mp-footer-title">Pemesanan & Pembayaran</h4>
              <p className="mp-footer-order-text">
                Pilih barang di web, konfirmasi pesanan dan pembayaran diproses langsung melalui WhatsApp resmi toko.
              </p>

              <div className="mp-footer-subgroup">
                <span className="mp-footer-sublabel">Metode Pembayaran (via WhatsApp)</span>
                <div className="mp-footer-tags">
                  <span>Transfer Bank</span>
                  <span>QRIS</span>
                  <span>Bayar di Toko / COD</span>
                </div>
              </div>

              <div className="mp-footer-subgroup">
                <span className="mp-footer-sublabel">Pengiriman & Ambil Sendiri</span>
                <div className="mp-footer-tags">
                  <span>J&T Express</span>
                  <span>JNE</span>
                  <span>SiCepat</span>
                  <span>Ambil di Toko Fisik</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mp-footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} {storeName}. Hak Cipta Dilindungi.
          </div>
          <div className="mp-footer-bottom-meta">
            <span>Transaksi via WhatsApp Resmi</span>
            <span>·</span>
            <span>Terintegrasi Kasir POS Ertiga</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
