import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../lib/format';
import { generateWhatsAppGoldUrl } from '../lib/whatsapp';
import { fetchPublicLogamMulia, FALLBACK_LOGAM_MULIA } from '../lib/api';

const getDefaultGoldImage = (brandName) => {
  const b = (brandName || '').toLowerCase();
  if (b.includes('mini')) {
    return 'https://images.unsplash.com/photo-1624365169365-27a3d3c8c73d?auto=format&fit=crop&w=500&q=80';
  }
  if (b.includes('ubs')) {
    return 'https://images.unsplash.com/photo-1605792657660-596af9009e82?auto=format&fit=crop&w=500&q=80';
  }
  return 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=500&q=80';
};

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
            <span>Investasi Logam Mulia Emas 24K</span>
          </h2>
          <p style={{ fontSize: '12.5px', color: '#6B7280', margin: '2px 0 0 0' }}>
            Emas batangan murni bersertifikat resmi Antam, Mini Gold & UBS. Update harga harian & ready fisik.
          </p>
        </div>

        <span
          style={{
            fontSize: '11.5px',
            fontWeight: '600',
            color: '#475569',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
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
        {/* Merk Tabs (Clean pills) */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          {merks.map((m) => {
            const isSelected = selectedMerkId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMerkId(m.id)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: isSelected ? '1px solid #03AC0E' : '1px solid #E2E8F0',
                  background: isSelected ? '#E8F8EE' : '#FFFFFF',
                  color: isSelected ? '#03AC0E' : '#475569',
                  fontWeight: isSelected ? '700' : '500',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
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
              color: mode === 'buy' ? '#03AC0E' : '#64748B',
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

      {/* Brand Description note (subtle) */}
      {activeMerk.keterangan && (
        <div
          style={{
            fontSize: '12px',
            color: '#64748B',
            marginBottom: '16px',
            lineHeight: '1.5',
          }}
        >
          {activeMerk.keterangan}
        </div>
      )}

      {/* 3. Items Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8', fontSize: '13px' }}>
          Memuat daftar emas ready dari toko...
        </div>
      ) : availableItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 16px', background: '#F8FAFC', borderRadius: '10px', color: '#94A3B8', fontSize: '13px', border: '1px dashed #CBD5E1' }}>
          Belum ada varian emas ready untuk {activeMerk.nama_merk}. Tambahkan melalui aplikasi POS Ertiga.
        </div>
      ) : (
        <div className="mp-gold-grid">
          {availableItems.map((item) => {
            const itemPrice = mode === 'buy' ? item.harga_jual : (item.harga_beli || item.harga_jual * 0.9);
            const imageSrc = item.gambar || getDefaultGoldImage(activeMerk.nama_merk);

            return (
              <div key={item.id} className="mp-gold-card">
                {/* 1. Gold Image Container */}
                <div className="mp-gold-thumb-wrap">
                  <img
                    src={imageSrc}
                    alt={`${activeMerk.nama_merk} ${item.gramatur}`}
                    className="mp-gold-img"
                    onError={(e) => {
                      e.target.src = getDefaultGoldImage(activeMerk.nama_merk);
                    }}
                  />

                  {/* Clean Gramatur Badge */}
                  <span className="mp-gold-gram-badge">
                    {item.gramatur}
                  </span>

                  {/* Clean Stock Badge */}
                  <div className="mp-gold-badges-right">
                    <span
                      style={{
                        background: item.stok > 0 ? '#E8F8EE' : '#FEE2E2',
                        color: item.stok > 0 ? '#059669' : '#DC2626',
                        border: `1px solid ${item.stok > 0 ? '#A7F3D0' : '#FECACA'}`,
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontSize: '10.5px',
                        fontWeight: '600',
                      }}
                    >
                      {item.stok > 0 ? `Ready ${item.stok}` : 'Habis'}
                    </span>
                  </div>
                </div>

                {/* 2. Card Content */}
                <div className="mp-gold-body">
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', color: '#0F172A', lineHeight: '1.3' }}>
                      {activeMerk.nama_merk} {item.gramatur}
                    </h3>
                    <p style={{ margin: 0, fontSize: '11.5px', color: '#64748B', lineHeight: '1.4', height: '32px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {item.deskripsi || 'Emas batangan murni 24 Karat bersertifikat resmi.'}
                    </p>
                  </div>

                  {/* Price & Action Button */}
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '500' }}>
                        {mode === 'buy' ? 'Harga Beli:' : 'Harga Buyback:'}
                      </span>
                      <span style={{ fontSize: '15.5px', fontWeight: '800', color: '#0F172A' }}>
                        Rp {formatRupiah(itemPrice)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenOrder(item)}
                      style={{
                        width: '100%',
                        height: '36px',
                        background: mode === 'buy' ? '#03AC0E' : '#0F172A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = mode === 'buy' ? '#028A0B' : '#1E293B';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = mode === 'buy' ? '#03AC0E' : '#0F172A';
                      }}
                    >
                      {mode === 'buy' ? 'Beli via WhatsApp' : 'Jual via WhatsApp'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Quick WhatsApp Order Dialog */}
      {orderingItem && (
        <div className="modal-backdrop" onClick={() => setOrderingItem(null)}>
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              maxWidth: '440px',
              width: '92%',
              padding: '22px',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.15)',
              border: '1px solid #E2E8F0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>
                  {mode === 'buy' ? 'Pesan Emas Fisik' : 'Ajukan Penjualan Emas (Buyback)'}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>
                  {activeMerk.nama_merk} - {orderingItem.gramatur}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOrderingItem(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '16px', color: '#94A3B8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendWhatsAppOrder}>
              {/* Stepper Jumlah Keping */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E8F0', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Jumlah Keping:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#FFF', fontWeight: '600', cursor: 'pointer' }}
                  >
                    -
                  </button>
                  <span style={{ fontSize: '14px', fontWeight: '700', minWidth: '24px', textAlign: 'center', color: '#0F172A' }}>
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#FFF', fontWeight: '600', cursor: 'pointer' }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total Calculation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Total Estimasi:</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                  Rp {formatRupiah((mode === 'buy' ? orderingItem.harga_jual : (orderingItem.harga_beli || orderingItem.harga_jual * 0.9)) * qty)}
                </span>
              </div>

              {/* Delivery Option */}
              {mode === 'buy' && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
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
                          border: `1px solid ${deliveryOption === opt ? '#03AC0E' : '#CBD5E1'}`,
                          background: deliveryOption === opt ? '#E8F8EE' : '#FFFFFF',
                          color: deliveryOption === opt ? '#03AC0E' : '#475569',
                          fontWeight: '600',
                          fontSize: '11.5px',
                          cursor: 'pointer',
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Name & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#334155', marginBottom: '3px' }}>
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
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#334155', marginBottom: '3px' }}>
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
                  height: '38px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#03AC0E',
                  color: '#FFFFFF',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '10px',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#028A0B')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#03AC0E')}
              >
                Lanjutkan Pesan ke WhatsApp
              </button>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}
