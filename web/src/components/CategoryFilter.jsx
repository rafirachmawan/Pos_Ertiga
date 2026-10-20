import React from 'react';

export default function CategoryFilter({
  categories = [],
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  totalProductsCount = 0,
  sortBy = 'default',
  onSortChange,
}) {
  return (
    <div style={{ margin: '20px 0 16px' }}>
      
      {/* Mobile-only search bar */}
      <div className="nav-search-mobile" style={{ marginBottom: '12px' }}>
        <div style={{ position: 'relative' }}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94A3B8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Cari nama barang atau kategori..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              paddingLeft: '36px',
              paddingRight: searchQuery ? '32px' : '12px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              fontSize: '12.5px',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '13px' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar: Categories on Left, Sorting on Right */}
      <div className="filter-toolbar">
        
        {/* Horizontal Category Scroll */}
        <div className="category-scroll-container">
          <button
            onClick={() => onSelectCategory(null)}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              background: selectedCategory === null ? '#0F172A' : '#FFFFFF',
              color: selectedCategory === null ? '#FFFFFF' : '#475569',
              border: `1px solid ${selectedCategory === null ? '#0F172A' : '#E2E8F0'}`,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            Semua Produk ({totalProductsCount})
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  background: isSelected ? '#0F172A' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#475569',
                  border: `1px solid ${isSelected ? '#0F172A' : '#E2E8F0'}`,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
              >
                {cat.nama_kategori}
              </button>
            );
          })}
        </div>

        {/* Sort Selector */}
        {onSortChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
            <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '500' }}>Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              style={{
                height: '32px',
                padding: '0 10px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontSize: '11.5px',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="default">Terbaru / Standar</option>
              <option value="price_asc">Harga: Termurah</option>
              <option value="price_desc">Harga: Termahal</option>
              <option value="name_asc">Nama: A - Z</option>
            </select>
          </div>
        )}

      </div>

    </div>
  );
}
