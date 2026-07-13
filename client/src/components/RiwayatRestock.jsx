import React, { useState, useEffect } from 'react';

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

const RiwayatRestock = () => {
  const [stokMasuk, setStokMasuk] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('http://localhost:3001/api/stok-masuk')
      .then(res => res.json())
      .then(data => { if(data.data) setStokMasuk(data.data); })
      .catch(console.error);
  }, []);

  const filtered = stokMasuk.filter(sm =>
    (sm.nama_barang || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (sm.barcode || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="header-row" style={{ marginBottom: '30px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Riwayat Restock</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '15px' }}>
            Histori penambahan stok barang
          </p>
        </div>
        
        {/* Search Bar */}
        <div style={{ position: 'relative', width: '280px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '16px', pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            placeholder="Cari nama barang atau barcode..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '42px', paddingRight: searchQuery ? '36px' : '14px', fontSize: '13px', height: '36px' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '16px', padding: '2px', lineHeight: 1 }}
            >✕</button>
          )}
        </div>
      </div>

      <div style={{ background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border-color)' }}>
            <tr>
              <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tanggal</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Barang</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Jumlah</th>
              <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>📦</div>
                  <p style={{ fontWeight: '600', fontSize: '15px' }}>{searchQuery ? 'Tidak ada data' : 'Belum ada riwayat restock'}</p>
                </td>
              </tr>
            ) : (
              filtered.map((sm, i) => (
                <tr key={sm.id} style={{ borderBottom: i === filtered.length - 1 ? 'none' : '1px solid var(--border-color)', background: i % 2 === 0 ? 'white' : '#F8FAFC' }}>
                  <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)' }}>{formatDate(sm.tanggal)}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-dark)', fontSize: '14px' }}>{sm.nama_barang}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{sm.barcode}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ background: '#ECFDF5', color: '#059669', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
                      +{sm.jumlah}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)' }}>{sm.keterangan || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RiwayatRestock;
