import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../lib/format';
import { generateWhatsAppSmmUrl } from '../lib/whatsapp';
import { fetchPublicSmm, FALLBACK_SMM } from '../lib/api';

// SVG icons for platforms
const PlatformIcon = ({ slug, color }) => {
  if (slug === 'tiktok') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={color || '#000'}>
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.7 4.58 6.3 6.3 0 001.82-4.44V8.89a8.28 8.28 0 004.85 1.57v-3.4a4.85 4.85 0 01-.93-.37z"/>
      </svg>
    );
  }
  if (slug === 'instagram') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={color || '#E1306C'}>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    );
  }
  if (slug === 'youtube') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={color || '#FF0000'}>
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    );
  }
  // Default icon
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color || '#7C3AED'} strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
};

export default function SmmSection({ storeInfo }) {
  const [platforms, setPlatforms] = useState(FALLBACK_SMM);
  const [selectedPlatformId, setSelectedPlatformId] = useState(FALLBACK_SMM[0]?.id || 1);
  const [loading, setLoading] = useState(false);

  // Order modal state
  const [orderingService, setOrderingService] = useState(null); // { service, platform, selectedPackage }
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
            <span>🚀</span>
            <span>Booster Sosial Media (SMM Panel)</span>
          </h2>
          <p style={{ fontSize: '12.5px', color: '#6B7280', margin: '2px 0 0 0' }}>
            Tingkatkan kredibilitas akun TikTok, Instagram & YouTube Anda. 100% aman tanpa password!
          </p>
        </div>

        <span
          style={{
            fontSize: '11.5px',
            fontWeight: '700',
            color: '#6D28D9',
            background: '#F5F3FF',
            border: '1px solid #DDD6FE',
            padding: '4px 10px',
            borderRadius: '4px',
          }}
        >
          Garansi & Aman 🔒
        </span>
      </div>

      {/* 2. Platform Tabs */}
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
                padding: '8px 16px',
                borderRadius: '20px',
                border: `1.5px solid ${isSelected ? (p.color || '#7C3AED') : '#E2E8F0'}`,
                background: isSelected ? `${p.color}10` : '#FFFFFF',
                color: isSelected ? (p.color || '#7C3AED') : '#475569',
                fontWeight: isSelected ? '700' : '600',
                fontSize: '12.5px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? `0 1px 3px ${p.color}22` : 'none',
              }}
            >
              <PlatformIcon slug={p.slug} color={isSelected ? p.color : '#94A3B8'} />
              <span>{p.nama_platform}</span>
              <span style={{ fontSize: '11px', opacity: 0.75 }}>
                ({totalPkgs})
              </span>
            </button>
          );
        })}
      </div>

      {/* Platform Description */}
      {activePlatform.deskripsi && (
        <div
          style={{
            background: '#F5F3FF',
            border: '1px solid #EDE9FE',
            borderRadius: '8px',
            padding: '8px 14px',
            marginBottom: '16px',
            fontSize: '12px',
            color: '#5B21B6',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>ℹ️</span>
          <span>{activePlatform.deskripsi}</span>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {services.map((service) => {
            const packages = service.packages || [];
            return (
              <div
                key={service.id}
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#FFFFFF',
                }}
              >
                {/* Service Header */}
                <div
                  style={{
                    padding: '12px 16px',
                    background: '#FAFAFA',
                    borderBottom: '1px solid #F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>
                        {service.nama_layanan}
                      </span>
                    </div>
                    {service.deskripsi && (
                      <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                        {service.deskripsi}
                      </p>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: '600',
                      background: '#EFF6FF',
                      color: '#2563EB',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid #BFDBFE',
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
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '12px',
                    padding: '14px 16px',
                  }}
                >
                  {packages.map((pkg) => {
                    const isPopular = Boolean(pkg.is_popular);
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => handleOpenOrder(service, activePlatform, pkg)}
                        style={{
                          border: isPopular ? `1.5px solid ${activePlatform.color || '#7C3AED'}` : '1px solid #E2E8F0',
                          borderRadius: '10px',
                          padding: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                          background: isPopular ? `${activePlatform.color || '#7C3AED'}08` : '#FFFFFF',
                          position: 'relative',
                          boxShadow: isPopular ? `0 2px 6px ${activePlatform.color || '#7C3AED'}15` : '0 1px 3px rgba(0,0,0,0.03)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = `0 4px 12px ${activePlatform.color || '#7C3AED'}20`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = isPopular ? `0 2px 6px ${activePlatform.color || '#7C3AED'}15` : '0 1px 3px rgba(0,0,0,0.03)';
                        }}
                      >
                        {/* Popular badge */}
                        {isPopular && (
                          <span
                            style={{
                              position: 'absolute',
                              top: '-1px',
                              right: '10px',
                              background: activePlatform.color || '#7C3AED',
                              color: '#FFFFFF',
                              fontSize: '9.5px',
                              fontWeight: '800',
                              padding: '2px 8px 3px',
                              borderRadius: '0 0 6px 6px',
                              letterSpacing: '0.02em',
                            }}
                          >
                            ⭐ TERLARIS
                          </span>
                        )}

                        {/* Qty */}
                        <div
                          style={{
                            fontSize: '22px',
                            fontWeight: '800',
                            color: activePlatform.color || '#7C3AED',
                            marginBottom: '4px',
                            lineHeight: 1.2,
                          }}
                        >
                          {Number(pkg.jumlah_order).toLocaleString('id-ID')}
                        </div>

                        {/* Price */}
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: '700',
                            color: '#0F172A',
                            marginBottom: '8px',
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
                            padding: '7px 0',
                            background: activePlatform.color || '#7C3AED',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'opacity 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.target.style.opacity = '0.85')}
                          onMouseLeave={(e) => (e.target.style.opacity = '1')}
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
          marginTop: '18px',
          padding: '12px 16px',
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          borderRadius: '8px',
          fontSize: '11.5px',
          color: '#065F46',
        }}
      >
        <div style={{ fontWeight: '700', marginBottom: '6px' }}>🛡️ Keamanan & Garansi:</div>
        <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: '1.7' }}>
          <li>100% AMAN: HANYA butuh link / username. Kami TIDAK PERNAH meminta password akun Anda.</li>
          <li>Akun / postingan WAJIB dipublikasikan (tidak di-private) selama proses pengiriman.</li>
          <li>Proses masuk secara natural dan bertahap dalam kurun waktu 1 - 24 jam.</li>
          <li>Garansi pengisian ulang gratis jika jumlah berkurang dalam masa garansi.</li>
        </ul>
      </div>

      {/* ── ORDER MODAL ─────────────────────────────────────── */}
      {orderingService && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
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
              borderRadius: '14px',
              width: '100%',
              maxWidth: '440px',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '0',
              boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.2)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                background: orderingService.platform.color || '#7C3AED',
                color: '#FFFFFF',
                borderRadius: '14px 14px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '15px', fontWeight: '800' }}>
                  Order {orderingService.platform.nama_platform}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  {orderingService.service.nama_layanan}
                </div>
              </div>
              <button
                onClick={() => setOrderingService(null)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '16px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendWhatsApp} style={{ padding: '20px' }}>
              {/* 1. Pilih Paket */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                  1. Pilih Paket Kuantitas *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                  {(orderingService.service.packages || []).map((pkg) => {
                    const isChosen = selectedPackage?.id === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedPackage(pkg)}
                        style={{
                          padding: '10px 8px',
                          border: isChosen
                            ? `2px solid ${orderingService.platform.color || '#7C3AED'}`
                            : '1px solid #E2E8F0',
                          borderRadius: '8px',
                          background: isChosen ? `${orderingService.platform.color || '#7C3AED'}10` : '#FAFAFA',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ fontSize: '16px', fontWeight: '800', color: isChosen ? (orderingService.platform.color || '#7C3AED') : '#0F172A' }}>
                          {Number(pkg.jumlah_order).toLocaleString('id-ID')}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#475569', marginTop: '2px' }}>
                          Rp {formatRupiah(pkg.harga_jual)}
                        </div>
                        {pkg.is_popular ? (
                          <span style={{ fontSize: '9px', fontWeight: '700', color: '#D97706' }}>⭐ BEST</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Target Link/Username */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
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
                    padding: '10px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* 3. Nama */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  3. Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama pemesan"
                  value={customer.nama}
                  onChange={(e) => setCustomer({ ...customer, nama: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* 4. No WA */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
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
                    padding: '10px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '13px',
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
                    borderRadius: '8px',
                    padding: '12px 14px',
                    marginBottom: '16px',
                    fontSize: '12.5px',
                    color: '#334155',
                  }}
                >
                  <div style={{ fontWeight: '700', marginBottom: '6px', color: '#0F172A' }}>📋 Ringkasan Pesanan:</div>
                  <div>• Platform: <strong>{orderingService.platform.nama_platform}</strong></div>
                  <div>• Layanan: <strong>{orderingService.service.nama_layanan}</strong></div>
                  <div>• Kuantitas: <strong>{Number(selectedPackage.jumlah_order).toLocaleString('id-ID')}</strong></div>
                  <div style={{ marginTop: '6px', fontSize: '14px', fontWeight: '800', color: orderingService.platform.color || '#7C3AED' }}>
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
                  padding: '12px 0',
                  background: selectedPackage ? '#25D366' : '#CBD5E1',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: selectedPackage ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background 0.15s ease',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.507 3.932 1.396 5.608L0 24l6.545-1.317A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.875 0-3.638-.5-5.152-1.377l-.37-.217-3.827.77.849-3.744-.24-.379A9.691 9.691 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/>
                </svg>
                {selectedPackage ? 'Kirim Pesanan via WhatsApp' : 'Pilih Paket Terlebih Dahulu'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
