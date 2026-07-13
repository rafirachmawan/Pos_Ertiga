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
        <h2>POS ERTIGA</h2>
        <div 
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Halaman Utama
        </div>
        <div 
          className={`nav-item ${activeTab === 'pos' ? 'active' : ''}`}
          onClick={() => setActiveTab('pos')}
        >
          🛒 Transaksi Kasir
        </div>
        <div 
          className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          📦 Kelola Barang
        </div>
        <div 
          className={`nav-item ${activeTab === 'riwayat' ? 'active' : ''}`}
          onClick={() => setActiveTab('riwayat')}
        >
          🧾 Riwayat Transaksi
        </div>
        <div style={{marginTop: 'auto'}}>
          <div
            className="nav-item"
            onClick={() => setIsLoggedIn(false)}
            style={{color: '#F87171'}}
          >
            🚪 Keluar
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
