import React, { useState } from 'react';
import { APP_DEV_DATA } from '../../data/digitalServices';
import { generateWhatsAppAppDevUrl } from '../../lib/whatsapp';

export default function AppDevServiceModal({ isOpen, onClose, storeInfo }) {
  if (!isOpen) return null;

  const [selectedPackage, setSelectedPackage] = useState(APP_DEV_DATA.packages[1]); // Default E-Commerce
  const [projectBrief, setProjectBrief] = useState('');
  const [budgetRange, setBudgetRange] = useState('Rp 1.000.000 - Rp 3.000.000');
  const [customer, setCustomer] = useState({
    nama: '',
    telepon: '',
    email: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customer.nama.trim() || !customer.telepon.trim()) {
      alert('Mohon isi Nama Lengkap / Usaha dan Nomor WhatsApp Anda.');
      return;
    }

    const storePhone = storeInfo?.telepon || storeInfo?.alamat_toko?.match(/08[0-9-]+/)?.[0] || '6281234567890';
    const waUrl = generateWhatsAppAppDevUrl({
      storePhone,
      packageTitle: selectedPackage.title,
      priceEstimate: selectedPackage.priceEstimate,
      estimatedDays: selectedPackage.estimatedDays,
      projectBrief,
      budgetRange,
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
          maxWidth: '600px',
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
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #E2E8F0',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>
                Jasa Pembuatan Website & Aplikasi Custom
              </h3>
              <p style={{ margin: 0, fontSize: '11.5px', color: '#64748B' }}>
                Landing Page, E-Commerce, Sistem Kasir POS & Software Bisnis
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

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          {/* Packages Grid */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
              PILIH PAKET LAYANAN
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {APP_DEV_DATA.packages.map((pkg) => {
                const isSelected = selectedPackage.id === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPackage(pkg)}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: `1.5px solid ${isSelected ? '#059669' : '#E2E8F0'}`,
                      background: isSelected ? '#ECFDF5' : '#FFFFFF',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      position: 'relative',
                    }}
                  >
                    {pkg.popular && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '8px',
                          background: '#059669',
                          color: '#FFFFFF',
                          fontSize: '8px',
                          fontWeight: '800',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        REKOMENDASI
                      </span>
                    )}
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', marginBottom: '2px' }}>
                      {pkg.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>
                      {pkg.tagline}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#059669' }}>
                      {pkg.priceEstimate}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Package details / included features */}
          <div
            style={{
              padding: '14px 16px',
              background: '#F8FAFC',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A', marginBottom: '6px' }}>
              Fitur yang Termasuk dalam {selectedPackage.title}:
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: '#475569', lineHeight: '1.6' }}>
              {selectedPackage.features.map((feat, idx) => (
                <li key={idx}>{feat}</li>
              ))}
            </ul>
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#059669', fontWeight: '700' }}>
              Estimasi Waktu Pengerjaan: {selectedPackage.estimatedDays}
            </div>
          </div>

          {/* Client Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                Nama / Usaha Klien *
              </label>
              <input
                type="text"
                required
                value={customer.nama}
                onChange={(e) => setCustomer({ ...customer, nama: e.target.value })}
                placeholder="Contoh: PT Sukses Bersama"
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

          {/* Budget Range Selection */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
              Rentang Anggaran / Budget yang Disediakan
            </label>
            <select
              value={budgetRange}
              onChange={(e) => setBudgetRange(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                boxSizing: 'border-box',
                background: '#FFFFFF',
              }}
            >
              <option value="Di bawah Rp 1.000.000">Di bawah Rp 1.000.000</option>
              <option value="Rp 1.000.000 - Rp 3.000.000">Rp 1.000.000 - Rp 3.000.000</option>
              <option value="Rp 3.000.000 - Rp 7.000.000">Rp 3.000.000 - Rp 7.000.000</option>
              <option value="Di atas Rp 7.000.000">Di atas Rp 7.000.000 (Custom Enterprise)</option>
            </select>
          </div>

          {/* Project Brief */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
              Ceritakan Kebutuhan Sistem / Gambaran Singkat Proyek
            </label>
            <textarea
              rows={3}
              value={projectBrief}
              onChange={(e) => setProjectBrief(e.target.value)}
              placeholder="Contoh: Butuh web toko online untuk jualan fashion dengan katalog, sistem kasir barcode, dan integrasi WhatsApp checkout."
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
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
            Konsultasi Proyek via WhatsApp
          </button>
        </form>
      </div>
    </div>
  );
}
