import React from 'react';

export default function Navbar({
  storeName = 'POS ERTIGA STORE',
  storeAddress = 'Sumberjo Kulon, Ngunut',
  storePhone = '6281234567890',
  cartCount = 0,
  onOpenCart,
  searchQuery,
  onSearchChange,
  activeTab = 'products',
  onTabChange,
  onSelectCategory,
  onOpenDigitalModal,
}) {


  const cleanPhone = String(storePhone || '6281234567890').replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('0')
    ? '62' + cleanPhone.slice(1)
    : cleanPhone.startsWith('62')
    ? cleanPhone
    : '62' + cleanPhone;

  const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent('Halo ' + storeName + ', saya ingin bertanya mengenai produk dan layanan toko.')}`;

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const headerHeight = document.querySelector('.mp-header')?.offsetHeight || 135;
      const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <header className="mp-header">
      {/* 1. Top Utility Bar (Tokopedia/Shopee style) */}
      <div className="mp-topbar">
        <div className="marketplace-container">
          <div className="mp-topbar-inner">
            <div className="mp-topbar-left">
              <span className="mp-topbar-item">
                <span style={{ color: '#03AC0E', fontWeight: '700' }}>✓</span> Toko Resmi & Terpercaya
              </span>
              <span className="mp-topbar-item">
                📍 {storeAddress}
              </span>
              <span className="mp-topbar-item">
                🕒 Jam Operasional: 08:00 - 21:00 WIB
              </span>
            </div>

            <div className="mp-topbar-right">
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="mp-topbar-item"
                style={{ fontWeight: '600' }}
              >
                💬 Customer Service (WA)
              </a>
              <span className="mp-topbar-item">
                🛡️ Transaksi Aman & Cepat
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Navbar Row */}
      <div className="mp-navbar-main">
        <div className="marketplace-container">
          <div className="mp-navbar-row">
            
            {/* Brand Logo */}
            <div
              className="mp-brand"
              onClick={() => {
                onTabChange && onTabChange('products');
                onSelectCategory && onSelectCategory(null);
              }}
            >
              <div className="mp-brand-logo-box">
                E
              </div>
              <div className="mp-brand-title">
                <span>{storeName}</span>
                <span className="mp-brand-badge">OFFICIAL STORE</span>
              </div>
            </div>

            {/* Prominent Search Bar (Tokopedia Style) */}
            <div className="mp-search-container">
              <div className="mp-search-input-box">
                <input
                  type="text"
                  placeholder="Cari produk pakaian, hijab, pulsa, atau layanan digital..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="mp-search-input"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    style={{ padding: '0 10px', color: '#999', fontSize: '13px' }}
                    title="Hapus pencarian"
                  >
                    ✕
                  </button>
                )}
                <button
                  className="mp-search-btn"
                  title="Cari"
                  onClick={() => onTabChange && onTabChange('products')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
              </div>


            </div>

            {/* Right Action Icons */}
            <div className="mp-actions">
              {/* WhatsApp Quick Chat */}
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="mp-wa-btn"
                title="Hubungi Penjual via WhatsApp"
              >
                <span>💬</span>
                <span>Chat Penjual</span>
              </a>

              {/* Cart Button with Bubble Badge */}
              <button
                id="btn-cart-nav"
                className="mp-cart-btn"
                onClick={onOpenCart}
                title="Buka Keranjang Belanja"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span>Keranjang</span>
                {cartCount > 0 && (
                  <span className="mp-cart-badge">{cartCount}</span>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Category Links (Shopee & Tokopedia Style) */}
      <div style={{ background: '#FFFFFF', borderTop: '1px solid #F0F2F5' }}>
        <div className="marketplace-container">
          <div className="mp-subnav">
            <span
              className={`mp-subnav-pill ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => {
                if (activeTab !== 'products' && onTabChange) onTabChange('products');
                setTimeout(() => scrollToSection('katalog-produk'), 50);
              }}
            >
              🏷️ Katalog Belanja
            </span>
            <span
              className="mp-subnav-pill"
              onClick={() => scrollToSection('flash-sale-section')}
            >
              ⚡ Flash Sale Hari Ini
            </span>
            <span
              className="mp-subnav-pill"
              onClick={() => scrollToSection('ppob-section')}
            >
              📱 Top Up & Tagihan PPOB
            </span>
            <span
              className="mp-subnav-pill"
              onClick={() => scrollToSection('logam-mulia-section')}
            >
              🪙 Logam Mulia Emas 24K
            </span>
            <span
              className="mp-subnav-pill"
              onClick={() => scrollToSection('booster-sosmed-section')}
            >
              🚀 Booster Sosmed
            </span>
            <span
              className="mp-subnav-pill"
              onClick={() => scrollToSection('jasa-web-section')}
            >
              💻 Jasa Pembuatan Web & POS
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
