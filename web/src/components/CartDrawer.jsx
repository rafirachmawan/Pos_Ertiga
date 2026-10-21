import React from 'react';
import { formatRupiah, formatWeight } from '../lib/format';

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems = [],
  onUpdateQty,
  onRemoveItem,
  onCheckout,
}) {
  if (!isOpen) return null;

  const totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const totalWeight = cartItems.reduce((sum, item) => sum + (item.berat_gram || 0) * item.qty, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.harga_jual || 0) * item.qty, 0);

  const handleStartShopping = () => {
    onClose();
    setTimeout(() => {
      const el = document.getElementById('katalog-produk');
      if (el) {
        const headerHeight = document.querySelector('.mp-header')?.offsetHeight || 135;
        const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.16)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* 1. Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF',
          }}
        >
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
              Keranjang Belanja
            </h3>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              {totalQty > 0 ? `${totalQty} barang (${formatWeight(totalWeight)})` : '0 barang'}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup"
            style={{
              background: '#F1F5F9',
              border: 'none',
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              color: '#475569',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#E2E8F0')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#F1F5F9')}
          >
            ✕
          </button>
        </div>

        {/* 2. Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {cartItems.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '36px 12px 24px',
              }}
            >
              {/* Clean Minimalist Icon */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '12px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94A3B8',
                  marginBottom: '16px',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>

              <h4 style={{ fontSize: '15.5px', fontWeight: '700', color: '#0F172A', margin: '0 0 6px 0' }}>
                Keranjang Anda Masih Kosong
              </h4>
              <p style={{ fontSize: '12.5px', color: '#64748B', margin: '0 0 20px 0', maxWidth: '300px', lineHeight: '1.5' }}>
                Pilih produk yang Anda inginkan dari katalog toko untuk mulai berbelanja.
              </p>

              {/* Clean Single Button */}
              <button
                type="button"
                onClick={handleStartShopping}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  background: '#03AC0E',
                  color: '#FFFFFF',
                  fontWeight: '600',
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#028A0B')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#03AC0E')}
              >
                Mulai Belanja Sekarang
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #F1F5F9',
                  }}
                >
                  {/* Thumbnail Image */}
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      background: '#F8FAFC',
                      overflow: 'hidden',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    {item.gambar ? (
                      <img
                        src={item.gambar}
                        alt={item.nama_barang}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '20px' }}>📦</span>
                    )}
                  </div>

                  {/* Info & Quantity controls */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <h4
                          style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#0F172A',
                            margin: 0,
                            lineHeight: '1.35',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {item.nama_barang}
                        </h4>
                        
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          title="Hapus"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94A3B8',
                            fontSize: '13px',
                            padding: '2px 4px',
                            cursor: 'pointer',
                            borderRadius: '4px',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                        >
                          ✕
                        </button>
                      </div>

                      <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                        Rp {formatRupiah(item.harga_jual)} {item.satuan ? `/ ${item.satuan}` : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      {/* Quantity Stepper */}
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          border: '1px solid #CBD5E1',
                          borderRadius: '6px',
                          background: '#FFFFFF',
                          overflow: 'hidden',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.id, item.qty - 1)}
                          style={{
                            width: '26px',
                            height: '26px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#475569',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          -
                        </button>
                        <span
                          style={{
                            width: '30px',
                            textAlign: 'center',
                            fontSize: '12px',
                            fontWeight: '700',
                            color: '#0F172A',
                            background: '#F8FAFC',
                            lineHeight: '26px',
                          }}
                        >
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          disabled={item.stok && item.qty >= item.stok}
                          onClick={() => onUpdateQty(item.id, item.qty + 1)}
                          style={{
                            width: '26px',
                            height: '26px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: item.stok && item.qty >= item.stok ? '#CBD5E1' : '#475569',
                            background: 'transparent',
                            border: 'none',
                            cursor: item.stok && item.qty >= item.stok ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal Item */}
                      <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>
                        Rp {formatRupiah(item.harga_jual * item.qty)}
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Modal Footer */}
        {cartItems.length > 0 && (
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid #E2E8F0',
              background: '#F8FAFC',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: '#64748B' }}>Total Belanja:</span>
              <span style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A' }}>
                Rp {formatRupiah(subtotal)}
              </span>
            </div>

            <button
              id="btn-checkout-cart"
              onClick={onCheckout}
              style={{
                width: '100%',
                padding: '11px',
                background: '#03AC0E',
                color: '#FFFFFF',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '700',
                fontSize: '13.5px',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#028A0B')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#03AC0E')}
            >
              Lanjut ke Checkout
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
