import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

const formatRupiah = (val) => {
  if (val === undefined || val === null) return '0';
  return Number(val).toLocaleString('id-ID');
};

const emptyItem = {
  barang_id: '',
  nama_item: '',
  gambar: '',
  harga_asli: '',
  harga_diskon: '',
  diskon_persen: '',
  terjual_pct: 75,
  tipe: 'product',
  target_link: '',
  urutan: 0,
  aktif: 1,
};

export default function FlashSaleManager() {
  const [settings, setSettings] = useState({
    judul: 'FLASH SALE',
    subjudul: 'Promo Terbatas Hari Ini',
    badge_text: 'FLASH SALE',
    aktif: 1,
    jam_selesai: '22:00',
    durasi_jam: 3,
  });
  const [items, setItems] = useState([]);
  const [barangList, setBarangList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...emptyItem });
  const [savingItem, setSavingItem] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Fetch settings & items
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api('/api/flash-sale');
      if (res.data) {
        if (res.data.settings) setSettings(res.data.settings);
        setItems(res.data.items || []);
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat data flash sale');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch product list from inventory
  const fetchBarang = useCallback(async () => {
    try {
      const res = await api('/api/barang');
      setBarangList(res.data || []);
    } catch (err) {
      console.warn('[FlashSale] Gagal memuat data barang:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchBarang();
  }, [fetchData, fetchBarang]);

  // Show temporary success feedback
  const notifySuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setError('');
      await api('/api/flash-sale/settings', {
        method: 'PUT',
        body: settings,
      });
      notifySuccess('Pengaturan Flash Sale berhasil disimpan!');
    } catch (err) {
      setError(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSavingSettings(false);
    }
  };

  // Toggle Entire Flash Sale Active
  const handleToggleGlobalActive = async () => {
    const nextState = settings.aktif ? 0 : 1;
    setSettings((prev) => ({ ...prev, aktif: nextState }));
    try {
      await api('/api/flash-sale/settings', {
        method: 'PUT',
        body: { ...settings, aktif: nextState },
      });
      notifySuccess(nextState ? 'Flash Sale diaktifkan di website' : 'Flash Sale dinonaktifkan di website');
    } catch (err) {
      setError(err.message);
      setSettings((prev) => ({ ...prev, aktif: prev.aktif ? 0 : 1 }));
    }
  };

  // Open Create Item Modal
  const openCreateItem = () => {
    setEditId(null);
    setForm({
      ...emptyItem,
      urutan: items.length,
    });
    setError('');
    setShowItemModal(true);
  };

  // Open Edit Item Modal
  const openEditItem = (item) => {
    setEditId(item.id);
    setForm({
      barang_id: item.barang_id || '',
      nama_item: item.nama_item || '',
      gambar: item.gambar || '',
      harga_asli: item.harga_asli || '',
      harga_diskon: item.harga_diskon || '',
      diskon_persen: item.diskon_persen || '',
      terjual_pct: item.terjual_pct ?? 75,
      tipe: item.tipe || 'product',
      target_link: item.target_link || '',
      urutan: item.urutan ?? 0,
      aktif: item.aktif ?? 1,
    });
    setError('');
    setShowItemModal(true);
  };

  // When user selects a barang from dropdown
  const handleSelectBarang = (e) => {
    const bId = e.target.value;
    if (!bId) {
      setForm((prev) => ({ ...prev, barang_id: '' }));
      return;
    }
    const selected = barangList.find((b) => String(b.id) === String(bId));
    if (selected) {
      const hJual = selected.harga_jual || 0;
      const defaultPromo = Math.round(hJual * 0.8); // 20% discount by default
      const diskonText = '-20%';
      setForm((prev) => ({
        ...prev,
        barang_id: selected.id,
        nama_item: selected.nama_barang || '',
        gambar: selected.gambar || prev.gambar,
        harga_asli: hJual,
        harga_diskon: defaultPromo,
        diskon_persen: diskonText,
        tipe: 'product',
      }));
    }
  };

  // Auto calculate discount percentage when prices change
  const handlePriceChange = (field, value) => {
    const updated = { ...form, [field]: value };
    const asli = Number(field === 'harga_asli' ? value : form.harga_asli) || 0;
    const diskon = Number(field === 'harga_diskon' ? value : form.harga_diskon) || 0;
    if (asli > 0 && diskon > 0 && diskon < asli) {
      const pct = Math.round(((asli - diskon) / asli) * 100);
      updated.diskon_persen = `-${pct}%`;
    }
    setForm(updated);
  };

  // Save Item
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!form.nama_item.trim()) {
      setError('Nama item flash sale wajib diisi');
      return;
    }
    if (!form.harga_asli || Number(form.harga_asli) <= 0) {
      setError('Harga asli / coret wajib diisi');
      return;
    }
    if (!form.harga_diskon || Number(form.harga_diskon) <= 0) {
      setError('Harga flash sale promo wajib diisi');
      return;
    }

    try {
      setSavingItem(true);
      setError('');
      if (editId) {
        await api(`/api/flash-sale/items/${editId}`, {
          method: 'PUT',
          body: form,
        });
        notifySuccess('Item Flash Sale berhasil diperbarui!');
      } else {
        await api('/api/flash-sale/items', {
          method: 'POST',
          body: form,
        });
        notifySuccess('Item Flash Sale berhasil ditambahkan!');
      }
      setShowItemModal(false);
      fetchData();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan item');
    } finally {
      setSavingItem(false);
    }
  };

  // Toggle Item Active
  const handleToggleItemActive = async (item) => {
    try {
      const nextActive = item.aktif ? 0 : 1;
      await api(`/api/flash-sale/items/${item.id}`, {
        method: 'PUT',
        body: { aktif: nextActive },
      });
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, aktif: nextActive } : it))
      );
      notifySuccess(nextActive ? `Item "${item.nama_item}" diaktifkan` : `Item "${item.nama_item}" dinonaktifkan`);
    } catch (err) {
      setError(err.message || 'Gagal mengubah status item');
    }
  };

  // Delete Item
  const handleDeleteItem = async (id, nama) => {
    if (!window.confirm(`Hapus item "${nama}" dari Flash Sale?`)) return;
    try {
      await api(`/api/flash-sale/items/${id}`, { method: 'DELETE' });
      notifySuccess('Item berhasil dihapus');
      fetchData();
    } catch (err) {
      setError(err.message || 'Gagal menghapus item');
    }
  };

  // Filtered items based on search and type
  const filteredItems = items.filter((item) => {
    const matchType = typeFilter === 'all' || item.tipe === typeFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      (item.nama_item || '').toLowerCase().includes(q) ||
      String(item.barang_id || '').includes(q);
    return matchType && matchSearch;
  });

  return (
    <div style={{ padding: '0 0 40px 0' }}>
      
      {/* 1. Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
            Kelola Flash Sale Website
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
            Atur produk promo terbatas, hitung mundur (countdown), diskon spesial, dan status tayang di etalase toko online.
          </p>
        </div>

        {/* Global Active Badge Toggle & Add Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleToggleGlobalActive}
            title="Klik untuk menyalakan/mematikan seluruh banner Flash Sale di website toko"
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: settings.aktif ? '1px solid #A7F3D0' : '1px solid #FECACA',
              fontWeight: '700',
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: settings.aktif ? '#ECFDF5' : '#FEF2F2',
              color: settings.aktif ? '#059669' : '#DC2626',
              transition: 'all 0.15s ease',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: settings.aktif ? '#10B981' : '#EF4444',
                boxShadow: settings.aktif ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none',
              }}
            />
            <span>{settings.aktif ? 'Flash Sale: Aktif di Web' : 'Flash Sale: Disembunyikan'}</span>
          </button>

          <button
            onClick={openCreateItem}
            style={{
              padding: '9px 18px',
              background: '#03AC0E',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(3, 172, 14, 0.25)',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#028A0B')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#03AC0E')}
          >
            <span style={{ fontSize: '15px', lineHeight: 1 }}>+</span>
            <span>Tambah Item Flash Sale</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '8px',
            color: '#065F46',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>✓</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            color: '#991B1B',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '18px',
          }}
        >
          {error}
        </div>
      )}

      {/* 2. Global Flash Sale Settings Card */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '18px 22px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '14.5px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
              Pengaturan Header & Timer Flash Sale
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
              Atur label badge, subjudul teks promo, dan durasi hitung mundur timer di homepage
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8FAFC', padding: '4px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '11.5px', color: '#475569' }}>
            <span style={{ fontWeight: '700' }}>{settings.badge_text || 'FLASH SALE'}</span>
            <span>·</span>
            <span>{settings.durasi_jam || 3} Jam Countdown</span>
          </div>
        </div>

        <form onSubmit={handleSaveSettings}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) 180px', gap: '14px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Badge Header
              </label>
              <input
                type="text"
                value={settings.badge_text || ''}
                onChange={(e) => setSettings({ ...settings, badge_text: e.target.value })}
                placeholder="mis. FLASH SALE"
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  color: '#0F172A',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Teks Subjudul / Promo
              </label>
              <input
                type="text"
                value={settings.subjudul || ''}
                onChange={(e) => setSettings({ ...settings, subjudul: e.target.value })}
                placeholder="mis. Promo Terbatas Hari Ini"
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  color: '#0F172A',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Durasi Hitung Mundur (Jam)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={settings.durasi_jam || 3}
                onChange={(e) => setSettings({ ...settings, durasi_jam: e.target.value })}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  color: '#0F172A',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={savingSettings}
                style={{
                  width: '100%',
                  height: '38px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: savingSettings ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(15, 23, 42, 0.15)',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => !savingSettings && (e.currentTarget.style.background = '#1E293B')}
                onMouseLeave={(e) => !savingSettings && (e.currentTarget.style.background = '#0F172A')}
              >
                <span>{savingSettings ? 'Menyimpan...' : 'Simpan'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 3. Items List Section */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        {/* Table Card Header with Search, Filter & Add Button */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
              Daftar Item Flash Sale
            </h3>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                background: '#F1F5F9',
                color: '#475569',
                padding: '2px 8px',
                borderRadius: '9999px',
                border: '1px solid #E2E8F0',
              }}
            >
              {items.length} Item
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: '220px' }}>
              <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                placeholder="Cari item promo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '34px',
                  paddingLeft: '30px',
                  paddingRight: '10px',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  color: '#0F172A',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                height: '34px',
                padding: '0 10px',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                fontSize: '12.5px',
                color: '#334155',
                background: '#FFFFFF',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">Semua Tipe</option>
              <option value="product">Produk Fisik</option>
              <option value="digital">Layanan / Digital</option>
            </select>

            {/* Add Button on Table Header */}
            <button
              onClick={openCreateItem}
              style={{
                height: '34px',
                padding: '0 14px',
                background: '#03AC0E',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#028A0B')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#03AC0E')}
            >
              <span>+</span>
              <span>Tambah Item</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>
            Memuat data flash sale...
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: '56px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '8px' }}>—</div>
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px 0' }}>
              {items.length === 0 ? 'Belum Ada Item Flash Sale' : 'Item Tidak Ditemukan'}
            </h4>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px 0' }}>
              {items.length === 0
                ? 'Tambahkan produk dari inventori barang untuk dijadikan promo flash sale hari ini.'
                : 'Coba ubah kata kunci pencarian atau filter tipe.'}
            </p>
            {items.length === 0 && (
              <button
                onClick={openCreateItem}
                style={{
                  padding: '9px 18px',
                  background: '#03AC0E',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                + Tambah Item Pertama
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '50px', textAlign: 'center', whiteSpace: 'nowrap' }}>No</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '60px', textAlign: 'center', whiteSpace: 'nowrap' }}>Foto</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', minWidth: '220px', whiteSpace: 'nowrap' }}>Nama Item Promo</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '130px', whiteSpace: 'nowrap' }}>Tipe</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '120px', textAlign: 'right', whiteSpace: 'nowrap' }}>Harga Asli</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '140px', textAlign: 'right', whiteSpace: 'nowrap' }}>Harga Flash Sale</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '80px', textAlign: 'center', whiteSpace: 'nowrap' }}>Diskon</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '130px', whiteSpace: 'nowrap' }}>Progres Terjual</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '110px', textAlign: 'center', whiteSpace: 'nowrap' }}>Status</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      background: item.aktif ? '#FFFFFF' : '#FAFAFA',
                      opacity: item.aktif ? 1 : 0.68,
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (item.aktif) e.currentTarget.style.background = '#F8FAFC';
                    }}
                    onMouseLeave={(e) => {
                      if (item.aktif) e.currentTarget.style.background = '#FFFFFF';
                    }}
                  >
                    {/* Urutan (1-based, not #0!) */}
                    <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '700', color: '#64748B', fontSize: '12px' }}>
                      #{idx + 1}
                    </td>

                    {/* Foto Thumbnail */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '8px',
                          background: '#F1F5F9',
                          overflow: 'hidden',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        {item.gambar ? (
                          <img
                            src={item.gambar}
                            alt={item.nama_item}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                        )}
                      </div>
                    </td>

                    {/* Nama Item & Sub-detail */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '13.5px', marginBottom: '3px' }}>
                        {item.nama_item}
                      </div>
                      {item.barang_id ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', color: '#059669', background: '#ECFDF5', padding: '1px 6px', borderRadius: '4px', border: '1px solid #A7F3D0', fontWeight: '600' }}>
                            ID Barang #{item.barang_id}
                          </span>
                          <span style={{ fontSize: '11px', color: '#475569', background: '#F1F5F9', padding: '1px 6px', borderRadius: '4px', fontWeight: '500' }}>
                            Stok: {item.barang_stok ?? '-'}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#64748B', background: '#F1F5F9', padding: '1px 6px', borderRadius: '4px', fontWeight: '500' }}>
                          Layanan / Custom Deal
                        </span>
                      )}
                    </td>

                    {/* Tipe Promo Pill */}
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          whiteSpace: 'nowrap',
                          background: item.tipe === 'product' ? '#EFF6FF' : '#FFFBEB',
                          color: item.tipe === 'product' ? '#1D4ED8' : '#B45309',
                          border: item.tipe === 'product' ? '1px solid #DBEAFE' : '1px solid #FDE68A',
                        }}
                      >
                        {item.tipe === 'product' ? 'Produk Fisik' : 'Layanan / Digital'}
                      </span>
                    </td>

                    {/* Harga Asli (Strikethrough) */}
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#94A3B8', textDecoration: 'line-through', fontSize: '12.5px' }}>
                      Rp {formatRupiah(item.harga_asli)}
                    </td>

                    {/* Harga Flash Sale (Bold Red) */}
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', color: '#DC2626', fontSize: '13.5px' }}>
                      Rp {formatRupiah(item.harga_diskon)}
                    </td>

                    {/* Diskon Badge */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span
                        style={{
                          background: '#FEE2E2',
                          color: '#DC2626',
                          fontWeight: '800',
                          fontSize: '11px',
                          padding: '3px 7px',
                          borderRadius: '4px',
                          border: '1px solid #FECACA',
                          display: 'inline-block',
                        }}
                      >
                        {item.diskon_persen || '-'}
                      </span>
                    </td>

                    {/* Progres Terjual */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ width: '100px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', fontWeight: '600', marginBottom: '3px' }}>
                          <span>Terjual</span>
                          <span style={{ fontWeight: '700', color: '#DC2626' }}>{item.terjual_pct || 75}%</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: '#FEE2E2', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, Math.max(0, item.terjual_pct || 75))}%`,
                              height: '100%',
                              background: '#EF4444',
                              borderRadius: '999px',
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status Toggle Button */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleToggleItemActive(item)}
                        title="Klik untuk mengubah status aktif/nonaktif"
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: item.aktif ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          background: item.aktif ? '#ECFDF5' : '#F8FAFC',
                          color: item.aktif ? '#059669' : '#64748B',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {item.aktif ? '✓ Aktif' : '○ Nonaktif'}
                      </button>
                    </td>

                    {/* Aksi Buttons */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <button
                          onClick={() => openEditItem(item)}
                          title="Edit Item"
                          style={{
                            width: '30px',
                            height: '30px',
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            color: '#334155',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#E2E8F0')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, item.nama_item)}
                          title="Hapus Item"
                          style={{
                            width: '30px',
                            height: '30px',
                            background: '#FEE2E2',
                            border: '1px solid #FECACA',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            color: '#DC2626',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#FCA5A5')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#FEE2E2')}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Modal Pop Up Tambah / Edit Item Flash Sale */}
      {showItemModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(3px)',
            padding: '16px',
            animation: 'fadeIn 0.15s ease-out',
          }}
          onClick={() => setShowItemModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#FAFAFA',
              }}
            >
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#EA580C', fontSize: '18px' }}>⚡</span>
                  {editId ? 'Edit Item Flash Sale' : 'Tambah Item Flash Sale'}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748B' }}>
                  Atur produk promosi berjangka, harga diskon, dan status tayang di toko online.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  fontSize: '15px',
                  cursor: 'pointer',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F1F5F9';
                  e.currentTarget.style.color = '#0F172A';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.color = '#64748B';
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveItem} style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>
              
              {/* Ambil Cepat dari Inventori Toko */}
              <div style={{ marginBottom: '18px', background: '#F8FAFC', padding: '14px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📦</span>
                    <span>Pilih Cepat dari Inventori Toko (Opsional)</span>
                  </label>
                  {form.barang_id && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, barang_id: '' }))}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '11px',
                        color: '#EF4444',
                        fontWeight: '600',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      ✕ Lepas Hubungan Barang
                    </button>
                  )}
                </div>

                <select
                  value={form.barang_id || ''}
                  onChange={handleSelectBarang}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    outline: 'none',
                  }}
                >
                  <option value="">-- Pilih Barang dari Inventori Toko --</option>
                  {barangList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nama_barang} ({b.barcode}) — Harga Toko: Rp {formatRupiah(b.harga_jual)} | Stok: {b.stok}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '6px' }}>
                  💡 Jika dipilih, nama barang, foto, dan harga asli akan otomatis terisi serta terhubung dengan stok produk fisik toko.
                </div>
              </div>

              {/* Tipe Promo: Modern Segmented Cards */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                  Tipe Promo <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div
                    onClick={() => setForm({ ...form, tipe: 'product' })}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: form.tipe === 'product' ? '2px solid #03AC0E' : '1px solid #CBD5E1',
                      background: form.tipe === 'product' ? '#F0FDF4' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="tipe_promo"
                      value="product"
                      checked={form.tipe === 'product'}
                      onChange={() => setForm({ ...form, tipe: 'product' })}
                      style={{ accentColor: '#03AC0E' }}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: form.tipe === 'product' ? '#065F46' : '#1E293B' }}>
                        🛍️ Produk Fisik
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                        Bisa dipesan ke keranjang belanja
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setForm({ ...form, tipe: 'digital' })}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: form.tipe === 'digital' ? '2px solid #3B82F6' : '1px solid #CBD5E1',
                      background: form.tipe === 'digital' ? '#EFF6FF' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="tipe_promo"
                      value="digital"
                      checked={form.tipe === 'digital'}
                      onChange={() => setForm({ ...form, tipe: 'digital' })}
                      style={{ accentColor: '#3B82F6' }}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: form.tipe === 'digital' ? '#1D4ED8' : '#1E293B' }}>
                        ⚡ Promo Digital / Jasa
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                        Arahkan ke pulsa, emas, atau SMM
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Target Aksi (Hanya Muncul jika Tipe Digital) */}
              {form.tipe === 'digital' && (
                <div style={{ marginBottom: '18px', background: '#F0F9FF', padding: '12px 14px', borderRadius: '8px', border: '1px solid #BAE6FD' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0369A1', marginBottom: '6px' }}>
                    Target Aksi / Link Ketika Tombol Diklik
                  </label>
                  <select
                    value={form.target_link}
                    onChange={(e) => setForm({ ...form, target_link: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #7DD3FC',
                      fontSize: '13px',
                      background: '#FFFFFF',
                    }}
                  >
                    <option value="deal-emas">Scroll ke Bagian Logam Mulia Emas 24K</option>
                    <option value="ppob">Buka Modal Top Up & Tagihan PPOB</option>
                    <option value="smm">Scroll ke Bagian Booster Sosmed</option>
                    <option value="web">Scroll ke Bagian Jasa Website</option>
                  </select>
                </div>
              )}

              {/* Nama Item Flash Sale */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Nama Item Flash Sale <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.nama_item}
                  onChange={(e) => setForm({ ...form, nama_item: e.target.value })}
                  placeholder="Contoh: Kaos Polos Pria Premium / Hijab Bella Square"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              {/* URL Gambar Produk dengan Live Preview */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  URL Gambar Produk (Opsional)
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={form.gambar}
                    onChange={(e) => setForm({ ...form, gambar: e.target.value })}
                    placeholder="https://... atau data:image/..."
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                  {form.gambar ? (
                    <img
                      src={form.gambar}
                      alt="Preview"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        border: '1px solid #E2E8F0',
                        flexShrink: 0,
                      }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '6px',
                        background: '#F1F5F9',
                        border: '1px dashed #CBD5E1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        color: '#94A3B8',
                        flexShrink: 0,
                      }}
                    >
                      🖼️
                    </div>
                  )}
                </div>
              </div>

              {/* Harga Asli / Coret & Harga Flash Sale */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Harga Normal / Coret <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.harga_asli ? `Rp ${Number(form.harga_asli).toLocaleString('id-ID')}` : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      handlePriceChange('harga_asli', val ? Number(val) : '');
                    }}
                    placeholder="Rp 0"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#EF4444', marginBottom: '6px' }}>
                    Harga Flash Sale (Promo) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.harga_diskon ? `Rp ${Number(form.harga_diskon).toLocaleString('id-ID')}` : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      handlePriceChange('harga_diskon', val ? Number(val) : '');
                    }}
                    placeholder="Rp 0"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #EF4444',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#EF4444',
                      boxSizing: 'border-box',
                      outline: 'none',
                      background: '#FFF5F5',
                    }}
                  />
                </div>
              </div>

              {/* Diskon Badge & Progress Terjual */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Label / Badge Diskon
                  </label>
                  <input
                    type="text"
                    value={form.diskon_persen}
                    onChange={(e) => setForm({ ...form, diskon_persen: e.target.value })}
                    placeholder="Contoh: -20%"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Estimasi Terjual: <b>{form.terjual_pct || 0}%</b>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.terjual_pct}
                    onChange={(e) => setForm({ ...form, terjual_pct: e.target.value })}
                    placeholder="75"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                  <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden', marginTop: '6px' }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(0, Number(form.terjual_pct) || 0))}%`,
                        height: '100%',
                        background: '#EF4444',
                        borderRadius: '4px',
                        transition: 'width 0.2s ease',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Urutan & Status Aktif */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    value={form.urutan}
                    onChange={(e) => setForm({ ...form, urutan: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', paddingTop: '22px' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontWeight: '700',
                      color: form.aktif ? '#065F46' : '#64748B',
                      background: form.aktif ? '#ECFDF5' : '#F1F5F9',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: form.aktif ? '1px solid #A7F3D0' : '1px solid #CBD5E1',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(form.aktif)}
                      onChange={(e) => setForm({ ...form, aktif: e.target.checked ? 1 : 0 })}
                      style={{ accentColor: '#03AC0E' }}
                    />
                    <span>{form.aktif ? '✓ Tampilkan di Toko' : '✕ Disembunyikan'}</span>
                  </label>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '18px', borderTop: '1px solid #E5E7EB', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  style={{
                    padding: '9px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#03AC0E',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: savingItem ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 6px rgba(3, 172, 14, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>✓</span>
                  <span>{savingItem ? 'Menyimpan...' : 'Simpan Item Flash Sale'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
