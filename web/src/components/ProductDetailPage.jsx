import React, { useState, useEffect } from 'react';
import { formatRupiah, formatWeight } from '../lib/format';
import ProductCard from './ProductCard';

export default function ProductDetailPage({
  product,
  allProducts = [],
  storeInfo,
  onBack,
  onAddToCart,
  onBuyNow,
  onSelectProduct,
  totalCartCount = 0,
  onOpenCart,
}) {
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('deskripsi');
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Scroll to top when product changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setQty(1);
    setActiveImgIndex(0);
  }, [product?.id]);

  if (!product) return null;

  const isOutOfStock = Number(product.stok) <= 0;
  const maxQty = Math.max(1, Number(product.stok) || 1);
  const originalPrice = Math.round(product.harga_jual * 1.15);
  const discountPercent = 15;
  const totalPrice = product.harga_jual * qty;

  // Handle gallery images: parse galeri_gambar from DB (JSON string or array)
  const parsedGaleri = (() => {
    try {
      if (Array.isArray(product.galeri_gambar)) return product.galeri_gambar.filter(Boolean);
      if (typeof product.galeri_gambar === 'string' && product.galeri_gambar.trim()) {
        const parsed = JSON.parse(product.galeri_gambar);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      }
    } catch {}
    return [];
  })();

  // Main image first, then gallery extras (deduplicated)
  const galleryImages = [
    product.gambar,
    ...parsedGaleri.filter((url) => url !== product.gambar),
  ].filter(Boolean);

  const currentImage = galleryImages[activeImgIndex] || product.gambar;

  const handleQtyChange = (delta) => {
    setQty((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > maxQty) return maxQty;
      return next;
    });
  };

  const handleAddToCartClick = () => {
    if (isOutOfStock) return;
    onAddToCart(product, qty);
  };

  const handleBuyNowClick = () => {
    if (isOutOfStock) return;
    onBuyNow(product, qty);
  };

  const handleCopyLink = () => {
    try {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  };

  const defaultDescription =
    product.nama_kategori?.toLowerCase().includes('pakaian') ||
    product.nama_barang?.toLowerCase().includes('kaos')
      ? 'Kaos polos berkualitas premium dengan bahan 100% Cotton Combed 30s reaktif. Bahan adem, menyerap keringat, halus dan nyaman dipakai sehari-hari. Jahitan rantai rapi standar distro, awet dan tidak mudah berbulu setelah dicuci berulang kali.\n\nCocok untuk dipakai santai harian, hangout, maupun seragam komunitas.'
      : 'Produk original berkualitas tinggi dari Toko Resmi POS Ertiga. Dibuat dengan material pilihan yang awet dan nyaman digunakan. Setiap barang telah melewati proses pengecekan kualitas (Quality Control) sebelum dikirim kepada pelanggan.';

  const displayDescription = (product.deskripsi && product.deskripsi.trim()) || defaultDescription;

  // Filter related products (same category or others, excluding current)
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && (!product.kategori_id || p.kategori_id === product.kategori_id))
    .slice(0, 5);

  const fallbackRelated = relatedProducts.length > 0 
    ? relatedProducts 
    : allProducts.filter((p) => p.id !== product.id).slice(0, 5);

  return (
    <div className="mp-pdp-wrapper">
      <div className="marketplace-container">
        
        {/* ── Breadcrumb Navigation ── */}
        <div className="mp-pdp-breadcrumb-bar">
          <div className="mp-pdp-breadcrumb-trail">
            <button type="button" onClick={onBack} className="mp-pdp-back-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Kembali ke Katalog</span>
            </button>
            <span className="mp-pdp-breadcrumb-sep">/</span>
            <span className="mp-pdp-breadcrumb-link" onClick={onBack}>
              Pakaian
            </span>
            {product.nama_kategori && (
              <>
                <span className="mp-pdp-breadcrumb-sep">/</span>
                <span className="mp-pdp-breadcrumb-link" onClick={onBack}>
                  {product.nama_kategori}
                </span>
              </>
            )}
            <span className="mp-pdp-breadcrumb-sep">/</span>
            <span className="mp-pdp-breadcrumb-current">{product.nama_barang}</span>
          </div>
        </div>

        {/* ── Main Product Card (Shopee 2-Column Layout) ── */}
        <div className="mp-pdp-card">
          <div className="mp-pdp-grid">
            
            {/* ── Left Column: Photo Gallery ── */}
            <div className="mp-pdp-gallery-col">
              <div className="mp-pdp-main-img-wrap">
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={product.nama_barang}
                    className="mp-pdp-main-img"
                  />
                ) : (
                  <div className="mp-pdp-img-placeholder">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>Foto Produk</span>
                  </div>
                )}

                {/* Badge Diskon pojok kiri atas */}
                <div className="mp-pdp-badge-discount">
                  -{discountPercent}%
                </div>

                {/* Stok Habis Overlay */}
                {isOutOfStock && (
                  <div className="mp-pdp-out-of-stock-overlay">
                    <span>STOK HABIS</span>
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery Strip (if multiple images) */}
              {galleryImages.length > 1 && (
                <div className="mp-pdp-thumb-strip">
                  {galleryImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`mp-pdp-thumb-btn ${activeImgIndex === idx ? 'active' : ''}`}
                      onClick={() => setActiveImgIndex(idx)}
                      title={`Foto ${idx + 1}`}
                    >
                      <img src={imgUrl} alt={`Foto ${idx + 1}`} className="mp-pdp-thumb-img" />
                    </button>
                  ))}
                </div>
              )}

              {/* Share & Favorite Bar */}
              <div className="mp-pdp-gallery-footer">
                <div className="mp-pdp-share-wrap">
                  <span className="mp-pdp-share-label">Bagikan:</span>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Yuk beli ${product.nama_barang} seharga Rp ${formatRupiah(product.harga_jual)} di POS Ertiga Store: ${window.location.href}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mp-pdp-share-icon mp-pdp-share-wa"
                    title="Bagikan ke WhatsApp"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="mp-pdp-share-icon mp-pdp-share-copy"
                    title="Salin Tautan Produk"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </button>
                  {copiedLink && (
                    <span className="mp-pdp-copied-toast">Link tersalin!</span>
                  )}
                </div>

                <div className="mp-pdp-guarantee-tag">
                  <span>🛡️ 100% Original</span>
                </div>
              </div>
            </div>

            {/* ── Right Column: Purchase Information ── */}
            <div className="mp-pdp-info-col">
              
              {/* Badge Official Store & Kategori */}
              <div className="mp-pdp-badge-row">
                <span className="mp-pdp-official-badge">
                  Official Store
                </span>
                {product.nama_kategori && (
                  <span className="mp-pdp-category-badge">
                    {product.nama_kategori}
                  </span>
                )}
                {product.kode_barang && (
                  <span className="mp-pdp-sku-badge">
                    SKU: {product.kode_barang}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="mp-pdp-title">{product.nama_barang}</h1>

              {/* Rating, Penilaian & Terjual (Shopee Style) */}
              <div className="mp-pdp-rating-row">
                <div className="mp-pdp-stars">
                  <span className="mp-pdp-rating-num">4.9</span>
                  <span className="mp-pdp-star-icon">★★★★★</span>
                </div>
                <div className="mp-pdp-meta-sep"></div>
                <div className="mp-pdp-meta-stat">
                  <strong>18</strong> Penilaian
                </div>
                <div className="mp-pdp-meta-sep"></div>
                <div className="mp-pdp-meta-stat">
                  <strong>30+</strong> Terjual
                </div>
              </div>

              {/* Price Banner (Shopee Style) */}
              <div className="mp-pdp-price-banner">
                <div className="mp-pdp-price-original">
                  Rp {formatRupiah(originalPrice)}
                </div>
                <div className="mp-pdp-price-current">
                  Rp {formatRupiah(product.harga_jual)}
                </div>
                <div className="mp-pdp-price-tag">
                  DISKON {discountPercent}%
                </div>
              </div>

              {/* Info Rows (Pengiriman, Jaminan, dll) */}
              <div className="mp-pdp-detail-rows">
                
                {/* Pengiriman */}
                <div className="mp-pdp-row">
                  <div className="mp-pdp-row-label">Pengiriman</div>
                  <div className="mp-pdp-row-content">
                    <div className="mp-pdp-shipping-box">
                      <div className="mp-pdp-shipping-icon">🚚</div>
                      <div>
                        <div className="mp-pdp-shipping-dest">
                          Dikirim dari <strong>Desa Sumberjo Kulon, Kec. Ngunut, Kab. Tulungagung</strong>
                        </div>
                        <div className="mp-pdp-shipping-note">
                          Ongkos kirim hemat & melayani COD / kurir lokal & ekspedisi reguler
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kondisi & Berat */}
                <div className="mp-pdp-row">
                  <div className="mp-pdp-row-label">Kondisi</div>
                  <div className="mp-pdp-row-content">
                    <span className="mp-pdp-cond-tag">Baru (Original)</span>
                  </div>
                </div>

                <div className="mp-pdp-row">
                  <div className="mp-pdp-row-label">Berat Satuan</div>
                  <div className="mp-pdp-row-content">
                    <span>{formatWeight(product.berat_gram || 200)}</span>
                  </div>
                </div>

                {/* Kuantitas */}
                <div className="mp-pdp-row" style={{ alignItems: 'center' }}>
                  <div className="mp-pdp-row-label">Kuantitas</div>
                  <div className="mp-pdp-row-content">
                    <div className="mp-pdp-qty-wrapper">
                      <div className="mp-pdp-qty-counter">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(-1)}
                          disabled={qty <= 1 || isOutOfStock}
                          className="mp-pdp-qty-btn"
                          aria-label="Kurangi jumlah"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={qty}
                          readOnly
                          className="mp-pdp-qty-input"
                          aria-label="Jumlah produk"
                        />
                        <button
                          type="button"
                          onClick={() => handleQtyChange(1)}
                          disabled={qty >= maxQty || isOutOfStock}
                          className="mp-pdp-qty-btn"
                          aria-label="Tambah jumlah"
                        >
                          +
                        </button>
                      </div>

                      <div className="mp-pdp-stock-text">
                        {isOutOfStock ? (
                          <span style={{ color: '#EF4444', fontWeight: '600' }}>Stok Habis</span>
                        ) : (
                          <span>
                            Tersisa <strong>{product.stok}</strong> buah
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Bayar Preview */}
                <div className="mp-pdp-row" style={{ alignItems: 'center' }}>
                  <div className="mp-pdp-row-label">Subtotal</div>
                  <div className="mp-pdp-row-content">
                    <span className="mp-pdp-subtotal-val">
                      Rp {formatRupiah(totalPrice)}
                    </span>
                  </div>
                </div>

              </div>

              {/* ── Action Buttons (Shopee Dual Action: Masukkan Keranjang & Beli Sekarang) ── */}
              <div className="mp-pdp-actions">
                <button
                  type="button"
                  onClick={handleAddToCartClick}
                  disabled={isOutOfStock}
                  className="mp-pdp-btn-cart"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <span>+ Masukkan Keranjang</span>
                </button>

                <button
                  type="button"
                  onClick={handleBuyNowClick}
                  disabled={isOutOfStock}
                  className="mp-pdp-btn-buy"
                >
                  <span>Beli Sekarang</span>
                </button>
              </div>

              {/* Guarantee banner */}
              <div className="mp-pdp-security-box">
                <div className="mp-pdp-security-item">
                  <span className="mp-pdp-sec-icon">✓</span>
                  <span>Transaksi Aman & Terpercaya</span>
                </div>
                <div className="mp-pdp-security-item">
                  <span className="mp-pdp-sec-icon">✓</span>
                  <span>Bisa Langsung Chat WhatsApp Toko</span>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* ── Store Profile Card (Shopee Toko Resmi) ── */}
        <div className="mp-pdp-store-banner">
          <div className="mp-pdp-store-avatar">
            <span style={{ fontSize: '26px' }}>🏪</span>
          </div>
          <div className="mp-pdp-store-info">
            <div className="mp-pdp-store-title-wrap">
              <h3 className="mp-pdp-store-name">
                {storeInfo?.nama_toko || 'Toko Resmi POS Ertiga'}
              </h3>
              <span className="mp-pdp-store-badge">Official Store</span>
            </div>
            <p className="mp-pdp-store-desc">
              📍 {storeInfo?.alamat || 'Desa Sumberjo Kulon Kec. Ngunut, Kab. Tulungagung'} • Buka 08:00 - 21:00 WIB
            </p>
          </div>
          <div className="mp-pdp-store-actions">
            <a
              href={`https://api.whatsapp.com/send?phone=${storeInfo?.whatsapp || '628123456789'}&text=${encodeURIComponent(`Halo Admin POS Ertiga, saya ingin bertanya tentang produk ${product.nama_barang}`)}`}
              target="_blank"
              rel="noreferrer"
              className="mp-pdp-btn-chat-store"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span>Chat Penjual</span>
            </a>
          </div>
        </div>

        {/* ── Product Specifications & Description Tabs ── */}
        <div className="mp-pdp-tabs-card">
          <div className="mp-pdp-tab-headers">
            <button
              type="button"
              className={`mp-pdp-tab-btn ${activeTab === 'deskripsi' ? 'active' : ''}`}
              onClick={() => setActiveTab('deskripsi')}
            >
              Deskripsi Produk
            </button>
            <button
              type="button"
              className={`mp-pdp-tab-btn ${activeTab === 'spesifikasi' ? 'active' : ''}`}
              onClick={() => setActiveTab('spesifikasi')}
            >
              Spesifikasi Detail
            </button>
          </div>

          <div className="mp-pdp-tab-content">
            {activeTab === 'deskripsi' ? (
              <div className="mp-pdp-desc-text">
                {displayDescription.split('\n').map((paragraph, idx) => (
                  <p key={idx} style={{ marginBottom: '12px', lineHeight: '1.7', color: '#374151' }}>
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : (
              <div className="mp-pdp-spec-table">
                <div className="mp-pdp-spec-row">
                  <div className="mp-pdp-spec-label">Kategori</div>
                  <div className="mp-pdp-spec-value">{product.nama_kategori || 'Pakaian'}</div>
                </div>
                <div className="mp-pdp-spec-row">
                  <div className="mp-pdp-spec-label">Kondisi</div>
                  <div className="mp-pdp-spec-value">Baru (100% Original)</div>
                </div>
                <div className="mp-pdp-spec-row">
                  <div className="mp-pdp-spec-label">Berat Satuan</div>
                  <div className="mp-pdp-spec-value">{formatWeight(product.berat_gram || 200)}</div>
                </div>
                <div className="mp-pdp-spec-row">
                  <div className="mp-pdp-spec-label">Stok Tersedia</div>
                  <div className="mp-pdp-spec-value">{product.stok} pcs</div>
                </div>
                <div className="mp-pdp-spec-row">
                  <div className="mp-pdp-spec-label">SKU / Kode Barang</div>
                  <div className="mp-pdp-spec-value">{product.kode_barang || '-'}</div>
                </div>
                <div className="mp-pdp-spec-row">
                  <div className="mp-pdp-spec-label">Dikirim Dari</div>
                  <div className="mp-pdp-spec-value">Desa Sumberjo Kulon Kec. Ngunut, Kab. Tulungagung, Jawa Timur</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Related Products Carousel/Grid ── */}
        {fallbackRelated.length > 0 && (
          <div className="mp-pdp-related-section">
            <div className="mp-pdp-related-header">
              <h3 className="mp-pdp-related-title">Produk Lainnya Dari Toko Kami</h3>
              <button type="button" onClick={onBack} className="mp-pdp-related-more-btn">
                Lihat Semua Produk ›
              </button>
            </div>
            <div className="mp-product-grid">
              {fallbackRelated.map((relProduct) => (
                <ProductCard
                  key={relProduct.id}
                  product={relProduct}
                  onAddToCart={onAddToCart}
                  onSelectProduct={(p) => {
                    onSelectProduct(p);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── Mobile Floating Sticky Bottom Bar (Shopee / Tokopedia Mobile) ── */}
      <div className="mp-pdp-mobile-bar">
        {/* Chat WA */}
        <a
          href={`https://api.whatsapp.com/send?phone=${storeInfo?.whatsapp || '628123456789'}&text=${encodeURIComponent(`Halo Admin POS Ertiga, saya mau tanya produk ${product.nama_barang}`)}`}
          target="_blank"
          rel="noreferrer"
          className="mp-pdp-mobile-icon-btn"
          title="Chat WhatsApp"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <span>Chat</span>
        </a>

        {/* Keranjang Live Counter */}
        <button
          type="button"
          onClick={onOpenCart}
          className="mp-pdp-mobile-icon-btn"
          title="Lihat Keranjang"
        >
          <div className="mp-pdp-mobile-cart-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {totalCartCount > 0 && (
              <span className="mp-pdp-mobile-badge">{totalCartCount}</span>
            )}
          </div>
          <span>Keranjang</span>
        </button>

        {/* Add to Cart button */}
        <button
          type="button"
          onClick={handleAddToCartClick}
          disabled={isOutOfStock}
          className="mp-pdp-mobile-btn-cart"
        >
          <span>+ Keranjang</span>
        </button>

        {/* Buy Now button */}
        <button
          type="button"
          onClick={handleBuyNowClick}
          disabled={isOutOfStock}
          className="mp-pdp-mobile-btn-buy"
        >
          <span>Beli Sekarang</span>
        </button>
      </div>

    </div>
  );
}
