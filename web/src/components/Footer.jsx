import React from 'react';

export default function Footer({ storeInfo }) {
  const paymentMethods = ['QRIS', 'BCA', 'Mandiri', 'BRI', 'BNI', 'GoPay', 'OVO', 'ShopeePay', 'DANA', 'COD'];
  const couriers = ['JNE Express', 'J&T Express', 'SiCepat', 'GoSend', 'GrabExpress', 'Ambil di Toko'];

  return (
    <footer className="mp-footer">
      <div className="marketplace-container">
        <div className="mp-footer-main">
          <div className="mp-footer-grid">
            
            {/* Col 1: Store Profile & Address */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: '#03AC0E',
                    color: '#FFFFFF',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                  }}
                >
                  E
                </div>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                  {storeInfo?.nama_toko || 'POS ERTIGA STORE'}
                </span>
              </div>
              <p style={{ fontSize: '12px', lineHeight: '1.6', color: '#64748B', marginBottom: '12px' }}>
                {storeInfo?.alamat_toko || 'Desa Sumberjo Kulon, Kec. Ngunut, Kab. Tulungagung'}
              </p>
              <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>
                  <span style={{ color: '#0F172A', fontWeight: '600' }}>Jam Operasional:</span> 08:00 - 21:00 WIB
                </div>
                <div>
                  <span style={{ color: '#0F172A', fontWeight: '600' }}>Hari Buka:</span> Setiap Hari (Senin - Minggu)
                </div>
                <div>
                  <span style={{ color: '#0F172A', fontWeight: '600' }}>Layanan CS:</span> WhatsApp Fast Response
                </div>
              </div>
            </div>

            {/* Col 2: Panduan Belanja */}
            <div>
              <h4 className="mp-footer-col-title">Panduan Belanja</h4>
              <ul className="mp-footer-links">
                <li><a href="#katalog-produk">Katalog Produk</a></li>
                <li><a href="#flash-sale-section">Promo Flash Sale</a></li>
                <li><a href="#katalog-produk">Cara Pesan via WhatsApp</a></li>
                <li><a href="#katalog-produk">Garansi Produk Fisik</a></li>
                <li><a href="#katalog-produk">Syarat & Ketentuan</a></li>
              </ul>
            </div>

            {/* Col 3: Layanan Digital & Jasa */}
            <div>
              <h4 className="mp-footer-col-title">Layanan & Jasa</h4>
              <ul className="mp-footer-links">
                <li><a href="#ppob-section">Top-Up Pulsa & Paket Data</a></li>
                <li><a href="#ppob-section">Token Listrik PLN 24 Jam</a></li>
                <li><a href="#logam-mulia-section">Investasi Emas Logam Mulia</a></li>
                <li><a href="#booster-sosmed-section">Booster Sosmed SMM</a></li>
                <li><a href="#jasa-web-section">Jasa Web & Sistem Kasir</a></li>
              </ul>
            </div>

            {/* Col 4: Mitra Pembayaran & Ekspedisi */}
            <div>
              <h4 className="mp-footer-col-title">Metode Pembayaran</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                {paymentMethods.map((pm, idx) => (
                  <span key={idx} className="mp-badge-partner">
                    {pm}
                  </span>
                ))}
              </div>

              <h4 className="mp-footer-col-title">Mitra Pengiriman</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {couriers.map((cr, idx) => (
                  <span key={idx} className="mp-badge-partner">
                    {cr}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mp-footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} {storeInfo?.nama_toko || 'POS Ertiga'}. Hak Cipta Dilindungi.
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Keamanan Terjamin</span>
            <span>·</span>
            <span>Integrasi Sistem Kasir POS</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
