import React, { useState } from 'react';
import { PPOB_DATA } from '../../data/digitalServices';
import { formatRupiah } from '../../lib/format';
import { generateWhatsAppPpobUrl } from '../../lib/whatsapp';

export default function PPOBServiceModal({ isOpen, onClose, storeInfo, initialCategoryId = null }) {
  if (!isOpen) return null;

  const defaultCategory = (initialCategoryId && PPOB_DATA.categories.find((c) => c.id === initialCategoryId)) || PPOB_DATA.categories[0];
  const [activeCategory, setActiveCategory] = useState(defaultCategory);
  const [selectedProvider, setSelectedProvider] = useState(defaultCategory.providers[0]);
  const [targetNumber, setTargetNumber] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [customer, setCustomer] = useState({
    nama: '',
    telepon: '',
  });

  // Sync category if initialCategoryId changes
  React.useEffect(() => {
    if (initialCategoryId) {
      const found = PPOB_DATA.categories.find((c) => c.id === initialCategoryId);
      if (found) {
        setActiveCategory(found);
        setSelectedProvider(found.providers[0]);
        setSelectedItem(null);
      }
    }
  }, [initialCategoryId, isOpen]);

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

  const tabDefinitions = [
    { id: 'pulsa', name: 'Pulsa', icon: '📱' },
    { id: 'paket_data', name: 'Paket Data', icon: '🌐' },
    { id: 'listrik', name: 'Listrik PLN', icon: '⚡' },
    { id: 'ewallet', name: 'E-Wallet', icon: '💳' },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '620px',
          width: '95%',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          animation: 'mpFadeIn 0.15s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header (Fixed) */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#E8F8EE',
                color: '#03AC0E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              ⚡
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1F2937' }}>
                PPOB & Isi Ulang Digital
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#6B7280' }}>
                Pulsa, Paket Internet, Token Listrik & E-Wallet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#F1F5F9',
              border: 'none',
              fontSize: '15px',
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            title="Tutup"
          >
            ✕
          </button>
        </div>

        {/* 2. Category Tabs (Fixed 4-Grid - No Horizontal Scrollbar) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px',
            padding: '8px 16px',
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          {tabDefinitions.map((tab) => {
            const catObj = PPOB_DATA.categories.find((c) => c.id === tab.id);
            if (!catObj) return null;
            const isActive = activeCategory.id === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleCategoryChange(catObj)}
                style={{
                  padding: '9px 4px',
                  borderRadius: '8px',
                  border: isActive ? '1.5px solid #03AC0E' : '1px solid transparent',
                  background: isActive ? '#FFFFFF' : 'transparent',
                  color: isActive ? '#03AC0E' : '#64748B',
                  fontWeight: isActive ? '700' : '600',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Form Wrapping Scrollable Body & Sticky Footer */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          {/* 3. Scrollable Body Content */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '18px 22px',
            }}
          >
            {/* Provider Selection */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '800', color: '#374151', marginBottom: '8px', letterSpacing: '0.3px' }}>
                PILIH OPERATOR / PROVIDER
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {activeCategory.providers.map((p) => {
                  const isSelected = selectedProvider === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleProviderChange(p)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: isSelected ? '1.5px solid #03AC0E' : '1px solid #D1D5DB',
                        background: isSelected ? '#E8F8EE' : '#FFFFFF',
                        color: isSelected ? '#03AC0E' : '#4B5563',
                        fontWeight: isSelected ? '700' : '600',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isSelected && '✓ '}
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Number */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '800', color: '#374151', marginBottom: '6px', letterSpacing: '0.3px' }}>
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
                placeholder={
                  activeCategory.id === 'listrik'
                    ? 'Contoh: 14234567890 (No. Meter/ID Pelanggan)'
                    : 'Contoh: 081234567890'
                }
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #CBD5E1',
                  background: '#F8FAFC',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  letterSpacing: '0.3px',
                  color: '#1F2937',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '11px', color: '#03AC0E', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ✓ Pengisian otomatis diproses 1-5 menit setelah konfirmasi.
              </span>
            </div>

            {/* Denominations Grid */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '800', color: '#374151', marginBottom: '8px', letterSpacing: '0.3px' }}>
                {activeCategory.id === 'paket_data' ? 'PILIH PAKET INTERNET' : 'PILIH NOMINAL PENGISIAN'}
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
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
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid #03AC0E' : '1.5px solid #E5E7EB',
                        background: isSelected ? '#F0FDF4' : '#FFFFFF',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '6px',
                        boxShadow: isSelected ? '0 2px 8px rgba(3,172,14,0.12)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#1F2937' }}>
                          {item.nominal}
                        </span>
                        {isSelected && (
                          <span style={{ color: '#03AC0E', fontWeight: '800', fontSize: '13px' }}>
                            ✓
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: isSelected ? '#03AC0E' : '#E11D48' }}>
                        Rp {formatRupiah(item.price)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Customer Name */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '800', color: '#374151', marginBottom: '6px', letterSpacing: '0.3px' }}>
                NAMA LENGKAP PEMESAN *
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
                  border: '1.5px solid #CBD5E1',
                  background: '#F8FAFC',
                  fontSize: '13px',
                  color: '#1F2937',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* 4. Sticky Bottom Footer (Always Visible, Never Cut Off) */}
          <div
            style={{
              padding: '14px 22px 18px',
              borderTop: '1px solid #E2E8F0',
              background: '#FFFFFF',
              boxShadow: '0 -4px 16px rgba(0,0,0,0.04)',
            }}
          >
            {/* Summary Box */}
            {selectedItem && (
              <div
                style={{
                  padding: '10px 14px',
                  background: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <div>
                  <span style={{ fontSize: '10.5px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>
                    Total Pembayaran
                  </span>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1F2937' }}>
                    {selectedProvider} - {selectedItem.nominal}
                  </div>
                </div>
                <div style={{ fontSize: '17px', fontWeight: '900', color: '#03AC0E' }}>
                  Rp {formatRupiah(selectedItem.price)}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
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
                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z" />
              </svg>
              <span>{selectedItem ? 'Proses Isi Ulang via WhatsApp' : 'Pilih Nominal & Lanjut WhatsApp'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
