import React, { useState, useEffect } from "react";
import { api } from "../lib/api";

const formatRupiah = (number) => {
  if (!number && number !== 0) return "Rp 0";
  return "Rp " + Number(number).toLocaleString("id-ID");
};

const Dashboard = () => {
  const [items, setItems] = useState([]);
  const [laporan, setLaporan] = useState({
    total_transaksi: 0,
    total_pendapatan: 0,
    laba_bersih: 0,
  });
  const [grafik, setGrafik] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredRow, setHoveredRow] = useState(null);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const load = async () => {
      try {
        const [barang, harian, mingguan] = await Promise.all([
          api("/api/barang"),
          api("/api/laporan/harian"),
          api("/api/laporan/mingguan"),
        ]);

        if (barang.data) setItems(barang.data);
        if (harian.data) setLaporan(harian.data);
        if (mingguan.data) setGrafik(mingguan.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const totalStok = items.reduce((acc, item) => acc + Number(item.stok || 0), 0);
  const lowStockItems = items.filter((item) => item.stok <= 5);
  const maxPendapatan = grafik.length > 0 ? Math.max(...grafik.map(g => g.pendapatan), 1) : 1;
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, items.length);
  const paginatedItems = items.slice(startIndex, endIndex);

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
            Dashboard
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', margin: '4px 0 0 0' }}>
            Ringkasan transaksi dan pergerakan stok toko hari ini
          </p>
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '6px 14px',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '600',
          color: '#475569'
        }}>
          {today}
        </div>
      </div>

      {/* 4 Clean Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {[
          {
            label: "Transaksi Hari Ini",
            value: loading ? "—" : `${laporan.total_transaksi} Nota`,
            sub: "Total nota kasir",
          },
          {
            label: "Total Pendapatan",
            value: loading ? "—" : formatRupiah(laporan.total_pendapatan),
            sub: "Omzet kotor hari ini",
          },
          {
            label: "Laba Bersih",
            value: loading ? "—" : formatRupiah(laporan.laba_bersih),
            sub: "Margin keuntungan",
          },
          {
            label: "Total Produk",
            value: `${items.length} Varian`,
            sub: `${totalStok} unit fisik terdata`,
          },
        ].map((m, i) => (
          <div
            key={i}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
          >
            <p style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px'
            }}>
              {m.label}
            </p>
            <p style={{
              fontSize: '22px',
              fontWeight: '800',
              color: '#0F172A',
              letterSpacing: '-0.02em',
              marginBottom: '6px',
              lineHeight: 1.2
            }}>
              {m.value}
            </p>
            <p style={{
              fontSize: '12px',
              color: '#94A3B8',
              margin: 0
            }}>
              {m.sub}
            </p>
          </div>
        ))}
      </div>

      {/* ===== BODY: 2 KOLOM ===== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* KIRI: Daftar Produk */}
        <div
          style={{
            background: "var(--surface-color)",
            borderRadius: "16px",
            border: "1px solid var(--border-color)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "var(--secondary-color)",
                }}
              >
                Semua Produk
              </h3>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  marginTop: "2px",
                }}
              >
                {items.length} produk terdaftar · {totalStok} unit total
              </p>
            </div>
            {lowStockItems.length > 0 && (
              <span
                style={{
                  background: "#FEF2F2",
                  color: "#DC2626",
                  border: "1px solid #FEE2E2",
                  fontSize: "12px",
                  fontWeight: "600",
                  padding: "3px 10px",
                  borderRadius: "6px",
                }}
              >
                {lowStockItems.length} stok kritis
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <div
              style={{
                padding: "60px",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              <p style={{ fontWeight: "600", fontSize: "14px" }}>Belum ada produk terdaftar</p>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(200px, 2.5fr) minmax(120px, 1.2fr) minmax(90px, 1fr) minmax(90px, 1fr)",
                  padding: "12px 24px",
                  background: "#F8FAFC",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                {["Produk", "Harga Jual", "Stok", "Status"].map((h) => (
                  <span
                    key={h}
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#64748B",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>

              {/* Table rows */}
              {paginatedItems.map((item) => {
                const isCritical = item.stok <= 5;
                const isHovered = hoveredRow === item.id;
                let rowBg = "transparent";
                if (isCritical) {
                  rowBg = isHovered ? "#FEF3C7" : "#FFFBEB";
                } else if (isHovered) {
                  rowBg = "#F8FAFC";
                }

                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredRow(item.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(200px, 2.5fr) minmax(120px, 1.2fr) minmax(90px, 1fr) minmax(90px, 1fr)",
                      padding: "13px 24px",
                      alignItems: "center",
                      borderBottom: "1px solid var(--border-color)",
                      background: rowBg,
                      transition: "background 0.15s ease",
                    }}
                  >
                    {/* Produk (Foto + Nama + Barcode) */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        minWidth: 0,
                        paddingRight: "12px",
                      }}
                    >
                      {item.gambar ? (
                        <img
                          src={item.gambar}
                          alt={item.nama_barang}
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "8px",
                            objectFit: "cover",
                            flexShrink: 0,
                            border: "1px solid #E2E8F0",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "8px",
                            background: "#F1F5F9",
                            border: "1px solid #E2E8F0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "16px",
                            flexShrink: 0,
                          }}
                        >
                          📦
                        </div>
                      )}
                      <div style={{ minWidth: 0, overflow: "hidden" }}>
                        <p
                          style={{
                            fontWeight: "600",
                            fontSize: "13px",
                            color: "#0F172A",
                            margin: 0,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={item.nama_barang}
                        >
                          {item.nama_barang}
                        </p>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "#64748B",
                            margin: "2px 0 0 0",
                            fontFamily: "monospace",
                          }}
                        >
                          {item.barcode || "-"}
                        </p>
                      </div>
                    </div>

                    {/* Harga Jual */}
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#0F172A",
                      }}
                    >
                      Rp {Number(item.harga_jual || 0).toLocaleString("id-ID")}
                    </span>

                    {/* Stok */}
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: item.stok === 0 ? "#DC2626" : item.stok <= 5 ? "#D97706" : "#0F172A",
                      }}
                    >
                      {item.stok}{" "}
                      <span
                        style={{
                          fontWeight: "400",
                          color: "#64748B",
                          fontSize: "12px",
                        }}
                      >
                        {item.satuan || "pcs"}
                      </span>
                    </span>

                    {/* Status */}
                    <div>
                      {item.stok === 0 ? (
                        <span
                          style={{
                            background: "#FEF2F2",
                            color: "#DC2626",
                            border: "1px solid #FEE2E2",
                            fontSize: "11px",
                            fontWeight: "600",
                            padding: "3px 10px",
                            borderRadius: "20px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#DC2626" }} />
                          Habis
                        </span>
                      ) : item.stok <= 5 ? (
                        <span
                          style={{
                            background: "#FFFBEB",
                            color: "#B45309",
                            border: "1px solid #FEF3C7",
                            fontSize: "11px",
                            fontWeight: "600",
                            padding: "3px 10px",
                            borderRadius: "20px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#D97706" }} />
                          Kritis
                        </span>
                      ) : (
                        <span
                          style={{
                            background: "#ECFDF5",
                            color: "#059669",
                            border: "1px solid #D1FAE5",
                            fontSize: "11px",
                            fontWeight: "600",
                            padding: "3px 10px",
                            borderRadius: "20px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981" }} />
                          Aman
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Pagination Controls */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 24px",
                  background: "#FFFFFF",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div style={{ fontSize: "12px", color: "#64748B" }}>
                  Menampilkan{" "}
                  <strong style={{ color: "#0F172A", fontWeight: "600" }}>
                    {items.length === 0 ? 0 : startIndex + 1} - {endIndex}
                  </strong>{" "}
                  dari{" "}
                  <strong style={{ color: "#0F172A", fontWeight: "600" }}>
                    {items.length}
                  </strong>{" "}
                  produk
                </div>

                {totalPages > 1 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button
                      type="button"
                      disabled={activePage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        border: "1px solid #CBD5E1",
                        background: activePage === 1 ? "#F1F5F9" : "#FFFFFF",
                        color: activePage === 1 ? "#94A3B8" : "#0F172A",
                        cursor: activePage === 1 ? "not-allowed" : "pointer",
                        fontSize: "12px",
                        fontWeight: "600",
                        transition: "all 0.15s ease",
                      }}
                    >
                      ‹ Sebelumnya
                    </button>

                    <div style={{ display: "flex", gap: "4px" }}>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          style={{
                            minWidth: "30px",
                            height: "30px",
                            padding: "0 6px",
                            borderRadius: "6px",
                            border: activePage === page ? "none" : "1px solid #CBD5E1",
                            background: activePage === page ? "#0F172A" : "#FFFFFF",
                            color: activePage === page ? "#FFFFFF" : "#334155",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={activePage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        border: "1px solid #CBD5E1",
                        background: activePage === totalPages ? "#F1F5F9" : "#FFFFFF",
                        color: activePage === totalPages ? "#94A3B8" : "#0F172A",
                        cursor: activePage === totalPages ? "not-allowed" : "pointer",
                        fontSize: "12px",
                        fontWeight: "600",
                        transition: "all 0.15s ease",
                      }}
                    >
                      Berikutnya ›
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* KANAN: Ringkasan cepat */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Ringkasan stok */}
          <div
            style={{
              background: "var(--surface-color)",
              borderRadius: "16px",
              border: "1px solid var(--border-color)",
              padding: "20px",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: "var(--secondary-color)",
                marginBottom: "16px",
              }}
            >
              Ringkasan Stok
            </h3>
            {[
              { label: "Total Varian", val: items.length + " produk" },
              { label: "Total Unit", val: totalStok + " pcs" },
              {
                label: "Stok Kritis",
                val: lowStockItems.length + " produk",
                danger: lowStockItems.length > 0,
              },
            ].map((row) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  {row.label}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: row.danger
                      ? "var(--danger-color)"
                      : "var(--text-dark)",
                  }}
                >
                  {row.val}
                </span>
              </div>
            ))}
          </div>

          {/* Grafik Penjualan */}
          <div
            style={{
              background: "var(--surface-color)",
              borderRadius: "16px",
              border: "1px solid var(--border-color)",
              padding: "20px",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: "var(--secondary-color)",
                marginBottom: "20px",
              }}
            >
              Grafik 7 Hari Terakhir
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '120px', gap: '8px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
              {grafik.map((day, idx) => {
                const heightPct = (day.pendapatan / maxPendapatan) * 100;
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', group: 'hover' }}>
                    {day.pendapatan > 0 && (
                      <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '4px', opacity: 0.8 }}>
                        {formatRupiah(day.pendapatan).replace('Rp ', '')}
                      </span>
                    )}
                    <div style={{ 
                      width: '100%', 
                      height: `${Math.max(heightPct, 2)}%`, 
                      background: idx === 6 ? 'var(--primary-color)' : '#C7D2FE',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease'
                    }}></div>
                  </div>
                )
              })}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              {grafik.map((day, idx) => (
                <span key={idx} style={{ fontSize: '10px', color: idx === 6 ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: idx === 6 ? '700' : '500', textAlign: 'center', flex: 1 }}>
                  {day.hari}
                </span>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div
            style={{
              background: "#EEF2FF",
              borderRadius: "16px",
              border: "1px solid #C7D2FE",
              padding: "20px",
            }}
          >
            <p
              style={{
                fontWeight: "700",
                fontSize: "13px",
                color: "var(--primary-color)",
                marginBottom: "8px",
              }}
            >
              Tips Operasional
            </p>
            <p style={{ fontSize: "12px", color: "#4338CA", lineHeight: 1.6 }}>
              Gunakan <strong>Scan Barcode</strong> di kasir untuk kecepatan
              input. Stok otomatis terpotong setelah transaksi selesai.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
