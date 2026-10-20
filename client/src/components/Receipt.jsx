import React from 'react';
import { createPortal } from 'react-dom';
import { formatDateTime } from '../lib/date';
import { formatRupiah } from '../lib/format';

function normalizeItems(data) {
  return (data?.items || []).map((item, index) => {
    const price = Number(
      item.harga_jual ?? item.harga_jual_saat_ini ?? item.harga ?? 0
    );
    const qty = Number(item.qty || 0);

    return {
      key: item.id ?? index,
      nama_barang: item.nama_barang || 'Barang',
      qty,
      harga_jual: price,
      subtotal: Number(item.subtotal ?? price * qty),
    };
  });
}

export function Receipt({ data, pengaturan = {}, preview = false, lebar = 80 }) {
  if (!data) return null;

  const items = normalizeItems(data);
  const subtotal = Number(
    data.subtotal ?? items.reduce((sum, item) => sum + item.subtotal, 0)
  );
  const diskon = Number(data.diskon || 0);
  const total = Number(data.total ?? data.total_harga ?? subtotal - diskon);
  const bayar = Number(data.bayar ?? data.total_bayar ?? 0);
  const kembali = Number(data.kembalian ?? data.total_kembalian ?? 0);
  const tanggal = data.tanggal || formatDateTime(data.tanggal_transaksi);

  return (
    <div
      className={`receipt receipt-${lebar} ${
        preview ? 'receipt-preview' : ''
      }`}
    >
      <div className="receipt-center">
        <div className="receipt-store">{pengaturan.nama_toko || 'POS ERTIGA'}</div>
        {pengaturan.alamat_toko ? (
          <div className="receipt-address">{pengaturan.alamat_toko}</div>
        ) : null}
        <div className="receipt-meta">{tanggal}</div>
        <div className="receipt-nota">{data.nomor_nota || '-'}</div>
      </div>

      <div className="receipt-divider" />

      <div className="receipt-line">
        <span>Pelanggan</span>
        <span>{data.nama_pelanggan || 'Umum'}</span>
      </div>

      <div className="receipt-divider" />

      <div className="receipt-items">
        {items.map((item) => (
          <div className="receipt-item" key={item.key}>
            <div className="receipt-item-name">{item.nama_barang}</div>
            <div className="receipt-line receipt-small">
              <span>
                {item.qty} x {formatRupiah(item.harga_jual)}
              </span>
              <span>{formatRupiah(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="receipt-divider" />

      <div className="receipt-line">
        <span>Subtotal</span>
        <span>{formatRupiah(subtotal)}</span>
      </div>

      {diskon > 0 ? (
        <div className="receipt-line receipt-discount">
          <span>Diskon</span>
          <span>- {formatRupiah(diskon)}</span>
        </div>
      ) : null}

      <div className="receipt-line receipt-total">
        <span>TOTAL</span>
        <span>{formatRupiah(total)}</span>
      </div>

      <div className="receipt-line">
        <span>Metode</span>
        <span>{data.metode_pembayaran || 'Tunai'}</span>
      </div>
      <div className="receipt-line">
        <span>Bayar</span>
        <span>{formatRupiah(bayar)}</span>
      </div>
      <div className="receipt-line">
        <span>Kembali</span>
        <span>{formatRupiah(kembali)}</span>
      </div>

      <div className="receipt-divider" />

      <div className="receipt-footer">{pengaturan.pesan_struk || 'Terima kasih telah berbelanja!'}</div>
      <div className="receipt-footer receipt-small">
        Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.
      </div>

      {data.status === 'void' ? <div className="receipt-void">VOID</div> : null}
    </div>
  );
}

// Portal ini hanya terlihat saat print. Saat tampil di layar,
// elemen #root disembunyikan oleh CSS @media print.
export function ReceiptPrintPortal({ data, pengaturan, lebar = 80 }) {
  if (!data || typeof document === 'undefined') return null;

  return createPortal(
    <>
      <style>{`@media print { @page { size: ${lebar}mm auto; margin: 0; } }`}</style>
      <div id="receipt-print-portal">
        <Receipt data={data} pengaturan={pengaturan} lebar={lebar} />
      </div>
    </>,
    document.body
  );
}
