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
      icon: '👕',
      bg: '#E0F2FE',
      action: () => {
        const found = categories.find((c) => c.nama_kategori.toLowerCase().includes('pakaian'));
        onSelectCategory(found ? found.id : null);
        onSwitchTab('products');
      },
    },
    {
      id: 'hijab',
      label: 'Hijab Muslim',
      icon: '🧕',
      bg: '#FCE7F3',
      action: () => {
        const found = categories.find((c) => c.nama_kategori.toLowerCase().includes('hijab'));
        onSelectCategory(found ? found.id : null);
        onSwitchTab('products');
      },
    },
    {
      id: 'aksesoris',
      label: 'Aksesoris',
      icon: '💍',
      bg: '#FEF3C7',
      action: () => {
        const found = categories.find((c) => c.nama_kategori.toLowerCase().includes('aksesoris'));
        onSelectCategory(found ? found.id : null);
        onSwitchTab('products');
      },
    },
    {
      id: 'pulsa',
      label: 'Pulsa & Data',
      icon: '📱',
      bg: '#EFF6FF',
      action: () => onOpenDigitalModal('ppob'),
    },
    {
      id: 'listrik',
      label: 'Token PLN',
      icon: '⚡',
      bg: '#FFFBEB',
      action: () => onOpenDigitalModal('ppob'),
    },
    {
      id: 'emas',
      label: 'Emas 24K',
      icon: '🪙',
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
      icon: '🚀',
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
      icon: '💻',
      bg: '#ECFDF5',
      action: () => onOpenDigitalModal('appdev'),
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
