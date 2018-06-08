const electron = require('electron');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Module to control application life.
const app = electron.app;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    backgroundColor: '#000',
    width: 1024,
    height: 768 + 22,
    // fullscreen: true,
    webPreferences: { plugins: true }
  });

  mainWindow.appPath = getAppPath();

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'app', 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Clean up temp files.
    let tmpPath = path.join(mainWindow.appPath, 'tmp');
    try {
      fs.readdirSync(tmpPath).forEach((tmpFileName) => {
        if (tmpFileName.startsWith('.')) {
          return;
        }

        let tmpFilePath = path.join(tmpPath, tmpFileName);
        fs.unlinkSync(tmpFilePath);
      });
    } catch (e) {}

    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

function getAppPath() {
  let appPath = app.getAppPath();
  if (path.extname(appPath) === '.asar') {
    switch (process.platform) {
      case 'win32':
        appPath = path.join(appPath, '../');
        break;
      case 'darwin':
        appPath = path.join(appPath, '../../../../');
        break;
      case 'linux':
        appPath = path.join(appPath, '../');
        break;
      default:
        break;
    }
  }

  return appPath;
}

function loadPepperFlashPlugin() {
  let pluginName;
  switch (process.platform) {
    case 'win32':
      pluginName = 'pepflashplayer.dll';
      break;
    case 'darwin':
      pluginName = 'PepperFlashPlayer.plugin';
      break;
    case 'linux':
      pluginName = 'libpepflashplayer.so';
      break;
    default:
      pluginName = 'unknown';
      break;
  }

  let pluginPath = path.join(__dirname, 'plugins', 'PepperFlash', process.arch, process.platform, pluginName).replace('app.asar', 'app.asar.unpacked');
  app.commandLine.appendSwitch('ppapi-flash-path', pluginPath);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // Quit the app even on macOS where typically applications
  // and their menu bar stay alive until explicitly exited.
  app.quit();
});

app.on('activate', function() {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

loadPepperFlashPlugin();

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
