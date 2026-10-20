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

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="cart-drawer-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
              Keranjang Belanja
            </h3>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              {totalQty} barang ({formatWeight(totalWeight)})
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              color: '#475569',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Item List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 10px', color: '#94A3B8' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>🛒</div>
              <p style={{ fontWeight: '700', fontSize: '15px', color: '#64748B', marginBottom: '4px' }}>
                Keranjang Kosong
              </p>
              <p style={{ fontSize: '12.5px', margin: 0 }}>
                Yuk, pilih dan masukkan produk favorit Anda ke keranjang.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    paddingBottom: '14px',
                    borderBottom: '1px solid #F1F5F9',
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '8px',
                      background: '#F1F5F9',
                      overflow: 'hidden',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.gambar ? (
                      <img src={item.gambar} alt={item.nama_barang} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '20px' }}>📦</span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                      <h4
                        style={{
                          fontSize: '13px',
                          fontWeight: '700',
                          color: '#0F172A',
                          margin: 0,
                          lineHeight: '1.3',
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
                        title="Hapus barang"
                        style={{ color: '#94A3B8', fontSize: '15px', padding: '0 4px', lineHeight: 1 }}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                      {item.berat_gram > 0 ? `${formatWeight(item.berat_gram * item.qty)} · ` : ''}
                      Rp {formatRupiah(item.harga_jual)} / {item.satuan || 'pcs'}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          border: '1px solid #E2E8F0',
                          borderRadius: '6px',
                          background: '#FFFFFF',
                          overflow: 'hidden',
                        }}
                      >
                        <button
                          onClick={() => onUpdateQty(item.id, item.qty - 1)}
                          style={{ width: '28px', height: '28px', fontSize: '14px', fontWeight: '700', color: '#475569' }}
                        >
                          -
                        </button>
                        <span style={{ width: '32px', textAlign: 'center', fontSize: '12.5px', fontWeight: '700' }}>
                          {item.qty}
                        </span>
                        <button
                          disabled={item.qty >= item.stok}
                          onClick={() => onUpdateQty(item.id, item.qty + 1)}
                          style={{ width: '28px', height: '28px', fontSize: '14px', fontWeight: '700', color: '#475569' }}
                        >
                          +
                        </button>
                      </div>

                      <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>
                        Rp {formatRupiah(item.harga_jual * item.qty)}
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer & Checkout */}
        {cartItems.length > 0 && (
          <div
            style={{
              padding: '18px 20px',
              borderTop: '1px solid #E2E8F0',
              background: '#F8FAFC',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>
              <span>Total Estimasi Berat</span>
              <span style={{ fontWeight: '600', color: '#0F172A' }}>{formatWeight(totalWeight)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '800', color: '#0F172A', marginBottom: '14px' }}>
              <span>Total Belanja</span>
              <span style={{ fontSize: '18px', color: '#2563EB' }}>Rp {formatRupiah(subtotal)}</span>
            </div>

            <button
              id="btn-checkout-cart"
              onClick={onCheckout}
              style={{
                width: '100%',
                height: '44px',
                background: '#0F172A',
                color: '#FFFFFF',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px -1px rgba(15,23,42,0.15)',
              }}
            >
              <span>Lanjut ke Checkout WhatsApp</span>
              <span>→</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
