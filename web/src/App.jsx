import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import CategoryFilter from './components/CategoryFilter';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import Footer from './components/Footer';
import ServiceTabNavigation from './components/ServiceTabNavigation';
import DigitalServicesSection from './components/DigitalServicesSection';
import { fetchTokoInfo, fetchPublicCategories, fetchPublicProducts } from './lib/api';
import { formatRupiah } from './lib/format';

export default function App() {
  const [storeInfo, setStoreInfo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter, Search & Sort
  const [activeMainTab, setActiveMainTab] = useState('products'); // 'products' | 'digital'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');

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
    showToast(`"${product.nama_barang}" berhasil ditambahkan`);
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
      const q = searchQuery.toLowerCase();
      const matchSearch =
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '10px 20px',
            borderRadius: '9999px',
            fontSize: '12.5px',
            fontWeight: '600',
            boxShadow: '0 10px 20px -3px rgba(0,0,0,0.25)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>✓</span> {toastMessage}
        </div>
      )}

      {/* Navigation */}
      <Navbar
        storeName={storeInfo?.nama_toko || 'POS ERTIGA STORE'}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Hero Banner */}
      <HeroBanner storeInfo={storeInfo} />

      {/* Main Content */}
      <main className="container" style={{ flex: 1, paddingBottom: '40px' }}>
        
        {/* Tab Switcher: Produk Fisik vs Layanan Digital & Jasa */}
        <ServiceTabNavigation
          activeTab={activeMainTab}
          onTabChange={setActiveMainTab}
        />

        {activeMainTab === 'digital' ? (
          /* Tampilan Layanan Digital & Jasa */
          <DigitalServicesSection storeInfo={storeInfo} />
        ) : (
          /* Tampilan Katalog Produk Toko Fisik */
          <>
            {/* Promo banner quick jump to Digital Services */}
            <div
              onClick={() => setActiveMainTab('digital')}
              style={{
                background: 'linear-gradient(90deg, #1E293B 0%, #0F172A 100%)',
                borderRadius: '12px',
                padding: '12px 18px',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                border: '1px solid #334155',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>⚡</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#F1F5F9' }}>
                    Tersedia Layanan Digital: Emas, Pulsa/PPOB, Booster Sosmed, & Jasa IT
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                    Klik di sini untuk melihat paket & memesan langsung via WhatsApp
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Buka Layanan →
              </span>
            </div>

            {/* Categories & Filter Bar */}
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              totalProductsCount={products.length}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />

            {/* Section Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  {selectedCategory
                    ? categories.find((c) => c.id === selectedCategory)?.nama_kategori || 'Katalog'
                    : 'Semua Koleksi Produk'}
                </h2>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Menampilkan {filteredProducts.length} produk pilihan
                </span>
              </div>
            </div>

            {/* Products Grid (Responsive: 4 cols on desktop, 3 on tablet, 2 on mobile) */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94A3B8' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>⏳</div>
                <p style={{ fontWeight: '600', fontSize: '14px' }}>Memuat katalog produk...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  color: '#94A3B8',
                }}
              >
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔍</div>
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>
                  Tidak ada produk yang cocok
                </p>
                <p style={{ fontSize: '12.5px', margin: 0 }}>
                  Coba gunakan kata kunci pencarian lain atau pilih kategori yang berbeda.
                </p>
              </div>
            ) : (
              <div className="products-grid">
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
          </>
        )}

      </main>

      {/* Floating Cart Button */}
      {totalCartCount > 0 && (
        <button
          className="floating-cart-btn"
          onClick={() => setIsCartOpen(true)}
        >
          <span>🛒</span>
          <span>{totalCartCount} Produk</span>
          <span>·</span>
          <span>Rp {formatRupiah(totalCartPrice)}</span>
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
