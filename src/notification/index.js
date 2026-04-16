// 多进程窗口
const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require('electron');
const path = require('path');

let noticeWindow = null;
let mainWindow = null;
const noticeItemConfig = {
  width: 278,
  height: 64,
  spacing: 10,
  hideAllHeight: 30
}
const noticeConfig = {
  marginRight: 10,
  marginBottom: 10,
}
let listData =[
  // { avatar: 'https://xpz-xire86.oss-cn-hongkong.aliyuncs.com/test/common/pic/202411/18/de21a07e82122c47fa12c88ba13e2090.jpg', nickname: 'User1', textContent: 'This is the first text.' },
  // { avatar: 'https://xpz-xire86.oss-cn-hongkong.aliyuncs.com/test/common/pic/202411/18/de21a07e82122c47fa12c88ba13e2090.jpg', nickname: 'User2', textContent: 'This is the second text.' },
  // 添加更多项...
];
const isDevelopment = process.env.NODE_ENV !== "production";


export const createNoticeWindow = async (mainWindow) => {
  return new Promise (resolve => {
    const workArea = screen.getPrimaryDisplay().workAreaSize;
    const { width, height } = noticeItemConfig;
    const { marginRight, marginBottom} = noticeItemConfig;
    // 创建新的浏览器窗口
    let childWindow = new BrowserWindow({
      width,
      height,
      x: workArea.width - width - marginRight,
      y: workArea.height - height + marginBottom,
      // backgroundColor: 'transparent',
      // parent: mainWindow,
      transparent: true,
      frame: false,
      webPreferences: {
        scrollBounce: false,
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, isDevelopment ? './public/notification-preload.js' : './notification-preload.js'),
        nativeWindowOpen: true,
        webSecurity: true,
      }
    });
    // 隐藏子窗口在任务栏上的显示
    childWindow.setSkipTaskbar(true);
    childWindow.loadFile(path.join(__dirname, isDevelopment? './public/notification.html': './notification.html'));
    childWindow.setAlwaysOnTop(true);
    // 监听窗口关闭事件
    childWindow.on('closed', () => {
      // 清理引用
      // childWindow = null;
    });

    globalShortcut.register("ctrl+shift+j", () => {
       childWindow.openDevTools();
    });

    resolve(childWindow)
  })
}

const updateShowLocation = (boxH) => {
  if(!noticeWindow) return;
  const { width, height, spacing, hideAllHeight} = noticeItemConfig;
  const { marginRight, marginBottom } = noticeConfig;
  let boxHeight = boxH || height;
  noticeWindow.setContentSize(width, boxHeight);
  // 计算窗口右下角的位置
  const workArea = screen.getPrimaryDisplay().workAreaSize;
  const newX = workArea.width - width - marginRight;
  const newY = workArea.height - boxHeight - marginBottom;
  noticeWindow.setPosition(newX, newY);
}

export const showNotification = async (mainWin, data) => {
  mainWindow = mainWin;
  if(data) {
    const oldIndex = listData.findIndex(item => item.id === data.id);
    if(oldIndex !== -1) {
      listData.splice(oldIndex, 1);
    }
    listData.push(data);
  }
  const prams = listData.slice(-3)
  if(!noticeWindow) {
    noticeWindow = await createNoticeWindow();
    setTimeout(() => {
      updateShowLocation(noticeItemConfig.height)
      sendNoticeWin('showList', prams);
    }, 1000);
  } else {
    sendNoticeWin('showList', prams);
  }

  mainWindow.on("focus", function (event) {
    if (mainWindow.isFocused()) {
      closeNotice()
    }
  });
}

const sendNoticeWin = (name, data) => {
  if(noticeWindow && !noticeWindow.isDestroyed()) {
    try {
    noticeWindow.send(name, data)
    } catch (error) {
      noticeWindow.webContents.send(name, data)
    }
  }
}

ipcMain.on('noticeCloseItem', (e, item) => {
  closeNotification(item)
});

export const closeNotification = (item) => {
  const { id } = item || {};
  if(!id) return;
  listData = listData.filter(item => item.id !== id);
  if(!listData.length) {
    closeNotice()
  }
}

ipcMain.on('hidAll', (e) => {
  closeNotice()
});

ipcMain.on('noticePageHeightChange', (e, opts) => {
  const { height } = opts;
  updateShowLocation(height)
});
ipcMain.on('notificationReply', (e, opts) => {
  const win = mainWindow;
  win.webContents.send("notificationReply", opts);
});

ipcMain.on('noticeGoChat', (e, item) => {
  const win = mainWindow;
  if (win.isMinimized()) win.restore();
  if (!win.isVisible()) win.show();
  win.focus();
  win.webContents.send("notification-clicked", item);
});


function  closeNotice() {
  listData = [];
  if(noticeWindow) noticeWindow.close();
  noticeWindow= null;
}
