import React from 'react';

export default function CategoryFilter({
  categories = [],
  selectedCategory,
  onSelectCategory,
  totalProductsCount = 0,
  sortBy = 'default',
  onSortChange,
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        {/* Category Pills (Tokopedia style) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
          <button
            onClick={() => onSelectCategory(null)}
            style={{
              padding: '7px 16px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              background: selectedCategory === null ? '#E8F8EE' : '#FFFFFF',
              color: selectedCategory === null ? '#03AC0E' : '#4B5563',
              border: selectedCategory === null ? '1px solid #03AC0E' : '1px solid #E5E7EB',
              transition: 'all 0.15s ease',
            }}
          >
            Semua Produk
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  background: isSelected ? '#E8F8EE' : '#FFFFFF',
                  color: isSelected ? '#03AC0E' : '#4B5563',
                  border: isSelected ? '1px solid #03AC0E' : '1px solid #E5E7EB',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.nama_kategori}
              </button>
            );
          })}
        </div>

        {/* Sort & Count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>
            Menampilkan <strong style={{ color: '#111827' }}>{totalProductsCount}</strong> barang
          </span>

          {onSortChange && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>Urutkan:</span>
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                style={{
                  height: '34px',
                  padding: '0 10px',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB',
                  background: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#374151',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="default">Paling Sesuai</option>
                <option value="name_asc">Nama Produk (A-Z)</option>
                <option value="price_asc">Harga Terendah</option>
                <option value="price_desc">Harga Tertinggi</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
