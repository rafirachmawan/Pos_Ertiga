import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { localDateKey, firstOfMonthKey } from '../lib/date';

const fmt = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const today = () => localDateKey();
const firstOfMonth = () => firstOfMonthKey();

const QUICK_FILTERS = [
  { label: 'Hari Ini', getRange: () => ({ s: today(), e: today() }) },
  {
    label: '7 Hari',
    getRange: () => {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      return { s: localDateKey(d), e: today() };
    },
  },
  { label: 'Bulan Ini', getRange: () => ({ s: firstOfMonth(), e: today() }) },
  {
    label: 'Tahun Ini',
    getRange: () => ({
      s: `${new Date().getFullYear()}-01-01`,
      e: today(),
    }),
  },
];

const Laporan = () => {
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate]     = useState(today());
  const [activeFilter, setActiveFilter] = useState('Bulan Ini');

  const [summary, setSummary]     = useState({ total_transaksi: 0, total_pendapatan: 0, laba_bersih: 0 });
  const [bulanan, setBulanan]     = useState([]);
  const [topProduk, setTopProduk] = useState([]);
  const [loading, setLoading]     = useState(false);

  const fetchAll = useCallback(async (s, e) => {
    setLoading(true);
    try {
      const query = `start=${encodeURIComponent(s)}&end=${encodeURIComponent(e)}`;
      const [r1, r2, r3] = await Promise.all([
        api(`/api/laporan/range?${query}`),
        api('/api/laporan/bulanan'),
        api(`/api/laporan/top-produk?${query}`),
      ]);
      if (r1.data) setSummary(r1.data);
      if (r2.data) setBulanan(r2.data);
      if (r3.data) setTopProduk(r3.data);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(startDate, endDate); }, []);

  const applyQuick = (f) => {
    const { s, e } = f.getRange();
    setStartDate(s); setEndDate(e); setActiveFilter(f.label);
    fetchAll(s, e);
  };

  const applyCustom = () => { setActiveFilter(''); fetchAll(startDate, endDate); };

  // For chart
  const maxBulanan = Math.max(...bulanan.map(b => b.pendapatan), 1);

  // Export CSV
  const exportCSV = () => {
    const rows = [
      ['Periode', `${startDate} s/d ${endDate}`],
      [],
      ['Metrik', 'Nilai'],
      ['Total Transaksi', summary.total_transaksi],
      ['Total Pendapatan', summary.total_pendapatan],
      ['Laba Bersih', summary.laba_bersih],
      [],
      ['Top Produk', 'Terjual (qty)', 'Omzet'],
      ...topProduk.map(p => [p.nama_barang, p.total_terjual, p.total_omzet]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `laporan_${startDate}_${endDate}.csv`; a.click();
  };

  return (
    <div>
      {/* ===== PAGE HEADER ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>Laporan Keuangan</h2>
          <p style={{ color: '#64748B', marginTop: '4px', fontSize: '13px' }}>Analisis penjualan berdasarkan periode yang dipilih</p>
        </div>
        <button
          onClick={exportCSV}
          style={{
            padding: '8px 16px',
            background: '#0F172A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '12.5px',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </button>
      </div>

      {/* ===== FILTER BAR ===== */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap'
      }}>
        {/* Quick filters */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {QUICK_FILTERS.map(f => (
            <button key={f.label} onClick={() => applyQuick(f)} style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: activeFilter === f.label ? '#0F172A' : '#E2E8F0',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '12px',
              background: activeFilter === f.label ? '#0F172A' : '#FFFFFF',
              color: activeFilter === f.label ? '#FFFFFF' : '#64748B',
              boxShadow: 'none',
              transition: 'all 0.15s ease'
            }}>{f.label}</button>
          ))}
        </div>

        <div style={{ width: '1px', height: '24px', background: '#E2E8F0' }}></div>

        {/* Custom range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            style={{ padding: '6px 10px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #E2E8F0', boxShadow: 'none' }}
          />
          <span style={{ color: '#94A3B8', fontSize: '12px', fontWeight: '500' }}>s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            style={{ padding: '6px 10px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #E2E8F0', boxShadow: 'none' }}
          />
          <button
            onClick={applyCustom}
            style={{
              padding: '6px 14px',
              background: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: 'none'
            }}
          >Terapkan</button>
        </div>
      </div>

      {/* ===== SUMMARY CARDS ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'Total Transaksi', value: `${summary.total_transaksi} Nota`, accent: '#0F172A' },
          { label: 'Total Pendapatan', value: fmt(summary.total_pendapatan), accent: '#2563EB' },
          { label: 'Laba Bersih', value: fmt(summary.laba_bersih), accent: summary.laba_bersih < 0 ? '#DC2626' : '#059669' },
        ].map(c => (
          <div key={c.label} style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '18px 20px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}>
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#94A3B8',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: '8px'
            }}>{c.label}</span>
            <div style={{ fontSize: '22px', fontWeight: '800', color: c.accent, lineHeight: 1.1 }}>
              {loading ? <span style={{ color: '#CBD5E1' }}>—</span> : c.value}
            </div>
          </div>
        ))}
      </div>

      {/* ===== BODY: GRAFIK + TOP PRODUK ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '14px', alignItems: 'start' }}>

        {/* Grafik 12 Bulan */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', margin: 0 }}>Grafik Penjualan 12 Bulan</h3>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>Pendapatan bulanan sepanjang tahun berjalan</p>
          </div>
          
          {/* Bar chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '140px', paddingBottom: '6px', borderBottom: '1px solid #F1F5F9' }}>
            {bulanan.map((b, idx) => {
              const h = (b.pendapatan / maxBulanan) * 100;
              const isCurrentMonth = idx === bulanan.length - 1;
              return (
                <div key={b.bulan} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', position: 'relative' }}>
                  {b.pendapatan > 0 && (
                    <span style={{ fontSize: '8px', color: isCurrentMonth ? '#2563EB' : '#94A3B8', marginBottom: '2px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                      {(b.pendapatan / 1000000).toFixed(1)}jt
                    </span>
                  )}
                  <div
                    title={`${b.label}: ${fmt(b.pendapatan)}`}
                    style={{
                      width: '100%',
                      maxWidth: '32px',
                      height: `${Math.max(h, 2)}%`,
                      background: isCurrentMonth ? '#2563EB' : '#E2E8F0',
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.4s ease',
                      cursor: 'default',
                    }}
                  ></div>
                </div>
              );
            })}
          </div>

          {/* Labels */}
          <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
            {bulanan.map((b, idx) => (
              <div key={b.bulan} style={{
                flex: 1,
                textAlign: 'center',
                fontSize: '9px',
                color: idx === bulanan.length - 1 ? '#2563EB' : '#94A3B8',
                fontWeight: idx === bulanan.length - 1 ? '700' : '500'
              }}>
                {b.label}
              </div>
            ))}
          </div>

          {/* Tabel bulanan di bawah grafik */}
          <div style={{ marginTop: '20px', borderTop: '1px solid #E2E8F0', paddingTop: '14px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '0',
              fontSize: '10px',
              fontWeight: '700',
              color: '#94A3B8',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '0 0 8px',
              borderBottom: '1px solid #F1F5F9'
            }}>
              <span>Bulan</span>
              <span style={{ textAlign: 'center' }}>Transaksi</span>
              <span style={{ textAlign: 'right' }}>Pendapatan</span>
            </div>
            {bulanan.slice().reverse().slice(0, 6).map(b => (
              <div key={b.bulan} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                padding: '8px 0',
                borderBottom: '1px solid #F8FAFC',
                fontSize: '12.5px',
                alignItems: 'center'
              }}>
                <span style={{ color: '#1E293B', fontWeight: '500' }}>{b.label}</span>
                <span style={{ textAlign: 'center', color: '#64748B', fontSize: '12px' }}>{b.total_transaksi} nota</span>
                <span style={{ textAlign: 'right', fontWeight: '700', color: b.pendapatan > 0 ? '#0F172A' : '#94A3B8' }}>{fmt(b.pendapatan)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Produk */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', margin: 0 }}>Produk Terlaris</h3>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>Berdasarkan periode yang dipilih</p>
          </div>

          {topProduk.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94A3B8' }}>
              <p style={{ fontSize: '13px' }}>Belum ada data penjualan</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {topProduk.map((p, i) => {
                const maxQty = topProduk[0].total_terjual;
                const barW = (p.total_terjual / maxQty) * 100;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          background: i === 0 ? '#0F172A' : '#F1F5F9',
                          color: i === 0 ? '#FFFFFF' : '#64748B',
                          fontSize: '10px',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {i + 1}
                        </span>
                        <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#1E293B' }}>{p.nama_barang}</span>
                      </div>
                      <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#0F172A' }}>{p.total_terjual} {p.satuan}</span>
                    </div>
                    <div style={{ height: '4px', background: '#F1F5F9', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${barW}%`,
                        height: '100%',
                        background: i === 0 ? '#0F172A' : '#CBD5E1',
                        borderRadius: '99px',
                        transition: 'width 0.5s ease'
                      }}></div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px', textAlign: 'right' }}>{fmt(p.total_omzet)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Laporan;
