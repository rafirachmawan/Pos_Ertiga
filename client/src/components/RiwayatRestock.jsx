import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { formatDateTime, parseDbDate, localDateKey } from '../lib/date';

const ITEMS_PER_PAGE = 15;

const RiwayatRestock = () => {
  const [stokMasuk, setStokMasuk] = useState([]);
  const [barangList, setBarangList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Modal Restock Langsung
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockForm, setRestockForm] = useState({ barang_id: '', qty: 1, keterangan: '' });
  const [submittingRestock, setSubmittingRestock] = useState(false);

  const fetchStokMasuk = async () => {
    try {
      setLoading(true);
      const data = await api('/api/stok-masuk');
      if (data.data) setStokMasuk(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBarang = async () => {
    try {
      const data = await api('/api/barang');
      if (data.data) setBarangList(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStokMasuk();
    fetchBarang();
  }, []);

  // Filter data
  const filtered = useMemo(() => {
    return stokMasuk.filter((sm) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        (sm.nama_barang || '').toLowerCase().includes(q) ||
        (sm.barcode || '').toLowerCase().includes(q) ||
        (sm.keterangan || '').toLowerCase().includes(q) ||
        (sm.nama_kategori || '').toLowerCase().includes(q);

      const dateKey = localDateKey(parseDbDate(sm.tanggal));
      let matchDate = true;
      if (startDate) matchDate = matchDate && dateKey >= startDate;
      if (endDate) matchDate = matchDate && dateKey <= endDate;

      return matchSearch && matchDate;
    });
  }, [stokMasuk, searchQuery, startDate, endDate]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, startDate, endDate]);

  // Statistics
  const totalUnitMasuk = useMemo(() => {
    return filtered.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
  }, [filtered]);

  const uniqueBarangCount = useMemo(() => {
    const ids = new Set(filtered.map((item) => item.barang_id || item.nama_barang));
    return ids.size;
  }, [filtered]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  // Handle submit quick restock
  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockForm.barang_id) {
      alert('Pilih barang yang ingin di-restock');
      return;
    }
    if (Number(restockForm.qty) <= 0) {
      alert('Jumlah harus lebih dari 0');
      return;
    }

    try {
      setSubmittingRestock(true);
      await api('/api/stok-masuk', {
        method: 'POST',
        body: {
          barang_id: Number(restockForm.barang_id),
          qty: Number(restockForm.qty),
          keterangan: restockForm.keterangan.trim() || 'Restock manual',
        },
      });
      alert('Stok barang berhasil ditambahkan!');
      setIsRestockModalOpen(false);
      setRestockForm({ barang_id: '', qty: 1, keterangan: '' });
      fetchStokMasuk();
      fetchBarang();
    } catch (err) {
      alert('Gagal menambah stok: ' + err.message);
    } finally {
      setSubmittingRestock(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filtered.length === 0) {
      alert('Tidak ada data untuk diekspor');
      return;
    }

    const headers = ['Tanggal', 'Nama Barang', 'Barcode', 'Kategori', 'Jumlah Masuk', 'Satuan', 'Keterangan'];
    const rows = filtered.map((item) => [
      `"${formatDateTime(item.tanggal)}"`,
      `"${(item.nama_barang || '').replace(/"/g, '""')}"`,
      `"${item.barcode || '-'}"`,
      `"${(item.nama_kategori || '-').replace(/"/g, '""')}"`,
      item.qty,
      `"${item.satuan || 'pcs'}"`,
      `"${(item.keterangan || '-').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `riwayat_restock_${localDateKey(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
            Riwayat Restock
          </h2>
          <p style={{ color: '#64748B', marginTop: '4px', fontSize: '13px' }}>
            {filtered.length} dari {stokMasuk.length} riwayat penambahan stok barang
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Date range filter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FFFFFF',
              padding: '5px 12px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
            }}
          >
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>Mulai:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '3px', fontSize: '12.5px', border: 'none', outline: 'none', background: 'transparent' }}
            />
            <div style={{ width: '1px', height: '18px', background: '#E2E8F0' }} />
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>Sampai:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '3px', fontSize: '12.5px', border: 'none', outline: 'none', background: 'transparent' }}
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 4px',
                }}
              >
                Reset
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative', width: '240px' }}>
            <svg
              width="14"
              height="14"
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
              placeholder="Cari barang, barcode, catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '34px',
                paddingRight: searchQuery ? '30px' : '12px',
                fontSize: '12.5px',
                height: '34px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                boxSizing: 'border-box',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  fontSize: '13px',
                  padding: '2px',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            title="Ekspor CSV"
            style={{
              padding: '0 12px',
              height: '34px',
              background: '#FFFFFF',
              color: '#475569',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Ekspor
          </button>

          {/* Tambah Restock Button */}
          <button
            onClick={() => {
              setRestockForm({ barang_id: '', qty: 1, keterangan: '' });
              setIsRestockModalOpen(true);
            }}
            style={{
              padding: '0 14px',
              height: '34px',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>+</span> Tambah Restock
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '10px',
            padding: '16px 20px',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '500', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Aktivitas Restock
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#0F172A', marginTop: '6px' }}>
            {filtered.length} <span style={{ fontSize: '13px', fontWeight: '500', color: '#94A3B8' }}>kali</span>
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
            Frekuensi riwayat barang masuk
          </div>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '10px',
            padding: '16px 20px',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '500', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Unit Masuk
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#059669', marginTop: '6px' }}>
            +{totalUnitMasuk.toLocaleString('id-ID')} <span style={{ fontSize: '13px', fontWeight: '500', color: '#94A3B8' }}>unit</span>
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
            Akumulasi penambahan kuantitas stok
          </div>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '10px',
            padding: '16px 20px',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '500', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Varian Barang
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#0F172A', marginTop: '6px' }}>
            {uniqueBarangCount} <span style={{ fontSize: '13px', fontWeight: '500', color: '#94A3B8' }}>produk</span>
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
            Jenis item yang telah di-restock
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <tr>
              <th style={{ padding: '12px 18px', fontSize: '11.5px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '220px' }}>
                Tanggal & Waktu
              </th>
              <th style={{ padding: '12px 18px', fontSize: '11.5px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Barang
              </th>
              <th style={{ padding: '12px 18px', fontSize: '11.5px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '150px' }}>
                Jumlah Masuk
              </th>
              <th style={{ padding: '12px 18px', fontSize: '11.5px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Keterangan
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '48px 20px', color: '#94A3B8', fontSize: '13px' }}>
                  Memuat data riwayat restock...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
                  <p style={{ fontWeight: '600', fontSize: '14px', color: '#64748B', marginBottom: '4px' }}>
                    {searchQuery || startDate || endDate ? 'Tidak ada data ditemukan' : 'Belum ada riwayat restock'}
                  </p>
                  <p style={{ fontSize: '12.5px', color: '#94A3B8', margin: 0 }}>
                    {searchQuery || startDate || endDate
                      ? 'Coba ubah kata kunci pencarian atau rentang tanggal.'
                      : 'Klik tombol "+ Tambah Restock" untuk mencatat stok masuk baru.'}
                  </p>
                </td>
              </tr>
            ) : (
              paginatedData.map((sm, i) => (
                <tr
                  key={sm.id || i}
                  style={{
                    borderBottom: i === paginatedData.length - 1 ? 'none' : '1px solid #F1F5F9',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {/* Tanggal */}
                  <td style={{ padding: '14px 18px', fontSize: '12.5px', color: '#64748B' }}>
                    <div style={{ fontWeight: '500', color: '#334155' }}>
                      {formatDateTime(sm.tanggal)}
                    </div>
                  </td>

                  {/* Barang */}
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '600', color: '#0F172A', fontSize: '13.5px' }}>
                        {sm.nama_barang}
                      </span>
                      {sm.nama_kategori && (
                        <span
                          style={{
                            background: '#F1F5F9',
                            color: '#475569',
                            fontSize: '11px',
                            fontWeight: '500',
                            padding: '1px 7px',
                            borderRadius: '4px',
                          }}
                        >
                          {sm.nama_kategori}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '2px', fontFamily: 'monospace' }}>
                      {sm.barcode}
                    </div>
                  </td>

                  {/* Jumlah */}
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#ECFDF5',
                        color: '#059669',
                        border: '1px solid #A7F3D0',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        fontWeight: '600',
                      }}
                    >
                      +{sm.qty} {sm.satuan || 'pcs'}
                    </span>
                  </td>

                  {/* Keterangan */}
                  <td style={{ padding: '14px 18px', fontSize: '13px', color: '#475569' }}>
                    {sm.keterangan ? (
                      <span>{sm.keterangan}</span>
                    ) : (
                      <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>Tidak ada catatan</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        {filtered.length > 0 && (
          <div
            style={{
              padding: '12px 18px',
              borderTop: '1px solid #E2E8F0',
              background: '#FAFAFA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12.5px',
              color: '#64748B',
            }}
          >
            <div>
              Menampilkan{' '}
              <span style={{ fontWeight: '600', color: '#0F172A' }}>
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>{' '}
              -{' '}
              <span style={{ fontWeight: '600', color: '#0F172A' }}>
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
              </span>{' '}
              dari{' '}
              <span style={{ fontWeight: '600', color: '#0F172A' }}>
                {filtered.length}
              </span>{' '}
              data
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    background: currentPage === 1 ? '#F1F5F9' : '#FFFFFF',
                    color: currentPage === 1 ? '#94A3B8' : '#334155',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}
                >
                  Sebelumnya
                </button>

                <span style={{ fontSize: '12px', color: '#64748B', padding: '0 4px' }}>
                  Halaman {currentPage} dari {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    background: currentPage === totalPages ? '#F1F5F9' : '#FFFFFF',
                    color: currentPage === totalPages ? '#94A3B8' : '#334155',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}
                >
                  Berikutnya
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Tambah Restock */}
      {isRestockModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(2px)',
          }}
          onClick={() => setIsRestockModalOpen(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '460px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
              border: '1px solid #E2E8F0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#0F172A' }}>
                Tambah Stok Barang Masuk
              </h3>
              <button
                onClick={() => setIsRestockModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '18px', padding: 0 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRestockSubmit}>
              {/* Pilih Barang */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Pilih Barang <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  required
                  value={restockForm.barang_id}
                  onChange={(e) => {
                    const selected = barangList.find((b) => String(b.id) === e.target.value);
                    setRestockForm({
                      ...restockForm,
                      barang_id: e.target.value,
                      keterangan: selected ? `Restock ${selected.nama_barang}` : restockForm.keterangan,
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    color: '#0F172A',
                    background: '#FFFFFF',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">-- Pilih Barang --</option>
                  {barangList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nama_barang} ({b.barcode}) — Stok saat ini: {b.stok} {b.satuan || 'pcs'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Jumlah Tambahan */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Jumlah Masuk <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockForm.qty}
                  onChange={(e) => setRestockForm({ ...restockForm, qty: Math.max(1, parseInt(e.target.value) || 1) })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    color: '#0F172A',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Keterangan */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Keterangan / Catatan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Barang Masuk dari Supplier A"
                  value={restockForm.keterangan}
                  onChange={(e) => setRestockForm({ ...restockForm, keterangan: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    color: '#0F172A',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: '#64748B',
                    fontWeight: '600',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingRestock}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    fontWeight: '600',
                    fontSize: '12.5px',
                    cursor: submittingRestock ? 'not-allowed' : 'pointer',
                    opacity: submittingRestock ? 0.7 : 1,
                  }}
                >
                  {submittingRestock ? 'Menyimpan...' : 'Simpan Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiwayatRestock;
