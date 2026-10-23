import React, { useState, useEffect } from 'react';
import { fetchPublicBanners } from '../lib/api';

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
    fetchPublicBanners()
      .then((data) => {
        if (data && data.length > 0) {
          setSlides(data);
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
                      className="mp-carousel-img"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <div className="mp-carousel-content" style={{ color: '#FFFFFF', zIndex: 2 }}>
                    {slide.badge && (
                      <span
                        className="mp-carousel-badge"
                        style={{
                          color: slide.warna_accent || '#FFD700',
                          background: 'rgba(0,0,0,0.25)',
                        }}
                      >
                        {slide.badge}
                      </span>
                    )}
                    <h2 className="mp-carousel-title">
                      {slide.judul}
                    </h2>
                    {slide.subjudul && (
                      <p className="mp-carousel-sub">
                        {slide.subjudul}
                      </p>
                    )}
                    <button
                      onClick={handleClick}
                      className="mp-carousel-btn"
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
              onClick={() => {
                const el = document.getElementById('flash-sale-section');
                if (el) {
                  const headerHeight = document.querySelector('.mp-header')?.offsetHeight || 135;
                  const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
                  window.scrollTo({ top, behavior: 'smooth' });
                }
              }}
            >
              <div>
                <span className="mp-side-card-badge" style={{ color: '#EE4D2D' }}>
                  FLASH SALE
                </span>
                <h3 className="mp-side-card-title">
                  Kejar Diskon Terbatas
                </h3>
                <p className="mp-side-card-sub">
                  Dapatkan potongan harga langsung belanja produk katalog hari ini.
                </p>
              </div>
              <div className="mp-side-card-link-wrap">
                <span className="mp-side-card-link" style={{ color: '#EE4D2D' }}>
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
                <span className="mp-side-card-badge" style={{ color: '#7C3AED' }}>
                  BOOSTER MEDSOS
                </span>
                <h3 className="mp-side-card-title">
                  Rasxmedia SMM
                </h3>
                <p className="mp-side-card-sub">
                  Layanan followers, likes & views instan untuk akun media sosial Anda.
                </p>
              </div>
              <div className="mp-side-card-link-wrap">
                <span className="mp-side-card-link" style={{ color: '#7C3AED' }}>
                  Order Sekarang →
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
