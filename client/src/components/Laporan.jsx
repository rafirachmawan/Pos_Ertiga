import React, { useState, useEffect, useCallback } from 'react';

const fmt = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const today = () => new Date().toISOString().slice(0, 10);
const firstOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const QUICK_FILTERS = [
  { label: 'Hari Ini',   getRange: () => ({ s: today(), e: today() }) },
  { label: '7 Hari',     getRange: () => { const d = new Date(); d.setDate(d.getDate()-6); return { s: d.toISOString().slice(0,10), e: today() }; } },
  { label: 'Bulan Ini',  getRange: () => ({ s: firstOfMonth(), e: today() }) },
  { label: 'Tahun Ini',  getRange: () => ({ s: `${new Date().getFullYear()}-01-01`, e: today() }) },
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
      const [r1, r2, r3] = await Promise.all([
        fetch(`http://localhost:3001/api/laporan/range?start=${s}&end=${e}`).then(r => r.json()),
        fetch('http://localhost:3001/api/laporan/bulanan').then(r => r.json()),
        fetch(`http://localhost:3001/api/laporan/top-produk?start=${s}&end=${e}`).then(r => r.json()),
      ]);
      if (r1.data) setSummary(r1.data);
      if (r2.data) setBulanan(r2.data);
      if (r3.data) setTopProduk(r3.data);
    } catch (err) { console.error(err); }
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--secondary-color)' }}>Laporan Keuangan</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>Analisis penjualan berdasarkan periode yang dipilih</p>
        </div>
        <button
          onClick={exportCSV}
          style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #059669, #10B981)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          📤 Export CSV
        </button>
      </div>

      {/* ===== FILTER BAR ===== */}
      <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Quick filters */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {QUICK_FILTERS.map(f => (
            <button key={f.label} onClick={() => applyQuick(f)} style={{
              padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '12px',
              background: activeFilter === f.label ? 'var(--primary-color)' : '#F1F5F9',
              color: activeFilter === f.label ? 'white' : 'var(--text-muted)',
              transition: 'all 0.15s'
            }}>{f.label}</button>
          ))}
        </div>
        <div style={{ width: '1px', height: '28px', background: 'var(--border-color)' }}></div>
        {/* Custom range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '7px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>s/d</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '7px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
          <button onClick={applyCustom} style={{ padding: '7px 16px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>Terapkan</button>
        </div>
      </div>

      {/* ===== SUMMARY CARDS ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Transaksi', value: `${summary.total_transaksi} Nota`, icon: '🧾', color: '#4F46E5', bg: 'rgba(79,70,229,0.08)' },
          { label: 'Total Pendapatan', value: fmt(summary.total_pendapatan), icon: '💰', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
          { label: 'Laba Bersih', value: fmt(summary.laba_bersih), icon: '📈', color: summary.laba_bersih < 0 ? '#DC2626' : '#059669', bg: 'rgba(5,150,105,0.08)' },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>{c.icon}</div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: c.color, lineHeight: 1 }}>
              {loading ? <span style={{ color: '#CBD5E1' }}>—</span> : c.value}
            </div>
          </div>
        ))}
      </div>

      {/* ===== BODY: GRAFIK + TOP PRODUK ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>

        {/* Grafik 12 Bulan */}
        <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--secondary-color)' }}>Grafik Penjualan 12 Bulan</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Pendapatan bulanan sepanjang tahun berjalan</p>
          </div>
          
          {/* Bar chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '160px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
            {bulanan.map((b, idx) => {
              const h = (b.pendapatan / maxBulanan) * 100;
              const isCurrentMonth = idx === bulanan.length - 1;
              return (
                <div key={b.bulan} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', position: 'relative' }}>
                  {b.pendapatan > 0 && (
                    <span style={{ fontSize: '8px', color: isCurrentMonth ? 'var(--primary-color)' : 'var(--text-muted)', marginBottom: '3px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                      {(b.pendapatan / 1000000).toFixed(1)}jt
                    </span>
                  )}
                  <div
                    title={`${b.label}: ${fmt(b.pendapatan)}`}
                    style={{
                      width: '100%',
                      height: `${Math.max(h, 2)}%`,
                      background: isCurrentMonth ? 'linear-gradient(180deg, #6366F1, #4F46E5)' : '#C7D2FE',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.4s ease',
                      cursor: 'default',
                    }}
                  ></div>
                </div>
              );
            })}
          </div>
          {/* Labels */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            {bulanan.map((b, idx) => (
              <div key={b.bulan} style={{ flex: 1, textAlign: 'center', fontSize: '9px', color: idx === bulanan.length - 1 ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: idx === bulanan.length - 1 ? '700' : '500' }}>
                {b.label}
              </div>
            ))}
          </div>

          {/* Tabel bulanan di bawah grafik */}
          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 0 8px', borderBottom: '1px solid var(--border-color)' }}>
              <span>Bulan</span><span style={{ textAlign: 'center' }}>Transaksi</span><span style={{ textAlign: 'right' }}>Pendapatan</span>
            </div>
            {bulanan.slice().reverse().slice(0, 6).map(b => (
              <div key={b.bulan} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '9px 0', borderBottom: '1px solid var(--border-color)', fontSize: '13px', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-dark)', fontWeight: '500' }}>{b.label}</span>
                <span style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{b.total_transaksi} nota</span>
                <span style={{ textAlign: 'right', fontWeight: '700', color: b.pendapatan > 0 ? 'var(--primary-color)' : 'var(--text-muted)' }}>{fmt(b.pendapatan)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Produk */}
        <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--secondary-color)' }}>🏆 Top Produk Terlaris</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Berdasarkan periode yang dipilih</p>
          </div>

          {topProduk.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
              <p style={{ fontSize: '13px' }}>Belum ada data penjualan</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topProduk.map((p, i) => {
                const maxQty = topProduk[0].total_terjual;
                const barW = (p.total_terjual / maxQty) * 100;
                const MEDALS = ['🥇','🥈','🥉','4️⃣','5️⃣'];
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>{MEDALS[i]}</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)' }}>{p.nama_barang}</span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary-color)' }}>{p.total_terjual} {p.satuan}</span>
                    </div>
                    <div style={{ height: '6px', background: '#EEF2FF', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ width: `${barW}%`, height: '100%', background: i === 0 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' : 'linear-gradient(90deg, #6366F1, #818CF8)', borderRadius: '99px', transition: 'width 0.5s ease' }}></div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', textAlign: 'right' }}>{fmt(p.total_omzet)}</div>
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
