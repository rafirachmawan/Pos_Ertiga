import React, { useState } from 'react'
import Inventory from './components/Inventory'
import POS from './components/POS'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('pos');

  return (
    <div className="app-container">
      <div className="sidebar glass">
        <h2>Apparel POS</h2>
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
      </div>
      <div className="main-content">
        {activeTab === 'pos' ? <POS /> : <Inventory />}
      </div>
    </div>
  )
}

export default App
