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

  return (
    <section id="flash-sale-section" style={{ marginBottom: '24px' }}>
      <div className="marketplace-container">
        <div className="mp-flash-sale">
          
          {/* Header with Countdown */}
          <div className="mp-flash-header">
            <div className="mp-flash-badge">
              <span style={{ fontSize: '13px' }}>⚡</span>
              <span>{settings.badge_text || 'FLASH SALE'}</span>
            </div>
            <div className="mp-countdown-wrap">
              <span className="mp-countdown-label">Berakhir Dalam:</span>
              <div className="mp-countdown-box">
                <span className="mp-countdown-digit">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="mp-countdown-colon">:</span>
                <span className="mp-countdown-digit">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="mp-countdown-colon">:</span>
                <span className="mp-countdown-digit">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Slider Container with Left and Right Floating Nav Arrows */}
          <div className="mp-flash-slider-wrapper">
            {/* Left Nav Arrow */}
            {items.length > 0 && (
              <button
                type="button"
                className="mp-flash-nav-arrow mp-flash-nav-prev"
                onClick={() => scrollGrid('prev')}
                title="Produk sebelumnya"
                aria-label="Produk sebelumnya"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
            )}

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
                  <div className="mp-flash-img-wrap">
                    {item.gambar ? (
                      <img
                        src={item.gambar}
                        alt={item.nama_item}
                        className="mp-flash-img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="mp-flash-img-placeholder">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                      </div>
                    )}
                    <span className="mp-flash-discount-badge">
                      {item.diskon_persen || '-20%'}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="mp-flash-card-body">
                    <h4 className="mp-flash-card-title" title={item.nama_item}>
                      {item.nama_item}
                    </h4>

                    {/* Price Block: Stacked Hero Price & Origin Price */}
                    <div className="mp-flash-price-block">
                      <span className="mp-flash-price-sale">
                        Rp {formatRupiah(item.harga_diskon)}
                      </span>
                      {item.harga_asli ? (
                        <span className="mp-flash-price-origin">
                          Rp {formatRupiah(item.harga_asli)}
                        </span>
                      ) : null}
                    </div>

                    {/* Progress Bar "Segera Habis" */}
                    <div className="mp-flash-progress">
                      <div
                        className="mp-flash-progress-bar"
                        style={{
                          width: `${item.terjual_pct || 75}%`,
                        }}
                      />
                      <span className="mp-flash-progress-text">
                        🔥 SEGERA HABIS
                      </span>
                    </div>

                    {/* Action Button */}
                    {item.tipe === 'product' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart && onAddToCart(productPayload);
                        }}
                        className="mp-flash-btn-add"
                        title="Tambah ke keranjang"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span>+ Keranjang</span>
                      </button>
                    ) : (
                      <button
                        className="mp-flash-btn-add mp-flash-btn-digital"
                        title="Lihat promo layanan"
                      >
                        <span>Lihat Promo</span>
                        <span>›</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

            {/* Right Nav Arrow */}
            {items.length > 0 && (
              <button
                type="button"
                className="mp-flash-nav-arrow mp-flash-nav-next"
                onClick={() => scrollGrid('next')}
                title="Produk berikutnya"
                aria-label="Produk berikutnya"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
