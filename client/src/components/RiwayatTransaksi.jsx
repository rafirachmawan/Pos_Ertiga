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
  const [printStruk, setPrintStruk] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handlePrintNota = (t) => {
    setPrintStruk({ ...t, items: detail });
  };

  const doPrint = () => { window.print(); };

  const filtered = transaksi.filter(t =>
    t.nomor_nota.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.nama_pelanggan || 'Umum').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* CSS khusus untuk print — hanya tampilkan struk */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #print-struk-area { display: block !important; position: fixed; top: 0; left: 0; width: 100%; }
        }
        #print-struk-area { display: none; }
      `}</style>

      {/* Area Cetak Tersembunyi */}
      {printStruk && (
        <div id="print-struk-area" style={{ fontFamily: "'Courier New', monospace", padding: '20px', maxWidth: '320px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '12px', marginBottom: '12px' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '2px' }}>POS ERTIGA</div>
            <div style={{ fontSize: '11px' }}>Point of Sale</div>
            <div style={{ fontSize: '11px', marginTop: '6px' }}>{formatDate(printStruk.tanggal_transaksi)}</div>
            <div style={{ fontSize: '12px', fontWeight: '700' }}>{printStruk.nomor_nota}</div>
          </div>
          <div style={{ fontSize: '12px', marginBottom: '10px' }}>
            Pelanggan: <strong>{printStruk.nama_pelanggan || 'Umum'}</strong>
          </div>
          <div style={{ fontSize: '12px', borderBottom: '1px dashed #000', paddingBottom: '10px', marginBottom: '10px' }}>
            {printStruk.items.map((item, i) => (
              <div key={i} style={{ marginBottom: '6px' }}>
                <div>{item.nama_barang}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.qty} x Rp {item.harga_jual_saat_ini.toLocaleString('id-ID')}</span>
                  <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total</span><strong>Rp {printStruk.total_harga.toLocaleString('id-ID')}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Bayar</span><span>Rp {printStruk.total_bayar.toLocaleString('id-ID')}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Kembali</span><span>Rp {printStruk.total_kembalian.toLocaleString('id-ID')}</span></div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '16px', borderTop: '1px dashed #000', paddingTop: '12px', fontSize: '11px' }}>
            Terima kasih sudah berbelanja!
          </div>
        </div>
      )}

      <div className="header-row" style={{ marginBottom: '30px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Riwayat Transaksi</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '15px' }}>
            {filtered.length} dari {transaksi.length} transaksi
          </p>
        </div>
        {/* Search Bar */}
        <div style={{ position: 'relative', width: '280px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '16px', pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            placeholder="Cari nota atau nama pelanggan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '42px', paddingRight: searchQuery ? '36px' : '14px', fontSize: '13px' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '16px', padding: '2px', lineHeight: 1 }}
            >✕</button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 40px',
          background: 'var(--surface-color)', borderRadius: '16px',
          border: '1px solid var(--border-color)', color: 'var(--text-muted)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>{searchQuery ? '🔍' : '🧾'}</div>
          <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{searchQuery ? 'Tidak ditemukan' : 'Belum ada transaksi'}</p>
          <p style={{ fontSize: '14px' }}>{searchQuery ? `Tidak ada transaksi untuk "${searchQuery}"` : 'Selesaikan penjualan di menu Transaksi Kasir untuk mulai mencatat.'}</p>
          {searchQuery && <button onClick={() => setSearchQuery('')} style={{ marginTop: '14px', padding: '8px 20px', background: '#EEF2FF', color: 'var(--primary-color)', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Reset Pencarian</button>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(t => (
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
                  <div style={{ fontSize: '12px', color: 'var(--primary-color)', marginTop: '3px', fontWeight: '600' }}>
                    👤 {t.nama_pelanggan || 'Umum'}
                  </div>
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

                      {/* Footer Detail */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed var(--border-color)' }}>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          Pelanggan: <strong style={{ color: 'var(--text-dark)' }}>{t.nama_pelanggan || 'Umum'}</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                          <div style={{ display: 'flex', gap: '30px' }}>
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

                          {/* Tombol Print */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePrintNota(t); }}
                            style={{
                              padding: '10px 20px',
                              background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
                              color: 'white', border: 'none', borderRadius: '10px',
                              fontWeight: '700', cursor: 'pointer', fontSize: '13px',
                              display: 'flex', alignItems: 'center', gap: '6px',
                              boxShadow: '0 4px 12px rgba(79,70,229,0.3)'
                            }}
                          >
                            🖨️ Print Nota
                          </button>
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

      {/* ===== MODAL PREVIEW STRUK ===== */}
      {printStruk && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px',
            width: '360px', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            fontFamily: "'Courier New', monospace"
          }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #1E293B, #312E81)', color: 'white', borderRadius: '20px 20px 0 0', padding: '24px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🛍️</div>
              <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '2px' }}>POS ERTIGA</div>
              <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px' }}>Point of Sale</div>
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed rgba(255,255,255,0.2)', fontSize: '11px', opacity: 0.7 }}>{formatDate(printStruk.tanggal_transaksi)}</div>
              <div style={{ fontSize: '13px', fontWeight: '700', marginTop: '4px', color: '#A5B4FC' }}>{printStruk.nomor_nota}</div>
            </div>

            {/* Body */}
            <div style={{ padding: '20px' }}>
              {/* Pelanggan */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px dashed #E2E8F0' }}>
                <span style={{ color: '#64748B' }}>Pelanggan</span>
                <span style={{ fontWeight: '700', color: '#1E293B' }}>{printStruk.nama_pelanggan || 'Umum'}</span>
              </div>

              {/* Items */}
              <div style={{ fontSize: '12px', marginBottom: '16px' }}>
                <div style={{ fontWeight: '700', color: '#64748B', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px', marginBottom: '10px' }}>Rincian Pesanan</div>
                {printStruk.items.map((item, i) => (
                  <div key={i} style={{ marginBottom: '10px' }}>
                    <div style={{ fontWeight: '600', color: '#1E293B', fontSize: '13px' }}>{item.nama_barang}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px', color: '#64748B' }}>
                      <span>{item.qty} × Rp {item.harga_jual_saat_ini.toLocaleString('id-ID')}</span>
                      <span style={{ fontWeight: '600', color: '#1E293B' }}>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '14px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '16px', color: '#1E293B', paddingBottom: '10px', borderBottom: '2px solid #1E293B', marginBottom: '12px' }}>
                  <span>TOTAL</span>
                  <span>Rp {printStruk.total_harga.toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#64748B' }}>
                  <span>Bayar</span>
                  <span>Rp {printStruk.total_bayar.toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#059669', fontSize: '14px' }}>
                  <span>Kembali</span>
                  <span>Rp {printStruk.total_kembalian.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed #E2E8F0', color: '#94A3B8', fontSize: '11px', lineHeight: 1.8 }}>
                ✨ Terima kasih sudah berbelanja! ✨<br />Semoga puas dengan produk kami.
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  onClick={() => setPrintStruk(null)}
                  style={{ flex: 1, padding: '12px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}
                >
                  Tutup
                </button>
                <button
                  onClick={doPrint}
                  style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #4F46E5, #6366F1)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}
                >
                  🖨️ Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiwayatTransaksi;
