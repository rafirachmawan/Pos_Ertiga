import React, { useEffect, useState } from 'react';
import { api, apiUrl } from '../lib/api';
import { ReceiptPrintPortal } from './Receipt';
import { printCurrentReceipt } from '../lib/print';

const DEFAULT_FORM = {
  nama_toko: '',
  alamat_toko: '',
  pesan_struk: '',
  printer_name: '',
  lebar_struk: 80,
  auto_print: 0,
};

const Pengaturan = () => {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [printers, setPrinters] = useState([]);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [backupStatus, setBackupStatus] = useState(null);
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
    }
  };

  const testPrint = () => {
    setTestStruk({
      nomor_nota: 'TEST-PRINTER',
      nama_pelanggan: 'Tes Printer',
      tanggal: new Date().toLocaleString('id-ID'),
      items: [
        {
          nama_barang: 'Contoh Produk',
          qty: 1,
          harga_jual: 10000,
          subtotal: 10000,
        },
      ],
      subtotal: 10000,
      diskon: 0,
      total: 10000,
      bayar: 10000,
      kembalian: 0,
      metode_pembayaran: 'Tunai',
    });
  };

  const runBackup = async () => {
    try {
      const result = await api('/api/backup/run', { method: 'POST' });
      setBackupStatus(result.data?.status || null);
      showMessage('Backup lokal berhasil dibuat.');
    } catch (err) {
      alert(err.message);
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
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Memuat pengaturan...
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--secondary-color)' }}>
          Pengaturan
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
          Konfigurasi informasi toko, printer, dan backup
        </p>
      </div>

      {message && (
        <div
          style={{
            background: '#D1FAE5',
            color: '#065F46',
            padding: '10px 16px',
            borderRadius: '10px',
            marginBottom: '16px',
            fontSize: '13px',
            fontWeight: '600',
          }}
        >
          {message}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
        <div
          style={{
            background: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--secondary-color)' }}>
                ⚙️ Informasi Toko & Struk
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Tampil di header dan footer struk
              </p>
            </div>
            {saved && (
              <span
                style={{
                  background: '#D1FAE5',
                  color: '#065F46',
                  fontSize: '12px',
                  fontWeight: '700',
                  padding: '5px 14px',
                  borderRadius: '20px',
                }}
              >
                ✓ Tersimpan!
              </span>
            )}
          </div>

          <form onSubmit={savePengaturan} style={{ padding: '24px' }}>
            <div
              style={{
                background: '#F8FAFC',
                border: '1px dashed var(--border-color)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                textAlign: 'center',
                fontFamily: "'Courier New', monospace",
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Preview Struk
              </div>
              <div style={{ fontWeight: '800', fontSize: '15px', letterSpacing: '1px' }}>
                {form.nama_toko || 'NAMA TOKO'}
              </div>
              {form.alamat_toko && (
                <div
                  style={{
                    fontSize: '11px',
                    color: '#64748B',
                    marginTop: '2px',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {form.alamat_toko}
                </div>
              )}
              <div
                style={{
                  borderTop: '1px dashed #CBD5E1',
                  marginTop: '8px',
                  paddingTop: '8px',
                  fontSize: '11px',
                  color: '#94A3B8',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {form.pesan_struk}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nama Toko *</label>
                <input
                  value={form.nama_toko}
                  onChange={(e) => setForm({ ...form, nama_toko: e.target.value })}
                  placeholder="POS ERTIGA"
                  required
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Alamat & Telepon Toko</label>
                <textarea
                  value={form.alamat_toko}
                  onChange={(e) => setForm({ ...form, alamat_toko: e.target.value })}
                  placeholder="Jl. Contoh No. 1&#10;Telp: 08xxxx"
                  rows={2}
                  style={textareaStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Pesan Bawah Struk</label>
                <textarea
                  value={form.pesan_struk}
                  onChange={(e) => setForm({ ...form, pesan_struk: e.target.value })}
                  placeholder="Terima kasih sudah berbelanja!"
                  rows={2}
                  style={textareaStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Printer</label>
                  <select
                    value={form.printer_name}
                    onChange={(e) => setForm({ ...form, printer_name: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="">Printer default Windows</option>
                    {printers.map((printer) => (
                      <option key={printer.name} value={printer.name}>
                        {printer.displayName || printer.name}
                        {printer.isDefault ? ' (Default)' : ''}
                      </option>
                    ))}
                  </select>
                  {!window.pos && (
                    <small style={{ color: '#94A3B8', display: 'block', marginTop: '4px' }}>
                      Daftar printer tersedia saat aplikasi Electron berjalan.
                    </small>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Lebar Kertas</label>
                  <select
                    value={form.lebar_struk}
                    onChange={(e) =>
                      setForm({ ...form, lebar_struk: Number(e.target.value) })
                    }
                    style={{ width: '100%' }}
                  >
                    <option value={58}>58 mm</option>
                    <option value={80}>80 mm</option>
                  </select>
                </div>
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: 'var(--text-dark)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={Number(form.auto_print) === 1}
                  onChange={(e) =>
                    setForm({ ...form, auto_print: e.target.checked ? 1 : 0 })
                  }
                />
                Cetak struk otomatis setelah transaksi
              </label>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    minWidth: '180px',
                    padding: '12px',
                    background: 'linear-gradient(135deg, var(--primary-color), #6366F1)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  💾 Simpan Pengaturan
                </button>
                <button
                  type="button"
                  onClick={testPrint}
                  style={{
                    padding: '12px 20px',
                    background: '#EEF2FF',
                    color: 'var(--primary-color)',
                    border: '1px solid #C7D2FE',
                    borderRadius: '10px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  🖨️ Tes Print
                </button>
              </div>
            </div>
          </form>
        </div>

        <div
          style={{
            background: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '20px 24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--secondary-color)' }}>
                💾 Backup Database
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Backup lokal otomatis disimpan sebagai .sql.gz dan disimpan maksimal{' '}
                {backupStatus?.maxLocalBackups || 7} file.
              </p>
              {backupStatus?.lastBackupAt && (
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Backup terakhir: {new Date(backupStatus.lastBackupAt).toLocaleString('id-ID')}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {window.pos?.openDataFolder && (
                <button
                  type="button"
                  onClick={openDataFolder}
                  style={secondaryButtonStyle}
                >
                  📂 Buka Folder Data
                </button>
              )}
              <button type="button" onClick={runBackup} style={primaryButtonStyle}>
                🗄️ Backup Sekarang
              </button>
              <button type="button" onClick={downloadRawBackup} style={secondaryButtonStyle}>
                ⬇️ Database Mentah
              </button>
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
  fontWeight: '700',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  display: 'block',
  marginBottom: '6px',
};

const textareaStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  fontSize: '14px',
  resize: 'vertical',
};

const primaryButtonStyle = {
  padding: '10px 18px',
  background: '#EEF2FF',
  color: 'var(--primary-color)',
  border: '1px solid #C7D2FE',
  borderRadius: '10px',
  fontWeight: '700',
  cursor: 'pointer',
  fontSize: '13px',
};

const secondaryButtonStyle = {
  padding: '10px 18px',
  background: '#F8FAFC',
  color: 'var(--text-dark)',
  border: '1px solid var(--border-color)',
  borderRadius: '10px',
  fontWeight: '700',
  cursor: 'pointer',
  fontSize: '13px',
};

export default Pengaturan;
