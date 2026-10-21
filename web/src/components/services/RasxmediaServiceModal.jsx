import React, { useState } from 'react';
import { RASXMEDIA_DATA } from '../../data/digitalServices';
import { formatRupiah } from '../../lib/format';
import { generateWhatsAppSmmUrl } from '../../lib/whatsapp';

export default function RasxmediaServiceModal({ isOpen, onClose, storeInfo }) {
  if (!isOpen) return null;

  const [activePlatform, setActivePlatform] = useState(RASXMEDIA_DATA.platforms[0]);
  const [selectedService, setSelectedService] = useState(RASXMEDIA_DATA.platforms[0].services[0]);
  const [selectedTier, setSelectedTier] = useState(RASXMEDIA_DATA.platforms[0].services[0].tiers[2]); // Default popular tier
  const [targetLink, setTargetLink] = useState('');
  const [customer, setCustomer] = useState({
    nama: '',
    telepon: '',
  });

  const handlePlatformChange = (p) => {
    setActivePlatform(p);
    setSelectedService(p.services[0]);
    setSelectedTier(p.services[0].tiers[0]);
  };

  const handleServiceChange = (svc) => {
    setSelectedService(svc);
    setSelectedTier(svc.tiers[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!targetLink.trim()) {
      alert('Mohon isi Link Target atau Username Akun Anda.');
      return;
    }
    if (!customer.nama.trim() || !customer.telepon.trim()) {
      alert('Mohon lengkapi Nama dan No. WhatsApp Anda.');
      return;
    }

    const storePhone = storeInfo?.alamat_toko?.match(/08[0-9-]+/)?.[0] || '6281234567890';
    const waUrl = generateWhatsAppSmmUrl({
      storePhone,
      platform: activePlatform.name,
      serviceName: selectedService.name,
      targetLink,
      qty: selectedTier.qty,
      price: selectedTier.price,
      customer,
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
            background: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: '#F8FAFC',
                color: '#7C3AED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #E2E8F0',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>
                Rasxmedia SMM Booster
              </h3>
              <p style={{ margin: 0, fontSize: '11.5px', color: '#64748B' }}>
                Followers, Likes & Views TikTok, Instagram, YouTube
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
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Platform Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            borderBottom: '1px solid #E2E8F0',
            background: '#F8FAFC',
          }}
        >
          {RASXMEDIA_DATA.platforms.map((p) => {
            const isActive = activePlatform.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePlatformChange(p)}
                style={{
                  padding: '12px',
                  border: 'none',
                  background: 'transparent',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  borderBottom: `2.5px solid ${isActive ? '#7C3AED' : 'transparent'}`,
                  color: isActive ? '#7C3AED' : '#64748B',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          {/* Service Selector */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              PILIH JENIS LAYANAN
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {activePlatform.services.map((svc) => {
                const isSelected = selectedService.name === svc.name;
                return (
                  <button
                    key={svc.name}
                    type="button"
                    onClick={() => handleServiceChange(svc)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1.5px solid ${isSelected ? '#7C3AED' : '#E2E8F0'}`,
                      background: isSelected ? '#F5F3FF' : '#FFFFFF',
                      color: isSelected ? '#6D28D9' : '#475569',
                      fontWeight: '700',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {svc.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Tiers */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
              PILIH KUANTITAS / JUMLAH ORDER
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '8px',
              }}
            >
              {selectedService.tiers.map((tier) => {
                const isSelected = selectedTier?.qty === tier.qty;
                return (
                  <button
                    key={tier.qty}
                    type="button"
                    onClick={() => setSelectedTier(tier)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '10px',
                      border: `1.5px solid ${isSelected ? '#7C3AED' : '#E2E8F0'}`,
                      background: isSelected ? '#F5F3FF' : '#FFFFFF',
                      textAlign: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    {tier.popular && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '6px',
                          background: '#7C3AED',
                          color: '#FFFFFF',
                          fontSize: '8px',
                          fontWeight: '800',
                          padding: '1px 5px',
                          borderRadius: '4px',
                        }}
                      >
                        BEST
                      </span>
                    )}
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                      {tier.qty.toLocaleString('id-ID')}
                    </div>
                    <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#7C3AED', marginTop: '2px' }}>
                      Rp {formatRupiah(tier.price)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Link or Username */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              TARGET: {selectedService.targetType.toUpperCase()} *
            </label>
            <input
              type="text"
              required
              value={targetLink}
              onChange={(e) => setTargetLink(e.target.value)}
              placeholder={selectedService.targetType}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1.5px solid #CBD5E1',
                fontSize: '13px',
                fontWeight: '600',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Customer Contacts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                Nama Anda *
              </label>
              <input
                type="text"
                required
                value={customer.nama}
                onChange={(e) => setCustomer({ ...customer, nama: e.target.value })}
                placeholder="Nama Anda"
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

          {/* Safety Notice Banner */}
          <div
            style={{
              padding: '12px 14px',
              background: '#F5F3FF',
              border: '1px solid #DDD6FE',
              borderRadius: '10px',
              fontSize: '11.5px',
              color: '#5B21B6',
              lineHeight: '1.5',
              marginBottom: '18px',
            }}
          >
            <strong>100% Aman & Tanpa Password:</strong> Cukup berikan link / username akun yang tidak di-private. Proses penambahan otomatis masuk bertahap.
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
            Pesan Booster via WhatsApp (Rp {formatRupiah(selectedTier.price)})
          </button>
        </form>
      </div>
    </div>
  );
}
