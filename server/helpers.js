function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Serialisasi semua operasi tulis/transaksi agar tidak saling menyela
// di satu koneksi SQLite.
let writeChain = Promise.resolve();

function withWriteLock(fn) {
  const result = writeChain.then(fn, fn);
  writeChain = result.catch(() => {});
  return result;
}

function toInt(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : fallback;
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function requireText(value, field, maxLength) {
  const text = String(value ?? '').trim();
  if (!text) throw httpError(400, `${field} wajib diisi`);
  if (maxLength && text.length > maxLength) {
    throw httpError(400, `${field} maksimal ${maxLength} karakter`);
  }
  return text;
}

function normalizeBoolean(value) {
  return value === true || value === 1 || value === '1' ? 1 : 0;
}

module.exports = {
  httpError,
  asyncHandler,
  withWriteLock,
  toInt,
  toNumber,
  requireText,
  normalizeBoolean,
};
