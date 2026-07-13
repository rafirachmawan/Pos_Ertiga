const { app, BrowserWindow } = require('electron');
const path = require('path');

// Set environment variables for paths BEFORE requiring server
process.env.IS_ELECTRON = 'true';

// Will be set after app.ready so we can use app.getPath()
// We need to set it before the server requires database.js

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load the Express server URL
  mainWindow.loadURL('http://localhost:3001');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Set userData path for SQLite (must be done after app is ready)
  process.env.USER_DATA_PATH = app.getPath('userData');

  // Set the correct path to client/dist static files
  // When packaged with asarUnpack, client/dist lives in app.asar.unpacked
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

  console.log('USER_DATA_PATH:', process.env.USER_DATA_PATH);
  console.log('CLIENT_DIST_PATH:', process.env.CLIENT_DIST_PATH);

  // Start the Express server within the Electron main process
  try {
    console.log('Starting Express Server...');
    require('./server/server.js');
    console.log('Express Server started inside Electron.');
  } catch (error) {
    console.error('Failed to start Express server:', error);
  }

  // Wait a small bit for server to listen before loading URL
  setTimeout(() => {
    createWindow();
  }, 1000);

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
