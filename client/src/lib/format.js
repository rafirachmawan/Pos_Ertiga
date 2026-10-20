export function formatRupiah(value) {
  const number = Number(value || 0);
  return `Rp ${number.toLocaleString('id-ID')}`;
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString('id-ID');
}
