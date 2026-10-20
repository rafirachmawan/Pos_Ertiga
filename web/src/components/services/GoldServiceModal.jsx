import React, { useState } from 'react';
import { GOLD_DATA } from '../../data/digitalServices';
import { formatRupiah } from '../../lib/format';
import { generateWhatsAppGoldUrl } from '../../lib/whatsapp';

export default function GoldServiceModal({ isOpen, onClose, storeInfo }) {
  if (!isOpen) return null;

  const [mode, setMode] = useState('buy'); // 'buy' | 'buyback'
  const [selectedBrand, setSelectedBrand] = useState(GOLD_DATA.brands[0]);
  const [selectedTier, setSelectedTier] = useState(GOLD_DATA.tiers[2]); // Default 0.1 gr
  const [qty, setQty] = useState(1);
  const [deliveryOption, setDeliveryOption] = useState('Ambil di Toko');
  const [customer, setCustomer] = useState({
    nama: '',
    telepon: '',
    alamat: '',
    catatan: '',
  });

  const unitPrice = mode === 'buy' ? selectedTier.buyPrice : selectedTier.buybackPrice;
  const totalPrice = unitPrice * qty;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customer.nama.trim() || !customer.telepon.trim()) {
      alert('Mohon isi Nama Lengkap dan Nomor WhatsApp Anda.');
      return;
    }

    const storePhone = storeInfo?.alamat_toko?.match(/08[0-9-]+/)?.[0] || '6281234567890';
    const waUrl = generateWhatsAppGoldUrl({
      storePhone,
      mode,
      brand: selectedBrand,
      gram: selectedTier.gram,
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
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#F59E0B',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)',
              }}
            >
              🥇
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#78350F' }}>
                Jual Beli Logam Mulia Emas 24K
              </h3>
              <p style={{ margin: 0, fontSize: '11.5px', color: '#92400E' }}>
                Mini Gold, Antam & UBS Bersertifikat Resmi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              color: '#92400E',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Mode Selector Tab */}
        <div style={{ padding: '16px 24px 0 24px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              background: '#F1F5F9',
              padding: '4px',
              borderRadius: '10px',
            }}
          >
            <button
              type="button"
              onClick={() => setMode('buy')}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: mode === 'buy' ? '#D97706' : 'transparent',
                color: mode === 'buy' ? '#FFFFFF' : '#64748B',
                boxShadow: mode === 'buy' ? '0 2px 8px rgba(217, 119, 6, 0.25)' : 'none',
              }}
            >
              🛍️ Beli Emas Baru
            </button>
            <button
              type="button"
              onClick={() => setMode('buyback')}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: mode === 'buyback' ? '#0F172A' : 'transparent',
                color: mode === 'buyback' ? '#FFFFFF' : '#64748B',
                boxShadow: mode === 'buyback' ? '0 2px 8px rgba(15, 23, 42, 0.25)' : 'none',
              }}
            >
              🔄 Jual Emas (Buyback)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          {/* Brand Selection */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              PILIH MERK / PRODUSEN EMAS
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {GOLD_DATA.brands.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSelectedBrand(b)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: `1.5px solid ${selectedBrand === b ? '#D97706' : '#E2E8F0'}`,
                    background: selectedBrand === b ? '#FFFBEB' : '#FFFFFF',
                    color: selectedBrand === b ? '#B45309' : '#475569',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Gramatur Picker */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
              PILIH UKURAN GRAMATUR ({mode === 'buy' ? 'Harga Beli' : 'Estimasi Buyback'})
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                gap: '8px',
              }}
            >
              {GOLD_DATA.tiers.map((tier) => {
                const isSelected = selectedTier.gram === tier.gram;
                const p = mode === 'buy' ? tier.buyPrice : tier.buybackPrice;
                return (
                  <button
                    key={tier.gram}
                    type="button"
                    onClick={() => setSelectedTier(tier)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '10px',
                      border: `1.5px solid ${isSelected ? '#D97706' : '#E2E8F0'}`,
                      background: isSelected ? '#FFFBEB' : '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'center',
                      position: 'relative',
                    }}
                  >
                    {tier.popular && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '6px',
                          background: '#EF4444',
                          color: '#FFFFFF',
                          fontSize: '8.5px',
                          fontWeight: '800',
                          padding: '1px 5px',
                          borderRadius: '4px',
                        }}
                      >
                        FAVORIT
                      </span>
                    )}
                    <div style={{ fontSize: '13px', fontWeight: '800', color: isSelected ? '#B45309' : '#0F172A' }}>
                      {tier.gram}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', marginTop: '2px' }}>
                      Rp {formatRupiah(p)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity and Total calculation box */}
          <div
            style={{
              padding: '14px 16px',
              background: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>JUMLAH KEPING</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  -
                </button>
                <span style={{ fontWeight: '800', fontSize: '14px', minWidth: '24px', textAlign: 'center' }}>
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
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                {mode === 'buy' ? 'TOTAL BAYAR ESTIMASI' : 'ESTIMASI DITERIMA'}
              </span>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#D97706' }}>
                Rp {formatRupiah(totalPrice)}
              </div>
            </div>
          </div>

          {/* Delivery Option (for Buy mode) */}
          {mode === 'buy' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                METODE PENGAMBILAN / PENGIRIMAN
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {['Ambil di Toko', 'Kirim Kurir / Asuransi'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setDeliveryOption(opt)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1.5px solid ${deliveryOption === opt ? '#D97706' : '#E2E8F0'}`,
                      background: deliveryOption === opt ? '#FFFBEB' : '#FFFFFF',
                      color: deliveryOption === opt ? '#B45309' : '#475569',
                      fontWeight: '700',
                      fontSize: '12px',
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                Nama Pemesan *
              </label>
              <input
                type="text"
                required
                value={customer.nama}
                onChange={(e) => setCustomer({ ...customer, nama: e.target.value })}
                placeholder="Contoh: Budi Santoso"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                No. WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={customer.telepon}
                onChange={(e) => setCustomer({ ...customer, telepon: e.target.value })}
                placeholder="0812xxxxxxx"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
              {mode === 'buy' && deliveryOption === 'Kirim Kurir / Asuransi' ? 'Alamat Pengiriman Lengkap *' : 'Catatan Tambahan (Opsional)'}
            </label>
            <input
              type="text"
              value={customer.alamat}
              onChange={(e) => setCustomer({ ...customer, alamat: e.target.value })}
              placeholder={mode === 'buy' && deliveryOption === 'Kirim Kurir / Asuransi' ? 'Kecamatan, Kota, Kode Pos' : 'Contoh: Mau titip simpan atau sertifikat tahun 2024'}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Guarantee info */}
          <div
            style={{
              padding: '10px 12px',
              background: '#FFFBEB',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#92400E',
              lineHeight: '1.4',
              marginBottom: '16px',
            }}
          >
            ✓ <strong>Jaminan Asli 100%:</strong> Kepingan emas murni 24 Karat bersertifikat resmi. Pemesanan diteruskan ke Admin via WhatsApp untuk pengecekan fisik & pembayaran.
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '10px',
              border: 'none',
              background: '#25D366',
              color: '#FFFFFF',
              fontWeight: '800',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
            }}
          >
            <span>💬</span> Lanjutkan Pesanan via WhatsApp
          </button>
        </form>
      </div>
    </div>
  );
}
