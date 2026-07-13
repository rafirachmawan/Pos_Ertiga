import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalProduk: 0, totalStok: 0 });

  useEffect(() => {
    fetch('http://localhost:3001/api/barang')
      .then(res => res.json())
      .then(data => {
        if(data.data) {
          const totalProduk = data.data.length;
          const totalStok = data.data.reduce((acc, item) => acc + item.stok, 0);
          setStats({ totalProduk, totalStok });
        }
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="header-row" style={{marginBottom: '40px'}}>
        <div>
          <h2 style={{ fontSize: '28px', color: 'var(--secondary-color)', fontWeight: '700' }}>Dashboard</h2>
          <p style={{color: 'var(--text-muted)', marginTop: '6px', fontSize: '15px'}}>Ringkasan performa dan stok toko Anda hari ini.</p>
        </div>
      </div>
      
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px'}}>
        
        {/* Card 1 */}
        <div style={{padding: '24px', background: 'var(--surface-color)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h3 style={{color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase'}}>Total Varian Produk</h3>
            <div style={{width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <span style={{fontSize: '20px'}}>📦</span>
            </div>
          </div>
          <p style={{fontSize: '36px', fontWeight: '700', color: 'var(--secondary-color)', lineHeight: 1}}>{stats.totalProduk}</p>
        </div>

        {/* Card 2 */}
        <div style={{padding: '24px', background: 'var(--surface-color)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h3 style={{color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase'}}>Total Stok Barang</h3>
            <div style={{width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <span style={{fontSize: '20px'}}>📊</span>
            </div>
          </div>
          <p style={{fontSize: '36px', fontWeight: '700', color: 'var(--secondary-color)', lineHeight: 1}}>{stats.totalStok}</p>
        </div>

        {/* Card 3 */}
        <div style={{padding: '24px', background: 'var(--surface-color)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h3 style={{color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase'}}>Laporan Keuangan</h3>
            <div style={{width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <span style={{fontSize: '20px'}}>📈</span>
            </div>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto'}}>
            <span style={{padding: '6px 12px', background: '#F1F5F9', color: '#64748B', borderRadius: '20px', fontSize: '12px', fontWeight: '600'}}>Segera Hadir</span>
          </div>
        </div>

      </div>

      {/* Banner */}
      <div style={{marginTop: '30px', padding: '32px', background: 'var(--surface-color)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px'}}>
        <div>
          <h2 style={{color: 'var(--secondary-color)', marginBottom: '8px', fontSize: '20px', fontWeight: '700'}}>Sistem Kasir Siap Digunakan!</h2>
          <p style={{color: 'var(--text-muted)', fontSize: '15px', maxWidth: '600px', lineHeight: 1.5}}>Mulai kelola barang di menu <strong>Kelola Barang</strong> atau langsung lakukan penjualan di menu <strong>Transaksi Kasir</strong>.</p>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
