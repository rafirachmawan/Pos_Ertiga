import React, { useState } from 'react';
import { DIGITAL_SERVICES_META } from '../data/digitalServices';
import GoldServiceModal from './services/GoldServiceModal';
import PPOBServiceModal from './services/PPOBServiceModal';
import RasxmediaServiceModal from './services/RasxmediaServiceModal';
import AppDevServiceModal from './services/AppDevServiceModal';

export default function DigitalServicesSection({ storeInfo }) {
  const [activeModal, setActiveModal] = useState(null); // 'emas' | 'ppob' | 'rasxmedia' | 'appdev' | null

  return (
    <section style={{ marginBottom: '36px' }}>
      {/* Header Banner for Digital Services */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: '#FFFFFF',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              background: '#3B82F6',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: '800',
              padding: '3px 8px',
              borderRadius: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Layanan Baru & Eksklusif
          </span>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>• Transaksi Cepat & Aman via WhatsApp</span>
        </div>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', letterSpacing: '-0.3px' }}>
          Layanan Digital, Emas, SMM & Solusi IT
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8', maxWidth: '680px', lineHeight: '1.5' }}>
          Pilih salah satu layanan di bawah ini. Anda dapat menghitung estimasi harga, memilih paket yang sesuai, dan langsung terhubung dengan Admin kami.
        </p>
      </div>

      {/* Grid 4 Service Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
        }}
      >
        {DIGITAL_SERVICES_META.map((svc) => (
          <div
            key={svc.id}
            onClick={() => setActiveModal(svc.id)}
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              border: `1.5px solid ${svc.borderColor}`,
              padding: '20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 24px -6px rgba(0, 0, 0, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.03)';
            }}
          >
            <div>
              {/* Card Top */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: svc.bgColor,
                    color: svc.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    border: `1px solid ${svc.borderColor}`,
                  }}
                >
                  {svc.id === 'emas' && '🥇'}
                  {svc.id === 'ppob' && '⚡'}
                  {svc.id === 'rasxmedia' && '🚀'}
                  {svc.id === 'appdev' && '💻'}
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: svc.badgeColor,
                    background: svc.bgColor,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: `1px solid ${svc.borderColor}`,
                  }}
                >
                  {svc.badge}
                </span>
              </div>

              {/* Title & Tagline */}
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                {svc.title}
              </h3>
              <div style={{ fontSize: '12px', fontWeight: '700', color: svc.badgeColor, marginBottom: '8px' }}>
                {svc.tagline}
              </div>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#64748B', lineHeight: '1.45' }}>
                {svc.description}
              </p>
            </div>

            {/* CTA Button */}
            <div style={{ marginTop: '18px' }}>
              <button
                type="button"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: svc.bgColor,
                  color: svc.badgeColor,
                  fontWeight: '800',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s',
                }}
              >
                <span>Lihat Pilihan & Pesan</span>
                <span>→</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      <GoldServiceModal
        isOpen={activeModal === 'emas'}
        onClose={() => setActiveModal(null)}
        storeInfo={storeInfo}
      />
      <PPOBServiceModal
        isOpen={activeModal === 'ppob'}
        onClose={() => setActiveModal(null)}
        storeInfo={storeInfo}
      />
      <RasxmediaServiceModal
        isOpen={activeModal === 'rasxmedia'}
        onClose={() => setActiveModal(null)}
        storeInfo={storeInfo}
      />
      <AppDevServiceModal
        isOpen={activeModal === 'appdev'}
        onClose={() => setActiveModal(null)}
        storeInfo={storeInfo}
      />
    </section>
  );
}
