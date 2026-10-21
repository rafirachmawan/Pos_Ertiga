import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.DEV ? 'http://127.0.0.1:3001' : '';

const DEFAULT_SLIDES = [
  {
    judul: 'Diskon Spesial Koleksi Fashion & Apparel',
    subjudul: 'Koleksi Kaos Distro, Hijab Muslimah & Aksesoris Terlengkap',
    badge: 'PROMO BULAN INI',
    warna_bg: 'linear-gradient(135deg, #0A4D2E 0%, #03AC0E 100%)',
    warna_accent: '#FFD700',
    gambar: '',
    link: '',
  },
  {
    judul: 'Top-Up Pulsa, Data & Token PLN Kilat',
    subjudul: 'Isi ulang all operator 24 Jam & bayar tagihan dengan harga grosir',
    badge: 'LAYANAN DIGITAL',
    warna_bg: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
    warna_accent: '#93C5FD',
    gambar: '',
    link: '',
  },
  {
    judul: 'Investasi Logam Mulia Emas 24K Asli',
    subjudul: 'Antam & Mini Gold bersertifikat resmi, melayani jual & buyback',
    badge: 'HEMAT & BERKAH',
    warna_bg: 'linear-gradient(135deg, #78350F 0%, #D97706 100%)',
    warna_accent: '#FDE68A',
    gambar: '',
    link: '',
  },
];

export default function MarketplaceHero({ onExploreProducts, onOpenDigitalModal }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState(DEFAULT_SLIDES);

  // Fetch banners from API
  useEffect(() => {
    fetch('/api/public/banners')
      .then((r) => r.json())
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setSlides(res.data);
        }
      })
      .catch(() => {
        // Fallback to defaults silently
      });
  }, []);

  // Auto rotate slides
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="mp-hero-section">
      <div className="marketplace-container">
        <div className="mp-hero-grid">
          
          {/* Main Carousel Slider */}
          <div className="mp-main-carousel">
            {slides.map((slide, index) => {
              const isActive = index === currentSlide;
              const handleClick = () => {
                if (slide.link) {
                  window.open(slide.link, '_blank');
                } else {
                  onExploreProducts && onExploreProducts();
                }
              };
              return (
                <div
                  key={slide.id || index}
                  className={`mp-carousel-slide ${isActive ? 'active' : ''}`}
                  style={{ background: slide.warna_bg || 'linear-gradient(135deg, #0A4D2E 0%, #03AC0E 100%)' }}
                >
                  {slide.gambar && (
                    <img
                      src={slide.gambar}
                      alt=""
                      style={{
                        position: 'absolute', right: '30px', top: '50%', transform: 'translateY(-50%)',
                        maxHeight: '180px', maxWidth: '220px', objectFit: 'contain', opacity: 0.9, zIndex: 1,
                      }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <div style={{ maxWidth: '480px', color: '#FFFFFF', zIndex: 2 }}>
                    {slide.badge && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          color: slide.warna_accent || '#FFD700',
                          background: 'rgba(0,0,0,0.25)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          letterSpacing: '0.05em',
                          display: 'inline-block',
                          marginBottom: '10px',
                        }}
                      >
                        {slide.badge}
                      </span>
                    )}
                    <h2
                      style={{
                        fontSize: '24px',
                        fontWeight: '800',
                        lineHeight: '1.25',
                        marginBottom: '8px',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {slide.judul}
                    </h2>
                    {slide.subjudul && (
                      <p
                        style={{
                          fontSize: '13px',
                          opacity: 0.9,
                          marginBottom: '18px',
                          lineHeight: '1.4',
                        }}
                      >
                        {slide.subjudul}
                      </p>
                    )}
                    <button
                      onClick={handleClick}
                      style={{
                        background: '#FFFFFF',
                        color: '#111827',
                        fontWeight: '700',
                        fontSize: '12.5px',
                        padding: '9px 18px',
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        transition: 'transform 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                      Lihat Selengkapnya →
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Slide Dots Indicator */}
            <div className="mp-carousel-dots">
              {slides.map((_, idx) => (
                <div
                  key={idx}
                  className={`mp-carousel-dot ${idx === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(idx)}
                />
              ))}
            </div>
          </div>

          {/* Right 2 Side Promo Banners (Tokopedia & Shopee Desktop Signature) */}
          <div className="mp-side-banners">
            
            {/* Banner 1 */}
            <div
              className="mp-side-banner-card"
              style={{
                background: 'linear-gradient(135deg, #FFF5F1 0%, #FFE6DC 100%)',
                border: '1px solid #FFCCBC',
              }}
              onClick={() => onExploreProducts && onExploreProducts()}
            >
              <div>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: '800',
                    color: '#EE4D2D',
                    background: '#FFFFFF',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  FLASH SALE
                </span>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1F2937', marginTop: '6px', marginBottom: '4px' }}>
                  Kejar Diskon Terbatas
                </h3>
                <p style={{ fontSize: '11.5px', color: '#6B7280', margin: 0 }}>
                  Dapatkan potongan harga langsung belanja produk katalog hari ini.
                </p>
              </div>
              <div style={{ marginTop: '12px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#EE4D2D' }}>
                  Lihat Promo →
                </span>
              </div>
            </div>

            {/* Banner 2 */}
            <div
              className="mp-side-banner-card"
              style={{
                background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
                border: '1px solid #DDD6FE',
              }}
              onClick={() => {
                const el = document.getElementById('booster-sosmed-section');
                if (el) {
                  const headerHeight = document.querySelector('.mp-header')?.offsetHeight || 135;
                  const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
                  window.scrollTo({ top, behavior: 'smooth' });
                } else if (onOpenDigitalModal) {
                  onOpenDigitalModal('rasxmedia');
                }
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: '800',
                    color: '#7C3AED',
                    background: '#FFFFFF',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  BOOSTER MEDSOS
                </span>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1F2937', marginTop: '6px', marginBottom: '4px' }}>
                  Rasxmedia SMM
                </h3>
                <p style={{ fontSize: '11.5px', color: '#6B7280', margin: 0 }}>
                  Follower, Like & Views TikTok, IG, YT bergaransi tanpa password.
                </p>
              </div>
              <div style={{ marginTop: '12px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#7C3AED' }}>
                  Cek Layanan →
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
