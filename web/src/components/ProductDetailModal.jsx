import React, { useState } from 'react';
import { formatRupiah, formatWeight } from '../lib/format';

export default function ProductDetailModal({ product, onClose, onAddToCart }) {
  const [qty, setQty] = useState(1);
  const isOutOfStock = Number(product.stok) <= 0;
  const maxQty = Math.max(1, Number(product.stok) || 1);

  const handleAdd = () => {
    onAddToCart(product, qty);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '520px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            zIndex: 10,
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#475569',
            fontSize: '16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
          }}
        >
          ✕
        </button>

        {/* Product Image */}
        <div
          style={{
            width: '100%',
            height: '240px',
            background: '#F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {product.gambar ? (
            <img
              src={product.gambar}
              alt={product.nama_barang}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ color: '#94A3B8', textAlign: 'center' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Foto Produk</div>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div style={{ padding: '24px' }}>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
            {product.nama_kategori && (
              <span
                style={{
                  background: '#F1F5F9',
                  color: '#475569',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                }}
              >
                {product.nama_kategori}
              </span>
            )}
            <span style={{ fontSize: '11.5px', color: '#94A3B8', fontFamily: 'monospace' }}>
              SKU: {product.barcode}
            </span>
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', lineHeight: '1.3', marginBottom: '10px' }}>
            {product.nama_barang}
          </h2>

          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', marginBottom: '16px' }}>
            Rp {formatRupiah(product.harga_jual)}
          </div>

          {/* Specs Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              background: '#F8FAFC',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              marginBottom: '20px',
              fontSize: '12.5px',
            }}
          >
            <div>
              <span style={{ color: '#94A3B8' }}>Status Stok: </span>
              <strong style={{ color: isOutOfStock ? '#DC2626' : '#059669' }}>
                {isOutOfStock ? 'Stok Habis' : `${product.stok} ${product.satuan || 'pcs'}`}
              </strong>
            </div>
            <div>
              <span style={{ color: '#94A3B8' }}>Berat Produk: </span>
              <strong>{formatWeight(product.berat_gram || 0)}</strong>
            </div>
          </div>

          {/* Qty Selector & Action */}
          {!isOutOfStock ? (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  background: '#FFFFFF',
                  overflow: 'hidden',
                }}
              >
                <button
                  disabled={qty <= 1}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  style={{ width: '36px', height: '42px', fontSize: '16px', fontWeight: '700', color: '#475569' }}
                >
                  -
                </button>
                <span style={{ width: '40px', textAlign: 'center', fontWeight: '700', fontSize: '14px' }}>
                  {qty}
                </span>
                <button
                  disabled={qty >= maxQty}
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  style={{ width: '36px', height: '42px', fontSize: '16px', fontWeight: '700', color: '#475569' }}
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAdd}
                style={{
                  flex: 1,
                  height: '42px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '13.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>+</span> Tambah ke Keranjang
              </button>
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '12px',
                background: '#FEF2F2',
                color: '#DC2626',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '13px',
              }}
            >
              Mohon maaf, produk ini sedang habis di toko kami.
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
