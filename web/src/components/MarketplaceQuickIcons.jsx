import React from 'react';

export default function MarketplaceQuickIcons({
  categories = [],
  onSelectCategory,
  onOpenDigitalModal,
  onSwitchTab,
}) {
  const quickItems = [
    {
      id: 'pakaian',
      label: 'Pakaian Pria',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
        </svg>
      ),
      bg: '#EFF6FF',
      action: () => {
        const found = categories.find((c) => c.nama_kategori.toLowerCase().includes('pakaian'));
        onSelectCategory(found ? found.id : null);
        onSwitchTab('products');
      },
    },
    {
      id: 'hijab',
      label: 'Hijab Muslim',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DB2777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="5" />
          <path d="M20 21a8 8 0 1 0-16 0" />
        </svg>
      ),
      bg: '#FDF2F8',
      action: () => {
        const found = categories.find((c) => c.nama_kategori.toLowerCase().includes('hijab'));
        onSelectCategory(found ? found.id : null);
        onSwitchTab('products');
      },
    },
    {
      id: 'aksesoris',
      label: 'Aksesoris',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="8" />
          <line x1="12" y1="4" x2="12" y2="1" />
        </svg>
      ),
      bg: '#FFFBEB',
      action: () => {
        const found = categories.find((c) => c.nama_kategori.toLowerCase().includes('aksesoris'));
        onSelectCategory(found ? found.id : null);
        onSwitchTab('products');
      },
    },
    {
      id: 'pulsa',
      label: 'Pulsa & Data',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      ),
      bg: '#EFF6FF',
      action: () => onOpenDigitalModal('ppob'),
    },
    {
      id: 'listrik',
      label: 'Token PLN',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
      bg: '#FFFBEB',
      action: () => onOpenDigitalModal('ppob'),
    },
    {
      id: 'emas',
      label: 'Emas 24K',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M14.8 9A2 2 0 0 0 13 8h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1-1.8-1" />
          <path d="M12 6v2m0 8v2" />
        </svg>
      ),
      bg: '#FEF9C3',
      action: () => {
        const el = document.getElementById('logam-mulia-section');
        if (el) {
          const headerHeight = document.querySelector('.mp-header')?.offsetHeight || 135;
          const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      },
    },
    {
      id: 'smm',
      label: 'Booster Sosmed',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      bg: '#F5F3FF',
      action: () => {
        const el = document.getElementById('booster-sosmed-section');
        if (el) {
          const headerHeight = document.querySelector('.mp-header')?.offsetHeight || 135;
          const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      },
    },
    {
      id: 'appdev',
      label: 'Jasa Web & POS',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
      bg: '#ECFDF5',
      action: () => {
        const el = document.getElementById('jasa-web-section');
        if (el) {
          const headerHeight = document.querySelector('.mp-header')?.offsetHeight || 135;
          const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      },
    },
  ];

  return (
    <section className="mp-quick-section">
      <div className="marketplace-container">
        <div className="mp-quick-card">
          <div className="mp-quick-grid">
            {quickItems.map((item) => (
              <div
                key={item.id}
                className="mp-quick-item"
                onClick={item.action}
              >
                <div
                  className="mp-quick-icon-circle"
                  style={{ background: item.bg }}
                >
                  {item.icon}
                </div>
                <span className="mp-quick-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
