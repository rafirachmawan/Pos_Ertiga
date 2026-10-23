export const API_BASE = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  ''
).replace(/\/$/, '');

export function apiUrl(path) {
  return `${API_BASE}${path}`;
}

let activeRequests = 0;
const listeners = new Set();

export function onLoadingChange(callback) {
  listeners.add(callback);
  try {
    callback(activeRequests > 0, activeRequests);
  } catch (_) {}
  return () => listeners.delete(callback);
}

export function getActiveRequests() {
  return activeRequests;
}

function notifyLoading() {
  const count = activeRequests;
  const isLoading = count > 0;
  listeners.forEach((cb) => {
    try {
      cb(isLoading, count);
    } catch (e) {
      console.error(e);
    }
  });
}

export function startLoading() {
  activeRequests++;
  notifyLoading();
}

export function stopLoading() {
  activeRequests = Math.max(0, activeRequests - 1);
  notifyLoading();
}

export function resetLoading() {
  activeRequests = 0;
  notifyLoading();
}

export async function api(path, options = {}) {
  const { method = 'GET', body, headers = {}, silent = false, ...rest } = options;

  if (!silent) {
    startLoading();
  }

  try {
    const request = {
      method,
      headers: { ...headers },
      ...rest,
    };

    if (body !== undefined) {
      if (typeof FormData !== 'undefined' && body instanceof FormData) {
        request.body = body;
      } else {
        request.headers['Content-Type'] = 'application/json';
        request.body = JSON.stringify(body);
      }
    }

    if (!request.signal && typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
      request.signal = AbortSignal.timeout(15000);
    }

    const response = await fetch(apiUrl(path), request);

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json().catch(() => null)
      : null;

    if (!response.ok) {
      throw new Error(data?.error || `Permintaan gagal (${response.status})`);
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      throw new Error('Server tidak merespons. Periksa apakah aplikasi sedang berjalan.');
    }
    throw err;
  } finally {
    if (!silent) {
      stopLoading();
    }
  }
}
