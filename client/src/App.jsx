import React, { useState, useEffect } from 'react'
import Inventory from './components/Inventory'
import POS from './components/POS'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import RiwayatTransaksi from './components/RiwayatTransaksi'
import Laporan from './components/Laporan'
import Pengaturan from './components/Pengaturan'
import RiwayatRestock from './components/RiwayatRestock'
import Master from './components/Master'
import BannerManager from './components/BannerManager'
import GoldManager from './components/GoldManager'
import SmmManager from './components/SmmManager'
import { api } from './lib/api'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchStock = () => {
      api('/api/barang')
        .then(data => {
          if (data.data) {
            const count = data.data.filter(item => Number(item.stok) <= 5).length;
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
          <div>
            <div className="sidebar-logo-title">POS ERTIGA</div>
            <div className="sidebar-logo-sub">Point of Sale</div>
          </div>
        </div>

        {/* Scrollable Navigation */}
        <div className="sidebar-nav">
          {/* Nav group: Main */}
          <div className="sidebar-nav-label">Menu Utama</div>
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            Dashboard
          </div>
          <div className={`nav-item ${activeTab === 'pos' ? 'active' : ''}`} onClick={() => setActiveTab('pos')}>
            Transaksi Kasir
          </div>
          <div className={`nav-item ${activeTab === 'laporan' ? 'active' : ''}`} onClick={() => setActiveTab('laporan')}>
            Laporan
          </div>

          {/* Nav group: Inventory */}
          <div className="sidebar-nav-label" style={{marginTop: '16px'}}>Inventori</div>
          <div className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Kelola Barang</span>
            {lowStockCount > 0 && (
              <span style={{ background: '#EF4444', color: 'white', fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '6px' }}>
                {lowStockCount}
              </span>
            )}
          </div>
          <div className={`nav-item ${activeTab === 'riwayat' ? 'active' : ''}`} onClick={() => setActiveTab('riwayat')}>
            Riwayat Transaksi
          </div>
          <div className={`nav-item ${activeTab === 'restock' ? 'active' : ''}`} onClick={() => setActiveTab('restock')}>
            Riwayat Restock
          </div>
          <div className={`nav-item ${activeTab === 'master' ? 'active' : ''}`} onClick={() => setActiveTab('master')}>
            Master Data
          </div>
          <div className={`nav-item ${activeTab === 'pengaturan' ? 'active' : ''}`} onClick={() => setActiveTab('pengaturan')}>
            Pengaturan
          </div>

          {/* Nav group: Website */}
          <div className="sidebar-nav-label" style={{marginTop: '16px'}}>Website Toko</div>
          <div className={`nav-item ${activeTab === 'banners' ? 'active' : ''}`} onClick={() => setActiveTab('banners')}>
            Kelola Banner
          </div>
          <div className={`nav-item ${activeTab === 'emas' ? 'active' : ''}`} onClick={() => setActiveTab('emas')}>
            Kelola Logam Mulia
          </div>
          <div className={`nav-item ${activeTab === 'smm' ? 'active' : ''}`} onClick={() => setActiveTab('smm')}>
            Kelola Booster Sosmed
          </div>
        </div>

        {/* Footer: User info + Logout (pinned bottom) */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div>
              <div className="sidebar-username">Administrator</div>
              <div className="sidebar-role">Super Admin</div>
            </div>
          </div>
          <div className="nav-item sidebar-logout" onClick={() => setIsLoggedIn(false)}>
            Keluar
          </div>
        </div>

      </div>
      <div className="main-content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'pos' && <POS />}
        {activeTab === 'laporan' && <Laporan />}
        {activeTab === 'inventory' && <Inventory />}
        {activeTab === 'riwayat' && <RiwayatTransaksi />}
        {activeTab === 'restock' && <RiwayatRestock />}
        {activeTab === 'master' && <Master />}
        {activeTab === 'pengaturan' && <Pengaturan />}
        {activeTab === 'banners' && <BannerManager />}
        {activeTab === 'emas' && <GoldManager />}
        {activeTab === 'smm' && <SmmManager />}
      </div>
    </div>
  )

}

export default App
