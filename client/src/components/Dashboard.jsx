import React, { useState, useEffect } from "react";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3001/api/barang")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setItems(data.data);
      })
      .catch(console.error);

    fetch("http://localhost:3001/api/laporan/harian")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setLaporan(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalStok = items.reduce((acc, item) => acc + item.stok, 0);
  const lowStockItems = items.filter((item) => item.stok <= 5);
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      {/* ===== HERO STRIP ===== */}
      <div
        style={{
          background: "linear-gradient(135deg, #1E293B 0%, #312E81 100%)",
          borderRadius: "20px",
          padding: "36px 40px",
          marginBottom: "32px",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Dekor */}
        <div
          style={{
            position: "absolute",
            top: "-40px",
            right: "-40px",
            width: "200px",
            height: "200px",
            background: "rgba(255,255,255,0.04)",
            borderRadius: "50%",
          }}
        ></div>
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            right: "120px",
            width: "150px",
            height: "150px",
            background: "rgba(99,102,241,0.15)",
            borderRadius: "50%",
          }}
        ></div>

        <p
          style={{
            fontSize: "13px",
            color: "rgba(255,255,255,0.5)",
            marginBottom: "4px",
          }}
        >
          {today}
        </p>
        <h2
          style={{
            color: "white",
            fontSize: "24px",
            fontWeight: "700",
            marginBottom: "36px",
          }}
        >
          Selamat datang, <span style={{ color: "#A5B4FC" }}>Admin</span>{" "}
        </h2>

        {/* Metrics Row */}
        <div
          style={{
            display: "flex",
            gap: "0",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: "28px",
          }}
        >
          {[
            {
              label: "Transaksi Hari Ini",
              value: loading ? "—" : `${laporan.total_transaksi} Nota`,
              accent: "#818CF8",
            },
            {
              label: "Total Pendapatan",
              value: loading ? "—" : formatRupiah(laporan.total_pendapatan),
              accent: "#34D399",
            },
            {
              label: "Laba Bersih",
              value: loading ? "—" : formatRupiah(laporan.laba_bersih),
              accent: laporan.laba_bersih < 0 ? "#F87171" : "#34D399",
            },
            {
              label: "Total Produk",
              value: `${items.length} Varian`,
              accent: "#FBBF24",
            },
          ].map((m, i, arr) => (
            <div
              key={i}
              style={{
                flex: 1,
                paddingRight: i < arr.length - 1 ? "32px" : 0,
                marginRight: i < arr.length - 1 ? "32px" : 0,
                borderRight:
                  i < arr.length - 1
                    ? "1px solid rgba(255,255,255,0.1)"
                    : "none",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.45)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "10px",
                }}
              >
                {m.label}
              </p>
              <p
                style={{
                  fontSize: "24px",
                  fontWeight: "800",
                  color: m.accent,
                  lineHeight: 1,
                }}
              >
                {m.value}
              </p>
            </div>
          ))}
        </div>
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
                  background: "#FEE2E2",
                  color: "#DC2626",
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "4px 12px",
                  borderRadius: "20px",
                }}
              >
                ⚠️ {lowStockItems.length} stok kritis
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
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>📦</div>
              <p style={{ fontWeight: "600" }}>Belum ada produk</p>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr",
                  padding: "10px 24px",
                  background: "#F8FAFC",
                }}
              >
                {["Produk", "Harga Jual", "Stok", "Status"].map((h) => (
                  <span
                    key={h}
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>
              {items.map((item, i) => (
                <div
                  key={item.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr",
                    padding: "14px 24px",
                    alignItems: "center",
                    borderTop: "1px solid var(--border-color)",
                    background: item.stok <= 5 ? "#FFFBEB" : "transparent",
                    transition: "background 0.15s",
                  }}
                >
                  {/* Produk */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    {item.gambar ? (
                      <img
                        src={item.gambar}
                        alt={item.nama_barang}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          background: "#EEF2FF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          flexShrink: 0,
                        }}
                      >
                        🏷️
                      </div>
                    )}
                    <div>
                      <p
                        style={{
                          fontWeight: "600",
                          fontSize: "14px",
                          color: "var(--text-dark)",
                        }}
                      >
                        {item.nama_barang}
                      </p>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          marginTop: "2px",
                        }}
                      >
                        {item.barcode}
                      </p>
                    </div>
                  </div>
                  {/* Harga */}
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "var(--text-dark)",
                    }}
                  >
                    Rp {item.harga_jual.toLocaleString("id-ID")}
                  </span>
                  {/* Stok */}
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "700",
                      color: item.stok <= 5 ? "#DC2626" : "var(--text-dark)",
                    }}
                  >
                    {item.stok}{" "}
                    <span
                      style={{
                        fontWeight: "400",
                        color: "var(--text-muted)",
                        fontSize: "12px",
                      }}
                    >
                      {item.satuan}
                    </span>
                  </span>
                  {/* Status */}
                  {item.stok === 0 ? (
                    <span
                      style={{
                        background: "#FEE2E2",
                        color: "#DC2626",
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        width: "fit-content",
                      }}
                    >
                      Habis
                    </span>
                  ) : item.stok <= 5 ? (
                    <span
                      style={{
                        background: "#FEF9C3",
                        color: "#A16207",
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        width: "fit-content",
                      }}
                    >
                      Kritis
                    </span>
                  ) : (
                    <span
                      style={{
                        background: "#D1FAE5",
                        color: "#065F46",
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        width: "fit-content",
                      }}
                    >
                      Aman
                    </span>
                  )}
                </div>
              ))}
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
              💡 Tips
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
