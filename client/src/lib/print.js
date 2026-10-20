// Cetak struk:
// - Electron: kirim ke printer default/terpilih lewat IPC (silent print).
// - Browser/dev: fallback ke dialog print Chromium.
export async function printCurrentReceipt({ lebar = 80 } = {}) {
  if (window.pos?.printReceipt) {
    try {
      await window.pos.printReceipt({
        widthMm: Number(lebar) || 80,
        silent: true,
      });
      return true;
    } catch (err) {
      console.warn('[PRINT] Silent print gagal, memakai dialog print:', err);
    }
  }

  window.print();
  return false;
}
