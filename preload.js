const { contextBridge, ipcRenderer } = require('electron');

// Hanya API minimum yang dibutuhkan renderer.
// Semua operasi file/OS tetap dilakukan di main process.
contextBridge.exposeInMainWorld('pos', {
  getAppInfo: () => ipcRenderer.invoke('app:info'),
  openDataFolder: () => ipcRenderer.invoke('app:open-data-folder'),
  listPrinters: () => ipcRenderer.invoke('printer:list'),
  printReceipt: (options) => ipcRenderer.invoke('printer:print', options),
});
