import React from 'react';

export default function FeatureBar({ onSelectFeature }) {
  const features = [
    {
      id: 'original',
      iconBg: '#FEF3C7',
      iconColor: '#D97706',
      title: '100% Original',
      subtitle: 'Produk Terjamin',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      id: 'stock',
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
      title: 'Stok Terkini',
      subtitle: 'Sinkron Kasir Fisik',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      ),
    },
    {
      id: 'digital',
      iconBg: '#ECFDF5',
      iconColor: '#059669',
      title: 'Layanan Digital',
      subtitle: 'Emas, PPOB & Jasa IT',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
    },
    {
      id: 'whatsapp',
      iconBg: '#FFF7ED',
      iconColor: '#EA580C',
      title: 'Order WhatsApp',
      subtitle: 'Tanpa Perlu Akun',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="container">
      <div className="technova-features-grid">
        {features.map((f) => (
          <div
            key={f.id}
            className="feature-usp-card"
            onClick={() => onSelectFeature && onSelectFeature(f.id)}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: f.iconBg,
                color: f.iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {f.icon}
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A', lineHeight: '1.2' }}>
                {f.title}
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '3px' }}>
                {f.subtitle}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
