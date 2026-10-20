import React, { useState } from 'react';
import { PPOB_DATA } from '../../data/digitalServices';
import { formatRupiah } from '../../lib/format';
import { generateWhatsAppPpobUrl } from '../../lib/whatsapp';

export default function PPOBServiceModal({ isOpen, onClose, storeInfo }) {
  if (!isOpen) return null;

  const [activeCategory, setActiveCategory] = useState(PPOB_DATA.categories[0]);
  const [selectedProvider, setSelectedProvider] = useState(PPOB_DATA.categories[0].providers[0]);
  const [targetNumber, setTargetNumber] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [customer, setCustomer] = useState({
    nama: '',
    telepon: '',
  });

  // Switch category
  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setSelectedProvider(cat.providers[0]);
    setSelectedItem(null);
  };

  // Switch provider
  const handleProviderChange = (prov) => {
    setSelectedProvider(prov);
    setSelectedItem(null);
  };

  const availableItems = activeCategory.items[selectedProvider] || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!targetNumber.trim()) {
      alert('Mohon isi Nomor HP atau Nomor Meter/ID Pelanggan Tujuan.');
      return;
    }
    if (!selectedItem) {
      alert('Mohon pilih nominal produk yang ingin diisi.');
      return;
    }
    if (!customer.nama.trim()) {
      alert('Mohon isi nama Anda untuk konfirmasi pesanan.');
      return;
    }

    const storePhone = storeInfo?.alamat_toko?.match(/08[0-9-]+/)?.[0] || '6281234567890';
    const waUrl = generateWhatsAppPpobUrl({
      storePhone,
      categoryName: activeCategory.name,
      provider: selectedProvider,
      targetNumber,
      nominal: selectedItem.nominal,
      price: selectedItem.price,
      customer: {
        nama: customer.nama,
        telepon: customer.telepon || targetNumber,
      },
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
            background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#2563EB',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
              }}
            >
              ⚡
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#1E3A8A' }}>
                PPOB & Isi Ulang Digital
              </h3>
              <p style={{ margin: 0, fontSize: '11.5px', color: '#1E40AF' }}>
                Pulsa, Token Listrik PLN, Paket Data & Saldo E-Wallet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              color: '#1E40AF',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Category Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #E2E8F0',
            background: '#F8FAFC',
            overflowX: 'auto',
          }}
        >
          {PPOB_DATA.categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              style={{
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                fontWeight: '700',
                fontSize: '12.5px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                borderBottom: `2px solid ${activeCategory.id === cat.id ? '#2563EB' : 'transparent'}`,
                color: activeCategory.id === cat.id ? '#2563EB' : '#64748B',
                transition: 'all 0.2s',
              }}
            >
              {cat.id === 'pulsa' && '📱 '}
              {cat.id === 'listrik' && '💡 '}
              {cat.id === 'ewallet' && '👛 '}
              {cat.id === 'paket_data' && '🌐 '}
              {cat.name}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          {/* Provider Selection */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              PILIH OPERATOR / PROVIDER
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {activeCategory.providers.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleProviderChange(p)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: `1.5px solid ${selectedProvider === p ? '#2563EB' : '#E2E8F0'}`,
                    background: selectedProvider === p ? '#EFF6FF' : '#FFFFFF',
                    color: selectedProvider === p ? '#1D4ED8' : '#475569',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Target Number */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              {activeCategory.id === 'listrik'
                ? 'NOMOR METERAN / ID PELANGGAN PLN *'
                : activeCategory.id === 'ewallet'
                ? `NOMOR HP AKUN ${selectedProvider.toUpperCase()} *`
                : 'NOMOR TELEPON / HP TUJUAN *'}
            </label>
            <input
              type="text"
              required
              value={targetNumber}
              onChange={(e) => setTargetNumber(e.target.value)}
              placeholder={activeCategory.id === 'listrik' ? 'Contoh: 14234567890' : 'Contoh: 081234567890'}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1.5px solid #CBD5E1',
                fontSize: '14px',
                fontWeight: '600',
                letterSpacing: '0.5px',
                boxSizing: 'border-box',
              }}
            />
            <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
              Pastikan nomor sudah benar dan aktif agar pengisian berhasil lancar.
            </span>
          </div>

          {/* Denominations Grid */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
              PILIH NOMINAL PENGISIAN
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '10px',
              }}
            >
              {availableItems.map((item, idx) => {
                const isSelected = selectedItem?.nominal === item.nominal;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '10px',
                      border: `1.5px solid ${isSelected ? '#2563EB' : '#E2E8F0'}`,
                      background: isSelected ? '#EFF6FF' : '#FFFFFF',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>
                      {item.nominal}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: isSelected ? '#1D4ED8' : '#D97706' }}>
                      Rp {formatRupiah(item.price)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customer Name */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
              Nama Pemesan *
            </label>
            <input
              type="text"
              required
              value={customer.nama}
              onChange={(e) => setCustomer({ ...customer, nama: e.target.value })}
              placeholder="Contoh: Rina Anggraini"
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

          {/* Summary Box */}
          {selectedItem && (
            <div
              style={{
                padding: '12px 16px',
                background: '#EFF6FF',
                borderRadius: '10px',
                border: '1px solid #BFDBFE',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: '#1E40AF', fontWeight: '700' }}>TOTAL PEMBAYARAN</span>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#1E3A8A' }}>
                  {activeCategory.name} - {selectedItem.nominal}
                </div>
              </div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#1D4ED8' }}>
                Rp {formatRupiah(selectedItem.price)}
              </div>
            </div>
          )}

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
            <span>💬</span> Proses Isi Ulang via WhatsApp
          </button>
        </form>
      </div>
    </div>
  );
}
