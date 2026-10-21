import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../../lib/format';
import { generateWhatsAppGoldUrl } from '../../lib/whatsapp';
import { fetchPublicLogamMulia, FALLBACK_LOGAM_MULIA } from '../../lib/api';

export default function GoldServiceModal({ isOpen, onClose, storeInfo }) {
  if (!isOpen) return null;

  const [merks, setMerks] = useState(FALLBACK_LOGAM_MULIA);
  const [selectedMerkId, setSelectedMerkId] = useState(FALLBACK_LOGAM_MULIA[0]?.id || 1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [mode, setMode] = useState('buy'); // 'buy' | 'buyback'
  const [qty, setQty] = useState(1);
  const [deliveryOption, setDeliveryOption] = useState('Ambil di Toko');
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState({
    nama: '',
    telepon: '',
    alamat: '',
    catatan: '',
  });

  // Fetch dynamic gold data from backend POS
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchPublicLogamMulia();
        if (isMounted && data && data.length > 0) {
          setMerks(data);
          const currentMerk = data.find((m) => m.id === selectedMerkId) || data[0];
          setSelectedMerkId(currentMerk.id);
          if (currentMerk.items && currentMerk.items.length > 0) {
            setSelectedItem(currentMerk.items[0]);
          }
        }
      } catch (err) {
        console.warn('Gagal memuat data emas:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const activeMerk = merks.find((m) => m.id === selectedMerkId) || merks[0] || {};
  const availableItems = activeMerk.items || [];

  // If active item is not in current merk, pick the first available
  useEffect(() => {
    if (availableItems.length > 0) {
      if (!selectedItem || !availableItems.some((it) => it.id === selectedItem.id)) {
        setSelectedItem(availableItems[0]);
      }
    } else {
      setSelectedItem(null);
    }
  }, [selectedMerkId, availableItems]);

  const unitPrice = selectedItem
    ? Number(mode === 'buy' ? selectedItem.harga_jual : (selectedItem.harga_beli || selectedItem.harga_jual * 0.9))
    : 0;
  const totalPrice = unitPrice * qty;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedItem) {
      alert('Mohon pilih varian gramatur emas terlebih dahulu.');
      return;
    }
    if (!customer.nama.trim() || !customer.telepon.trim()) {
      alert('Mohon isi Nama Lengkap dan Nomor WhatsApp Anda.');
      return;
    }

    const storePhone = storeInfo?.alamat_toko?.match(/08[0-9-]+/)?.[0] || '6281234567890';
    const waUrl = generateWhatsAppGoldUrl({
      storePhone,
      mode,
      brand: activeMerk.nama_merk,
      gram: selectedItem.gramatur,
      qty,
      unitPrice,
      totalPrice,
      customer,
      deliveryOption: mode === 'buy' ? deliveryOption : 'Antar ke Toko / Janjian',
    });

    window.open(waUrl, '_blank');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '620px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          animation: 'mpFadeIn 0.15s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#FEF3C7',
                color: '#B45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                border: '1px solid #FDE68A',
              }}
            >
              🪙
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                Jual Beli Logam Mulia Emas 24K
              </h3>
              <p style={{ margin: 0, fontSize: '11.5px', color: '#64748B' }}>
                Emas batangan murni bersertifikat resmi LBMA & PT Antam / UBS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '18px',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            ✕
          </button>
        </div>

        {/* 2. Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          
          {/* Mode Selector: Beli vs Buyback */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              background: '#F1F5F9',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              marginBottom: '16px',
            }}
          >
            <button
              type="button"
              onClick={() => setMode('buy')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: '700',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: mode === 'buy' ? '#FFFFFF' : 'transparent',
                color: mode === 'buy' ? '#D97706' : '#64748B',
                boxShadow: mode === 'buy' ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>🏷️</span>
              <span>Beli Emas Baru</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('buyback')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: '700',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: mode === 'buyback' ? '#FFFFFF' : 'transparent',
                color: mode === 'buyback' ? '#0F172A' : '#64748B',
                boxShadow: mode === 'buyback' ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>🔄</span>
              <span>Jual Emas (Buyback)</span>
            </button>
          </div>

          {/* Merk / Produsen Emas Navigation Tabs */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              PILIH MERK / PRODUSEN EMAS
            </label>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {merks.map((m) => {
                const isSelected = selectedMerkId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMerkId(m.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: `1.5px solid ${isSelected ? '#D97706' : '#E2E8F0'}`,
                      background: isSelected ? '#FFFBEB' : '#FFFFFF',
                      color: isSelected ? '#B45309' : '#475569',
                      fontWeight: '700',
                      fontSize: '12px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{isSelected ? '✓' : '•'}</span>
                    <span>{m.nama_merk}</span>
                  </button>
                );
              })}
            </div>
            {activeMerk.keterangan && (
              <p style={{ margin: '6px 0 0 0', fontSize: '11.5px', color: '#64748B', fontStyle: 'italic' }}>
                {activeMerk.keterangan}
              </p>
            )}
          </div>

          {/* Varian Gramatur List (Layout seperti Pulsa & Baju, bukan card kecil sempit) */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                PILIH UKURAN GRAMATUR ({mode === 'buy' ? 'HARGA BELI' : 'ESTIMASI BUYBACK'})
              </label>
              <span style={{ fontSize: '11px', color: '#03AC0E', fontWeight: '600' }}>
                ● Ready Stok Terkini
              </span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#94A3B8', fontSize: '12.5px' }}>
                Memuat data emas dari POS...
              </div>
            ) : availableItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', background: '#F8FAFC', borderRadius: '8px', color: '#94A3B8', fontSize: '12.5px', border: '1px dashed #CBD5E1' }}>
                Belum ada varian emas ready untuk {activeMerk.nama_merk}.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {availableItems.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  const itemPrice = mode === 'buy' ? item.harga_jual : (item.harga_beli || item.harga_jual * 0.9);
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: `1.5px solid ${isSelected ? '#D97706' : '#E2E8F0'}`,
                        background: isSelected ? '#FFFBEB' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {/* Left: Gramatur Badge + Name + Description */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '8px',
                            background: isSelected ? '#FEF3C7' : '#F1F5F9',
                            color: isSelected ? '#92400E' : '#334155',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '800',
                            fontSize: '13px',
                            lineHeight: '1.1',
                            flexShrink: 0,
                            overflow: 'hidden',
                            border: `1px solid ${isSelected ? '#FDE68A' : '#E2E8F0'}`,
                          }}
                        >
                          {item.gambar ? (
                            <img src={item.gambar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => (e.target.style.display = 'none')} />
                          ) : (
                            <>
                              <span>{item.gramatur.replace('gr', '').trim()}</span>
                              <span style={{ fontSize: '9px', fontWeight: '600' }}>GRAM</span>
                            </>
                          )}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>
                              {activeMerk.nama_merk} {item.gramatur}
                            </span>
                            {Number(item.is_favorit) === 1 && (
                              <span
                                style={{
                                  fontSize: '9.5px',
                                  fontWeight: '800',
                                  background: '#FEE2E2',
                                  color: '#DC2626',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                }}
                              >
                                FAVORIT
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: '600',
                                color: item.stok > 0 ? '#15803D' : '#DC2626',
                                background: item.stok > 0 ? '#F0FDF4' : '#FEF2F2',
                                padding: '1px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              {item.stok > 0 ? `Ready ${item.stok} keping` : 'Stok Habis'}
                            </span>
                          </div>

                          {item.deskripsi && (
                            <p style={{ margin: '3px 0 0 0', fontSize: '11.5px', color: '#64748B', lineHeight: '1.35' }}>
                              {item.deskripsi}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Price & Radio */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: isSelected ? '#B45309' : '#0F172A' }}>
                          Rp {formatRupiah(itemPrice)}
                        </div>
                        <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                          per keping
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form Pemesanan & Quantity */}
          <form onSubmit={handleSubmit}>
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '14px 16px',
                marginBottom: '16px',
              }}
            >
              {/* Stepper Qty & Total Price */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
                    JUMLAH KEPING:
                  </span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginLeft: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        color: '#0F172A',
                        fontWeight: '700',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: '14px', fontWeight: '800', minWidth: '24px', textAlign: 'center' }}>
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => q + 1)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        color: '#0F172A',
                        fontWeight: '700',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>TOTAL ESTIMASI:</span>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: '#D97706' }}>
                    Rp {formatRupiah(totalPrice)}
                  </span>
                </div>
              </div>

              {/* Delivery Option (for buy mode) */}
              {mode === 'buy' && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>
                    METODE PENGAMBILAN / PENGIRIMAN
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {['Ambil di Toko', 'Kirim Asuransi'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDeliveryOption(opt)}
                        style={{
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: `1.5px solid ${deliveryOption === opt ? '#D97706' : '#CBD5E1'}`,
                          background: deliveryOption === opt ? '#FFFBEB' : '#FFFFFF',
                          color: deliveryOption === opt ? '#B45309' : '#475569',
                          fontWeight: '700',
                          fontSize: '11.5px',
                          cursor: 'pointer',
                        }}
                      >
                        {opt === 'Ambil di Toko' ? '🏬 Ambil di Toko' : '📦 Kirim Asuransi'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#334155', marginBottom: '3px' }}>
                    Nama Pemesan *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Budi Santoso"
                    value={customer.nama}
                    onChange={(e) => setCustomer({ ...customer, nama: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#334155', marginBottom: '3px' }}>
                    Nomor WhatsApp *
                  </label>
                  <input
                    type="tel"
                    placeholder="0812xxxxxxxx"
                    value={customer.telepon}
                    onChange={(e) => setCustomer({ ...customer, telepon: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {mode === 'buy' && deliveryOption === 'Kirim Asuransi' && (
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#334155', marginBottom: '3px' }}>
                    Alamat Pengiriman Lengkap
                  </label>
                  <input
                    type="text"
                    placeholder="Jalan, No. Rumah, RT/RW, Kecamatan, Kota"
                    value={customer.alamat}
                    onChange={(e) => setCustomer({ ...customer, alamat: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#334155', marginBottom: '3px' }}>
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Tahun cetak 2024 / kemasan certicard utuh"
                  value={customer.catatan}
                  onChange={(e) => setCustomer({ ...customer, catatan: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Submit via WhatsApp */}
            <button
              type="submit"
              disabled={!selectedItem}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#03AC0E',
                color: '#FFFFFF',
                fontWeight: '700',
                fontSize: '13px',
                cursor: selectedItem ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(3, 172, 14, 0.25)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824z" />
              </svg>
              <span>
                {mode === 'buy' ? 'Beli Emas via WhatsApp' : 'Ajukan Buyback via WhatsApp'}
              </span>
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
