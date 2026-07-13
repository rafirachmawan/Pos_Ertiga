import React, { useState, useEffect, useRef } from 'react';

const POS = () => {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [amountTendered, setAmountTendered] = useState(0);
  const [diskon, setDiskon] = useState(0);
  const [namaPelanggan, setNamaPelanggan] = useState('');
  const [struk, setStruk] = useState(null); // null = modal tertutup
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

  // Filter produk berdasarkan search query
  const filteredItems = items.filter(item =>
    item.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.barcode.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // Update qty dari input keranjang (+ dan -)
  const updateQty = (id, delta) => {
    const cartItem = cart.find(item => item.id === id);
    const product = items.find(item => item.id === id);
    if (!cartItem || !product) return;

    const newQty = cartItem.qty + delta;
    if (newQty <= 0) {
      removeFromCart(id);
      return;
    }
    if (newQty > product.stok) {
      alert('Stok tidak mencukupi!');
      return;
    }
    setCart(cart.map(item =>
      item.id === id
      ? { ...item, qty: newQty, subtotal: newQty * item.harga_jual }
      : item
    ));
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
  const totalSetelahDiskon = Math.max(0, totalHarga - diskon);
  const kembalian = amountTendered - totalSetelahDiskon;

  const checkout = async () => {
    if (cart.length === 0) return alert('Keranjang kosong');
    if (amountTendered < totalSetelahDiskon) return alert('Uang pembayaran kurang!');

    const payload = {
      total_harga: totalSetelahDiskon,
      total_bayar: amountTendered,
      total_kembalian: kembalian,
      diskon,
      nama_pelanggan: namaPelanggan.trim() || 'Umum',
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
        // Simpan data struk sebelum dikosongkan
        setStruk({
          nomor_nota: data.nomor_nota,
          nama_pelanggan: namaPelanggan.trim() || 'Umum',
          tanggal: new Date().toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          items: [...cart],
          subtotal: totalHarga,
          diskon,
          total: totalSetelahDiskon,
          bayar: amountTendered,
          kembalian,
        });
        setCart([]);
        setAmountTendered(0);
        setDiskon(0);
        setNamaPelanggan('');
        fetchItems();
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
        {/* Header: Title + Barcode + Search */}
        <div className="header-row" style={{flexWrap: 'wrap', gap: '12px'}}>
          <h2>Transaksi Kasir</h2>
          <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center'}}>
            {/* Search produk */}
            <div style={{position: 'relative'}}>
              <span style={{position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '16px'}}>🔍</span>
              <input
                type="text"
                placeholder="Cari nama produk..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{width: '220px', paddingLeft: '40px'}}
              />
            </div>
            {/* Barcode scan */}
            <form onSubmit={handleBarcodeScan} style={{display: 'flex', gap: '10px'}}>
              <input
                ref={barcodeRef}
                type="text"
                placeholder="Scan Barcode / SKU..."
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                style={{width: '220px'}}
              />
              <button type="submit">Cari</button>
            </form>
          </div>
        </div>

        {/* Hasil pencarian info */}
        {searchQuery && (
          <div style={{marginBottom: '10px', fontSize: '13px', color: 'var(--text-muted)'}}>
            Menampilkan <strong>{filteredItems.length}</strong> produk untuk "<strong>{searchQuery}</strong>"
            <button
              onClick={() => setSearchQuery('')}
              style={{marginLeft: '10px', padding: '2px 10px', fontSize: '12px', background: '#F1F5F9', color: '#64748B', boxShadow: 'none', borderRadius: '20px'}}
            >✕ Reset</button>
          </div>
        )}

        <div className="product-grid">
          {filteredItems.length === 0 ? (
            <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)'}}>
              <div style={{fontSize: '40px', marginBottom: '12px'}}>🔍</div>
              <p style={{fontWeight: '600', fontSize: '16px'}}>Produk tidak ditemukan</p>
              <p style={{fontSize: '13px', marginTop: '6px'}}>Coba kata kunci lain</p>
            </div>
          ) : (
            filteredItems.map(item => (
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
            ))
          )}
        </div>
      </div>

      <div className="pos-cart">
        <h3 className="cart-title">Keranjang</h3>

        {/* Input Nama Pelanggan */}
        <div style={{ padding: '0 0 12px', borderBottom: '1px solid var(--border-color)', marginBottom: '12px' }}>
          <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Nama Pelanggan</label>
          <input
            type="text"
            placeholder="Ketik nama pelanggan (opsional)..."
            value={namaPelanggan}
            onChange={e => setNamaPelanggan(e.target.value)}
            style={{ width: '100%', fontSize: '13px', padding: '8px 12px' }}
          />
        </div>

        <div className="cart-items">
          {cart.length === 0
            ? <p style={{textAlign: 'center', color: '#999', marginTop: '40px', fontSize: '14px'}}>🛒 Keranjang masih kosong</p>
            : null}
          {cart.map(item => (
            <div key={item.id} className="cart-item">
              <div style={{flex: 1, minWidth: 0}}>
                <div className="cart-item-name" style={{fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{item.nama_barang}</div>
                <div className="cart-item-details" style={{marginTop: '6px'}}>
                  Rp {item.harga_jual.toLocaleString('id-ID')}
                </div>
              </div>

              {/* Qty Controls */}
              <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '10px'}}>
                <button
                  onClick={(e) => { e.stopPropagation(); updateQty(item.id, -1); }}
                  style={{padding: '4px 9px', fontSize: '16px', background: '#F1F5F9', color: '#334155', boxShadow: 'none', borderRadius: '8px', lineHeight: 1, minWidth: '30px'}}
                >−</button>
                <span style={{fontWeight: '700', fontSize: '15px', minWidth: '24px', textAlign: 'center', color: 'var(--text-dark)'}}>{item.qty}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); updateQty(item.id, 1); }}
                  style={{padding: '4px 9px', fontSize: '16px', background: 'var(--primary-color)', color: 'white', boxShadow: 'none', borderRadius: '8px', lineHeight: 1, minWidth: '30px'}}
                >+</button>
              </div>

              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: '10px', gap: '4px'}}>
                <div className="cart-item-price" style={{margin: 0, fontSize: '14px'}}>
                  Rp {item.subtotal.toLocaleString('id-ID')}
                </div>
                <button
                  className="danger"
                  style={{padding: '3px 8px', fontSize: '11px', boxShadow: 'none', borderRadius: '6px'}}
                  onClick={() => removeFromCart(item.id)}
                >Hapus</button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-totals">
          <div className="cart-row">
            <span>Subtotal:</span>
            <span>Rp {totalHarga.toLocaleString('id-ID')}</span>
          </div>
          <div className="cart-row" style={{alignItems: 'center'}}>
            <span>Diskon:</span>
            <div style={{position: 'relative', width: '160px'}}>
              <span style={{position: 'absolute', left: '15px', top: '14px', color: '#64748B', fontWeight: '500'}}>Rp</span>
              <input
                type="text"
                value={diskon ? diskon.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ''}
                onChange={e => setDiskon(Number(e.target.value.replace(/[^0-9]/g, '')))}
                style={{width: '100%', paddingLeft: '45px', textAlign: 'right', fontWeight: '600', color: 'var(--danger-color)'}}
                placeholder="0"
              />
            </div>
          </div>
          {diskon > 0 && (
            <div className="cart-row" style={{fontWeight: '700', color: 'var(--text-dark)'}}>
              <span>Total:</span>
              <span>Rp {totalSetelahDiskon.toLocaleString('id-ID')}</span>
            </div>
          )}
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
      {/* ===== MODAL STRUK ===== */}
      {struk && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px',
            width: '360px', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            fontFamily: "'Courier New', monospace"
          }}>

            {/* Header Struk */}
            <div style={{ background: 'linear-gradient(135deg, #1E293B, #312E81)', color: 'white', borderRadius: '20px 20px 0 0', padding: '24px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🛍️</div>
              <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '2px' }}>POS ERTIGA</div>
              <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px' }}>Point of Sale</div>
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed rgba(255,255,255,0.2)', fontSize: '11px', opacity: 0.7 }}>{struk.tanggal}</div>
              <div style={{ fontSize: '13px', fontWeight: '700', marginTop: '4px', color: '#A5B4FC' }}>{struk.nomor_nota}</div>
            </div>

            {/* Body */}
            <div style={{ padding: '20px' }}>

              {/* Info Pelanggan */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px dashed #E2E8F0' }}>
                <span style={{ color: '#64748B' }}>Pelanggan</span>
                <span style={{ fontWeight: '700', color: '#1E293B' }}>{struk.nama_pelanggan}</span>
              </div>

              {/* Daftar Barang */}
              <div style={{ fontSize: '12px', marginBottom: '16px' }}>
                <div style={{ fontWeight: '700', color: '#64748B', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px', marginBottom: '10px' }}>Rincian Pesanan</div>
                {struk.items.map((item, i) => (
                  <div key={i} style={{ marginBottom: '10px' }}>
                    <div style={{ fontWeight: '600', color: '#1E293B', fontSize: '13px' }}>{item.nama_barang}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px', color: '#64748B' }}>
                      <span>{item.qty} × Rp {item.harga_jual.toLocaleString('id-ID')}</span>
                      <span style={{ fontWeight: '600', color: '#1E293B' }}>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '14px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#64748B' }}>
                  <span>Subtotal</span>
                  <span>Rp {struk.subtotal.toLocaleString('id-ID')}</span>
                </div>
                {struk.diskon > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#EF4444' }}>
                    <span>Diskon</span>
                    <span>− Rp {struk.diskon.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '16px', color: '#1E293B', paddingTop: '10px', borderTop: '2px solid #1E293B', marginBottom: '12px' }}>
                  <span>TOTAL</span>
                  <span>Rp {struk.total.toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#64748B' }}>
                  <span>Bayar</span>
                  <span>Rp {struk.bayar.toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#059669', fontSize: '14px' }}>
                  <span>Kembali</span>
                  <span>Rp {struk.kembalian.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Footer pesan */}
              <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed #E2E8F0', color: '#94A3B8', fontSize: '11px', lineHeight: 1.8 }}>
                ✨ Terima kasih sudah berbelanja! ✨
                <br />Semoga puas dengan produk kami.
              </div>

              {/* Tombol Aksi */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  onClick={() => setStruk(null)}
                  style={{ flex: 1, padding: '12px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}
                >
                  Tutup
                </button>
                <button
                  onClick={() => window.print()}
                  style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #4F46E5, #6366F1)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}
                >
                  🖨️ Print
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
