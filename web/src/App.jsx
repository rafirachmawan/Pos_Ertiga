import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from './components/Navbar';
import MarketplaceHero from './components/MarketplaceHero';
import MarketplaceQuickIcons from './components/MarketplaceQuickIcons';
import FlashSaleSection from './components/FlashSaleSection';
import CategoryFilter from './components/CategoryFilter';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import Footer from './components/Footer';
import DigitalServicesSection from './components/DigitalServicesSection';
import LogamMuliaSection from './components/LogamMuliaSection';
import SmmSection from './components/SmmSection';
import WebDevSection from './components/WebDevSection';
import { fetchTokoInfo, fetchPublicCategories, fetchPublicProducts } from './lib/api';
import { formatRupiah } from './lib/format';

// Stable shuffle using Fisher-Yates with a seed
function shuffleArray(arr, seed = 42) {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function App() {
  const [storeInfo, setStoreInfo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Unified single-section state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeSpecialTab, setActiveSpecialTab] = useState(null); // 'gold' | 'smm' | 'ppob' | 'webdev' | null
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [activeDigitalModal, setActiveDigitalModal] = useState(null);

  const productsSectionRef = useRef(null);

  // Helper for scroll to section by ID
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const headerHeight = document.querySelector('.mp-header')?.offsetHeight || 135;
      const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  // Helper for quick icon / subnav linking to special tabs
  const handleOpenDigitalModal = (serviceId) => {
    if (serviceId === 'rasxmedia' || serviceId === 'smm') {
      setActiveSpecialTab('smm');
      setSelectedCategory(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (serviceId === 'emas') {
      setActiveSpecialTab('gold');
      setSelectedCategory(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (serviceId === 'appdev' || serviceId === 'web' || serviceId === 'it') {
      setActiveSpecialTab('webdev');
      setSelectedCategory(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setActiveDigitalModal(serviceId);
  };

  // Cart State with localStorage persistence
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_ertiga_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Save cart changes
  useEffect(() => {
    try {
      localStorage.setItem('pos_ertiga_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn(e);
    }
  }, [cart]);

  // Load Store, Categories, and Products on mount
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const [toko, cats, prods] = await Promise.all([
          fetchTokoInfo(),
          fetchPublicCategories(),
          fetchPublicProducts(),
        ]);
        setStoreInfo(toko);
        setCategories(cats);
        setProducts(prods);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const scrollToProducts = () => {
    scrollToSection('unified-feed');
  };

  // Add to cart handler
  const handleAddToCart = (product, addQty = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        const newQty = Math.min(product.stok, existing.qty + addQty);
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: newQty } : item
        );
      }
      return [...prev, { ...product, qty: Math.min(product.stok, addQty) }];
    });
    showToast(`${product.nama_barang} berhasil masuk keranjang`);
  };

  // Update qty in cart
  const handleUpdateQty = (productId, newQty) => {
    if (newQty <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, qty: newQty } : item
      )
    );
  };

  // Remove from cart
  const handleRemoveFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  // Filtered & Sorted Products (For You = shuffled, Category = filtered)
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      const matchCategory =
        selectedCategory === null || p.kategori_id === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (p.nama_barang || '').toLowerCase().includes(q) ||
        (p.nama_kategori || '').toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });

    // When "For You" (no category selected, no special tab), shuffle
    if (selectedCategory === null && activeSpecialTab === null && !searchQuery.trim()) {
      list = shuffleArray(list);
    }

    if (sortBy === 'price_asc') {
      return [...list].sort((a, b) => (a.harga_jual || 0) - (b.harga_jual || 0));
    }
    if (sortBy === 'price_desc') {
      return [...list].sort((a, b) => (b.harga_jual || 0) - (a.harga_jual || 0));
    }
    if (sortBy === 'name_asc') {
      return [...list].sort((a, b) => (a.nama_barang || '').localeCompare(b.nama_barang || ''));
    }
    return list;
  }, [products, selectedCategory, activeSpecialTab, searchQuery, sortBy]);

  const totalCartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + item.harga_jual * item.qty, 0);

  // Determine section title for all patent tabs
  const getSectionTitle = () => {
    if (searchQuery) return `Hasil Pencarian "${searchQuery}"`;
    if (activeSpecialTab === 'gold') return 'Logam Mulia Emas 24K';
    if (activeSpecialTab === 'smm') return 'Booster Sosial Media (SMM Panel)';
    if (activeSpecialTab === 'ppob') return 'Top Up & Tagihan Digital (PPOB)';
    if (activeSpecialTab === 'webdev') return 'Jasa Pembuatan Website & Aplikasi';
    if (selectedCategory !== null) {
      const cat = categories.find((c) => c.id === selectedCategory);
      return cat ? `Pakaian - ${cat.nama_kategori}` : 'Koleksi Pakaian';
    }
    return 'Koleksi Pakaian';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F5F6F8' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#03AC0E',
            color: '#FFFFFF',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            boxShadow: '0 8px 24px rgba(3, 172, 14, 0.3)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Marketplace Header */}
      <Navbar
        storeName={storeInfo?.nama_toko || 'POS ERTIGA STORE'}
        storeAddress={storeInfo?.alamat_toko || 'Sumberjo Kulon, Ngunut'}
        storePhone={storeInfo?.telepon || '6281234567890'}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab="products"
        activeSpecialTab={activeSpecialTab}
        onTabChange={() => scrollToProducts()}
        onSelectCategory={(catId) => {
          setSelectedCategory(catId);
          setActiveSpecialTab(null);
          scrollToProducts();
        }}
        onOpenDigitalModal={handleOpenDigitalModal}
        onSelectSpecialTab={(tabId) => {
          setActiveSpecialTab(tabId);
          setSelectedCategory(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* === SPECIAL TAB FULL PAGE VIEW === */}
      {activeSpecialTab ? (
        <main className="marketplace-container" style={{ flex: 1, paddingBottom: '30px', paddingTop: '20px' }}>
          {/* Breadcrumb / Back Navigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
            padding: '14px 20px',
            background: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <button
              onClick={() => {
                setActiveSpecialTab(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '8px 14px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                color: '#03AC0E',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.target.style.background = '#F0FFF4'; e.target.style.borderColor = '#03AC0E'; }}
              onMouseLeave={(e) => { e.target.style.background = 'none'; e.target.style.borderColor = '#E5E7EB'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Kembali
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6B7280' }}>
              <span
                style={{ cursor: 'pointer', color: '#03AC0E', fontWeight: '500' }}
                onClick={() => {
                  setActiveSpecialTab(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Beranda
              </span>
              <span style={{ color: '#D1D5DB' }}>›</span>
              <span style={{ fontWeight: '600', color: '#1F2937' }}>
                {activeSpecialTab === 'gold' && 'Logam Mulia'}
                {activeSpecialTab === 'smm' && 'Booster Sosmed'}
                {activeSpecialTab === 'ppob' && 'Top Up & Tagihan'}
                {activeSpecialTab === 'webdev' && 'Jasa Web & POS'}
              </span>
            </div>
          </div>

          {/* Special Section Content */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            padding: '24px',
            minHeight: '400px',
          }}>
            {activeSpecialTab === 'gold' && (
              <LogamMuliaSection storeInfo={storeInfo} embedded />
            )}
            {activeSpecialTab === 'smm' && (
              <SmmSection storeInfo={storeInfo} embedded />
            )}
            {activeSpecialTab === 'ppob' && (
              <DigitalServicesSection
                storeInfo={storeInfo}
                activeServiceModal={activeDigitalModal}
                onOpenServiceModal={handleOpenDigitalModal}
                onCloseServiceModal={() => setActiveDigitalModal(null)}
                embedded
              />
            )}
            {activeSpecialTab === 'webdev' && (
              <WebDevSection storeInfo={storeInfo} embedded />
            )}
          </div>
        </main>
      ) : (
        <>
          {/* 2. Main Hero Banner */}
          <MarketplaceHero
            onExploreProducts={scrollToProducts}
            onOpenDigitalModal={handleOpenDigitalModal}
          />

          {/* ── Section Divider: Flash Sale ── */}
          <div className="marketplace-container">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              margin: '28px 0 18px',
            }}>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #E5E7EB, #D1D5DB)' }} />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 18px',
                background: '#FFF7ED',
                border: '1px solid #FED7AA',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '700',
                color: '#EA580C',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}>
                <span style={{ fontSize: '14px' }}>⚡</span>
                Promo & Flash Sale
              </div>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, #E5E7EB, #D1D5DB)' }} />
            </div>
          </div>

          {/* 4. Flash Sale */}
          <FlashSaleSection
            products={products}
            onSelectProduct={setSelectedProduct}
            onAddToCart={handleAddToCart}
            onOpenDigitalModal={handleOpenDigitalModal}
          />

          {/* ── Section Divider: Koleksi Pakaian ── */}
          <div className="marketplace-container">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              margin: '28px 0 18px',
            }}>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #E5E7EB, #D1D5DB)' }} />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 18px',
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '700',
                color: '#16A34A',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}>
                <span style={{ fontSize: '14px' }}>👕</span>
                Katalog Produk
              </div>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, #E5E7EB, #D1D5DB)' }} />
            </div>
          </div>

          {/* 5. SINGLE UNIFIED FEED (Pakaian Products Only) */}
          <main className="marketplace-container" ref={productsSectionRef} style={{ flex: 1, paddingBottom: '30px' }}>
            
            <div id="unified-feed" className="mp-section-card">
              {/* Section Header */}
              <div className="mp-section-header" style={{ borderBottom: 'none', paddingBottom: '8px', marginBottom: '4px' }}>
                <h2 className="mp-section-title">
                  <span>{getSectionTitle() || ''}</span>
                </h2>

                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      fontSize: '12px',
                      color: '#03AC0E',
                      fontWeight: '600',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Reset Pencarian ✕
                  </button>
                )}
              </div>

              {/* Tokopedia-style tab bar (For You + Categories) */}
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                totalProductsCount={filteredProducts.length}
                sortBy={sortBy}
                onSortChange={setSortBy}
                activeSpecialTab={activeSpecialTab}
                onSelectSpecialTab={setActiveSpecialTab}
              />

              {/* Products Grid */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                  <p style={{ fontSize: '13.5px', fontWeight: '500' }}>Memuat katalog produk...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '48px 20px',
                    border: '1px dashed #E5E7EB',
                    borderRadius: '8px',
                    color: '#6B7280',
                  }}
                >
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937', marginBottom: '6px' }}>
                    Produk tidak ditemukan
                  </p>
                  <p style={{ fontSize: '12.5px', margin: 0 }}>
                    Coba kata kunci lain atau pilih kategori lainnya.
                  </p>
                </div>
              ) : (
                <div className="mp-product-grid">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      onSelectProduct={setSelectedProduct}
                    />
                  ))}
                </div>
              )}
            </div>

          </main>
        </>
      )}

      {/* Floating Cart Button */}
      {totalCartCount > 0 && (
        <button
          className="floating-cart-btn"
          onClick={() => setIsCartOpen(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <span>{totalCartCount} Produk (Rp {formatRupiah(totalCartPrice)})</span>
        </button>
      )}

      {/* Modals & Drawers */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cart}
        storeInfo={storeInfo}
        onOrderSuccess={() => {
          setIsCheckoutOpen(false);
          setCart([]);
          showToast('Pesanan berhasil dibuat! Silakan lanjutkan kirim pesan di WhatsApp.');
        }}
      />

      {/* Footer */}
      <Footer storeInfo={storeInfo} />

    </div>
  );
}
