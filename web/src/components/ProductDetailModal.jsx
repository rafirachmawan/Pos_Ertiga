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
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          maxWidth: '640px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.15)',
          border: '1px solid #E2E8F0',
          position: 'relative',
          overflow: 'hidden',
          animation: 'mpFadeIn 0.15s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Simple Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            zIndex: 20,
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748B',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'background 0.15s ease, color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F1F5F9';
            e.currentTarget.style.color = '#0F172A';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#F8FAFC';
            e.currentTarget.style.color = '#64748B';
          }}
          title="Tutup"
        >
          ✕
        </button>

        {/* Scrollable Content Body */}
        <div className="mp-detail-body" style={{ flex: 1, overflowY: 'auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '240px 1fr',
              gap: '24px',
              alignItems: 'start',
            }}
            className="mp-detail-grid"
          >
            {/* Left Column: Clean Image */}
            <div>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  background: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: '8px',
                  boxSizing: 'border-box',
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
                      borderRadius: '6px',
                    }}
                  />
                ) : (
                  <div style={{ color: '#94A3B8', textAlign: 'center' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <div style={{ fontSize: '11px', marginTop: '4px', fontWeight: '500' }}>Foto Produk</div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Clean Specs & Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* 1. Header Meta Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #F1F5F9',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#03AC0E',
                    background: '#E8F8EE',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  Official Store
                </span>
                {product.nama_kategori && (
                  <>
                    <span style={{ color: '#CBD5E1' }}>•</span>
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>
                      {product.nama_kategori}
                    </span>
                  </>
                )}
                {product.barcode && (
                  <>
                    <span style={{ color: '#CBD5E1' }}>•</span>
                    <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }}>
                      SKU: {product.barcode}
                    </span>
                  </>
                )}
              </div>

              {/* 2. Kotak Judul & Harga */}
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', lineHeight: '1.3', margin: '0 0 8px 0' }}>
                  {product.nama_barang}
                </h2>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                  <span style={{ fontSize: '22px', fontWeight: '900', color: '#03AC0E' }}>
                    Rp {formatRupiah(product.harga_jual)}
                  </span>
                  <span style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'line-through' }}>
                    Rp {formatRupiah(originalPrice)}
                  </span>
                  <span
                    style={{
                      background: '#FEE2E2',
                      color: '#DC2626',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    -15%
                  </span>
                </div>
              </div>

              {/* 3. Kotak Spesifikasi & Kondisi */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '10px 14px',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#475569',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}
                >
                  Spesifikasi Produk
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ width: '105px', color: '#64748B', flexShrink: 0 }}>Kondisi</span>
                    <span
                      style={{
                        color: product.kondisi === 'Bekas' ? '#D97706' : '#0F172A',
                        fontWeight: '600',
                      }}
                    >
                      {product.kondisi || 'Baru'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ width: '105px', color: '#64748B', flexShrink: 0 }}>Berat Satuan</span>
                    <span style={{ color: '#0F172A', fontWeight: '500' }}>
                      {formatWeight(product.berat_gram || 200)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ width: '105px', color: '#64748B', flexShrink: 0 }}>Stok</span>
                    <span style={{ color: isOutOfStock ? '#DC2626' : '#0F172A', fontWeight: '600' }}>
                      {isOutOfStock ? 'Habis' : `${product.stok} ${product.satuan || 'pcs'}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ width: '105px', color: '#64748B', flexShrink: 0 }}>Pengiriman</span>
                    <span style={{ color: '#0F172A', fontWeight: '500' }}>
                      Ngunut, Tulungagung
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Kotak Deskripsi Produk */}
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '10px 14px',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#475569',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}
                >
                  Deskripsi Produk
                </div>
                <div
                  style={{
                    fontSize: '12.5px',
                    lineHeight: '1.6',
                    color: '#334155',
                    whiteSpace: 'pre-line',
                    maxHeight: '110px',
                    overflowY: 'auto',
                    paddingRight: '6px',
                  }}
                >
                  {displayDescription}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="mp-detail-footer">
          {!isOutOfStock ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Stepper with clean border */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    background: '#FFFFFF',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    disabled={qty <= 1}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    style={{
                      width: '32px',
                      height: '34px',
                      fontSize: '15px',
                      fontWeight: '600',
                      color: qty <= 1 ? '#CBD5E1' : '#334155',
                      border: 'none',
                      background: 'transparent',
                      cursor: qty <= 1 ? 'not-allowed' : 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (qty > 1) e.currentTarget.style.background = '#F1F5F9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    -
                  </button>
                  <span style={{ width: '36px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#0F172A' }}>
                    {qty}
                  </span>
                  <button
                    type="button"
                    disabled={qty >= maxQty}
                    onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                    style={{
                      width: '32px',
                      height: '34px',
                      fontSize: '15px',
                      fontWeight: '600',
                      color: qty >= maxQty ? '#CBD5E1' : '#334155',
                      border: 'none',
                      background: 'transparent',
                      cursor: qty >= maxQty ? 'not-allowed' : 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (qty < maxQty) e.currentTarget.style.background = '#F1F5F9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    +
                  </button>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Total:</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>
                    Rp {formatRupiah(totalPrice)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '220px' }}>
                <button
                  type="button"
                  onClick={handleAdd}
                  style={{
                    width: '100%',
                    height: '38px',
                    background: '#03AC0E',
                    color: '#FFFFFF',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#028A0B')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#03AC0E')}
                >
                  + Keranjang
                </button>
              </div>
            </>
          ) : (
            <div
              style={{
                width: '100%',
                textAlign: 'center',
                padding: '10px',
                background: '#FEF2F2',
                color: '#DC2626',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '13px',
              }}
            >
              Stok produk ini sedang habis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
