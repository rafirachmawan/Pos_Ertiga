import React from 'react';

export default function ServiceTabNavigation({ activeTab, onTabChange }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '28px 0 20px 0',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          background: '#F1F5F9',
          border: '1px solid #E2E8F0',
          padding: '3px',
          borderRadius: '10px',
          gap: '3px',
          maxWidth: '100%',
        }}
      >
        <button
          type="button"
          onClick={() => onTabChange('products')}
          style={{
            padding: '8px 18px',
            borderRadius: '7px',
            border: 'none',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: activeTab === 'products' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'products' ? '#0F172A' : '#64748B',
            boxShadow: activeTab === 'products' ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <span>Katalog Produk Toko</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('digital')}
          style={{
            padding: '8px 18px',
            borderRadius: '7px',
            border: 'none',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: activeTab === 'digital' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'digital' ? '#0F172A' : '#64748B',
            boxShadow: activeTab === 'digital' ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span>Layanan Digital & Jasa</span>
          <span
            style={{
              background: '#EFF6FF',
              color: '#2563EB',
              border: '1px solid #BFDBFE',
              fontSize: '10px',
              fontWeight: '700',
              padding: '1px 6px',
              borderRadius: '9999px',
            }}
          >
            Baru
          </span>
        </button>
      </div>
    </div>
  );
}

