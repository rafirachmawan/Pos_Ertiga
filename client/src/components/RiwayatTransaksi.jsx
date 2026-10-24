import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { formatDateTime, localDateKey, parseDbDate } from '../lib/date';
import { formatRupiah } from '../lib/format';
import { printCurrentReceipt } from '../lib/print';
import { showConfirm, showToast } from '../lib/dialog';
import { Receipt, ReceiptPrintPortal } from './Receipt';

const RiwayatTransaksi = () => {
  const [transaksi, setTransaksi] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [printStruk, setPrintStruk] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pengaturan, setPengaturan] = useState({});

  const fetchTransaksi = async () => {
    try {
      const data = await api('/api/transaksi');
      if (data.data) setTransaksi(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTransaksi();
    api('/api/pengaturan')
      .then((data) => {
        if (data.data) setPengaturan(data.data);
      })
      .catch(console.error);
  }, []);

  const handleVoid = async (id, nota) => {
    const ok = await showConfirm({
      title: 'Batalkan Transaksi',
      message: `Yakin ingin membatalkan transaksi ${nota}?`,
      submessage: 'Stok barang akan otomatis dikembalikan dan tindakan ini tidak dapat diurungkan.',
      confirmText: 'Ya, Batalkan Transaksi',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await api(`/api/transaksi/${id}/void`, { method: 'PUT' });
      showToast('Transaksi berhasil dibatalkan', 'success');
      fetchTransaksi();
    } catch (err) {
      alert(err.message);
    }
  };

  const loadDetail = async (id) => {
    if (selectedId === id) {
      setSelectedId(null);
      setDetail([]);
      return;
    }

    setSelectedId(id);
    setLoadingDetail(true);
    try {
      const data = await api(`/api/transaksi/${id}`);
      setDetail(data.data || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handlePrintNota = async (t) => {
    try {
      const data = await api(`/api/transaksi/${t.id}`);
      setPrintStruk({ ...(data.header || t), items: data.data || [] });
    } catch (err) {
      alert(err.message);
    }
  };

  const doPrint = () =>
    printCurrentReceipt({
      lebar: Number(pengaturan.lebar_struk) || 80,
      deviceName: pengaturan.printer_name,
    });

  const filtered = transaksi.filter((t) => {
    const matchSearch =
      t.nomor_nota.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.nama_pelanggan || 'Umum')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const dateKey = localDateKey(parseDbDate(t.tanggal_transaksi));
    let matchDate = true;
    if (startDate) matchDate = matchDate && dateKey >= startDate;
    if (endDate) matchDate = matchDate && dateKey <= endDate;

    return matchSearch && matchDate;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
            Riwayat Transaksi
          </h2>
          <p style={{ color: '#64748B', marginTop: '4px', fontSize: '13px' }}>
            {filtered.length} dari {transaksi.length} transaksi
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Date filter */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#FFFFFF',
            padding: '5px 12px',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
          }}>
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>Mulai:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '3px', fontSize: '12.5px', border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent' }}
            />
            <div style={{ width: '1px', height: '18px', background: '#E2E8F0' }}></div>
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>Sampai:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '3px', fontSize: '12.5px', border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent' }}
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                style={{
                  background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer',
                  fontSize: '11px', fontWeight: '700', padding: '2px 4px', boxShadow: 'none'
                }}
              >Reset</button>
            )}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', width: '250px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Cari nota atau nama pelanggan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', paddingLeft: '34px', paddingRight: searchQuery ? '30px' : '12px',
                fontSize: '12.5px', height: '34px', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: 'none', boxSizing: 'border-box'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8',
                  fontSize: '13px', padding: '2px', lineHeight: 1, boxShadow: 'none'
                }}
              >✕</button>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 40px',
          background: '#FFFFFF', borderRadius: '10px',
          border: '1px solid #E2E8F0', color: '#94A3B8'
        }}>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#64748B', marginBottom: '4px' }}>
            {searchQuery ? 'Tidak ditemukan' : 'Belum ada transaksi'}
          </p>
          <p style={{ fontSize: '13px' }}>
            {searchQuery
              ? `Tidak ada transaksi untuk "${searchQuery}"`
              : 'Selesaikan penjualan di menu Transaksi Kasir untuk mulai mencatat.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map((t) => (
            <div
              key={t.id}
              style={{
                background: '#FFFFFF',
                borderRadius: '10px',
                border: `1px solid ${selectedId === t.id ? '#2563EB' : '#E2E8F0'}`,
                overflow: 'hidden',
                transition: 'border-color 0.15s ease',
                boxShadow: selectedId === t.id ? '0 0 0 3px rgba(37,99,235,0.08)' : '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              {/* Row header - clickable */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 20px',
                  cursor: 'pointer',
                  gap: '14px',
                }}
                onClick={() => loadDetail(t.id)}
              >
                {/* Nota number column */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{
                      fontWeight: '700', fontSize: '13.5px',
                      color: t.status === 'void' ? '#94A3B8' : '#0F172A',
                      textDecoration: t.status === 'void' ? 'line-through' : 'none',
                      fontFamily: 'monospace'
                    }}>
                      {t.nomor_nota}
                    </span>
                    {t.status === 'void' && (
                      <span style={{
                        background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA',
                        fontSize: '9.5px', fontWeight: '700', padding: '1px 6px',
                        borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.04em'
                      }}>Void</span>
                    )}
                    {t.metode_pembayaran && t.metode_pembayaran !== 'Tunai' && (
                      <span style={{
                        background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD',
                        fontSize: '9.5px', fontWeight: '600', padding: '1px 6px',
                        borderRadius: '4px'
                      }}>{t.metode_pembayaran}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                    {formatDateTime(t.tanggal_transaksi)}
                    <span style={{ margin: '0 6px', color: '#E2E8F0' }}>·</span>
                    <span style={{ color: '#64748B', fontWeight: '600' }}>{t.nama_pelanggan || 'Umum'}</span>
                  </div>
                </div>

                {/* Total */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontWeight: '700', fontSize: '14px',
                    color: t.status === 'void' ? '#94A3B8' : '#0F172A'
                  }}>
                    {formatRupiah(t.total_harga)}
                  </div>
                  {t.total_kembalian > 0 && (
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>
                      Kembali: {formatRupiah(t.total_kembalian)}
                    </div>
                  )}
                </div>

                {/* Chevron */}
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{
                    transform: selectedId === t.id ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0
                  }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>

              {/* Detail panel (expanded) */}
              {selectedId === t.id && (
                <div style={{ borderTop: '1px solid #E2E8F0', padding: '16px 20px', background: '#FAFBFC' }}>
                  {loadingDetail ? (
                    <p style={{ textAlign: 'center', color: '#94A3B8', padding: '16px', fontSize: '13px' }}>
                      Memuat detail...
                    </p>
                  ) : (
                    <>
                      {/* Detail table */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr>
                            {['Barang', 'Qty', 'Harga', 'Subtotal'].map((label) => (
                              <th
                                key={label}
                                style={{
                                  textAlign: label === 'Barang' ? 'left' : 'right',
                                  padding: '6px 10px',
                                  color: '#94A3B8',
                                  fontWeight: '700',
                                  fontSize: '10px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                  borderBottom: '1px solid #E2E8F0'
                                }}
                              >{label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {detail.map((d) => (
                            <tr key={d.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '8px 10px', fontWeight: '600', color: '#1E293B' }}>
                                {d.nama_barang}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748B' }}>
                                {d.qty}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748B' }}>
                                {formatRupiah(d.harga_jual_saat_ini)}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>
                                {formatRupiah(d.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Footer: info + actions */}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                        marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed #E2E8F0',
                        gap: '16px', flexWrap: 'wrap'
                      }}>
                        {/* Left: meta info */}
                        <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.7 }}>
                          <div>
                            Pelanggan: <strong style={{ color: '#0F172A' }}>{t.nama_pelanggan || 'Umum'}</strong>
                          </div>
                          <div>
                            Metode: <strong style={{ color: '#0F172A' }}>{t.metode_pembayaran || 'Tunai'}</strong>
                          </div>
                          {Number(t.diskon) > 0 && (
                            <div>
                              Diskon: <strong style={{ color: '#DC2626' }}>- {formatRupiah(t.diskon)}</strong>
                            </div>
                          )}
                        </div>

                        {/* Right: totals + actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', gap: '20px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Dibayar</div>
                              <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>{formatRupiah(t.total_bayar)}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Total</div>
                              <div style={{ fontWeight: '700', fontSize: '14px', color: '#2563EB' }}>{formatRupiah(t.total_harga)}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Kembali</div>
                              <div style={{ fontWeight: '700', fontSize: '14px', color: '#059669' }}>{formatRupiah(t.total_kembalian)}</div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePrintNota(t); }}
                              style={{
                                padding: '7px 14px', background: '#0F172A', color: '#FFFFFF',
                                border: 'none', borderRadius: '6px', fontWeight: '600',
                                cursor: 'pointer', fontSize: '12px', boxShadow: 'none'
                              }}
                            >Print Struk</button>
                            {t.status !== 'void' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleVoid(t.id, t.nomor_nota); }}
                                style={{
                                  padding: '7px 14px', background: '#FFFFFF', color: '#DC2626',
                                  border: '1px solid #FECACA', borderRadius: '6px', fontWeight: '600',
                                  cursor: 'pointer', fontSize: '12px', boxShadow: 'none'
                                }}
                              >Void</button>
                            )}
                          </div>
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

      {/* Modal Print Preview */}
      {printStruk && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(4px)', padding: '16px',
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: '12px',
            width: '380px', maxWidth: '100%', maxHeight: '90vh',
            overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', padding: '16px',
          }}>
            <Receipt data={printStruk} pengaturan={pengaturan} preview />
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <button
                onClick={() => setPrintStruk(null)}
                style={{
                  flex: 1, padding: '10px', background: '#F1F5F9', color: '#475569',
                  border: 'none', borderRadius: '8px', fontWeight: '600',
                  cursor: 'pointer', fontSize: '13px', boxShadow: 'none'
                }}
              >Tutup</button>
              <button
                onClick={doPrint}
                style={{
                  flex: 1, padding: '10px', background: '#0F172A', color: '#FFFFFF',
                  border: 'none', borderRadius: '8px', fontWeight: '600',
                  cursor: 'pointer', fontSize: '13px', boxShadow: 'none'
                }}
              >Print Struk</button>
            </div>
          </div>
        </div>
      )}

      <ReceiptPrintPortal
        data={printStruk}
        pengaturan={pengaturan}
        lebar={Number(pengaturan.lebar_struk) || 80}
      />
    </div>
  );
};

export default RiwayatTransaksi;
