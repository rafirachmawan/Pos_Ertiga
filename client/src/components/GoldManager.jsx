import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

const formatRupiah = (val) => {
  return Number(val || 0).toLocaleString('id-ID');
};

const emptyMerk = {
  nama_merk: '',
  keterangan: '',
  urutan: 0,
  aktif: 1,
};

const emptyItem = {
  kategori_id: '',
  gramatur: '',
  harga_jual: '',
  harga_beli: '',
  stok: 5,
  deskripsi: '',
  gambar: '',
  is_favorit: 0,
  aktif: 1,
};

export default function GoldManager() {
  const [merks, setMerks] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMerkFilter, setSelectedMerkFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Merk Modal state
  const [showMerkModal, setShowMerkModal] = useState(false);
  const [editMerkId, setEditMerkId] = useState(null);
  const [merkForm, setMerkForm] = useState({ ...emptyMerk });

  // Item/Gramatur Modal state
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItemId, setEditItemId] = useState(null);
  const [itemForm, setItemForm] = useState({ ...emptyItem });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resMerks, resItems] = await Promise.all([
        api('/api/logam-mulia/kategori'),
        api('/api/logam-mulia/item'),
      ]);
      setMerks(resMerks.data || []);
      setItems(resItems.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── MERK HANDLERS ──────────────────────────────────────────
  const openCreateMerk = () => {
    setEditMerkId(null);
    setMerkForm({ ...emptyMerk, urutan: merks.length });
    setError('');
    setShowMerkModal(true);
  };

  const openEditMerk = (m) => {
    setEditMerkId(m.id);
    setMerkForm({
      nama_merk: m.nama_merk,
      keterangan: m.keterangan || '',
      urutan: m.urutan ?? 0,
      aktif: m.aktif ?? 1,
    });
    setError('');
    setShowMerkModal(true);
  };

  const handleSaveMerk = async (e) => {
    e.preventDefault();
    if (!merkForm.nama_merk.trim()) {
      setError('Nama merk emas wajib diisi');
      return;
    }

    try {
      setSaving(true);
      setError('');
      if (editMerkId) {
        await api(`/api/logam-mulia/kategori/${editMerkId}`, { method: 'PUT', body: merkForm });
      } else {
        await api('/api/logam-mulia/kategori', { method: 'POST', body: merkForm });
      }
      setShowMerkModal(false);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMerk = async (m) => {
    if (!confirm(`Hapus merk "${m.nama_merk}" beserta semua varian gramatur di dalamnya?`)) return;
    try {
      await api(`/api/logam-mulia/kategori/${m.id}`, { method: 'DELETE' });
      if (selectedMerkFilter === String(m.id)) setSelectedMerkFilter('all');
      fetchData();
    } catch (err) {
      alert('Gagal menghapus merk: ' + err.message);
    }
  };

  // ── ITEM HANDLERS ──────────────────────────────────────────
  const openCreateItem = (defaultKategoriId = null) => {
    setEditItemId(null);
    const initialKat = defaultKategoriId || (selectedMerkFilter !== 'all' ? selectedMerkFilter : (merks[0]?.id || ''));
    setItemForm({
      ...emptyItem,
      kategori_id: initialKat,
    });
    setError('');
    setShowItemModal(true);
  };

  const openEditItem = (it) => {
    setEditItemId(it.id);
    setItemForm({
      kategori_id: it.kategori_id,
      gramatur: it.gramatur,
      harga_jual: it.harga_jual,
      harga_beli: it.harga_beli || '',
      stok: it.stok ?? 1,
      deskripsi: it.deskripsi || '',
      gambar: it.gambar || '',
      is_favorit: it.is_favorit ? 1 : 0,
      aktif: it.aktif ?? 1,
    });
    setError('');
    setShowItemModal(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.kategori_id) {
      setError('Pilih merk/produsen emas');
      return;
    }
    if (!itemForm.gramatur.trim()) {
      setError('Ukuran gramatur wajib diisi (contoh: 1 gr)');
      return;
    }
    if (!itemForm.harga_jual) {
      setError('Harga jual emas wajib diisi');
      return;
    }

    try {
      setSaving(true);
      setError('');
      if (editItemId) {
        await api(`/api/logam-mulia/item/${editItemId}`, { method: 'PUT', body: itemForm });
      } else {
        await api('/api/logam-mulia/item', { method: 'POST', body: itemForm });
      }
      setShowItemModal(false);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (it) => {
    if (!confirm(`Hapus varian "${it.nama_merk} ${it.gramatur}"?`)) return;
    try {
      await api(`/api/logam-mulia/item/${it.id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      alert('Gagal menghapus item: ' + err.message);
    }
  };

  const handleToggleItemActive = async (it) => {
    try {
      await api(`/api/logam-mulia/item/${it.id}`, {
        method: 'PUT',
        body: { ...it, aktif: it.aktif ? 0 : 1 },
      });
      fetchData();
    } catch (err) {
      alert('Gagal mengubah status: ' + err.message);
    }
  };

  // Filter items
  const filteredItems = items.filter((it) => {
    const matchMerk = selectedMerkFilter === 'all' || String(it.kategori_id) === String(selectedMerkFilter);
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      (it.nama_merk || '').toLowerCase().includes(q) ||
      (it.gramatur || '').toLowerCase().includes(q) ||
      (it.deskripsi || '').toLowerCase().includes(q);
    return matchMerk && matchSearch;
  });

  return (
    <div style={{ padding: '0 0 40px 0' }}>
      
      {/* 1. Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Kelola Logam Mulia & Emas 24K</span>
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
            Atur jenis/merk emas (Antam, UBS, Mini Gold), varian gramatur ready (0.5g, 1g, 2g), harga jual, buyback, dan deskripsinya
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={openCreateMerk}
            style={{
              padding: '9px 16px',
              background: '#FFFFFF',
              color: '#334155',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: '15px', lineHeight: 1 }}>+</span>
            <span>Tambah Merk Emas</span>
          </button>

          <button
            type="button"
            onClick={() => openCreateItem()}
            style={{
              padding: '9px 18px',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.15)',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: '15px', lineHeight: 1 }}>+</span>
            <span>Tambah Varian Gramatur</span>
          </button>
        </div>
      </div>

      {/* 2. Brand Tabs Bar */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '14px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', whiteSpace: 'nowrap', marginRight: '4px' }}>
            Pilih Merk:
          </span>

          <button
            type="button"
            onClick={() => setSelectedMerkFilter('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: selectedMerkFilter === 'all' ? '#0F172A' : '#E2E8F0',
              background: selectedMerkFilter === 'all' ? '#0F172A' : '#F8FAFC',
              color: selectedMerkFilter === 'all' ? '#FFFFFF' : '#475569',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            Semua Merk ({items.length})
          </button>

          {merks.map((m) => {
            const isSelected = selectedMerkFilter === String(m.id);
            const count = items.filter((it) => it.kategori_id === m.id).length;
            return (
              <div
                key={m.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: isSelected ? '#FEF3C7' : '#F8FAFC',
                  border: `1px solid ${isSelected ? '#F59E0B' : '#E2E8F0'}`,
                  borderRadius: '20px',
                  padding: '3px 8px 3px 12px',
                  whiteSpace: 'nowrap',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  onClick={() => setSelectedMerkFilter(String(m.id))}
                  style={{
                    fontSize: '12px',
                    fontWeight: isSelected ? '800' : '600',
                    color: isSelected ? '#92400E' : '#334155',
                    cursor: 'pointer',
                  }}
                >
                  {m.nama_merk} ({count})
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditMerk(m);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '2px 3px',
                    cursor: 'pointer',
                    color: '#64748B',
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: '4px',
                  }}
                  title="Edit Nama Merk"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMerk(m);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '2px 3px',
                    cursor: 'pointer',
                    color: '#EF4444',
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: '4px',
                  }}
                  title="Hapus Merk"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Search & Count Bar */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Cari gramatur, merk, atau deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              paddingLeft: '36px',
              paddingRight: '12px',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#1E293B',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ fontSize: '13px', color: '#64748B' }}>
          Menampilkan <strong>{filteredItems.length}</strong> varian emas ready
        </div>
      </div>

      {/* 4. Items Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '1040px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '13px 14px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '60px', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                  Foto
                </th>
                <th style={{ padding: '13px 14px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '150px', whiteSpace: 'nowrap', borderRight: '1px solid #E2E8F0' }}>
                  Merk / Produsen
                </th>
                <th style={{ padding: '13px 14px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '130px', whiteSpace: 'nowrap', borderRight: '1px solid #E2E8F0' }}>
                  Ukuran Gramatur
                </th>
                <th style={{ padding: '13px 14px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '130px', textAlign: 'right', whiteSpace: 'nowrap', borderRight: '1px solid #E2E8F0' }}>
                  Harga Jual
                </th>
                <th style={{ padding: '13px 14px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '140px', textAlign: 'right', whiteSpace: 'nowrap', borderRight: '1px solid #E2E8F0' }}>
                  Harga Buyback
                </th>
                <th style={{ padding: '13px 14px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '120px', textAlign: 'center', whiteSpace: 'nowrap', borderRight: '1px solid #E2E8F0' }}>
                  Stok Ready
                </th>
                <th style={{ padding: '13px 14px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', minWidth: '240px', borderRight: '1px solid #E2E8F0' }}>
                  Deskripsi & Keterangan
                </th>
                <th style={{ padding: '13px 14px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '120px', textAlign: 'center', whiteSpace: 'nowrap', borderRight: '1px solid #E2E8F0' }}>
                  Status Web
                </th>
                <th style={{ padding: '13px 14px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '150px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '40px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                    Belum ada varian emas pada merk yang dipilih. Klik tombol "+ Tambah Varian Gramatur" untuk menambahkan.
                  </td>
                </tr>
              ) : (
                filteredItems.map((it) => (
                  <tr
                    key={it.id}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      opacity: it.aktif ? 1 : 0.6,
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Foto */}
                    <td style={{ padding: '10px 14px', verticalAlign: 'middle', borderRight: '1px solid #F1F5F9', textAlign: 'center' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: '#FEF3C7',
                          border: '1px solid #FDE68A',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {it.gambar ? (
                          <img
                            src={it.gambar}
                            alt={it.gramatur}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: '18px' }}>🪙</span>
                        )}
                      </div>
                    </td>

                    {/* 1. Merk */}
                    <td style={{ padding: '12px 14px', verticalAlign: 'middle', borderRight: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          background: '#FEF3C7',
                          color: '#B45309',
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 9px',
                          borderRadius: '6px',
                          border: '1px solid #FDE68A',
                        }}
                      >
                        {it.nama_merk}
                      </span>
                    </td>

                    {/* 2. Gramatur */}
                    <td style={{ padding: '12px 14px', verticalAlign: 'middle', borderRight: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>
                          {it.gramatur}
                        </span>
                        {Number(it.is_favorit) === 1 && (
                          <span
                            title="Produk Favorit / Best Seller"
                            style={{
                              fontSize: '9.5px',
                              fontWeight: '800',
                              background: '#FEE2E2',
                              color: '#DC2626',
                              padding: '1px 5px',
                              borderRadius: '4px',
                            }}
                          >
                            FAVORIT
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 3. Harga Jual */}
                    <td style={{ padding: '12px 14px', verticalAlign: 'middle', borderRight: '1px solid #F1F5F9', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                        Rp {formatRupiah(it.harga_jual)}
                      </span>
                    </td>

                    {/* 4. Harga Buyback */}
                    <td style={{ padding: '12px 14px', verticalAlign: 'middle', borderRight: '1px solid #F1F5F9', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#64748B' }}>
                        Rp {formatRupiah(it.harga_beli)}
                      </span>
                    </td>

                    {/* 5. Stok Ready */}
                    <td style={{ padding: '12px 14px', verticalAlign: 'middle', borderRight: '1px solid #F1F5F9', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: it.stok > 0 ? '#F0FDF4' : '#FEF2F2',
                          color: it.stok > 0 ? '#15803D' : '#DC2626',
                          border: `1px solid ${it.stok > 0 ? '#BBF7D0' : '#FECACA'}`,
                        }}
                      >
                        {it.stok > 0 ? `${it.stok} keping` : 'Habis'}
                      </span>
                    </td>

                    {/* 6. Deskripsi */}
                    <td style={{ padding: '12px 14px', verticalAlign: 'middle', borderRight: '1px solid #F1F5F9', fontSize: '12px', color: '#475569' }}>
                      {it.deskripsi ? (
                        <span>{it.deskripsi}</span>
                      ) : (
                        <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>Tidak ada deskripsi</span>
                      )}
                    </td>

                    {/* 7. Status Web */}
                    <td style={{ padding: '12px 14px', verticalAlign: 'middle', borderRight: '1px solid #F1F5F9', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleItemActive(it)}
                        style={{
                          padding: '4px 9px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          border: 'none',
                          background: it.aktif ? '#E8F8EE' : '#F1F5F9',
                          color: it.aktif ? '#03AC0E' : '#64748B',
                        }}
                      >
                        {it.aktif ? '● Tampil Web' : '○ Sembunyi'}
                      </button>
                    </td>

                    {/* 8. Aksi */}
                    <td style={{ padding: '12px 14px', verticalAlign: 'middle', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => openEditItem(it)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            color: '#334155',
                            cursor: 'pointer',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(it)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            borderRadius: '6px',
                            border: '1px solid #FECACA',
                            background: '#FEF2F2',
                            color: '#DC2626',
                            cursor: 'pointer',
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: TAMBAH / EDIT MERK EMAS ──────────────────── */}
      {showMerkModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px', padding: '24px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: '0 0 6px 0' }}>
              {editMerkId ? 'Edit Merk Emas' : 'Tambah Merk / Produsen Emas'}
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 16px 0' }}>
              Contoh: Antam Logam Mulia, UBS Gold, Mini Gold, Galeri 24, Lotus Archi
            </p>

            {error && (
              <div style={{ padding: '8px 12px', background: '#FEE2E2', color: '#DC2626', borderRadius: '6px', fontSize: '12px', marginBottom: '14px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSaveMerk}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>
                  Nama Merk / Produsen *
                </label>
                <input
                  type="text"
                  placeholder="Misal: Antam Logam Mulia"
                  value={merkForm.nama_merk}
                  onChange={(e) => setMerkForm({ ...merkForm, nama_merk: e.target.value })}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>
                  Keterangan Singkat
                </label>
                <textarea
                  rows="2"
                  placeholder="Misal: Emas batangan 24K kemurnian 999.9% bersertifikat resmi"
                  value={merkForm.keterangan}
                  onChange={(e) => setMerkForm({ ...merkForm, keterangan: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '12.5px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    value={merkForm.urutan}
                    onChange={(e) => setMerkForm({ ...merkForm, urutan: Number(e.target.value) })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(merkForm.aktif)}
                      onChange={(e) => setMerkForm({ ...merkForm, aktif: e.target.checked ? 1 : 0 })}
                    />
                    <span>Merk Aktif</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '14px', borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => setShowMerkModal(false)}
                  style={{ padding: '8px 14px', background: '#FFF', color: '#475569', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '8px 16px', background: '#0F172A', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' }}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Merk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: TAMBAH / EDIT VARIAN GRAMATUR ─────────────── */}
      {showItemModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px', padding: '24px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: '0 0 6px 0' }}>
              {editItemId ? 'Edit Varian Gramatur Emas' : 'Tambah Varian Gramatur Emas'}
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 16px 0' }}>
              Isi ukuran gramatur (0.5g, 1g, 2g, dll.), harga jual, harga beli/buyback, stok, dan deskripsinya
            </p>

            {error && (
              <div style={{ padding: '8px 12px', background: '#FEE2E2', color: '#DC2626', borderRadius: '6px', fontSize: '12px', marginBottom: '14px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSaveItem}>
              {/* Merk Selector */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>
                  Merk / Produsen Emas *
                </label>
                <select
                  value={itemForm.kategori_id}
                  onChange={(e) => setItemForm({ ...itemForm, kategori_id: e.target.value })}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                >
                  <option value="">-- Pilih Merk --</option>
                  {merks.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama_merk}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gramatur & Stok */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>
                    Ukuran Gramatur *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 1.0 gr / 0.5 gr / 2.0 gr"
                    value={itemForm.gramatur}
                    onChange={(e) => setItemForm({ ...itemForm, gramatur: e.target.value })}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>
                    Stok Ready (Keping)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={itemForm.stok}
                    onChange={(e) => setItemForm({ ...itemForm, stok: Number(e.target.value) })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Harga Jual & Harga Buyback */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>
                    Harga Jual (Rp) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Misal: 1485000"
                    value={itemForm.harga_jual}
                    onChange={(e) => setItemForm({ ...itemForm, harga_jual: e.target.value })}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>
                    Harga Buyback (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Misal: 1350000"
                    value={itemForm.harga_beli}
                    onChange={(e) => setItemForm({ ...itemForm, harga_beli: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Foto / Gambar Emas */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>
                  URL Foto / Gambar Emas
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="https://... atau tempel URL gambar kepingan emas"
                    value={itemForm.gambar}
                    onChange={(e) => setItemForm({ ...itemForm, gambar: e.target.value })}
                    style={{ flex: 1, padding: '9px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', boxSizing: 'border-box', fontSize: '12.5px' }}
                  />
                  {itemForm.gambar && (
                    <div style={{ width: '38px', height: '38px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #E2E8F0', flexShrink: 0, background: '#F1F5F9' }}>
                      <img src={itemForm.gambar} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => (e.target.style.display = 'none')} />
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Preset cepat:</span>
                  <button
                    type="button"
                    onClick={() => setItemForm({ ...itemForm, gambar: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=500&q=80' })}
                    style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', fontSize: '10.5px', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Antam CertiCard
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemForm({ ...itemForm, gambar: 'https://images.unsplash.com/photo-1624365169365-27a3d3c8c73d?auto=format&fit=crop&w=500&q=80' })}
                    style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', fontSize: '10.5px', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Mini Gold
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemForm({ ...itemForm, gambar: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?auto=format&fit=crop&w=500&q=80' })}
                    style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', fontSize: '10.5px', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    UBS Gold
                  </button>
                </div>
              </div>

              {/* Deskripsi */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>
                  Deskripsi / Keterangan Emas
                </label>
                <textarea
                  rows="2"
                  placeholder="Contoh: CertiCard Redesigned Press resmi Antam 2024 kemurnian 99.99%"
                  value={itemForm.deskripsi}
                  onChange={(e) => setItemForm({ ...itemForm, deskripsi: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '12.5px' }}
                />
              </div>

              {/* Checkboxes: Favorit & Tampil Web */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(itemForm.is_favorit)}
                    onChange={(e) => setItemForm({ ...itemForm, is_favorit: e.target.checked ? 1 : 0 })}
                  />
                  <span>Tandai Favorit</span>
                </label>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(itemForm.aktif)}
                    onChange={(e) => setItemForm({ ...itemForm, aktif: e.target.checked ? 1 : 0 })}
                  />
                  <span>Tampil di Website Toko</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '14px', borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  style={{ padding: '8px 14px', background: '#FFF', color: '#475569', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '8px 16px', background: '#D97706', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' }}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Varian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
