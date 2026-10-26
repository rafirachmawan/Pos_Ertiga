import React, { useState, useRef, useEffect, useMemo } from 'react';
import { formatRupiah } from '../lib/format';

export function getMatchedDigitalService(query) {
  if (!query || !query.trim()) return null;
  const q = query.toLowerCase().trim();

  if (/emas|logam|mulia|antam|mini\s*gold|karat|buyback|investasi/.test(q)) {
    return {
      tab: 'gold',
      title: 'Logam Mulia Emas 24K',
      desc: 'Antam, UBS & Mini Gold bersertifikat resmi.',
      icon: '🪙',
      color: '#B45309',
    };
  }

  if (/pulsa|paket|kuota|internet|token|pln|listrik|tagihan|top\s*up|topup|dana|gopay|ovo|shopeepay|ppob/.test(q)) {
    return {
      tab: 'ppob',
      title: 'Top Up & Tagihan Digital (PPOB)',
      desc: 'Pulsa, paket data, PLN & e-wallet instan.',
      icon: '⚡',
      color: '#1D4ED8',
    };
  }

  if (/sosmed|booster|follower|followers|like|likes|view|views|tiktok|instagram|youtube|rasxmedia|smm/.test(q)) {
    return {
      tab: 'smm',
      title: 'Rasxmedia Booster Sosmed',
      desc: 'Followers, likes & views TikTok/IG aman.',
      icon: '🚀',
      color: '#6D28D9',
    };
  }

  if (/web|website|pos|kasir|aplikasi|software|it|coding|developer|program/.test(q)) {
    return {
      tab: 'webdev',
      title: 'Jasa Pembuatan Web & POS',
      desc: 'Website toko online & aplikasi kasir custom.',
      icon: '💻',
      color: '#047857',
    };
  }

  return null;
}

export default function Navbar({
  storeName = 'POS ERTIGA STORE',
  storeAddress = 'Sumberjo Kulon, Ngunut',
  storePhone = '6281234567890',
  storeLogo = '',
  storeLogoText = 'E',
  cartCount = 0,
  onOpenCart,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  products = [],
  onSelectProduct,
  activeTab = 'products',
  activeSpecialTab = null,
  onTabChange,
  onSelectCategory,
  onOpenDigitalModal,
  onSelectSpecialTab,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matchedProducts = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    if (!q) return [];
    return (products || [])
      .filter((p) => {
        const name = (p.nama_barang || '').toLowerCase();
        const cat = (p.nama_kategori || '').toLowerCase();
        return name.includes(q) || cat.includes(q);
      })
      .slice(0, 5);
  }, [products, searchQuery]);

  const matchedService = useMemo(() => {
    return getMatchedDigitalService(searchQuery);
  }, [searchQuery]);

  const handleTriggerSearch = (q = searchQuery) => {
    setIsDropdownOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(q);
    } else {
      if (onTabChange) onTabChange('products');
      if (onSelectCategory) onSelectCategory(null);
      scrollToSection('unified-feed');
    }
  };

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
                {storeLogo ? (
                  <img
                    src={storeLogo}
                    alt={storeName}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      borderRadius: 'inherit',
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{storeLogoText || (storeName ? storeName.charAt(0).toUpperCase() : 'E')}</span>
                )}
              </div>
              <div className="mp-brand-title">
                <span>{storeName}</span>
                <span className="mp-brand-badge">OFFICIAL STORE</span>
              </div>
            </div>

            {/* Prominent Search Bar (Tokopedia Style) */}
            <div className="mp-search-container" ref={searchContainerRef}>
              <form
                className="mp-search-input-box"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleTriggerSearch(searchQuery);
                }}
              >
                <input
                  type="text"
                  placeholder="Cari pakaian, hijab, emas, pulsa..."
                  value={searchQuery}
                  onChange={(e) => {
                    onSearchChange && onSearchChange(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => {
                    if (searchQuery && searchQuery.trim()) setIsDropdownOpen(true);
                  }}
                  className="mp-search-input"
                  aria-label="Cari produk dan layanan"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      onSearchChange && onSearchChange('');
                      setIsDropdownOpen(false);
                    }}
                    style={{
                      padding: '0 10px',
                      color: '#999',
                      fontSize: '13px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    title="Hapus pencarian"
                  >
                    ✕
                  </button>
                )}
                <button
                  type="submit"
                  className="mp-search-btn"
                  title="Cari"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
              </form>

              {/* Live Search Suggestions Dropdown */}
              {isDropdownOpen && searchQuery && searchQuery.trim() && (
                <div className="mp-search-dropdown">
                  {/* 1. Matched Digital Service */}
                  {matchedService && (
                    <div
                      className="mp-dropdown-service-item"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        if (onSelectSpecialTab) onSelectSpecialTab(matchedService.tab);
                      }}
                    >
                      <span className="mp-dropdown-service-icon">{matchedService.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div className="mp-dropdown-service-title">{matchedService.title}</div>
                        <div className="mp-dropdown-service-desc">{matchedService.desc}</div>
                      </div>
                      <span className="mp-dropdown-service-badge">Buka Layanan →</span>
                    </div>
                  )}

                  {/* 2. Matched Products */}
                  {matchedProducts.length > 0 && (
                    <>
                      <div className="mp-dropdown-section-title">Produk Ditemukan</div>
                      {matchedProducts.map((p) => (
                        <div
                          key={p.id}
                          className="mp-dropdown-product-item"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            if (onSelectProduct) onSelectProduct(p);
                          }}
                        >
                          <div className="mp-dropdown-prod-thumb">
                            {p.gambar ? (
                              <img src={p.gambar} alt={p.nama_barang} />
                            ) : (
                              <span>🛍️</span>
                            )}
                          </div>
                          <div className="mp-dropdown-prod-info">
                            <div className="mp-dropdown-prod-name">{p.nama_barang}</div>
                            <div className="mp-dropdown-prod-price">
                              Rp {formatRupiah(p.harga_jual)}
                            </div>
                          </div>
                          <span className="mp-dropdown-arrow">›</span>
                        </div>
                      ))}
                    </>
                  )}

                  {/* 3. Dropdown Footer */}
                  <div
                    className="mp-dropdown-footer"
                    onClick={() => handleTriggerSearch(searchQuery)}
                  >
                    <span>
                      🔍 Lihat semua hasil untuk <strong>"{searchQuery}"</strong>
                    </span>
                    <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Tekan Enter ↵</span>
                  </div>
                </div>
              )}
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
