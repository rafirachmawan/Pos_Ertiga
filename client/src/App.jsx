import React, { useState } from 'react'
import Inventory from './components/Inventory'
import POS from './components/POS'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import RiwayatTransaksi from './components/RiwayatTransaksi'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

        {/* Nav group: Inventory */}
        <div className="sidebar-nav-label" style={{marginTop: '8px'}}>Inventori</div>
        <div className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
          <span className="nav-icon">📦</span> Kelola Barang
        </div>
        <div className={`nav-item ${activeTab === 'riwayat' ? 'active' : ''}`} onClick={() => setActiveTab('riwayat')}>
          <span className="nav-icon">🧾</span> Riwayat Transaksi
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
        {activeTab === 'inventory' && <Inventory />}
        {activeTab === 'riwayat' && <RiwayatTransaksi />}
      </div>
    </div>
  )

}

export default App
