import React, { useState } from 'react';
import { PPOB_SERVICES_META } from '../data/digitalServices';
import PPOBServiceModal from './services/PPOBServiceModal';

export default function DigitalServicesSection({ storeInfo, activeServiceModal, onCloseServiceModal, onOpenServiceModal }) {
  const [internalModal, setInternalModal] = useState(null);
  const [selectedPpobCategory, setSelectedPpobCategory] = useState('pulsa');

  const currentModal = activeServiceModal || internalModal;
  const setModal = (id, categoryId = 'pulsa') => {
    setSelectedPpobCategory(categoryId);
    if (onOpenServiceModal) onOpenServiceModal(id);
    else setInternalModal(id);
  };
  const closeModal = () => {
    if (onCloseServiceModal) onCloseServiceModal();
    else setInternalModal(null);
  };

  return (
    <section id="ppob-section" className="mp-section-card" style={{ marginBottom: '24px' }}>
      {/* Header */}
      <div className="mp-section-header">
        <div>
          <h2 className="mp-section-title">
            <span>📱</span>
            <span>Top Up & Tagihan PPOB</span>
          </h2>
          <p style={{ fontSize: '12.5px', color: '#6B7280', margin: '2px 0 0 0' }}>
            Pembelian pulsa, paket internet, pembayaran listrik PLN, serta top-up saldo e-wallet proses instan
          </p>
        </div>
        <span
          style={{
            fontSize: '11.5px',
            fontWeight: '700',
            color: '#03AC0E',
            background: '#E8F8EE',
            padding: '4px 10px',
            borderRadius: '4px',
          }}
        >
          Transaksi 24 Jam
        </span>
      </div>

      {/* Grid of 4 PPOB Services */}
      <div className="mp-services-grid">
        {PPOB_SERVICES_META.map((svc) => (
          <div
            key={svc.id}
            className="mp-service-box"
            onClick={() => setModal('ppob', svc.id)}
            style={{
              background: svc.bgColor || '#FFFFFF',
              borderColor: svc.borderColor || '#E5E7EB',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '24px' }}>
                  {svc.icon}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    color: svc.badgeColor || '#03AC0E',
                    background: '#FFFFFF',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  {svc.badge}
                </span>
              </div>

              <h3 style={{ margin: '0 0 4px 0', fontSize: '14.5px', fontWeight: '700', color: '#1F2937' }}>
                {svc.title}
              </h3>
              <p style={{ margin: 0, fontSize: '11.5px', color: '#4B5563', lineHeight: '1.45' }}>
                {svc.description}
              </p>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: '700',
                  color: svc.badgeColor || '#03AC0E',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {svc.actionText || 'Pilih Layanan →'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      <PPOBServiceModal
        isOpen={currentModal === 'ppob'}
        onClose={closeModal}
        storeInfo={storeInfo}
        initialCategoryId={selectedPpobCategory}
      />
    </section>
  );
}
