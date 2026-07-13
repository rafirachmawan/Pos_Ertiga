import React, { useState, useEffect } from 'react';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null, barcode: '', nama_barang: '', harga_modal: 0, harga_jual: 0, stok: 0
  });

  const fetchItems = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/barang');
      const data = await res.json();
      if(data.data) setItems(data.data);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = formData.id ? `http://localhost:3001/api/barang/${formData.id}` : 'http://localhost:3001/api/barang';
    const method = formData.id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if(res.ok) {
        setIsModalOpen(false);
        setFormData({id: null, barcode: '', nama_barang: '', harga_modal: 0, harga_jual: 0, stok: 0});
        fetchItems();
      } else {
        alert('Gagal menyimpan');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const editItem = (item) => {
    setFormData(item);
    setIsModalOpen(true);
  }

  const deleteItem = async (id) => {
    if(!window.confirm('Yakin ingin menghapus barang ini?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/barang/${id}`, { method: 'DELETE' });
      if(res.ok) fetchItems();
    } catch(err) {
      console.error(err);
    }
  }

  return (
    <div>
      <div className="header-row">
        <h2>Kelola Barang</h2>
        <button onClick={() => { setFormData({id: null, barcode: '', nama_barang: '', harga_modal: 0, harga_jual: 0, stok: 0}); setIsModalOpen(true); }}>
          + Tambah Barang
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Barcode</th>
              <th>Nama Barang</th>
              <th>Harga Modal</th>
              <th>Harga Jual</th>
              <th>Stok</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>{item.barcode}</td>
                <td>{item.nama_barang}</td>
                <td>Rp {item.harga_modal.toLocaleString('id-ID')}</td>
                <td>Rp {item.harga_jual.toLocaleString('id-ID')}</td>
                <td>{item.stok}</td>
                <td>
                  {item.stok <= 5 
                    ? <span className="badge low-stock">Low Stock</span> 
                    : <span className="badge in-stock">Good</span>}
                </td>
                <td>
                  <button className="secondary" style={{padding: '5px 10px', marginRight: '5px'}} onClick={() => editItem(item)}>Edit</button>
                  <button className="danger" style={{padding: '5px 10px'}} onClick={() => deleteItem(item.id)}>Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{formData.id ? 'Edit Barang' : 'Tambah Barang'}</h3>
            <form onSubmit={handleSubmit} style={{marginTop: '20px'}}>
              <div className="form-group">
                <label>Barcode / SKU</label>
                <input name="barcode" value={formData.barcode} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Nama Barang</label>
                <input name="nama_barang" value={formData.nama_barang} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Harga Modal</label>
                <input type="number" name="harga_modal" value={formData.harga_modal} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Harga Jual</label>
                <input type="number" name="harga_jual" value={formData.harga_jual} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Stok Awal</label>
                <input type="number" name="stok" value={formData.stok} onChange={handleChange} required />
              </div>
              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px'}}>
                <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>Batal</button>
                <button type="submit" className="success">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
