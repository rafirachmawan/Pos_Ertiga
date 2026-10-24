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
import GlobalLoader from './components/GlobalLoader';
import GlobalDialog from './components/GlobalDialog';
import { fetchTokoInfo, fetchPublicCategories, fetchPublicProducts, triggerLoadingTransition } from './lib/api';
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

  // Navigation & Tab helpers with smooth loading feedback
  const handleSelectSpecialTab = (tabId) => {
    if (activeSpecialTab === tabId) return;
    const tabNames = {
      gold: 'Logam Mulia Emas 24K',
      smm: 'Booster Sosmed',
      ppob: 'Top Up & Tagihan Digital',
      webdev: 'Jasa Pembuatan Web & POS',
    };
    const tabName = tabId ? (tabNames[tabId] || 'Halaman') : 'Katalog Pakaian';
    triggerLoadingTransition(320, `Membuka ${tabName}...`);
    setActiveSpecialTab(tabId);
    setSelectedCategory(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    if (activeSpecialTab !== null) {
      triggerLoadingTransition(300, 'Kembali ke Beranda...');
      setActiveSpecialTab(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectCategory = (catId) => {
    if (selectedCategory !== catId || activeSpecialTab !== null) {
      const cat = categories.find((c) => c.id === catId);
      const catName = cat ? cat.nama_kategori : 'Semua Produk';
      triggerLoadingTransition(280, `Memuat ${catName}...`);
      setSelectedCategory(catId);
    }
    if (activeSpecialTab !== null) {
      setActiveSpecialTab(null);
    }
    scrollToProducts();
  };

  // Helper for quick icon / subnav linking to special tabs
  const handleOpenDigitalModal = (serviceId) => {
    if (serviceId === 'rasxmedia' || serviceId === 'smm') {
      handleSelectSpecialTab('smm');
      return;
    }
    if (serviceId === 'emas') {
      handleSelectSpecialTab('gold');
      return;
    }
    if (serviceId === 'appdev' || serviceId === 'web' || serviceId === 'it') {
      handleSelectSpecialTab('webdev');
      return;
    }
    triggerLoadingTransition(280, 'Membuka Layanan...');
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


  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F5F6F8' }}>
      
      {/* Global POS-style Loader */}
      <GlobalLoader />
      <GlobalDialog />

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
        onTabChange={() => {
          handleBackToHome();
          scrollToProducts();
        }}
        onSelectCategory={handleSelectCategory}
        onOpenDigitalModal={handleOpenDigitalModal}
        onSelectSpecialTab={handleSelectSpecialTab}
      />

      {/* === SPECIAL TAB FULL PAGE VIEW === */}
      {activeSpecialTab ? (
        <main className="marketplace-container mp-special-tab-main" style={{ flex: 1 }}>
          {/* Breadcrumb / Back Navigation */}
          <div className="mp-breadcrumb-card">
            <button
              onClick={handleBackToHome}
              className="mp-breadcrumb-back-btn"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Kembali</span>
            </button>
            <div className="mp-breadcrumb-trail">
              <span
                style={{ cursor: 'pointer', color: '#03AC0E', fontWeight: '500' }}
                onClick={handleBackToHome}
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
          <div className="mp-special-content-card">
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
            <div className="mp-section-divider">
              <div className="mp-section-divider-line" />
              <div className="mp-section-divider-badge mp-divider-flash">
                <span style={{ fontSize: '14px' }}>⚡</span>
                <span>Promo & Flash Sale</span>
              </div>
              <div className="mp-section-divider-line" />
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
            <div className="mp-section-divider">
              <div className="mp-section-divider-line" />
              <div className="mp-section-divider-badge mp-divider-catalog">
                <span style={{ fontSize: '14px' }}>👕</span>
                <span>Katalog Produk</span>
              </div>
              <div className="mp-section-divider-line" />
            </div>
          </div>

          {/* 5. SINGLE UNIFIED FEED (Pakaian Products Only) */}
          <main className="marketplace-container" ref={productsSectionRef} style={{ flex: 1, paddingBottom: '30px' }}>
            
            <div id="unified-feed" className="mp-section-card">
              {/* Search Result Header (only shown during active search) */}
              {searchQuery && (
                <div className="mp-section-header" style={{ borderBottom: 'none', paddingBottom: '8px', marginBottom: '8px' }}>
                  <h2 className="mp-section-title">
                    <span>Hasil Pencarian "{searchQuery}"</span>
                  </h2>

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
                </div>
              )}

              {/* Tokopedia-style tab bar (For You + Categories) */}
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
                totalProductsCount={filteredProducts.length}
                sortBy={sortBy}
                onSortChange={(val) => {
                  triggerLoadingTransition(250, 'Mengurutkan Produk...');
                  setSortBy(val);
                }}
                activeSpecialTab={activeSpecialTab}
                onSelectSpecialTab={handleSelectSpecialTab}
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
