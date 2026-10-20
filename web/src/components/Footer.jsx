import React from 'react';

export default function Footer({ storeInfo }) {
  return (
    <footer style={{ background: '#0F172A', color: '#94A3B8', padding: '48px 0 24px', marginTop: '60px' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '32px', marginBottom: '36px' }}>
          
          {/* Col 1 */}
          <div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', marginBottom: '10px' }}>
              {storeInfo?.nama_toko || 'POS ERTIGA STORE'}
            </div>
            <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#94A3B8', marginBottom: '14px', whiteSpace: 'pre-line' }}>
              {storeInfo?.alamat_toko || 'Toko Retail & Fashion Terpercaya'}
            </p>
            <div style={{ fontSize: '12px', color: '#64748B' }}>
              Stok terintegrasi langsung dengan kasir toko fisik.
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF', marginBottom: '12px' }}>
              Layanan Pelanggan
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Konfirmasi Pesanan Cepat</li>
              <li>Ekspedisi: JNE, J&T, SiCepat, Gosend</li>
              <li>Pengemasan Rapi & Aman</li>
              <li>Bisa Konsultasi Produk via WhatsApp</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF', marginBottom: '12px' }}>
              Jam Operasional
            </div>
            <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
              <div>Senin - Sabtu: 08:00 - 21:00 WIB</div>
              <div>Minggu & Hari Libur: Tetap Buka</div>
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#10B981', fontWeight: '600' }}>
                ● Melayani pesanan online 24 jam
              </div>
            </div>
          </div>

        </div>

        <div style={{ borderTop: '1px solid #1E293B', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: '#64748B' }}>
          <div>
            &copy; {new Date().getFullYear()} {storeInfo?.nama_toko || 'POS ERTIGA'}. All rights reserved.
          </div>
          <div>
            Terintegrasi dengan <strong>POS ERTIGA Omnichannel System</strong>
          </div>
        </div>

      </div>
    </footer>
  );
}
