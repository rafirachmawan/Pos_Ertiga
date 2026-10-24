// Custom clean dialog system for web storefront

const dialogListeners = new Set();
const toastListeners = new Set();

let currentDialog = null;

export function onDialogChange(callback) {
  dialogListeners.add(callback);
  try {
    callback(currentDialog);
  } catch (e) {
    console.error(e);
  }
  return () => dialogListeners.delete(callback);
}

export function onToast(callback) {
  toastListeners.add(callback);
  return () => toastListeners.delete(callback);
}

function notifyDialog() {
  dialogListeners.forEach((cb) => {
    try {
      cb(currentDialog);
    } catch (e) {
      console.error(e);
    }
  });
}

function notifyToast(toast) {
  toastListeners.forEach((cb) => {
    try {
      cb(toast);
    } catch (e) {
      console.error(e);
    }
  });
}

export function showConfirm(options = {}) {
  return new Promise((resolve) => {
    const opts = typeof options === 'string' ? { message: options } : options;
    const msg = opts.message || 'Apakah Anda yakin ingin melanjutkan?';
    const isDelete =
      opts.type === 'danger' ||
      /hapus|delete|batal/i.test(opts.title || '') ||
      /hapus|delete|batal/i.test(msg);

    currentDialog = {
      type: opts.type || (isDelete ? 'danger' : 'confirm'),
      title: opts.title || (isDelete ? 'Konfirmasi Hapus' : 'Konfirmasi Tindakan'),
      message: msg,
      submessage: opts.submessage || (isDelete ? 'Tindakan ini tidak dapat dibatalkan.' : ''),
      confirmText: opts.confirmText || (isDelete ? 'Ya, Hapus' : 'Konfirmasi'),
      cancelText: opts.cancelText || 'Batal',
      isAlert: false,
      resolve: (result) => {
        currentDialog = null;
        notifyDialog();
        resolve(Boolean(result));
      },
    };
    notifyDialog();
  });
}

export function showAlert(options = {}) {
  return new Promise((resolve) => {
    const opts = typeof options === 'string' ? { message: options } : options;
    const msg = String(opts.message || '');
    const isError =
      opts.type === 'danger' ||
      opts.type === 'error' ||
      /gagal|error|tidak ditemukan|habis|kurang|melebihi|mohon/i.test(msg) ||
      /gagal|error|perhatian/i.test(opts.title || '');
    const isSuccess =
      opts.type === 'success' ||
      /berhasil|sukses/i.test(msg) ||
      /berhasil|sukses/i.test(opts.title || '');

    let detectedType = 'info';
    let defaultTitle = 'Pemberitahuan';
    if (isError) {
      detectedType = 'warning';
      defaultTitle = 'Perhatian';
    } else if (isSuccess) {
      detectedType = 'success';
      defaultTitle = 'Berhasil';
    }

    currentDialog = {
      type: opts.type || detectedType,
      title: opts.title || defaultTitle,
      message: msg,
      okText: opts.okText || 'Mengerti',
      isAlert: true,
      resolve: () => {
        currentDialog = null;
        notifyDialog();
        resolve(true);
      },
    };
    notifyDialog();
  });
}

export function showToast(message, type = 'success', duration = 3000) {
  const id = Date.now() + Math.random();
  notifyToast({ id, message: String(message), type, duration });
}

if (typeof window !== 'undefined') {
  window.showAlert = showAlert;
  window.showConfirm = showConfirm;
  window.showToast = showToast;
  window.alert = (msg) => {
    showAlert(msg);
  };
}
