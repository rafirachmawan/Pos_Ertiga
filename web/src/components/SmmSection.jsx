import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../lib/format';
import { generateWhatsAppSmmUrl } from '../lib/whatsapp';
import { fetchPublicSmm, FALLBACK_SMM } from '../lib/api';

// SVG icons for platforms
const PlatformIcon = ({ slug, isSelected }) => {
  const iconColor = isSelected ? '#03AC0E' : '#64748B';
  if (slug === 'tiktok') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill={iconColor}>
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.7 4.58 6.3 6.3 0 001.82-4.44V8.89a8.28 8.28 0 004.85 1.57v-3.4a4.85 4.85 0 01-.93-.37z"/>
      </svg>
    );
  }
  if (slug === 'instagram') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill={iconColor}>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    );
  }
  if (slug === 'youtube') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill={iconColor}>
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    );
  }
  return null;
};

export default function SmmSection({ storeInfo }) {
  const [platforms, setPlatforms] = useState(FALLBACK_SMM);
  const [selectedPlatformId, setSelectedPlatformId] = useState(FALLBACK_SMM[0]?.id || 1);
  const [loading, setLoading] = useState(false);

  // Order modal state
  const [orderingService, setOrderingService] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [customer, setCustomer] = useState({
    nama: '',
    telepon: '',
    targetLink: '',
  });

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchPublicSmm();
        if (isMounted && data && data.length > 0) {
          setPlatforms(data);
          const exists = data.some((p) => p.id === selectedPlatformId);
          if (!exists) setSelectedPlatformId(data[0].id);
        }
      } catch (err) {
        console.warn('Gagal memuat data SMM:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const activePlatform = platforms.find((p) => p.id === selectedPlatformId) || platforms[0] || {};
  const services = activePlatform.services || [];

  const handleOpenOrder = (service, platform, pkg = null) => {
    setOrderingService({ service, platform });
    setSelectedPackage(pkg || service.packages?.[0] || null);
    setCustomer({ nama: '', telepon: '', targetLink: '' });
  };

  const handleSendWhatsApp = (e) => {
    e.preventDefault();
    if (!orderingService || !selectedPackage) return;
    if (!customer.nama.trim() || !customer.telepon.trim()) {
      alert('Mohon lengkapi Nama dan Nomor WhatsApp Anda.');
      return;
    }
    if (!customer.targetLink.trim()) {
      alert('Mohon isi Link / Username target akun Anda.');
      return;
    }

    const storePhone = storeInfo?.alamat_toko?.match(/08[0-9-]+/)?.[0] || '6281234567890';

    const waUrl = generateWhatsAppSmmUrl({
      storePhone,
      platform: orderingService.platform.nama_platform,
      serviceName: orderingService.service.nama_layanan,
      targetLink: customer.targetLink,
      qty: selectedPackage.jumlah_order,
      price: selectedPackage.harga_jual,
      customer,
    });

    window.open(waUrl, '_blank');
    setOrderingService(null);
  };

  return (
    <section id="booster-sosmed-section" className="mp-section-card" style={{ marginBottom: '24px' }}>

      {/* 1. Header Section */}
      <div className="mp-section-header">
        <div>
          <h2 className="mp-section-title">
            <span>Booster Sosial Media (SMM Panel)</span>
          </h2>
          <p style={{ fontSize: '12.5px', color: '#6B7280', margin: '2px 0 0 0' }}>
            Tingkatkan kredibilitas akun TikTok, Instagram & YouTube Anda. Aman dan tanpa password.
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
          Garansi & Tanpa Password
        </span>
      </div>

      {/* 2. Platform Tabs (Clean pills) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          marginBottom: '16px',
          paddingBottom: '14px',
          borderBottom: '1px solid #F1F5F9',
        }}
      >
        {platforms.map((p) => {
          const isSelected = selectedPlatformId === p.id;
          const totalPkgs = (p.services || []).reduce((acc, s) => acc + (s.packages?.length || 0), 0);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPlatformId(p.id)}
              style={{
                padding: '7px 16px',
                borderRadius: '8px',
                border: isSelected ? '1px solid #03AC0E' : '1px solid #E2E8F0',
                background: isSelected ? '#E8F8EE' : '#FFFFFF',
                color: isSelected ? '#03AC0E' : '#475569',
                fontWeight: isSelected ? '700' : '500',
                fontSize: '12.5px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              <PlatformIcon slug={p.slug} isSelected={isSelected} />
              <span>{p.nama_platform}</span>
              <span style={{ fontSize: '11px', opacity: 0.75 }}>
                ({totalPkgs})
              </span>
            </button>
          );
        })}
      </div>

      {/* Platform Description note */}
      {activePlatform.deskripsi && (
        <div
          style={{
            fontSize: '12px',
            color: '#64748B',
            marginBottom: '16px',
            lineHeight: '1.5',
          }}
        >
          {activePlatform.deskripsi}
        </div>
      )}

      {/* 3. Services & Packages */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8', fontSize: '13px' }}>
          Memuat layanan booster sosmed...
        </div>
      ) : services.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 16px', background: '#F8FAFC', borderRadius: '10px', color: '#94A3B8', fontSize: '13px', border: '1px dashed #CBD5E1' }}>
          Belum ada layanan tersedia untuk {activePlatform.nama_platform}. Silakan hubungi Admin.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {services.map((service) => {
            const packages = service.packages || [];
            return (
              <div
                key={service.id}
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: '#FFFFFF',
                }}
              >
                {/* Service Header */}
                <div
                  style={{
                    padding: '12px 16px',
                    background: '#F8FAFC',
                    borderBottom: '1px solid #F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>
                      {service.nama_layanan}
                    </span>
                    {service.deskripsi && (
                      <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                        {service.deskripsi}
                      </p>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#64748B',
                      background: '#FFFFFF',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid #E2E8F0',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {service.target_type}
                  </span>
                </div>

                {/* Packages Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '10px',
                    padding: '12px 16px',
                  }}
                >
                  {packages.map((pkg) => {
                    const isPopular = Boolean(pkg.is_popular);
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => handleOpenOrder(service, activePlatform, pkg)}
                        style={{
                          border: isPopular ? '1px solid #03AC0E' : '1px solid #E2E8F0',
                          borderRadius: '8px',
                          padding: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          background: isPopular ? '#F0FDF4' : '#FFFFFF',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#03AC0E';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = isPopular ? '#03AC0E' : '#E2E8F0';
                        }}
                      >
                        {/* Popular badge */}
                        {isPopular && (
                          <span
                            style={{
                              position: 'absolute',
                              top: '-1px',
                              right: '8px',
                              background: '#03AC0E',
                              color: '#FFFFFF',
                              fontSize: '9px',
                              fontWeight: '700',
                              padding: '2px 6px',
                              borderRadius: '0 0 4px 4px',
                            }}
                          >
                            TERLARIS
                          </span>
                        )}

                        {/* Qty */}
                        <div
                          style={{
                            fontSize: '18px',
                            fontWeight: '800',
                            color: '#0F172A',
                            marginBottom: '2px',
                            lineHeight: 1.2,
                          }}
                        >
                          {Number(pkg.jumlah_order).toLocaleString('id-ID')}
                        </div>

                        {/* Price */}
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: '700',
                            color: '#03AC0E',
                            marginBottom: '10px',
                          }}
                        >
                          Rp {formatRupiah(pkg.harga_jual)}
                        </div>

                        {/* CTA */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenOrder(service, activePlatform, pkg);
                          }}
                          style={{
                            width: '100%',
                            height: '32px',
                            background: '#0F172A',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.target.style.background = '#03AC0E')}
                          onMouseLeave={(e) => (e.target.style.background = '#0F172A')}
                        >
                          Pesan via WhatsApp
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Safety Notes */}
      <div
        style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          fontSize: '11.5px',
          color: '#475569',
        }}
      >
        <div style={{ fontWeight: '700', color: '#0F172A', marginBottom: '6px' }}>Keamanan & Ketentuan Layanan:</div>
        <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: '1.7' }}>
          <li>100% AMAN: Hanya butuh link / username. Kami TIDAK PERNAH meminta password akun Anda.</li>
          <li>Akun / postingan WAJIB bersifat publik (tidak di-private) selama proses pengiriman.</li>
          <li>Proses masuk secara natural dan bertahap dalam kurun waktu 1 - 24 jam.</li>
          <li>Garansi pengisian ulang jika kuantitas mengalami penurunan dalam masa garansi.</li>
        </ul>
      </div>

      {/* ── ORDER MODAL ─────────────────────────────────────── */}
      {orderingService && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOrderingService(null);
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '440px',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '0',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.15)',
              border: '1px solid #E2E8F0',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #E2E8F0',
                background: '#FFFFFF',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>
                  Order {orderingService.platform.nama_platform}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  {orderingService.service.nama_layanan}
                </div>
              </div>
              <button
                onClick={() => setOrderingService(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendWhatsApp} style={{ padding: '20px' }}>
              {/* 1. Pilih Paket */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                  1. Pilih Paket Kuantitas *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
                  {(orderingService.service.packages || []).map((pkg) => {
                    const isChosen = selectedPackage?.id === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedPackage(pkg)}
                        style={{
                          padding: '8px',
                          border: isChosen ? '1px solid #03AC0E' : '1px solid #E2E8F0',
                          borderRadius: '6px',
                          background: isChosen ? '#E8F8EE' : '#FFFFFF',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ fontSize: '15px', fontWeight: '800', color: isChosen ? '#03AC0E' : '#0F172A' }}>
                          {Number(pkg.jumlah_order).toLocaleString('id-ID')}
                        </div>
                        <div style={{ fontSize: '11.5px', fontWeight: '600', color: '#475569', marginTop: '2px' }}>
                          Rp {formatRupiah(pkg.harga_jual)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Target Link/Username */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  2. {orderingService.service.target_type || 'Link / Username Target'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={orderingService.service.target_type || 'Contoh: @akun_kamu atau link postingan'}
                  value={customer.targetLink}
                  onChange={(e) => setCustomer({ ...customer, targetLink: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* 3. Nama */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  3. Nama Pemesan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama pemesan"
                  value={customer.nama}
                  onChange={(e) => setCustomer({ ...customer, nama: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* 4. No WA */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  4. Nomor WhatsApp Aktif *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0812-xxxx-xxxx"
                  value={customer.telepon}
                  onChange={(e) => setCustomer({ ...customer, telepon: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Summary */}
              {selectedPackage && (
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    marginBottom: '16px',
                    fontSize: '12px',
                    color: '#334155',
                  }}
                >
                  <div style={{ fontWeight: '700', marginBottom: '4px', color: '#0F172A' }}>Ringkasan Pesanan:</div>
                  <div>• Platform: <strong>{orderingService.platform.nama_platform}</strong></div>
                  <div>• Layanan: <strong>{orderingService.service.nama_layanan}</strong></div>
                  <div>• Kuantitas: <strong>{Number(selectedPackage.jumlah_order).toLocaleString('id-ID')}</strong></div>
                  <div style={{ marginTop: '4px', fontSize: '13.5px', fontWeight: '800', color: '#03AC0E' }}>
                    Total: Rp {formatRupiah(selectedPackage.harga_jual)}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!selectedPackage}
                style={{
                  width: '100%',
                  height: '38px',
                  background: selectedPackage ? '#03AC0E' : '#CBD5E1',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: selectedPackage ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (selectedPackage) e.target.style.background = '#028A0B';
                }}
                onMouseLeave={(e) => {
                  if (selectedPackage) e.target.style.background = '#03AC0E';
                }}
              >
                {selectedPackage ? 'Kirim Pesanan via WhatsApp' : 'Pilih Paket Terlebih Dahulu'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
