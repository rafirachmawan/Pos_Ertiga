import React, { useEffect, useState } from 'react';
import { api, apiUrl } from '../lib/api';
import { ReceiptPrintPortal } from './Receipt';
import { printCurrentReceipt } from '../lib/print';

const DEFAULT_FORM = {
  nama_toko: '',
  alamat_toko: '',
  pesan_struk: '',
  telepon: '',
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
        await printCurrentReceipt({ lebar: Number(form.lebar_struk) || 80 });
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

  const savePengaturan = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api('/api/pengaturan', {
        method: 'PUT',
        body: {
          ...form,
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
