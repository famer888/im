const { BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const isDevelopment = process.env.NODE_ENV !== 'production';
const WINDOW_ID = 'media-player-window';
/** 主进程挂载在 BrowserWindow 上，用于从 getAllWindows() 中排除媒体窗口 */
export const OCS_MEDIA_WINDOW_ROLE = 'ocs-media-window';

export function isMediaPlayerWindow(win) {
  return !!(win && !win.isDestroyed() && win.ocsWindowRole === OCS_MEDIA_WINDOW_ROLE);
}
const icon = path.join(__dirname, isDevelopment ? './public/images/dock.png' : './images/dock.png');

class MediaPlayerProcess {
  constructor() {
    this.window = null;
    /** Windows 上 transparent 窗口 isMaximized() 常为 false，不能用于切换；用用户操作状态驱动最大化/还原 */
    this._mediaMaximizedByToggle = false;
  }

  /**
   * 获取或创建媒体播放器窗口（单例）
   * @param {Electron.BrowserWindow} [mainWindow] 主窗口，用于获取 x,y 定位
   */
  create(mainWindow, initialPlayerState = null) {
    if (this.window && !this.window.isDestroyed()) {
      return this.window;
    }

    this._initialPlayerState = initialPlayerState || null;

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
        webSecurity: true,
        backgroundThrottling: false,
        additionalArguments: [`--window-id=${WINDOW_ID}`],
      },
    });
    this.window.ocsWindowRole = OCS_MEDIA_WINDOW_ROLE;

    this._registerIpcHandlers();
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        const { x, y } = mainWindow.getBounds();
        // this.window.maximize();
        this.window.setPosition(x, y);
      } else {
        this.window.center();
        // this.window.maximize();
      }
    } catch (e) {
      this.window.center();
    }
    this.window.webContents.once('did-finish-load', () => {
      const state = this._initialPlayerState;
      this._initialPlayerState = null;
      if (!state || !this.window || this.window.isDestroyed()) return;
      try {
        const payload = JSON.stringify(state);
        this.window.webContents.executeJavaScript(
          `typeof window.__mediaApplyPlayerState==='function'&&window.__mediaApplyPlayerState(${payload});`
        );
      } catch (e) {
        console.error('[MediaProcess] initialPlayerState', e);
      }
    });
    if (process.env.WEBPACK_DEV_SERVER_URL) {
      this.window.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '/media/media.html');
    } else {
      this.window.loadURL('app://./media/media.html');
    }

    this.window.on('closed', () => {
      this._removeIpcHandlers();
      this.window = null;
      this._mediaMaximizedByToggle = false;
    });

    this.window.on('maximize', () => { this._mediaMaximizedByToggle = true; });
    this.window.on('unmaximize', () => { this._mediaMaximizedByToggle = false; });

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
    ipcMain.on('media-window:maximize', () => {
      try {
        if (!this.window || this.window.isDestroyed()) return;
        if (this._mediaMaximizedByToggle) {
          this.window.unmaximize();
          this._mediaMaximizedByToggle = false;
        } else {
          this.window.maximize();
          this._mediaMaximizedByToggle = true;
        }
      } catch (e) {
        /* ignore */
      }
    });
    ipcMain.on('media-window:close', () => { if (this.window && !this.window.isDestroyed()) this.window.close(); });
    ipcMain.handle('media-window:saveAs', async (event, filePath) => {
      if (!this.window || this.window.isDestroyed()) return { success: false };
      const defaultName = path.basename(filePath);
      const { canceled, filePath: savePath } = await dialog.showSaveDialog(this.window, { defaultPath: defaultName });
      if (canceled || !savePath) return { success: false };
      fs.copyFileSync(filePath, savePath);
      return { success: true };
    });
    ipcMain.handle('media-window:openPath', async (event, filePathOrUrl) => {
      if (!filePathOrUrl || typeof filePathOrUrl !== 'string') return { success: false, error: 'invalid path' };
      try {
        if (/^https?:\/\//i.test(filePathOrUrl)) {
          await shell.openExternal(filePathOrUrl);
          return { success: true };
        }
        const err = await shell.openPath(path.normalize(filePathOrUrl));
        return { success: !err, error: err || undefined };
      } catch (e) {
        return { success: false, error: (e && e.message) || String(e) };
      }
    });
  }

  _removeIpcHandlers() {
    ipcMain.removeAllListeners('media-window:minimize');
    ipcMain.removeAllListeners('media-window:maximize');
    ipcMain.removeAllListeners('media-window:close');
    ipcMain.removeHandler('media-window:saveAs');
    ipcMain.removeHandler('media-window:openPath');
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
