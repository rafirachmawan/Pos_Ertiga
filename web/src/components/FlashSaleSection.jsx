import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../lib/format';
import { fetchPublicFlashSale } from '../lib/api';

export default function FlashSaleSection({ products = [], onSelectProduct, onAddToCart, onOpenDigitalModal }) {
  const [flashData, setFlashData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Live countdown timer (ticks every second)
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 38,
    seconds: 45,
  });

  // Fetch dynamic flash sale from POS backend
  useEffect(() => {
    let mounted = true;
    fetchPublicFlashSale()
      .then((res) => {
        if (mounted && res) {
          setFlashData(res);
          if (res.settings?.durasi_jam) {
            setTimeLeft({
              hours: Math.max(0, Number(res.settings.durasi_jam) - 1),
              minutes: 45,
              seconds: 30,
            });
          }
        }
      })
      .catch((err) => console.warn('[FlashSale] Error fetching data:', err))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Countdown timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 2, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Settings & Items
  const settings = flashData?.settings || {
    judul: 'FLASH SALE',
    subjudul: 'Promo Terbatas Hari Ini',
    badge_text: 'FLASH SALE',
    aktif: 1,
  };

  // If flash sale is turned off from POS Ertiga, hide the section
  if (settings.aktif === 0 || settings.aktif === false) {
    return null;
  }

  const items = flashData?.items || [];
  if (items.length === 0 && !loading) {
    return null;
  }

  const gridRef = React.useRef(null);

  const scrollGrid = (direction) => {
    if (!gridRef.current) return;
    const container = gridRef.current;
    // Exactly 1 slide (the full width of 4 cards)
    const scrollAmount = container.clientWidth;
    container.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section id="flash-sale-section" style={{ marginBottom: '24px' }}>
      <div className="marketplace-container">
        <div className="mp-flash-sale">
          
          {/* Header with Countdown */}
          <div className="mp-flash-header">
            <div className="mp-flash-title-wrap">
              <span className="mp-flash-badge">
                <span>{settings.badge_text || 'FLASH SALE'}</span>
              </span>
              <span style={{ fontSize: '13px', fontWeight: '600' }}>
                Berakhir Dalam:
              </span>
              <div className="mp-countdown-box">
                <span className="mp-countdown-digit">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="mp-countdown-digit">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="mp-countdown-digit">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>
                {settings.subjudul || 'Promo Terbatas Hari Ini'}
              </div>

              {items.length > 4 && (
                <div className="mp-flash-nav-wrap">
                  <button
                    type="button"
                    className="mp-flash-nav-btn"
                    onClick={() => scrollGrid('prev')}
                    title="Slide sebelumnya"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="mp-flash-nav-btn"
                    onClick={() => scrollGrid('next')}
                    title="Slide berikutnya"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Flash Sale Product Cards */}
          <div className="mp-flash-grid" ref={gridRef}>
            {items.map((item, idx) => {
              // Construct product payload for cart or modal
              const productPayload = {
                id: item.barang_id || `fs-${item.id}`,
                nama_barang: item.nama_item,
                harga_jual: item.harga_diskon,
                gambar: item.gambar,
                satuan: item.satuan || 'pcs',
                stok: item.stok ?? 50,
                berat_gram: item.berat_gram || 200,
                barcode: item.barcode || '',
                deskripsi: item.deskripsi || '',
              };

              return (
                <div
                  key={item.id || idx}
                  className="mp-flash-card"
                  onClick={() => {
                    if (item.tipe === 'product' && onSelectProduct) {
                      onSelectProduct(productPayload);
                    } else if (item.tipe === 'digital') {
                      if (item.target_link === 'deal-emas' || item.target_link?.includes('emas')) {
                        const el = document.getElementById('logam-mulia-section');
                        if (el) {
                          const headerHeight = document.querySelector('.mp-header')?.offsetHeight || 135;
                          const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
                          window.scrollTo({ top, behavior: 'smooth' });
                        }
                      } else if (item.target_link === 'ppob' || item.target_link === 'deal-pln') {
                        if (onOpenDigitalModal) onOpenDigitalModal('ppob');
                      } else if (item.target_link === 'smm') {
                        const el = document.getElementById('booster-sosmed-section');
                        if (el) {
                          const headerHeight = document.querySelector('.mp-header')?.offsetHeight || 135;
                          const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
                          window.scrollTo({ top, behavior: 'smooth' });
                        }
                      } else if (item.target_link === 'web') {
                        const el = document.getElementById('jasa-web-section');
                        if (el) {
                          const headerHeight = document.querySelector('.mp-header')?.offsetHeight || 135;
                          const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
                          window.scrollTo({ top, behavior: 'smooth' });
                        }
                      }
                    }
                  }}
                >
                  {/* Image with discount badge */}
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#F8F9FA' }}>
                    {item.gambar ? (
                      <img
                        src={item.gambar}
                        alt={item.nama_item}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                      </div>
                    )}
                    <span
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        background: '#EE4D2D',
                        color: '#FFFFFF',
                        fontWeight: '800',
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      }}
                    >
                      {item.diskon_persen || '-20%'}
                    </span>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '10px 12px 12px' }}>
                    <h4
                      style={{
                        fontSize: '12.5px',
                        fontWeight: '600',
                        color: '#1F2937',
                        lineHeight: '1.3',
                        marginBottom: '4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.nama_item}
                    </h4>

                    {/* Price */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#EE4D2D' }}>
                        Rp {formatRupiah(item.harga_diskon)}
                      </span>
                      <span style={{ fontSize: '11px', color: '#9CA3AF', textDecoration: 'line-through' }}>
                        Rp {formatRupiah(item.harga_asli)}
                      </span>
                    </div>

                    {/* Progress Bar "Segera Habis" */}
                    <div style={{ width: '100%', background: '#FEE2E2', borderRadius: '9999px', height: '14px', position: 'relative', overflow: 'hidden' }}>
                      <div
                        style={{
                          background: 'linear-gradient(90deg, #EE4D2D 0%, #FF7337 100%)',
                          width: `${item.terjual_pct || 75}%`,
                          height: '100%',
                          borderRadius: '9999px',
                        }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          inset: 0,
                          fontSize: '9.5px',
                          fontWeight: '700',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                        }}
                      >
                        SEGERA HABIS
                      </span>
                    </div>

                    {/* Add to Cart button */}
                    {item.tipe === 'product' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart && onAddToCart(productPayload);
                        }}
                        style={{
                          width: '100%',
                          marginTop: '8px',
                          padding: '6px 0',
                          background: '#EE4D2D',
                          color: '#FFFFFF',
                          borderRadius: '4px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        + Keranjang
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.target_link === 'deal-emas' || item.target_link?.includes('emas')) {
                            const el = document.getElementById('logam-mulia-section');
                            if (el) {
                              const headerHeight = document.querySelector('.mp-header')?.offsetHeight || 135;
                              const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
                              window.scrollTo({ top, behavior: 'smooth' });
                            }
                          } else if (item.target_link === 'ppob' || item.target_link === 'deal-pln') {
                            if (onOpenDigitalModal) onOpenDigitalModal('ppob');
                          } else if (item.target_link === 'smm') {
                            const el = document.getElementById('booster-sosmed-section');
                            if (el) {
                              const headerHeight = document.querySelector('.mp-header')?.offsetHeight || 135;
                              const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
                              window.scrollTo({ top, behavior: 'smooth' });
                            }
                          } else if (item.target_link === 'web') {
                            const el = document.getElementById('jasa-web-section');
                            if (el) {
                              const headerHeight = document.querySelector('.mp-header')?.offsetHeight || 135;
                              const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
                              window.scrollTo({ top, behavior: 'smooth' });
                            }
                          }
                        }}
                        style={{
                          width: '100%',
                          marginTop: '8px',
                          padding: '6px 0',
                          background: '#03AC0E',
                          color: '#FFFFFF',
                          borderRadius: '4px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Lihat Promo
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
