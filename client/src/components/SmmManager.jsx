import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { showConfirm } from '../lib/dialog';

const formatRupiah = (val) => {
  return Number(val || 0).toLocaleString('id-ID');
};

const emptyPlatform = {
  nama_platform: '',
  slug: '',
  color: '#000000',
  icon: '',
  deskripsi: '',
  urutan: 0,
  aktif: 1,
};

const emptyLayanan = {
  platform_id: '',
  nama_layanan: '',
  target_type: 'Username / Profil Akun',
  deskripsi: '',
  urutan: 0,
  aktif: 1,
};

const emptyPaket = {
  layanan_id: '',
  jumlah_order: '',
  harga_jual: '',
  harga_modal: '',
  is_popular: 0,
  deskripsi: '',
  urutan: 0,
  aktif: 1,
};

export default function SmmManager() {
  const [dataTree, setDataTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatformId, setSelectedPlatformId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Platform Modal state
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [editPlatformId, setEditPlatformId] = useState(null);
  const [platformForm, setPlatformForm] = useState({ ...emptyPlatform });

  // Layanan Modal state
  const [showLayananModal, setShowLayananModal] = useState(false);
  const [editLayananId, setEditLayananId] = useState(null);
  const [layananForm, setLayananForm] = useState({ ...emptyLayanan });

  // Paket Modal state
  const [showPaketModal, setShowPaketModal] = useState(false);
  const [editPaketId, setEditPaketId] = useState(null);
  const [paketForm, setPaketForm] = useState({ ...emptyPaket });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api('/api/smm/all');
      setDataTree(res.data || []);
      if (res.data?.length > 0 && selectedPlatformId === 'all') {
        setSelectedPlatformId(res.data[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedPlatformId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── PLATFORM HANDLERS ──────────────────────────────────────
  const openCreatePlatform = () => {
    setEditPlatformId(null);
    setPlatformForm({ ...emptyPlatform, urutan: dataTree.length });
    setError('');
    setShowPlatformModal(true);
  };

  const openEditPlatform = (p) => {
    setEditPlatformId(p.id);
    setPlatformForm({
      nama_platform: p.nama_platform,
      slug: p.slug || '',
      color: p.color || '#000000',
      icon: p.icon || '',
      deskripsi: p.deskripsi || '',
      urutan: p.urutan ?? 0,
      aktif: p.aktif ?? 1,
    });
    setError('');
    setShowPlatformModal(true);
  };

  const handleSavePlatform = async (e) => {
    e.preventDefault();
    if (!platformForm.nama_platform.trim()) {
      setError('Nama platform wajib diisi');
      return;
    }

    try {
      setSaving(true);
      setError('');
      if (editPlatformId) {
        await api(`/api/smm/platform/${editPlatformId}`, { method: 'PUT', body: platformForm });
      } else {
        await api('/api/smm/platform', { method: 'POST', body: platformForm });
      }
      setShowPlatformModal(false);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlatform = async (p) => {
    const ok = await showConfirm({
      title: 'Hapus Platform SMM',
      message: `Yakin ingin menghapus platform "${p.nama_platform}" beserta seluruh layanan dan paketnya?`,
      submessage: 'Seluruh layanan dan paket di bawah platform ini akan ikut dihapus.',
      confirmText: 'Ya, Hapus Platform',
      type: 'danger',
    });
    if (!ok) return;

    try {
      setSaving(true);
      await api(`/api/smm/platform/${p.id}`, { method: 'DELETE' });
      if (selectedPlatformId === p.id) {
        setSelectedPlatformId('all');
      }
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── LAYANAN HANDLERS ───────────────────────────────────────
  const openCreateLayanan = (defaultPlatformId) => {
    setEditLayananId(null);
    const targetPlatId = defaultPlatformId || (selectedPlatformId !== 'all' ? selectedPlatformId : dataTree[0]?.id || '');
    setLayananForm({
      ...emptyLayanan,
      platform_id: targetPlatId,
    });
    setError('');
    setShowLayananModal(true);
  };

  const openEditLayanan = (l) => {
    setEditLayananId(l.id);
    setLayananForm({
      platform_id: l.platform_id,
      nama_layanan: l.nama_layanan,
      target_type: l.target_type || 'Username / Profil Akun',
      deskripsi: l.deskripsi || '',
      urutan: l.urutan ?? 0,
      aktif: l.aktif ?? 1,
    });
    setError('');
    setShowLayananModal(true);
  };

  const handleSaveLayanan = async (e) => {
    e.preventDefault();
    if (!layananForm.nama_layanan.trim()) {
      setError('Nama layanan wajib diisi');
      return;
    }
    if (!layananForm.platform_id) {
      setError('Pilih platform untuk layanan ini');
      return;
    }

    try {
      setSaving(true);
      setError('');
      if (editLayananId) {
        await api(`/api/smm/layanan/${editLayananId}`, { method: 'PUT', body: layananForm });
      } else {
        await api('/api/smm/layanan', { method: 'POST', body: layananForm });
      }
      setShowLayananModal(false);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLayanan = async (l) => {
    const ok = await showConfirm({
      title: 'Hapus Layanan SMM',
      message: `Yakin ingin menghapus layanan "${l.nama_layanan}" beserta seluruh paketnya?`,
      submessage: 'Seluruh paket di dalam layanan ini akan ikut terhapus.',
      confirmText: 'Ya, Hapus Layanan',
      type: 'danger',
    });
    if (!ok) return;

    try {
      setSaving(true);
      await api(`/api/smm/layanan/${l.id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── PAKET HANDLERS ─────────────────────────────────────────
  const openCreatePaket = (defaultLayananId) => {
    setEditPaketId(null);
    setPaketForm({
      ...emptyPaket,
      layanan_id: defaultLayananId || '',
    });
    setError('');
    setShowPaketModal(true);
  };

  const openEditPaket = (pkg) => {
    setEditPaketId(pkg.id);
    setPaketForm({
      layanan_id: pkg.layanan_id,
      jumlah_order: pkg.jumlah_order,
      harga_jual: pkg.harga_jual,
      harga_modal: pkg.harga_modal || '',
      is_popular: pkg.is_popular ? 1 : 0,
      deskripsi: pkg.deskripsi || '',
      urutan: pkg.urutan ?? 0,
      aktif: pkg.aktif ?? 1,
    });
    setError('');
    setShowPaketModal(true);
  };

  const handleSavePaket = async (e) => {
    e.preventDefault();
    if (!paketForm.layanan_id) {
      setError('Pilih layanan sosmed untuk paket ini');
      return;
    }
    if (!paketForm.jumlah_order || Number(paketForm.jumlah_order) <= 0) {
      setError('Jumlah order harus lebih besar dari 0');
      return;
    }
    if (paketForm.harga_jual === '' || Number(paketForm.harga_jual) < 0) {
      setError('Harga jual wajib diisi');
      return;
    }

    try {
      setSaving(true);
      setError('');
      if (editPaketId) {
        await api(`/api/smm/paket/${editPaketId}`, { method: 'PUT', body: paketForm });
      } else {
        await api('/api/smm/paket', { method: 'POST', body: paketForm });
      }
      setShowPaketModal(false);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePaket = async (pkg) => {
    const ok = await showConfirm({
      title: 'Hapus Paket SMM',
      message: `Hapus paket ${Number(pkg.jumlah_order).toLocaleString('id-ID')} seharga Rp ${formatRupiah(pkg.harga_jual)}?`,
      confirmText: 'Ya, Hapus Paket',
      type: 'danger',
    });
    if (!ok) return;

    try {
      setSaving(true);
      await api(`/api/smm/paket/${pkg.id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Filtered platforms
  const platformsToDisplay = dataTree.filter((p) => {
    if (selectedPlatformId === 'all') return true;
    return p.id === Number(selectedPlatformId);
  });

  // Calculate totals
  const totalPlatforms = dataTree.length;
  const totalServices = dataTree.reduce((acc, p) => acc + (p.services?.length || 0), 0);
  const totalPackages = dataTree.reduce((acc, p) => {
    return acc + (p.services?.reduce((subAcc, s) => subAcc + (s.packages?.length || 0), 0) || 0);
  }, 0);

  return (
    <div style={{ padding: '0 0 40px 0' }}>
      
      {/* 1. Header Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '22px',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
              Kelola Booster Sosmed (SMM)
            </h2>
            <span
              style={{
                background: '#F5F3FF',
                color: '#6D28D9',
                fontSize: '11.5px',
                fontWeight: '700',
                padding: '3px 10px',
                borderRadius: '6px',
                border: '1px solid #DDD6FE',
              }}
            >
              {totalPlatforms} Platform · {totalServices} Layanan · {totalPackages} Paket
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
            Atur platform (TikTok, Instagram, YouTube), jenis layanan, harga jual, dan kuantitas order yang tampil di web toko.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={openCreatePlatform}
            style={{
              padding: '9px 15px',
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
            <span style={{ fontSize: '14px', lineHeight: 1 }}>+</span>
            <span>Tambah Platform</span>
          </button>

          <button
            type="button"
            onClick={() => openCreateLayanan()}
            style={{
              padding: '9px 15px',
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
            <span style={{ fontSize: '14px', lineHeight: 1 }}>+</span>
            <span>Tambah Layanan</span>
          </button>

          <button
            type="button"
            onClick={() => openCreatePaket()}
            style={{
              padding: '9px 18px',
              background: '#7C3AED',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: '14px', lineHeight: 1 }}>+</span>
            <span>Tambah Paket Harga</span>
          </button>
        </div>
      </div>

      {/* 2. Unified Filter & Search Toolbar */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        }}
      >
        {/* Platform Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', marginRight: '4px' }}>
            Filter Platform:
          </span>

          <button
            type="button"
            onClick={() => setSelectedPlatformId('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1.5px solid',
              borderColor: selectedPlatformId === 'all' ? '#7C3AED' : '#E2E8F0',
              background: selectedPlatformId === 'all' ? '#7C3AED' : '#F8FAFC',
              color: selectedPlatformId === 'all' ? '#FFFFFF' : '#475569',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            Semua Platform ({totalPlatforms})
          </button>

          {dataTree.map((p) => {
            const isSelected = selectedPlatformId === p.id;
            const pkgCount = p.services?.reduce((a, s) => a + (s.packages?.length || 0), 0) || 0;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPlatformId(p.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '1.5px solid',
                  borderColor: isSelected ? (p.color || '#7C3AED') : '#E2E8F0',
                  background: isSelected ? `${p.color || '#7C3AED'}15` : '#F8FAFC',
                  color: isSelected ? (p.color || '#7C3AED') : '#475569',
                  fontSize: '12px',
                  fontWeight: isSelected ? '700' : '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: p.color || '#7C3AED',
                  }}
                />
                <span>{p.nama_platform}</span>
                <span
                  style={{
                    fontSize: '11px',
                    background: isSelected ? `${p.color || '#7C3AED'}25` : '#E2E8F0',
                    color: isSelected ? (p.color || '#7C3AED') : '#64748B',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontWeight: '700',
                  }}
                >
                  {pkgCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input & Total info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <div style={{ position: 'relative', width: '270px' }}>
            <span style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '13px' }}>
              🔍
            </span>
            <input
              type="text"
              placeholder="Cari layanan, paket order..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '36px',
                paddingLeft: '32px',
                paddingRight: '12px',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                fontSize: '12.5px',
                color: '#1E293B',
                outline: 'none',
                boxSizing: 'border-box',
                background: '#FAFAFA',
              }}
            />
          </div>
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>
            <strong style={{ color: '#0F172A' }}>{totalPackages}</strong> pilihan aktif
          </span>
        </div>
      </div>

      {/* 3. Content: Platforms & Services */}
      {loading ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94A3B8', fontSize: '13.5px' }}>
          Memuat data Booster Sosmed...
        </div>
      ) : platformsToDisplay.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px dashed #CBD5E1',
            borderRadius: '12px',
            padding: '48px 20px',
            textAlign: 'center',
            color: '#64748B',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚀</div>
          <p style={{ fontSize: '15px', fontWeight: '700', color: '#1E293B', margin: '0 0 6px 0' }}>
            Belum ada platform yang terdaftar
          </p>
          <p style={{ fontSize: '13px', margin: 0, marginBottom: '16px' }}>
            Klik tombol di bawah untuk menambahkan platform baru seperti TikTok, Instagram, atau YouTube.
          </p>
          <button
            type="button"
            onClick={openCreatePlatform}
            style={{
              padding: '9px 18px',
              background: '#7C3AED',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            + Tambah Platform Baru
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {platformsToDisplay.map((p) => {
            const filteredServices = (p.services || []).filter((s) => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              const matchService = s.nama_layanan?.toLowerCase().includes(q) || s.target_type?.toLowerCase().includes(q);
              const matchPackage = s.packages?.some((pkg) => {
                return (
                  String(pkg.jumlah_order).includes(q) ||
                  String(pkg.harga_jual).includes(q) ||
                  pkg.deskripsi?.toLowerCase().includes(q)
                );
              });
              return matchService || matchPackage;
            });

            return (
              <div
                key={p.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  overflow: 'hidden',
                }}
              >
                {/* Platform Header */}
                <div
                  style={{
                    padding: '14px 20px',
                    background: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: p.color || '#7C3AED',
                        color: '#FFFFFF',
                        fontWeight: '800',
                        fontSize: '15px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      {p.nama_platform?.charAt(0)}
                    </span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '16.5px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                          {p.nama_platform}
                        </h3>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: p.aktif ? '#ECFDF5' : '#F1F5F9',
                            color: p.aktif ? '#059669' : '#64748B',
                            border: p.aktif ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.aktif ? '#10B981' : '#94A3B8' }} />
                          {p.aktif ? 'Aktif di Web' : 'Disembunyikan'}
                        </span>
                      </div>
                      {p.deskripsi && (
                        <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
                          {p.deskripsi}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Platform Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => openCreateLayanan(p.id)}
                      style={{
                        padding: '7px 14px',
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '7px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#0F172A',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>➕</span> Tambah Layanan
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditPlatform(p)}
                      style={{
                        padding: '7px 12px',
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '7px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#475569',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>✏️</span> Edit Platform
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePlatform(p)}
                      style={{
                        padding: '7px 10px',
                        background: '#FEF2F2',
                        border: '1px solid #FCA5A5',
                        borderRadius: '7px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#DC2626',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                      }}
                      title="Hapus Platform"
                    >
                      <span>🗑️</span> Hapus
                    </button>
                  </div>
                </div>

                {/* Services Container */}
                <div style={{ padding: '18px 20px' }}>
                  {filteredServices.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94A3B8', fontSize: '13px' }}>
                      Belum ada layanan untuk platform {p.nama_platform}. Klik tombol "+ Tambah Layanan" di atas.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      {filteredServices.map((s) => {
                        const packages = s.packages || [];
                        return (
                          <div
                            key={s.id}
                            style={{
                              border: '1px solid #E2E8F0',
                              borderRadius: '10px',
                              overflow: 'hidden',
                              background: '#FFFFFF',
                            }}
                          >
                            {/* Service Header */}
                            <div
                              style={{
                                padding: '12px 16px',
                                background: '#F8FAFC',
                                borderBottom: '1px solid #E2E8F0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '10px',
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#0F172A' }}>
                                    {s.nama_layanan}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: '600',
                                      background: '#EFF6FF',
                                      color: '#1D4ED8',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      border: '1px solid #BFDBFE',
                                    }}
                                  >
                                    🎯 Target: {s.target_type}
                                  </span>
                                  {!s.aktif && (
                                    <span style={{ fontSize: '10.5px', background: '#F1F5F9', color: '#64748B', padding: '2px 7px', borderRadius: '4px', fontWeight: '600' }}>
                                      Nonaktif
                                    </span>
                                  )}
                                </div>
                                {s.deskripsi && (
                                  <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0 0' }}>
                                    {s.deskripsi}
                                  </p>
                                )}
                              </div>

                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => openCreatePaket(s.id)}
                                  style={{
                                    padding: '6px 12px',
                                    background: '#7C3AED',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    boxShadow: '0 1px 2px rgba(124, 58, 237, 0.2)',
                                  }}
                                >
                                  <span>➕</span> Tambah Paket
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditLayanan(s)}
                                  style={{
                                    padding: '6px 10px',
                                    background: '#FFFFFF',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: '#475569',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                  title="Edit Layanan"
                                >
                                  <span>✏️</span> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLayanan(s)}
                                  style={{
                                    padding: '6px 10px',
                                    background: '#FEF2F2',
                                    border: '1px solid #FCA5A5',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: '#DC2626',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                  title="Hapus Layanan"
                                >
                                  <span>🗑️</span> Hapus
                                </button>
                              </div>
                            </div>

                            {/* Service Packages Table */}
                            {packages.length === 0 ? (
                              <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '12.5px' }}>
                                Belum ada paket harga untuk layanan ini. Klik tombol "+ Tambah Paket" di atas.
                              </div>
                            ) : (
                              <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', minWidth: '720px', borderCollapse: 'collapse', textAlign: 'left' }}>
                                  <thead>
                                    <tr style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
                                      <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', width: '150px', borderRight: '1px solid #E2E8F0' }}>
                                        Kuantitas Order
                                      </th>
                                      <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', width: '130px', borderRight: '1px solid #E2E8F0' }}>
                                        Badge / Tipe
                                      </th>
                                      <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', width: '130px', textAlign: 'right', borderRight: '1px solid #E2E8F0' }}>
                                        Harga Modal
                                      </th>
                                      <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', width: '140px', textAlign: 'right', borderRight: '1px solid #E2E8F0' }}>
                                        Harga Jual (Web)
                                      </th>
                                      <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', width: '130px', textAlign: 'right', borderRight: '1px solid #E2E8F0' }}>
                                        Estimasi Profit
                                      </th>
                                      <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', width: '90px', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                                        Status
                                      </th>
                                      <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', width: '130px', textAlign: 'center' }}>
                                        Aksi
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {packages.map((pkg) => {
                                      const profit = pkg.harga_jual - (pkg.harga_modal || 0);
                                      return (
                                        <tr
                                          key={pkg.id}
                                          style={{
                                            borderBottom: '1px solid #F1F5F9',
                                            transition: 'background 0.15s ease',
                                          }}
                                          onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                        >
                                          {/* Kuantitas Order */}
                                          <td style={{ padding: '10px 14px', fontSize: '13.5px', fontWeight: '800', color: '#0F172A', borderRight: '1px solid #E2E8F0' }}>
                                            {Number(pkg.jumlah_order).toLocaleString('id-ID')}
                                          </td>

                                          {/* Badge / Tipe */}
                                          <td style={{ padding: '10px 14px', fontSize: '12px', borderRight: '1px solid #E2E8F0' }}>
                                            {pkg.is_popular ? (
                                              <span
                                                style={{
                                                  background: '#FEF3C7',
                                                  color: '#B45309',
                                                  fontWeight: '700',
                                                  fontSize: '10.5px',
                                                  padding: '2px 8px',
                                                  borderRadius: '4px',
                                                  border: '1px solid #FDE68A',
                                                  display: 'inline-block',
                                                }}
                                              >
                                                ⭐ BEST SELLER
                                              </span>
                                            ) : (
                                              <span style={{ color: '#64748B', fontSize: '12px', fontWeight: '500' }}>
                                                Reguler
                                              </span>
                                            )}
                                          </td>

                                          {/* Harga Modal */}
                                          <td style={{ padding: '10px 14px', fontSize: '12.5px', color: '#64748B', textAlign: 'right', borderRight: '1px solid #E2E8F0', fontVariantNumeric: 'tabular-nums' }}>
                                            Rp {formatRupiah(pkg.harga_modal)}
                                          </td>

                                          {/* Harga Jual */}
                                          <td style={{ padding: '10px 14px', fontSize: '13.5px', fontWeight: '800', color: '#7C3AED', textAlign: 'right', borderRight: '1px solid #E2E8F0', fontVariantNumeric: 'tabular-nums' }}>
                                            Rp {formatRupiah(pkg.harga_jual)}
                                          </td>

                                          {/* Estimasi Profit */}
                                          <td style={{ padding: '10px 14px', fontSize: '12.5px', fontWeight: '700', color: profit >= 0 ? '#059669' : '#DC2626', textAlign: 'right', borderRight: '1px solid #E2E8F0', fontVariantNumeric: 'tabular-nums' }}>
                                            +{formatRupiah(profit)}
                                          </td>

                                          {/* Status */}
                                          <td style={{ padding: '10px 14px', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                                            <span
                                              style={{
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                background: pkg.aktif ? '#ECFDF5' : '#F1F5F9',
                                                color: pkg.aktif ? '#059669' : '#64748B',
                                                border: pkg.aktif ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                                              }}
                                            >
                                              {pkg.aktif ? 'Aktif' : 'Off'}
                                            </span>
                                          </td>

                                          {/* Aksi Buttons */}
                                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                            <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'center' }}>
                                              <button
                                                type="button"
                                                onClick={() => openEditPaket(pkg)}
                                                style={{
                                                  background: '#FFFFFF',
                                                  border: '1px solid #CBD5E1',
                                                  borderRadius: '5px',
                                                  padding: '4px 9px',
                                                  fontSize: '11.5px',
                                                  fontWeight: '600',
                                                  color: '#334155',
                                                  cursor: 'pointer',
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  gap: '3px',
                                                  transition: 'all 0.15s ease',
                                                }}
                                                title="Edit Paket"
                                              >
                                                <span>✏️</span>
                                                <span>Edit</span>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleDeletePaket(pkg)}
                                                style={{
                                                  background: '#FEF2F2',
                                                  border: '1px solid #FCA5A5',
                                                  borderRadius: '5px',
                                                  padding: '4px 9px',
                                                  fontSize: '11.5px',
                                                  fontWeight: '600',
                                                  color: '#DC2626',
                                                  cursor: 'pointer',
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  gap: '3px',
                                                  transition: 'all 0.15s ease',
                                                }}
                                                title="Hapus Paket"
                                              >
                                                <span>🗑️</span>
                                                <span>Hapus</span>
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL: PLATFORM ──────────────────────────────────── */}
      {showPlatformModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '460px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0F172A' }}>
                {editPlatformId ? 'Edit Platform Sosmed' : 'Tambah Platform Baru'}
              </h3>
              <button
                onClick={() => setShowPlatformModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            {error && (
              <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSavePlatform}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Nama Platform *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: TikTok, Instagram, YouTube, X"
                  value={platformForm.nama_platform}
                  onChange={(e) => setPlatformForm({ ...platformForm, nama_platform: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Warna Brand
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={platformForm.color}
                      onChange={(e) => setPlatformForm({ ...platformForm, color: e.target.value })}
                      style={{ width: '40px', height: '38px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={platformForm.color}
                      onChange={(e) => setPlatformForm({ ...platformForm, color: e.target.value })}
                      style={{
                        flex: 1,
                        padding: '9px 10px',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    value={platformForm.urutan}
                    onChange={(e) => setPlatformForm({ ...platformForm, urutan: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Deskripsi / Tagline Singkat
                </label>
                <textarea
                  rows="2"
                  placeholder="Keterangan singkat platform..."
                  value={platformForm.deskripsi}
                  onChange={(e) => setPlatformForm({ ...platformForm, deskripsi: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(platformForm.aktif)}
                    onChange={(e) => setPlatformForm({ ...platformForm, aktif: e.target.checked ? 1 : 0 })}
                  />
                  <span style={{ fontSize: '13px', color: '#334155', fontWeight: '600' }}>
                    Tampilkan platform ini di etalase web toko
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowPlatformModal(false)}
                  style={{
                    padding: '9px 16px',
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '9px 20px',
                    background: '#7C3AED',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Platform'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: LAYANAN ───────────────────────────────────── */}
      {showLayananModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0F172A' }}>
                {editLayananId ? 'Edit Layanan Sosmed' : 'Tambah Layanan Baru'}
              </h3>
              <button
                onClick={() => setShowLayananModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            {error && (
              <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSaveLayanan}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Platform *
                </label>
                <select
                  required
                  value={layananForm.platform_id}
                  onChange={(e) => setLayananForm({ ...layananForm, platform_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">-- Pilih Platform --</option>
                  {dataTree.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama_platform}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Nama Layanan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: TikTok Followers (Aktif / HQ) atau Reels Views"
                  value={layananForm.nama_layanan}
                  onChange={(e) => setLayananForm({ ...layananForm, nama_layanan: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Instruksi Target Input untuk Pembeli
                </label>
                <input
                  type="text"
                  placeholder="Misal: Username / Profil TikTok (Contoh: @akun_kamu) atau Link Video VT"
                  value={layananForm.target_type}
                  onChange={(e) => setLayananForm({ ...layananForm, target_type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Deskripsi Singkat Layanan
                </label>
                <textarea
                  rows="2"
                  placeholder="Keterangan tentang kualitas / jenis akun..."
                  value={layananForm.deskripsi}
                  onChange={(e) => setLayananForm({ ...layananForm, deskripsi: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(layananForm.aktif)}
                    onChange={(e) => setLayananForm({ ...layananForm, aktif: e.target.checked ? 1 : 0 })}
                  />
                  <span style={{ fontSize: '13px', color: '#334155', fontWeight: '600' }}>
                    Aktifkan layanan ini di web
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowLayananModal(false)}
                  style={{
                    padding: '9px 16px',
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '9px 20px',
                    background: '#7C3AED',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Layanan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: PAKET HARGA ───────────────────────────────── */}
      {showPaketModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0F172A' }}>
                {editPaketId ? 'Edit Paket Harga' : 'Tambah Paket Harga Baru'}
              </h3>
              <button
                onClick={() => setShowPaketModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            {error && (
              <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSavePaket}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Layanan Sosmed *
                </label>
                <select
                  required
                  value={paketForm.layanan_id}
                  onChange={(e) => setPaketForm({ ...paketForm, layanan_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">-- Pilih Layanan --</option>
                  {dataTree.map((p) => (
                    <optgroup key={p.id} label={p.nama_platform}>
                      {(p.services || []).map((s) => (
                        <option key={s.id} value={s.id}>
                          {p.nama_platform} - {s.nama_layanan}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Jumlah Order (Kuantitas) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 1000 (untuk 1.000 followers / views / likes)"
                  value={paketForm.jumlah_order}
                  onChange={(e) => setPaketForm({ ...paketForm, jumlah_order: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Harga Modal
                  </label>
                  <input
                    type="text"
                    placeholder="Rp 0"
                    value={paketForm.harga_modal ? `Rp ${Number(paketForm.harga_modal).toLocaleString('id-ID')}` : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setPaketForm({ ...paketForm, harga_modal: val ? Number(val) : '' });
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Harga Jual Web *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Rp 0"
                    value={paketForm.harga_jual ? `Rp ${Number(paketForm.harga_jual).toLocaleString('id-ID')}` : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setPaketForm({ ...paketForm, harga_jual: val ? Number(val) : '' });
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(paketForm.is_popular)}
                    onChange={(e) => setPaketForm({ ...paketForm, is_popular: e.target.checked ? 1 : 0 })}
                  />
                  <span style={{ fontSize: '13px', color: '#D97706', fontWeight: '700' }}>
                    ⭐ Tandai sebagai Paket Terlaris (BEST SELLER)
                  </span>
                </label>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(paketForm.aktif)}
                    onChange={(e) => setPaketForm({ ...paketForm, aktif: e.target.checked ? 1 : 0 })}
                  />
                  <span style={{ fontSize: '13px', color: '#334155', fontWeight: '600' }}>
                    Paket ini aktif dan siap diorder pelanggan
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowPaketModal(false)}
                  style={{
                    padding: '9px 16px',
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '9px 20px',
                    background: '#7C3AED',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Paket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
