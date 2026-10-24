import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../lib/api';
import { formatRupiah } from '../lib/format';
import { showConfirm } from '../lib/dialog';

const emptyItem = {
  kategori_kode: 'pulsa',
  operator: '',
  nama_produk: '',
  nominal: '',
  harga_modal: 0,
  harga_jual: 0,
  urutan: 0,
  aktif: 1,
};

export default function PpobManager() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pulsa' | 'paket_data' | 'listrik' | 'ewallet'

  // Pagination / Slide state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ ...emptyItem });
  const [saving, setSaving] = useState(false);

  const fetchPpobData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api('/api/ppob');
      setData(res.rawItems || []);
    } catch (err) {
      setError(err.message || 'Gagal memuat data PPOB');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPpobData();
  }, [fetchPpobData]);

  const openCreate = () => {
    setEditId(null);
    setFormData({
      ...emptyItem,
      kategori_kode: activeTab !== 'all' ? activeTab : 'pulsa',
      urutan: data.length,
    });
    setShowModal(true);
    setError('');
  };

  const openEdit = (item) => {
    setEditId(item.id);
    setFormData({
      kategori_kode: item.kategori_kode || 'pulsa',
      operator: item.operator || '',
      nama_produk: item.nama_produk || '',
      nominal: item.nominal || '',
      harga_modal: item.harga_modal || 0,
      harga_jual: item.harga_jual || 0,
      urutan: item.urutan || 0,
      aktif: item.aktif !== undefined ? item.aktif : 1,
    });
    setShowModal(true);
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.operator.trim()) return alert('Operator / Provider wajib diisi!');
    if (!formData.nama_produk.trim()) return alert('Nama Produk wajib diisi!');
    if (formData.harga_jual <= 0) return alert('Harga jual harus lebih dari 0!');

    try {
      setSaving(true);
      if (editId) {
        await api(`/api/ppob/item/${editId}`, {
          method: 'PUT',
          body: formData,
        });
      } else {
        await api('/api/ppob/item', {
          method: 'POST',
          body: formData,
        });
      }
      setShowModal(false);
      fetchPpobData();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan item PPOB');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item) => {
    try {
      await api(`/api/ppob/item/${item.id}/toggle`, { method: 'PATCH' });
      setData((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, aktif: it.aktif === 1 ? 0 : 1 } : it))
      );
    } catch (err) {
      alert(err.message || 'Gagal mengubah status');
    }
  };

  const handleDelete = async (id, nama) => {
    const ok = await showConfirm({
      title: 'Hapus Layanan PPOB',
      message: `Hapus layanan "${nama}" dari daftar PPOB?`,
      confirmText: 'Ya, Hapus',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/api/ppob/item/${id}`, { method: 'DELETE' });
      fetchPpobData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus');
    }
  };

  const filteredItems = useMemo(() => {
    return data.filter((item) => {
      const matchTab = activeTab === 'all' || item.kategori_kode === activeTab;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        (item.nama_produk || '').toLowerCase().includes(q) ||
        (item.operator || '').toLowerCase().includes(q) ||
        (item.nominal || '').toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [data, activeTab, searchQuery]);

  // Reset page when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  const categoriesTab = [
    { key: 'all', label: 'Semua Produk' },
    { key: 'pulsa', label: 'Pulsa Seluler' },
    { key: 'paket_data', label: 'Paket Data' },
    { key: 'listrik', label: 'Listrik PLN' },
    { key: 'ewallet', label: 'Top-Up E-Wallet' },
  ];

  return (
    <div style={{ padding: '24px', background: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* 1. Header & Title Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
            Kelola PPOB & Layanan Digital
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
            Atur nominal, harga modal, harga jual pulsa, paket internet, token listrik PLN, dan saldo e-wallet untuk kasir & website.
          </p>
        </div>

        <button
          onClick={openCreate}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#03AC0E',
            color: '#FFFFFF',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(3, 172, 14, 0.25)',
          }}
        >
          + Tambah Produk PPOB
        </button>
      </div>

      {/* 2. Top Summary KPI Cards (Ramping & Rapih) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Produk PPOB</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>{data.length} Item</div>
          </div>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#0F172A', background: '#F1F5F9', padding: '3px 8px', borderRadius: '4px' }}>Katalog</span>
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Produk Aktif di Web</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#059669', marginTop: '2px' }}>
              {data.filter((it) => it.aktif === 1).length} Item
            </div>
          </div>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '3px 8px', borderRadius: '4px' }}>✓ Tayang</span>
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Kategori Aktif</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#2563EB', marginTop: '2px' }}>4 Kategori</div>
          </div>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '3px 8px', borderRadius: '4px' }}>Digital</span>
        </div>
      </div>

      {/* 3. Main Data Card */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        
        {/* Category Tabs & Search Bar */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
            {categoriesTab.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: activeTab === tab.key ? '700' : '500',
                  background: activeTab === tab.key ? '#0F172A' : '#F1F5F9',
                  color: activeTab === tab.key ? '#FFFFFF' : '#475569',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ width: '280px' }}>
            <input
              type="text"
              placeholder="Cari operator / produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Memuat data PPOB...</div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748B' }}>
            <p style={{ fontWeight: '600', color: '#0F172A', marginBottom: '6px' }}>Belum ada item PPOB</p>
            <p style={{ fontSize: '13px', margin: 0 }}>Silakan tambahkan produk pulsa, listrik, atau e-wallet melalui tombol di atas.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '50px', textAlign: 'center', whiteSpace: 'nowrap' }}>No</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '120px', whiteSpace: 'nowrap' }}>Kategori</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '130px', whiteSpace: 'nowrap' }}>Operator / Provider</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', minWidth: '200px', whiteSpace: 'nowrap' }}>Nama Produk & Nominal</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '120px', textAlign: 'right', whiteSpace: 'nowrap' }}>Harga Modal</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '130px', textAlign: 'right', whiteSpace: 'nowrap' }}>Harga Jual</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '110px', textAlign: 'right', whiteSpace: 'nowrap' }}>Laba / Profit</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '100px', textAlign: 'center', whiteSpace: 'nowrap' }}>Status</th>
                  <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item, idx) => {
                  const profit = (item.harga_jual || 0) - (item.harga_modal || 0);
                  const itemIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        background: item.aktif ? '#FFFFFF' : '#FAFAFA',
                        opacity: item.aktif ? 1 : 0.65,
                      }}
                    >
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '700', color: '#64748B', fontSize: '12px' }}>
                        #{itemIndex}
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '3px 7px',
                            borderRadius: '4px',
                            background: '#F1F5F9',
                            color: '#475569',
                            textTransform: 'uppercase',
                          }}
                        >
                          {item.kategori_kode}
                        </span>
                      </td>

                      <td style={{ padding: '10px 14px', fontWeight: '700', color: '#0F172A', whiteSpace: 'nowrap' }}>
                        {item.operator}
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: '600', color: '#0F172A' }}>{item.nama_produk}</div>
                        {item.nominal && (
                          <div style={{ fontSize: '11px', color: '#64748B' }}>Nominal: {item.nominal}</div>
                        )}
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#64748B', whiteSpace: 'nowrap' }}>
                        {formatRupiah(item.harga_modal)}
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '700', color: '#0F172A', whiteSpace: 'nowrap' }}>
                        {formatRupiah(item.harga_jual)}
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '700', color: profit >= 0 ? '#059669' : '#DC2626', whiteSpace: 'nowrap' }}>
                        {profit >= 0 ? `+ ${formatRupiah(profit)}` : formatRupiah(profit)}
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleToggle(item)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            border: 'none',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            background: item.aktif ? '#ECFDF5' : '#F1F5F9',
                            color: item.aktif ? '#059669' : '#94A3B8',
                          }}
                        >
                          {item.aktif ? '✓ Aktif' : 'Nonaktif'}
                        </button>
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => openEdit(item)}
                            title="Edit"
                            style={{
                              background: '#F1F5F9',
                              border: 'none',
                              width: '28px',
                              height: '28px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#334155',
                            }}
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.nama_produk)}
                            title="Hapus"
                            style={{
                              background: '#FEE2E2',
                              border: 'none',
                              width: '28px',
                              height: '28px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#DC2626',
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Slide / Pagination Footer Controls */}
        {filteredItems.length > 0 && (
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid #E2E8F0',
              background: '#F8FAFC',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '12.5px',
              color: '#64748B',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Menampilkan</span>
              <span style={{ fontWeight: '700', color: '#0F172A' }}>
                {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredItems.length)}
              </span>
              <span>dari</span>
              <span style={{ fontWeight: '700', color: '#0F172A' }}>{filteredItems.length}</span>
              <span>produk</span>

              <span style={{ margin: '0 8px', color: '#CBD5E1' }}>|</span>

              <span>Per slide:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '3px 8px',
                  borderRadius: '5px',
                  border: '1px solid #CBD5E1',
                  fontSize: '12px',
                  background: '#FFFFFF',
                  color: '#334155',
                  cursor: 'pointer',
                }}
              >
                <option value={5}>5 item</option>
                <option value={6}>6 item</option>
                <option value={8}>8 item</option>
                <option value={10}>10 item</option>
              </select>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: currentPage === 1 ? '#F1F5F9' : '#FFFFFF',
                    color: currentPage === 1 ? '#94A3B8' : '#0F172A',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  ‹ Sebelumnya
                </button>

                {/* Page numbers */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        minWidth: '28px',
                        height: '28px',
                        padding: '0 6px',
                        borderRadius: '6px',
                        border: currentPage === page ? 'none' : '1px solid #CBD5E1',
                        background: currentPage === page ? '#0F172A' : '#FFFFFF',
                        color: currentPage === page ? '#FFFFFF' : '#334155',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: currentPage === totalPages ? '#F1F5F9' : '#FFFFFF',
                    color: currentPage === totalPages ? '#94A3B8' : '#0F172A',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  Berikutnya ›
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Modal Add / Edit PPOB Item */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            backdropFilter: 'blur(3px)',
            padding: '16px',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>
                {editId ? 'Edit Produk PPOB' : 'Tambah Produk PPOB Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#64748B', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                  Kategori Layanan
                </label>
                <select
                  value={formData.kategori_kode}
                  onChange={(e) => setFormData({ ...formData, kategori_kode: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                >
                  <option value="pulsa">Pulsa Seluler</option>
                  <option value="paket_data">Paket Data Internet</option>
                  <option value="listrik">Listrik PLN</option>
                  <option value="ewallet">Top-Up E-Wallet</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                  Operator / Provider (misal: Telkomsel, Indosat, PLN, DANA)
                </label>
                <input
                  type="text"
                  required
                  placeholder="mis. Telkomsel"
                  value={formData.operator}
                  onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                  Nama Produk
                </label>
                <input
                  type="text"
                  required
                  placeholder="mis. Pulsa Telkomsel 50.000"
                  value={formData.nama_produk}
                  onChange={(e) => setFormData({ ...formData, nama_produk: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                    Nominal (opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="mis. 50.000"
                    value={formData.nominal}
                    onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    value={formData.urutan}
                    onChange={(e) => setFormData({ ...formData, urutan: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                    Harga Modal
                  </label>
                  <input
                    type="text"
                    placeholder="Rp 0"
                    value={formData.harga_modal ? `Rp ${Number(formData.harga_modal).toLocaleString('id-ID')}` : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({ ...formData, harga_modal: val ? Number(val) : 0 });
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                    Harga Jual *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Rp 0"
                    value={formData.harga_jual ? `Rp ${Number(formData.harga_jual).toLocaleString('id-ID')}` : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({ ...formData, harga_jual: val ? Number(val) : 0 });
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: '700' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '8px 16px', background: '#F1F5F9', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#475569' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '8px 20px', background: '#03AC0E', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', color: '#FFFFFF' }}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
