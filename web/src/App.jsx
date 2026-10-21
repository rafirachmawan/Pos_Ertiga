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
import { fetchTokoInfo, fetchPublicCategories, fetchPublicProducts } from './lib/api';
import { formatRupiah } from './lib/format';

export default function App() {
  const [storeInfo, setStoreInfo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter, Search, Tab & Sort
  const [activeMainTab, setActiveMainTab] = useState('products');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [activeDigitalModal, setActiveDigitalModal] = useState(null);

  const productsSectionRef = useRef(null);

  // Helper untuk membuka modal atau scroll ke section
  const handleOpenDigitalModal = (serviceId) => {
    if (serviceId === 'rasxmedia' || serviceId === 'smm') {
      const el = document.getElementById('booster-sosmed-section');
      if (el) {
        const headerHeight = document.querySelector('.mp-header')?.offsetHeight || 135;
        const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
        window.scrollTo({ top, behavior: 'smooth' });
        return;
      }
    }
    if (serviceId === 'emas') {
      const el = document.getElementById('logam-mulia-section');
      if (el) {
        const headerHeight = document.querySelector('.mp-header')?.offsetHeight || 135;
        const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
        window.scrollTo({ top, behavior: 'smooth' });
        return;
      }
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
    if (productsSectionRef.current) {
      const headerHeight = document.querySelector('.mp-header')?.offsetHeight || 140;
      const elementTop = productsSectionRef.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementTop - headerHeight - 10, behavior: 'smooth' });
    }
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

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      const matchCategory =
        selectedCategory === null || p.kategori_id === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (p.nama_barang || '').toLowerCase().includes(q) ||
        (p.nama_kategori || '').toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });

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
  }, [products, selectedCategory, searchQuery, sortBy]);

  const totalCartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + item.harga_jual * item.qty, 0);

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

      {/* 1. Shopee & Tokopedia Marketplace Header */}
      <Navbar
        storeName={storeInfo?.nama_toko || 'POS ERTIGA STORE'}
        storeAddress={storeInfo?.alamat_toko || 'Sumberjo Kulon, Ngunut'}
        storePhone={storeInfo?.telepon || '6281234567890'}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeMainTab}
        onTabChange={(tab) => {
          setActiveMainTab(tab);
          if (tab === 'products') scrollToProducts();
        }}
        onSelectCategory={(catId) => {
          setSelectedCategory(catId);
          scrollToProducts();
        }}
        onOpenDigitalModal={handleOpenDigitalModal}
      />

      {/* 2. Main Hero Banner & Side Promo (Always prominent on marketplace home) */}
      <MarketplaceHero
        onExploreProducts={scrollToProducts}
        onOpenDigitalModal={handleOpenDigitalModal}
      />

      {/* 3. Tokopedia-Style Quick Icons (Pakaian, Hijab, Aksesoris, Pulsa, Listrik, Emas, SMM, Web) */}
      <MarketplaceQuickIcons
        categories={categories}
        onSelectCategory={(catId) => {
          setSelectedCategory(catId);
          scrollToProducts();
        }}
        onOpenDigitalModal={handleOpenDigitalModal}
        onSwitchTab={(tab) => {
          setActiveMainTab(tab);
          scrollToProducts();
        }}
      />

      {/* 4. Flash Sale / Kejar Diskon Section */}
      <FlashSaleSection
        products={products}
        onSelectProduct={setSelectedProduct}
        onAddToCart={handleAddToCart}
        onOpenDigitalModal={handleOpenDigitalModal}
      />

      {/* 5. Main Content Area */}
      <main className="marketplace-container" ref={productsSectionRef} style={{ flex: 1, paddingBottom: '30px' }}>
        
        {/* If user selected Digital Services tab specifically */}
        {activeMainTab === 'digital' ? (
          <>
            <LogamMuliaSection storeInfo={storeInfo} />
            <SmmSection storeInfo={storeInfo} />
            <DigitalServicesSection
              storeInfo={storeInfo}
              activeServiceModal={activeDigitalModal}
              onOpenServiceModal={handleOpenDigitalModal}
              onCloseServiceModal={() => setActiveDigitalModal(null)}
            />
          </>
        ) : (
          <>
            {/* Products Card Section (Tokopedia "Rekomendasi Untuk Anda") */}
            <div id="katalog-produk" className="mp-section-card">
              <div className="mp-section-header">
                <h2 className="mp-section-title">
                  <span>🛍️</span>
                  <span>
                    {searchQuery ? `Hasil Pencarian "${searchQuery}"` : 'Rekomendasi Produk Pilihan'}
                  </span>
                </h2>

                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      fontSize: '12px',
                      color: '#03AC0E',
                      fontWeight: '600',
                    }}
                  >
                    Reset Pencarian ✕
                  </button>
                )}
              </div>

              {/* Category Filter Pills & Sort Selector */}
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                totalProductsCount={filteredProducts.length}
                sortBy={sortBy}
                onSortChange={setSortBy}
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
                    Coba kata kunci lain atau pilih kategori "Semua Produk".
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

            {/* 2. Investasi Logam Mulia Emas 24K (Section Langsung di Halaman Toko) */}
            <LogamMuliaSection storeInfo={storeInfo} />

            {/* 3. Booster Sosial Media (SMM Panel - Section Langsung di Halaman Toko) */}
            <SmmSection storeInfo={storeInfo} />

            {/* 4. Top Up & Tagihan PPOB Section */}
            <DigitalServicesSection
              storeInfo={storeInfo}
              activeServiceModal={activeDigitalModal}
              onOpenServiceModal={handleOpenDigitalModal}
              onCloseServiceModal={() => setActiveDigitalModal(null)}
            />
          </>
        )}

      </main>

      {/* Floating Cart Button (visible on mobile / scroll) */}
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
