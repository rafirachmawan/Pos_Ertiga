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
    const storePhone = storeInfo?.telepon || storeInfo?.alamat_toko?.match(/08[0-9-]+/)?.[0] || '6281234567890';

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
    <section id="logam-mulia-section" className="mp-gold-section">
      
      {/* 1. Header Section (Ide 3 - Soft Luxury Gold Theme) */}
      <div className="mp-gold-header-banner">
        <div>
          <div className="mp-gold-tag-pill">
            <span>🏆</span>
            <span>LOGAM MULIA EMAS MURNI 24K (99.99%)</span>
          </div>
          <h2 className="mp-gold-title">
            <span>Investasi Emas Batangan Resmi</span>
          </h2>
          <p className="mp-gold-subtitle">
            Emas fisik asli bersertifikat resmi LBMA & CertiCard (Antam, Mini Gold, UBS). Update harga harian, ready stok toko & garansi buyback.
          </p>
        </div>

        {/* Trust Badges */}
        <div className="mp-gold-trust-badges">
          <span className="mp-gold-trust-item">
            <span>🛡️</span>
            <span>LBMA Certified</span>
          </span>
          <span className="mp-gold-trust-item">
            <span>🔒</span>
            <span>Segel CertiCard</span>
          </span>
          <span className="mp-gold-trust-item">
            <span>🔄</span>
            <span>Garansi Buyback</span>
          </span>
        </div>
      </div>

      {/* 2. Top Controls: Merk Tabs & Mode Selector */}
      <div className="mp-gold-controls-row">
        {/* Merk Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {merks.map((m) => {
            const isSelected = selectedMerkId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMerkId(m.id)}
                className={`mp-gold-brand-tab ${isSelected ? 'active' : ''}`}
              >
                <span>{m.nama_merk}</span>
                <span style={{ fontSize: '11px', opacity: isSelected ? 0.9 : 0.6 }}>
                  ({m.items?.length || 0})
                </span>
              </button>
            );
          })}
        </div>

        {/* Mode Switcher: Beli Baru vs Buyback */}
        <div className="mp-gold-mode-toggle">
          <button
            type="button"
            onClick={() => setMode('buy')}
            className={`mp-gold-mode-btn ${mode === 'buy' ? 'active-buy' : ''}`}
          >
            ✨ Beli Emas Baru
          </button>
          <button
            type="button"
            onClick={() => setMode('buyback')}
            className={`mp-gold-mode-btn ${mode === 'buyback' ? 'active-buyback' : ''}`}
          >
            🔄 Jual Emas (Buyback)
          </button>
        </div>
      </div>

      {/* Mode Informational Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '8px',
          background: mode === 'buy' ? '#F0FDF4' : '#FFFBEB',
          border: `1px solid ${mode === 'buy' ? '#BBF7D0' : '#FDE68A'}`,
          fontSize: '11.5px',
          color: mode === 'buy' ? '#166534' : '#92400E',
          marginBottom: '16px',
        }}
      >
        <span style={{ fontSize: '14px' }}>{mode === 'buy' ? '✨' : '🔄'}</span>
        <span>
          {mode === 'buy' ? (
            <>
              <strong>Mode Beli Baru:</strong> Harga keping emas fisik baru bersertifikat resmi. Ready di toko & langsung pesan via WhatsApp.
            </>
          ) : (
            <>
              <strong>Mode Jual (Buyback):</strong> Estimasi harga toko membeli kembali keping emas Anda. Hubungi toko via WA untuk verifikasi fisik & pencairan dana.
            </>
          )}
        </span>
      </div>

      {/* Brand Description note (subtle) */}
      {activeMerk.keterangan && (
        <div
          style={{
            fontSize: '12px',
            color: '#78716C',
            marginBottom: '16px',
            lineHeight: '1.5',
            fontStyle: 'italic',
          }}
        >
          ℹ️ {activeMerk.keterangan}
        </div>
      )}

      {/* 3. Items Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8', fontSize: '13px' }}>
          Memuat daftar emas ready dari toko...
        </div>
      ) : availableItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 16px', background: '#FFFDF8', borderRadius: '10px', color: '#92400E', fontSize: '13px', border: '1px dashed #FDE68A' }}>
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
                    ⚖️ {item.gramatur}
                  </span>

                  {/* Clean Stock Badge */}
                  <div className="mp-gold-badges-right">
                    <span
                      style={{
                        background: item.stok > 0 ? '#ECFDF5' : '#FEF2F2',
                        color: item.stok > 0 ? '#059669' : '#DC2626',
                        border: `1px solid ${item.stok > 0 ? '#A7F3D0' : '#FECACA'}`,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '10.5px',
                        fontWeight: '700',
                      }}
                    >
                      {item.stok > 0 ? `Ready ${item.stok}` : 'Habis'}
                    </span>
                  </div>
                </div>

                {/* 2. Card Content */}
                <div className="mp-gold-body">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#92400E', background: '#FEF3C7', padding: '1px 6px', borderRadius: '4px', letterSpacing: '0.3px' }}>
                        FINE GOLD 999.9
                      </span>
                    </div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '800', color: '#1E293B', lineHeight: '1.3' }}>
                      {activeMerk.nama_merk} {item.gramatur}
                    </h3>
                    <p style={{ margin: 0, fontSize: '11.5px', color: '#64748B', lineHeight: '1.4', height: '32px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {item.deskripsi || 'Emas batangan murni 24 Karat bersertifikat resmi LBMA/CertiCard.'}
                    </p>
                  </div>

                  {/* Price & Action Button */}
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #FEF3C7' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#78716C', fontWeight: '600' }}>
                        {mode === 'buy' ? 'Harga Beli:' : 'Estimasi Buyback:'}
                      </span>
                      <span style={{ fontSize: '15.5px', fontWeight: '800', color: mode === 'buy' ? '#0F172A' : '#92400E' }}>
                        Rp {formatRupiah(itemPrice)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenOrder(item)}
                      style={{
                        width: '100%',
                        height: '36px',
                        background: mode === 'buy' ? '#03AC0E' : '#D97706',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '7px',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                        boxShadow: mode === 'buy' ? '0 2px 6px rgba(3, 172, 14, 0.2)' : '0 2px 6px rgba(217, 119, 6, 0.25)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.filter = 'brightness(0.92)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.filter = 'none';
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}>
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                      </svg>
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
              borderRadius: '14px',
              maxWidth: '440px',
              width: '92%',
              padding: '22px',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.15)',
              border: '1px solid #FDE68A',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#92400E', textTransform: 'uppercase' }}>
                  {mode === 'buy' ? '✨ Pemesanan Emas Fisik' : '🔄 Pengajuan Jual Emas (Buyback)'}
                </div>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                  {activeMerk.nama_merk} - {orderingItem.gramatur}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOrderingItem(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', fontSize: '14px', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendWhatsAppOrder}>
              {/* Stepper Jumlah Keping */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFDF8', padding: '10px 14px', borderRadius: '8px', border: '1px solid #FDE68A', marginBottom: '12px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#78350F' }}>Jumlah Keping:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', fontWeight: '700', cursor: 'pointer' }}
                  >
                    -
                  </button>
                  <span style={{ fontSize: '15px', fontWeight: '800', minWidth: '24px', textAlign: 'center', color: '#0F172A' }}>
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', fontWeight: '700', cursor: 'pointer' }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total Calculation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', padding: '6px 8px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Total Estimasi:</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: mode === 'buy' ? '#0F172A' : '#92400E' }}>
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
                          padding: '8px',
                          borderRadius: '6px',
                          border: `1px solid ${deliveryOption === opt ? '#03AC0E' : '#CBD5E1'}`,
                          background: deliveryOption === opt ? '#E8F8EE' : '#FFFFFF',
                          color: deliveryOption === opt ? '#03AC0E' : '#475569',
                          fontWeight: '700',
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
                  height: '40px',
                  borderRadius: '7px',
                  border: 'none',
                  background: mode === 'buy' ? '#03AC0E' : '#D97706',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '10px',
                  transition: 'all 0.15s ease',
                  boxShadow: mode === 'buy' ? '0 2px 8px rgba(3, 172, 14, 0.25)' : '0 2px 8px rgba(217, 119, 6, 0.25)',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}>
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                {mode === 'buy' ? 'Lanjutkan Pesan ke WhatsApp' : 'Ajukan Penjualan via WhatsApp'}
              </button>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}
