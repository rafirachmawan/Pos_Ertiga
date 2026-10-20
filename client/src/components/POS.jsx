import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { Receipt, ReceiptPrintPortal } from './Receipt';
import { printCurrentReceipt } from '../lib/print';

const makeClientRef = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const POS = () => {
  const [items, setItems] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [activeKategori, setActiveKategori] = useState('');
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [amountTendered, setAmountTendered] = useState(0);
  const [diskon, setDiskon] = useState(0);
  const [namaPelanggan, setNamaPelanggan] = useState('');
  const [metodePembayaran, setMetodePembayaran] = useState('Tunai');
  const [struk, setStruk] = useState(null); // null = modal tertutup
  const [heldCarts, setHeldCarts] = useState([]);
  const [pengaturan, setPengaturan] = useState({});
  const barcodeRef = useRef(null);
  const clientRefRef = useRef(null);

  useEffect(() => {
    fetchItems();
    Promise.all([api('/api/kategori'), api('/api/pengaturan')])
      .then(([kategori, setting]) => {
        if (kategori.data) setKategoriList(kategori.data);
        if (setting.data) setPengaturan(setting.data);
      })
      .catch((err) => console.error(err));
    if (barcodeRef.current) barcodeRef.current.focus();
  }, []);

  useEffect(() => {
    if (!struk || !Number(pengaturan.auto_print)) return undefined;

    const timer = setTimeout(() => {
      printCurrentReceipt({
        lebar: Number(pengaturan.lebar_struk) || 80,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [struk, pengaturan.auto_print, pengaturan.lebar_struk]);

  const fetchItems = async () => {
    try {
      const data = await api('/api/barang');
      if (data.data) setItems(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter produk berdasarkan search query dan kategori
  const filteredItems = items.filter(item => {
    const matchSearch = item.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) || item.barcode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchKategori = activeKategori === '' || String(item.kategori_id) === String(activeKategori);
    return matchSearch && matchKategori;
  });

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
      const data = await api(`/api/barang/barcode/${encodeURIComponent(barcodeInput)}`);
      addToCart(data.data);
      setBarcodeInput('');
    } catch (err) {
      alert(err.message || 'Barang tidak ditemukan');
      setBarcodeInput('');
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const totalHarga = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalSetelahDiskon = Math.max(0, totalHarga - diskon);
  const kembalian = amountTendered - totalSetelahDiskon;

  // --- HOLD TRANSACTIONS ---
  const handleHoldCart = () => {
    if (cart.length === 0) return;
    const newHold = {
      id: Date.now(),
      waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      cart: [...cart],
      namaPelanggan: namaPelanggan.trim() || 'Pelanggan ' + (heldCarts.length + 1)
    };
    setHeldCarts(prev => [...prev, newHold]);
    setCart([]);
    setNamaPelanggan('');
    setDiskon(0);
    setAmountTendered(0);
  };

  const handleLoadHold = (holdId) => {
    const hold = heldCarts.find(h => h.id === holdId);
    if (!hold) return;

    if (cart.length > 0) {
      if (!window.confirm('Keranjang saat ini tidak kosong. Pindahkan keranjang aktif ke antrean hold dulu?')) return;
      const currentHold = {
        id: Date.now(),
        waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        cart: [...cart],
        namaPelanggan: namaPelanggan.trim() || 'Pelanggan ' + (heldCarts.length + 1)
      };
      setHeldCarts(prev => [...prev.filter(h => h.id !== holdId), currentHold]);
    } else {
      setHeldCarts(prev => prev.filter(h => h.id !== holdId));
    }

    setCart(hold.cart);
    setNamaPelanggan(hold.namaPelanggan.startsWith('Pelanggan ') ? '' : hold.namaPelanggan);
    setDiskon(0);
    setAmountTendered(0);
  };

  const handleDeleteHold = (holdId, nama) => {
    if (window.confirm(`Hapus transaksi tersimpan untuk "${nama}"?`)) {
      setHeldCarts(prev => prev.filter(h => h.id !== holdId));
    }
  };

  const checkout = async () => {
    if (cart.length === 0) return alert('Keranjang kosong');
    if (diskon > totalHarga) return alert('Diskon melebihi subtotal!');
    if (amountTendered < totalSetelahDiskon) return alert('Uang pembayaran kurang!');

    // client_ref membuat checkout idempoten: klik ganda / retry tidak
    // menghasilkan nota dan potongan stok ganda.
    if (!clientRefRef.current) clientRefRef.current = makeClientRef();

    const payload = {
      total_bayar: amountTendered,
      diskon,
      nama_pelanggan: namaPelanggan.trim() || 'Umum',
      metode_pembayaran: metodePembayaran,
      client_ref: clientRefRef.current,
      cart: cart.map((item) => ({ id: item.id, qty: item.qty })),
    };

    try {
      const data = await api('/api/transaksi', {
        method: 'POST',
        body: payload,
      });

      // Simpan data struk sebelum keranjang dikosongkan.
      setStruk({
        nomor_nota: data.nomor_nota,
        nama_pelanggan: namaPelanggan.trim() || 'Umum',
        tanggal: new Date().toLocaleString('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        items: [...cart],
        subtotal: data.subtotal ?? totalHarga,
        diskon: data.diskon ?? diskon,
        total: data.total_harga ?? totalSetelahDiskon,
        bayar: data.total_bayar ?? amountTendered,
        kembalian: data.total_kembalian ?? kembalian,
        metode_pembayaran: metodePembayaran,
      });

      clientRefRef.current = null;
      setCart([]);
      setAmountTendered(0);
      setDiskon(0);
      setNamaPelanggan('');
      setMetodePembayaran('Tunai');
      fetchItems();
    } catch (err) {
      alert(err.message || 'Terjadi kesalahan saat checkout');
    }
  };

  const handlePrint = () =>
    printCurrentReceipt({ lebar: Number(pengaturan.lebar_struk) || 80 });

  return (
    <div className="pos-layout">
      <div className="pos-products">
        {/* Header Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
                Transaksi Kasir
              </h2>
              {heldCarts.length > 0 && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#92400E',
                  background: '#FEF3C7',
                  border: '1px solid #FCD34D',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  {heldCarts.length} Antrean Hold
                </span>
              )}
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0 0' }}>
              Pilih produk atau scan barcode untuk transaksi
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Search produk */}
            <div style={{ position: 'relative', width: '210px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Cari nama produk..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 34px', fontSize: '13px', borderRadius: '8px', border: '1px solid #E2E8F0', height: '36px', boxSizing: 'border-box' }}
              />
            </div>

            {/* Barcode scan */}
            <form onSubmit={handleBarcodeScan} style={{ display: 'flex', gap: '6px' }}>
              <input
                ref={barcodeRef}
                type="text"
                placeholder="Scan Barcode / SKU..."
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                style={{ width: '190px', padding: '8px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid #E2E8F0', height: '36px', boxSizing: 'border-box' }}
              />
              <button
                type="submit"
                style={{ height: '36px', padding: '0 16px', background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Scan
              </button>
            </form>
          </div>
        </div>

        {/* Antrean Transaksi Tertunda (Hold) Banner */}
        {heldCarts.length > 0 && (
          <div style={{
            background: '#FFFDF5',
            border: '1px solid #FCD34D',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '14px',
            boxShadow: '0 1px 3px rgba(217, 119, 6, 0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  background: '#D97706',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}>
                  Hold ({heldCarts.length})
                </span>
                <span style={{ fontSize: '13px', color: '#92400E', fontWeight: '700' }}>
                  Transaksi Disimpan Sementara
                </span>
              </div>
              <span style={{ fontSize: '11.5px', color: '#B45309' }}>
                Pilih transaksi untuk dikembalikan ke keranjang
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
              {heldCarts.map((h) => {
                const totalItem = h.cart.reduce((sum, item) => sum + item.qty, 0);
                const totalNominal = h.cart.reduce((sum, item) => sum + (item.harga_jual * item.qty), 0);
                return (
                  <div
                    key={h.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #FDE68A',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {h.namaPelanggan}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                        {totalItem} item · <strong style={{ color: '#0F172A' }}>Rp {totalNominal.toLocaleString('id-ID')}</strong> · {h.waktu}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleLoadHold(h.id)}
                        style={{
                          background: '#2563EB',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '5px 11px',
                          fontSize: '11.5px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Buka
                      </button>
                      <button
                        onClick={() => handleDeleteHold(h.id, h.namaPelanggan)}
                        title="Hapus hold"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#94A3B8',
                          fontSize: '13px',
                          cursor: 'pointer',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          lineHeight: 1
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab Kategori */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '14px', borderBottom: '1px solid #E2E8F0' }}>
          <button
            onClick={() => setActiveKategori('')}
            style={{
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: '600',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: activeKategori === '' ? '#0F172A' : '#E2E8F0',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              background: activeKategori === '' ? '#0F172A' : '#FFFFFF',
              color: activeKategori === '' ? '#FFFFFF' : '#64748B'
            }}
          >
            Semua Produk
          </button>
          {kategoriList.map(k => (
            <button
              key={k.id}
              onClick={() => setActiveKategori(String(k.id))}
              style={{
                padding: '6px 14px',
                fontSize: '12.5px',
                fontWeight: '600',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: activeKategori === String(k.id) ? '#0F172A' : '#E2E8F0',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                background: activeKategori === String(k.id) ? '#0F172A' : '#FFFFFF',
                color: activeKategori === String(k.id) ? '#FFFFFF' : '#64748B'
              }}
            >
              {k.nama_kategori}
            </button>
          ))}
        </div>

        {/* Hasil pencarian info */}
        {searchQuery && (
          <div style={{ marginBottom: '10px', fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Menampilkan <strong>{filteredItems.length}</strong> produk untuk "<strong>{searchQuery}</strong>"</span>
            <button
              onClick={() => setSearchQuery('')}
              style={{ padding: '2px 8px', fontSize: '11px', background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: '4px', cursor: 'pointer' }}
            >Reset</button>
          </div>
        )}

        {/* Product Grid */}
        <div className="product-grid">
          {filteredItems.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
              <p style={{ fontWeight: '600', fontSize: '15px', color: '#0F172A' }}>Produk tidak ditemukan</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>Coba kata kunci atau kategori lain</p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.id}
                className="product-card"
                onClick={() => addToCart(item)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease'
                }}
              >
                {item.gambar ? (
                  <div style={{ width: '100%', height: '110px', marginBottom: '10px', borderRadius: '6px', overflow: 'hidden', background: '#F8FAFC' }}>
                    <img src={item.gambar} alt={item.nama_barang} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '70px', marginBottom: '10px', borderRadius: '6px', background: '#F8FAFC', border: '1px dashed #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '600' }}>Tanpa Foto</span>
                  </div>
                )}
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A', minHeight: '34px', lineHeight: 1.3, margin: '0 0 8px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.nama_barang}
                </h4>
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                    Rp {item.harga_jual.toLocaleString('id-ID')}
                  </span>
                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: '600',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: item.stok > 5 ? '#ECFDF5' : '#FFFBEB',
                    color: item.stok > 5 ? '#059669' : '#B45309',
                    border: `1px solid ${item.stok > 5 ? '#D1FAE5' : '#FEF3C7'}`
                  }}>
                    {item.stok} {item.satuan}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="pos-cart" style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Cart Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
              Keranjang
            </h3>
            {heldCarts.length > 0 && (
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                color: '#92400E',
                background: '#FEF3C7',
                border: '1px solid #FCD34D',
                padding: '2px 7px',
                borderRadius: '10px'
              }}>
                {heldCarts.length} Hold
              </span>
            )}
          </div>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: '6px' }}>
            {cart.reduce((sum, i) => sum + i.qty, 0)} Item
          </span>
        </div>

        {/* Input Nama Pelanggan */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
            Pelanggan
          </label>
          <input
            type="text"
            placeholder="Ketik nama pelanggan (opsional)..."
            value={namaPelanggan}
            onChange={e => setNamaPelanggan(e.target.value)}
            style={{ width: '100%', fontSize: '12.5px', padding: '7px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', boxSizing: 'border-box' }}
          />
        </div>

        {/* Cart Items List */}
        <div className="cart-items" style={{ flex: 1, overflowY: 'auto', minHeight: '120px', paddingRight: '2px' }}>
          {cart.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94A3B8', marginTop: '30px', fontSize: '13px', fontWeight: '500' }}>
              Keranjang masih kosong
            </p>
          ) : (
            cart.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', marginBottom: '6px', background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '8px' }}>
                <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.nama_barang}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                    Rp {item.harga_jual.toLocaleString('id-ID')}
                  </div>
                </div>

                {/* Qty Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); updateQty(item.id, -1); }}
                    style={{ width: '22px', height: '22px', padding: 0, fontSize: '13px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#334155', borderRadius: '4px', cursor: 'pointer', lineHeight: 1, boxShadow: 'none' }}
                  >−</button>
                  <span style={{ fontWeight: '700', fontSize: '12.5px', minWidth: '20px', textAlign: 'center', color: '#0F172A' }}>{item.qty}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); updateQty(item.id, 1); }}
                    style={{ width: '22px', height: '22px', padding: 0, fontSize: '13px', background: '#2563EB', border: 'none', color: '#FFFFFF', borderRadius: '4px', cursor: 'pointer', lineHeight: 1, boxShadow: 'none' }}
                  >+</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: '10px', minWidth: '60px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>
                    Rp {item.subtotal.toLocaleString('id-ID')}
                  </span>
                  <button
                    style={{ padding: '0', background: 'none', border: 'none', color: '#EF4444', fontSize: '10px', cursor: 'pointer', marginTop: '2px', textDecoration: 'underline', boxShadow: 'none' }}
                    onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                  >Hapus</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Totals & Checkout */}
        <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B', marginBottom: '6px' }}>
            <span>Subtotal</span>
            <span style={{ fontWeight: '600', color: '#0F172A' }}>Rp {totalHarga.toLocaleString('id-ID')}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>
            <span>Diskon</span>
            <div style={{ display: 'flex', alignItems: 'center', width: '110px' }}>
              <input
                type="text"
                value={diskon ? diskon.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ''}
                onChange={e => setDiskon(Number(e.target.value.replace(/[^0-9]/g, '')))}
                style={{ width: '100%', padding: '4px 8px', fontSize: '12px', textAlign: 'right', fontWeight: '600', color: '#DC2626', borderRadius: '4px', border: '1px solid #E2E8F0' }}
                placeholder="Rp 0"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px dashed #E2E8F0', borderBottom: '1px dashed #E2E8F0', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>Total</span>
            <span style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A' }}>
              Rp {totalSetelahDiskon.toLocaleString('id-ID')}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '600', color: '#64748B' }}>Metode</span>
            <select
              value={metodePembayaran}
              onChange={e => setMetodePembayaran(e.target.value)}
              style={{ width: '130px', padding: '5px 8px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12px', fontWeight: '600' }}
            >
              <option value="Tunai">Tunai</option>
              <option value="Transfer Bank">Transfer Bank</option>
              <option value="QRIS">QRIS</option>
            </select>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '600', color: '#64748B' }}>Bayar (Rp)</span>
              <input
                type="text"
                value={amountTendered ? amountTendered.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ''}
                onChange={e => setAmountTendered(Number(e.target.value.replace(/[^0-9]/g, '')))}
                style={{ width: '130px', padding: '5px 8px', fontSize: '13px', textAlign: 'right', fontWeight: '700', color: '#2563EB', borderRadius: '6px', border: '1px solid #E2E8F0' }}
                placeholder="0"
              />
            </div>

            {/* Quick denomination pills */}
            <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
              <button onClick={() => setAmountTendered(totalSetelahDiskon)} style={{ flex: 1, fontSize: '11px', padding: '4px 0', borderRadius: '4px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#334155', cursor: 'pointer', fontWeight: '600', boxShadow: 'none' }}>Pas</button>
              <button onClick={() => setAmountTendered(50000)} style={{ flex: 1, fontSize: '11px', padding: '4px 0', borderRadius: '4px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#334155', cursor: 'pointer', fontWeight: '600', boxShadow: 'none' }}>50.000</button>
              <button onClick={() => setAmountTendered(100000)} style={{ flex: 1, fontSize: '11px', padding: '4px 0', borderRadius: '4px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#334155', cursor: 'pointer', fontWeight: '600', boxShadow: 'none' }}>100.000</button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '12px' }}>
            <span style={{ fontWeight: '600', color: '#64748B' }}>Kembali</span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: kembalian < 0 ? '#DC2626' : '#059669' }}>
              Rp {Math.max(0, kembalian).toLocaleString('id-ID')}
            </span>
          </div>

          <button
            style={{
              width: '100%',
              padding: '11px',
              fontSize: '13.5px',
              fontWeight: '600',
              borderRadius: '8px',
              background: '#059669',
              color: '#FFFFFF',
              border: 'none',
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              opacity: cart.length === 0 ? 0.6 : 1,
              marginBottom: '6px',
              boxShadow: 'none',
              transition: 'background-color 0.15s ease'
            }}
            onClick={checkout}
            disabled={cart.length === 0}
          >
            Selesaikan Transaksi
          </button>
          
          <button 
            onClick={handleHoldCart} 
            disabled={cart.length === 0}
            style={{ 
              width: '100%',
              padding: '8px 12px',
              background: '#F8FAFC', 
              color: cart.length > 0 ? '#1E293B' : '#94A3B8',
              border: '1px solid #CBD5E1',
              borderRadius: '8px', 
              fontSize: '12px',
              fontWeight: '600',
              cursor: cart.length > 0 ? 'pointer' : 'not-allowed', 
              boxShadow: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
            Tahan / Parkir Transaksi (Hold)
          </button>
        </div>
      </div>
      {/* ===== MODAL STRUK ===== */}
      {struk && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '20px',
              width: '380px',
              maxWidth: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
              padding: '16px',
            }}
          >
            <Receipt data={struk} pengaturan={pengaturan} preview />

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={() => setStruk(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#F1F5F9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Tutup
              </button>
              <button
                onClick={handlePrint}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#2563EB',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Print Struk
              </button>
            </div>
          </div>
        </div>
      )}

      <ReceiptPrintPortal
        data={struk}
        pengaturan={pengaturan}
        lebar={Number(pengaturan.lebar_struk) || 80}
      />
    </div>
  );
};

export default POS;
