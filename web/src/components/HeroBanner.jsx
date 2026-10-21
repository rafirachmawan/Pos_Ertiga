import React from 'react';

export default function HeroBanner({ storeInfo, onCtaClick }) {
  return (
    <div className="container">
      <div className="technova-hero-card">
        
        {/* Left Column: Heading, Subtitle, CTA & Slider Dots */}
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              fontWeight: '700',
              color: '#2563EB',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '10px',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563EB' }} />
            Koleksi Pilihan & Promo Toko
          </div>

          <h1
            style={{
              fontSize: 'clamp(26px, 3.6vw, 38px)',
              fontWeight: '800',
              letterSpacing: '-0.025em',
              lineHeight: '1.2',
              marginBottom: '12px',
              color: '#0F172A',
            }}
          >
            Pilihan Produk Berkualitas, Pesan Cepat via WhatsApp
          </h1>

          <p
            style={{
              fontSize: '13.5px',
              color: '#64748B',
              lineHeight: '1.6',
              marginBottom: '24px',
              maxWidth: '480px',
            }}
          >
            Data stok terhubung otomatis dengan kasir toko fisik. Belanja praktis tanpa perlu registrasi akun.
          </p>

          {/* Action Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
            <button
              onClick={onCtaClick}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#2563EB',
                color: '#FFFFFF',
                padding: '10px 22px',
                borderRadius: '9999px',
                fontWeight: '700',
                fontSize: '13px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                transition: 'background-color 0.15s ease, transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1D4ED8')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563EB')}
            >
              <span>Belanja Sekarang</span>
              <span>→</span>
            </button>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>
              ● 100% Original & Ready Stock
            </span>
          </div>

          {/* Carousel indicator dots (matching Technova reference) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '20px', height: '6px', borderRadius: '3px', background: '#2563EB' }} />
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#CBD5E1' }} />
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#CBD5E1' }} />
          </div>
        </div>

        {/* Right Column: Featured Visual Showcase (like the monitor / device in reference) */}
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span
                style={{
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                Official Storefront
              </span>
              <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: '600' }}>
                ● Buka Setiap Hari
              </span>
            </div>

            {/* Visual Center Preview */}
            <div
              style={{
                height: '140px',
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '8px',
                padding: '16px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '16px',
                }}
              >
                PE
              </div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                {storeInfo?.nama_toko || 'POS ERTIGA STORE'}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                Katalog retail terlengkap & terintegrasi sistem kasir
              </div>
            </div>

            {/* Quick 3-Step Guide underneath */}
            <div
              style={{
                marginTop: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#475569',
                paddingTop: '12px',
                borderTop: '1px solid #E2E8F0',
              }}
            >
              <span>1. Pilih Produk</span>
              <span>·</span>
              <span>2. Masuk Keranjang</span>
              <span>·</span>
              <span>3. Kirim ke WhatsApp</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}


