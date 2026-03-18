const { BrowserWindow } = require('electron');
const path = require('path');

const isDevelopment = process.env.NODE_ENV !== 'production';
const WINDOW_ID = 'media-player-window';
const icon = path.join(__dirname, isDevelopment ? './public/images/dock.png' : './images/dock.png');

class MediaPlayerProcess {
  constructor() {
    this.window = null;
  }

  /**
   * 获取或创建媒体播放器窗口（单例）
   */
  create() {
    console.log('create Media Player Window');
    if (this.window && !this.window.isDestroyed()) {
      return this.window;
    }

    this.window = new BrowserWindow({
      title: 'Media Player',
      icon,
      show: true,
      frame: false,
      transparent: true,
      backgroundColor: '#000000',
      hasShadow: false,
      skipTaskbar: false,
      fullscreenable: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false,
        backgroundThrottling: false,
        additionalArguments: [`--window-id=${WINDOW_ID}`],
      },
    });

    this.window.maximize();
    this.window.loadFile(path.join(__dirname, isDevelopment ? './public/media.html' : './media.html'));

    this.window.on('closed', () => {
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
