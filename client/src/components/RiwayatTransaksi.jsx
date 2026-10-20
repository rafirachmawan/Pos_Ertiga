import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { formatDateTime, localDateKey, parseDbDate } from '../lib/date';
import { formatRupiah } from '../lib/format';
import { printCurrentReceipt } from '../lib/print';
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
    if (
      !window.confirm(
        `Yakin ingin membatalkan transaksi ${nota}?\nStok barang akan dikembalikan dan ini tidak bisa diurungkan.`
      )
    ) {
      return;
    }

    try {
      await api(`/api/transaksi/${id}/void`, { method: 'PUT' });
      alert('Transaksi berhasil dibatalkan');
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
    printCurrentReceipt({ lebar: Number(pengaturan.lebar_struk) || 80 });

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
      <div className="header-row" style={{ marginBottom: '30px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>
            Riwayat Transaksi
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              marginTop: '6px',
              fontSize: '15px',
            }}
          >
            {filtered.length} dari {transaksi.length} transaksi
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--surface-color)',
              padding: '6px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
            }}
          >
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Mulai:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '4px', fontSize: '13px', border: 'none', outline: 'none' }}
            />
            <span style={{ fontSize: '13px', color: 'var(--border-color)' }}>|</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Sampai:
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '4px', fontSize: '13px', border: 'none', outline: 'none' }}
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#EF4444',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '700',
                }}
              >
                Reset
              </button>
            )}
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <span
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
                fontSize: '16px',
                pointerEvents: 'none',
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Cari nota atau nama pelanggan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '42px',
                paddingRight: searchQuery ? '36px' : '14px',
                fontSize: '13px',
                height: '36px',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  fontSize: '16px',
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

      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 40px',
            background: 'var(--surface-color)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            {searchQuery ? '🔍' : '🧾'}
          </div>
          <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            {searchQuery ? 'Tidak ditemukan' : 'Belum ada transaksi'}
          </p>
          <p style={{ fontSize: '14px' }}>
            {searchQuery
              ? `Tidak ada transaksi untuk "${searchQuery}"`
              : 'Selesaikan penjualan di menu Transaksi Kasir untuk mulai mencatat.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((t) => (
            <div
              key={t.id}
              style={{
                background: 'var(--surface-color)',
                borderRadius: '16px',
                border: `1px solid ${
                  selectedId === t.id
                    ? 'var(--primary-color)'
                    : 'var(--border-color)'
                }`,
                overflow: 'hidden',
                transition: 'all 0.2s',
                boxShadow:
                  selectedId === t.id
                    ? '0 0 0 3px rgba(79,70,229,0.1)'
                    : 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '18px 24px',
                  cursor: 'pointer',
                  gap: '16px',
                }}
                onClick={() => loadDetail(t.id)}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(79,70,229,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0,
                  }}
                >
                  🧾
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '4px',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: '700',
                        fontSize: '16px',
                        color:
                          t.status === 'void'
                            ? 'var(--text-muted)'
                            : 'var(--text-dark)',
                        textDecoration:
                          t.status === 'void' ? 'line-through' : 'none',
                      }}
                    >
                      {t.nomor_nota}
                    </div>
                    {t.status === 'void' && (
                      <span
                        style={{
                          background: '#FEE2E2',
                          color: '#DC2626',
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        VOID
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {formatDateTime(t.tanggal_transaksi)}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--primary-color)',
                      marginTop: '3px',
                      fontWeight: '600',
                    }}
                  >
                    👤 {t.nama_pelanggan || 'Umum'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginRight: '16px' }}>
                  <div
                    style={{
                      fontWeight: '700',
                      fontSize: '18px',
                      color: 'var(--primary-color)',
                    }}
                  >
                    {formatRupiah(t.total_harga)}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      marginTop: '2px',
                    }}
                  >
                    Kembalian: {formatRupiah(t.total_kembalian)}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '18px',
                    color: 'var(--text-muted)',
                    transform:
                      selectedId === t.id ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s',
                    display: 'inline-block',
                  }}
                >
                  ▾
                </span>
              </div>

              {selectedId === t.id && (
                <div
                  style={{
                    borderTop: '1px solid var(--border-color)',
                    padding: '20px 24px',
                    background: '#F8FAFC',
                  }}
                >
                  {loadingDetail ? (
                    <p
                      style={{
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        padding: '20px',
                      }}
                    >
                      Memuat detail...
                    </p>
                  ) : (
                    <>
                      <table
                        style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: '14px',
                        }}
                      >
                        <thead>
                          <tr>
                            {['Barang', 'Qty', 'Harga', 'Subtotal'].map(
                              (label) => (
                                <th
                                  key={label}
                                  style={{
                                    textAlign:
                                      label === 'Barang' ? 'left' : 'right',
                                    padding: '8px 12px',
                                    color: 'var(--text-muted)',
                                    fontWeight: '600',
                                    fontSize: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                  }}
                                >
                                  {label}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {detail.map((d) => (
                            <tr
                              key={d.id}
                              style={{ borderTop: '1px solid var(--border-color)' }}
                            >
                              <td
                                style={{
                                  padding: '10px 12px',
                                  fontWeight: '500',
                                  color: 'var(--text-dark)',
                                }}
                              >
                                {d.nama_barang}
                              </td>
                              <td
                                style={{
                                  padding: '10px 12px',
                                  textAlign: 'right',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                {d.qty}
                              </td>
                              <td
                                style={{
                                  padding: '10px 12px',
                                  textAlign: 'right',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                {formatRupiah(d.harga_jual_saat_ini)}
                              </td>
                              <td
                                style={{
                                  padding: '10px 12px',
                                  textAlign: 'right',
                                  fontWeight: '600',
                                  color: 'var(--text-dark)',
                                }}
                              >
                                {formatRupiah(d.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '16px',
                          paddingTop: '12px',
                          borderTop: '1px dashed var(--border-color)',
                          gap: '16px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div
                          style={{ fontSize: '13px', color: 'var(--text-muted)' }}
                        >
                          <div>
                            Pelanggan:{' '}
                            <strong style={{ color: 'var(--text-dark)' }}>
                              {t.nama_pelanggan || 'Umum'}
                            </strong>
                          </div>
                          <div style={{ marginTop: '4px' }}>
                            Metode:{' '}
                            <strong style={{ color: 'var(--text-dark)' }}>
                              {t.metode_pembayaran || 'Tunai'}
                            </strong>
                          </div>
                          {Number(t.diskon) > 0 && (
                            <div style={{ marginTop: '4px' }}>
                              Diskon:{' '}
                              <strong style={{ color: '#DC2626' }}>
                                - {formatRupiah(t.diskon)}
                              </strong>
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '24px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div style={{ display: 'flex', gap: '30px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div
                                style={{
                                  fontSize: '13px',
                                  color: 'var(--text-muted)',
                                  marginBottom: '4px',
                                }}
                              >
                                Dibayar
                              </div>
                              <div style={{ fontWeight: '700', fontSize: '16px' }}>
                                {formatRupiah(t.total_bayar)}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div
                                style={{
                                  fontSize: '13px',
                                  color: 'var(--text-muted)',
                                  marginBottom: '4px',
                                }}
                              >
                                Total
                              </div>
                              <div
                                style={{
                                  fontWeight: '700',
                                  fontSize: '16px',
                                  color: 'var(--primary-color)',
                                }}
                              >
                                {formatRupiah(t.total_harga)}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div
                                style={{
                                  fontSize: '13px',
                                  color: 'var(--text-muted)',
                                  marginBottom: '4px',
                                }}
                              >
                                Kembalian
                              </div>
                              <div
                                style={{
                                  fontWeight: '700',
                                  fontSize: '16px',
                                  color: 'var(--success-color)',
                                }}
                              >
                                {formatRupiah(t.total_kembalian)}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrintNota(t);
                              }}
                              style={{
                                padding: '10px 20px',
                                background:
                                  'linear-gradient(135deg, #4F46E5, #6366F1)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                fontSize: '13px',
                              }}
                            >
                              🖨️ Print Nota
                            </button>
                            {t.status !== 'void' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVoid(t.id, t.nomor_nota);
                                }}
                                style={{
                                  padding: '8px 20px',
                                  background: '#FEF2F2',
                                  color: '#DC2626',
                                  border: '1px solid #FECACA',
                                  borderRadius: '10px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                }}
                              >
                                🗑️ Void Transaksi
                              </button>
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

      {printStruk && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '20px',
              width: '380px',
              maxWidth: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
              padding: '16px',
            }}
          >
            <Receipt data={printStruk} pengaturan={pengaturan} preview />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={() => setPrintStruk(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#F1F5F9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Tutup
              </button>
              <button
                onClick={doPrint}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                🖨️ Print
              </button>
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
