export function formatRupiah(number) {
  if (number === undefined || number === null) return '0';
  return Number(number).toLocaleString('id-ID');
}

export function formatWeight(gram) {
  const g = Number(gram) || 0;
  if (g >= 1000) {
    const kg = (g / 1000).toFixed(1).replace('.0', '');
    return `${kg} kg`;
  }
  return `${g} g`;
}
