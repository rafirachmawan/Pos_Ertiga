import React from 'react';
import { formatRupiah, formatWeight } from '../lib/format';

export default function ProductCard({ product, onAddToCart, onSelectProduct }) {
  const isOutOfStock = Number(product.stok) <= 0;
  const isLowStock = !isOutOfStock && Number(product.stok) <= 5;
  const originalPrice = Math.round(product.harga_jual * 1.15); // Show promo discount effect

  return (
    <div
      className="mp-product-card"
      onClick={() => onSelectProduct(product)}
      style={{ opacity: isOutOfStock ? 0.6 : 1 }}
    >
      {/* Product Image Thumbnail */}
      <div className="mp-product-thumb">
        {product.gambar ? (
          <img
            src={product.gambar}
            alt={product.nama_barang}
            className="mp-product-img"
            loading="lazy"
          />
        ) : (
          <div style={{ color: '#CBD5E1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span style={{ fontSize: '10px', fontWeight: '600' }}>Foto Produk</span>
          </div>
        )}

        {/* Badges: Official Store & Category */}
        <span className="mp-badge-tag">
          Official
        </span>

        {/* Promo discount badge */}
        <span className="mp-badge-discount">
          -15%
        </span>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: '700',
              color: '#FFFFFF',
              letterSpacing: '0.04em',
              zIndex: 3,
            }}
          >
            STOK HABIS
          </div>
        )}
      </div>

      {/* Product Body */}
      <div className="mp-product-body">
        
        {/* Title */}
        <h3 className="mp-product-name" title={product.nama_barang}>
          {product.nama_barang}
        </h3>

        {/* Price & Original Strikethrough Price */}
        <div className="mp-product-price">
          <span>Rp {formatRupiah(product.harga_jual)}</span>
          <span className="mp-product-origin-price">
            Rp {formatRupiah(originalPrice)}
          </span>
        </div>

        {/* Trust: Star Rating & Sold Count */}
        <div className="mp-product-trust">
          <span className="mp-product-star">★ 4.9</span>
          <span>·</span>
          <span>Terjual 30+</span>
          {isLowStock && (
            <>
              <span>·</span>
              <span style={{ color: '#D97706', fontWeight: '600' }}>Sisa {product.stok}</span>
            </>
          )}
        </div>

        {/* Location & Weight */}
        <div className="mp-product-location">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9AA2B1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>Ngunut, Tulungagung</span>
          {product.berat_gram > 0 && (
            <span>· {formatWeight(product.berat_gram)}</span>
          )}
        </div>

        {/* Add to Cart button */}
        <button
          className="mp-product-btn-add"
          disabled={isOutOfStock}
          style={isOutOfStock ? { background: '#94A3B8', cursor: 'not-allowed' } : {}}
          onClick={(e) => {
            e.stopPropagation();
            if (!isOutOfStock) onAddToCart(product);
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>{isOutOfStock ? 'Habis' : 'Keranjang'}</span>
        </button>

      </div>
    </div>
  );
}
