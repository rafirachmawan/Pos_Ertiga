import React from 'react';

export default function ServiceTabNavigation({ activeTab, onTabChange }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 0 24px 0',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          background: '#E2E8F0',
          padding: '4px',
          borderRadius: '12px',
          gap: '4px',
          maxWidth: '100%',
        }}
      >
        <button
          type="button"
          onClick={() => onTabChange('products')}
          style={{
            padding: '10px 20px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: activeTab === 'products' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'products' ? '#0F172A' : '#64748B',
            boxShadow: activeTab === 'products' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>🛍️</span>
          <span>Katalog Produk Toko</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('digital')}
          style={{
            padding: '10px 20px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: activeTab === 'digital' ? '#0F172A' : 'transparent',
            color: activeTab === 'digital' ? '#FFFFFF' : '#64748B',
            boxShadow: activeTab === 'digital' ? '0 2px 8px rgba(15,23,42,0.2)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>⚡</span>
          <span>Layanan Digital & Jasa</span>
          <span
            style={{
              background: '#EF4444',
              color: '#FFFFFF',
              fontSize: '9px',
              fontWeight: '800',
              padding: '1px 6px',
              borderRadius: '9999px',
            }}
          >
            BARU
          </span>
        </button>
      </div>
    </div>
  );
}
