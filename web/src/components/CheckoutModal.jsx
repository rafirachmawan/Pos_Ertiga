import React, { useState } from 'react';
import { formatRupiah, formatWeight } from '../lib/format';
import { generateWhatsAppOrderUrl } from '../lib/whatsapp';

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems = [],
  storeInfo,
  onOrderSuccess,
}) {
  if (!isOpen) return null;

  const [customer, setCustomer] = useState({
    nama: '',
    telepon: '',
    alamat: '',
    catatan: '',
  });

  const totalWeight = cartItems.reduce((sum, item) => sum + (item.berat_gram || 0) * item.qty, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.harga_jual || 0) * item.qty, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customer.nama.trim() || !customer.telepon.trim() || !customer.alamat.trim()) {
      alert('Mohon lengkapi Nama, No. WhatsApp, dan Alamat Pengiriman.');
      return;
    }

    // Nomor WhatsApp toko dari pengaturan toko atau default
    const storePhone = storeInfo?.telepon || storeInfo?.alamat_toko?.match(/08[0-9-]+/)?.[0] || '6281234567890';

    const waUrl = generateWhatsAppOrderUrl({
      storePhone,
      customer,
      items: cartItems,
      subtotal,
      totalWeight,
    });

    // Buka WhatsApp di tab baru
    window.open(waUrl, '_blank');
    onOrderSuccess();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '540px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
              Form Pemesanan via WhatsApp
            </h3>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              Isi data pengiriman untuk terhubung langsung ke CS Toko
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              color: '#475569',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          
          {/* Order Summary Box */}
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>
              Ringkasan Pesanan ({cartItems.length} produk)
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#475569', marginBottom: '4px' }}>
              <span>Total Estimasi Berat</span>
              <span style={{ fontWeight: '600' }}>{formatWeight(totalWeight)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
              <span>Total Tagihan</span>
              <span style={{ color: '#2563EB', fontSize: '16px' }}>Rp {formatRupiah(subtotal)}</span>
            </div>
          </div>

          {/* Form Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
            <div>
              <label style={labelStyle}>
                Nama Lengkap Penerima <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                value={customer.nama}
                onChange={(e) => setCustomer({ ...customer, nama: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Nomor WhatsApp Aktif <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="Contoh: 081234567890"
                value={customer.telepon}
                onChange={(e) => setCustomer({ ...customer, telepon: e.target.value })}
                style={inputStyle}
              />
              <small style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px', display: 'block' }}>
                Untuk konfirmasi nomor resi & rincian ongkos kirim
              </small>
            </div>

            <div>
              <label style={labelStyle}>
                Alamat Lengkap Pengiriman <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Jl. Mawar No. 12, RT 01/RW 02, Kel. Sukamaju, Kec. Cilandak, Jakarta Selatan, 12430"
                value={customer.alamat}
                onChange={(e) => setCustomer({ ...customer, alamat: e.target.value })}
                style={textareaStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Catatan Tambahan (Opsional)</label>
              <input
                type="text"
                placeholder="Contoh: Warna cadangan hitam, mohon kirim pagi"
                value={customer.catatan}
                onChange={(e) => setCustomer({ ...customer, catatan: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="btn-submit-order-wa"
            style={{
              width: '100%',
              height: '46px',
              background: '#059669',
              color: '#FFFFFF',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px -1px rgba(5,150,105,0.2)',
            }}
          >
            <span>💬</span> Kirim Pesanan via WhatsApp
          </button>

          <p style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', marginTop: '10px', margin: '10px 0 0 0' }}>
            Setelah klik tombol di atas, Anda akan dialihkan langsung ke chat WhatsApp toko dengan format pesanan yang rapi.
          </p>

        </form>

      </div>
    </div>
  );
}

const labelStyle = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#475569',
  display: 'block',
  marginBottom: '5px',
};

const inputStyle = {
  width: '100%',
  height: '38px',
  padding: '0 12px',
  borderRadius: '8px',
  border: '1px solid #CBD5E1',
  fontSize: '13px',
  boxSizing: 'border-box',
  outline: 'none',
};

const textareaStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #CBD5E1',
  fontSize: '13px',
  boxSizing: 'border-box',
  outline: 'none',
  resize: 'vertical',
  fontFamily: 'inherit',
};
