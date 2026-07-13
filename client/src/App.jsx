import React, { useState, useEffect } from 'react'
import Inventory from './components/Inventory'
import POS from './components/POS'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import RiwayatTransaksi from './components/RiwayatTransaksi'
import Laporan from './components/Laporan'
import Pengaturan from './components/Pengaturan'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchStock = () => {
      fetch('http://localhost:3001/api/barang')
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            const count = data.data.filter(item => item.stok <= 5).length;
            setLowStockCount(count);
          }
        })
        .catch(console.error);
    };
    
    fetchStock(); // Fetch on mount/login
    // Also fetch every time tab changes to keep it updated
  }, [isLoggedIn, activeTab]);

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="app-container">
      <div className="sidebar">

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🛍️</div>
          <div>
            <div className="sidebar-logo-title">POS ERTIGA</div>
            <div className="sidebar-logo-sub">Point of Sale</div>
          </div>
        </div>

        {/* Nav group: Main */}
        <div className="sidebar-nav-label">Menu Utama</div>
        <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <span className="nav-icon">📊</span> Dashboard
        </div>
        <div className={`nav-item ${activeTab === 'pos' ? 'active' : ''}`} onClick={() => setActiveTab('pos')}>
          <span className="nav-icon">🛒</span> Transaksi Kasir
        </div>
        <div className={`nav-item ${activeTab === 'laporan' ? 'active' : ''}`} onClick={() => setActiveTab('laporan')}>
          <span className="nav-icon">📋</span> Laporan
        </div>

        {/* Nav group: Inventory */}
        <div className="sidebar-nav-label" style={{marginTop: '8px'}}>Inventori</div>
        <div className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div><span className="nav-icon">📦</span> Kelola Barang</div>
          {lowStockCount > 0 && (
            <div style={{ background: '#EF4444', color: 'white', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '10px', minWidth: '18px', textAlign: 'center' }}>
              {lowStockCount}
            </div>
          )}
        </div>
        <div className={`nav-item ${activeTab === 'riwayat' ? 'active' : ''}`} onClick={() => setActiveTab('riwayat')}>
          <span className="nav-icon">🧾</span> Riwayat Transaksi
        </div>
        <div className={`nav-item ${activeTab === 'pengaturan' ? 'active' : ''}`} onClick={() => setActiveTab('pengaturan')}>
          <span className="nav-icon">⚙️</span> Pengaturan
        </div>

        {/* Footer: User info + Logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">A</div>
            <div>
              <div className="sidebar-username">Administrator</div>
              <div className="sidebar-role">Super Admin</div>
            </div>
          </div>
          <div className="nav-item sidebar-logout" onClick={() => setIsLoggedIn(false)}>
            <span className="nav-icon">🚪</span> Keluar
          </div>
        </div>

      </div>
      <div className="main-content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'pos' && <POS />}
        {activeTab === 'laporan' && <Laporan />}
        {activeTab === 'inventory' && <Inventory />}
        {activeTab === 'riwayat' && <RiwayatTransaksi />}
        {activeTab === 'pengaturan' && <Pengaturan />}
      </div>
    </div>
  )

}

export default App
