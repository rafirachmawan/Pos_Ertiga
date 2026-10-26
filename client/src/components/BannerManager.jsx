import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';
import { showConfirm, showToast } from '../lib/dialog';

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
  tipe: 'full', // 'full' (Banner Gambar Penuh) atau 'side' (Template Warna + Teks)
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

// Helper kompresi gambar sisi klien via Canvas
function compressBannerImage(file, isFull = true) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDimension = isFull ? 1400 : 700;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL('image/webp', 0.88);
        if (!dataUrl || !dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Format file gambar tidak valid atau rusak'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar dari perangkat'));
    reader.readAsDataURL(file);
  });
}

export default function BannerManager() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...emptyBanner });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [useUrlInput, setUseUrlInput] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

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

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyBanner, urutan: banners.length });
    setUseUrlInput(false);
    setShowForm(true);
    setError('');
  };

  const openEdit = (banner) => {
    setEditId(banner.id);
    const tipe = banner.tipe || (banner.gambar && !banner.subjudul ? 'full' : 'side');
    setForm({
      tipe,
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
    setUseUrlInput(Boolean(banner.gambar && banner.gambar.startsWith('http')));
    setShowForm(true);
    setError('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('File yang dipilih harus berupa file gambar (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('Ukuran file terlalu besar. Maksimal 8 MB sebelum kompresi.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      const compressedDataUrl = await compressBannerImage(file, form.tipe === 'full');
      setForm((prev) => ({ ...prev, gambar: compressedDataUrl }));
      showToast('Gambar berhasil diunggah & dioptimalkan!', 'success');
    } catch (err) {
      setError(err.message || 'Gagal memproses gambar');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, gambar: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!form.judul.trim()) {
      setError('Nama atau judul banner wajib diisi sebagai identitas.');
      return;
    }
    if (form.tipe === 'full' && !form.gambar.trim()) {
      setError('Untuk tipe Banner Gambar Penuh, Anda wajib mengunggah file gambar banner.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      if (editId) {
        await api(`/api/banners/${editId}`, { method: 'PUT', body: form });
        showToast('Banner berhasil diperbarui', 'success');
      } else {
        await api('/api/banners', { method: 'POST', body: form });
        showToast('Banner berhasil ditambahkan', 'success');
      }
      setShowForm(false);
      fetchBanners();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await showConfirm({
      title: 'Hapus Banner',
      message: 'Apakah Anda yakin ingin menghapus banner promosi ini?',
      confirmText: 'Ya, Hapus Banner',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/api/banners/${id}`, { method: 'DELETE' });
      showToast('Banner berhasil dihapus', 'success');
      fetchBanners();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (banner) => {
    try {
      await api(`/api/banners/${banner.id}`, {
        method: 'PUT',
        body: { ...banner, aktif: banner.aktif ? 0 : 1 },
      });
      fetchBanners();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* 1. Header Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '22px',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: '700',
              color: '#0F172A',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Kelola Banner Slider
          </h2>
          <p
            style={{
              color: '#64748B',
              marginTop: '4px',
              fontSize: '13px',
              margin: '4px 0 0 0',
            }}
          >
            Atur banner promosi carousel yang tampil di halaman utama toko online
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
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
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#1E293B';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#0F172A';
          }}
        >
          <span style={{ fontSize: '15px', lineHeight: 1 }}>+</span> Tambah Banner
        </button>
      </div>

      {error && !showForm && (
        <div
          style={{
            padding: '10px 16px',
            background: '#FEF2F2',
            color: '#991B1B',
            borderRadius: '8px',
            fontSize: '12.5px',
            marginBottom: '18px',
            border: '1px solid #FECACA',
            fontWeight: '500',
          }}
        >
          {error}
        </div>
      )}

      {/* 2. Banner List */}
      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#94A3B8',
            fontSize: '13px',
          }}
        >
          Memuat daftar banner slider...
        </div>
      ) : banners.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px dashed #CBD5E1',
          }}
        >
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>
            Belum ada banner slider
          </div>
          <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '4px', marginBottom: '16px' }}>
            Tambahkan banner promosi atau diskon pertama Anda untuk memikat pengunjung toko online.
          </div>
          <button
            type="button"
            onClick={openCreate}
            style={{
              height: '36px',
              padding: '0 16px',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            + Tambah Banner Pertama
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {banners.map((b, idx) => {
            const isFullBanner = b.tipe === 'full' && b.gambar;
            return (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  opacity: b.aktif ? 1 : 0.65,
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {/* Visual Preview Box */}
                <div
                  style={{
                    width: '240px',
                    minHeight: '110px',
                    background: isFullBanner ? '#0F172A' : b.warna_bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isFullBanner ? 'center' : 'flex-start',
                    padding: isFullBanner ? 0 : '16px 18px',
                    position: 'relative',
                    flexShrink: 0,
                    color: '#FFFFFF',
                    overflow: 'hidden',
                  }}
                >
                  {isFullBanner ? (
                    <img
                      src={b.gambar}
                      alt={b.judul}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <>
                      {b.gambar && (
                        <img
                          src={b.gambar}
                          alt=""
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            maxHeight: '65px',
                            maxWidth: '75px',
                            objectFit: 'contain',
                            opacity: 0.9,
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      <div style={{ zIndex: 1, maxWidth: '150px' }}>
                        {b.badge && (
                          <span
                            style={{
                              fontSize: '8.5px',
                              fontWeight: '800',
                              background: 'rgba(0,0,0,0.3)',
                              padding: '2px 5px',
                              borderRadius: '3px',
                              color: b.warna_accent || '#FFD700',
                              display: 'inline-block',
                              letterSpacing: '0.3px',
                            }}
                          >
                            {b.badge}
                          </span>
                        )}
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: '700',
                            marginTop: '4px',
                            lineHeight: '1.25',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {b.judul}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Clean Pill Tag at Bottom Left */}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '6px',
                      left: '8px',
                      zIndex: 2,
                      fontSize: '9px',
                      fontWeight: '700',
                      background: 'rgba(15, 23, 42, 0.75)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: '#FFFFFF',
                      letterSpacing: '0.2px',
                    }}
                  >
                    {b.tipe === 'full' ? 'Gambar Penuh' : 'Template Warna'}
                  </span>
                </div>

                {/* Banner Information */}
                <div
                  style={{
                    flex: 1,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Meta row badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                        Slide #{idx + 1}
                      </span>

                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: b.aktif ? '#ECFDF5' : '#F1F5F9',
                          color: b.aktif ? '#059669' : '#64748B',
                          border: `1px solid ${b.aktif ? '#A7F3D0' : '#E2E8F0'}`,
                        }}
                      >
                        {b.aktif ? 'Aktif' : 'Nonaktif'}
                      </span>

                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '500',
                          background: '#F8FAFC',
                          color: '#475569',
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        {b.tipe === 'full' ? 'Desain Penuh (1200×360)' : 'Template + Teks'}
                      </span>

                      {b.badge && b.tipe === 'side' && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '10.5px',
                            fontWeight: '600',
                            background: '#FFFBEB',
                            color: '#B45309',
                            border: '1px solid #FDE68A',
                          }}
                        >
                          Badge: {b.badge}
                        </span>
                      )}
                    </div>

                    {/* Judul & Deskripsi */}
                    <div
                      style={{
                        fontSize: '14.5px',
                        fontWeight: '700',
                        color: '#0F172A',
                        lineHeight: '1.3',
                      }}
                    >
                      {b.judul}
                    </div>

                    {b.subjudul && (
                      <div
                        style={{
                          fontSize: '12.5px',
                          color: '#64748B',
                          marginTop: '3px',
                          lineHeight: '1.4',
                        }}
                      >
                        {b.subjudul}
                      </div>
                    )}

                    {b.link && (
                      <div
                        style={{
                          fontSize: '11.5px',
                          color: '#2563EB',
                          marginTop: '5px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>Tautan:</span>
                        <span style={{ wordBreak: 'break-all' }}>{b.link}</span>
                      </div>
                    )}
                  </div>

                  {/* Clean Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => openEdit(b)}
                      style={{
                        height: '32px',
                        padding: '0 14px',
                        background: '#FFFFFF',
                        color: '#334155',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
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
                      onClick={() => handleToggleActive(b)}
                      style={{
                        height: '32px',
                        padding: '0 14px',
                        background: b.aktif ? '#F8FAFC' : '#ECFDF5',
                        color: b.aktif ? '#64748B' : '#059669',
                        border: `1px solid ${b.aktif ? '#E2E8F0' : '#A7F3D0'}`,
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (b.aktif) e.currentTarget.style.background = '#F1F5F9';
                      }}
                      onMouseLeave={(e) => {
                        if (b.aktif) e.currentTarget.style.background = '#F8FAFC';
                      }}
                    >
                      {b.aktif ? 'Sembunyikan' : 'Tampilkan'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(b.id)}
                      style={{
                        height: '32px',
                        padding: '0 12px',
                        background: '#FEF2F2',
                        color: '#DC2626',
                        border: '1px solid #FECACA',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#FEE2E2';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#FEF2F2';
                      }}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Modal Form (Refined & Clean) */}
      {showForm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowForm(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              width: '600px',
              maxWidth: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
              border: '1px solid #E2E8F0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px 16px',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: '17px',
                    fontWeight: '700',
                    color: '#0F172A',
                    margin: 0,
                  }}
                >
                  {editId ? 'Edit Banner Slider' : 'Tambah Banner Slider'}
                </h3>
                <p
                  style={{
                    fontSize: '12.5px',
                    color: '#64748B',
                    marginTop: '3px',
                    margin: '3px 0 0',
                  }}
                >
                  Atur tampilan banner yang tayang di carousel halaman utama toko online
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
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

            <div style={{ padding: '20px 24px 24px' }}>
              {error && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#FEF2F2',
                    color: '#991B1B',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    marginBottom: '16px',
                    border: '1px solid #FECACA',
                    fontWeight: '500',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Segmented Control / Tipe Banner */}
              <div style={{ marginBottom: '18px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#334155',
                    marginBottom: '8px',
                  }}
                >
                  Tipe Tampilan Banner <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div
                    onClick={() => setForm({ ...form, tipe: 'full' })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: form.tipe === 'full' ? '2px solid #0F172A' : '1px solid #E2E8F0',
                      background: form.tipe === 'full' ? '#F8FAFC' : '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: form.tipe === 'full' ? '#0F172A' : '#475569',
                      }}
                    >
                      Banner Gambar Penuh
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.3' }}>
                      Upload poster/grafis utuh (Canva, Photoshop). Menutup seluruh area slide.
                    </span>
                  </div>

                  <div
                    onClick={() => setForm({ ...form, tipe: 'side' })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: form.tipe === 'side' ? '2px solid #0F172A' : '1px solid #E2E8F0',
                      background: form.tipe === 'side' ? '#F8FAFC' : '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: form.tipe === 'side' ? '#0F172A' : '#475569',
                      }}
                    >
                      Template Warna & Teks
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.3' }}>
                      Warna gradien, judul, badge, plus foto ilustrasi produk samping opsional.
                    </span>
                  </div>
                </div>
              </div>

              {/* Panduan Ukuran */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '11px 14px',
                  marginBottom: '18px',
                }}
              >
                <div
                  style={{
                    fontSize: '11.5px',
                    fontWeight: '700',
                    color: '#334155',
                    marginBottom: '4px',
                  }}
                >
                  Panduan Ukuran Gambar:
                </div>
                {form.tipe === 'full' ? (
                  <div style={{ fontSize: '11.5px', color: '#64748B', lineHeight: '1.45' }}>
                    • Rekomendasi: <strong>1200 × 360 px</strong> atau <strong>1200 × 400 px</strong> (Rasio ~3:1 Landscape).<br />
                    • Format disarankan <strong>JPG / PNG / WebP</strong> (Maks. 8 MB, otomatis dikompres).
                  </div>
                ) : (
                  <div style={{ fontSize: '11.5px', color: '#64748B', lineHeight: '1.45' }}>
                    • Ukuran Foto Samping: <strong>400 × 400 px</strong> (Rasio 1:1 Persegi).<br />
                    • Disarankan menggunakan gambar dengan <strong>latar transparan (PNG)</strong> agar menyatu rapi dengan warna gradien.
                  </div>
                )}
              </div>

              {/* Live Preview Real-time */}
              <div style={{ marginBottom: '18px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: '700',
                      color: '#475569',
                    }}
                  >
                    Pratinjau Tampilan Slider:
                  </span>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                    {form.tipe === 'full' ? 'Banner Gambar Penuh' : 'Template Warna & Teks'}
                  </span>
                </div>

                {form.tipe === 'full' ? (
                  <div
                    style={{
                      borderRadius: '8px',
                      width: '100%',
                      height: '130px',
                      background: '#0F172A',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #E2E8F0',
                      position: 'relative',
                    }}
                  >
                    {form.gambar ? (
                      <img
                        src={form.gambar}
                        alt="Preview Banner Penuh"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', padding: '16px', color: '#94A3B8' }}>
                        <div style={{ fontSize: '12.5px', fontWeight: '600' }}>
                          Belum ada gambar banner
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          Silakan unggah gambar poster berukuran 1200 × 360 px di bawah
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      borderRadius: '8px',
                      height: '120px',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '16px 20px',
                      color: '#FFFFFF',
                      position: 'relative',
                      overflow: 'hidden',
                      background: form.warna_bg,
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    {form.gambar && (
                      <img
                        src={form.gambar}
                        alt=""
                        style={{
                          position: 'absolute',
                          right: '16px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          maxHeight: '80px',
                          maxWidth: '90px',
                          objectFit: 'contain',
                          opacity: 0.9,
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <div style={{ zIndex: 1, maxWidth: '320px' }}>
                      {form.badge && (
                        <span
                          style={{
                            fontSize: '8px',
                            fontWeight: '800',
                            background: 'rgba(0,0,0,0.3)',
                            padding: '2px 5px',
                            borderRadius: '3px',
                            color: form.warna_accent,
                            letterSpacing: '0.3px',
                          }}
                        >
                          {form.badge}
                        </span>
                      )}
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: '800',
                          marginTop: '4px',
                          lineHeight: '1.25',
                        }}
                      >
                        {form.judul || 'Judul Banner Promosi'}
                      </div>
                      {(form.subjudul || !form.judul) && (
                        <div
                          style={{
                            fontSize: '11px',
                            opacity: 0.85,
                            marginTop: '3px',
                            lineHeight: '1.3',
                          }}
                        >
                          {form.subjudul || 'Deskripsi singkat yang memikat pelanggan toko'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Gambar Section */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#334155',
                      margin: 0,
                    }}
                  >
                    {form.tipe === 'full'
                      ? 'File Gambar Poster (Wajib)'
                      : 'Foto Produk / Ilustrasi Samping (Opsional)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseUrlInput(!useUrlInput)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '11px',
                      color: '#2563EB',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: '500',
                    }}
                  >
                    {useUrlInput ? 'Ganti ke Upload File' : 'Gunakan Link URL'}
                  </button>
                </div>

                {useUrlInput ? (
                  <div>
                    <input
                      style={modalInputStyle}
                      value={form.gambar}
                      onChange={(e) => setForm({ ...form, gambar: e.target.value })}
                      placeholder={
                        form.tipe === 'full'
                          ? 'https://example.com/banner-1200x360.jpg'
                          : 'https://example.com/foto-produk.png'
                      }
                    />
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                      Tempel tautan URL gambar online langsung.
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />

                    {form.gambar ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          background: '#FFFFFF',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        <img
                          src={form.gambar}
                          alt="Thumbnail"
                          style={{
                            width: '56px',
                            height: '36px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            border: '1px solid #E2E8F0',
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#059669',
                            }}
                          >
                            Gambar Berhasil Dimuat
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>
                            {form.tipe === 'full' ? 'Banner Penuh' : 'Foto Samping'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            style={{
                              padding: '5px 10px',
                              background: '#FFFFFF',
                              color: '#334155',
                              border: '1px solid #CBD5E1',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            {uploading ? 'Memproses...' : 'Ganti'}
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            style={{
                              padding: '5px 8px',
                              background: '#FEF2F2',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        style={{
                          width: '100%',
                          padding: '14px',
                          background: '#FFFFFF',
                          border: '1px dashed #CBD5E1',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'border-color 0.15s ease',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '12.5px',
                            fontWeight: '600',
                            color: '#334155',
                          }}
                        >
                          {uploading
                            ? 'Sedang memproses gambar...'
                            : 'Pilih File Gambar dari Perangkat'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                          {form.tipe === 'full'
                            ? 'Format JPG, PNG, atau WebP (Rasio 1200 × 360 px)'
                            : 'Format PNG transparan disarankan (Rasio 1:1)'}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Form Input Fields */}
              <div style={{ marginBottom: '14px' }}>
                <label style={modalLabelStyle}>
                  Judul Banner <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  style={modalInputStyle}
                  value={form.judul}
                  onChange={(e) => setForm({ ...form, judul: e.target.value })}
                  placeholder="Contoh: Diskon Spesial Koleksi Fashion & Apparel"
                />
              </div>

              {form.tipe === 'side' && (
                <>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={modalLabelStyle}>Subjudul / Keterangan Singkat</label>
                    <textarea
                      style={{
                        ...modalInputStyle,
                        height: 'auto',
                        minHeight: '48px',
                        padding: '8px 12px',
                        resize: 'vertical',
                      }}
                      value={form.subjudul}
                      onChange={(e) => setForm({ ...form, subjudul: e.target.value })}
                      placeholder="Deskripsi singkat yang tampil di bawah judul banner"
                    />
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={modalLabelStyle}>Badge / Tag Promosi</label>
                    <input
                      style={modalInputStyle}
                      value={form.badge}
                      onChange={(e) => setForm({ ...form, badge: e.target.value })}
                      placeholder="Contoh: PROMO BULAN INI / HEMAT & BERKAH"
                    />
                  </div>

                  {/* Gradient Picker */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={modalLabelStyle}>Warna Background Template</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      {PRESET_GRADIENTS.map((g) => (
                        <div
                          key={g.value}
                          title={g.label}
                          onClick={() => setForm({ ...form, warna_bg: g.value })}
                          style={{
                            width: '42px',
                            height: '28px',
                            borderRadius: '6px',
                            background: g.value,
                            cursor: 'pointer',
                            border: form.warna_bg === g.value ? '2px solid #0F172A' : '1px solid #CBD5E1',
                            boxShadow: form.warna_bg === g.value ? '0 0 0 2px #94A3B8' : 'none',
                            transition: 'all 0.15s ease',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={modalLabelStyle}>Warna Aksen / Badge</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={form.warna_accent}
                          onChange={(e) => setForm({ ...form, warna_accent: e.target.value })}
                          style={{
                            width: '38px',
                            height: '38px',
                            border: '1px solid #CBD5E1',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            padding: '2px',
                            boxSizing: 'border-box',
                          }}
                        />
                        <input
                          style={{ ...modalInputStyle, flex: 1 }}
                          value={form.warna_accent}
                          onChange={(e) => setForm({ ...form, warna_accent: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label style={modalLabelStyle}>Link Tujuan Klik Banner (Opsional)</label>
                <input
                  style={modalInputStyle}
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="https://wa.me/6281234567890 atau https://toko.com/katalog"
                />
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                  Jika diisi, pengunjung yang mengeklik banner akan diarahkan ke tautan ini.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={modalLabelStyle}>Urutan Slide</label>
                  <input
                    style={modalInputStyle}
                    type="number"
                    min="0"
                    value={form.urutan}
                    onChange={(e) => setForm({ ...form, urutan: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={modalLabelStyle}>Status Publikasi</label>
                  <select
                    style={modalInputStyle}
                    value={form.aktif}
                    onChange={(e) => setForm({ ...form, aktif: Number(e.target.value) })}
                  >
                    <option value={1}>Aktif (Tampil di Toko Online)</option>
                    <option value={0}>Nonaktif (Sembunyikan Sementara)</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '22px',
                  paddingTop: '16px',
                  borderTop: '1px solid #F1F5F9',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    height: '36px',
                    padding: '0 18px',
                    background: '#FFFFFF',
                    color: '#334155',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || uploading}
                  style={{
                    height: '36px',
                    padding: '0 20px',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '12.5px',
                    cursor: saving || uploading ? 'not-allowed' : 'pointer',
                    opacity: saving || uploading ? 0.7 : 1,
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

const modalLabelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: '600',
  color: '#334155',
  marginBottom: '5px',
};

const modalInputStyle = {
  width: '100%',
  height: '38px',
  padding: '0 12px',
  border: '1px solid #CBD5E1',
  borderRadius: '8px',
  fontSize: '13px',
  color: '#0F172A',
  background: '#FFFFFF',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s ease',
};
