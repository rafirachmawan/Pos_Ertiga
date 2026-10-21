import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../lib/format';

export default function FlashSaleSection({ products = [], onSelectProduct, onAddToCart, onOpenDigitalModal }) {
  // Live countdown timer (ticks every second)
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 42,
    seconds: 15,
  });

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

  // Curated Flash Items (Physical Products + Digital Deals like Tokopedia/Shopee flash deals)
  const flashItems = [
    ...(products || []).slice(0, 3).map((p, idx) => ({
      id: p.id,
      nama: p.nama_barang,
      gambar: p.gambar,
      harga_diskon: p.harga_jual,
      harga_asli: Math.round(p.harga_jual * 1.2),
      diskon: idx === 0 ? '-15%' : '-20%',
      terjual_pct: 75,
      raw: p,
      type: 'product',
    })),
    // Tokopedia-style Digital Deal to always keep Flash Sale vibrant & full
    {
      id: 'deal-emas',
      nama: 'Logam Mulia Mini Gold 0.1 gr',
      gambar: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=400&q=80',
      harga_diskon: 175000,
      harga_asli: 195000,
      diskon: '-10%',
      terjual_pct: 85,
      type: 'digital',
    },
    {
      id: 'deal-pln',
      nama: 'Token Listrik PLN 50.000',
      gambar: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=400&q=80',
      harga_diskon: 51000,
      harga_asli: 54000,
      diskon: '-5%',
      terjual_pct: 92,
      type: 'digital',
    },
  ].slice(0, 4);

  return (
    <section id="flash-sale-section" style={{ marginBottom: '24px' }}>
      <div className="marketplace-container">
        <div className="mp-flash-sale">
          
          {/* Header with Countdown */}
          <div className="mp-flash-header">
            <div className="mp-flash-title-wrap">
              <span className="mp-flash-badge">
                <span>⚡</span>
                <span>FLASH SALE</span>
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

            <div style={{ fontSize: '12px', opacity: 0.9 }}>
              🔥 Promo Terbatas Hari Ini
            </div>
          </div>

          {/* Flash Sale Product Cards (Always full & balanced) */}
          <div className="mp-flash-grid">
            {flashItems.map((item, idx) => (
              <div
                key={item.id || idx}
                className="mp-flash-card"
                onClick={() => {
                  if (item.type === 'product' && item.raw && onSelectProduct) {
                    onSelectProduct(item.raw);
                  } else if (item.type === 'digital') {
                    if (item.id === 'deal-emas') {
                      const el = document.getElementById('logam-mulia-section');
                      if (el) {
                        const headerHeight = document.querySelector('.mp-header')?.offsetHeight || 135;
                        const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
                        window.scrollTo({ top, behavior: 'smooth' });
                      }
                    } else if (onOpenDigitalModal) {
                      onOpenDigitalModal('ppob');
                    }
                  }
                }}
              >
                {/* Image with discount badge */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#F8F9FA' }}>
                  {item.gambar ? (
                    <img
                      src={item.gambar}
                      alt={item.nama}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1', fontSize: '24px' }}>
                      📦
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
                    {item.diskon}
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
                    {item.nama}
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
                        width: `${item.terjual_pct}%`,
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
                      🔥 SEGERA HABIS
                    </span>
                  </div>

                  {/* Add to Cart button */}
                  {item.type === 'product' && item.raw ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart && onAddToCart(item.raw);
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
                      }}
                    >
                      + Keranjang
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.id === 'deal-emas') {
                          const el = document.getElementById('logam-mulia-section');
                          if (el) {
                            const headerHeight = document.querySelector('.mp-header')?.offsetHeight || 135;
                            const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
                            window.scrollTo({ top, behavior: 'smooth' });
                          }
                        } else if (onOpenDigitalModal) {
                          onOpenDigitalModal('ppob');
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
                      }}
                    >
                      Lihat Promo
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
