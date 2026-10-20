import React from 'react';

export default function Navbar({
  storeName = 'POS ERTIGA STORE',
  cartCount = 0,
  onOpenCart,
  searchQuery,
  onSearchChange,
}) {
  return (
    <header className="glass-nav">
      <div className="container">
        <div className="nav-container">
          
          {/* Brand Logo & Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#0F172A',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '15px',
                letterSpacing: '-0.02em',
                flexShrink: 0,
              }}
            >
              PE
            </div>
            <div>
              <div style={{ fontSize: '15.5px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
                {storeName}
              </div>
              <div style={{ fontSize: '11px', color: '#059669', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                Toko Online Resmi
              </div>
            </div>
          </div>

          {/* Desktop Search Bar (Integrated in navbar) */}
          <div className="nav-search-desktop">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Cari produk impian Anda..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                paddingLeft: '38px',
                paddingRight: searchQuery ? '32px' : '14px',
                borderRadius: '9999px',
                border: '1px solid #CBD5E1',
                background: '#F8FAFC',
                fontSize: '13px',
                outline: 'none',
                transition: 'border-color 0.15s ease, background-color 0.15s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563EB';
                e.target.style.backgroundColor = '#FFFFFF';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#CBD5E1';
                e.target.style.backgroundColor = '#F8FAFC';
              }}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94A3B8',
                  fontSize: '13px',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Cart Trigger */}
          <button
            id="btn-cart-nav"
            onClick={onOpenCart}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#0F172A',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: '700',
              boxShadow: '0 2px 4px rgba(15,23,42,0.1)',
              flexShrink: 0,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span style={{ display: 'inline' }}>Keranjang</span>
            <span
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: '800',
                padding: '1px 6px',
                borderRadius: '9999px',
                minWidth: '18px',
                textAlign: 'center',
              }}
            >
              {cartCount}
            </span>
          </button>

        </div>
      </div>
    </header>
  );
}
