// Tanggal bisnis memakai zona waktu lokal komputer kasir.
// Database tetap menyimpan UTC (CURRENT_TIMESTAMP); query agregasi
// memakai modifier 'localtime' agar konsisten dengan helper ini.

function localDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isDateKey(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function localMonthKey(d = new Date()) {
  return localDateKey(d).slice(0, 7);
}

module.exports = { localDateKey, localMonthKey, isDateKey };
