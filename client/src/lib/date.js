// Database menyimpan CURRENT_TIMESTAMP dalam UTC.
// String tanpa timezone dari SQLite harus dibaca sebagai UTC,
// lalu ditampilkan dalam waktu lokal perangkat.
export function parseDbDate(value) {
  if (!value) return null;
  const text = String(value);

  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(text)) {
    return new Date(text);
  }

  return new Date(`${text.replace(' ', 'T')}Z`);
}

export function formatDateTime(value) {
  const date = parseDbDate(value);
  if (!date || Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(value) {
  const date = parseDbDate(value);
  if (!date || Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function firstOfMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}
