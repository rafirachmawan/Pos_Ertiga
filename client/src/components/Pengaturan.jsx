import React, { useEffect, useState } from 'react';
import { api, apiUrl } from '../lib/api';
import { ReceiptPrintPortal, QRCodeSvg } from './Receipt';
import { printCurrentReceipt } from '../lib/print';

const DEFAULT_FORM = {
  nama_toko: '',
  alamat_toko: '',
  pesan_struk: '',
  telepon: '',
  url_website: 'https://pos-ertiga-yl9x.vercel.app/',
  logo_url: '',
  logo_text: 'E',
  printer_name: '',
  lebar_struk: 80,
  auto_print: 0,
};

const Pengaturan = () => {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [printers, setPrinters] = useState([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [backupStatus, setBackupStatus] = useState(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [testStruk, setTestStruk] = useState(null);

  const loadData = async () => {
    try {
      const [setting, status] = await Promise.all([
        api('/api/pengaturan'),
        api('/api/backup/status').catch(() => null),
      ]);

      if (setting.data) {
        setForm({
          nama_toko: setting.data.nama_toko || '',
          alamat_toko: setting.data.alamat_toko || '',
          pesan_struk: setting.data.pesan_struk || '',
          telepon: setting.data.telepon || '',
          url_website: setting.data.url_website || 'https://pos-ertiga-yl9x.vercel.app/',
          logo_url: setting.data.logo_url || '',
          logo_text: setting.data.logo_text || 'E',
          printer_name: setting.data.printer_name || '',
          lebar_struk: Number(setting.data.lebar_struk) || 80,
          auto_print: Number(setting.data.auto_print) || 0,
        });
      }
      if (status?.data) setBackupStatus(status.data);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    if (window.pos?.listPrinters) {
      window.pos
        .listPrinters()
        .then((list) => setPrinters(Array.isArray(list) ? list : []))
        .catch((err) => console.warn('[PRINTER]', err));
    }
  }, []);

  useEffect(() => {
    if (!testStruk) return undefined;

    const timer = setTimeout(async () => {
      try {
        await printCurrentReceipt({
          lebar: Number(form.lebar_struk) || 80,
          deviceName: form.printer_name,
        });
      } finally {
        setTestStruk(null);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [testStruk, form.lebar_struk]);

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 4000);
  };

  const compressLogoImage = (file, maxSize = 300, quality = 0.85) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL('image/png'));
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Gambar tidak dapat dibaca'));
      };

      image.src = objectUrl;
    });

  const savePengaturan = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api('/api/pengaturan', {
        method: 'PUT',
        body: {
          ...form,
          logo_url: (form.logo_url || '').trim(),
          logo_text: (form.logo_text || 'E').trim().slice(0, 10),
          url_website: (form.url_website || 'https://pos-ertiga-yl9x.vercel.app/').trim(),
          lebar_struk: Number(form.lebar_struk),
          auto_print: Number(form.auto_print) || 0,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const testPrint = () => {
    setTestStruk({
      nomor_nota: 'TEST-PRINTER',
      nama_pelanggan: 'Tes Kasir',
      tanggal: new Date().toLocaleString('id-ID'),
      items: [
        {
          nama_barang: 'Contoh Produk A',
          qty: 1,
          harga_jual: 15000,
          subtotal: 15000,
        },
        {
          nama_barang: 'Contoh Produk B',
          qty: 2,
          harga_jual: 10000,
          subtotal: 20000,
        },
      ],
      subtotal: 35000,
      diskon: 0,
      total: 35000,
      bayar: 50000,
      kembalian: 15000,
      metode_pembayaran: 'Tunai',
    });
  };

  const runBackup = async () => {
    try {
      setBackupLoading(true);
      const result = await api('/api/backup/run', { method: 'POST' });
      setBackupStatus(result.data?.status || null);
      showMessage('Backup lokal berhasil dibuat.');
    } catch (err) {
      alert(err.message);
    } finally {
      setBackupLoading(false);
    }
  };

  const downloadRawBackup = () => {
    const link = document.createElement('a');
    link.href = apiUrl('/api/backup');
    link.download = `backup_pos_ertiga_${new Date().toISOString().slice(0, 10)}.sqlite`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const openDataFolder = async () => {
    try {
      await window.pos?.openDataFolder?.();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8', fontSize: '13.5px' }}>
        Memuat data pengaturan...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '18px',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
            Pengaturan
          </h2>
          <p style={{ color: '#64748B', marginTop: '3px', fontSize: '13px', margin: 0 }}>
            Konfigurasi identitas toko, format struk, printer kasir, dan backup database
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {saved && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: '#ECFDF5',
                color: '#059669',
                border: '1px solid #A7F3D0',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              <span>✓</span> Tersimpan!
            </div>
          )}

          <button
            type="button"
            onClick={testPrint}
            style={{
              height: '34px',
              padding: '0 14px',
              background: '#FFFFFF',
              color: '#334155',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '12.5px',
            }}
          >
            Tes Cetak Struk
          </button>

          <button
            type="button"
            onClick={savePengaturan}
            disabled={saving}
            style={{
              height: '34px',
              padding: '0 16px',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '12.5px',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            background: '#F0FDF4',
            color: '#166534',
            border: '1px solid #BBF7D0',
            padding: '10px 16px',
            borderRadius: '8px',
            marginBottom: '18px',
            fontSize: '13px',
            fontWeight: '500',
          }}
        >
          {message}
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '22px', alignItems: 'start' }}>
        
        {/* Left Column: Form Settings */}
        <form onSubmit={savePengaturan} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Card 1: Informasi Toko */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              padding: '20px 22px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                Informasi Toko
              </h3>
              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '3px', margin: 0 }}>
                Identitas toko yang dicetak pada bagian kepala (header) struk
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>
                  Nama Toko <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.nama_toko}
                  onChange={(e) => setForm({ ...form, nama_toko: e.target.value })}
                  placeholder="Contoh: POS ERTIGA"
                  style={inputStyle}
                />
              </div>

              {/* Pengaturan Logo Toko & Website (Icon Kotak 'E') */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '16px',
                  marginTop: '4px',
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>
                      Logo Toko (Icon Kotak Hijau 'E')
                    </span>
                    <span
                      style={{
                        background: '#DCFCE7',
                        color: '#166534',
                        fontSize: '10.5px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      Website & POS
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0' }}>
                    Atur logo icon kotak hijau di navbar toko online dan aplikasi POS. Bisa menggunakan inisial huruf (default 'E') atau upload gambar logo toko Anda.
                  </p>
                </div>

                {/* Live Preview Box */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '8px',
                      background: form.logo_url
                        ? '#FFFFFF'
                        : 'linear-gradient(135deg, #03AC0E 0%, #008709 100%)',
                      border: form.logo_url ? '1px solid #E2E8F0' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      fontWeight: '800',
                      fontSize: '20px',
                      boxShadow: '0 2px 6px rgba(3, 172, 14, 0.25)',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {form.logo_url ? (
                      <img
                        src={form.logo_url}
                        alt="Logo Toko"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span>
                        {form.logo_text ||
                          (form.nama_toko
                            ? form.nama_toko.charAt(0).toUpperCase()
                            : 'E')}
                      </span>
                    )}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: '800',
                        color: '#03AC0E',
                        lineHeight: '1.2',
                      }}
                    >
                      {form.nama_toko || 'POS ERTIGA'}
                    </div>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: '700',
                        color: '#FFFFFF',
                        background: '#EE4D2D',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        letterSpacing: '0.04em',
                        display: 'inline-block',
                        marginTop: '2px',
                      }}
                    >
                      OFFICIAL STORE
                    </span>
                  </div>
                  <div
                    style={{
                      marginLeft: 'auto',
                      fontSize: '11px',
                      color: '#94A3B8',
                      fontWeight: '600',
                      background: '#F1F5F9',
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    Preview Navbar
                  </div>
                </div>

                {/* Form Inputs for Logo */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1.6fr',
                    gap: '12px',
                    marginBottom: '12px',
                  }}
                >
                  <div>
                    <label style={labelStyle}>Inisial Huruf (Icon Kotak)</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={form.logo_text}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          logo_text: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="E"
                      style={inputStyle}
                    />
                    <small
                      style={{
                        fontSize: '11px',
                        color: '#64748B',
                        marginTop: '3px',
                        display: 'block',
                      }}
                    >
                      Tampil jika tidak menggunakan gambar
                    </small>
                  </div>

                  <div>
                    <label style={labelStyle}>File Gambar Logo Toko</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          background: '#0F172A',
                          color: '#FFFFFF',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        <span>📁 Pilih Gambar Logo</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp, image/svg+xml"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const compressed = await compressLogoImage(file);
                              setForm((prev) => ({
                                ...prev,
                                logo_url: compressed,
                              }));
                            } catch (err) {
                              alert('Gagal memproses gambar: ' + err.message);
                            }
                          }}
                        />
                      </label>

                      {form.logo_url && (
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, logo_url: '' })}
                          style={{
                            padding: '8px 12px',
                            background: '#FEE2E2',
                            color: '#991B1B',
                            border: '1px solid #FECACA',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Hapus Gambar (Gunakan Huruf '{form.logo_text || 'E'}')
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>
                    Atau Masukkan Link / URL Gambar Logo (Opsional)
                  </label>
                  <input
                    type="text"
                    value={
                      form.logo_url && !form.logo_url.startsWith('data:')
                        ? form.logo_url
                        : ''
                    }
                    onChange={(e) =>
                      setForm({ ...form, logo_url: e.target.value })
                    }
                    placeholder="https://contoh.com/logo-toko.png"
                    style={inputStyle}
                  />
                  <small
                    style={{
                      fontSize: '11px',
                      color: '#64748B',
                      marginTop: '3px',
                      display: 'block',
                    }}
                  >
                    Bisa berupa URL gambar online atau upload file gambar langsung di atas.
                  </small>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Alamat Toko Fisik</label>
                <textarea
                  rows={2}
                  value={form.alamat_toko}
                  onChange={(e) => setForm({ ...form, alamat_toko: e.target.value })}
                  placeholder="Jl. Raya Utama No. 123, Desa Sumberjo Kulon, Ngunut"
                  style={textareaStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Nomor WhatsApp Toko (Customer Service & Checkout Online)
                </label>
                <input
                  type="text"
                  value={form.telepon}
                  onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                  placeholder="Contoh: 081234567890 atau 6281234567890"
                  style={inputStyle}
                />
                <small style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
                  Nomor ini digunakan website toko online untuk menerima chat pelanggan dan pesan checkout WhatsApp otomatis.
                </small>
              </div>

              <div>
                <label style={labelStyle}>
                  Link Website Toko Online (Barcode Struk Kasir)
                </label>
                <input
                  type="text"
                  value={form.url_website}
                  onChange={(e) => setForm({ ...form, url_website: e.target.value })}
                  placeholder="https://pos-ertiga-yl9x.vercel.app/"
                  style={inputStyle}
                />
                <small style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
                  Link ini akan dicetak di atas barcode struk kasir. Saat barcode di-scan menggunakan kamera HP pelanggan, otomatis akan diarahkan ke alamat website ini.
                </small>
              </div>

              <div>
                <label style={labelStyle}>Catatan / Pesan Kaki Struk</label>
                <textarea
                  rows={2}
                  value={form.pesan_struk}
                  onChange={(e) => setForm({ ...form, pesan_struk: e.target.value })}
                  placeholder="Terima kasih atas kunjungan Anda!&#10;Barang yang sudah dibeli tidak dapat ditukar."
                  style={textareaStyle}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Konfigurasi Printer Struk */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              padding: '20px 22px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                Konfigurasi Printer
              </h3>
              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '3px', margin: 0 }}>
                Pengaturan perangkat pencetak struk kasir thermal
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Pilihan Printer</label>
                  <select
                    value={form.printer_name}
                    onChange={(e) => setForm({ ...form, printer_name: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="">Printer Default Sistem Windows</option>
                    {printers.map((printer) => (
                      <option key={printer.name} value={printer.name}>
                        {printer.displayName || printer.name} {printer.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                  {!window.pos && (
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                      Pilihan printer spesifik aktif pada mode desktop Electron.
                    </div>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>Lebar Kertas Thermal</label>
                  <select
                    value={form.lebar_struk}
                    onChange={(e) => setForm({ ...form, lebar_struk: Number(e.target.value) })}
                    style={inputStyle}
                  >
                    <option value={58}>58 mm (Struk Kecil)</option>
                    <option value={80}>80 mm (Struk Standar)</option>
                  </select>
                </div>
              </div>

              {/* Checkbox auto print */}
              <div style={{ paddingTop: '4px' }}>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#334155',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Number(form.auto_print) === 1}
                    onChange={(e) => setForm({ ...form, auto_print: e.target.checked ? 1 : 0 })}
                    style={{ cursor: 'pointer' }}
                  />
                  Cetak struk secara otomatis saat transaksi selesai
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 22px',
                background: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>

            <button
              type="button"
              onClick={testPrint}
              style={{
                padding: '10px 18px',
                background: '#FFFFFF',
                color: '#334155',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Tes Cetak Struk
            </button>
          </div>

        </form>

        {/* Right Column: Receipt Preview & Backup Management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Live Thermal Receipt Preview */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                  Pratinjau Struk Kasir
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#64748B',
                    background: '#FFFFFF',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  {form.lebar_struk} mm
                </span>
              </div>
            </div>

            {/* Receipt Paper Simulation */}
            <div style={{ padding: '20px', background: '#F1F5F9', display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: form.lebar_struk === 58 ? '220px' : '260px',
                  background: '#FFFFFF',
                  padding: '16px',
                  borderRadius: '4px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: '#1E293B',
                  lineHeight: '1.4',
                  borderTop: '2px dashed #94A3B8',
                  borderBottom: '2px dashed #94A3B8',
                  transition: 'width 0.2s ease',
                }}
              >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                  <div style={{ fontWeight: '800', fontSize: '13px', color: '#0F172A' }}>
                    {form.nama_toko || 'NAMA TOKO'}
                  </div>
                  {form.alamat_toko ? (
                    <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px', whiteSpace: 'pre-line' }}>
                      {form.alamat_toko}
                    </div>
                  ) : (
                    <div style={{ fontSize: '10px', color: '#CBD5E1', marginTop: '2px' }}>
                      Alamat toko belum diatur
                    </div>
                  )}
                </div>

                <div style={{ borderBottom: '1px dashed #CBD5E1', margin: '8px 0' }} />

                {/* Sample items */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
                  <span>Contoh Produk A</span>
                  <span>15.000</span>
                </div>
                <div style={{ fontSize: '9.5px', color: '#64748B' }}>1 x 15.000</div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', marginTop: '4px' }}>
                  <span>Contoh Produk B</span>
                  <span>20.000</span>
                </div>
                <div style={{ fontSize: '9.5px', color: '#64748B' }}>2 x 10.000</div>

                <div style={{ borderBottom: '1px dashed #CBD5E1', margin: '8px 0' }} />

                {/* Summary */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                  <span>TOTAL</span>
                  <span>Rp 35.000</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748B', marginTop: '2px' }}>
                  <span>TUNAI</span>
                  <span>Rp 50.000</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748B' }}>
                  <span>KEMBALI</span>
                  <span>Rp 15.000</span>
                </div>

                <div style={{ borderBottom: '1px dashed #CBD5E1', margin: '8px 0' }} />

                {/* Website Link & Scannable Barcode */}
                {(form.url_website || 'https://pos-ertiga-yl9x.vercel.app/').trim() ? (
                  <div style={{ textAlign: 'center', margin: '6px 0 2px' }}>
                    <div style={{ fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', color: '#0F172A' }}>
                      KUNJUNGI TOKO ONLINE KAMI:
                    </div>
                    <div style={{ fontSize: '8px', fontWeight: '600', color: '#2563EB', wordBreak: 'break-all', marginTop: '1px', lineHeight: '1.2' }}>
                      {(form.url_website || 'https://pos-ertiga-yl9x.vercel.app/').trim()}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '4px auto' }}>
                      <QRCodeSvg
                        value={(form.url_website || 'https://pos-ertiga-yl9x.vercel.app/').trim()}
                        size={Number(form.lebar_struk) === 58 ? 85 : 100}
                      />
                    </div>
                    <div style={{ fontSize: '7.5px', fontStyle: 'italic', color: '#64748B' }}>
                      Scan Barcode untuk Belanja Online
                    </div>
                    <div style={{ borderBottom: '1px dashed #CBD5E1', margin: '8px 0' }} />
                  </div>
                ) : null}

                {/* Footer Message */}
                <div style={{ textAlign: 'center', fontSize: '10px', color: '#64748B', whiteSpace: 'pre-line' }}>
                  {form.pesan_struk || 'Terima kasih atas kunjungan Anda!'}
                </div>
              </div>
            </div>
          </div>

          {/* Backup Database Card */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              padding: '18px 20px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14.5px', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                Pencadangan Database
              </h3>
              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '3px', margin: 0 }}>
                Cadangkan data transaksi, produk, dan laporan secara berkala
              </p>
            </div>

            {backupStatus?.lastBackupAt ? (
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  marginBottom: '14px',
                  fontSize: '11.5px',
                  color: '#475569',
                }}
              >
                <div>Backup terakhir: <strong>{new Date(backupStatus.lastBackupAt).toLocaleString('id-ID')}</strong></div>
                <div style={{ color: '#94A3B8', marginTop: '2px' }}>
                  Disimpan maksimal {backupStatus?.maxLocalBackups || 7} arsip lokal.
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  marginBottom: '14px',
                  fontSize: '11.5px',
                  color: '#94A3B8',
                }}
              >
                Belum ada rekaman pencadangan otomatis.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={runBackup}
                disabled={backupLoading}
                style={{
                  width: '100%',
                  padding: '8px 14px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: backupLoading ? 'not-allowed' : 'pointer',
                  opacity: backupLoading ? 0.7 : 1,
                }}
              >
                {backupLoading ? 'Memproses Backup...' : 'Backup Database Sekarang'}
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: window.pos?.openDataFolder ? '1fr 1fr' : '1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={downloadRawBackup}
                  style={{
                    padding: '8px 12px',
                    background: '#FFFFFF',
                    color: '#334155',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Unduh File .sqlite
                </button>

                {window.pos?.openDataFolder && (
                  <button
                    type="button"
                    onClick={openDataFolder}
                    style={{
                      padding: '8px 12px',
                      background: '#FFFFFF',
                      color: '#334155',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Buka Folder Data
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

      <ReceiptPrintPortal
        data={testStruk}
        pengaturan={form}
        lebar={Number(form.lebar_struk) || 80}
      />
    </div>
  );
};

const labelStyle = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#475569',
  display: 'block',
  marginBottom: '6px',
};

const inputStyle = {
  width: '100%',
  height: '36px',
  padding: '0 12px',
  borderRadius: '8px',
  border: '1px solid #CBD5E1',
  fontSize: '13px',
  color: '#0F172A',
  background: '#FFFFFF',
  boxSizing: 'border-box',
};

const textareaStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #CBD5E1',
  fontSize: '13px',
  color: '#0F172A',
  background: '#FFFFFF',
  boxSizing: 'border-box',
  resize: 'vertical',
  fontFamily: 'inherit',
};

export default Pengaturan;
