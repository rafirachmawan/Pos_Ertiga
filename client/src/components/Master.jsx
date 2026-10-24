import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { showConfirm } from '../lib/dialog';

const Master = () => {
  const [kategoriList, setKategoriList] = useState([]);
  const [barangList, setBarangList] = useState([]);
  const [newKategori, setNewKategori] = useState('');
  const [newKode, setNewKode] = useState('');
  const [searchKategori, setSearchKategori] = useState('');
  const [loading, setLoading] = useState(true);

  // State untuk edit inline
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingKode, setEditingKode] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [katRes, barRes] = await Promise.all([
        api('/api/kategori'),
        api('/api/barang'),
      ]);

      if (katRes.data) setKategoriList(katRes.data);
      if (barRes.data) setBarangList(barRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addKategori = async (e) => {
    e.preventDefault();
    const trimmed = newKategori.trim();
    const trimmedKode = newKode.trim().toUpperCase();
    if (!trimmed) {
      alert('Nama kategori wajib diisi');
      return;
    }

    try {
      await api('/api/kategori', {
        method: 'POST',
        body: { nama_kategori: trimmed, kode: trimmedKode },
      });
      setNewKategori('');
      setNewKode('');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const startEdit = (k) => {
    setEditingId(k.id);
    setEditingName(k.nama_kategori || '');
    setEditingKode(k.kode || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingKode('');
  };

  const saveEdit = async (id) => {
    const trimmed = editingName.trim();
    const trimmedKode = editingKode.trim().toUpperCase();
    if (!trimmed) {
      alert('Nama kategori tidak boleh kosong');
      return;
    }

    try {
      setSavingEdit(true);
      await api(`/api/kategori/${id}`, {
        method: 'PUT',
        body: { nama_kategori: trimmed, kode: trimmedKode },
      });
      setEditingId(null);
      setEditingName('');
      setEditingKode('');
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteKategori = async (id, nama, totalProduk) => {
    const hasProducts = totalProduk > 0;
    const ok = await showConfirm({
      title: 'Hapus Kategori',
      message: hasProducts
        ? `Kategori "${nama}" saat ini digunakan oleh ${totalProduk} produk.`
        : `Hapus kategori "${nama}"?`,
      submessage: hasProducts
        ? 'Jika dihapus, produk tersebut akan otomatis dialihkan menjadi "Tanpa Kategori".'
        : 'Kategori ini akan dihapus dari daftar.',
      confirmText: 'Ya, Hapus Kategori',
      type: 'danger',
    });

    if (!ok) return;

    try {
      await api(`/api/kategori/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter kategori
  const filteredKategori = useMemo(() => {
    const q = searchKategori.toLowerCase().trim();
    if (!q) return kategoriList;
    return kategoriList.filter(
      (k) =>
        k.nama_kategori.toLowerCase().includes(q) ||
        (k.kode && k.kode.toLowerCase().includes(q))
    );
  }, [kategoriList, searchKategori]);

  // Statistik produk terkategori & tanpa kategori
  const totalProduk = barangList.length;
  const totalProdukTerkategori = useMemo(() => {
    return barangList.filter((b) => b.kategori_id !== null && b.kategori_id !== undefined).length;
  }, [barangList]);
  const totalProdukTanpaKategori = Math.max(0, totalProduk - totalProdukTerkategori);

  // Ringkasan satuan produk
  const satuanSummary = useMemo(() => {
    const map = {};
    barangList.forEach((b) => {
      const s = (b.satuan || 'pcs').toLowerCase();
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([satuan, count]) => ({ satuan, count }));
  }, [barangList]);

  return (
    <div>
      {/* Header */}
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
            Data Master
          </h2>
          <p style={{ color: '#64748B', marginTop: '4px', fontSize: '13px' }}>
            Kelola data referensi, kategori produk, dan klasifikasi inventaris toko
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '220px' }}>
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
              placeholder="Cari kategori..."
              value={searchKategori}
              onChange={(e) => setSearchKategori(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '34px',
                paddingRight: searchKategori ? '28px' : '12px',
                fontSize: '12.5px',
                height: '34px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                boxSizing: 'border-box',
              }}
            />
            {searchKategori && (
              <button
                onClick={() => setSearchKategori('')}
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
        </div>
      </div>

      {/* KPI Stats Row */}
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
            Total Kategori
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#0F172A', marginTop: '6px' }}>
            {kategoriList.length} <span style={{ fontSize: '13px', fontWeight: '500', color: '#94A3B8' }}>kategori</span>
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
            Klasifikasi produk yang aktif
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
            Produk Terkategori
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#059669', marginTop: '6px' }}>
            {totalProdukTerkategori} <span style={{ fontSize: '13px', fontWeight: '500', color: '#94A3B8' }}>produk</span>
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
            Telah terhubung ke kategori produk
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
            Tanpa Kategori
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: totalProdukTanpaKategori > 0 ? '#D97706' : '#64748B', marginTop: '6px' }}>
            {totalProdukTanpaKategori} <span style={{ fontSize: '13px', fontWeight: '500', color: '#94A3B8' }}>produk</span>
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
            {totalProdukTanpaKategori > 0 ? 'Belum dimasukkan ke dalam kategori' : 'Semua produk telah berkategori'}
          </div>
        </div>
      </div>

      {/* Main Grid: Categories Management & Reference Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* Kategori Table Card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          {/* Card Header & Add Form */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                Kategori Produk
              </h3>
              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '3px', margin: 0 }}>
                Kategori digunakan untuk filter tombol cepat di kasir dan pengelompokan barang
              </p>
            </div>

            {/* Form Tambah Kategori */}
            <form onSubmit={addKategori} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Kode (cth: B)"
                value={newKode}
                onChange={(e) => setNewKode(e.target.value.toUpperCase())}
                maxLength={10}
                title="Kode prefix untuk kategori produk (misal: B untuk Baju Anak)"
                style={{
                  width: '120px',
                  height: '36px',
                  padding: '0 10px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  color: '#1E293B',
                  background: '#F8FAFC',
                  textTransform: 'uppercase',
                  boxSizing: 'border-box',
                }}
              />
              <input
                type="text"
                placeholder="Ketik nama kategori baru..."
                value={newKategori}
                onChange={(e) => setNewKategori(e.target.value)}
                style={{
                  flex: 1,
                  height: '36px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="submit"
                style={{
                  height: '36px',
                  padding: '0 16px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                + Tambah
              </button>
            </form>
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <tr>
                <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '36px' }}>
                  No
                </th>
                <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '85px' }}>
                  Kode
                </th>
                <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Nama Kategori
                </th>
                <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '110px' }}>
                  Jumlah Produk
                </th>
                <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '130px', textAlign: 'right' }}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px 16px', color: '#94A3B8', fontSize: '13px' }}>
                    Memuat daftar kategori...
                  </td>
                </tr>
              ) : filteredKategori.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '48px 16px', color: '#94A3B8' }}>
                    <p style={{ fontWeight: '600', fontSize: '13.5px', color: '#64748B', marginBottom: '4px' }}>
                      {searchKategori ? 'Kategori tidak ditemukan' : 'Belum ada kategori'}
                    </p>
                    <p style={{ fontSize: '12px', margin: 0 }}>
                      {searchKategori ? `Tidak ada hasil untuk "${searchKategori}"` : 'Tambahkan kategori baru di form atas untuk memulai.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredKategori.map((k, idx) => (
                  <tr
                    key={k.id}
                    style={{
                      borderBottom: idx === filteredKategori.length - 1 ? 'none' : '1px solid #F1F5F9',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>
                      {idx + 1}
                    </td>

                    {/* Kode Kategori */}
                    <td style={{ padding: '8px 14px' }}>
                      {editingId === k.id ? (
                        <input
                          type="text"
                          placeholder="Kode"
                          value={editingKode}
                          onChange={(e) => setEditingKode(e.target.value.toUpperCase())}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(k.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          maxLength={10}
                          style={{
                            width: '70px',
                            height: '32px',
                            padding: '0 8px',
                            fontSize: '12.5px',
                            fontWeight: '700',
                            borderRadius: '6px',
                            border: '1.5px solid #2563EB',
                            background: '#FFFFFF',
                            outline: 'none',
                            textTransform: 'uppercase',
                            boxSizing: 'border-box',
                          }}
                        />
                      ) : k.kode ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            background: '#EFF6FF',
                            color: '#1D4ED8',
                            border: '1px solid #DBEAFE',
                            letterSpacing: '0.04em',
                            fontFamily: 'monospace',
                          }}
                        >
                          {k.kode}
                        </span>
                      ) : (
                        <span style={{ color: '#CBD5E1', fontSize: '12px', fontStyle: 'italic' }}>
                          -
                        </span>
                      )}
                    </td>

                    {/* Nama Kategori / Edit Form */}
                    <td style={{ padding: '8px 14px' }}>
                      {editingId === k.id ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(k.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          autoFocus
                          style={{
                            width: '100%',
                            height: '32px',
                            padding: '0 10px',
                            fontSize: '13px',
                            borderRadius: '6px',
                            border: '1.5px solid #2563EB',
                            background: '#FFFFFF',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      ) : (
                        <div style={{ fontWeight: '600', color: '#0F172A', fontSize: '13.5px' }}>
                          {k.nama_kategori}
                        </div>
                      )}
                    </td>

                    {/* Jumlah Produk */}
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: '600',
                          background: (k.total_produk || 0) > 0 ? '#F1F5F9' : '#FFFBEB',
                          color: (k.total_produk || 0) > 0 ? '#334155' : '#D97706',
                          border: (k.total_produk || 0) > 0 ? '1px solid #E2E8F0' : '1px solid #FDE68A',
                        }}
                      >
                        {k.total_produk || 0} produk
                      </span>
                    </td>

                    {/* Aksi */}
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      {editingId === k.id ? (
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            disabled={savingEdit}
                            onClick={() => saveEdit(k.id)}
                            style={{
                              padding: '5px 10px',
                              background: '#2563EB',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            style={{
                              padding: '5px 8px',
                              background: '#F1F5F9',
                              color: '#64748B',
                              border: '1px solid #CBD5E1',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              cursor: 'pointer',
                            }}
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => startEdit(k)}
                            style={{
                              padding: '4px 8px',
                              background: '#FFFFFF',
                              color: '#334155',
                              border: '1px solid #CBD5E1',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            Ubah
                          </button>
                          <button
                            onClick={() => deleteKategori(k.id, k.nama_kategori, k.total_produk || 0)}
                            style={{
                              padding: '4px 8px',
                              background: '#FEF2F2',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Reference Column: Satuan Standar & Petunjuk */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Satuan Produk */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              padding: '18px 20px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <h3 style={{ fontSize: '14.5px', fontWeight: '700', color: '#0F172A', margin: 0, marginBottom: '4px' }}>
              Referensi Satuan Inventaris
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0, marginBottom: '14px' }}>
              Satuan standar yang digunakan dalam pengelolaan stok & penjualan
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {satuanSummary.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Belum ada data barang.</div>
              ) : (
                satuanSummary.map((item) => (
                  <div
                    key={item.satuan}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#F8FAFC',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', textTransform: 'uppercase' }}>
                        {item.satuan}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                      {item.count} produk
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tips / Info Box */}
          <div
            style={{
              background: '#F8FAFC',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              padding: '16px 18px',
            }}
          >
            <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A', marginBottom: '6px' }}>
              Tips Penggunaan Kategori
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#64748B', lineHeight: '1.6' }}>
              <li>Kode prefix (misal: <strong>B</strong> untuk Baju Anak) dapat dipilih di menu <strong>Kelola Barang</strong> untuk penomoran SKU/barcode barang secara otomatis.</li>
              <li>Kategori yang dibuat di sini akan otomatis muncul sebagai filter tab di menu <strong>Transaksi Kasir</strong>.</li>
              <li>Menghapus kategori tidak akan menghapus produk, produk tersebut hanya akan dialihkan menjadi tanpa kategori.</li>
              <li>Kode dan nama kategori dapat diubah sewaktu-waktu dengan menekan tombol <strong>Ubah</strong>.</li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Master;
