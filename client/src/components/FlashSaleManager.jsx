import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { api } from '../lib/api';
import { showConfirm } from '../lib/dialog';

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
  const [isBarangDropdownOpen, setIsBarangDropdownOpen] = useState(false);
  const [barangSearch, setBarangSearch] = useState('');
  const [visibleBarangCount, setVisibleBarangCount] = useState(10);
  const dropdownRef = useRef(null);

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

  // Outside click listener for custom barang dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsBarangDropdownOpen(false);
      }
    };
    if (isBarangDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isBarangDropdownOpen]);

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
      notifySuccess(
        nextState ? 'Flash Sale diaktifkan di website' : 'Flash Sale dinonaktifkan di website'
      );
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
    setBarangSearch('');
    setVisibleBarangCount(10);
    setIsBarangDropdownOpen(false);
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
    setBarangSearch('');
    setVisibleBarangCount(10);
    setIsBarangDropdownOpen(false);
    setError('');
    setShowItemModal(true);
  };

  // When user selects a barang from dropdown
  const handleSelectBarang = (bId) => {
    if (!bId) {
      setForm((prev) => ({ ...prev, barang_id: '' }));
      return;
    }
    const selected = barangList.find((b) => String(b.id) === String(bId));
    if (selected) {
      const hargaNormal = Number(selected.harga_jual) || 0;
      const diskonPct = 20; // default 20%
      const hargaDiskon = Math.round(hargaNormal * (1 - diskonPct / 100));

      setForm((prev) => ({
        ...prev,
        barang_id: selected.id,
        nama_item: selected.nama_barang || prev.nama_item,
        gambar: selected.foto_url || selected.gambar || prev.gambar,
        harga_asli: hargaNormal,
        harga_diskon: hargaDiskon,
        diskon_persen: `-${diskonPct}%`,
        tipe: 'product',
      }));
    }
  };

  // Filtered barang list for the custom dropdown
  const filteredBarangList = useMemo(() => {
    const q = barangSearch.toLowerCase().trim();
    if (!q) return barangList;
    return barangList.filter((b) => {
      const nama = (b.nama_barang || '').toLowerCase();
      const barcode = (b.barcode || '').toLowerCase();
      return nama.includes(q) || barcode.includes(q);
    });
  }, [barangList, barangSearch]);

  // Display only visibleBarangCount items (10 initially, loads more on scroll)
  const displayedBarangList = useMemo(() => {
    return filteredBarangList.slice(0, visibleBarangCount);
  }, [filteredBarangList, visibleBarangCount]);

  const selectedBarang = useMemo(() => {
    return barangList.find((b) => String(b.id) === String(form.barang_id)) || null;
  }, [barangList, form.barang_id]);

  const handleDropdownScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      if (visibleBarangCount < filteredBarangList.length) {
        setVisibleBarangCount((prev) => Math.min(prev + 10, filteredBarangList.length));
      }
    }
  };

  // Recalculate discount percentage when price changes
  const handlePriceChange = (field, value) => {
    const updated = { ...form, [field]: value };
    const asli = Number(field === 'harga_asli' ? value : updated.harga_asli) || 0;
    const diskon = Number(field === 'harga_diskon' ? value : updated.harga_diskon) || 0;

    if (asli > 0 && diskon > 0 && diskon < asli) {
      const pct = Math.round(((asli - diskon) / asli) * 100);
      updated.diskon_persen = `-${pct}%`;
    } else if (asli > 0 && diskon >= asli) {
      updated.diskon_persen = '0%';
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
    if (!form.harga_diskon) {
      setError('Harga flash sale promo wajib diisi');
      return;
    }

    try {
      setSavingItem(true);
      setError('');
      const payload = {
        ...form,
        barang_id: form.barang_id ? Number(form.barang_id) : null,
        harga_asli: Number(form.harga_asli) || 0,
        harga_diskon: Number(form.harga_diskon) || 0,
        terjual_pct: Number(form.terjual_pct) || 75,
        urutan: Number(form.urutan) || 0,
        aktif: Number(form.aktif) ? 1 : 0,
      };

      if (editId) {
        await api(`/api/flash-sale/items/${editId}`, {
          method: 'PUT',
          body: payload,
        });
        notifySuccess('Item flash sale berhasil diperbarui');
      } else {
        await api('/api/flash-sale/items', {
          method: 'POST',
          body: payload,
        });
        notifySuccess('Item flash sale berhasil ditambahkan');
      }
      setShowItemModal(false);
      fetchData();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan item flash sale');
    } finally {
      setSavingItem(false);
    }
  };

  // Toggle Single Item Active
  const handleToggleItemActive = async (item) => {
    try {
      await api(`/api/flash-sale/items/${item.id}`, {
        method: 'PUT',
        body: { ...item, aktif: item.aktif ? 0 : 1 },
      });
      fetchData();
    } catch (err) {
      setError(err.message || 'Gagal mengubah status item');
    }
  };

  // Delete Single Item
  const handleDeleteItem = async (id, nama) => {
    const ok = await showConfirm({
      title: 'Hapus Item Flash Sale',
      message: `Apakah Anda yakin ingin menghapus "${nama}" dari daftar flash sale?`,
      confirmText: 'Ya, Hapus Item',
      type: 'danger',
    });
    if (!ok) return;
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
    <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* 1. Header Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '22px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: '700',
              color: '#0F172A',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Kelola Flash Sale Website
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
            Atur produk promo terbatas, hitung mundur (countdown), diskon spesial, dan status tayang di etalase toko online
          </p>
        </div>

        {/* Global Active Badge Toggle & Add Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Interactive Toggle Switch */}
          <div
            onClick={handleToggleGlobalActive}
            title="Klik untuk mengaktifkan atau menonaktifkan Flash Sale di website"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: settings.aktif ? '#ECFDF5' : '#F1F5F9',
              border: `1px solid ${settings.aktif ? '#A7F3D0' : '#E2E8F0'}`,
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {/* Toggle Switch Track & Knob */}
            <div
              style={{
                width: '36px',
                height: '20px',
                borderRadius: '9999px',
                background: settings.aktif ? '#10B981' : '#CBD5E1',
                position: 'relative',
                transition: 'background 0.2s ease',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  position: 'absolute',
                  top: '2px',
                  left: settings.aktif ? '18px' : '2px',
                  transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                }}
              />
            </div>

            {/* Status Label */}
            <span
              style={{
                fontSize: '12px',
                fontWeight: '700',
                color: settings.aktif ? '#047857' : '#64748B',
                whiteSpace: 'nowrap',
              }}
            >
              {settings.aktif ? 'Flash Sale: Aktif di Web' : 'Flash Sale: Nonaktif'}
            </span>
          </div>

          <button
            type="button"
            onClick={openCreateItem}
            style={{
              height: '38px',
              padding: '0 18px',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1E293B')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#0F172A')}
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
            padding: '10px 16px',
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '8px',
            color: '#065F46',
            fontSize: '12.5px',
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
      {error && !showItemModal && (
        <div
          style={{
            padding: '10px 16px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            color: '#991B1B',
            fontSize: '12.5px',
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
          padding: '20px 22px',
          marginBottom: '22px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
              Pengaturan Header & Timer Flash Sale
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0 0' }}>
              Atur label badge, subjudul teks promo, dan durasi hitung mundur timer di homepage
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#F8FAFC',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
              fontSize: '11.5px',
              color: '#475569',
            }}
          >
            <span style={{ fontWeight: '700' }}>{settings.badge_text || 'FLASH SALE'}</span>
            <span>·</span>
            <span>{settings.durasi_jam || 3} Jam Countdown</span>
          </div>
        </div>

        <form onSubmit={handleSaveSettings}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) 160px',
              gap: '14px',
              alignItems: 'flex-end',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  color: '#475569',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}
              >
                Badge Header
              </label>
              <input
                type="text"
                value={settings.badge_text || ''}
                onChange={(e) => setSettings({ ...settings, badge_text: e.target.value })}
                placeholder="mis. FLASH SALE"
                style={settingInputStyle}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  color: '#475569',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}
              >
                Teks Subjudul / Promo
              </label>
              <input
                type="text"
                value={settings.subjudul || ''}
                onChange={(e) => setSettings({ ...settings, subjudul: e.target.value })}
                placeholder="mis. Promo Terbatas Hari Ini"
                style={settingInputStyle}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  color: '#475569',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}
              >
                Durasi Hitung Mundur (Jam)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={settings.durasi_jam || 3}
                onChange={(e) => setSettings({ ...settings, durasi_jam: e.target.value })}
                style={settingInputStyle}
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
                  fontWeight: '600',
                  cursor: savingSettings ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
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
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        {/* Table Card Header with Search & Filter */}
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
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
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
              <input
                type="text"
                placeholder="Cari item promo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 12px',
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
                height: '36px',
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
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
            Memuat data flash sale...
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: '56px 20px', textAlign: 'center' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px 0' }}>
              {items.length === 0 ? 'Belum Ada Item Flash Sale' : 'Item Tidak Ditemukan'}
            </h4>
            <p style={{ fontSize: '12.5px', color: '#64748B', margin: '0 0 16px 0' }}>
              {items.length === 0
                ? 'Tambahkan produk dari inventori barang untuk dijadikan promo flash sale hari ini.'
                : 'Coba ubah kata kunci pencarian atau filter tipe.'}
            </p>
            {items.length === 0 && (
              <button
                type="button"
                onClick={openCreateItem}
                style={{
                  height: '36px',
                  padding: '0 18px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: '600',
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
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={thStyle({ width: '50px', textAlign: 'center' })}>No</th>
                  <th style={thStyle({ width: '60px', textAlign: 'center' })}>Foto</th>
                  <th style={thStyle({ minWidth: '220px' })}>Nama Item Promo</th>
                  <th style={thStyle({ width: '130px' })}>Tipe</th>
                  <th style={thStyle({ width: '120px', textAlign: 'right' })}>Harga Asli</th>
                  <th style={thStyle({ width: '140px', textAlign: 'right' })}>Harga Flash Sale</th>
                  <th style={thStyle({ width: '80px', textAlign: 'center' })}>Diskon</th>
                  <th style={thStyle({ width: '130px' })}>Progres Terjual</th>
                  <th style={thStyle({ width: '110px', textAlign: 'center' })}>Status</th>
                  <th style={thStyle({ width: '90px', textAlign: 'center' }, true)}>Aksi</th>
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
                    {/* Urutan */}
                    <td style={tdStyle({ textAlign: 'center', fontWeight: '700', color: '#64748B', fontSize: '12px' })}>
                      #{idx + 1}
                    </td>

                    {/* Foto Thumbnail */}
                    <td style={tdStyle({ textAlign: 'center' })}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
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
                          <span style={{ fontSize: '10px', color: '#94A3B8' }}>No Img</span>
                        )}
                      </div>
                    </td>

                    {/* Nama Item & Sub-detail */}
                    <td style={tdStyle()}>
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
                    <td style={tdStyle()}>
                      <span
                        style={{
                          fontSize: '11px',
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
                    <td style={tdStyle({ textAlign: 'right', color: '#94A3B8', textDecoration: 'line-through', fontSize: '12.5px' })}>
                      Rp {formatRupiah(item.harga_asli)}
                    </td>

                    {/* Harga Flash Sale (Bold Red) */}
                    <td style={tdStyle({ textAlign: 'right', fontWeight: '800', color: '#DC2626', fontSize: '13.5px' })}>
                      Rp {formatRupiah(item.harga_diskon)}
                    </td>

                    {/* Diskon Badge */}
                    <td style={tdStyle({ textAlign: 'center' })}>
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
                    <td style={tdStyle()}>
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
                    <td style={tdStyle({ textAlign: 'center' })}>
                      <button
                        type="button"
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
                    <td style={tdStyle({ textAlign: 'center' }, true)}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => openEditItem(item)}
                          title="Edit Item"
                          style={{
                            height: '28px',
                            padding: '0 10px',
                            background: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            color: '#334155',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#F8FAFC';
                            e.currentTarget.style.borderColor = '#94A3B8';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#FFFFFF';
                            e.currentTarget.style.borderColor = '#CBD5E1';
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id, item.nama_item)}
                          title="Hapus Item"
                          style={{
                            height: '28px',
                            padding: '0 10px',
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            color: '#DC2626',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#FEE2E2')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#FEF2F2')}
                        >
                          Hapus
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
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(3px)',
            padding: '16px',
          }}
          onClick={() => setShowItemModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                  {editId ? 'Edit Item Flash Sale' : 'Tambah Item Flash Sale'}
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#64748B' }}>
                  Atur produk promosi berjangka, harga diskon, dan status tayang di toko online
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  lineHeight: 1,
                  padding: '4px 6px',
                  borderRadius: '6px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveItem} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              
              {/* Ambil Cepat dari Inventori Toko */}
              <div style={{ marginBottom: '18px', background: '#F8FAFC', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>
                    Pilih Cepat dari Inventori Toko (Opsional)
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

                {/* Custom 10-Item Scrollable Dropdown */}
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                  {/* Dropdown Trigger */}
                  <div
                    onClick={() => {
                      setIsBarangDropdownOpen((prev) => !prev);
                      if (!isBarangDropdownOpen) setVisibleBarangCount(10);
                    }}
                    style={{
                      width: '100%',
                      minHeight: '38px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: isBarangDropdownOpen ? '1.5px solid #0F172A' : '1px solid #CBD5E1',
                      fontSize: '13px',
                      background: '#FFFFFF',
                      color: selectedBarang ? '#0F172A' : '#64748B',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      {selectedBarang ? (
                        <span style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {selectedBarang.nama_barang} {selectedBarang.barcode ? `(${selectedBarang.barcode})` : ''} — Rp {formatRupiah(selectedBarang.harga_jual)} | Stok: {selectedBarang.stok}
                        </span>
                      ) : (
                        <span>-- Pilih Barang dari Inventori Toko --</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8', fontSize: '11px' }}>
                      {selectedBarang && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectBarang('');
                          }}
                          title="Hapus pilihan"
                          style={{ padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', color: '#EF4444', fontWeight: 'bold' }}
                        >
                          ✕
                        </span>
                      )}
                      <span style={{ fontSize: '10px' }}>{isBarangDropdownOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Dropdown Popup Menu (Initial 10 items, infinite scroll down) */}
                  {isBarangDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        boxShadow: '0 12px 24px -4px rgba(15, 23, 42, 0.18)',
                        zIndex: 100,
                        overflow: 'hidden',
                      }}
                    >
                      {/* Search Bar inside Dropdown */}
                      <div style={{ padding: '8px 10px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                        <input
                          type="text"
                          placeholder="Ketik untuk mencari barang atau barcode..."
                          value={barangSearch}
                          onChange={(e) => {
                            setBarangSearch(e.target.value);
                            setVisibleBarangCount(10);
                          }}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: '100%',
                            height: '32px',
                            padding: '0 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '12px',
                            color: '#0F172A',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      {/* Scrollable Container (Showing 10 items, scroll to load more) */}
                      <div
                        onScroll={handleDropdownScroll}
                        style={{
                          maxHeight: '230px',
                          overflowY: 'auto',
                        }}
                      >
                        {displayedBarangList.length === 0 ? (
                          <div style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: '12.5px' }}>
                            Tidak ada barang yang cocok dengan pencarian
                          </div>
                        ) : (
                          displayedBarangList.map((b) => {
                            const isSelected = String(b.id) === String(form.barang_id);
                            return (
                              <div
                                key={b.id}
                                onClick={() => {
                                  handleSelectBarang(b.id);
                                  setIsBarangDropdownOpen(false);
                                  setBarangSearch('');
                                }}
                                style={{
                                  padding: '9px 12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #F1F5F9',
                                  background: isSelected ? '#EFF6FF' : '#FFFFFF',
                                  transition: 'background 0.1s ease',
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) e.currentTarget.style.background = '#F8FAFC';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) e.currentTarget.style.background = '#FFFFFF';
                                }}
                              >
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ fontSize: '12.5px', fontWeight: '600', color: isSelected ? '#1D4ED8' : '#0F172A' }}>
                                    {b.nama_barang} {b.barcode ? `(${b.barcode})` : ''}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                                    Harga Toko: Rp {formatRupiah(b.harga_jual)} · Stok: {b.stok}
                                  </div>
                                </div>
                                {isSelected && (
                                  <span style={{ color: '#1D4ED8', fontSize: '12px', fontWeight: 'bold', marginLeft: '8px' }}>
                                    ✓
                                  </span>
                                )}
                              </div>
                            );
                          })
                        )}

                        {/* Footer Indicator / Load more */}
                        {visibleBarangCount < filteredBarangList.length && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setVisibleBarangCount((prev) => Math.min(prev + 10, filteredBarangList.length));
                            }}
                            style={{
                              padding: '8px 12px',
                              textAlign: 'center',
                              background: '#F8FAFC',
                              borderTop: '1px solid #E2E8F0',
                              color: '#2563EB',
                              fontSize: '11.5px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            Menampilkan {displayedBarangList.length} dari {filteredBarangList.length} barang (Scroll untuk muat lagi)
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '5px' }}>
                  Jika dipilih, nama barang, foto, dan harga asli akan otomatis terisi serta terhubung dengan stok produk fisik.
                </div>
              </div>

              {/* Tipe Promo */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                  Tipe Promo <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div
                    onClick={() => setForm({ ...form, tipe: 'product' })}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: form.tipe === 'product' ? '2px solid #0F172A' : '1px solid #CBD5E1',
                      background: form.tipe === 'product' ? '#F8FAFC' : '#FFFFFF',
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
                      style={{ accentColor: '#0F172A' }}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: form.tipe === 'product' ? '#0F172A' : '#475569' }}>
                        Produk Fisik
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
                      border: form.tipe === 'digital' ? '2px solid #0F172A' : '1px solid #CBD5E1',
                      background: form.tipe === 'digital' ? '#F8FAFC' : '#FFFFFF',
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
                      style={{ accentColor: '#0F172A' }}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: form.tipe === 'digital' ? '#0F172A' : '#475569' }}>
                        Promo Digital / Jasa
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
                <div style={{ marginBottom: '18px', background: '#F8FAFC', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Target Aksi / Link Ketika Tombol Diklik
                  </label>
                  <select
                    value={form.target_link}
                    onChange={(e) => setForm({ ...form, target_link: e.target.value })}
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      background: '#FFFFFF',
                      boxSizing: 'border-box',
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Nama Item Flash Sale <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.nama_item}
                  onChange={(e) => setForm({ ...form, nama_item: e.target.value })}
                  placeholder="Contoh: Kaos Polos Pria Premium / Hijab Bella Square"
                  style={formInputStyle}
                />
              </div>

              {/* URL Gambar Produk dengan Live Preview */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  URL Gambar Produk (Opsional)
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={form.gambar}
                    onChange={(e) => setForm({ ...form, gambar: e.target.value })}
                    placeholder="https://... atau data:image/..."
                    style={{ ...formInputStyle, flex: 1 }}
                  />
                  {form.gambar ? (
                    <img
                      src={form.gambar}
                      alt="Preview"
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        border: '1px solid #E2E8F0',
                        flexShrink: 0,
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '6px',
                        background: '#F1F5F9',
                        border: '1px dashed #CBD5E1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        color: '#94A3B8',
                        flexShrink: 0,
                      }}
                    >
                      Foto
                    </div>
                  )}
                </div>
              </div>

              {/* Harga Asli & Harga Flash Sale */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
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
                    style={formInputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#DC2626', marginBottom: '6px' }}>
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
                      ...formInputStyle,
                      border: '1.5px solid #EF4444',
                      fontWeight: '700',
                      color: '#DC2626',
                      background: '#FFF5F5',
                    }}
                  />
                </div>
              </div>

              {/* Diskon Badge & Progress Terjual */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Label / Badge Diskon
                  </label>
                  <input
                    type="text"
                    value={form.diskon_persen}
                    onChange={(e) => setForm({ ...form, diskon_persen: e.target.value })}
                    placeholder="Contoh: -20%"
                    style={formInputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Estimasi Terjual: <strong>{form.terjual_pct || 0}%</strong>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.terjual_pct}
                    onChange={(e) => setForm({ ...form, terjual_pct: e.target.value })}
                    placeholder="75"
                    style={formInputStyle}
                  />
                </div>
              </div>

              {/* Urutan & Status Aktif */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '14px', marginBottom: '12px', alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Urutan
                  </label>
                  <input
                    type="number"
                    value={form.urutan}
                    onChange={(e) => setForm({ ...form, urutan: Number(e.target.value) })}
                    style={formInputStyle}
                  />
                </div>

                <div style={{ paddingTop: '22px' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontWeight: '600',
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
                      style={{ accentColor: '#0F172A' }}
                    />
                    <span>{form.aktif ? '✓ Tampilkan di Toko' : 'Disembunyikan'}</span>
                  </label>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '18px', borderTop: '1px solid #F1F5F9', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  style={{
                    height: '36px',
                    padding: '0 18px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#334155',
                    fontSize: '12.5px',
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
                    height: '36px',
                    padding: '0 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    cursor: savingItem ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: savingItem ? 0.7 : 1,
                  }}
                >
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

const thStyle = (extra = {}, isLast = false) => ({
  padding: '12px 14px',
  fontSize: '11px',
  fontWeight: '700',
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  borderBottom: '2px solid #CBD5E1',
  borderRight: isLast ? 'none' : '1px solid #E2E8F0',
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
  ...extra,
});

const tdStyle = (extra = {}, isLast = false) => ({
  padding: '12px 14px',
  verticalAlign: 'middle',
  borderBottom: '1px solid #F1F5F9',
  borderRight: isLast ? 'none' : '1px solid #E2E8F0',
  ...extra,
});

const settingInputStyle = {
  width: '100%',
  height: '38px',
  padding: '0 12px',
  borderRadius: '8px',
  border: '1px solid #CBD5E1',
  fontSize: '13px',
  color: '#0F172A',
  outline: 'none',
  boxSizing: 'border-box',
};

const formInputStyle = {
  width: '100%',
  height: '38px',
  padding: '0 12px',
  borderRadius: '8px',
  border: '1px solid #CBD5E1',
  fontSize: '13px',
  color: '#0F172A',
  boxSizing: 'border-box',
  outline: 'none',
};
