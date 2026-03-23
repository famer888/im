import fs from "fs";
import tmp from "tmp";
import {
    app,
    BrowserWindow,
    dialog,
    globalShortcut,
    ipcMain,
    Menu,
    nativeImage as NativeImage,
    powerMonitor,
    powerSaveBlocker,
    protocol,
    screen,
    session,
    shell,
    Tray,
    clipboard,
    Notification,
} from "electron";
import Screenshots from "electron-screenshots";
import windowStateKeeper from "electron-window-state";
import i18n from "i18n";
import proto from "../marswrapper.node";
import pkg from "../package.json";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import nodePath from "path";
import { openFile } from "@/utils/server";
import { showNotification, closeNotification } from  "@/notification";
import { runMacStartupCleanup, watchUserDataRemoval, stopWatchUserData } from "@/utils/mac/uninstall-errors";
import { initToggleSideBar } from "@/utils/toggleSideBar";
import MediaProcess from "@/utils/media/MediaProcess";

const log = require('electron-log');
initElectronLog();

app.on("gpu-process-crashed", (event, kill) => {
    // console.warn("app:gpu-process-crashed", event, kill);
    reloadWindows("gpu-process-crashed", { killed: kill });
});

app.on("renderer-process-crashed", (event, webContents, kill) => {
    // console.warn("app:renderer-process-crashed", event, webContents, kill);
    reloadWindows("renderer-process-crashed", { killed: kill, url: (webContents && webContents.getURL) ? webContents.getURL() : '未知' });
});

app.on("render-process-gone", (event, webContents, details) => {
    // console.warn("app:render-process-gone", event, webContents, details);
    reloadWindows("render-process-gone", {
        reason: (details && details.reason) || '未知',
        exitCode: details && details.exitCode,
        url: (webContents && webContents.getURL) ? webContents.getURL() : '未知'
    });
});

app.on("child-process-gone", (event, details) => {
    // console.warn("app:child-process-gone", event, details);
    reloadWindows("child-process-gone", {
        reason: (details && details.reason) || '未知',
        exitCode: details && details.exitCode,
        type: (details && details.type) || '未知',
        serviceName: (details && details.serviceName) || '',
        name: (details && details.name) || ''
    });
});
// app.disableHardwareAcceleration()

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
    {
        scheme: "app",
        privileges: { secure: true, standard: true, bypassCSP: true },
    },
]);

// 监听主进程未捕获的同步异常
process.on('uncaughtException', (error) => {
  log.error('主进程未捕获异常：', error);
});

// 监听主进程未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  log.error('主进程未处理 Promise 拒绝：', { reason, promise });
});

// 主进程即将退出时触发（包括正常退出和崩溃退出）
app.on('will-quit', (event) => {
  // 可通过自定义标志区分是否为崩溃退出
  if (global.isCrashed) {
    log.error('主进程崩溃导致退出');
  } else {
    log.info('主进程正常退出');
  }
});

const isDevelopment = process.env.NODE_ENV !== "production";
const workingDir = isDevelopment ? `${__dirname}/public` : `${__dirname}`;
require("@electron/remote/main").initialize();

let Locales = {};
let windLoadList = [];
i18n.configure({
    locales: ["en", "ch"],
    directory: workingDir + "/locales",
    register: Locales,
});
Locales.setLocale("ch");

global.sharedObj = { proto: proto };

let mainWindow;
let LoginWindow;
let screenshots;
let tray;
let downloadFileMap = new Map();
let settings = {};
let isMainWindowFocusedWhenStartScreenshot = false;
let isOsx = process.platform === "darwin";
let isWin = !isOsx;
let baseIndex = 0;
let baseIndexList = [];
let userData = app.getPath("userData");
let imagesCacheDir = `${userData}/images`;
let voicesCacheDir = `${userData}/voices`;
let codeCacheDir = `${userData}/Code Cache`;
let mainWindowIsFocused = true;
let downTimers = {};
let powerBlockerId = null; // 电源阻止器ID

ipcMain.handle("get-user-data-path", () => {
    return userData;
});
ipcMain.handle("set-user-data-path", (e, path) => {
    if (path) {
        userData = path;
    }
});

ipcMain.handle("get-working-dir", () => {
    return workingDir;
});

// 标志：应用生命周期内是否已打开过崩溃文档
let crashDocOpened = false;

function reloadWindows(type, details = {}) {
    try {
        // 确保 userData 目录存在
        if (!fs.existsSync(userData)) {
            fs.mkdirSync(userData, { recursive: true });
        }

        // 写入崩溃文档
        const crashDocPath = nodePath.join(userData, 'CrashReports');
        if (!fs.existsSync(crashDocPath)) {
            fs.mkdirSync(crashDocPath, { recursive: true });
        }

        const timestamp = new Date();
        const dateStr = timestamp.toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const crashFilePath = nodePath.join(crashDocPath, `crash_${dateStr}.txt`);

        // 崩溃原因详情
        const crashReasons = {
            'gpu-process-crashed': 'GPU进程崩溃：显卡驱动异常或GPU资源耗尽，建议更新显卡驱动或降低图形设置',
            'renderer-process-crashed': '渲染进程崩溃：页面渲染时发生错误，可能由内存不足或代码异常引起',
            'render-process-gone': '渲染进程已终止：渲染进程意外退出，可能由系统资源不足或外部因素导致',
            'child-process-gone': '子进程已终止：子进程意外退出，可能由系统资源不足或进程被强制结束'
        };

        // 退出原因说明
        const reasonDescriptions = {
            'clean-exit': '正常退出',
            'abnormal-exit': '异常退出',
            'killed': '被系统终止',
            'crashed': '进程崩溃',
            'oom': '内存不足(OOM)',
            'launch-failed': '启动失败',
            'integrity-failure': '完整性校验失败'
        };

        // 构建详情信息
        let detailsText = '';
        if (details.killed !== undefined) {
            detailsText += `是否被强制终止: ${details.killed ? '是' : '否'}\n`;
        }
        if (details.reason) {
            detailsText += `退出原因: ${reasonDescriptions[details.reason] || details.reason}\n`;
        }
        if (details.exitCode !== undefined) {
            detailsText += `退出代码: ${details.exitCode}\n`;
        }
        if (details.type) {
            detailsText += `进程类型: ${details.type}\n`;
        }
        if (details.serviceName) {
            detailsText += `服务名称: ${details.serviceName}\n`;
        }
        if (details.name) {
            detailsText += `进程名称: ${details.name}\n`;
        }
        if (details.url) {
            detailsText += `页面URL: ${details.url}\n`;
        }

        const crashContent = `========================================
应用崩溃报告【请提供此报告给客服，以便技术排查问题】
========================================

崩溃时间: ${timestamp.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
崩溃类型: ${type}
崩溃原因: ${crashReasons[type] || '未知崩溃类型'}

----------------------------------------
详细信息
----------------------------------------
${detailsText || '无额外详情'}
----------------------------------------
系统信息
----------------------------------------
应用版本: ${pkg.version || '未知'}
Electron版本: ${process.versions.electron || '未知'}
Chrome版本: ${process.versions.chrome || '未知'}
Node版本: ${process.versions.node || '未知'}
操作系统: ${process.platform} ${process.arch}

----------------------------------------
处理措施
----------------------------------------
应用已自动重新加载窗口以恢复正常运行。

如果问题持续发生，请尝试以下操作：
1. 重启应用程序
2. 检查系统资源使用情况（内存、CPU）
3. 更新显卡驱动程序 ***重要***
4. 清理应用缓存数据
5. 联系技术支持并提供此报告

========================================
`;

        // 写入文件
        fs.writeFileSync(crashFilePath, crashContent, 'utf8');

        // 使用默认程序打开崩溃文档（应用生命周期内仅打开一次）
        if (!crashDocOpened) {
            crashDocOpened = true;
            shell.openPath(crashFilePath);
        }

        setTimeout(() => {
            mainWindow.reload();
            mainWindow.send("collapse", {
                type,
            });
        }, 1000);
    } catch (_) {
        console.log("---->", _);
    }
}

const icon = `${workingDir}/images/dock.png`;
let blink = null;
function getBaseData() {
    baseIndex = getBaseIndex();
    setBaseIndex(baseIndex + 1);
}

function buildCollapseDoc() {
    try {
        const dataPath = nodePath.join(userData, `CollapseDoc`);
        if (!fs.existsSync(dataPath)) {
            fs.mkdirSync(dataPath);
        }
        const filePath = nodePath.join(userData, `CollapseDoc/index.json`);
        let pathFlg = isFileExist(filePath);
        if (!pathFlg) {
            let data = {
                createTime: new Date().getTime(),
                msg: "初始化文件",
            };
            let params = [data];
            fs.writeFileSync(filePath, JSON.stringify(params), {
                encoding: "utf-8",
            });
        }
    } catch (error) {}
}

function setCollapseDoc(val) {
    try {
        const filePath = nodePath.join(userData, `CollapseDoc/index.json`);
        let pathFlg = isFileExist(filePath);
        if (!pathFlg) buildCollapseDoc();
        let file = fs.readFileSync(filePath, { encoding: "utf-8" });
        let list = JSON.parse(file);
        let nowTime = new Date().getTime();
        let bcTime = 1000 * 60 * 60 * 24 * 7;
        list = list.filter(
            (item) => item.createTime && nowTime - item.createTime < bcTime
        );
        list.push(val);
        fs.writeFileSync(filePath, JSON.stringify(list), { encoding: "utf-8" });
    } catch (error) {}
}

function setDQbaseData(value) {
    try {
        const dataPath = nodePath.join(userData, `dqDataIndex.json`);
        fs.writeFileSync(dataPath, JSON.stringify(value), {
            encoding: "utf-8",
        });
    } catch (error) {}
}

function setBaseIndex(value) {
    try {
        const dataPath = nodePath.join(userData, `baseDataIndex.json`);
        fs.writeFileSync(dataPath, JSON.stringify(value), {
            encoding: "utf-8",
        });
    } catch (error) {}
}

function getBaseIndex() {
    try {
        const dataPath = nodePath.join(userData, `baseDataIndex.json`);
        let dataPathFlg = isFileExist(dataPath);
        if (dataPathFlg) {
            return JSON.parse(fs.readFileSync(dataPath, { encoding: "utf-8" }));
        } else {
            return 1;
        }
    } catch (error) {}
}

getBaseData();

function isFileExist(path) {
    try {
        fs.accessSync(path, fs.F_OK);
    } catch (e) {
        return false;
    }
    return true;
}

function updateTray(unread = 0) {
    settings.showOnTray = true;
    // linux 系统不支持 tray
    if (process.platform === "linux") {
        return;
    }

    if (settings.showOnTray) {
        if (tray && updateTray.lastUnread === unread) {
            return;
        }

        const contextmenu = Menu.buildFromTemplate([
            {
                label: "打开ocs",
                click() {
                    mainWindow.show();
                },
            },
            {
                // type: 'separator'
                label: "设置",
                click() {
                    mainWindow.show();
                    mainWindow.send("someClick", {
                        type: "setting",
                    });
                },
            },
            {
                label: "注销",
                click() {
                    mainWindow.show();
                    mainWindow.send("someClick", {
                        type: "logout",
                    });
                },
            },
            {
                label: "退出程序并注销",
                selector: "terminate:",
                async click() {
                    mainWindow.send("eventLogout", {
                        type: "logout",
                        desc: "退出程序并注销",
                    });
                    proto.disconnect(0);
                    setTimeout(() => {
                        mainWindow = null;
                        app.exit(0);
                    }, 500);
                },
            },
        ]);

        const icon = `${workingDir}/images/${isOsx ? "tray" : "icon"}.png`;

        // Make sure the last tray has been destroyed
        setTimeout(() => {
            if (!tray) {
                // Init tray icon
                tray = new Tray(icon);
                if (process.platform === "linux") {
                    tray.setContextMenu(contextmenu);
                }

                tray.on("right-click", () => {
                    tray.popUpContextMenu(contextmenu);
                });

                tray.on("click", () => {
                    mainWindow && mainWindow.setSkipTaskbar(false);
                    updateTray(0);
                    mainWindow.show();
                });
                tray.setToolTip("【ocs 版本1.6.7】");
            }

            if (isOsx) {
                // tray.setTitle(unread > 0 ? ' ' + unread : '');
            }

            tray.setImage(icon);
            execBlink(unread > 0);
            // Avoid tray icon been recreate
            updateTray.lastUnread = unread;
        });
    } else {
        if (!tray) return;

        // if (!isOsx) {
        tray.destroy();
        // }
        tray = null;
    }
}

function createMenu() {
    const menu = Menu.buildFromTemplate([
        {
            label: "ocschat",
            submenu: [
                {
                    label: "打开ocs",
                    click() {
                        mainWindow.show();
                    },
                },
                {
                    // type: 'separator'
                    label: "设置",
                    click() {
                        mainWindow.show();
                        mainWindow.send("someClick", {
                            type: "setting",
                        });
                    },
                },
                {
                    label: "注销",
                    click() {
                        mainWindow.show();
                        mainWindow.send("someClick", {
                            type: "logout",
                        });
                    },
                },
                {
                    label: "退出程序并注销",
                    selector: "terminate:",
                    async click() {
                        mainWindow.send("eventLogout", {
                            type: "logout",
                            desc: "退出程序并注销",
                        });
                        proto.disconnect(0);
                        setTimeout(() => {
                            mainWindow = null;
                            app.exit(0);
                        }, 500);
                    },
                },
            ],
        },
        {
            label: Locales.__("Edit").Title,
            submenu: [
                {
                    role: "undo",
                    label: Locales.__("Edit").Undo,
                },
                {
                    role: "redo",
                    label: Locales.__("Edit").Redo,
                },
                {
                    type: "separator",
                },
                {
                    role: "cut",
                    label: Locales.__("Edit").Cut,
                },
                {
                    role: "copy",
                    label: Locales.__("Edit").Copy,
                },
                {
                    role: "paste",
                    label: Locales.__("Edit").Paste,
                },
                {
                    role: "删除",
                    label: Locales.__("Edit").Delete,
                },
                {
                    role: "selectall",
                    label: Locales.__("Edit").SelectAll,
                },
            ],
        },
        {
            lable: Locales.__("Help").Title,
            role: "help",
            submenu: [
                {
                    role: "reload",
                    label: Locales.__("Help").Reload,
                },
                {
                    role: "forcereload",
                    label: Locales.__("Help").ForceReload,
                },
            ],
        },
    ]);

    if (isOsx) {
        Menu.setApplicationMenu(menu);
    } else {
        mainWindow.setMenu(null);
    }
}

function regShortcut() {
    // if(isWin) {
    // globalShortcut.register("CommandOrControl+G", () => {
    //     mainWindow.webContents.toggleDevTools();
    // });
    // }
}
// 打开下载框
const openFileDialog = async (event, args) => {
    if (mainWindow) {
        try {
            const {
                fileName,
                fileUrl,
                trendsFileUrl,
                windowId,
                local,
                chatType,
            } = args;
            const url = trendsFileUrl || fileUrl;

            const oldpath =
                chatType === 1
                    ? local || app.getPath("downloads") + "/" + fileName
                    : app.getPath("downloads") + "/" + fileName;
            const { canceled, filePath } = await dialog.showSaveDialog(
                mainWindow,
                {
                    title: "选择保存位置",
                    properties: ["openDirectory", "createDirectory"],
                    defaultPath: oldpath,
                }
            );

            if (!canceled) {
                downloadFileMap.set(encodeURI(url), {
                    ...args,
                    fileLocalPath: filePath,
                });

                const windows = BrowserWindow.getAllWindows();
                windows.forEach((w) => {
                    if (w.getMediaSourceId() === windowId) {
                        w.webContents.downloadURL(url);
                    }
                });
            }
        } catch (error) {
            //
        }
    }
};

const selectDir = async (fileName) => {
    let oldpath = app.getPath("downloads");
    if (!mainWindow) return oldpath;
    oldpath = nodePath.join(oldpath, `/${fileName}`);
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: "选择保存位置",
        properties: ["openDirectory", "createDirectory"],
        defaultPath: oldpath,
    });
    let sureFilePath = !canceled ? filePath : oldpath;
    return { canceled, sureFilePath };
};

const outFile = async (e, args) => {
    const { fileName } = args;
    const { canceled, sureFilePath } = await selectDir(fileName);
    mainWindow.webContents.send("file-out-download", {
        filePath: sureFilePath,
        key: args.key,
        canceled,
    });
};

ipcMain.on("select-dir", async (e, args) => {
    const { fileName } = args;
    const { canceled, sureFilePath } = await selectDir(fileName);
    mainWindow.webContents.send("select-dir-callback", {
        filePath: sureFilePath,
        key: args.key,
        canceled,
    });
});

ipcMain.on("auto-export-db", async (e, args) => {
    await autoExportDb();
    mainWindow.webContents.send("cache-db-success", args);
});

ipcMain.on("open-dev-tools", (event) => {
    mainWindow.openDevTools();
});

const autoExportDb = () => {
    return new Promise((resolve) => {
        ipcMain.on("cache-success", (e, args) => {
            resolve();
        });
        ipcMain.on("cache-no-login", (e, args) => {
            resolve();
        });
        mainWindow.webContents.send("cache-db", {});
        setTimeout(() => {
            resolve();
        }, 2000);
    });
};

// 下载暂停/继续
const downloadStatusCheck = (event, args) => {
    let index = windLoadList.findIndex(
        (item) => item.messageId === args.messageId
    );
    if (index < 0) return;
    let data = windLoadList[index];
    if (args.delFlg) {
        data.item.pause();
        windLoadList.splice(index, 1);
        return;
    }
    data.item.isPaused() ? data.item.resume() : data.item.pause();
};

const clearDownTimer = (timerName) => {
    if(!timerName) return;
    const timer = downTimers[timerName];
    if(timer) {
        clearTimeout(timer);
        downTimers[timerName] = null;
    }
}

/**
 * 下载处理
 */
const downloadHandler = (event, item, webContents) => {
   let data = {};
   let timerName = "";
    try {
         data = downloadFileMap.get(item.getURL());

        if (!data) {
            let defalutPath = nodePath.join(userData, `/Local Storage/bad`);
            item.setSavePath(defalutPath);
            return;
        }
        timerName = `${data.groupId || data.channelId || data.userId }_${data.msgId}`
        item.setSavePath(data.fileLocalPath);
        // 只有传入 taskId 时才监听下载进度
        if (data.taskId) {
            const fileSize = data.fileSize || item.getTotalBytes();
            item.on("updated", (event, state) => {
                if (state === "progressing") {
                    const receivedBytes = item.getReceivedBytes();
                    const totalBytes = fileSize || item.getTotalBytes();
                    let percent = 0;
                    if (totalBytes > 0) {
                        percent = Math.round((receivedBytes / totalBytes) * 100);
                        percent = percent === 100 ? 95 : percent;
                    }
                    // 发送下载进度，携带 taskId 守卫
                    sendMain("downloadProgress", {
                        ...data,
                        taskId: data.taskId,
                        percent,
                        receivedBytes,
                        totalBytes,
                    });
                }
            });
        }

        item.once("done", (event, state) => {
           clearDownTimer(timerName)
            sendMain(
                state === "completed"
                    ? "downloadFileDone"
                    : "downloadFileFailed",
                data
            );
            downloadFileMap.delete(item.getURL());
        });
    } catch (error) {
        console.log("downloadHandler-error-", error);
        clearDownTimer(timerName)
        sendMain( "downloadFileFailed", data);
    }
};


/**
 * 安全地从主进程向渲染进程发送 IPC 消息
 * @param {string} channel - 消息通道名称
 * @param {any} data - 要发送的数据（可选）
 * @param {BrowserWindow|null} targetWindow - 目标窗口实例。如果为 null，则尝试发送给 mainWindow 或第一个可用窗口。
 */
const sendMain = (channel, data, targetWindow = null) => {
  let win;

  // 优先使用传入的目标窗口
  if (targetWindow && targetWindow instanceof BrowserWindow && !targetWindow.isDestroyed()) {
    win = targetWindow;
  }
  // 否则，尝试使用 mainWindow
  else if (mainWindow && !mainWindow.isDestroyed()) {
    win = mainWindow;
  }
  // 最后，尝试获取第一个可用的窗口
  else {
    const allWindows = BrowserWindow.getAllWindows();
    win = allWindows.find(w => !w.isDestroyed());
  }

  // 检查窗口是否有效
  if (win && win.webContents && !win.webContents.isDestroyed()) {
    try {
      win.webContents.send(channel, data);
      // console.log(`[sendMain] 成功向窗口发送消息: ${channel}`);
      return true;
    } catch (error) {
      console.error(`[sendMain] 发送消息 ${channel} 时发生错误:`, error);
      return false;
    }
  } else {
    console.warn(`[sendMain] 无法发送消息 ${channel}: 没有找到有效的窗口或 webContents。`);
    return false;
  }
};

// {query, userId}
const setMainWin = async () => {
    let mainWindowState = windowStateKeeper({
        defaultWidth: 600,
        defaultHeight: 500,
    });

    let webPreferences = {
        scrollBounce: false,
        nodeIntegration: true,
        contextIsolation: false,
        nativeWindowOpen: true,
        webSecurity: false,
        nodeIntegrationInWorker: true,
        webviewTag: true,
        allowRunningInsecureContent: true,
        backgroundThrottling: false, // 禁用渲染器节流，即使窗口在后台也保持正常运行
        // session: ses,
        // partition,
        // 如果想打包之后的版本，不能打开调试控制台，请取消下面的注释
        // devTools: !app.isPackaged,
    };

    registerLocalResourceProtocol();

    if (!process.env.WEBPACK_DEV_SERVER_URL) {
        createProtocol("app");
    }

    // MediaProcess.create();

    mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: 600,
        height: 500,
        minWidth: 600,
        minHeight: 500,
        opacity: 0,
        titleBarStyle: "hidden",
        maximizable: true,
        resizable: true,
        backgroundColor: "none",
        // 以下两属性设置时会导致win不能正常unmaximize. electron bug
        // transparent: true,
        // resizable: false,
        webPreferences,
        frame: !isWin,
        icon,
    });

    if (isWin) mainWindow.setMenu(null);
    mainWindow.center();
    if (process.env.WEBPACK_DEV_SERVER_URL) {
        await mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
        // mainWindow.openDevTools({ mode: 'detach' });
    } else {
        mainWindow.loadURL("app://./index.html", {
            extraHeaders: "Access-Control-Allow-Origin: *",
        });
    }
    require("@electron/remote/main").enable(mainWindow.webContents);
    mainWindow.webContents.on("did-finish-load", async (e) => {
        try {
            const win = mainWindow || (BrowserWindow.getAllWindows() || [])[0];
            win && win.show();
            win && win.focus();
            await new Promise(resolve => setTimeout(resolve, 1000 / 60));
            win && win.setOpacity(1);
        } catch (ex) {
            // do nothing
        }
    });
    mainWindow.webContents.on("did-fail-load", (e) => {
        if (process.env.NODE_ENV === "production") {
            e &&
                setCollapseDoc({
                    errorInfo: e,
                    msg: "系统报错：加载失败",
                    createTime: new Date().getTime(),
                });
        }
        setTimeout(() => {
            mainWindow.reload();
            mainWindow.send("collapse", {
                type: "did-fail-load",
            });
        }, 2000);
    });
    // 系统崩溃
    mainWindow.webContents.on("crashed", (e) => {
        e &&
            setCollapseDoc({
                errorInfo: e,
                msg: "系统报错：渲染器进程崩溃",
                createTime: new Date().getTime(),
            });
    });
    mainWindow.webContents.on("new-window", (event, url) => {
        event.preventDefault();
        shell.openExternal(url);
    });

    mainWindow.on("close", (e) => {
        if (!isWin && mainWindow.isMinimized()) {
            mainWindow = null;
            disconnectAndQuit();
        } else {
            e.preventDefault();
            mainWindow.minimize();
            mainWindow.setSkipTaskbar(true);
        }
    });

    mainWindow.on("minimize", function (event) {
        mainWindow && mainWindow.send("visibilitychange", false);
    });
    mainWindow.on("focus", function (event) {
        mainWindowIsFocused = true;
        mainWindow && mainWindow.send("visibilitychange", true);
    });
    mainWindow.on("blur", function (event) {
        mainWindowIsFocused = false;
        mainWindow && mainWindow.send("visibilitychange", false);
    });

    // 初始化 toggleSideBar 相关功能
    initToggleSideBar(mainWindow);

    // 下载完成处理
    mainWindow.webContents.session.on("will-download", downloadHandler);

    // 以下ipcMain.on为新增内容
    ipcMain.on("changeWindow", (event, args) => {
        try {
            if (!mainWindow || !mainWindow.setSize) return;
            mainWindow.resizable = args && args.resize == 1 ? false : true;
            mainWindow.maximizable = true;
            mainWindow.minimizable = true;
            mainWindow.setMinimumSize(args.minWidth, args.height);
            mainWindow.setSize(args.width, args.height);
            mainWindowState.manage(mainWindow);
        } catch (error) {
            error &&
                setCollapseDoc({
                    errorInfo: error,
                    msg: "系统报错：changeWindow失败",
                    createTime: new Date().getTime(),
                });
        }
    });

    powerMonitor.on("resume", () => {
        mainWindow &&
            mainWindow.webContents &&
            mainWindow.webContents.send("os-resume");
        LoginWindow &&
            LoginWindow.webContents &&
            LoginWindow.webContents.send("os-resume");
        global.sharedObj.proto.onAppResume();
    });

    mainWindow.webContents.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/603.3.8 (KHTML, like Gecko) Version/10.1.2 Safari/603.3." +
            parseInt(Math.random() * 10)
    );

    ipcMain.on("messageblur", function () {
        if (mainWindow && mainWindow.isFocused && !mainWindow.isFocused()) {
            // mainWindow.showInactive();
            mainWindow.flashFrame(true);
        }
        if (LoginWindow && LoginWindow.isFocused && !LoginWindow.isFocused()) {
            // mainWindow.showInactive();
            LoginWindow.flashFrame(true);
        }
    });
};

/**
 * 文件下载
 */
const handleFileDownload = (args) => {
    const {
        uid,
        groupId,
        userId,
        channelId,
        chatType,
        fileName,
        fileUrl,
        trendsFileUrl,
        windowId,
        local,
        isOpen,
        msgId,
        timeout, // 超时时长毫秒
    } = args;
    const url = trendsFileUrl || fileUrl;


    // 处理下载超时
    if(timeout) {
        const timerName = `${groupId || channelId || userId }_${msgId}`
        downTimers[timerName] = setTimeout(() => {
            sendMain(
                "downloadFileFailed",
                args,
            );
        }, timeout)
    }

    const getRandomFileName = (chatType) => {
        let name = Date.now();
        if (chatType == 1) {
            name = name + ".png";
        } else if (chatType == 3) {
            name = name + ".mp4";
        } else if (chatType == 9) {
            name = name + ".gif";
        } else {
            name = null;
        }
        return name;
    };

    // 文件夹路径
    const dirPath = nodePath.join(
        userData,
        `/Local Storage/${uid}/${
            groupId ? "group-" + groupId
                    : channelId ?  "channel-" + channelId : "user-" + userId
        }/${msgId}/`
    );

    // 设置名称
    const name = fileName || getRandomFileName(chatType);

    // 设置本地文件地址
    const fileLocalPath = local || nodePath.join(dirPath, name);

    // 设置数据 下载成功后获取
    downloadFileMap.set(encodeURI(url), {
        ...args,
        fileLocalPath,
        isOpen,
    });

    const windows = BrowserWindow.getAllWindows();
    windows[0].webContents.downloadURL(url);

    // console.log(fileUrl)
};

const preValidateLoalFile = (dataPath, data) => {
  try {
    JSON.parse(data);
    return data;
  } catch (error) {
    // 解析失败，写入空文件覆盖损坏的文件
    // 先检查目录是否存在，不存在则创建
    const dirPath = (nodePath || '').dirname(dataPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(dataPath, "", { encoding: "utf-8" });
    return "";
  }
}

const getLocalFile = async (args) => {
    try {
        let { key, value } = args;
        const dataPath = nodePath.join(userData, `/Code Cache/${key}.json`);
        if (value) {
            fs.writeFileSync(dataPath, JSON.stringify(value), {
                encoding: "utf-8",
            });
        } else {
            var bExistsSync = isFileExist(dataPath);
            if (bExistsSync) {
                if (value === null) {
                    return fs.unlink(dataPath, function (err) {
                        if (err) {
                            console.log(err, "===----====");
                        }
                    });
                }
                const data = await fs.readFileSync(dataPath, {
                    encoding: "utf-8",
                });
                return preValidateLoalFile(dataPath, data);
            } else {
                fs.writeFileSync(dataPath, "", { encoding: "utf-8" });
                return "";
            }
        }
    } catch (error) {
        // 发送错误到渲染进程 console
        // 只发送可序列化的数据，args.value 可能包含不可序列化的内容
        sendMain("main-error-log", {
            type: "getLocalFile",
            message: (error && error.message) || String(error),
            stack: (error && error.stack) || "",
            key: (args && args.key) || ""
        }, mainWindow);
    }
};

const createMainWindow = async () => {
    setMainWin();

    ipcMain.on("hide-window", () => {
        mainWindow && mainWindow.setSkipTaskbar(true);
    });
    ipcMain.on("loginShow", () => {
        LoginWindow.show();
        mainWindow && mainWindow.destroy && mainWindow.destroy();
    });
    ipcMain.on("mainShow", (e, args) => {
        LoginWindow.hide();
        setMainWin(args);
    });
    ipcMain.on("mainWindowFocus", () => {
        mainWindow && mainWindow.focus();
    });
    ipcMain.on("downloadStatusCheck", downloadStatusCheck);
    ipcMain.handle("openFileDialog", openFileDialog);
    ipcMain.handle("outFile", outFile);

    ipcMain.on("whiteErrorDoc", (e, args) => {
        setCollapseDoc(args);
    });

    ipcMain.on("checkAutoOpen", (e, args) => {
        let { status } = args;
        if (!app.isPackaged) {
            app.setLoginItemSettings({
                openAtLogin: status,
                path: process.execPath,
            });
        } else {
            app.setLoginItemSettings({
                openAtLogin: status,
            });
        }
    });

    ipcMain.handle("getLocalFile", async (e, args) => {
        return await getLocalFile(args);
    });

    ipcMain.on("updateTray", (event, args) => {
        updateTray(args.nums);
    });

    ipcMain.on("file-paste", (event) => {
        let args = { hasImage: false };

        if (process.platform === "linux") {
            event.returnValue = args;
            return;
        }

        try {
            const clipboardEx = require("electron-clipboard-ex");
            // only support windows and mac
            if (clipboardEx) {
                const filePaths = clipboardEx.readFilePaths();
                if (filePaths && filePaths.length > 0) {
                    args = {
                        files: [],
                    };
                    filePaths.forEach((path) => {
                        let stat = fs.statSync(path);
                        if (stat.isFile()) {
                            args.files.push({
                                path: path,
                                name: nodePath.basename(path),
                                size: stat.size,
                            });
                        }
                    });
                }
            }
        } catch (error) {
            console.log(error)
        }


        args.hasFile = args.files && args.files.length > 0;

        if (!args.hasFile) {
            let image = clipboard.readImage();
            if (!image.isEmpty()) {
                let filename = tmp.tmpNameSync() + ".png";

                args = {
                    hasImage: true,
                    filename: filename,
                    raw: image.toPNG(),
                };

                fs.writeFileSync(filename, image.toPNG());
            }
        }
        event.returnValue = args;
    });

    // 监听 文件/文件夹 打开
    ipcMain.on("fileFoldersOpen", (event, args) => {
        const { local, isDir, fileUrl, chatType } = args;

        if (local) {
            fs.stat(local, (err) => {
                // 文件不存在 下载文件
                if (err) {
                    // 下载文件
                    handleFileDownload({ ...args, isOpen: true });
                    return;
                }
                sendMain("downloadProgress", {
                  taskId: args.taskId,
                  percent: 100 + Math.random().toFixed(6),
                });
                // 图片/视频用媒体播放器打开（数据已通过 localStorage 传递）
                if (!isDir && [1, 3, 9].includes(chatType)) {
                    MediaProcess.create();
                    MediaProcess.show();
                } else {
                    openFile(local, isDir);
                }
            });
        } else if (fileUrl) {
            // 下载文件
            handleFileDownload({ ...args, isOpen: true });
        }
    });

    // 监听 文件下载
    ipcMain.on("fileDownload", (event, args) => {
        // 下载文件
        handleFileDownload(args);
    });

    // 监听 通知显示
    // ipcMain.on("alertNotification", (event, args) => {
    //     const { windowId, content, icon, name } = args;

    //     const win = BrowserWindow.getAllWindows()[0];

    //     // console.log(`is: ${win.isMinimized()}, alertNotification -----> 939`, args);

    //     const notification = new Notification({
    //         title: name,
    //         body: content,
    //         icon: icon,
    //     });
    //     // 只有窗口缩小了才会提示信息通知
    //     if (win.isMinimized()) {
    //         notification.show();
    //     }
    //     // 监听通知点击事件
    //     /**
    //              * notification.on('click') 事件来响应通知的点击。当点击通知时：
    //                 通过 mainWindow.restore() 恢复最小化的窗口。
    //                 通过 mainWindow.show() 显示窗口（如果它被隐藏）。
    //                 调用 mainWindow.focus() 确保窗口在前台
    //              * **/
    //     notification.on("click", () => {
    //         if (win.isMinimized()) win.restore();
    //         if (!win.isVisible()) win.show();
    //         win.focus();
    //         win.webContents.send("notification-clicked", args);
    //         console.log("点击了通知组件 ---------------> background 957");
    //     });
    // });

      // 监听 通知显示
    ipcMain.on("alertNotification", (event, args) => {
        // console.log('alertNotification-1-', mainWindow.isMinimized(), !mainWindowIsFocused)
        if (
            mainWindow.isMinimized()
            // || !mainWindowIsFocused
        ) {
                  console.log('alertNotification-2-')
           showNotification(mainWindow, args)
        }
    });

    // 监听 通知显示
    ipcMain.on("notificationClose", (event, args) => {
        closeNotification(args)
    });

    powerMonitor.on("suspend", () => {
        global.sharedObj.proto.onAppSuspend();
    });

    [imagesCacheDir, voicesCacheDir, codeCacheDir].map((e) => {
        if (!fs.existsSync(e)) {
            fs.mkdirSync(e);
        }
    });

    createMenu();
    regShortcut();
};

// deep link，需要和 vue.config.js 里面的 wf-deep-linking 对应上
const DEEP_LINK_PROTOCOL = "xpy";

function onDeepLink(url) {
    console.log("onOpenDeepLink", url);
    mainWindow.webContents.send("deep-link", url);
}

// app.setAsDefaultProtocolClient(DEEP_LINK_PROTOCOL);
// pls refer to: https://blog.csdn.net/youyudexiaowangzi/article/details/118676790
// windows 7 下面，如果启动黑屏，请将下面注释打开
app.disableHardwareAcceleration();
app.on("open-url", (event, url) => {
    onDeepLink(url);
});

app.setName(pkg.name);
app.dock && app.dock.setIcon(icon);


// 监听来自渲染进程的日志事件
function watchRenderLog() {
    if(!isDevelopment) {
        ipcMain.on("renderer-log", (event, level, message, meta) => {
            // 在主进程中记录日志
            if (meta) {
                log[level](message, meta);
            } else {
                log[level](message);
            }
        });
    }
}

function initElectronLog() {
    log.transports.console.level = false;
    log.transports.file.sync = false; //启用异步写入
    log.transports.file.maxSize = 10 * 1024 * 1024; // 10MB
    log.transports.file.maxFiles = 5;
}

if (!app.requestSingleInstanceLock()) {
    console.log("获取到没有呢", baseIndex);
    userData = nodePath.join(userData, `/DATA_${baseIndex}/`);
    app.setPath("userData", userData);
    buildCollapseDoc();
} else {
    console.log("这里是设置");
    setBaseIndex(1);

    getLocalFile({
        key: "source-id-list",
        value: [],
    });
}

app.on("second-instance", (event, argv) => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
        mainWindow.show();
    }
    let url = argv.find((arg) => arg.startsWith(DEEP_LINK_PROTOCOL));
    if (url) {
        onDeepLink(url);
    }
});

// windows上，需要正确设置appUserModelId，才能正常显示通知，不然通知的应用标识会显示为：electron.app.xxx
app.on("will-finish-launching", (e) => {
    app.setAppUserModelId("ocs-new");
    // e && setCollapseDoc({errorInfo: e, msg: '系统报错：加载失败', createTime: new Date().getTime()})
});

function registerLocalResourceProtocol(ses) {
    let fun = protocol;
    if (ses) fun = ses.protocol;
    fun.registerFileProtocol("local-resource", (request, callback) => {
        const url = request.url.replace(/^local-resource:\/\//, "");
        const decodedUrl = decodeURI(url);
        try {
            return callback(decodedUrl);
        } catch (error) {
            console.error(
                "ERROR: registerLocalResourceProtocol: Could not get file path:",
                error
            );
        }
    });
}
app.on("ready", () => {
    // [macOS] 启动前清理可能残留的 IndexedDB 锁文件
    runMacStartupCleanup();

    createMainWindow();

    // 启用电源阻止器，防止系统进入睡眠状态
    // 'prevent-app-suspension' - 阻止应用挂起，保持CPU运行
    // 'prevent-display-sleep' - 阻止显示器睡眠
    powerBlockerId = powerSaveBlocker.start('prevent-app-suspension');
    watchRenderLog();
    log.info('应用启动');

    screenshots = new Screenshots();
    globalShortcut.register("ctrl+shift+a", () => {
        isMainWindowFocusedWhenStartScreenshot = mainWindow.isFocused();
        screenshots.startCapture();
    });
    // 调试用，主要用于处理 windows 不能打开子窗口的控制台
    // 打开所有窗口控制台
    globalShortcut.register("ctrl+shift+i", () => {
        let windows = BrowserWindow.getAllWindows();
        windows.forEach((win) => win.openDevTools());
    });

    // 点击确定按钮回调事件
    screenshots.on("ok", (e, data) => {
        if (isMainWindowFocusedWhenStartScreenshot) {
            let filename = tmp.tmpNameSync() + ".png";
            let image = NativeImage.createFromDataURL(data.dataURL);
            fs.writeFileSync(filename, image.toPNG());

            mainWindow.webContents.send("screenshots-ok", {
                filePath: filename,
            });
        }
        console.log("capture");
    });

    // 点击保存按钮回调事件
    screenshots.on("save", (e, { viewer }) => {
        console.log("capture", viewer);
    });
    session.defaultSession.webRequest.onBeforeSendHeaders(
        (details, callback) => {
            // 可根据实际需求，配置 Origin，默认置为空
            // details.requestHeaders.Origin = '';
            callback({ cancel: false, requestHeaders: details.requestHeaders });
        }
    );
    try {
        updateTray();
    } catch (e) {
        // do nothing
    }
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("before-quit", async (event) => {
    const data = await getLocalFile({ key: "source-id-list" });
    if (data) {
        const windows = BrowserWindow.getAllWindows();
        await getLocalFile({
            key: "source-id-list",
            value: JSON.parse(data).filter(
                (id) => id !== windows[0].getMediaSourceId()
            ),
        });
    }

    // 停止电源阻止器
    if (powerBlockerId !== null && powerSaveBlocker.isStarted(powerBlockerId)) {
        powerSaveBlocker.stop(powerBlockerId);
    }

    // [macOS] 停止 userData 目录监听
    stopWatchUserData();

    // Fix issues #14
    baseIndexList[baseIndex] = 0;

    setDQbaseData(baseIndexList);
    if (!tray) return;
    // if (!isOsx) {
    tray.destroy();
    tray = null;
    // }
});
app.on("activate", () => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
        mainWindow.show();
    }
});

function disconnectAndQuit() {
    global.sharedObj.proto.setConnectionStatusListener(() => {
        // 仅仅是为了让渲染进程不收到 ConnectionStatusLogout
        // do nothing
    });
    global.sharedObj.proto.disconnect(0);
    setTimeout(() => {
        app.quit();
    }, 1000);
}

function clearBlink() {
    if (blink) {
        clearInterval(blink);
    }
    blink = null;
}

function execBlink(flag, _interval) {
    let interval = _interval ? _interval : 500;
    let icons;
    if (!isWin) {
        icons = [
            `${workingDir}/images/tray.png`,
            `${workingDir}/images/Remind_icon.png`,
        ];
    } else {
        icons = [
            `${workingDir}/images/tray@2x.png`,
            `${workingDir}/images/Remind_icon.png`,
        ];
    }

    let count = 0;
    if (flag) {
        if (blink) {
            return;
        }
        blink = setInterval(function () {
            toggleTrayIcon(icons[count++]);
            count = count > 1 ? 0 : 1;
        }, interval);
    } else {
        clearBlink();
        toggleTrayIcon(icons[0]);
    }
}

function toggleTrayIcon(icon) {
    if (tray) {
        tray.setImage(icon);
    }
}

// 监听软件卸载，关闭应用
if (isOsx) {
    // macOS: 使用 fs.watch 避免文件锁定问题
    watchUserDataRemoval(() => {
        app.quit();
    });
} else {
    // Windows: 保持原有的 setInterval 轮询
    setInterval(() => {
        if (!fs.existsSync(userData)) {
            app.quit();
        }
    }, 5000);
}
