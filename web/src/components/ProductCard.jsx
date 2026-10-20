import React from 'react';
import { formatRupiah, formatWeight } from '../lib/format';

export default function ProductCard({ product, onAddToCart, onSelectProduct }) {
  const isOutOfStock = Number(product.stok) <= 0;

  return (
    <div className="product-card" onClick={() => onSelectProduct(product)}>
      
      {/* Product Image */}
      <div className="product-image-container">
        {product.gambar ? (
          <img
            src={product.gambar}
            alt={product.nama_barang}
            className="product-image"
            style={{ objectFit: 'contain', padding: '8px' }}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              color: '#94A3B8',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span style={{ fontSize: '11px', fontWeight: '500' }}>Foto Produk</span>
          </div>
        )}

        {/* Top Badges */}
        <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', gap: '4px', zIndex: 2 }}>
          {product.nama_kategori && (
            <span
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                color: '#FFFFFF',
                backdropFilter: 'blur(4px)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '600',
              }}
            >
              {product.nama_kategori}
            </span>
          )}
        </div>

        {isOutOfStock && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: '700',
              fontSize: '12px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              zIndex: 3,
            }}
          >
            Stok Habis
          </div>
        )}
      </div>

      {/* Body Info */}
      <div className="product-card-body" style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        
        {/* Title */}
        <h3
          className="product-title"
          style={{
            fontSize: '13.5px',
            fontWeight: '700',
            color: '#0F172A',
            lineHeight: '1.35',
            marginBottom: '4px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {product.nama_barang}
        </h3>

        {/* Sub Info: Weight & Stock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B', marginBottom: '10px' }}>
          {product.berat_gram > 0 && (
            <span>{formatWeight(product.berat_gram)}</span>
          )}
          {product.berat_gram > 0 && <span>·</span>}
          <span>
            {isOutOfStock ? (
              <span style={{ color: '#DC2626', fontWeight: '600' }}>Habis</span>
            ) : Number(product.stok) <= 5 ? (
              <span style={{ color: '#D97706', fontWeight: '600' }}>Sisa {product.stok}</span>
            ) : (
              <span style={{ color: '#059669', fontWeight: '600' }}>Stok: {product.stok}</span>
            )}
          </span>
        </div>

        {/* Footer: Price & Add Button */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <div>
            <div className="product-price" style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
              Rp {formatRupiah(product.harga_jual)}
            </div>
          </div>

          <button
            className="btn-add-cart"
            disabled={isOutOfStock}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            style={{
              padding: '6px 12px',
              background: isOutOfStock ? '#E2E8F0' : '#0F172A',
              color: isOutOfStock ? '#94A3B8' : '#FFFFFF',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: '700',
              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
          >
            <span>+</span>
            <span className="btn-add-cart-text">Keranjang</span>
          </button>
        </div>

      </div>

    </div>
  );
}
