import React from 'react';

export default function CategoryFilter({
  categories = [],
  selectedCategory,
  onSelectCategory,
  totalProductsCount = 0,
  sortBy = 'default',
  onSortChange,
  activeSpecialTab = null,
}) {
  const isPakaianActive = activeSpecialTab === null;

  if (!isPakaianActive) return null;

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Sub-Kategori Produk Pakaian (Semua For You, Baju Anak, Hijab, Pakaian Pria, dll.) */}
      <div className="tp-subcat-wrapper" style={{ paddingTop: 0 }}>
        <div className="tp-subcat-pills">
          {/* Opsi default: Semua barang / acak For You */}
          <button
            type="button"
            className={`tp-subcat-pill ${selectedCategory === null ? 'active' : ''}`}
            onClick={() => onSelectCategory(null)}
          >
            Semua (For You)
          </button>

          {/* Kategori dinamis turunan dari database POS Ertiga */}
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`tp-subcat-pill ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectCategory(cat.id)}
              >
                {cat.nama_kategori}
              </button>
            );
          })}
        </div>

        {/* Pengurutan (Sort) dan Total Jumlah Barang */}
        <div className="tp-subcat-actions">
          <span className="tp-subcat-count">
            <strong style={{ color: '#111827' }}>{totalProductsCount}</strong> barang
          </span>

          {onSortChange && (
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="tp-sort-select"
              aria-label="Urutkan produk"
            >
              <option value="default">Paling Sesuai</option>
              <option value="name_asc">Nama (A-Z)</option>
              <option value="price_asc">Harga Terendah</option>
              <option value="price_desc">Harga Tertinggi</option>
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
