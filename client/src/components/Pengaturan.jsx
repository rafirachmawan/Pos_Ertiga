import React, { useState, useEffect } from 'react';

const Pengaturan = () => {
  const [form, setForm] = useState({
    nama_toko: '', alamat_toko: '', pesan_struk: ''
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/pengaturan')
      .then(r => r.json())
      .then(p => {
        if (p.data) setForm({ nama_toko: p.data.nama_toko || '', alamat_toko: p.data.alamat_toko || '', pesan_struk: p.data.pesan_struk || '' });
        setLoading(false);
      })
      .catch(console.error);
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



  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat pengaturan...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--secondary-color)' }}>Pengaturan</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>Konfigurasi informasi toko dan data master</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>

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
              {form.alamat_toko && <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', whiteSpace: 'pre-wrap' }}>{form.alamat_toko}</div>}
              <div style={{ borderTop: '1px dashed #CBD5E1', marginTop: '8px', paddingTop: '8px', fontSize: '11px', color: '#94A3B8', whiteSpace: 'pre-wrap' }}>{form.pesan_struk}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Nama Toko *</label>
                <input value={form.nama_toko} onChange={e => setForm({...form, nama_toko: e.target.value})} placeholder="POS ERTIGA" required style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Alamat & Telepon Toko</label>
                <textarea value={form.alamat_toko} onChange={e => setForm({...form, alamat_toko: e.target.value})} placeholder="Jl. Contoh No. 1&#10;Telp: 08xxxx" rows={2} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Pesan Bawah Struk</label>
                <textarea
                  value={form.pesan_struk}
                  onChange={e => setForm({...form, pesan_struk: e.target.value})}
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


      </div>

      {/* ===== BAWAH: Database ===== */}
      <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden', padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--secondary-color)' }}>💾 Backup Database</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Unduh seluruh data penjualan, barang, dan pengaturan ke perangkat Anda.</p>
          </div>
          <button onClick={() => window.open('http://localhost:3001/api/backup', '_blank')} style={{ padding: '10px 20px', background: '#EEF2FF', color: 'var(--primary-color)', border: '1px solid #C7D2FE', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⬇️ Download Backup
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pengaturan;
