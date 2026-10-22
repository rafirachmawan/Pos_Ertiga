export const API_BASE = '';

export function apiUrl(path) {
  return `${API_BASE}${path}`;
}

export async function api(path, options = {}) {
  const { method = 'GET', body, headers = {}, ...rest } = options;

  const request = {
    method,
    headers: { ...headers },
    ...rest,
  };

  if (body !== undefined) {
    request.headers['Content-Type'] = 'application/json';
    request.body = JSON.stringify(body);
  }

  if (!request.signal && typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
    request.signal = AbortSignal.timeout(15000);
  }

  let response;
  try {
    response = await fetch(apiUrl(path), request);
  } catch (err) {
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      throw new Error('Server tidak merespons. Periksa apakah aplikasi sedang berjalan.');
    }
    throw new Error('Tidak dapat terhubung ke server.');
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(data?.error || `Permintaan gagal (${response.status})`);
  }

  return data;
}
