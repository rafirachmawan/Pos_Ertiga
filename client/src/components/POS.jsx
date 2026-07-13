import React, { useState, useEffect, useRef } from 'react';

const POS = () => {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [amountTendered, setAmountTendered] = useState(0);
  const barcodeRef = useRef(null);

  useEffect(() => {
    fetchItems();
    if(barcodeRef.current) barcodeRef.current.focus();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/barang');
      const data = await res.json();
      if(data.data) setItems(data.data);
    } catch(err) {
      console.error(err);
    }
  };

  const addToCart = (product) => {
    if(product.stok <= 0) {
      alert('Stok barang habis!');
      return;
    }

    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if(existing.qty >= product.stok) {
        alert('Stok tidak mencukupi untuk menambah qty');
        return;
      }
      setCart(cart.map(item => 
        item.id === product.id 
        ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.harga_jual }
        : item
      ));
    } else {
      setCart([...cart, { ...product, qty: 1, subtotal: product.harga_jual }]);
    }
  };

  const handleBarcodeScan = async (e) => {
    e.preventDefault();
    if (!barcodeInput) return;

    try {
      const res = await fetch(`http://localhost:3001/api/barang/barcode/${barcodeInput}`);
      if(res.ok) {
        const data = await res.json();
        addToCart(data.data);
        setBarcodeInput('');
      } else {
        alert('Barang tidak ditemukan');
        setBarcodeInput('');
      }
    } catch(err) {
      console.error(err);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const totalHarga = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const kembalian = amountTendered - totalHarga;

  const checkout = async () => {
    if (cart.length === 0) return alert('Keranjang kosong');
    if (amountTendered < totalHarga) return alert('Uang pembayaran kurang!');

    const payload = {
      total_harga: totalHarga,
      total_bayar: amountTendered,
      total_kembalian: kembalian,
      cart
    };

    try {
      const res = await fetch('http://localhost:3001/api/transaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if(res.ok) {
        alert(`Transaksi Berhasil! Nota: ${data.nomor_nota}`);
        setCart([]);
        setAmountTendered(0);
        fetchItems(); // refresh stock
      } else {
        alert(data.error || 'Terjadi kesalahan saat checkout');
      }
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="pos-layout">
      <div className="pos-products">
        <div className="header-row">
          <h2>Transaksi Kasir</h2>
          <form onSubmit={handleBarcodeScan} style={{display: 'flex', gap: '10px'}}>
            <input 
              ref={barcodeRef}
              type="text" 
              placeholder="Scan Barcode / SKU..." 
              value={barcodeInput} 
              onChange={e => setBarcodeInput(e.target.value)}
              style={{width: '300px'}}
            />
            <button type="submit">Cari</button>
          </form>
        </div>

        <div className="product-grid">
          {items.map(item => (
            <div key={item.id} className="product-card" onClick={() => addToCart(item)}>
              <div style={{width: '100%', height: '140px', marginBottom: '15px', borderRadius: '10px', overflow: 'hidden', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                {item.gambar ? (
                  <img src={item.gambar} alt={item.nama_barang} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                ) : (
                  <span style={{color: '#94A3B8', fontSize: '14px', fontWeight: '500'}}>No Image</span>
                )}
              </div>
              <h4 style={{minHeight: '44px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', width: '100%'}}>{item.nama_barang}</h4>
              <div style={{marginTop: 'auto', width: '100%'}}>
                <p className="price" style={{marginBottom: '10px'}}>
                  Rp {item.harga_jual.toLocaleString('id-ID')}
                </p>
                <span className={`badge ${item.stok > 0 ? 'in-stock' : 'low-stock'}`}>
                  Sisa Stok: {item.stok} {item.satuan}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pos-cart">
        <h3 className="cart-title">Keranjang</h3>
        <div className="cart-items">
          {cart.length === 0 ? <p style={{textAlign: 'center', color: '#999', marginTop: '20px'}}>Keranjang masih kosong</p> : null}
          {cart.map(item => (
            <div key={item.id} className="cart-item">
              <div style={{flex: 1}}>
                <div className="cart-item-name">{item.nama_barang}</div>
                <div className="cart-item-details">
                  {item.qty} x Rp {item.harga_jual.toLocaleString('id-ID')}
                </div>
              </div>
              <div className="cart-item-price">
                Rp {item.subtotal.toLocaleString('id-ID')}
              </div>
              <button className="danger" style={{padding: '5px 10px', fontSize: '12px'}} onClick={() => removeFromCart(item.id)}>X</button>
            </div>
          ))}
        </div>
        
        <div className="cart-totals">
          <div className="cart-row">
            <span>Total:</span>
            <span>Rp {totalHarga.toLocaleString('id-ID')}</span>
          </div>
          <div className="cart-row" style={{alignItems: 'center'}}>
            <span>Bayar:</span>
            <div style={{position: 'relative', width: '160px'}}>
              <span style={{position: 'absolute', left: '15px', top: '14px', color: '#64748B', fontWeight: '500'}}>Rp</span>
              <input 
                type="text" 
                value={amountTendered ? amountTendered.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ''} 
                onChange={e => setAmountTendered(Number(e.target.value.replace(/[^0-9]/g, '')))}
                style={{width: '100%', paddingLeft: '45px', textAlign: 'right', fontWeight: '600', color: 'var(--primary-color)'}}
                placeholder="0"
              />
            </div>
          </div>
          <div className="cart-row grand-total">
            <span>Kembali:</span>
            <span style={{color: kembalian < 0 ? 'var(--danger-color)' : 'var(--success-color)'}}>
              Rp {kembalian.toLocaleString('id-ID')}
            </span>
          </div>
          <button 
            className="success" 
            style={{width: '100%', marginTop: '20px', padding: '15px', fontSize: '16px'}}
            onClick={checkout}
            disabled={cart.length === 0}
          >
            Selesaikan Transaksi
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;
