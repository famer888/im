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
    protocol,
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

app.on("gpu-process-crashed", (event, kill) => {
    // console.warn("app:gpu-process-crashed", event, kill);
    reloadWindows("gpu-process-crashed");
});

app.on("renderer-process-crashed", (event, webContents, kill) => {
    // console.warn("app:renderer-process-crashed", event, webContents, kill);
    reloadWindows("renderer-process-crashed");
});

app.on("render-process-gone", (event, webContents, details) => {
    // console.warn("app:render-process-gone", event, webContents, details);
    reloadWindows("render-process-gone");
});

app.on("child-process-gone", (event, details) => {
    // console.warn("app:child-process-gone", event, details);
    reloadWindows("child-process-gone");
});
// app.disableHardwareAcceleration()

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
    {
        scheme: "app",
        privileges: { secure: true, standard: true, bypassCSP: true },
    },
]);

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
let mainWindowIsFocused = true;

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

function reloadWindows(type) {
    try {
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
                tray.setToolTip("【ocs 版本1.6.6】");
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

/**
 * 下载处理
 */
const downloadHandler = (event, item, webContents) => {
    try {
        const data = downloadFileMap.get(item.getURL());

        if (!data) {
            let defalutPath = nodePath.join(userData, `/Local Storage/bad`);
            item.setSavePath(defalutPath);
            return;
        }
        item.setSavePath(data.fileLocalPath);
        item.once("done", (event, state) => {
            mainWindow.send(
                state === "completed"
                    ? "downloadFileDone"
                    : "downloadFileFailed",
                data
            );
            downloadFileMap.delete(item.getURL());
        });
    } catch (error) {
        console.log("downloadHandler-error-", error);
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
        // session: ses,
        // partition,
        // 如果想打包之后的版本，不能打开调试控制台，请取消下面的注释
        // devTools: !app.isPackaged,
    };

    registerLocalResourceProtocol();

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
        // mainWindow.openDevTools();
    } else {
        createProtocol("app");
        mainWindow.loadURL("app:// ./index.html", {
            extraHeaders: "Access-Control-Allow-Origin: *",
        });
    }
    require("@electron/remote/main").enable(mainWindow.webContents);
    mainWindow.webContents.on("did-finish-load", (e) => {
        try {
            mainWindow.show();
            mainWindow.focus();
            setTimeout(() => mainWindow.setOpacity(1), 1000 / 60);
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
    } = args;
    const url = trendsFileUrl || fileUrl;

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
                return await fs.readFileSync(dataPath, {
                    encoding: "utf-8",
                });
            } else {
                fs.writeFileSync(dataPath, "", { encoding: "utf-8" });
                return "";
            }
        }
    } catch (error) {}
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
        const { local, isDir, fileUrl } = args;

        if (local) {
            fs.stat(local, (err) => {
                // 文件不存在 下载文件
                if (err) {
                    // 下载文件
                    handleFileDownload({ ...args, isOpen: true });
                    return;
                }

                // 文件存在，并且是要打开文件
                openFile(local, isDir);
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
        console.log('alertNotification-1-', mainWindow.isMinimized(), !mainWindowIsFocused)
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

    [imagesCacheDir, voicesCacheDir].map((e) => {
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

setTimeout(() => {
    console.log(BrowserWindow.getAllWindows().length);
}, 2000);

if (!app.requestSingleInstanceLock()) {
    console.log("获取到没有呢", baseIndex);
    app.setPath("userData", nodePath.join(userData, `/DATA_${baseIndex}/`));
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
    createMainWindow();

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

    // Fix issues #14
    baseIndexList[baseIndex] = 0;

    setDQbaseData(baseIndexList);
    if (!tray) return;
    // if (!isOsx) {
    tray.destroy();
    tray = null;
    // }
});
app.on("activate", (e) => {
    if (!mainWindow.isVisible()) {
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
setInterval(() => {
    if (!fs.existsSync(userData)) {
        app.quit();
    }
}, 5000);
