import React, { useState, useEffect } from 'react';
import { onDialogChange, onToast } from '../lib/dialog';

const GlobalDialog = () => {
  const [dialog, setDialog] = useState(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubDialog = onDialogChange((current) => {
      setDialog(current);
    });

    const unsubToast = onToast((newToast) => {
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, newToast.duration || 3200);
    });

    return () => {
      unsubDialog();
      unsubToast();
    };
  }, []);

  // Keyboard shortcut: Enter to confirm, Escape to cancel
  useEffect(() => {
    if (!dialog) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        dialog.resolve(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        dialog.resolve(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog]);

  return (
    <>
      {/* ── TOAST NOTIFICATIONS (Top Right) ── */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 99999999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => {
          const isErr = t.type === 'danger' || t.type === 'error';
          const isWarn = t.type === 'warning';
          const bg = isErr ? '#DC2626' : isWarn ? '#D97706' : '#059669';
          const icon = isErr ? '✕' : isWarn ? '⚠' : '✓';

          return (
            <div
              key={t.id}
              style={{
                pointerEvents: 'auto',
                background: bg,
                color: '#FFFFFF',
                padding: '11px 18px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.25)',
                animation: 'dialogFadeUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                maxWidth: '360px',
              }}
            >
              <span
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '800',
                  flexShrink: 0,
                }}
              >
                {icon}
              </span>
              <span style={{ lineHeight: 1.4 }}>{t.message}</span>
            </div>
          );
        })}
      </div>

      {/* ── CLEAN DIALOG MODAL (Confirm & Alert) ── */}
      {dialog && (
        <div
          onClick={() => dialog.resolve(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999999,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
              width: '100%',
              maxWidth: '430px',
              padding: '28px 24px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              animation: 'dialogFadeUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative',
            }}
          >
            {/* Close Cross Top Right */}
            <button
              onClick={() => dialog.resolve(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: '#F1F5F9',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '700',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#E2E8F0';
                e.currentTarget.style.color = '#0F172A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#F1F5F9';
                e.currentTarget.style.color = '#64748B';
              }}
              title="Tutup (Esc)"
            >
              ✕
            </button>

            {/* Icon Header */}
            {dialog.type === 'danger' ? (
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#DC2626',
                  marginBottom: '16px',
                }}
              >
                {/* Trash / Danger Icon */}
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
            ) : dialog.type === 'warning' ? (
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: '#FEF3C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D97706',
                  marginBottom: '16px',
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
            ) : dialog.type === 'success' ? (
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: '#DCFCE7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#16A34A',
                  marginBottom: '16px',
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            ) : (
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: '#DBEAFE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB',
                  marginBottom: '16px',
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
            )}

            {/* Title */}
            <div
              style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#0F172A',
                letterSpacing: '-0.015em',
                marginBottom: '8px',
              }}
            >
              {dialog.title}
            </div>

            {/* Message Body */}
            <div
              style={{
                fontSize: '14px',
                color: '#475569',
                lineHeight: 1.55,
                marginBottom: dialog.submessage ? '6px' : '0px',
                wordBreak: 'break-word',
              }}
            >
              {dialog.message}
            </div>

            {/* Submessage (e.g. Warning notice) */}
            {dialog.submessage && (
              <div
                style={{
                  fontSize: '12.5px',
                  color: dialog.type === 'danger' ? '#EF4444' : '#64748B',
                  fontWeight: '500',
                  marginTop: '4px',
                }}
              >
                {dialog.submessage}
              </div>
            )}

            {/* Buttons Row */}
            {dialog.isAlert ? (
              <div style={{ width: '100%', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => dialog.resolve(true)}
                  style={{
                    width: '100%',
                    padding: '11px 20px',
                    borderRadius: '10px',
                    background: dialog.type === 'danger' ? '#DC2626' : '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  {dialog.okText || 'Mengerti'}
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  marginTop: '24px',
                }}
              >
                <button
                  type="button"
                  onClick={() => dialog.resolve(false)}
                  style={{
                    flex: 1,
                    padding: '11px 16px',
                    borderRadius: '10px',
                    background: '#F8FAFC',
                    color: '#475569',
                    border: '1px solid #CBD5E1',
                    fontWeight: '600',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F1F5F9';
                    e.currentTarget.style.borderColor = '#94A3B8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#F8FAFC';
                    e.currentTarget.style.borderColor = '#CBD5E1';
                  }}
                >
                  {dialog.cancelText || 'Batal'}
                </button>
                <button
                  type="button"
                  onClick={() => dialog.resolve(true)}
                  style={{
                    flex: 1,
                    padding: '11px 18px',
                    borderRadius: '10px',
                    background:
                      dialog.type === 'danger'
                        ? '#DC2626'
                        : dialog.type === 'warning'
                        ? '#D97706'
                        : '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    boxShadow:
                      dialog.type === 'danger'
                        ? '0 4px 14px rgba(220, 38, 38, 0.3)'
                        : '0 4px 14px rgba(37, 99, 235, 0.3)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  {dialog.confirmText || 'Konfirmasi'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalDialog;
