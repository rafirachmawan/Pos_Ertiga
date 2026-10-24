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
  activeSpecialTab = null,
  onTabChange,
  onSelectCategory,
  onOpenDigitalModal,
  onSelectSpecialTab,
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
                <span style={{ color: '#03AC0E', fontWeight: '700' }}>✓</span> Toko Resmi POS Ertiga
              </span>
              <span className="mp-topbar-item">
                {storeAddress}
              </span>
              <span className="mp-topbar-item">
                08:00 - 21:00 WIB
              </span>
            </div>

            <div className="mp-topbar-right">
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="mp-topbar-item"
                style={{ fontWeight: '500' }}
              >
                Customer Service (WhatsApp)
              </a>
              <span className="mp-topbar-item">
                Transaksi Aman & Terpercaya
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
                  placeholder="Cari pakaian, hijab, emas, pulsa..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="mp-search-input"
                  aria-label="Cari produk dan layanan"
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
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                <span className="mp-btn-label">Chat</span>
              </a>

              {/* Cart Button with Bubble Badge */}
              <button
                id="btn-cart-nav"
                className="mp-cart-btn"
                onClick={onOpenCart}
                title="Buka Keranjang Belanja"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span className="mp-btn-label">Keranjang</span>
                {cartCount > 0 && (
                  <span className="mp-cart-badge">{cartCount}</span>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Category Links (Tokopedia Style) */}
      <div style={{ background: '#FFFFFF', borderTop: '1px solid #F0F2F5' }}>
        <div className="marketplace-container">
          <div className="mp-subnav">
            <span
              className={`mp-subnav-pill ${activeSpecialTab === null ? 'active' : ''}`}
              onClick={() => {
                if (activeSpecialTab !== null && onSelectSpecialTab) {
                  onSelectSpecialTab(null);
                } else if (onSelectCategory) {
                  onSelectCategory(null);
                }
                scrollToSection('unified-feed');
              }}
            >
              Pakaian
            </span>
            <span
              className="mp-subnav-pill"
              onClick={() => {
                scrollToSection('flash-sale-section');
              }}
            >
              Flash Sale
            </span>
            <span
              className={`mp-subnav-pill ${activeSpecialTab === 'gold' ? 'active' : ''}`}
              onClick={() => {
                if (onSelectSpecialTab) onSelectSpecialTab('gold');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Logam Mulia
            </span>
            <span
              className={`mp-subnav-pill ${activeSpecialTab === 'smm' ? 'active' : ''}`}
              onClick={() => {
                if (onSelectSpecialTab) onSelectSpecialTab('smm');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Booster Sosmed
            </span>
            <span
              className={`mp-subnav-pill ${activeSpecialTab === 'ppob' ? 'active' : ''}`}
              onClick={() => {
                if (onSelectSpecialTab) onSelectSpecialTab('ppob');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Top Up & Tagihan
            </span>
            <span
              className={`mp-subnav-pill ${activeSpecialTab === 'webdev' ? 'active' : ''}`}
              onClick={() => {
                if (onSelectSpecialTab) onSelectSpecialTab('webdev');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Jasa Web & POS
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
