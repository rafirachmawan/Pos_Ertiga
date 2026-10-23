import React, { useState } from 'react';
import { APP_DEV_DATA } from '../data/digitalServices';
import { generateWhatsAppAppDevUrl } from '../lib/whatsapp';

export default function WebDevSection({ storeInfo, embedded = false }) {
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

  const Wrapper = embedded ? 'div' : 'section';
  const wrapperProps = embedded
    ? { id: 'jasa-web-section' }
    : { id: 'jasa-web-section', className: 'mp-section-card', style: { marginBottom: '24px' } };

  return (
    <Wrapper {...wrapperProps}>
      
      {/* 1. Header / Subtitle Section */}
      {embedded ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', margin: '10px 0 16px 0', flexWrap: 'wrap' }}>
          <p style={{ fontSize: '12.5px', color: '#6B7280', margin: 0 }}>
            Solusi digital profesional: Landing Page, Toko Online E-Commerce, Sistem Kasir POS & Software Bisnis Custom.
          </p>
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
            Garansi & Full Support
          </span>
        </div>
      ) : (
        <div className="mp-section-header">
          <div>
            <h2 className="mp-section-title">
              <span>Jasa Pembuatan Website & Aplikasi Custom</span>
            </h2>
            <p style={{ fontSize: '12.5px', color: '#6B7280', margin: '2px 0 0 0' }}>
              Solusi digital profesional: Landing Page, Toko Online E-Commerce, Sistem Kasir POS & Software Bisnis Custom.
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
            Garansi & Full Support
          </span>
        </div>
      )}

      {/* 2. Key Value Highlights Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          padding: '12px 16px',
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>Pengerjaan Cepat</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>3 - 14 Hari Kerja Siap Pakai</div>
        </div>

        <div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>Mobile & SEO Friendly</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Responsif di HP, Tablet & Laptop</div>
        </div>

        <div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>Include Domain & Server</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Cloud Hosting & Domain .com</div>
        </div>

        <div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>Konsultasi Gratis</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Diskusi Teknis & Demo Sistem</div>
        </div>
      </div>

      {/* 3. Package Cards Grid (4 Pilihan Paket) */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>
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
            gap: '12px',
          }}
        >
          {APP_DEV_DATA.packages.map((pkg) => {
            const isSelected = selectedPackage.id === pkg.id;
            return (
              <div
                key={pkg.id}
                onClick={() => handleSelectPackageAndFocus(pkg)}
                style={{
                  border: isSelected ? '1.5px solid #03AC0E' : '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '16px',
                  background: isSelected ? '#F0FDF4' : '#FFFFFF',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#03AC0E';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isSelected ? '#03AC0E' : '#E2E8F0';
                }}
              >
                {/* Popular Recommendation Badge */}
                {pkg.popular && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-1px',
                      right: '12px',
                      background: '#03AC0E',
                      color: '#FFFFFF',
                      fontSize: '9.5px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '0 0 4px 4px',
                      letterSpacing: '0.02em',
                    }}
                  >
                    REKOMENDASI
                  </span>
                )}

                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: '700', color: '#0F172A', marginBottom: '4px', lineHeight: '1.3' }}>
                    {pkg.title}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginBottom: '12px' }}>
                    {pkg.tagline}
                  </div>

                  <div style={{ marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#03AC0E' }}>
                      {pkg.priceEstimate}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                      Estimasi: {pkg.estimatedDays}
                    </div>
                  </div>

                  {/* Feature List */}
                  <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {pkg.features.map((feat, idx) => (
                      <li key={idx} style={{ fontSize: '11.5px', color: '#334155', display: 'flex', alignItems: 'flex-start', gap: '6px', lineHeight: '1.4' }}>
                        <span style={{ color: '#03AC0E', fontWeight: '700', flexShrink: 0 }}>✓</span>
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
                    height: '34px',
                    background: isSelected ? '#03AC0E' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : '#03AC0E',
                    border: '1px solid #03AC0E',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isSelected ? 'Paket Dipilih' : 'Pilih Paket Ini'}
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
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '18px 20px',
          marginTop: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: '700', color: '#0F172A' }}>
              Form Konsultasi & Pemesanan Proyek
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748B' }}>
              Paket terpilih: <strong style={{ color: '#03AC0E' }}>{selectedPackage.title}</strong> ({selectedPackage.priceEstimate}). Kirim rincian kebutuhan Anda ke WhatsApp tim developer.
            </p>
          </div>

          <span
            style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#475569',
              background: '#FFFFFF',
              padding: '3px 8px',
              borderRadius: '4px',
              border: '1px solid #E2E8F0',
            }}
          >
            Direct WhatsApp Response
          </span>
        </div>

        <form onSubmit={handleSendWhatsApp}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            {/* Nama Klien */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
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
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '12.5px',
                  boxSizing: 'border-box',
                  background: '#FFFFFF',
                }}
              />
            </div>

            {/* No WhatsApp */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
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
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '12.5px',
                  boxSizing: 'border-box',
                  background: '#FFFFFF',
                }}
              />
            </div>

            {/* Rentang Budget */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                Rentang Budget yang Disediakan
              </label>
              <select
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '12.5px',
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
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
              Ceritakan Kebutuhan Website / Aplikasi Anda
            </label>
            <textarea
              rows={3}
              placeholder="Contoh: Butuh web toko online baju / retail dengan katalog produk, integrasi kasir POS, dan tombol direct checkout WhatsApp."
              value={projectBrief}
              onChange={(e) => setProjectBrief(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '12.5px',
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
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#028A0B')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#03AC0E')}
          >
            Kirim Konsultasi {selectedPackage.title} via WhatsApp
          </button>
        </form>
      </div>

    </Wrapper>
  );
}
