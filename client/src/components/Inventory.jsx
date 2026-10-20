import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

// Helper: Format number to "Rp X.XXX"
const formatRupiah = (number) => {
  if (!number && number !== 0) return '';
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Helper: Remove non-numeric characters for raw value
const parseRupiah = (str) => {
  return Number(str.replace(/[^0-9]/g, ''));
};

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockData, setRestockData] = useState({ barang_id: null, qty: 1, keterangan: '' });
  const [formData, setFormData] = useState({
    id: null, barcode: '', nama_barang: '', harga_modal: 0, harga_jual: 0, stok: 0, satuan: 'pcs', gambar: '', kategori_id: ''
  });

  // Display strings for inputs
  const [displayHargaModal, setDisplayHargaModal] = useState('');
  const [displayHargaJual, setDisplayHargaJual] = useState('');

  const fetchItems = async () => {
    try {
      const data = await api(`/api/barang${showInactive ? '?semua=1' : ''}`);
      if (data.data) setItems(data.data);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  useEffect(() => {
    fetchItems();
    api('/api/kategori')
      .then((d) => {
        if (d.data) setKategoriList(d.data);
      })
      .catch(console.error);
  }, [showInactive]);

  const handleCurrencyChange = (e, field) => {
    const rawValue = parseRupiah(e.target.value);
    setFormData({...formData, [field]: rawValue});
    if (field === 'harga_modal') setDisplayHargaModal(formatRupiah(rawValue));
    if (field === 'harga_jual') setDisplayHargaJual(formatRupiah(rawValue));
  };

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  }

  const compressImage = (file, maxSize = 900, quality = 0.82) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Gambar tidak dapat dibaca'));
      };

      image.src = objectUrl;
    });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      setFormData((current) => ({ ...current, gambar: compressed }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = formData.id ? `/api/barang/${formData.id}` : '/api/barang';
    const method = formData.id ? 'PUT' : 'POST';

    try {
      await api(url, { method, body: formData });
      closeModal();
      fetchItems();
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    }
  };

  const editItem = (item) => {
    setFormData(item);
    setDisplayHargaModal(formatRupiah(item.harga_modal));
    setDisplayHargaJual(formatRupiah(item.harga_jual));
    setIsModalOpen(true);
  }

  const closeModal = () => {
    setFormData({id: null, barcode: '', nama_barang: '', harga_modal: 0, harga_jual: 0, stok: 0, satuan: 'pcs', gambar: '', kategori_id: ''});
    setDisplayHargaModal('');
    setDisplayHargaJual('');
    setIsModalOpen(false);
  }

  const openRestockModal = (item) => {
    setRestockData({ barang_id: item.id, qty: 1, keterangan: `Restock ${item.nama_barang}` });
    setIsRestockModalOpen(true);
  }

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    try {
      await api('/api/stok-masuk', { method: 'POST', body: restockData });
      setIsRestockModalOpen(false);
      fetchItems();
      alert('Stok berhasil ditambahkan!');
    } catch (err) {
      alert('Gagal menambah stok: ' + err.message);
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Yakin ingin menghapus barang ini?')) return;
    try {
      const result = await api(`/api/barang/${id}`, { method: 'DELETE' });
      alert(result.message || 'Barang dihapus');
      fetchItems();
    } catch (err) {
      alert(err.message);
    }
  };

  const restoreItem = async (id) => {
    try {
      await api(`/api/barang/${id}/restore`, { method: 'POST' });
      fetchItems();
    } catch (err) {
      alert(err.message);
    }
  };

  // Shared button base style
  const actionBtn = {
    padding: '5px 10px',
    fontSize: '11.5px',
    fontWeight: '600',
    borderRadius: '6px',
    cursor: 'pointer',
    border: '1px solid #E2E8F0',
    boxShadow: 'none',
    transition: 'all 0.15s ease'
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>Kelola Barang</h2>
          <p style={{ color: '#64748B', marginTop: '4px', fontSize: '13px' }}>Kelola inventaris dan stok produk</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12.5px',
            color: '#64748B',
            cursor: 'pointer',
            fontWeight: '500'
          }}>
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              style={{ boxShadow: 'none' }}
            />
            Tampilkan nonaktif
          </label>
          <button
            onClick={() => {
              setFormData({id: null, barcode: '', nama_barang: '', harga_modal: 0, harga_jual: 0, stok: 0, satuan: 'pcs', gambar: '', kategori_id: ''});
              setDisplayHargaModal('');
              setDisplayHargaJual('');
              setIsModalOpen(true);
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
              boxShadow: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            + Tambah Barang
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Gambar','Barcode','Nama Barang','Kategori','Harga Modal','Harga Jual','Stok','Status','Aksi'].map(h => (
                <th key={h} style={{
                  padding: '12px 16px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  textAlign: 'left',
                  borderBottom: '1px solid #E2E8F0',
                  background: '#FAFBFC'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '48px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                  Belum ada data barang
                </td>
              </tr>
            ) : items.map(item => (
              <tr key={item.id} style={{ opacity: item.aktif ? 1 : 0.5, transition: 'opacity 0.15s' }}>
                <td style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9' }}>
                  {item.gambar ? (
                    <img src={item.gambar} alt={item.nama_barang} style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px', display: 'block' }} />
                  ) : (
                    <div style={{ width: '36px', height: '36px', background: '#F1F5F9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                  )}
                </td>
                <td style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9', fontSize: '12.5px', fontWeight: '500', color: '#64748B', fontFamily: 'monospace' }}>
                  {item.barcode}
                </td>
                <td style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9', fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>
                  {item.nama_barang}
                </td>
                <td style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9' }}>
                  {item.nama_kategori
                    ? <span style={{ background: '#F1F5F9', color: '#475569', fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px' }}>{item.nama_kategori}</span>
                    : <span style={{ color: '#CBD5E1', fontSize: '12px' }}>—</span>}
                </td>
                <td style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9', fontSize: '12.5px', color: '#64748B' }}>
                  Rp {formatRupiah(item.harga_modal)}
                </td>
                <td style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9', fontSize: '12.5px', fontWeight: '700', color: '#0F172A' }}>
                  Rp {formatRupiah(item.harga_jual)}
                </td>
                <td style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9', fontSize: '12.5px', fontWeight: '600', color: item.stok <= 5 ? '#DC2626' : '#0F172A' }}>
                  {item.stok} {item.satuan}
                </td>
                <td style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9' }}>
                  {!item.aktif ? (
                    <span style={{
                      fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '4px',
                      background: '#F1F5F9', color: '#64748B'
                    }}>Nonaktif</span>
                  ) : item.stok <= 5 ? (
                    <span style={{
                      fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '4px',
                      background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA'
                    }}>Stok Rendah</span>
                  ) : (
                    <span style={{
                      fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '4px',
                      background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0'
                    }}>Tersedia</span>
                  )}
                </td>
                <td style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {item.aktif ? (
                      <>
                        <button
                          onClick={() => openRestockModal(item)}
                          style={{ ...actionBtn, background: '#FFFFFF', color: '#2563EB', borderColor: '#BFDBFE' }}
                        >Restock</button>
                        <button
                          onClick={() => editItem(item)}
                          style={{ ...actionBtn, background: '#FFFFFF', color: '#475569' }}
                        >Edit</button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          style={{ ...actionBtn, background: '#FFFFFF', color: '#DC2626', borderColor: '#FECACA' }}
                        >Hapus</button>
                      </>
                    ) : (
                      <button
                        onClick={() => restoreItem(item.id)}
                        style={{ ...actionBtn, background: '#0F172A', color: '#FFFFFF', borderColor: '#0F172A' }}
                      >Aktifkan</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Tambah/Edit */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto', padding: '28px 32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', margin: '0 0 20px 0' }}>{formData.id ? 'Edit Barang' : 'Tambah Barang Baru'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Gambar Produk (Opsional)</label>
                {formData.gambar && (
                  <div style={{ marginBottom: '10px' }}>
                    <img src={formData.gambar} alt="Preview" style={{ height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ padding: '8px', boxShadow: 'none' }} />
              </div>
              <div className="form-group">
                <label>Kode Barang / SKU</label>
                <input name="barcode" value={formData.barcode} onChange={handleChange} required style={{ boxShadow: 'none' }} />
              </div>
              <div className="form-group">
                <label>Nama Barang</label>
                <input name="nama_barang" value={formData.nama_barang} onChange={handleChange} required style={{ boxShadow: 'none' }} />
              </div>
              <div className="form-group">
                <label>Harga Modal (Rp)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '15px', top: '14px', color: '#94A3B8', fontSize: '14px' }}>Rp</span>
                  <input
                    type="text"
                    value={displayHargaModal}
                    onChange={(e) => handleCurrencyChange(e, 'harga_modal')}
                    style={{ paddingLeft: '45px', boxShadow: 'none' }}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Harga Jual (Rp)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '15px', top: '14px', color: '#94A3B8', fontSize: '14px' }}>Rp</span>
                  <input
                    type="text"
                    value={displayHargaJual}
                    onChange={(e) => handleCurrencyChange(e, 'harga_jual')}
                    style={{ paddingLeft: '45px', boxShadow: 'none' }}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Kategori</label>
                <select name="kategori_id" value={formData.kategori_id || ''} onChange={handleChange} style={{ width: '100%', boxShadow: 'none' }}>
                  <option value="">-- Tanpa Kategori --</option>
                  {kategoriList.map(k => <option key={k.id} value={k.id}>{k.nama_kategori}</option>)}
                </select>
                {kategoriList.length === 0 && <small style={{ color: '#94A3B8', marginTop: '4px', display: 'block' }}>Belum ada kategori. Tambahkan di menu Master Data.</small>}
              </div>
              <div className="form-group" style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 2 }}>
                  <label>Stok Awal</label>
                  <input type="number" name="stok" value={formData.stok} onChange={handleChange} required disabled={!!formData.id} style={{ boxShadow: 'none' }} />
                  {formData.id && <small style={{ color: '#94A3B8', display: 'block', marginTop: '4px' }}>Gunakan tombol Restock untuk menambah stok</small>}
                </div>
                <div style={{ flex: 1 }}>
                  <label>Satuan</label>
                  <select name="satuan" value={formData.satuan} onChange={handleChange} style={{ width: '100%', boxShadow: 'none' }}>
                    <option value="pcs">Pcs</option>
                    <option value="pack">Pack</option>
                    <option value="lusin">Lusin</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={closeModal} style={{
                  padding: '9px 18px', background: '#FFFFFF', color: '#475569', border: '1px solid #E2E8F0',
                  borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', boxShadow: 'none'
                }}>Batal</button>
                <button type="submit" style={{
                  padding: '9px 18px', background: '#0F172A', color: '#FFFFFF', border: 'none',
                  borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', boxShadow: 'none'
                }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Restock */}
      {isRestockModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', padding: '28px 32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', margin: '0 0 20px 0' }}>Tambah Stok (Restock)</h3>
            <form onSubmit={handleRestockSubmit}>
              <div className="form-group">
                <label>Jumlah Tambah (Qty)</label>
                <input
                  type="number"
                  min="1"
                  value={restockData.qty}
                  onChange={(e) => setRestockData({...restockData, qty: Number(e.target.value)})}
                  required
                  style={{ boxShadow: 'none' }}
                />
              </div>
              <div className="form-group">
                <label>Keterangan (Opsional)</label>
                <textarea
                  rows="3"
                  value={restockData.keterangan}
                  onChange={(e) => setRestockData({...restockData, keterangan: e.target.value})}
                  placeholder="Contoh: Barang masuk dari Supplier A"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', boxShadow: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={() => setIsRestockModalOpen(false)} style={{
                  padding: '9px 18px', background: '#FFFFFF', color: '#475569', border: '1px solid #E2E8F0',
                  borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', boxShadow: 'none'
                }}>Batal</button>
                <button type="submit" style={{
                  padding: '9px 18px', background: '#2563EB', color: '#FFFFFF', border: 'none',
                  borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', boxShadow: 'none'
                }}>Simpan Stok</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
