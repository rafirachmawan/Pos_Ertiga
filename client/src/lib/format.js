export function formatRupiah(value) {
  const number = Number(value || 0);
  return `Rp ${number.toLocaleString('id-ID')}`;
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString('id-ID');
}

export function formatRupiahInput(value) {
  if (value === '' || value === null || value === undefined) return '';
  const num = Number(String(value).replace(/[^0-9]/g, ''));
  if (isNaN(num) || num === 0) return '';
  return `Rp ${num.toLocaleString('id-ID')}`;
}

export function parseRupiahInput(str) {
  if (!str) return 0;
  return Number(String(str).replace(/[^0-9]/g, '')) || 0;
}
