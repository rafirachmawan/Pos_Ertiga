import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

const PRESET_GRADIENTS = [
  { label: 'Hijau Toko', value: 'linear-gradient(135deg, #0A4D2E 0%, #03AC0E 100%)' },
  { label: 'Biru Digital', value: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)' },
  { label: 'Emas Premium', value: 'linear-gradient(135deg, #78350F 0%, #D97706 100%)' },
  { label: 'Merah Sale', value: 'linear-gradient(135deg, #991B1B 0%, #EF4444 100%)' },
  { label: 'Ungu Mewah', value: 'linear-gradient(135deg, #4C1D95 0%, #8B5CF6 100%)' },
  { label: 'Pink Trendy', value: 'linear-gradient(135deg, #831843 0%, #EC4899 100%)' },
  { label: 'Teal Segar', value: 'linear-gradient(135deg, #134E4A 0%, #14B8A6 100%)' },
  { label: 'Slate Gelap', value: 'linear-gradient(135deg, #1E293B 0%, #475569 100%)' },
];

const emptyBanner = {
  judul: '',
  subjudul: '',
  badge: '',
  gambar: '',
  warna_bg: PRESET_GRADIENTS[0].value,
  warna_accent: '#FFD700',
  link: '',
  urutan: 0,
  aktif: 1,
};

export default function BannerManager() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...emptyBanner });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api('/api/banners');
      setBanners(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyBanner, urutan: banners.length });
    setShowForm(true);
    setError('');
  };

  const openEdit = (banner) => {
    setEditId(banner.id);
    setForm({
      judul: banner.judul || '',
      subjudul: banner.subjudul || '',
      badge: banner.badge || '',
      gambar: banner.gambar || '',
      warna_bg: banner.warna_bg || PRESET_GRADIENTS[0].value,
      warna_accent: banner.warna_accent || '#FFD700',
      link: banner.link || '',
      urutan: banner.urutan ?? 0,
      aktif: banner.aktif ?? 1,
    });
    setShowForm(true);
    setError('');
  };

  const handleSave = async () => {
    if (!form.judul.trim()) { setError('Judul banner wajib diisi'); return; }
    try {
      setSaving(true); setError('');
      if (editId) {
        await api(`/api/banners/${editId}`, { method: 'PUT', body: form });
      } else {
        await api('/api/banners', { method: 'POST', body: form });
      }
      setShowForm(false);
      fetchBanners();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus banner ini?')) return;
    try { await api(`/api/banners/${id}`, { method: 'DELETE' }); fetchBanners(); }
    catch (err) { setError(err.message); }
  };

  const handleToggleActive = async (banner) => {
    try {
      await api(`/api/banners/${banner.id}`, { method: 'PUT', body: { ...banner, aktif: banner.aktif ? 0 : 1 } });
      fetchBanners();
    } catch (err) { setError(err.message); }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>Kelola Banner Slider</h1>
          <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '6px', margin: 0 }}>
            Atur banner carousel yang tampil di halaman utama toko online. Drag urutan untuk mengatur posisi.
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            padding: '10px 22px', background: '#03AC0E', color: 'white', border: 'none',
            borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
          }}
        >
          + Tambah Banner
        </button>
      </div>

      {error && !showForm && (
        <div style={{ padding: '10px 14px', background: '#FEF2F2', color: '#991B1B', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', border: '1px solid #FECACA' }}>
          {error}
        </div>
      )}

      {/* Banner List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>Memuat banner...</div>
      ) : banners.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: '#F9FAFB', borderRadius: '16px', border: '2px dashed #E5E7EB' }}>
          <div style={{ fontSize: '48px', marginBottom: '14px' }}>🖼️</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>Belum ada banner</div>
          <div style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '6px' }}>Klik "Tambah Banner" untuk membuat slider pertama</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {banners.map((b, idx) => (
            <div
              key={b.id}
              style={{
                display: 'flex', alignItems: 'stretch', background: '#FFFFFF',
                borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)', opacity: b.aktif ? 1 : 0.6,
              }}
            >
              {/* Preview Gradient */}
              <div style={{
                width: '280px', minHeight: '110px', background: b.warna_bg, display: 'flex',
                alignItems: 'center', padding: '18px 20px', position: 'relative', flexShrink: 0, color: '#fff',
              }}>
                {b.gambar && (
                  <img src={b.gambar} alt="" style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    maxHeight: '70px', maxWidth: '80px', objectFit: 'contain', opacity: 0.85,
                  }} onError={(e) => { e.target.style.display = 'none'; }} />
                )}
                <div style={{ zIndex: 1, maxWidth: '180px' }}>
                  {b.badge && (
                    <span style={{
                      fontSize: '9px', fontWeight: '800', background: 'rgba(0,0,0,0.3)',
                      padding: '2px 6px', borderRadius: '3px', color: b.warna_accent || '#FFD700',
                    }}>
                      {b.badge}
                    </span>
                  )}
                  <div style={{ fontSize: '13px', fontWeight: '700', marginTop: '5px', lineHeight: '1.3' }}>
                    {b.judul}
                  </div>
                  {b.subjudul && (
                    <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '3px', lineHeight: '1.3' }}>
                      {b.subjudul.length > 60 ? b.subjudul.slice(0, 60) + '...' : b.subjudul}
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div style={{ flex: 1, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#1F2937' }}>
                      Slide #{idx + 1}
                    </span>
                    <span style={{
                      display: 'inline-block', padding: '2px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '700',
                      background: b.aktif ? '#D1FAE5' : '#FEE2E2', color: b.aktif ? '#065F46' : '#991B1B',
                    }}>
                      {b.aktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    {b.judul}
                  </div>
                  {b.link && (
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '3px' }}>
                      🔗 {b.link.length > 40 ? b.link.slice(0, 40) + '...' : b.link}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => openEdit(b)}
                    style={{
                      padding: '7px 16px', background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB',
                      borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(b)}
                    style={{
                      padding: '7px 16px', background: b.aktif ? '#FEF3C7' : '#D1FAE5',
                      color: b.aktif ? '#92400E' : '#065F46', border: 'none',
                      borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                    }}
                  >
                    {b.aktif ? 'Sembunyikan' : 'Tampilkan'}
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    style={{
                      padding: '7px 16px', background: '#FEE2E2', color: '#991B1B', border: 'none',
                      borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                    }}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Modal Form ─── */}
      {showForm && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000,
          }}
          onClick={() => setShowForm(false)}
        >
          <div
            style={{
              background: '#FFFFFF', borderRadius: '16px', width: '540px',
              maxHeight: '88vh', overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '22px 28px 0', borderBottom: 'none' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#111827', margin: 0 }}>
                {editId ? 'Edit Banner' : 'Tambah Banner Baru'}
              </h2>
              <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                Banner akan tampil di carousel halaman utama toko online
              </p>
            </div>

            <div style={{ padding: '20px 28px 28px' }}>
              {error && (
                <div style={{ padding: '8px 12px', background: '#FEF2F2', color: '#991B1B', borderRadius: '6px', fontSize: '12px', marginBottom: '16px', border: '1px solid #FECACA' }}>
                  {error}
                </div>
              )}

              {/* Live Preview */}
              <div style={{
                borderRadius: '10px', height: '100px', display: 'flex', alignItems: 'center',
                padding: '18px', color: '#FFFFFF', marginBottom: '20px', position: 'relative', overflow: 'hidden',
                background: form.warna_bg,
              }}>
                {form.gambar && (
                  <img src={form.gambar} alt="" style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    maxHeight: '70px', maxWidth: '90px', objectFit: 'contain', opacity: 0.85,
                  }} onError={(e) => { e.target.style.display = 'none'; }} />
                )}
                <div style={{ zIndex: 1 }}>
                  {form.badge && (
                    <span style={{ fontSize: '8px', fontWeight: '800', background: 'rgba(0,0,0,0.3)', padding: '2px 5px', borderRadius: '3px', color: form.warna_accent }}>
                      {form.badge}
                    </span>
                  )}
                  <div style={{ fontSize: '14px', fontWeight: '800', marginTop: '4px', lineHeight: '1.3' }}>
                    {form.judul || 'Judul Banner'}
                  </div>
                  {(form.subjudul || !form.judul) && (
                    <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '3px' }}>
                      {form.subjudul || 'Subjudul banner'}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
                  Judul Banner <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  value={form.judul}
                  onChange={(e) => setForm({ ...form, judul: e.target.value })}
                  placeholder="Contoh: Diskon Spesial Fashion & Apparel"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>Subjudul</label>
                <textarea
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', minHeight: '50px', resize: 'vertical' }}
                  value={form.subjudul}
                  onChange={(e) => setForm({ ...form, subjudul: e.target.value })}
                  placeholder="Deskripsi singkat untuk banner"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>Badge / Label</label>
                  <input
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    value={form.badge}
                    onChange={(e) => setForm({ ...form, badge: e.target.value })}
                    placeholder="PROMO BULAN INI"
                  />
                </div>
                <div style={{ width: '90px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>Urutan</label>
                  <input
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    type="number" min="0"
                    value={form.urutan}
                    onChange={(e) => setForm({ ...form, urutan: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>URL Gambar (opsional)</label>
                <input
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  value={form.gambar}
                  onChange={(e) => setForm({ ...form, gambar: e.target.value })}
                  placeholder="https://example.com/banner.jpg"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>Link Tujuan (opsional)</label>
                <input
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="https://wa.me/6281234567890"
                />
              </div>

              {/* Gradient Picker */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Warna Background</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {PRESET_GRADIENTS.map((g) => (
                    <div
                      key={g.value}
                      title={g.label}
                      onClick={() => setForm({ ...form, warna_bg: g.value })}
                      style={{
                        width: '44px', height: '30px', borderRadius: '6px', background: g.value, cursor: 'pointer',
                        border: form.warna_bg === g.value ? '3px solid #111827' : '2px solid #E5E7EB',
                        boxShadow: form.warna_bg === g.value ? '0 0 0 2px #93C5FD' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    />
                  ))}
                </div>
                <input
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '12px', outline: 'none', boxSizing: 'border-box', color: '#6B7280' }}
                  value={form.warna_bg}
                  onChange={(e) => setForm({ ...form, warna_bg: e.target.value })}
                  placeholder="CSS gradient atau warna"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>Warna Accent</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={form.warna_accent}
                      onChange={(e) => setForm({ ...form, warna_accent: e.target.value })}
                      style={{ width: '38px', height: '34px', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer', padding: '2px' }}
                    />
                    <input
                      style={{ flex: 1, padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                      value={form.warna_accent}
                      onChange={(e) => setForm({ ...form, warna_accent: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>Status</label>
                  <select
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                    value={form.aktif}
                    onChange={(e) => setForm({ ...form, aktif: Number(e.target.value) })}
                  >
                    <option value={1}>Aktif (Tampil)</option>
                    <option value={0}>Nonaktif</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #F3F4F6' }}>
                <button
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '10px 22px', background: '#F9FAFB', color: '#374151', border: '1px solid #D1D5DB',
                    borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '10px 22px', background: '#03AC0E', color: 'white', border: 'none',
                    borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Tambah Banner'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
