import React, { useState } from 'react';
import { formatRupiah, formatWeight } from '../lib/format';

export default function ProductDetailModal({ product, onClose, onAddToCart }) {
  const [qty, setQty] = useState(1);
  const isOutOfStock = Number(product.stok) <= 0;
  const maxQty = Math.max(1, Number(product.stok) || 1);
  const originalPrice = Math.round(product.harga_jual * 1.15);
  const totalPrice = product.harga_jual * qty;

  const handleAdd = () => {
    onAddToCart(product, qty);
    onClose();
  };

  const defaultDescription =
    product.nama_kategori?.toLowerCase().includes('pakaian') ||
    product.nama_barang?.toLowerCase().includes('kaos')
      ? 'Kaos polos berkualitas premium dengan bahan 100% Cotton Combed 30s reaktif. Bahan adem, menyerap keringat, halus dan nyaman dipakai sehari-hari. Jahitan rapi standar distro, awet dan tidak mudah luntur.'
      : 'Produk original berkualitas tinggi dari toko kami. Dibuat dengan material pilihan yang awet dan nyaman digunakan. Silakan pesan langsung atau tanyakan kepada admin via WhatsApp untuk detail spesifikasi produk.';

  const displayDescription = (product.deskripsi && product.deskripsi.trim()) || defaultDescription;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
          border: '1px solid #E2E8F0',
          position: 'relative',
          overflow: 'hidden',
          animation: 'mpFadeIn 0.15s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 20,
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#475569',
            fontSize: '15px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.15s ease',
          }}
          title="Tutup"
        >
          ✕
        </button>

        {/* Scrollable Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(240px, 280px) 1fr',
              gap: '24px',
              alignItems: 'start',
            }}
            className="mp-detail-grid"
          >
            {/* Left Column: Image Presentation */}
            <div>
              <div
                style={{
                  width: '100%',
                  height: '280px',
                  background: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: '12px',
                  boxSizing: 'border-box',
                  position: 'relative',
                }}
              >
                {product.gambar ? (
                  <img
                    src={product.gambar}
                    alt={product.nama_barang}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      borderRadius: '8px',
                    }}
                  />
                ) : (
                  <div style={{ color: '#94A3B8', textAlign: 'center' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <div style={{ fontSize: '12px', marginTop: '6px', fontWeight: '600' }}>Foto Produk</div>
                  </div>
                )}

                {/* Badge Discount */}
                <span
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: '#FEF2F2',
                    color: '#DC2626',
                    border: '1px solid #FECACA',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '800',
                  }}
                >
                  DISKON 15%
                </span>
              </div>

              {/* Guarantees below image */}
              <div
                style={{
                  marginTop: '12px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                  fontSize: '11px',
                  color: '#64748B',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#F8FAFC', padding: '6px 8px', borderRadius: '6px', border: '1px solid #F1F5F9' }}>
                  <span>🛡️</span> 100% Original
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#F8FAFC', padding: '6px 8px', borderRadius: '6px', border: '1px solid #F1F5F9' }}>
                  <span>⚡</span> Stok Siap Kirim
                </div>
              </div>
            </div>

            {/* Right Column: Information & Description */}
            <div>
              {/* Category & SKU Badges */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span
                  style={{
                    background: '#E8F8EE',
                    color: '#03AC0E',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '700',
                  }}
                >
                  ✓ Official Store
                </span>
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
                {product.barcode && (
                  <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }}>
                    SKU: {product.barcode}
                  </span>
                )}
              </div>

              {/* Product Title */}
              <h2 style={{ fontSize: '19px', fontWeight: '800', color: '#1F2937', lineHeight: '1.35', margin: '0 0 10px 0' }}>
                {product.nama_barang}
              </h2>

              {/* Price & Discount */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px' }}>
                <span style={{ fontSize: '24px', fontWeight: '900', color: '#03AC0E' }}>
                  Rp {formatRupiah(product.harga_jual)}
                </span>
                <span style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'line-through' }}>
                  Rp {formatRupiah(originalPrice)}
                </span>
              </div>

              {/* Specs Box */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  background: '#F8FAFC',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  marginBottom: '16px',
                  fontSize: '12px',
                }}
              >
                <div>
                  <span style={{ color: '#64748B' }}>Status Stok: </span>
                  <strong style={{ color: isOutOfStock ? '#DC2626' : '#03AC0E' }}>
                    {isOutOfStock ? 'Habis' : `Tersedia (${product.stok} ${product.satuan || 'pcs'})`}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Berat: </span>
                  <strong style={{ color: '#1F2937' }}>{formatWeight(product.berat_gram || 200)}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Kondisi: </span>
                  <strong style={{ color: '#1F2937' }}>Baru (Original)</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Pengiriman: </span>
                  <strong style={{ color: '#1F2937' }}>Ngunut, Tulungagung</strong>
                </div>
              </div>

              {/* Deskripsi Produk Section */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  padding: '12px 14px',
                  marginBottom: '8px',
                }}
              >
                <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#1F2937', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📋</span>
                  <span>Deskripsi Produk</span>
                </div>
                <div
                  style={{
                    fontSize: '12.5px',
                    lineHeight: '1.6',
                    color: '#4B5563',
                    whiteSpace: 'pre-line',
                    maxHeight: '120px',
                    overflowY: 'auto',
                    paddingRight: '4px',
                  }}
                >
                  {displayDescription}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #E2E8F0',
            background: '#FFFFFF',
            boxShadow: '0 -4px 12px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          {/* Subtotal & Qty Selector */}
          {!isOutOfStock ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    disabled={qty <= 1}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    style={{
                      width: '36px',
                      height: '38px',
                      fontSize: '16px',
                      fontWeight: '800',
                      color: qty <= 1 ? '#CBD5E1' : '#334155',
                      border: 'none',
                      background: 'transparent',
                      cursor: qty <= 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    -
                  </button>
                  <span style={{ width: '38px', textAlign: 'center', fontWeight: '800', fontSize: '13.5px', color: '#1F2937' }}>
                    {qty}
                  </span>
                  <button
                    type="button"
                    disabled={qty >= maxQty}
                    onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                    style={{
                      width: '36px',
                      height: '38px',
                      fontSize: '16px',
                      fontWeight: '800',
                      color: qty >= maxQty ? '#CBD5E1' : '#334155',
                      border: 'none',
                      background: 'transparent',
                      cursor: qty >= maxQty ? 'not-allowed' : 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Total Harga:</div>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#03AC0E' }}>
                    Rp {formatRupiah(totalPrice)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '200px' }}>
                <button
                  type="button"
                  onClick={handleAdd}
                  style={{
                    flex: 1,
                    height: '42px',
                    background: '#03AC0E',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '13.5px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(3, 172, 14, 0.25)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <span>+ Tambah ke Keranjang</span>
                </button>
              </div>
            </>
          ) : (
            <div
              style={{
                width: '100%',
                textAlign: 'center',
                padding: '12px',
                background: '#FEF2F2',
                color: '#DC2626',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13px',
              }}
            >
              Mohon maaf, stok produk ini saat ini sedang habis.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
