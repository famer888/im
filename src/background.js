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
import { logger, writeLog, writeCrashReport, initProcessLogger } from '@/utils/logger/process';
import MediaProcess, { isMediaPlayerWindow } from "@/utils/media/MediaProcess";
import { shouldOpenInMediaPreview } from "@/utils/media";
import { installCorsHandlers } from "@/utils/cors";
import { isDangerousFile } from "@/utils/minecheck";
import Storage from "@/cache/storage";
import { initNetworkDiagnostics } from "@/debuggers/netlog";
import { initPostLogUploadIpc } from "@/debuggers/post/main";
import nativeImageNode from "@/components/NativeImage/node";

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
        privileges: { secure: true, standard: true },
    },
    {
        scheme: "local-resource",
        privileges: { secure: true, supportFetchAPI: true, corsEnabled: true, stream: true },
    },
]);
// NativeImage（design.md §4.2 / §14 风险 1）：privileged scheme 必须在 app.ready 之前声明，
// 漏掉会让 <img src="native-image://..."> 直接 ERR_UNKNOWN_URL_SCHEME。
nativeImageNode.declareSchemes();

// 监听主进程未捕获的同步异常
process.on('uncaughtException', (error) => {
  writeLog('crash-report', 'error', '[uncaughtException] 主进程未捕获异常', error);
});

// 监听主进程未处理的 Promise 拒绝
process.on('unhandledRejection', (reason) => {
  writeLog('crash-report', 'error', '[unhandledRejection] 主进程未处理 Promise 拒绝', reason);
});

// 主进程即将退出时触发（包括正常退出和崩溃退出）
app.on('will-quit', (event) => {
  if (global.isCrashed) {
    writeLog('crash-report', 'error', '[will-quit] 主进程崩溃导致退出');
  } else {
    logger.info('主进程正常退出');
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

initPostLogUploadIpc();

const getDownloadRequestId = (args = {}) => {
    return args.downloadRequestId || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

// 危险扩展名落盘到 <temp>/dangerous/<fileName>.dangerous（与 handleFileDownload 内逻辑保持一致）。
// 解密失败时 renderer 端 .local 会被 "decryptionError" 占位覆盖，原始磁盘路径就丢了；
// 这里基于 fileName 复算，给二次打开提供 fs 探针入口，避免重复下载 + 解密失败循环。
const DANGEROUS_EXTS = ['.exe','.bat','.cmd','.vbs','.js','.ps1','.scr','.pif','.msi','.com','.lnk','.wsf'];
const resolveDangerousCachedPath = (fileName) => {
    if (!fileName || typeof fileName !== "string") return null;
    if (!DANGEROUS_EXTS.some((ext) => fileName.toLowerCase().endsWith(ext))) return null;
    return nodePath.join(app.getPath('temp'), 'dangerous', fileName + '.dangerous');
};

const getDownloadTimerName = (data = {}) => {
    if (data.downloadRequestId) {
        return data.downloadRequestId;
    }
    return [
        data.groupId || data.channelId || data.userId || "unknown",
        data.msgId || "unknown",
        data.mediaSlotIndex !== undefined && data.mediaSlotIndex !== null ? data.mediaSlotIndex : "single",
        data.fileUrl || data.trendsFileUrl || "",
    ].join("_");
};

const getDownloadUrlKey = (url) => {
    try {
        return encodeURI(decodeURI(url));
    } catch (e) {
        return encodeURI(url);
    }
};

const enqueueDownloadContext = (url, data) => {
    const key = getDownloadUrlKey(url);
    const queue = downloadFileMap.get(key) || [];
    queue.push(data);
    downloadFileMap.set(key, queue);
};

const _dequeueByUrl = (url) => {
    const key = getDownloadUrlKey(url);
    const queue = downloadFileMap.get(key);
    if (!queue || queue.length === 0) {
        return null;
    }
    const data = queue.shift();
    if (queue.length === 0) {
        downloadFileMap.delete(key);
    } else {
        downloadFileMap.set(key, queue);
    }
    return data;
};

// will-download 时 item.getURL() 在 302 redirect 后是最终 URL，与 enqueue 时初始 URL 不一致；
// urlChain[0] 才是渲染端发起下载时用的初始 URL。优先用初始 URL 取，取不到再 fallback 到当前 URL，
// 既修复 redirect 场景的 dequeue MISS（"图片已过期"），也避免 map 残留泄漏。
const dequeueDownloadContext = (url, urlChain = []) => {
    const initialUrl = (Array.isArray(urlChain) && urlChain.length > 0) ? urlChain[0] : "";
    if (initialUrl && initialUrl !== url) {
        const data = _dequeueByUrl(initialUrl);
        if (data) return data;
    }
    return _dequeueByUrl(url);
};

ipcMain.handle("get-user-data-path", () => {
    return userData;
});
ipcMain.handle("local-file-exists", (e, local) => {
    try {
        const fsLocal = localDisplayToFsPath(local);
        return !!fsLocal && !/^https?:\/\//i.test(fsLocal) && fs.existsSync(fsLocal);
    } catch (err) {
        return false;
    }
});
ipcMain.handle("set-user-data-path", (e, path) => {
    if (path) {
        userData = path;
        // 设置Storage的保存根目录
        Storage.setBase(userData);
    }
});

ipcMain.handle("get-working-dir", () => {
    return workingDir;
});

ipcMain.handle("save-list-domain-snapshot", (event, payload = {}) => {
    const projectRoot = process.env.OCS_PROJECT_ROOT || app.getAppPath();
    const filePath = nodePath.join(projectRoot, "scripts", "domains.json");

    try {
        const response = payload.response && typeof payload.response === "object"
            ? payload.response
            : {};

        fs.writeFileSync(
            filePath,
            JSON.stringify(response, null, 2),
            { encoding: "utf8" }
        );

        return { success: true, filePath };
    } catch (error) {
        console.warn("[domains] listDomain snapshot save failed", error);
        return {
            success: false,
            error: error && error.message ? error.message : String(error),
            filePath,
        };
    }
});

ipcMain.handle("get-ntp-time", () => {
    const dgram = require('dgram');
    const NTP_SERVERS = ["cn.pool.ntp.org", "time.google.com"];
    const NTP_PORT = 123;
    const NTP_TIMEOUT = 4000;

    function queryNtp(server) {
        return new Promise((resolve, reject) => {
            const client = dgram.createSocket("udp4");
            const ntpData = Buffer.alloc(48);
            ntpData[0] = 0x1B;

            const timeout = setTimeout(() => {
                client.close();
                reject(new Error("NTP timeout"));
            }, NTP_TIMEOUT);

            client.send(ntpData, 0, ntpData.length, NTP_PORT, server, (err) => {
                if (err) { clearTimeout(timeout); client.close(); reject(err); }
            });

            client.on("message", (msg) => {
                clearTimeout(timeout);
                client.close();
                const seconds = msg.readUInt32BE(40) - 2208988800;
                const fraction = msg.readUInt32BE(44);
                const ms = seconds * 1000 + ((fraction * 1000) / 0x100000000);
                resolve(ms);
            });

            client.on("error", (err) => {
                clearTimeout(timeout);
                client.close();
                reject(err);
            });
        });
    }

    return Promise.any(NTP_SERVERS.map(queryNtp)).catch(() => null);
});


function reloadWindows(type, details = {}) {
    try {
        writeCrashReport(type, details);

        setTimeout(() => {
            mainWindow.reload();
            mainWindow.send("collapse", { type });
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
                tray.setToolTip("【ocs 版本1.7.0】");
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

            // 已下载并解密好的本地文件路径（如有），优先用它做"另存为"
            // 避免走 webContents.downloadURL 重新拉 OSS：
            // 1) OSS 签名 URL 过期会 downloadFailed；2) 失败重试在 handleFileDownload
            //    里会把 fileLocalPath 覆盖回原始 local 路径，导致用户选择的目录里
            //    什么也没产生（静默失败）；3) success 路径会被 fnDownloadFileInfoUpdate
            //    把消息 local 字段改写到另存为目录，污染消息库。
            const localFsPath = local ? localDisplayToFsPath(local) : "";
            const hasLocalFile =
                !!localFsPath &&
                !/^https?:\/\//i.test(localFsPath) &&
                fs.existsSync(localFsPath);

            const oldpath = app.getPath("downloads") + "/" + fileName;
            const { canceled, filePath } = await dialog.showSaveDialog(
                mainWindow,
                {
                    title: "选择保存位置",
                    properties: ["openDirectory", "createDirectory"],
                    defaultPath: oldpath,
                }
            );

            if (canceled || !filePath) return;

            if (hasLocalFile) {
                try {
                    fs.copyFileSync(localFsPath, filePath);
                    return;
                } catch (copyErr) {
                    writeLog(
                        "app",
                        "error",
                        `[openFileDialog] copy local failed: ${(copyErr && copyErr.message) || ""}`
                    );
                    // 拷贝失败再回退到下载流程
                }
            }

            const requestArgs = {
                ...args,
                downloadRequestId: getDownloadRequestId(args),
                fileLocalPath: filePath,
                skipMsgUpdate: true,
            };

            // 过期资源守卫：URL 路径里携带的日期（chat/pic/YYYYMM/DD）若已超过本地阈值天数，
            // 直接判定下载失败，避免对已过期 OSS 资源发起真实请求。
            const expireCheck = isExpiredDatedDownloadUrl(url);
            if (expireCheck.expired) {
                writeLog("app", "warn", "[openFileDialog] 命中过期资源守卫，跳过下载", {
                    url,
                    matchedUrl: expireCheck.matchedUrl,
                    diffDays: expireCheck.diffDays,
                    thresholdDays: EXPIRED_DATED_URL_THRESHOLD_DAYS,
                    msgId: requestArgs.msgId,
                    downloadRequestId: requestArgs.downloadRequestId,
                });
                sendMain("downloadFileFailed", { ...requestArgs, expired: true, reason: "url_dated_expired" });
                return;
            }

            enqueueDownloadContext(url, requestArgs);

            const windows = BrowserWindow.getAllWindows();
            windows.forEach((w) => {
                if (w.getMediaSourceId() === windowId) {
                    w.webContents.downloadURL(url);
                }
            });
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
    }
    delete downTimers[timerName];
}

// chat/pic/YYYYMM/DD/... 形式的 OSS 资源在服务端默认 4 天后即失效，
// 若按本地时间已超过阈值，直接判定为过期，不再向 OSS 真正发请求。
const EXPIRED_DATED_URL_PATTERN = /\/chat\/pic\/(\d{4})(\d{2})\/(\d{2})(?:\/|$|\?)/i;
const EXPIRED_DATED_URL_THRESHOLD_DAYS = 4;
const isExpiredDatedDownloadUrl = (url, urlChain = []) => {
    const candidates = [];
    if (typeof url === "string" && url) candidates.push(url);
    if (Array.isArray(urlChain)) {
        for (const u of urlChain) {
            if (typeof u === "string" && u && !candidates.includes(u)) {
                candidates.push(u);
            }
        }
    }
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    for (const candidate of candidates) {
        const m = candidate.match(EXPIRED_DATED_URL_PATTERN);
        if (!m) continue;
        const year = Number(m[1]);
        const month = Number(m[2]);
        const day = Number(m[3]);
        if (!year || !month || month < 1 || month > 12 || !day || day < 1 || day > 31) continue;
        const urlDate = new Date(year, month - 1, day);
        if (Number.isNaN(urlDate.getTime())) continue;
        // 防御未来日期：仅在本地日期严格晚于 URL 日期且差值超过阈值时拦截
        const diffDays = Math.floor((todayStart - urlDate.getTime()) / 86400000);
        if (diffDays > EXPIRED_DATED_URL_THRESHOLD_DAYS) {
            return { expired: true, matchedUrl: candidate, diffDays };
        }
    }
    return { expired: false };
};

/**
 * 下载处理
 */
const downloadHandler = (event, item, webContents) => {
   let data = {};
   let timerName = "";
    try {
        const itemUrl = item.getURL();
        let itemUrlChain = [];
        try {
            itemUrlChain = (typeof item.getURLChain === "function") ? item.getURLChain() : [];
        } catch (_e) { itemUrlChain = []; }
        data = dequeueDownloadContext(itemUrl, itemUrlChain);

        if (!data) {
            let defalutPath = nodePath.join(userData, `/Local Storage/bad`);
            item.setSavePath(defalutPath);
            return;
        }

        // 过期资源守卫：URL 路径里携带的日期（chat/pic/YYYYMM/DD）若超过本地 4 天，
        // 直接取消下载并通知前端失败，避免对已过期 OSS 资源浪费一次真实请求。
        const expireCheck = isExpiredDatedDownloadUrl(itemUrl, itemUrlChain);
        if (expireCheck.expired) {
            writeLog("app", "warn", "[downloadHandler] 命中过期资源守卫，直接判定下载失败", {
                url: itemUrl,
                matchedUrl: expireCheck.matchedUrl,
                diffDays: expireCheck.diffDays,
                thresholdDays: EXPIRED_DATED_URL_THRESHOLD_DAYS,
                msgId: data.msgId,
                downloadRequestId: data.downloadRequestId,
                fileUrl: data.fileUrl,
                trendsFileUrl: data.trendsFileUrl,
            });
            try { item.cancel(); } catch (_) {}
            sendMain("downloadFileFailed", { ...data, expired: true, reason: "url_dated_expired" });
            return;
        }

        timerName = getDownloadTimerName(data);
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
            if (state !== "completed") {
                writeLog("app", "error", "[download error]", {
                    url: data.actualDownloadUrl || data.trendsFileUrl || data.fileUrl || item.getURL(),
                    fileUrl: data.fileUrl,
                    trendsFileUrl: data.trendsFileUrl,
                    msgId: data.msgId,
                    downloadRequestId: data.downloadRequestId,
                    state,
                });
            }
           
           if (state === "completed") {
               // Download completed, perform security check
               try {
                   const filePath = item.getSavePath();
                   const fileName = data.fileName || nodePath.basename(filePath);
                   
                   // Perform enhanced security check
                   if (isDangerousFile(filePath, fileName)) {
                       // File is dangerous, move to dangerous folder
                       const dangerousDir = nodePath.join(app.getPath('temp'), 'dangerous');
                       if (!fs.existsSync(dangerousDir)) {
                           fs.mkdirSync(dangerousDir, { recursive: true });
                       }
                       
                       const dangerousFileName = fileName + '.dangerous';
                       const dangerousPath = nodePath.join(dangerousDir, dangerousFileName);
                       
                       // Move file to dangerous folder
                       fs.renameSync(filePath, dangerousPath);
                       
                       // Update the file path in data
                       data.fileLocalPath = dangerousPath;
                       data.isDangerous = true;
                       
                       console.log(`Dangerous file detected and moved: ${fileName} -> ${dangerousPath}`);
                   }
               } catch (error) {
                   writeLog('app', 'error', '[downloadHandler] 安全检查失败', {
                       fileName,
                       filePath,
                       error: error.message,
                       createTime: Date.now()
                   });
               }
           }
           
            sendMain(
                state === "completed"
                    ? "downloadFileDone"
                    : "downloadFileFailed",
                data
            );
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
    win = allWindows.find((w) => !w.isDestroyed() && !isMediaPlayerWindow(w));
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
        nodeIntegration: false,
        contextIsolation: true,
        preload: nodePath.join(__dirname, isDevelopment ? './public/preload.js' : './preload.js'),
        nativeWindowOpen: true,
        webSecurity: true,
        webviewTag: false,
        webviewTag: false,
        backgroundThrottling: false,
    };

    registerLocalResourceProtocol();

    if (!process.env.WEBPACK_DEV_SERVER_URL) {
        createProtocol("app");
    }

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
    require("@electron/remote/main").enable(mainWindow.webContents);

    // NativeImage（design.md §4.2 / §9）：注册 native-image:// streamProtocol +
    // ipcMain handler；本期 mainWindow 单窗口，broadcastStatus 直接 webContents.send。
    // 必须在 app.ready 之后；createMainWindow 在 app.on("ready") 内调用，时序安全。
    try {
        nativeImageNode.register({ userData, mainWindow });
    } catch (e) {
        writeLog("app", "error", "[NativeImage] register failed: " + (e && e.message));
    }
    if (process.env.WEBPACK_DEV_SERVER_URL) {
        await mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
        // mainWindow.openDevTools({ mode: 'detach' });
    } else {
        mainWindow.loadURL("app://./index.html", {
            extraHeaders: "Access-Control-Allow-Origin: *",
        });
    }
    mainWindow.webContents.on("did-finish-load", async (e) => {
        try {
            const win =
                mainWindow ||
                (BrowserWindow.getAllWindows() || []).find(
                    (w) => !w.isDestroyed() && !isMediaPlayerWindow(w)
                );
            win && win.show();
            win && win.focus();
            await new Promise(resolve => setTimeout(resolve, 1000 / 60));
            win && win.setOpacity(1);
        } catch (ex) {
            // do nothing
        }
    });
    mainWindow.webContents.on(
        "did-fail-load",
        (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
            const failDetail = {
                errorCode,
                errorDescription,
                validatedURL,
                isMainFrame,
            };
            writeLog("crash-report", "error", "[did-fail-load] 页面加载失败", {
                ...failDetail,
                msg: "系统报错：加载失败",
                createTime: Date.now(),
            });
            setTimeout(() => {
                mainWindow.reload();
                mainWindow.send("collapse", {
                    type: "did-fail-load",
                });
            }, 2000);
        }
    );
    mainWindow.webContents.on("crashed", (event, killed) => {
        const crashDetail = { killed };
        writeLog("crash-report", "error", "[crashed] 渲染器进程崩溃", {
            ...crashDetail,
            msg: "系统报错：渲染器进程崩溃",
            createTime: Date.now(),
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
                writeLog("crash-report", "error", "[changeWindow] 失败", {
                    msg: "系统报错：changeWindow失败",
                    createTime: Date.now(),
                    message: error.message,
                    stack: error.stack,
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

/** local-resource:// / file:// → 主进程 fs 可用的磁盘路径 */
function localDisplayToFsPath(local) {
    if (!local || typeof local !== "string") return local;
    if (/^https?:\/\//i.test(local)) return local;
    let p = local;
    if (/^local-resource:\/\//i.test(p)) {
        p = p.replace(/^local-resource:\/\//i, "");
    } else if (/^file:\/\//i.test(p)) {
        p = p.replace(/^file:\/\/\/?/i, "");
    } else {
        return local;
    }
    try {
        p = decodeURIComponent(p);
    } catch (e) {
        /* ignore */
    }
    if (
        process.platform === "win32" &&
        p.startsWith("/") &&
        /^\/[A-Za-z]:[\\/]/.test(p)
    ) {
        p = p.slice(1);
    }
    return nodePath.normalize(p);
}


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
        isDir,
        msgId,
        timeout, // 超时时长毫秒
    } = args;

    // 危险文件已经在 <temp>/dangerous 落盘过：直接复用，避免再次拉网 + 解密失败把 .local 反复刷成 "decryptionError"
    const cachedDangerousPath = resolveDangerousCachedPath(fileName);
    if (cachedDangerousPath && fs.existsSync(cachedDangerousPath)) {
        if (isOpen) {
            sendMain("downloadProgress", {
                taskId: args.taskId,
                percent: 100 + Math.random().toFixed(6),
            });
            openFile(cachedDangerousPath, isDir);
        }
        return;
    }

    // [dl-trace] 主进程仅见 userId/groupId/channelId，无 session.type 字段
    const url = trendsFileUrl || fileUrl;
    const downloadRequestId = getDownloadRequestId(args);
    const requestArgs = {
        ...args,
        downloadRequestId,
        actualDownloadUrl: url,
    };

    // 过期资源守卫：URL 路径里携带的日期（chat/pic/YYYYMM/DD）若已超过本地阈值天数，
    // 直接判定下载失败，连超时定时器和 downloadURL 都不再下发。
    const expireCheck = isExpiredDatedDownloadUrl(url);
    if (expireCheck.expired) {
        writeLog("app", "warn", "[handleFileDownload] 命中过期资源守卫，跳过下载", {
            url,
            matchedUrl: expireCheck.matchedUrl,
            diffDays: expireCheck.diffDays,
            thresholdDays: EXPIRED_DATED_URL_THRESHOLD_DAYS,
            msgId,
            downloadRequestId,
        });
        sendMain("downloadFileFailed", { ...requestArgs, expired: true, reason: "url_dated_expired" });
        return;
    }

    // 处理下载超时
    if(timeout) {
        const timerName = getDownloadTimerName(requestArgs);
        downTimers[timerName] = setTimeout(() => {
            sendMain(
                "downloadFileFailed",
                requestArgs,
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
    let name = fileName || getRandomFileName(chatType);

    // 初始检查：危险扩展名文件直接处理
    const dangerousExts = ['.exe','.bat','.cmd','.vbs','.js','.ps1','.scr','.pif','.msi','.com','.lnk','.wsf'];
    const hasDangerousExtension = dangerousExts.some(ext => name.toLowerCase().endsWith(ext));
    
    // 如果是危险扩展名，直接更改下载位置和添加.dangerous后缀
    if (hasDangerousExtension) {
        name = name + '.dangerous';
        
        // 确保危险文件夹存在
        const dangerousDir = nodePath.join(app.getPath('temp'), 'dangerous');
        if (!fs.existsSync(dangerousDir)) {
            fs.mkdirSync(dangerousDir, { recursive: true });
        }
    }
    
    // 设置本地文件地址（与渲染层 local-resource:// 展示 URL 对齐）
    const fileLocalPath = local
        ? localDisplayToFsPath(local)
        : hasDangerousExtension 
            ? nodePath.join(app.getPath('temp'), 'dangerous', name)
            : nodePath.join(dirPath, name);

    // 设置数据 下载成功后获取
    enqueueDownloadContext(url, {
        ...requestArgs,
        fileLocalPath,
        isOpen,
    });

    const downloadWin =
        mainWindow && !mainWindow.isDestroyed()
            ? mainWindow
            : BrowserWindow.getAllWindows().find(
                  (w) => !w.isDestroyed() && !isMediaPlayerWindow(w)
              );
    if (downloadWin && downloadWin.webContents) {
        downloadWin.webContents.downloadURL(url);
    }

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
        const key = (args && args.key) || '';
        const hasValue = args ? args.value !== undefined : false;
        writeLog('app', 'error', `[getLocalFile] 读取文件失败key:${key} hasValue:${hasValue}` + (error ? (error.message || '') : ''));
        // 发送错误到渲染进程 console
        // 只发送可序列化的数据，args.value 可能包含不可序列化的内容
        sendMain("main-error-log", {
            type: "getLocalFile",
            message: (error && error.message) || String(error),
            stack: (error && error.stack) || "",
            key
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
        writeLog("crash-report", "error", "[whiteErrorDoc] 渲染进程上报", {
            ...(args && typeof args === "object" ? args : { payload: args }),
            createTime: Date.now(),
        });
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
            const fsLocal = localDisplayToFsPath(local);
            fs.stat(fsLocal, (err) => {
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
                // 图片/视频固定走媒体播放器；文件消息按扩展名命中可预览格式后走媒体播放器
                if (
                    !isDir &&
                    shouldOpenInMediaPreview({
                        chatType,
                        fileName: args.fileName,
                        fileUrl,
                        local: fsLocal,
                    })
                ) {
                    MediaProcess.create(mainWindow);
                    MediaProcess.show();
                } else {
                    openFile(fsLocal, isDir);
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



if (!app.requestSingleInstanceLock()) {
    userData = nodePath.join(userData, `/DATA_${baseIndex}/`);
    app.setPath("userData", userData);
    // 设置Storage的保存根目录
    Storage.setBase(userData);
} else {
    console.log("这里是设置");
    setBaseIndex(1);

    // source-id-list 已迁到新 Storage，主进程也需要走同一后端，
    // 否则渲染进程读到的是另一份从未被清理的累积数据，
    // 会导致 App.vue 的"保留登录态进入主界面"回退分支失效。
    Storage.setBase(userData);
    Storage.set("source-id-list", []);
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
});

function registerLocalResourceProtocol(ses) {
    let fun = protocol;
    if (ses) fun = ses.protocol;
    const ok = fun.registerFileProtocol("local-resource", (request, callback) => {
        let url = request.url.replace(/^local-resource:\/\//, "");
        let decodedUrl = decodeURI(url).replace(/^file:\/\/\/?/, "");
        if (/^\/[A-Za-z]:/.test(decodedUrl)) decodedUrl = decodedUrl.slice(1);
        decodedUrl = nodePath.normalize(decodedUrl);
        try {
            return callback(decodedUrl);
        } catch (error) {
            console.error(
                "ERROR: registerLocalResourceProtocol: Could not get file path:",
                error
            );
        }
    });
    if (!ok) console.error("[registerLocalResourceProtocol] registration failed");
}
app.on("ready", () => {
    // [macOS] 启动前清理可能残留的 IndexedDB 锁文件
    runMacStartupCleanup();

    // 注册Storage的IPC通道
    Storage.register();
    Storage.setBase(userData);

    createMainWindow();

    // 启用电源阻止器，防止系统进入睡眠状态
    // 'prevent-app-suspension' - 阻止应用挂起，保持CPU运行
    // 'prevent-display-sleep' - 阻止显示器睡眠
    powerBlockerId = powerSaveBlocker.start('prevent-app-suspension');
    initProcessLogger();
    initNetworkDiagnostics();
    logger.info('应用启动');

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
    // 跨域处理（OSS 直传 + 动态 CNAME）统一在 utils/cors 里维护
    installCorsHandlers(session.defaultSession);
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
    // 与渲染进程统一走新 Storage，避免 source-id-list 写在两个不同后端、
    // 退出清理形同虚设导致列表无限累积。
    try {
        const data = Storage.get("source-id-list");
        if (Array.isArray(data) && data.length > 0) {
            const primaryWin =
                mainWindow && !mainWindow.isDestroyed()
                    ? mainWindow
                    : BrowserWindow.getAllWindows().find(
                          (w) => !w.isDestroyed() && !isMediaPlayerWindow(w)
                      );
            if (primaryWin) {
                Storage.set(
                    "source-id-list",
                    data.filter((id) => id !== primaryWin.getMediaSourceId())
                );
            }
        }
    } catch (e) {
        console.warn("[before-quit] cleanup source-id-list failed:", e);
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
