import React from 'react';

export default function CategoryPromoBanners({ onSelectCategory, onOpenDigital }) {
  const banners = [
    {
      id: 'fashion',
      title: 'Pakaian & Fashion',
      sub: 'Koleksi busana pilihan toko fisik',
      tag: 'Katalog Retail',
      color: '#2563EB',
      bg: '#EFF6FF',
      action: () => onSelectCategory && onSelectCategory(null),
      btnText: 'Lihat Semua',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
        </svg>
      ),
    },
    {
      id: 'emas',
      title: 'Logam Mulia Emas',
      sub: 'Investasi Mini Gold, Antam & UBS',
      tag: 'Emas 24K Murni',
      color: '#D97706',
      bg: '#FFFBEB',
      action: () => {
        const el = document.getElementById('logam-mulia-section');
        if (el) {
          const headerHeight = document.querySelector('.mp-header')?.offsetHeight || 135;
          const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      },
      btnText: 'Cek Harga',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M14.8 9A2 2 0 0 0 13 8h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1-1.8-1" />
          <path d="M12 6v2m0 8v2" />
        </svg>
      ),
    },
    {
      id: 'it',
      title: 'Jasa IT & Digital',
      sub: 'Website, Kasir POS & SMM Booster',
      tag: 'Solusi Bisnis',
      color: '#059669',
      bg: '#ECFDF5',
      action: () => onOpenDigital && onOpenDigital('appdev'),
      btnText: 'Konsultasi',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
    },
  ];

  return (
    <div className="container" style={{ marginTop: '10px', marginBottom: '32px' }}>
      <div className="technova-bottom-banners">
        {banners.map((b) => (
          <div
            key={b.id}
            className="category-promo-card"
            onClick={b.action}
          >
            <div>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: '700',
                  color: b.color,
                  background: b.bg,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  display: 'inline-block',
                  marginBottom: '8px',
                }}
              >
                {b.tag}
              </span>
              <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: '800', color: '#0F172A', lineHeight: '1.25' }}>
                {b.title}
              </h3>
              <p style={{ margin: '4px 0 10px 0', fontSize: '12px', color: '#64748B' }}>
                {b.sub}
              </p>
              <span style={{ fontSize: '12px', fontWeight: '700', color: b.color, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {b.btnText} →
              </span>
            </div>

            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                background: b.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginLeft: '12px',
              }}
            >
              {b.icon}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
