const {
  app,
  BrowserWindow,
  ipcMain,
  session,
  shell,
  Menu,
  dialog,
} = require('electron');
const path = require('path');

process.env.IS_ELECTRON = 'true';

let mainWindow = null;
let serverModule = null;
let quitting = false;

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  app.whenReady().then(bootstrap).catch((err) => {
    console.error('[MAIN] Gagal bootstrap:', err);
    dialog.showErrorBox('Gagal memulai aplikasi', err.message);
    app.quit();
  });
}

async function bootstrap() {
  // Path harus diset SEBELUM server/database di-require.
  process.env.USER_DATA_PATH = app.getPath('userData');
  process.env.APP_VERSION = app.getVersion();
  process.env.APP_PACKAGED = app.isPackaged ? 'true' : 'false';

  if (app.isPackaged) {
    process.env.CLIENT_DIST_PATH = path.join(
      process.resourcesPath,
      'app.asar.unpacked',
      'client',
      'dist'
    );
  } else {
    process.env.CLIENT_DIST_PATH = path.join(__dirname, 'client', 'dist');
  }

  app.setAppUserModelId('com.pos.ertiga');
  if (app.isPackaged) Menu.setApplicationMenu(null);

  console.log('[MAIN] userData:', process.env.USER_DATA_PATH);
  console.log('[MAIN] clientDist:', process.env.CLIENT_DIST_PATH);

  serverModule = require('./server/server.js');

  try {
    await serverModule.startServer(3001, '127.0.0.1');
  } catch (err) {
    console.error('[MAIN] Server gagal start:', err);
    dialog.showErrorBox(
      'Server gagal dijalankan',
      err.code === 'EADDRINUSE'
        ? 'Port 3001 sedang dipakai aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.'
        : err.message
    );
    app.quit();
    return;
  }

  registerIpcHandlers();
  setupSessionSecurity();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    backgroundColor: '#F8FAFC',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: !app.isPackaged,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.loadURL('http://127.0.0.1:3001');

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowed = ['http://127.0.0.1:3001', 'http://localhost:3001'];
    if (allowed.some((base) => url.startsWith(base))) return;

    event.preventDefault();
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function setupSessionSecurity() {
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      // Aplikasi kasir tidak membutuhkan kamera, mikrofon, lokasi, dsb.
      callback(false);
    }
  );
}

function registerIpcHandlers() {
  ipcMain.handle('app:info', () => ({
    version: app.getVersion(),
    packaged: app.isPackaged,
    userData: app.getPath('userData'),
    platform: process.platform,
  }));

  ipcMain.handle('app:open-data-folder', async () => {
    const result = await shell.openPath(app.getPath('userData'));
    if (result) throw new Error(result);
    return { success: true };
  });

  ipcMain.handle('printer:list', async (event) => {
    return event.sender.getPrintersAsync();
  });

  ipcMain.handle('printer:print', async (event, options = {}) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) throw new Error('Window tidak ditemukan');

    const widthMm = [58, 80].includes(Number(options.widthMm))
      ? Number(options.widthMm)
      : 80;
    const deviceName =
      typeof options.deviceName === 'string' ? options.deviceName : '';

    const printOptions = {
      silent: options.silent !== false,
      printBackground: true,
      margins: { marginType: 'none' },
      pageSize: {
        width: Math.round(widthMm * 1000), // mikron
        height: 297000,
      },
    };

    if (deviceName) printOptions.deviceName = deviceName;

    return new Promise((resolve, reject) => {
      win.webContents.print(printOptions, (success, failureReason) => {
        if (success) resolve({ success: true });
        else reject(new Error(failureReason || 'Gagal mencetak'));
      });
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', (event) => {
  if (quitting) return;

  event.preventDefault();
  quitting = true;

  const finish = () => app.quit();

  if (!serverModule) {
    finish();
    return;
  }

  serverModule
    .closeAll()
    .catch((err) => console.error('[MAIN] Gagal shutdown:', err))
    .finally(finish);
});

process.on('uncaughtException', (err) => {
  console.error('[MAIN] uncaughtException:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('[MAIN] unhandledRejection:', err);
});
