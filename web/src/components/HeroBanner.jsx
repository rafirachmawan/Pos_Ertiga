import React from 'react';

export default function HeroBanner({ storeInfo }) {
  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-grid">
          
          {/* Left Column: Heading & Value Props */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: '600',
                color: '#93C5FD',
                marginBottom: '14px',
              }}
            >
              <span>✨</span> Koleksi Pilihan Toko Online Resmi
            </div>

            <h1
              style={{
                fontSize: 'clamp(22px, 3.5vw, 32px)',
                fontWeight: '800',
                letterSpacing: '-0.025em',
                lineHeight: '1.25',
                marginBottom: '10px',
                color: '#FFFFFF',
              }}
            >
              Pilihan Produk Berkualitas, Pesan Cepat Langsung via WhatsApp
            </h1>

            <p
              style={{
                fontSize: '13.5px',
                color: '#94A3B8',
                lineHeight: '1.6',
                marginBottom: '20px',
                maxWidth: '560px',
              }}
            >
              Koleksi produk fashion & retail pilihan terbaik kami. Data stok terhubung langsung dan akurat dengan kasir toko fisik.
            </p>

            {/* USP Badges */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#E2E8F0', fontWeight: '500' }}>
                <span style={{ color: '#10B981', fontWeight: '800' }}>✓</span> 100% Produk Original
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#E2E8F0', fontWeight: '500' }}>
                <span style={{ color: '#10B981', fontWeight: '800' }}>✓</span> Stok Terkini Real-Time
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#E2E8F0', fontWeight: '500' }}>
                <span style={{ color: '#10B981', fontWeight: '800' }}>✓</span> Layanan WhatsApp Ramah
              </div>
            </div>
          </div>

          {/* Right Column: Mini Feature Card (Desktop only) */}
          <div className="hero-card-side">
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '20px',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#2563EB',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                  }}
                >
                  ⚡
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#FFFFFF' }}>
                    Belanja Praktis Tanpa Ribet
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                    Tanpa perlu daftar akun, langsung pesan
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: '1.6', background: 'rgba(15, 23, 42, 0.4)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                1. Pilih produk & tentukan jumlah<br />
                2. Masukkan ke keranjang belanja<br />
                3. Kirim rincian pesanan langsung ke WhatsApp toko kami
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
