import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { formatDateTime, localDateKey, firstOfMonthKey, parseDbDate } from '../lib/date';
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
  const [activeDatePreset, setActiveDatePreset] = useState('semua');
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransaksi = async () => {
    setRefreshing(true);
    try {
      const data = await api('/api/transaksi');
      if (data.data) setTransaksi(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
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
      submessage: 'Stok barang akan otomatis dikembalikan ke inventori dan tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Ya, Batalkan Transaksi',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await api(`/api/transaksi/${id}/void`, { method: 'PUT' });
      showToast('Transaksi berhasil dibatalkan (VOID)', 'success');
      fetchTransaksi();
      if (selectedId === id) {
        setSelectedId(null);
        setDetail([]);
      }
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

  // Filter preset dates
  const handlePresetDate = (preset) => {
    setActiveDatePreset(preset);
    const today = new Date();
    if (preset === 'semua') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'hari_ini') {
      const todayStr = localDateKey(today);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7_hari') {
      const past = new Date();
      past.setDate(past.getDate() - 6);
      setStartDate(localDateKey(past));
      setEndDate(localDateKey(today));
    } else if (preset === 'bulan_ini') {
      setStartDate(firstOfMonthKey(today));
      setEndDate(localDateKey(today));
    }
  };

  const filtered = useMemo(() => {
    return transaksi.filter((t) => {
      const matchSearch =
        (t.nomor_nota || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.nama_pelanggan || 'Umum')
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const dateKey = localDateKey(parseDbDate(t.tanggal_transaksi));
      let matchDate = true;
      if (startDate) matchDate = matchDate && dateKey >= startDate;
      if (endDate) matchDate = matchDate && dateKey <= endDate;

      return matchSearch && matchDate;
    });
  }, [transaksi, searchQuery, startDate, endDate]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalCount = filtered.length;
    const suksesList = filtered.filter((t) => t.status !== 'void');
    const totalOmzet = suksesList.reduce((acc, t) => acc + Number(t.total_harga || 0), 0);
    const voidCount = filtered.filter((t) => t.status === 'void').length;
    return {
      totalCount,
      totalSukses: suksesList.length,
      totalOmzet,
      voidCount,
    };
  }, [filtered]);

  const hasActiveFilter = searchQuery || startDate || endDate;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* 1. Header Area */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{
            fontSize: '22px',
            fontWeight: '700',
            color: '#0F172A',
            letterSpacing: '-0.02em',
            margin: 0
          }}>
            Riwayat Transaksi
          </h2>
          <p style={{ color: '#64748B', marginTop: '4px', fontSize: '13px', margin: '4px 0 0 0' }}>
            Pantau dan kelola seluruh bukti transaksi penjualan kasir
          </p>
        </div>

        <button
          onClick={fetchTransaksi}
          disabled={refreshing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: '600',
            color: '#475569',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#F8FAFC'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FFFFFF'; }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              animation: refreshing ? 'spin 1s linear infinite' : 'none',
              transformOrigin: 'center'
            }}
          >
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
          {refreshing ? 'Memuat...' : 'Segarkan'}
        </button>
      </div>

      {/* 2. Top Summary Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '20px'
      }}>
        {/* Total Transaksi */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          padding: '14px 18px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            Total Transaksi
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em' }}>
            {metrics.totalCount} <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748B' }}>Nota</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '3px' }}>
            Total transaksi tercatat
          </div>
        </div>

        {/* Total Nilai Penjualan */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          padding: '14px 18px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            Total Penjualan
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em' }}>
            {formatRupiah(metrics.totalOmzet)}
          </div>
          <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '3px' }}>
            Dari transaksi sukses
          </div>
        </div>

        {/* Transaksi Selesai */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          padding: '14px 18px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            Transaksi Berhasil
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#059669', letterSpacing: '-0.02em' }}>
            {metrics.totalSukses} <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748B' }}>Nota</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '3px' }}>
            Status pembayaran selesai
          </div>
        </div>

        {/* Transaksi Void */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          padding: '14px 18px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            Dibatalkan (Void)
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: '800',
            color: metrics.voidCount > 0 ? '#DC2626' : '#64748B',
            letterSpacing: '-0.02em'
          }}>
            {metrics.voidCount} <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748B' }}>Nota</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '3px' }}>
            Stok otomatis dikembalikan
          </div>
        </div>
      </div>

      {/* 3. Toolbar: Search & Date Filters (Konsisten dan tidak bergeser) */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '10px',
        border: '1px solid #E2E8F0',
        padding: '12px 16px',
        marginBottom: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        {/* Search input dengan lebar konsisten */}
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%', flexShrink: 0 }}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94A3B8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Cari nomor nota atau nama pelanggan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '36px',
              paddingRight: searchQuery ? '32px' : '12px',
              fontSize: '13px',
              height: '38px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              outline: 'none',
              color: '#0F172A',
              background: '#F8FAFC',
              transition: 'all 0.15s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.background = '#FFFFFF'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#E2E8F0',
                border: 'none',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B',
                fontSize: '11px',
                lineHeight: 1,
                padding: 0,
              }}
              title="Hapus pencarian"
            >
              ✕
            </button>
          )}
        </div>

        {/* Date presets & date range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Quick filter pills */}
          <div style={{
            display: 'inline-flex',
            background: '#F1F5F9',
            padding: '3px',
            borderRadius: '8px',
            gap: '2px'
          }}>
            {[
              { id: 'semua', label: 'Semua' },
              { id: 'hari_ini', label: 'Hari Ini' },
              { id: '7_hari', label: '7 Hari' },
              { id: 'bulan_ini', label: 'Bulan Ini' },
            ].map((p) => {
              const active = activeDatePreset === p.id && !(!startDate && !endDate && p.id !== 'semua');
              return (
                <button
                  key={p.id}
                  onClick={() => handlePresetDate(p.id)}
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: active ? '700' : '500',
                    color: active ? '#0F172A' : '#64748B',
                    background: active ? '#FFFFFF' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Date range inputs dengan tombol clear inline */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#F8FAFC',
            padding: '4px 10px',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            fontSize: '12px',
          }}>
            <span style={{ color: '#94A3B8', fontWeight: '500' }}>Rentang:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActiveDatePreset('custom');
              }}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '12px',
                color: '#0F172A',
                outline: 'none',
                cursor: 'pointer',
                padding: '2px',
              }}
            />
            <span style={{ color: '#CBD5E1' }}>s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActiveDatePreset('custom');
              }}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '12px',
                color: '#0F172A',
                outline: 'none',
                cursor: 'pointer',
                padding: '2px',
              }}
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setActiveDatePreset('semua');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '0 2px',
                  fontSize: '11px',
                  lineHeight: 1,
                  marginLeft: '2px',
                }}
                title="Hapus rentang tanggal"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. List of Transactions / Empty State (Rapi & Proporsional) */}
      {filtered.length === 0 ? (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '40px 24px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <div style={{ fontSize: '14.5px', fontWeight: '700', color: '#1E293B', marginBottom: '4px' }}>
            Tidak Ada Transaksi yang Cocok
          </div>
          <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '420px', margin: '0 auto 16px', lineHeight: 1.5 }}>
            {searchQuery
              ? `Tidak ditemukan transaksi untuk kata kunci "${searchQuery}".`
              : 'Belum ada transaksi tercatat pada rentang filter tanggal yang dipilih.'}
          </p>
          {hasActiveFilter && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStartDate('');
                setEndDate('');
                setActiveDatePreset('semua');
              }}
              style={{
                padding: '8px 18px',
                background: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#1E293B'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#0F172A'; }}
            >
              Tampilkan Semua Transaksi
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((t) => {
            const isSelected = selectedId === t.id;
            const isVoid = t.status === 'void';
            const isTunai = (t.metode_pembayaran || 'Tunai').toLowerCase() === 'tunai';

            return (
              <div
                key={t.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: isSelected ? '1px solid #2563EB' : '1px solid #E2E8F0',
                  boxShadow: isSelected
                    ? '0 4px 14px rgba(37,99,235,0.08), 0 0 0 1px #2563EB'
                    : '0 1px 3px rgba(0,0,0,0.02)',
                  transition: 'all 0.18s ease',
                  overflow: 'hidden',
                }}
              >
                {/* Clickable Header Row */}
                <div
                  onClick={() => loadDetail(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '14px 18px',
                    cursor: 'pointer',
                    gap: '16px',
                    background: isSelected ? '#F8FAFC' : '#FFFFFF',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = '#FAFBFC';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = '#FFFFFF';
                  }}
                >
                  {/* Left Column: Invoice Number & Meta info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{
                        fontWeight: '700',
                        fontSize: '13.5px',
                        color: isVoid ? '#94A3B8' : '#0F172A',
                        textDecoration: isVoid ? 'line-through' : 'none',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        letterSpacing: '-0.01em',
                      }}>
                        {t.nomor_nota}
                      </span>

                      {/* Status Badge */}
                      {isVoid ? (
                        <span style={{
                          background: '#FEF2F2',
                          color: '#DC2626',
                          border: '1px solid #FECACA',
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '2px 7px',
                          borderRadius: '5px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}>
                          Dibatalkan (Void)
                        </span>
                      ) : (
                        <span style={{
                          background: '#ECFDF5',
                          color: '#059669',
                          border: '1px solid #A7F3D0',
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '2px 7px',
                          borderRadius: '5px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}>
                          Selesai
                        </span>
                      )}

                      {/* Metode Pembayaran Badge */}
                      <span style={{
                        background: isTunai ? '#F1F5F9' : '#EFF6FF',
                        color: isTunai ? '#475569' : '#2563EB',
                        border: isTunai ? '1px solid #E2E8F0' : '1px solid #BFDBFE',
                        fontSize: '10.5px',
                        fontWeight: '600',
                        padding: '2px 7px',
                        borderRadius: '5px',
                      }}>
                        {t.metode_pembayaran || 'Tunai'}
                      </span>
                    </div>

                    {/* Subline: Tanggal & Nama Pelanggan (Clean tanpa icon) */}
                    <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span>{formatDateTime(t.tanggal_transaksi)}</span>
                      <span style={{ color: '#CBD5E1' }}>•</span>
                      <span>Pelanggan: <strong style={{ color: '#334155' }}>{t.nama_pelanggan || 'Umum'}</strong></span>
                    </div>
                  </div>

                  {/* Right Column: Total Price & Kembalian (Selalu tuliskan kembali meski 0) */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontWeight: '800',
                      fontSize: '15px',
                      color: isVoid ? '#94A3B8' : '#0F172A',
                      letterSpacing: '-0.02em',
                    }}>
                      {formatRupiah(t.total_harga)}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                      Kembali: <span style={{ color: Number(t.total_kembalian) > 0 ? '#059669' : '#64748B', fontWeight: '600' }}>
                        {formatRupiah(t.total_kembalian || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Expand Chevron Icon */}
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: isSelected ? '#E2E8F0' : '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#475569"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>

                {/* 5. Expanded Detail Panel */}
                {isSelected && (
                  <div style={{
                    borderTop: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    padding: '20px',
                  }}>
                    {loadingDetail ? (
                      <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748B' }}>
                        <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '8px' }}></div>
                        <p style={{ margin: 0, fontSize: '13px' }}>Memuat rincian transaksi...</p>
                      </div>
                    ) : (
                      <div>
                        {/* Detail Header Action Bar */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '16px',
                          flexWrap: 'wrap',
                          gap: '12px',
                          paddingBottom: '14px',
                          borderBottom: '1px solid #F1F5F9'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>
                              Daftar Barang Belanja
                            </span>
                            <span style={{
                              background: '#F1F5F9',
                              color: '#475569',
                              fontSize: '11px',
                              fontWeight: '600',
                              padding: '2px 8px',
                              borderRadius: '12px'
                            }}>
                              {detail.length} item
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {/* Tombol Print Struk */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrintNota(t);
                              }}
                              style={{
                                padding: '8px 16px',
                                background: '#0F172A',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                fontSize: '12.5px',
                                transition: 'background 0.15s ease',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#1E293B'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = '#0F172A'; }}
                            >
                              Print Struk
                            </button>

                            {/* Tombol Void */}
                            {!isVoid && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVoid(t.id, t.nomor_nota);
                                }}
                                style={{
                                  padding: '8px 16px',
                                  background: '#FEF2F2',
                                  color: '#DC2626',
                                  border: '1px solid #FECACA',
                                  borderRadius: '8px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  fontSize: '12.5px',
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#FEE2E2';
                                  e.currentTarget.style.borderColor = '#FCA5A5';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#FEF2F2';
                                  e.currentTarget.style.borderColor = '#FECACA';
                                }}
                              >
                                Batalkan (Void)
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 2-Column Responsive Layout: Left (Table Items) & Right (Payment Summary) */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(0, 1.6fr) minmax(280px, 1fr)',
                          gap: '20px',
                          alignItems: 'start'
                        }}>
                          {/* Left: Items Table */}
                          <div style={{
                            border: '1px solid #E2E8F0',
                            borderRadius: '10px',
                            overflow: 'hidden',
                          }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                              <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                  <th style={{ textAlign: 'left', padding: '10px 14px', color: '#64748B', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Nama Barang
                                  </th>
                                  <th style={{ textAlign: 'center', padding: '10px 14px', color: '#64748B', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', width: '70px' }}>
                                    Qty
                                  </th>
                                  <th style={{ textAlign: 'right', padding: '10px 14px', color: '#64748B', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', width: '110px' }}>
                                    Harga
                                  </th>
                                  <th style={{ textAlign: 'right', padding: '10px 14px', color: '#64748B', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', width: '120px' }}>
                                    Subtotal
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {detail.map((d, index) => (
                                  <tr
                                    key={d.id || index}
                                    style={{
                                      borderBottom: index < detail.length - 1 ? '1px solid #F1F5F9' : 'none',
                                      background: index % 2 === 0 ? '#FFFFFF' : '#FAFBFC'
                                    }}
                                  >
                                    <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                                      <div style={{ fontWeight: '600', color: '#0F172A' }}>
                                        {d.nama_barang}
                                      </div>
                                      {d.barcode && d.barcode !== '-' && (
                                        <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace', marginTop: '1px' }}>
                                          {d.barcode}
                                        </div>
                                      )}
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                                      <span style={{
                                        display: 'inline-block',
                                        padding: '2px 8px',
                                        background: '#F1F5F9',
                                        borderRadius: '6px',
                                        fontWeight: '700',
                                        fontSize: '12px',
                                        color: '#334155'
                                      }}>
                                        {d.qty}x
                                      </span>
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#64748B', verticalAlign: 'middle' }}>
                                      {formatRupiah(d.harga_jual_saat_ini)}
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '700', color: '#0F172A', verticalAlign: 'middle' }}>
                                      {formatRupiah(d.subtotal)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Right: Payment Breakdown Card */}
                          <div style={{
                            background: '#F8FAFC',
                            borderRadius: '10px',
                            border: '1px solid #E2E8F0',
                            padding: '16px',
                          }}>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: '700',
                              color: '#475569',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              marginBottom: '12px',
                            }}>
                              Ringkasan Pembayaran
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                                <span>Pelanggan</span>
                                <span style={{ fontWeight: '600', color: '#0F172A' }}>{t.nama_pelanggan || 'Umum'}</span>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                                <span>Metode Pembayaran</span>
                                <span style={{
                                  background: isTunai ? '#E2E8F0' : '#DBEAFE',
                                  color: isTunai ? '#334155' : '#1D4ED8',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  padding: '1px 8px',
                                  borderRadius: '5px'
                                }}>
                                  {t.metode_pembayaran || 'Tunai'}
                                </span>
                              </div>

                              <div style={{ height: '1px', background: '#E2E8F0', margin: '4px 0' }}></div>

                              {Number(t.diskon) > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                                  <span>Potongan Diskon</span>
                                  <span style={{ fontWeight: '600', color: '#DC2626' }}>- {formatRupiah(t.diskon)}</span>
                                </div>
                              )}

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={{ fontWeight: '700', color: '#0F172A', fontSize: '14px' }}>Total Tagihan</span>
                                <span style={{ fontWeight: '800', fontSize: '17px', color: '#2563EB', letterSpacing: '-0.02em' }}>
                                  {formatRupiah(t.total_harga)}
                                </span>
                              </div>

                              <div style={{ height: '1px', background: '#E2E8F0', margin: '4px 0' }}></div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                                <span>Jumlah Dibayar</span>
                                <span style={{ fontWeight: '600', color: '#0F172A' }}>{formatRupiah(t.total_bayar)}</span>
                              </div>

                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 10px',
                                background: Number(t.total_kembalian) > 0 ? '#ECFDF5' : '#F1F5F9',
                                borderRadius: '8px',
                                marginTop: '4px',
                                border: Number(t.total_kembalian) > 0 ? '1px solid #A7F3D0' : '1px solid #E2E8F0'
                              }}>
                                <span style={{
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  color: Number(t.total_kembalian) > 0 ? '#065F46' : '#64748B'
                                }}>
                                  Kembalian
                                </span>
                                <span style={{
                                  fontWeight: '800',
                                  fontSize: '14.5px',
                                  color: Number(t.total_kembalian) > 0 ? '#059669' : '#64748B'
                                }}>
                                  {formatRupiah(t.total_kembalian)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Modal Print Preview Struk */}
      {printStruk && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)',
          padding: '16px',
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            width: '400px',
            maxWidth: '100%',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: '1px solid #E2E8F0',
            }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>
                  Preview Struk Transaksi
                </h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>
                  {printStruk.nomor_nota}
                </p>
              </div>
              <button
                onClick={() => setPrintStruk(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#0F172A'; e.currentTarget.style.background = '#F1F5F9'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'none'; }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: '16px',
              overflowY: 'auto',
              flex: 1,
              background: '#F8FAFC',
              display: 'flex',
              justifyContent: 'center',
            }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: '8px',
                padding: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #E2E8F0',
              }}>
                <Receipt data={printStruk} pengaturan={pengaturan} preview />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              gap: '10px',
              padding: '14px 18px',
              borderTop: '1px solid #E2E8F0',
              background: '#FFFFFF',
            }}>
              <button
                onClick={() => setPrintStruk(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#F1F5F9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Tutup
              </button>
              <button
                onClick={doPrint}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
                Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden print portal */}
      <ReceiptPrintPortal
        data={printStruk}
        pengaturan={pengaturan}
        lebar={Number(pengaturan.lebar_struk) || 80}
      />
    </div>
  );
};

export default RiwayatTransaksi;

