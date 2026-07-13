import React, { useState, useEffect } from 'react';

const Pengaturan = () => {
  const [form, setForm] = useState({
    nama_toko: '', alamat: '', telepon: '', catatan_struk: ''
  });
  const [kategoriList, setKategoriList] = useState([]);
  const [newKategori, setNewKategori] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:3001/api/pengaturan').then(r => r.json()),
      fetch('http://localhost:3001/api/kategori').then(r => r.json()),
    ]).then(([p, k]) => {
      if (p.data) setForm({ nama_toko: p.data.nama_toko || '', alamat: p.data.alamat || '', telepon: p.data.telepon || '', catatan_struk: p.data.catatan_struk || '' });
      if (k.data) setKategoriList(k.data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const savePengaturan = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/pengaturan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) { console.error(err); }
  };

  const addKategori = async (e) => {
    e.preventDefault();
    if (!newKategori.trim()) return;
    try {
      const res = await fetch('http://localhost:3001/api/kategori', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama_kategori: newKategori.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setKategoriList([...kategoriList, { id: data.id, nama_kategori: data.nama_kategori }].sort((a,b) => a.nama_kategori.localeCompare(b.nama_kategori)));
        setNewKategori('');
      } else { alert(data.error); }
    } catch (err) { console.error(err); }
  };

  const deleteKategori = async (id, nama) => {
    if (!window.confirm(`Hapus kategori "${nama}"? Produk yang menggunakan kategori ini akan menjadi tanpa kategori.`)) return;
    try {
      const res = await fetch(`http://localhost:3001/api/kategori/${id}`, { method: 'DELETE' });
      if (res.ok) setKategoriList(kategoriList.filter(k => k.id !== id));
    } catch (err) { console.error(err); }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat pengaturan...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--secondary-color)' }}>Pengaturan</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>Konfigurasi informasi toko dan data master</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>

        {/* ===== KIRI: Pengaturan Toko ===== */}
        <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--secondary-color)' }}>⚙️ Informasi Toko</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Tampil di header struk yang dicetak</p>
            </div>
            {saved && (
              <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: '12px', fontWeight: '700', padding: '5px 14px', borderRadius: '20px' }}>
                ✓ Tersimpan!
              </span>
            )}
          </div>

          <form onSubmit={savePengaturan} style={{ padding: '24px' }}>
            {/* Preview Struk */}
            <div style={{ background: '#F8FAFC', border: '1px dashed var(--border-color)', borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'center', fontFamily: "'Courier New', monospace" }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Preview Struk</div>
              <div style={{ fontWeight: '800', fontSize: '15px', letterSpacing: '1px' }}>{form.nama_toko || 'NAMA TOKO'}</div>
              {form.alamat && <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{form.alamat}</div>}
              {form.telepon && <div style={{ fontSize: '11px', color: '#64748B' }}>Telp: {form.telepon}</div>}
              <div style={{ borderTop: '1px dashed #CBD5E1', marginTop: '8px', paddingTop: '8px', fontSize: '11px', color: '#94A3B8' }}>{form.catatan_struk}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Nama Toko *</label>
                <input value={form.nama_toko} onChange={e => setForm({...form, nama_toko: e.target.value})} placeholder="POS ERTIGA" required style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Alamat</label>
                <input value={form.alamat} onChange={e => setForm({...form, alamat: e.target.value})} placeholder="Jl. Contoh No. 1, Kota" style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>No. Telepon</label>
                <input value={form.telepon} onChange={e => setForm({...form, telepon: e.target.value})} placeholder="08xxxxxxxxxx" style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Catatan Struk</label>
                <textarea
                  value={form.catatan_struk}
                  onChange={e => setForm({...form, catatan_struk: e.target.value})}
                  placeholder="Terima kasih sudah berbelanja!"
                  rows={2}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px', resize: 'vertical' }}
                />
              </div>
              <button type="submit" style={{ padding: '12px', background: 'linear-gradient(135deg, var(--primary-color), #6366F1)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
                💾 Simpan Pengaturan
              </button>
            </div>
          </form>
        </div>

        {/* ===== KANAN: Kategori Produk ===== */}
        <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--secondary-color)' }}>🏷️ Kategori Produk</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Digunakan untuk filter di menu Kasir</p>
          </div>

          <div style={{ padding: '20px 24px' }}>
            {/* Form tambah */}
            <form onSubmit={addKategori} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input
                value={newKategori}
                onChange={e => setNewKategori(e.target.value)}
                placeholder="Nama kategori baru..."
                style={{ flex: 1, fontSize: '13px' }}
              />
              <button type="submit" style={{ padding: '10px 16px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}>
                + Tambah
              </button>
            </form>

            {/* Daftar Kategori */}
            {kategoriList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏷️</div>
                <p style={{ fontSize: '13px' }}>Belum ada kategori.<br />Tambahkan untuk mulai mengorganisir produk.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {kategoriList.map(k => (
                  <div key={k.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', background: '#EEF2FF', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🏷️</div>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-dark)' }}>{k.nama_kategori}</span>
                    </div>
                    <button
                      onClick={() => deleteKategori(k.id, k.nama_kategori)}
                      style={{ padding: '4px 10px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                    >Hapus</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pengaturan;
