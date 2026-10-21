const { app, BrowserWindow, session, ipcMain } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 900,
    minHeight: 500,
    backgroundColor: '#0b0f19',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      webSecurity: false,
      allowRunningInsecureContent: true,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Intercept headers for IPTV streams to bypass user-agent restrictions
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = { ...details.requestHeaders };
    // Provide standard media player user agent for stream/m3u requests
    if (
      details.url.includes('.m3u') ||
      details.url.includes('.ts') ||
      details.url.includes('.m3u8') ||
      details.url.includes(':8080') ||
      details.url.includes(':80') ||
      details.url.includes('/live/') ||
      details.url.includes('/movie/') ||
      details.url.includes('/series/')
    ) {
      headers['User-Agent'] = 'VLC/3.0.18 LibVLC/3.0.18';
    }
    callback({ cancel: false, requestHeaders: headers });
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  mainWindow.loadFile(distPath).catch(err => {
    console.error('Failed to load local dist index.html:', err);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
