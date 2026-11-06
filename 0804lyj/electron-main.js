const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Happy Birthday",
    autoHideMenuBar: true, // 隐藏顶部菜单栏，保证质感
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // 加载本地的 index.html
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});