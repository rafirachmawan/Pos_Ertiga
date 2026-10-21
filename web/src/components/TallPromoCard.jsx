import React from 'react';

export default function TallPromoCard({
  tag = 'HOT SERVICE',
  title = 'Layanan Digital & Jasa IT',
  subtitle = 'Emas 24K, Pulsa PPOB, Booster Sosmed & Software',
  ctaText = 'Buka Layanan',
  onCtaClick,
  bgColor = '#EFF6FF',
  accentColor = '#2563EB',
}) {
  return (
    <div
      className="technova-tall-promo"
      style={{
        background: bgColor,
        borderColor: '#DBEAFE',
      }}
    >
      <div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: '700',
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            display: 'inline-block',
            marginBottom: '10px',
          }}
        >
          {tag}
        </span>
        <h3
          style={{
            fontSize: '20px',
            fontWeight: '800',
            color: '#0F172A',
            lineHeight: '1.25',
            marginBottom: '8px',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: '12.5px',
            color: '#475569',
            lineHeight: '1.55',
            marginBottom: '20px',
          }}
        >
          {subtitle}
        </p>

        <button
          type="button"
          onClick={onCtaClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: accentColor,
            color: '#FFFFFF',
            padding: '8px 18px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: '700',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <span>{ctaText}</span>
          <span>→</span>
        </button>
      </div>

      {/* Visual illustration box inside the tall card (like the MacBook cutout) */}
      <div
        style={{
          marginTop: '28px',
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #BFDBFE',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#1E40AF', fontWeight: '600' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563EB' }} />
          Pilihan Paket Tersedia
        </div>
        <div style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.5' }}>
          • Beli & Buyback Emas 24K
          <br />
          • Pulsa & Token PLN Instan
          <br />
          • Website & Kasir POS Toko
        </div>
      </div>
    </div>
  );
}
