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

  return (
    <div>
      <div className="header-row">
        <h2>Kelola Barang</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Tampilkan nonaktif
          </label>
          <button onClick={() => {
          setFormData({id: null, barcode: '', nama_barang: '', harga_modal: 0, harga_jual: 0, stok: 0, satuan: 'pcs', gambar: '', kategori_id: ''});
            setDisplayHargaModal('');
            setDisplayHargaJual('');
            setIsModalOpen(true);
          }}>
            + Tambah Barang
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Gambar</th>
              <th>Barcode</th>
              <th>Nama Barang</th>
              <th>Kategori</th>
              <th>Harga Modal</th>
              <th>Harga Jual</th>
              <th>Stok</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ opacity: item.aktif ? 1 : 0.55 }}>
                <td>
                  {item.gambar ? (
                    <img src={item.gambar} alt={item.nama_barang} style={{width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px'}} />
                  ) : (
                    <div style={{width: '40px', height: '40px', background: '#e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#94a3b8'}}>N/A</div>
                  )}
                </td>
                <td>{item.barcode}</td>
                <td>{item.nama_barang}</td>
                <td>
                  {item.nama_kategori
                    ? <span style={{background:'#EEF2FF',color:'#4F46E5',fontSize:'11px',fontWeight:'700',padding:'3px 8px',borderRadius:'20px'}}>{item.nama_kategori}</span>
                    : <span style={{color:'#CBD5E1',fontSize:'12px'}}>—</span>}
                </td>
                <td>Rp {formatRupiah(item.harga_modal)}</td>
                <td>Rp {formatRupiah(item.harga_jual)}</td>
                <td>{item.stok} {item.satuan}</td>
                <td>
                  {!item.aktif
                    ? <span className="badge" style={{ background: '#E2E8F0', color: '#475569' }}>Nonaktif</span>
                    : item.stok <= 5
                      ? <span className="badge low-stock">Low Stock</span>
                      : <span className="badge in-stock">Good</span>}
                </td>
                <td>
                  <div style={{display: 'flex', gap: '4px'}}>
                    {item.aktif ? (
                      <>
                        <button style={{padding: '6px 10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600'}} onClick={() => openRestockModal(item)}>+ Restock</button>
                        <button className="secondary" style={{padding: '6px 10px', fontSize: '11px', fontWeight: '600', borderRadius: '6px'}} onClick={() => editItem(item)}>Edit</button>
                        <button className="danger" style={{padding: '6px 10px', fontSize: '11px', fontWeight: '600', borderRadius: '6px'}} onClick={() => deleteItem(item.id)}>Hapus</button>
                      </>
                    ) : (
                      <button className="success" style={{padding: '6px 10px', fontSize: '11px', fontWeight: '600', borderRadius: '6px'}} onClick={() => restoreItem(item.id)}>Aktifkan</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxHeight: '90vh', overflowY: 'auto'}}>
            <h3>{formData.id ? 'Edit Barang' : 'Tambah Barang'}</h3>
            <form onSubmit={handleSubmit} style={{marginTop: '20px'}}>
              <div className="form-group">
                <label>Gambar Produk (Opsional)</label>
                {formData.gambar && (
                  <div style={{marginBottom: '10px'}}>
                    <img src={formData.gambar} alt="Preview" style={{height: '100px', borderRadius: '8px', objectFit: 'cover'}} />
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{padding: '8px'}} />
              </div>
              <div className="form-group">
                <label>Kode Barang / SKU</label>
                <input name="barcode" value={formData.barcode} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Nama Barang</label>
                <input name="nama_barang" value={formData.nama_barang} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Harga Modal (Rp)</label>
                <div style={{position: 'relative'}}>
                  <span style={{position: 'absolute', left: '15px', top: '14px', color: '#64748b'}}>Rp</span>
                  <input 
                    type="text" 
                    value={displayHargaModal} 
                    onChange={(e) => handleCurrencyChange(e, 'harga_modal')} 
                    style={{paddingLeft: '45px'}}
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Harga Jual (Rp)</label>
                <div style={{position: 'relative'}}>
                  <span style={{position: 'absolute', left: '15px', top: '14px', color: '#64748b'}}>Rp</span>
                  <input 
                    type="text" 
                    value={displayHargaJual} 
                    onChange={(e) => handleCurrencyChange(e, 'harga_jual')} 
                    style={{paddingLeft: '45px'}}
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Kategori</label>
                <select name="kategori_id" value={formData.kategori_id || ''} onChange={handleChange} style={{width: '100%'}}>
                  <option value="">-- Tanpa Kategori --</option>
                  {kategoriList.map(k => <option key={k.id} value={k.id}>{k.nama_kategori}</option>)}
                </select>
                {kategoriList.length === 0 && <small style={{color:'#94a3b8',marginTop:'4px',display:'block'}}>Belum ada kategori. Tambahkan di menu Pengaturan.</small>}
              </div>
              <div className="form-group" style={{display: 'flex', gap: '15px'}}>
                <div style={{flex: 2}}>
                  <label>Stok Awal</label>
                  <input type="number" name="stok" value={formData.stok} onChange={handleChange} required disabled={!!formData.id} />
                  {formData.id && <small style={{color: '#94a3b8', display: 'block', marginTop: '4px'}}>*Gunakan tombol Restock untuk menambah stok</small>}
                </div>
                <div style={{flex: 1}}>
                  <label>Satuan</label>
                  <select name="satuan" value={formData.satuan} onChange={handleChange} style={{width: '100%'}}>
                    <option value="pcs">Pcs</option>
                    <option value="pack">Pack</option>
                    <option value="lusin">Lusin</option>
                  </select>
                </div>
              </div>
              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px'}}>
                <button type="button" className="secondary" onClick={closeModal}>Batal</button>
                <button type="submit" className="success">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRestockModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '400px'}}>
            <h3>📦 Tambah Stok (Restock)</h3>
            <form onSubmit={handleRestockSubmit} style={{marginTop: '20px'}}>
              <div className="form-group">
                <label>Jumlah Tambah (Qty)</label>
                <input 
                  type="number" 
                  min="1"
                  value={restockData.qty} 
                  onChange={(e) => setRestockData({...restockData, qty: Number(e.target.value)})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Keterangan (Opsional)</label>
                <textarea 
                  rows="3"
                  value={restockData.keterangan} 
                  onChange={(e) => setRestockData({...restockData, keterangan: e.target.value})}
                  placeholder="Contoh: Barang masuk dari Supplier A"
                  style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1'}}
                />
              </div>
              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px'}}>
                <button type="button" className="secondary" onClick={() => setIsRestockModalOpen(false)}>Batal</button>
                <button type="submit" className="success" style={{background: '#3b82f6'}}>Simpan Stok</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
