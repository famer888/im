const { BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const isDevelopment = process.env.NODE_ENV !== 'production';
const WINDOW_ID = 'media-player-window';
const icon = path.join(__dirname, isDevelopment ? './public/images/dock.png' : './images/dock.png');

class MediaPlayerProcess {
  constructor() {
    this.window = null;
  }

  /**
   * 获取或创建媒体播放器窗口（单例）
   * @param {Electron.BrowserWindow} [mainWindow] 主窗口，用于获取 x,y 定位
   */
  create(mainWindow) {
    console.log('create Media Player Window');
    if (this.window && !this.window.isDestroyed()) {
      return this.window;
    }

    this.window = new BrowserWindow({
      title: 'Media Player',
      icon,
      width: 900,
      height: 600,
      minWidth: 600,
      minHeight: 500,
      show: true,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      hasShadow: false,
      skipTaskbar: false,
      fullscreenable: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, isDevelopment ? './public/media/media-preload.js' : './media/media-preload.js'),
        webSecurity: false,
        backgroundThrottling: false,
        additionalArguments: [`--window-id=${WINDOW_ID}`],
      },
    });

    this._registerIpcHandlers();
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        const { x, y } = mainWindow.getBounds();
        this.window.setPosition(x, y);
      } else {
        this.window.center();
      }
    } catch (e) {
      this.window.center();
    }
    if (process.env.WEBPACK_DEV_SERVER_URL) {
      this.window.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '/media/media.html');
    } else {
      this.window.loadURL('app://./media/media.html');
    }

    this.window.on('closed', () => {
      this._removeIpcHandlers();
      this.window = null;
    });

    return this.window;
  }

  /**
   * 销毁媒体播放器窗口
   */
  destroy() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.close();
      this.window = null;
    }
  }

  /**
   * 绑定主窗口，监听其 close/崩溃事件以自动销毁媒体播放器
   */
  destroyOnMainWindowClose(mainWindow) {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return;
    }

    const onDestroy = () => this.destroy();

    mainWindow.once('closed', onDestroy);
    mainWindow.webContents.once('crashed', onDestroy);
    mainWindow.webContents.once('render-process-gone', (event, details) => {
      if (details.reason !== 'clean-exit') {
        this.destroy();
      }
    });
  }

  /**
   * 显示媒体播放器窗口
   */
  show() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.show();
      this.window.focus();
    }
  }

  /**
   * 隐藏媒体播放器窗口
   */
  hide() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.hide();
    }
  }

  _registerIpcHandlers() {
    ipcMain.on('media-window:minimize', () => { if (this.window && !this.window.isDestroyed()) this.window.minimize(); });
    ipcMain.on('media-window:maximize', () => { if (this.window && !this.window.isDestroyed()) { this.window.isMaximized() ? this.window.unmaximize() : this.window.maximize(); } });
    ipcMain.on('media-window:close', () => { if (this.window && !this.window.isDestroyed()) this.window.close(); });
    ipcMain.handle('media-window:saveAs', async (event, filePath) => {
      if (!this.window || this.window.isDestroyed()) return { success: false };
      const defaultName = path.basename(filePath);
      const { canceled, filePath: savePath } = await dialog.showSaveDialog(this.window, { defaultPath: defaultName });
      if (canceled || !savePath) return { success: false };
      fs.copyFileSync(filePath, savePath);
      return { success: true };
    });
  }

  _removeIpcHandlers() {
    ipcMain.removeAllListeners('media-window:minimize');
    ipcMain.removeAllListeners('media-window:maximize');
    ipcMain.removeAllListeners('media-window:close');
    ipcMain.removeHandler('media-window:saveAs');
  }

  /**
   * 向媒体播放器窗口发送消息
   */
  send(channel, data) {
    if (this.window && !this.window.isDestroyed() && this.window.webContents) {
      this.window.webContents.send(channel, data);
    }
  }
}

const mediaPlayerProcess = new MediaPlayerProcess();

export { WINDOW_ID };
export default mediaPlayerProcess;
