import React, { useState } from 'react';
import { APP_DEV_DATA } from '../data/digitalServices';
import { generateWhatsAppAppDevUrl } from '../lib/whatsapp';

export default function WebDevSection({ storeInfo }) {
  const [selectedPackage, setSelectedPackage] = useState(APP_DEV_DATA.packages[1]); // Default E-Commerce
  const [projectBrief, setProjectBrief] = useState('');
  const [budgetRange, setBudgetRange] = useState('Rp 1.000.000 - Rp 3.000.000');
  const [customer, setCustomer] = useState({
    nama: '',
    telepon: '',
    email: '',
  });

  const handleSelectPackageAndFocus = (pkg) => {
    setSelectedPackage(pkg);
    const formEl = document.getElementById('webdev-consult-form');
    if (formEl) {
      const top = formEl.getBoundingClientRect().top + window.scrollY - 140;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const handleSendWhatsApp = (e) => {
    e.preventDefault();
    if (!customer.nama.trim() || !customer.telepon.trim()) {
      alert('Mohon lengkapi Nama Anda / Nama Usaha dan Nomor WhatsApp.');
      return;
    }

    const storePhone = storeInfo?.alamat_toko?.match(/08[0-9-]+/)?.[0] || storeInfo?.telepon || '6281234567890';
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
  };

  return (
    <section id="jasa-web-section" className="mp-section-card" style={{ marginBottom: '24px' }}>
      
      {/* 1. Header Section */}
      <div className="mp-section-header">
        <div>
          <h2 className="mp-section-title">
            <span>💻</span>
            <span>Jasa Pembuatan Website & Aplikasi Custom</span>
          </h2>
          <p style={{ fontSize: '12.5px', color: '#6B7280', margin: '2px 0 0 0' }}>
            Solusi digital profesional: Landing Page, Toko Online E-Commerce, Sistem Kasir POS & Software Bisnis Custom.
          </p>
        </div>

        <span
          style={{
            fontSize: '11.5px',
            fontWeight: '700',
            color: '#059669',
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            padding: '4px 10px',
            borderRadius: '4px',
          }}
        >
          Garansi & Full Support 🛡️
        </span>
      </div>

      {/* 2. Key Value Highlights Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          padding: '12px 16px',
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>⚡</span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>Pengerjaan Cepat</div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>3 - 14 Hari Kerja Siap Pakai</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>📱</span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>Mobile & SEO Friendly</div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Responsif di HP, Tablet & Laptop</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🌐</span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>Include Domain & Server</div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Setup Cloud Hosting & Domain .com</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>💬</span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>Konsultasi 100% Gratis</div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Diskusi Teknis & Demo Sistem</div>
          </div>
        </div>
      </div>

      {/* 3. Package Cards Grid (4 Pilihan Paket) */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#1E293B' }}>
            Pilih Paket Layanan Website & Software:
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748B' }}>
            Klik paket untuk melihat fitur dan mengisi form konsultasi
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '14px',
          }}
        >
          {APP_DEV_DATA.packages.map((pkg) => {
            const isSelected = selectedPackage.id === pkg.id;
            return (
              <div
                key={pkg.id}
                onClick={() => handleSelectPackageAndFocus(pkg)}
                style={{
                  border: isSelected ? '2px solid #059669' : '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '18px 16px',
                  background: isSelected ? '#F0FDF4' : '#FFFFFF',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isSelected ? '0 4px 14px rgba(5, 150, 105, 0.15)' : '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isSelected ? '0 4px 14px rgba(5, 150, 105, 0.15)' : '0 1px 3px rgba(0,0,0,0.03)';
                }}
              >
                {/* Popular Recommendation Badge */}
                {pkg.popular && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '12px',
                      background: '#059669',
                      color: '#FFFFFF',
                      fontSize: '9.5px',
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      letterSpacing: '0.04em',
                      boxShadow: '0 2px 4px rgba(5, 150, 105, 0.25)',
                    }}
                  >
                    ⭐ REKOMENDASI
                  </span>
                )}

                <div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', marginBottom: '4px', lineHeight: '1.3' }}>
                    {pkg.title}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginBottom: '12px' }}>
                    {pkg.tagline}
                  </div>

                  <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#059669' }}>
                      {pkg.priceEstimate}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>⏱️</span>
                      <span>Pengerjaan: {pkg.estimatedDays}</span>
                    </div>
                  </div>

                  {/* Feature List */}
                  <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {pkg.features.map((feat, idx) => (
                      <li key={idx} style={{ fontSize: '11.5px', color: '#334155', display: 'flex', alignItems: 'flex-start', gap: '6px', lineHeight: '1.4' }}>
                        <span style={{ color: '#059669', fontWeight: '800', flexShrink: 0 }}>✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Button */}
                <button
                  type="button"
                  style={{
                    width: '100%',
                    marginTop: '16px',
                    padding: '8px 0',
                    background: isSelected ? '#059669' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : '#059669',
                    border: `1.5px solid #059669`,
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isSelected ? '✓ Paket Dipilih' : 'Pilih Paket Ini →'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Consultation & WhatsApp Order Form */}
      <div
        id="webdev-consult-form"
        style={{
          background: '#F8FAFC',
          border: '1.5px solid #CBD5E1',
          borderRadius: '12px',
          padding: '20px 22px',
          marginTop: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>💬</span>
              <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: '800', color: '#0F172A' }}>
                Form Konsultasi & Pemesanan Proyek
              </h3>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748B' }}>
              Paket terpilih: <strong style={{ color: '#059669' }}>{selectedPackage.title}</strong> ({selectedPackage.priceEstimate}). Kirim rincian kebutuhan Anda langsung ke WhatsApp tim developer.
            </p>
          </div>

          <span
            style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#0369A1',
              background: '#E0F2FE',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid #BAE6FD',
            }}
          >
            Direct WhatsApp Response ⚡
          </span>
        </div>

        <form onSubmit={handleSendWhatsApp}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
            {/* Nama Klien */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                Nama / Usaha Klien *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: PT Sukses Bersama atau Toko Berkah"
                value={customer.nama}
                onChange={(e) => setCustomer({ ...customer, nama: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  background: '#FFFFFF',
                }}
              />
            </div>

            {/* No WhatsApp */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                Nomor WhatsApp Anda *
              </label>
              <input
                type="tel"
                required
                placeholder="0812xxxxxxx"
                value={customer.telepon}
                onChange={(e) => setCustomer({ ...customer, telepon: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  background: '#FFFFFF',
                }}
              />
            </div>

            {/* Rentang Budget */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                Rentang Budget yang Disediakan
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
                  cursor: 'pointer',
                }}
              >
                <option value="Di bawah Rp 1.000.000">Di bawah Rp 1.000.000</option>
                <option value="Rp 1.000.000 - Rp 3.000.000">Rp 1.000.000 - Rp 3.000.000</option>
                <option value="Rp 3.000.000 - Rp 7.000.000">Rp 3.000.000 - Rp 7.000.000</option>
                <option value="Di atas Rp 7.000.000">Di atas Rp 7.000.000 (Custom Enterprise)</option>
              </select>
            </div>
          </div>

          {/* Project Brief */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
              Ceritakan Kebutuhan Website / Aplikasi Anda
            </label>
            <textarea
              rows={3}
              placeholder="Contoh: Butuh web toko online baju / retail dengan katalog produk, integrasi kasir POS, dan tombol direct checkout WhatsApp."
              value={projectBrief}
              onChange={(e) => setProjectBrief(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                background: '#FFFFFF',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: '#059669',
              color: '#FFFFFF',
              fontWeight: '800',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#047857')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#059669')}
          >
            <span>💬</span>
            <span>Kirim Konsultasi {selectedPackage.title} via WhatsApp</span>
          </button>
        </form>
      </div>

    </section>
  );
}
