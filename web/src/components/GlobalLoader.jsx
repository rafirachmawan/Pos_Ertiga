import React, { useState, useEffect, useRef } from 'react';
import { onLoadingChange, getActiveRequests, resetLoading } from '../lib/api';

const GlobalLoader = () => {
  const [loading, setLoading] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState('Memuat Data...');
  const startTimeRef = useRef(0);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onLoadingChange((isLoading, count, msg) => {
      if (isLoading && count > 0) {
        // Jika ada request baru, batalkan timer penutupan sebelumnya jika ada
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
        if (msg) {
          setLoaderMessage(msg);
        }
        // Jika belum tampil, tampilkan seketika dan catat waktu mulai
        setLoading((prev) => {
          if (!prev) {
            startTimeRef.current = Date.now();
            return true;
          }
          return prev;
        });
      } else {
        // Semua request sudah selesai
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
        }

        const elapsed = Date.now() - (startTimeRef.current || 0);
        const minVisibleDuration = 350; // Minimal 350ms agar animasi lingkaran terlihat nyaman dan mulus
        const remaining = Math.max(0, minVisibleDuration - elapsed);

        hideTimerRef.current = setTimeout(() => {
          // Pastikan tidak ada request baru yang masuk saat menunggu durasi minimal
          if (getActiveRequests() === 0) {
            setLoading(false);
            setLoaderMessage('Memuat Data...');
          }
          hideTimerRef.current = null;
        }, remaining);
      }
    });

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      unsubscribe();
    };
  }, []);

  // Safety net: Jika loader aktif lebih dari 6 detik (misal network crash/hang), otomatis tutup
  useEffect(() => {
    if (!loading) return;

    const safetyTimer = setTimeout(() => {
      setLoading(false);
      resetLoading();
    }, 6000);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLoading(false);
        resetLoading();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(safetyTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loading]);

  if (!loading) return null;

  return (
    <div
      onClick={() => {
        // Klik pada backdrop untuk menutup paksa jika diperlukan
        setLoading(false);
        resetLoading();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.15s ease-out',
        cursor: 'pointer',
      }}
      title="Klik di luar atau tekan Esc untuk menutup"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(255, 255, 255, 0.96)',
          padding: '24px 32px',
          borderRadius: '16px',
          boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          minWidth: '180px',
          cursor: 'default',
        }}
      >
        {/* Lingkaran Loading Spinner (Warna Tema Web Hijau #03AC0E & Background Ring #DCFCE7) */}
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          style={{
            animation: 'spin 0.85s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
          }}
        >
          <circle
            cx="24"
            cy="24"
            r="18"
            stroke="#DCFCE7"
            strokeWidth="4"
            fill="none"
          />
          <circle
            cx="24"
            cy="24"
            r="18"
            stroke="#03AC0E"
            strokeWidth="4"
            strokeDasharray="113"
            strokeDashoffset="75"
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '13.5px',
              fontWeight: '700',
              color: '#0F172A',
              letterSpacing: '-0.01em',
            }}
          >
            {loaderMessage || 'Memuat Data...'}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: '#64748B',
              marginTop: '3px',
              fontWeight: '500',
            }}
          >
            Mohon tunggu sebentar
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalLoader;
