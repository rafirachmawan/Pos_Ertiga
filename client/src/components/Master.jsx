import React, { useState, useEffect } from 'react';

const Master = () => {
  const [kategoriList, setKategoriList] = useState([]);
  const [newKategori, setNewKategori] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/kategori')
      .then(r => r.json())
      .then(k => {
        if (k.data) setKategoriList(k.data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

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

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat data master...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--secondary-color)' }}>Data Master</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>Kelola data referensi aplikasi</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px', alignItems: 'start' }}>
        
        {/* Kategori Produk */}
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

export default Master;
