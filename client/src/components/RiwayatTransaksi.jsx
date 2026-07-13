import React, { useState, useEffect } from 'react';

const formatRupiah = (number) => {
  if (!number && number !== 0) return 'Rp 0';
  return 'Rp ' + Number(number).toLocaleString('id-ID');
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

const RiwayatTransaksi = () => {
  const [transaksi, setTransaksi] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3001/api/transaksi')
      .then(res => res.json())
      .then(data => { if(data.data) setTransaksi(data.data); })
      .catch(console.error);
  }, []);

  const loadDetail = (id) => {
    if (selectedId === id) { setSelectedId(null); setDetail([]); return; }
    setSelectedId(id);
    setLoadingDetail(true);
    fetch(`http://localhost:3001/api/transaksi/${id}`)
      .then(res => res.json())
      .then(data => { setDetail(data.data || []); setLoadingDetail(false); })
      .catch(console.error);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="header-row" style={{ marginBottom: '30px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Riwayat Transaksi</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '15px' }}>
            {transaksi.length} transaksi ditemukan
          </p>
        </div>
      </div>

      {transaksi.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 40px',
          background: 'var(--surface-color)', borderRadius: '16px',
          border: '1px solid var(--border-color)', color: 'var(--text-muted)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧾</div>
          <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Belum ada transaksi</p>
          <p style={{ fontSize: '14px' }}>Selesaikan penjualan di menu Transaksi Kasir untuk mulai mencatat.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {transaksi.map(t => (
            <div key={t.id} style={{
              background: 'var(--surface-color)', borderRadius: '16px',
              border: `1px solid ${selectedId === t.id ? 'var(--primary-color)' : 'var(--border-color)'}`,
              overflow: 'hidden', transition: 'all 0.2s',
              boxShadow: selectedId === t.id ? '0 0 0 3px rgba(79,70,229,0.1)' : 'var(--shadow-sm)'
            }}>
              {/* Header Row */}
              <div
                style={{ display: 'flex', alignItems: 'center', padding: '18px 24px', cursor: 'pointer', gap: '16px' }}
                onClick={() => loadDetail(t.id)}
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'rgba(79,70,229,0.1)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0
                }}>🧾</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-dark)', marginBottom: '4px' }}>{t.nomor_nota}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{formatDate(t.tanggal_transaksi)}</div>
                </div>
                <div style={{ textAlign: 'right', marginRight: '16px' }}>
                  <div style={{ fontWeight: '700', fontSize: '18px', color: 'var(--primary-color)' }}>{formatRupiah(t.total_harga)}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Kembalian: {formatRupiah(t.total_kembalian)}</div>
                </div>
                <span style={{
                  fontSize: '18px', color: 'var(--text-muted)',
                  transform: selectedId === t.id ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.2s', display: 'inline-block'
                }}>▾</span>
              </div>

              {/* Detail Panel */}
              {selectedId === t.id && (
                <div style={{ borderTop: '1px solid var(--border-color)', padding: '20px 24px', background: '#F8FAFC' }}>
                  {loadingDetail ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Memuat detail...</p>
                  ) : (
                    <>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Barang</th>
                            <th style={{ textAlign: 'center', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qty</th>
                            <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Harga</th>
                            <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.map((d, i) => (
                            <tr key={i} style={{ borderTop: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '10px 12px', fontWeight: '500', color: 'var(--text-dark)' }}>{d.nama_barang}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>{d.qty}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>{formatRupiah(d.harga_jual_saat_ini)}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', color: 'var(--text-dark)' }}>{formatRupiah(d.subtotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '30px', marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed var(--border-color)' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Dibayar</div>
                          <div style={{ fontWeight: '700', fontSize: '16px' }}>{formatRupiah(t.total_bayar)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total</div>
                          <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--primary-color)' }}>{formatRupiah(t.total_harga)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Kembalian</div>
                          <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--success-color)' }}>{formatRupiah(t.total_kembalian)}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RiwayatTransaksi;
