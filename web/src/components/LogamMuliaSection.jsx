import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../lib/format';
import { generateWhatsAppGoldUrl } from '../lib/whatsapp';
import { fetchPublicLogamMulia, FALLBACK_LOGAM_MULIA } from '../lib/api';

export default function LogamMuliaSection({ storeInfo }) {
  const [merks, setMerks] = useState(FALLBACK_LOGAM_MULIA);
  const [selectedMerkId, setSelectedMerkId] = useState(FALLBACK_LOGAM_MULIA[0]?.id || 1);
  const [mode, setMode] = useState('buy'); // 'buy' | 'buyback'
  const [loading, setLoading] = useState(false);

  // Quick order state for direct WhatsApp checkout
  const [orderingItem, setOrderingItem] = useState(null);
  const [qty, setQty] = useState(1);
  const [deliveryOption, setDeliveryOption] = useState('Ambil di Toko');
  const [customer, setCustomer] = useState({
    nama: '',
    telepon: '',
    alamat: '',
    catatan: '',
  });

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchPublicLogamMulia();
        if (isMounted && data && data.length > 0) {
          setMerks(data);
          const exists = data.some((m) => m.id === selectedMerkId);
          if (!exists) setSelectedMerkId(data[0].id);
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
  }, []);

  const activeMerk = merks.find((m) => m.id === selectedMerkId) || merks[0] || {};
  const availableItems = activeMerk.items || [];

  const handleOpenOrder = (item) => {
    setOrderingItem(item);
    setQty(1);
  };

  const handleSendWhatsAppOrder = (e) => {
    e.preventDefault();
    if (!orderingItem) return;
    if (!customer.nama.trim() || !customer.telepon.trim()) {
      alert('Mohon lengkapi Nama dan Nomor WhatsApp Anda.');
      return;
    }

    const unitPrice = mode === 'buy' ? orderingItem.harga_jual : (orderingItem.harga_beli || orderingItem.harga_jual * 0.9);
    const totalPrice = unitPrice * qty;
    const storePhone = storeInfo?.alamat_toko?.match(/08[0-9-]+/)?.[0] || '6281234567890';

    const waUrl = generateWhatsAppGoldUrl({
      storePhone,
      mode,
      brand: activeMerk.nama_merk,
      gram: orderingItem.gramatur,
      qty,
      unitPrice,
      totalPrice,
      customer,
      deliveryOption: mode === 'buy' ? deliveryOption : 'Antar ke Toko / Janjian',
    });

    window.open(waUrl, '_blank');
    setOrderingItem(null);
  };

  return (
    <section id="logam-mulia-section" className="mp-section-card" style={{ marginBottom: '24px' }}>
      
      {/* 1. Header Section */}
      <div className="mp-section-header">
        <div>
          <h2 className="mp-section-title">
            <span>🪙</span>
            <span>Investasi Logam Mulia Emas 24K</span>
          </h2>
          <p style={{ fontSize: '12.5px', color: '#6B7280', margin: '2px 0 0 0' }}>
            Emas batangan murni bersertifikat resmi Antam, Mini Gold & UBS. Update harga harian & ready fisik.
          </p>
        </div>

        <span
          style={{
            fontSize: '11.5px',
            fontWeight: '700',
            color: '#B45309',
            background: '#FEF3C7',
            border: '1px solid #FDE68A',
            padding: '4px 10px',
            borderRadius: '4px',
          }}
        >
          Bersertifikat Resmi 24K
        </span>
      </div>

      {/* 2. Top Controls: Merk Tabs & Mode Selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '16px',
          paddingBottom: '14px',
          borderBottom: '1px solid #F1F5F9',
        }}
      >
        {/* Merk Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          {merks.map((m) => {
            const isSelected = selectedMerkId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMerkId(m.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: `1.5px solid ${isSelected ? '#D97706' : '#E2E8F0'}`,
                  background: isSelected ? '#FFFBEB' : '#FFFFFF',
                  color: isSelected ? '#B45309' : '#475569',
                  fontWeight: isSelected ? '700' : '600',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 1px 3px rgba(217, 119, 6, 0.15)' : 'none',
                }}
              >
                <span>{isSelected ? '🪙' : '•'}</span>
                <span>{m.nama_merk}</span>
                <span style={{ fontSize: '11px', opacity: 0.75 }}>
                  ({m.items?.length || 0})
                </span>
              </button>
            );
          })}
        </div>

        {/* Mode Switcher: Beli Baru vs Buyback */}
        <div
          style={{
            display: 'inline-flex',
            background: '#F1F5F9',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
          }}
        >
          <button
            type="button"
            onClick={() => setMode('buy')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: mode === 'buy' ? '#FFFFFF' : 'transparent',
              color: mode === 'buy' ? '#D97706' : '#64748B',
              boxShadow: mode === 'buy' ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
            }}
          >
            Beli Emas Baru
          </button>
          <button
            type="button"
            onClick={() => setMode('buyback')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: mode === 'buyback' ? '#FFFFFF' : 'transparent',
              color: mode === 'buyback' ? '#0F172A' : '#64748B',
              boxShadow: mode === 'buyback' ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
            }}
          >
            Jual Emas (Buyback)
          </button>
        </div>
      </div>

      {/* Brand Description banner */}
      {activeMerk.keterangan && (
        <div
          style={{
            background: '#FFFBEB',
            border: '1px solid #FEF3C7',
            borderRadius: '8px',
            padding: '8px 14px',
            marginBottom: '16px',
            fontSize: '12px',
            color: '#92400E',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>ℹ️</span>
          <span>{activeMerk.keterangan}</span>
        </div>
      )}

      {/* 3. Items Grid (Muncul seperti Katalog Baju & Layanan PPOB) */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8', fontSize: '13px' }}>
          Memuat daftar emas ready dari toko...
        </div>
      ) : availableItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 16px', background: '#F8FAFC', borderRadius: '10px', color: '#94A3B8', fontSize: '13px', border: '1px dashed #CBD5E1' }}>
          Belum ada varian emas ready untuk {activeMerk.nama_merk}. Tambahkan melalui aplikasi POS Ertiga.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '14px',
          }}
        >
          {availableItems.map((item) => {
            const itemPrice = mode === 'buy' ? item.harga_jual : (item.harga_beli || item.harga_jual * 0.9);
            return (
              <div
                key={item.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#D97706';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(217,119,6,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                }}
              >
                <div>
                  {/* Gramatur & Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div
                      style={{
                        background: '#FEF3C7',
                        color: '#92400E',
                        border: '1px solid #FDE68A',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        fontWeight: '800',
                      }}
                    >
                      {item.gramatur}
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      {Number(item.is_favorit) === 1 && (
                        <span
                          style={{
                            background: '#FEE2E2',
                            color: '#DC2626',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '800',
                          }}
                        >
                          FAVORIT
                        </span>
                      )}
                      <span
                        style={{
                          background: item.stok > 0 ? '#E8F8EE' : '#F1F5F9',
                          color: item.stok > 0 ? '#03AC0E' : '#64748B',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontSize: '10.5px',
                          fontWeight: '700',
                        }}
                      >
                        {item.stok > 0 ? `Ready ${item.stok}` : 'Habis'}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '800', color: '#1F2937' }}>
                    {activeMerk.nama_merk} {item.gramatur}
                  </h3>

                  <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', lineHeight: '1.4', minHeight: '34px' }}>
                    {item.deskripsi || 'Emas batangan murni 24 Karat bersertifikat resmi.'}
                  </p>
                </div>

                {/* Price & Action Button */}
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #F3F4F6' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', color: '#6B7280' }}>
                      {mode === 'buy' ? 'Harga Beli:' : 'Harga Buyback:'}
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: '#B45309' }}>
                      Rp {formatRupiah(itemPrice)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenOrder(item)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: mode === 'buy' ? '#03AC0E' : '#0F172A',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '7px',
                      fontWeight: '700',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <span>{mode === 'buy' ? 'Beli via WhatsApp' : 'Jual via WhatsApp'}</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Quick WhatsApp Order Dialog (Saat tombol Beli / Jual diklik) */}
      {orderingItem && (
        <div className="modal-backdrop" onClick={() => setOrderingItem(null)}>
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              maxWidth: '460px',
              width: '92%',
              padding: '22px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #E2E8F0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                  {mode === 'buy' ? 'Pesan Emas Fisik' : 'Ajukan Penjualan Emas (Buyback)'}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>
                  {activeMerk.nama_merk} - {orderingItem.gramatur}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOrderingItem(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '18px', color: '#94A3B8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendWhatsAppOrder}>
              {/* Stepper Jumlah Keping */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Jumlah Keping:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', fontWeight: '700', cursor: 'pointer' }}
                  >
                    -
                  </button>
                  <span style={{ fontSize: '14px', fontWeight: '800', minWidth: '24px', textAlign: 'center' }}>
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', fontWeight: '700', cursor: 'pointer' }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total Calculation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Total Estimasi:</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#D97706' }}>
                  Rp {formatRupiah((mode === 'buy' ? orderingItem.harga_jual : (orderingItem.harga_beli || orderingItem.harga_jual * 0.9)) * qty)}
                </span>
              </div>

              {/* Delivery Option */}
              {mode === 'buy' && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                    Metode Pengambilan
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {['Ambil di Toko', 'Kirim Asuransi'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDeliveryOption(opt)}
                        style={{
                          padding: '7px',
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

              {/* Name & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#334155', marginBottom: '3px' }}>
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Budi Santoso"
                    value={customer.nama}
                    onChange={(e) => setCustomer({ ...customer, nama: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#334155', marginBottom: '3px' }}>
                    Nomor WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0812xxxxxxxx"
                    value={customer.telepon}
                    onChange={(e) => setCustomer({ ...customer, telepon: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '7px',
                  border: 'none',
                  background: '#03AC0E',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '10px',
                }}
              >
                <span>Lanjutkan Pesan ke WhatsApp</span>
                <span>→</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}
