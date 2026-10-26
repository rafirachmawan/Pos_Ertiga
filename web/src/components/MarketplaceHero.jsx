import React, { useState, useEffect, useRef } from 'react';
import { fetchPublicBanners } from '../lib/api';

const DEFAULT_SLIDES = [
  {
    judul: 'Diskon Spesial Koleksi Fashion & Apparel',
    subjudul: 'Koleksi Kaos Distro, Hijab Muslimah & Aksesoris Terlengkap dengan Bahan Nyaman Berkualitas',
    badge: 'PROMO BULAN INI',
    warna_bg: 'linear-gradient(135deg, #0A4D2E 0%, #03AC0E 100%)',
    warna_accent: '#FFD700',
    gambar: '',
    link: '',
  },
  {
    judul: 'Top-Up Pulsa, Data & Token PLN Kilat',
    subjudul: 'Isi ulang all operator 24 Jam nonstop & bayar tagihan bulanan dengan harga grosir resmi',
    badge: 'LAYANAN DIGITAL',
    warna_bg: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
    warna_accent: '#93C5FD',
    gambar: '',
    link: '',
  },
  {
    judul: 'Investasi Logam Mulia Emas 24K Asli',
    subjudul: 'Antam & Mini Gold bersertifikat resmi terpercaya, melayani jual & buyback harga terbaik',
    badge: 'HEMAT & BERKAH',
    warna_bg: 'linear-gradient(135deg, #78350F 0%, #D97706 100%)',
    warna_accent: '#FDE68A',
    gambar: '',
    link: '',
  },
];

function getSlideHighlight(slide) {
  const text = `${slide.badge || ''} ${slide.judul || ''} ${slide.subjudul || ''}`.toLowerCase();
  if (text.includes('digital') || text.includes('pulsa') || text.includes('token') || text.includes('pln') || text.includes('tagihan')) {
    return {
      icon: '⚡',
      tag: 'Layanan Digital Kilat',
      title: 'Isi Pulsa & Paket Otomatis',
      chip: 'Transaksional 24 Jam Nonstop',
    };
  }
  if (text.includes('emas') || text.includes('logam') || text.includes('antam') || text.includes('gold')) {
    return {
      icon: '🪙',
      tag: 'Emas Murni 24 Karat',
      title: 'Investasi Amanah & Resmi',
      chip: 'Jual & Buyback Terpercaya',
    };
  }
  if (text.includes('fashion') || text.includes('kaos') || text.includes('hijab') || text.includes('pakaian') || text.includes('apparel')) {
    return {
      icon: '🛍️',
      tag: 'Katalog Fashion Pilihan',
      title: 'Bahan Premium & Nyaman',
      chip: 'Koleksi Tren Terbaru Hari Ini',
    };
  }
  return {
    icon: '🏷️',
    tag: 'Promo Toko Resmi',
    title: 'Produk Terbaik Pilihan Kami',
    chip: 'Jaminan Kualitas & Pelayanan',
  };
}

export default function MarketplaceHero({ onExploreProducts, onOpenDigitalModal }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [isPaused, setIsPaused] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startXRef = useRef(0);
  const isPointerDownRef = useRef(false);
  const didDragRef = useRef(false);

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

  // Slide navigation
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  // Auto rotate slides (paused on hover or drag)
  useEffect(() => {
    if (slides.length <= 1 || isPaused || isDragging) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length, isPaused, isDragging]);

  // Touch Swipe Handlers (Mobile)
  const handleTouchStart = (e) => {
    setIsPaused(true);
    setIsDragging(true);
    startXRef.current = e.touches[0].clientX;
    didDragRef.current = false;
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    if (Math.abs(diff) > 5) {
      didDragRef.current = true;
    }
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset < -45) {
      nextSlide();
    } else if (dragOffset > 45) {
      prevSlide();
    }
    setDragOffset(0);
    setIsPaused(false);
  };

  // Mouse Drag Handlers (Desktop)
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click
    isPointerDownRef.current = true;
    setIsPaused(true);
    setIsDragging(true);
    startXRef.current = e.clientX;
    didDragRef.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isPointerDownRef.current) return;
    const currentX = e.clientX;
    const diff = currentX - startXRef.current;
    if (Math.abs(diff) > 5) {
      didDragRef.current = true;
    }
    setDragOffset(diff);
  };

  const handleMouseUp = () => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setIsDragging(false);
    if (dragOffset < -45) {
      nextSlide();
    } else if (dragOffset > 45) {
      prevSlide();
    }
    setDragOffset(0);
    setIsPaused(false);
  };

  const handleMouseLeave = () => {
    if (isPointerDownRef.current) {
      isPointerDownRef.current = false;
      setIsDragging(false);
      setDragOffset(0);
    }
    setIsPaused(false);
  };



  return (
    <section className="mp-hero-section">
      <div className="marketplace-container">
        <div className="mp-hero-grid">
          
          {/* Full Width Hero Carousel */}
          <div
            className="mp-main-carousel"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            {/* Prev / Next Navigation Arrows */}
            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  className="mp-carousel-nav mp-carousel-nav-prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevSlide();
                  }}
                  aria-label="Slide sebelumnya"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="mp-carousel-nav mp-carousel-nav-next"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextSlide();
                  }}
                  aria-label="Slide berikutnya"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </>
            )}

            {/* Horizontal Sliding Track */}
            <div
              className="mp-carousel-track"
              style={{
                transform: `translateX(calc(-${currentSlide * 100}% + ${dragOffset}px))`,
                transition: isDragging ? 'none' : 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)',
              }}
            >
              {slides.map((slide, index) => {
                const highlight = getSlideHighlight(slide);
                const isFullBanner = slide.tipe === 'full' && Boolean(slide.gambar);

                const handleSlideClick = () => {
                  if (didDragRef.current) return;
                  if (slide.link) {
                    if (slide.link.startsWith('http://') || slide.link.startsWith('https://')) {
                      window.open(slide.link, '_blank', 'noopener,noreferrer');
                    } else {
                      window.location.href = slide.link;
                    }
                  } else if (onExploreProducts) {
                    onExploreProducts();
                  }
                };

                if (isFullBanner) {
                  return (
                    <div
                      key={slide.id || index}
                      className="mp-carousel-slide mp-carousel-slide-full"
                      style={{
                        background: slide.warna_bg || '#111827',
                        cursor: slide.link ? 'pointer' : 'default',
                      }}
                      onClick={handleSlideClick}
                      role={slide.link ? 'button' : undefined}
                      tabIndex={slide.link ? 0 : undefined}
                    >
                      <img
                        src={slide.gambar}
                        alt={slide.judul || 'Banner Promo Toko'}
                        className="mp-carousel-full-img"
                        draggable={false}
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={slide.id || index}
                    className="mp-carousel-slide"
                    style={{
                      background: slide.warna_bg || 'linear-gradient(135deg, #0A4D2E 0%, #03AC0E 100%)',
                      cursor: slide.link ? 'pointer' : 'default',
                    }}
                    onClick={slide.link ? handleSlideClick : undefined}
                  >
                    {/* Decorative Background Orbs for depth & premium feel */}
                    <div className="mp-carousel-orb-1" />
                    <div className="mp-carousel-orb-2" />

                    {/* Left Content Area */}
                    <div className="mp-carousel-content">
                      {slide.badge && (
                        <span
                          className="mp-carousel-badge"
                          style={{
                            color: slide.warna_accent || '#FFD700',
                            background: 'rgba(0, 0, 0, 0.28)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
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
                      <span
                        className="mp-carousel-btn"
                        style={{ cursor: slide.link ? 'pointer' : 'default' }}
                        onClick={handleSlideClick}
                      >
                        <span>Lihat Selengkapnya</span>
                        <span className="mp-carousel-btn-arrow">→</span>
                      </span>
                    </div>

                    {/* Right Showcase: Image OR Decorative Floating Card */}
                    {slide.gambar ? (
                      <div className="mp-carousel-image-wrap">
                        <img
                          src={slide.gambar}
                          alt={slide.judul}
                          className="mp-carousel-img"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          draggable={false}
                        />
                      </div>
                    ) : (
                      <div className="mp-carousel-deco-card">
                        <div className="mp-carousel-deco-icon">
                          {highlight.icon}
                        </div>
                        <div className="mp-carousel-deco-body">
                          <div className="mp-carousel-deco-tag" style={{ color: slide.warna_accent || '#FDE68A' }}>
                            {highlight.tag}
                          </div>
                          <div className="mp-carousel-deco-title">
                            {highlight.title}
                          </div>
                        </div>
                        <div className="mp-carousel-deco-chip">
                          <span>✨</span>
                          <span>{highlight.chip}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Slide Dots Indicator */}
            {slides.length > 1 && (
              <div className="mp-carousel-dots">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`mp-carousel-dot ${idx === currentSlide ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlide(idx);
                    }}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}

          </div>

        </div>
      </div>
    </section>
  );
}
