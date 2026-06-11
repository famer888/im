import { remote, ipcRenderer, fs, toLocalResourceUrl, toFsPathFromDisplayUrl } from "@/platform";

// 工具
import { createHash, getFileSuffix, enumMsgType } from "@/utils/base";
import { shouldOpenInMediaPreview } from "@/utils/media";
import { checkLocalFileExists, getImageDimensions, saveFileToDirectory } from "@/utils/fileTools";
import { getUserDataDirectory } from "@/utils/tools";
import {
    checkFileSize,
    uploadFile,
    getKeys,
    getVideoPreviewLocal,
} from "@/utils/upload";
import { openFile } from "@/utils/server";
import { getNewFileDownUrl, getOssFirstNormalUrl, resolveOssChannelType } from "@/utils/trendsDomain/manageOssDownUpload";
import { reportErrorDomain } from "@/utils/trendsDomain/manageReport";


// 事件
import eventBase from "./base";
import eventCommon from "./common";
import progress from "@/utils/progress";
import { inspectGifDownload, isValidImagePlaintext } from "./gifDownloadPlaintext";

//////////////////  下载解密

/** 4xx 表示服务端已响应且资源/权限问题，换 CDN 域名通常无效 */
const shouldRetryDownloadWithBackupDomain = (data) => {
    if (data?.expired || data?.reason === "url_dated_expired") {
        return false;
    }
    const code = data?.httpStatusCode;
    if (typeof code === "number" && code >= 400 && code < 500) {
        return false;
    }
    return true;
};

const FILE_ERROR_TYPES = ["downloadError", "decryptionError"];
const latestMediaDownloadRequests = new Map();

// contextIsolation 下 ipcRenderer.removeListener 无法移除跨桥 proxy wrapper（每次跨桥生成新 proxy），
// 导致 listener 单调累加；同一个 downloadFileDone 事件会触发多次 handleDownloadFileDone，
// 多次 writeFileSync 同一路径会与 checkFileCorrect 的 img 探针发生 truncate 竞态 → 解密误判失败。
// 用 downloadRequestId 做单次幂等保护：固定上限 LRU，纯同步无定时器，常数内存。
const _PROCESSED_REQ_MAX = 500;
const _processedDownloadRequestIds = new Set();
const _markRequestProcessed = (reqId) => {
    if (!reqId) return false;
    if (_processedDownloadRequestIds.has(reqId)) return true;
    _processedDownloadRequestIds.add(reqId);
    if (_processedDownloadRequestIds.size > _PROCESSED_REQ_MAX) {
        // Set 保留插入顺序，淘汰最早进入的 reqId
        const oldest = _processedDownloadRequestIds.values().next().value;
        _processedDownloadRequestIds.delete(oldest);
    }
    return false;
};

const isFileErrorValue = (value) => FILE_ERROR_TYPES.includes(value);

// 与 background.js 中 DANGEROUS_EXTS 保持一致；危险文件落盘到 <temp>/dangerous 后 .local 会被 "decryptionError" 占位，
// 仅这种情况下重置 .local 才能复用主进程的危险文件缓存命中路径。
const DANGEROUS_FILE_EXTS = ['.exe','.bat','.cmd','.vbs','.js','.ps1','.scr','.pif','.msi','.com','.lnk','.wsf'];
const isDangerousFileName = (name) => {
    if (!name || typeof name !== "string") return false;
    const lower = name.toLowerCase();
    return DANGEROUS_FILE_EXTS.some((ext) => lower.endsWith(ext));
};

const isImageLocalKey = (key, chatType) => {
    return key === "localThumbUrl" ||
        key.startsWith("thumb_") ||
        [1, 9].includes(chatType);
};

const isSuccessfulLocalValue = async (value, { shouldDecodeImage = false } = {}) => {
    if (!value || typeof value !== "string" || isFileErrorValue(value) || /^https?:\/\//i.test(value)) {
        return false;
    }
    try {
        const exists = await checkLocalFileExists(value);
        if (!exists) {
            return false;
        }
        return shouldDecodeImage ? checkFileCorrect(value) : true;
    } catch (e) {
        return false;
    }
};

const getCounterpartLocalKey = (key) => {
    if (key === "local") return "localThumbUrl";
    if (key === "localThumbUrl") return "local";
    if (key.startsWith("local_")) return key.replace("local_", "thumb_");
    if (key.startsWith("thumb_")) return key.replace("thumb_", "local_");
    return null;
};

const getMediaDownloadRequestKey = (data = {}) => {
    const id = data.groupId || data.channelId || data.userId || "";
    const type = data.groupId ? "group" : data.channelId ? "channel" : "friend";
    const slot = data.mediaSlotIndex !== undefined && data.mediaSlotIndex !== null
        ? data.mediaSlotIndex
        : "single";
    return `${type}:${id}:${data.customMsgId || data.msgId || ""}:${slot}`;
};

const fnMediaDownloadRequestRegister = (data = {}) => {
    if (!data.downloadRequestId) {
        return;
    }
    latestMediaDownloadRequests.set(getMediaDownloadRequestKey(data), data.downloadRequestId);
};

const isLatestMediaDownloadRequest = (data = {}) => {
    if (!data.downloadRequestId) {
        return true;
    }
    const latest = latestMediaDownloadRequests.get(getMediaDownloadRequestKey(data));
    return !latest || latest === data.downloadRequestId;
};

const getErrorMessage = (error) => {
    if (!error) return "";
    if (typeof error === "string") return error;
    return error.message || error.reason || String(error);
};

const markDecryptionFailed = (data, reason, detail = {}) => {
    data.decryptionErrorReason = reason;
    data.decryptionErrorDetail = detail;
    return fnDownloadFileInfoUpdate(data, "decryptionError");
};

const shouldSkipStaleErrorUpdate = async ({ id, type, data, updated, errorType }) => {
    if (!isFileErrorValue(errorType) || !data?.msgId || !window.$db?.getMsgInfoForMsgId) {
        return false;
    }

    let current = null;
    try {
        current = await window.$db.getMsgInfoForMsgId({
            id,
            type,
            msgId: data.msgId,
        });
    } catch (e) {
        current = null;
    }

    if (!current) {
        return false;
    }

    for (const key of Object.keys(updated)) {
        if (!isFileErrorValue(updated[key])) {
            continue;
        }
        const counterpartKey = getCounterpartLocalKey(key);
        if (await isSuccessfulLocalValue(current[key], { shouldDecodeImage: isImageLocalKey(key, data.chatType) })) {
            return true;
        }
        if (
            counterpartKey &&
            await isSuccessfulLocalValue(current[counterpartKey], {
                shouldDecodeImage: isImageLocalKey(counterpartKey, data.chatType),
            })
        ) {
            return true;
        }
    }
    return false;
};

/**
 * 下载成功
 */
const handleDownloadFileDone = (_$, data) => {
    const { fileLocalPath, fileKey, chatType } = data;
    // console.log('下载成功 ----------》 26', data)
    if (_markRequestProcessed(data && data.downloadRequestId)) {
        return;
    }
    // ── msgType 9（表情 / GIF）短期路径 ─────────────────────────────────────
    // magic 预检后：明文直出 / 密文走 Worker（与 msgType 1 相同 worker.js）。
    // [临时] Picture 派生接入 NativeImage 后移除此分支（design.md §3.3 / §10.1）。
    if (chatType === enumMsgType.gif) {
        handleGifDownloadFileDone(data);
        return;
    }
    if (fileKey) {
        let fileData;
        try {
            fileData = fs.readFileSync(fileLocalPath);
        } catch (error) {
            markDecryptionFailed(data, "readFileFailed", {
                error: getErrorMessage(error),
                fileLocalPath,
            });
            return;
        }

        const myWorker = new Worker("/worker.js");
        let settled = false;
        const finishWorker = () => {
            try {
                myWorker.terminate();
            } catch (e) {
                // ignore terminate errors
            }
        };
        const fail = (reason, detail = {}) => {
            if (settled) return;
            settled = true;
            finishWorker();
            markDecryptionFailed(data, reason, detail);
        };

        myWorker.onmessage = (e) => {
            if (settled) return;
            const workerError = e.data && e.data.error;
            if (workerError) {
                fail("workerDecryptFailed", workerError);
                return;
            }

            let decrypted;
            try {
                if (!e.data || !e.data.decrypted || e.data.decrypted.byteLength === 0) {
                    fail("decryptResultEmpty", {
                        fileLocalPath,
                        fileSize: fileData.length,
                    });
                    return;
                }
                decrypted = new Uint8Array(e.data.decrypted);
                fs.writeFileSync(fileLocalPath, decrypted);
            } catch (error) {
                fail("writeDecryptedFileFailed", {
                    error: getErrorMessage(error),
                    fileLocalPath,
                });
                return;
            }

            let checkFileType = "";
            if ([1, 9].includes(chatType)) {
                checkFileType = "image";
            }

            if (checkFileType !== "") {
                checkFileCorrect(toLocalResourceUrl(fileLocalPath)).then((exists) => {
                    if (settled) return;
                    settled = true;
                    if (exists) {
                        fnDownloadFileInfoUpdate(data);
                    } else {
                        markDecryptionFailed(data, "imageDecodeFailed", {
                            fileLocalPath,
                            decryptedSize: decrypted.length,
                        });
                    }
                });
            } else {
                settled = true;
                fnDownloadFileInfoUpdate(data);
            }

            finishWorker();
        };
        myWorker.onerror = (error) => {
            error.preventDefault && error.preventDefault();
            fail("workerRuntimeError", {
                error: getErrorMessage(error),
                filename: error.filename,
                lineno: error.lineno,
                colno: error.colno,
            });
        };
        try {
            myWorker.postMessage({ fileData, fileKey });
        } catch (error) {
            fail("postWorkerMessageFailed", {
                error: getErrorMessage(error),
                fileLocalPath,
            });
        }
    } else {
        setTimeout(() => {
            // 更新文件信息
            fnDownloadFileInfoUpdate(data);
        }, 10);
    }
};

/**
 * [临时 · msgType 9] 解密成功后 Image 探针 + 入库（与 msgType 1 图片路径一致）
 */
const commitImageDownload = (data, fileLocalPath, failDetail = {}) => {
    checkFileCorrect(toLocalResourceUrl(fileLocalPath)).then((exists) => {
        if (exists) {
            fnDownloadFileInfoUpdate(data);
        } else {
            markDecryptionFailed(data, "imageDecodeFailed", {
                fileLocalPath,
                ...failDetail,
            });
        }
    });
};

/**
 * [临时 · msgType 9] 按密钥候选依次走 Worker 解密（public/worker.js，不阻塞主线程）
 */
const tryGifWorkerDecrypt = (data, fileData, fileLocalPath, decryptKeys, keyIndex = 0, workerErrors = []) => {
    if (keyIndex >= decryptKeys.length) {
        markDecryptionFailed(data, "gifDecryptFailed", {
            triedKeyCount: decryptKeys.length,
            workerErrors,
        });
        return;
    }

    const fileKey = decryptKeys[keyIndex];
    const myWorker = new Worker("/worker.js");
    let settled = false;
    const finishWorker = () => {
        try {
            myWorker.terminate();
        } catch (e) {
            // ignore
        }
    };

    const tryNextKey = (reason, detail) => {
        if (settled) return;
        settled = true;
        finishWorker();
        workerErrors.push({ keyIndex, reason, detail });
        tryGifWorkerDecrypt(data, fileData, fileLocalPath, decryptKeys, keyIndex + 1, workerErrors);
    };

    myWorker.onmessage = (e) => {
        if (settled) return;
        const workerError = e.data && e.data.error;
        if (workerError) {
            tryNextKey("workerDecryptFailed", workerError);
            return;
        }

        let decrypted;
        let magic = null;
        try {
            if (!e.data || !e.data.decrypted || e.data.decrypted.byteLength === 0) {
                tryNextKey("decryptResultEmpty", { fileSize: fileData.length });
                return;
            }
            decrypted = new Uint8Array(e.data.decrypted);
            magic = isValidImagePlaintext(decrypted);
            if (!magic) {
                tryNextKey("invalidPlainMagic", { decryptedSize: decrypted.length });
                return;
            }
            fs.writeFileSync(fileLocalPath, decrypted);
        } catch (error) {
            tryNextKey("writeDecryptedFileFailed", { error: getErrorMessage(error) });
            return;
        }

        settled = true;
        finishWorker();
        commitImageDownload(data, fileLocalPath, { decryptedSize: decrypted.length, magic });
    };

    myWorker.onerror = (error) => {
        error.preventDefault && error.preventDefault();
        tryNextKey("workerRuntimeError", {
            error: getErrorMessage(error),
            filename: error.filename,
            lineno: error.lineno,
            colno: error.colno,
        });
    };

    try {
        myWorker.postMessage({ fileData, fileKey });
    } catch (error) {
        tryNextKey("postWorkerMessageFailed", {
            error: getErrorMessage(error),
            fileLocalPath,
        });
    }
};

/**
 * [临时 · msgType 9] 表情图下载成功：magic 预检 → 明文直出 / Worker 解密 → 入库
 *
 * 与 msgType 1 共用 ComMsgImage → image.vue → fileDownload IPC、progress、msg.local。
 * 迁移后由 NativeImage Picture 派生替代。
 */
const handleGifDownloadFileDone = (data) => {
    const { fileLocalPath, fileKey } = data;

    let fileData;
    try {
        fileData = fs.readFileSync(fileLocalPath);
    } catch (error) {
        markDecryptionFailed(data, "readFileFailed", {
            error: getErrorMessage(error),
            fileLocalPath,
        });
        return;
    }

    const inspected = inspectGifDownload(fileData, { fileKey });
    if (!inspected.ok) {
        markDecryptionFailed(data, inspected.reason, inspected.detail || {});
        return;
    }

    if (inspected.plain) {
        commitImageDownload(data, fileLocalPath, { magic: inspected.magic });
        return;
    }

    tryGifWorkerDecrypt(data, fileData, fileLocalPath, inspected.decryptKeys);
};

/**
 * 文件检测 刚解密好触发，则为解密失败
 */
const checkFileCorrect = (url) => {
    return new Promise((resolve) => {
        // 图片
        const img = new Image();

        // 图片加载成功
        img.onload = () => {
            // 图片存在
            resolve(true);
        };

        // 图片加载失败
        img.onerror = () => {
            // 图片不存在
            resolve(false);
        };

        // 设置图片 URL
        img.src = url;
    });
};

/**
 * 下载失败
 */
const handleDownloadFileFailed = (_$, data) => {
    setTimeout( async() => {
        if (!shouldRetryDownloadWithBackupDomain(data)) {
            await fnDownloadFileInfoUpdate(data, "downloadError");
            return;
        }
        const channelType = resolveOssChannelType(data, 1);
        let moduleCode = {0: "ossDefaultUrl", 1: "ossChatUrl", 2: "ossLowRateUrl"}[channelType] || "ossDefaultUrl"
        let url = data.trendsFileUrl || data.fileUrl;
        reportErrorDomain(url, {errorDesc: "下载失败", moduleCode})
        let downFailNum = data.downFailNum || 0
        if (downFailNum < 3) {
            data.downFailNum = downFailNum + 1
            data.trendsFileUrl = await getNewFileDownUrl(url, channelType, data.downFailNum - 1) || "";
            ipcRenderer.send("fileDownload", data)
        } else {
            await fnDownloadFileInfoUpdate(data, "downloadError");
        }
    }, 100);
};

/**
 * 下载文件信息更新
 */
/** 下载落盘路径是否像视频文件（用于 chatType 3 写 local 还是 thumb） */
const VIDEO_FILE_EXTS = [
    ".mp4",
    ".webm",
    ".ogg",
    ".ogv",
    ".mov",
    ".m4v",
    ".mkv",
    ".avi",
    ".wmv",
    ".flv",
    ".mpeg",
    ".mpg",
    ".3gp",
    ".ts",
    ".m2ts",
    ".f4v",
];
const isVideoFileLocalPath = (fileLocalPath) => {
    if (!fileLocalPath || typeof fileLocalPath !== "string") {
        return false;
    }
    const base = fileLocalPath.split(/[?#]/)[0].toLowerCase();
    return VIDEO_FILE_EXTS.some((ext) => base.endsWith(ext));
};

const fnDownloadFileInfoUpdate = async (data, errorType) => {
    const id = data.groupId || data.channelId || data.userId;
    const type = data.groupId ? "group"
                              : data.channelId ? "channel" : "friend";
    const { customMsgId, fileLocalPath, isOpen, isDir, chatType, local, localThumbUrl, taskId, mediaSlotIndex } = data;
    if (data.skipMsgUpdate) {
        progress.complete(data);
        if (data.downloadRequestId) {
            latestMediaDownloadRequests.delete(getMediaDownloadRequestKey(data));
        }
        return false;
    }
    if (!isLatestMediaDownloadRequest(data)) {
        progress.complete(data);
        return false;
    }
    /** 入库展示路径：成功为 local-resource URL；解密/下载失败为错误标识（勿写磁盘路径，否则 UI 当图片地址） */
    const pathForStore =
        errorType === "decryptionError" || errorType === "downloadError"
            ? errorType
            : toLocalResourceUrl(fileLocalPath);
    const thumbBase = localThumbUrl || local || fileLocalPath;
    const thumbPathForStore =
        errorType === "decryptionError" || errorType === "downloadError"
            ? errorType
            : toLocalResourceUrl(thumbBase);
    const percentVal = 100 + Number(Math.random().toFixed(6));
    const percent = taskId && !errorType ? { percent: percentVal } : {};

    const useSlot =
        mediaSlotIndex !== undefined &&
        mediaSlotIndex !== null &&
        mediaSlotIndex !== "" &&
        !Number.isNaN(Number(mediaSlotIndex));
    const slotIdx = useSlot ? Number(mediaSlotIndex) : null;
    const slotPercent = taskId && !errorType ? { [`percent_${slotIdx}`]: percentVal } : {};

    let updated;
    if (useSlot) {
        if (chatType === 3) {
            if (isVideoFileLocalPath(fileLocalPath)) {
                updated = { [`local_${slotIdx}`]: pathForStore, ...slotPercent };
            } else {
                updated = {
                    [`thumb_${slotIdx}`]: thumbPathForStore,
                    ...slotPercent,
                };
            }
        } else {
            updated = { [`local_${slotIdx}`]: pathForStore, ...slotPercent };
        }
    } else {
        updated = { local: pathForStore, ...percent };
        if (chatType === 3) {
            if (isVideoFileLocalPath(fileLocalPath)) {
                updated = { local: pathForStore, ...percent };
            } else {
                updated = { localThumbUrl: thumbPathForStore, ...percent };
            }
        }
    }

    if (errorType === "downloadError") {
        const meta = {
            customMsgId,
            mediaSlotIndex,
            slotIdx,
            msgId: data.msgId,
            url: String(data.actualDownloadUrl || data.trendsFileUrl || data.fileUrl || "").slice(0, 120),
        };
        console.log("download error", meta);
        console.$collect && console.$collect("download error", meta);
    }

    if (errorType === "decryptionError") {
        const meta = {
            customMsgId,
            mediaSlotIndex,
            slotIdx,
            msgId: data.msgId,
            reason: data.decryptionErrorReason || "unknown",
            detail: data.decryptionErrorDetail,
        };
        console.log("decryption error", meta);
        console.$collectError && console.$collectError("decryption error", meta);
    }

    if (await shouldSkipStaleErrorUpdate({ id, type, data, updated, errorType })) {
        progress.complete(data);
        if (data.downloadRequestId) {
            latestMediaDownloadRequests.delete(getMediaDownloadRequestKey(data));
        }
        return false;
    }

    const params = {
        id,
        type,
        list: [
            {
                customMsgId,
                updated,
            },
        ],
    };

    // 修改消息属性
    await window.$db.updateMsgProperty(params);

    progress.complete(data);
    if (data.downloadRequestId) {
        latestMediaDownloadRequests.delete(getMediaDownloadRequestKey(data));
    }

    // 通讯
    eventBase.fnCommunicationSendMsg({
        operator: "msgListPropertyUpdate",
        data: params,
    });

    // 打开文件
    if (isOpen) {
        const useMediaPreview = !isDir && shouldOpenInMediaPreview({
            chatType,
            fileName: data.fileName,
            fileUrl: data.fileUrl || fileLocalPath,
            local: fileLocalPath,
        });
        if (useMediaPreview) {
            window.mediaState && window.mediaState.send({
                url: toLocalResourceUrl(fileLocalPath),
                mediaType: chatType,
                width: data.width || 0,
                height: data.height || 0,
                cover: localThumbUrl || data.thumbUrl || '',
                duration: data.duration || 0,
                fileName: data.fileName || '',
                size: data.size || 0,
            });
            ipcRenderer.send("fileFoldersOpen", { local: fileLocalPath, chatType });
        } else {
            openFile(fileLocalPath, isDir);
        }
    }
    return true;
};

/**
 * 监听下载成功
 */
const fnMonitorDownloadFileDone = (isMonitor) => {
    // contextIsolation 下 removeListener 无法匹配跨桥 proxy wrapper，会导致 listener 累加；
    // removeAllListeners 按 channel 操作不需要匹配函数，能干净清掉所有累加的 listener。
    ipcRenderer.removeAllListeners("downloadFileDone");
    ipcRenderer.removeAllListeners("downloadFileFailed");
    if (isMonitor) {
        ipcRenderer.on("downloadFileDone", handleDownloadFileDone);
        ipcRenderer.on("downloadFileFailed", handleDownloadFileFailed);
    }
};

/**
 * 根据文件路径获取文件格式
 */
const fnFilePathToType = (path) => {
    const gif = ["gif", "GIF"];
    const img = [
        "apng",
        "avif",
        "bmp",
        "gif",
        "ico",
        "cur",
        "jpg",
        "jpeg",
        "jfif",
        "pjpeg",
        "pjp",
        "png",
        "svg",
        "riff",
        "webp",
    ];
    const video = ["mp4", "WebM", "Ogg"];
    const typeName = _.last(path.split(".")).toLowerCase();
    let fileName = _.last(path.split("/"));
    fileName = _.last(fileName.split("\\"));
    fileName = fileName
        .replace("docx", "doc")
        .replace("pptx", "ppt")
        .replace("rar", "zip")
        .replace("xlsx", "xls");

    let chatType = enumMsgType.file;

    if (gif.includes(typeName)) {
        chatType = enumMsgType.gif;
    } else if ([...gif, ...img].includes(typeName)) {
        chatType = enumMsgType.image;
    } else if (video.includes(typeName)) {
        chatType = enumMsgType.video;
    }

    return {
        fileName,
        typeName,
        chatType,
    };
};

/**
 * 发送文件消息
 */
const fnFileUploadInfoGet = async (values) => {
    const { file, fileThumb, params, type, id, sharedFileKey } = values;
    const { chatType, width, height, taskId } = params;

    let fileInfos = null;

    // 文件的相关信息（msgType 多图/多视频等可传入 sharedFileKey，使整条消息共用一个 key）
    const fileKey = sharedFileKey || createHash(16, 10);

    // 文件后缀
    const suffix = file.path.slice(file.path.lastIndexOf("."));

    // 上传文件
    const fileUrl = await uploadFile(
        file,
        {
            fileKey,
            chatType,
            taskId
        },
        suffix
    );

    // 上传失败
    if (!fileUrl) {
        return null;
    }

    // 上传文件缩略图
    let fileThumbUrl = "";

    if (fileThumb) {
        fileThumbUrl = await uploadFile(
            fileThumb,
            {
                chatType: 1,
                fileKey,
            },
            ".png"
        );

        // 上传失败
        if (!fileThumbUrl) {
            return null;
        }
        fileInfos = { thumbUrl: fileThumbUrl };
    }

    // 获取类型和名称
    // const { fileName } = fnFilePathToType(fileUrl);
    const fileName = file.name;

    // 获取加密信息
    const {
        ownAppAttachmentKey,
        appAttachmentKey,
        webAttachmentKey,
        groupAttachmentKey,
        channelAttachmentKey,
    } = await getKeys({
        fileKey,
        ToUserID: !["group", "channel"].includes(type) ? id : null,
        groupId: type === "group" ? id : null,
        channelId: type === "channel" ? id : null,
    });

    // 文件信息更新
    fileInfos = {
        ...fileInfos,
        text: fileUrl,
        url: fileUrl,
        fileKey,
        fileName,
        fileType: file.type,
        fileSize: file.size,
        size: file.size,
        width,
        height,
    };

    return type === "group"
        ? {
              ...fileInfos,
              groupAttachmentKey,
          }
        : type === "channel" ?
          {
              ...fileInfos,
              channelAttachmentKey,
          }
        :{
              ...fileInfos,
              ownAppAttachmentKey,
              appAttachmentKey,
              webAttachmentKey,
          };
};

/**
 * 文件信息获取
 */
const fnFileInfosGet = async (info) => {
    const { file, id, type } = info;

    // 文件本地地址
    let fileLocalPath = file.path || "";

    // 文件夹地址
    const dirPath = await getUserDataDirectory({
        GroupID: type === "group" ? id : null,
        UserID: type === "user" || type === "friend" ? id : null,
        ChannelID: type === "channel" ? id : null,
    });

    let name = file.name;
    if (name.includes("\\")) {
        const arr = name.split("\\");
        name = arr[arr.length - 1];
    }

    // 文件保存到本地
    fileLocalPath = await saveFileToDirectory(file, dirPath, name);

    // 文件保存发生报错
    if (!fileLocalPath) {
        window.$toast("文件操作发生错误");
        return;
    }

    // 获取类型和名称
    const { chatType, fileName } = fnFilePathToType(fileLocalPath);

    // 判断大小
    if (!file || !checkFileSize(file, chatType)) {
        window.$toast("文件体积超过限制");
        return;
    }

    // 图片的宽，高
    let width = 0;
    let height = 0;

    // 本地的预览图地址
    let localThumbUrl = null;

    // 文件预览图
    let fileThumb = null;

    // 如果是视频，生成预览图
    if (chatType === 3) {
        const data = await getVideoPreviewLocal(file, dirPath);
        const imgWH = await getImageDimensions(data.file);
        width = imgWH.width || 0;
        height = imgWH.height || 0;
        localThumbUrl = data.localPath;
        fileThumb = data.file;
    }

    // 如果是图片，设置图片宽高
    if ([1, 9].includes(chatType)) {
        const imgWH = await getImageDimensions(file);
        width = imgWH.width || 0;
        height = imgWH.height || 0;
    }

    return {
        info: {
            chatType,
            local: toLocalResourceUrl(fileLocalPath),
            localThumbUrl: localThumbUrl ? toLocalResourceUrl(localThumbUrl) : null,
            width,
            height,
            fileName,
            fileType: file.type,
            fileSize: file.size,
        },
        fileThumb,
    };
};

/**
 * 操作文件
 */
const fnOperatorFile = async ({ id, type, info, openDialog, isDir, taskId }, keepOriginName) => {
    // 仅对危险扩展名文件归零 .local：之前下载/解密失败时它会被写成 "decryptionError" 占位符，
    // 不归零的话二次打开会把它当成磁盘路径+下载 URL 送给 IPC，让 fs.stat 失败、savePath 非法。
    // 非危险文件保持原占位符以维持现有 UI/错误语义。
    if (
        info &&
        typeof info.local === "string" &&
        isFileErrorValue(info.local) &&
        isDangerousFileName(info.fileName)
    ) {
        info = { ...info, local: null };
    }

    // 文件路径
    let fileUrl = info.local || "";

    // 登录id
    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });

    if (info.content) {
        const hasSplit = info.content.includes("||");
        const hasThumbSep = info.content.includes("*P");
        // 图片 / 视频 / GIF 固定走媒体窗；文件消息按扩展名命中可预览格式后走媒体窗
        const canUseMediaPreview = shouldOpenInMediaPreview({
            chatType: info.chatType,
            fileName: info.fileName,
            fileUrl: info.content || info.local,
            local: info.local,
        });
        if (!canUseMediaPreview && !hasSplit && !hasThumbSep) {
            openFile(toFsPathFromDisplayUrl(info.local), isDir);
            return;
        }

        fileUrl = hasSplit ? info.content.split("||")[1] : info.content;
        if (info.chatType === 3) {
            if (hasThumbSep) {
                fileUrl = info.content.split("*P")[0];
            } else if (hasSplit) {
                fileUrl = info.content.split("||")[0];
            } else {
                fileUrl = info.content;
            }
        } else if (info.chatType === 1 || info.chatType === 7 || info.chatType === 9) {
            fileUrl = hasSplit ? info.content.split("||")[0] : info.content;
        }
    }

    // 后缀
    const suffix = getFileSuffix(info.chatType, info.fileName || fileUrl);

    // 优先使用 info.fileName，如果不存在则从 fileUrl 中提取
    let baseFileName = fileUrl.split("/").pop();
    if(keepOriginName) {
        baseFileName = info.fileName || baseFileName;
    }

    let params = {
        fileUrl,
        fileName: baseFileName + suffix,
        uid: loginId,
        // 与 image.vue handleFileDownload 一致，避免频道被写成 userId 导致 inferredType=friend
        channelId: type === "channel" ? id : null,
        userId: type === "friend" ? id : null,
        groupId: type === "group" ? id : null,
        windowId: remote.getCurrentWindow().getMediaSourceId(),
        msgId: info.MsgID,
        fileKey: info.fileKey,
        chatType: info.chatType,
        sendTime: info.sendTime,
        customMsgId: info.customMsgId,
        local: info.local,
        localThumbUrl: info.localThumbUrl,
        openDialog,
        isDir,
        taskId,
        width: info.width || 0,
        height: info.height || 0,
        duration: info.duration || 0,
        thumbUrl: info.thumbUrl || '',
        size: info.size || info.fileSize || 0,
    };
    if (info.mediaSlotIndex !== undefined && info.mediaSlotIndex !== null) {
        params.mediaSlotIndex = info.mediaSlotIndex;
    }

    // [dl-trace] IPC 不带 session.type；好友单聊时 params.userId=id、groupId=null，后续 fnDownloadFileInfoUpdate 会推断 type=friend
    // console.log("[dl-trace] file.fnOperatorFile", {
    //     sessionId: id,
    //     sessionType: type,
    //     userId: params.userId,
    //     groupId: params.groupId,
    //     channelId: params.channelId,
    //     customMsgId: params.customMsgId,
    //     msgChatType: info.chatType,
    //     mediaSlotIndex: info.mediaSlotIndex,
    // });

    if (!info.local) {
        params.channelType = resolveOssChannelType(info);
        params.trendsFileUrl = await getOssFirstNormalUrl(fileUrl, params.channelType);
    }

    // 图片/视频：通过 localStorage 传递媒体信息给播放器
    if (info.local && !isDir && shouldOpenInMediaPreview({
        chatType: info.chatType,
        fileName: info.fileName,
        fileUrl,
        local: info.local,
    })) {
        window.mediaState && window.mediaState.send({
            url: info.local,
            mediaType: info.chatType,
            width: info.width || 0,
            height: info.height || 0,
            cover: info.localThumbUrl || info.thumbUrl || '',
            duration: info.duration || 0,
            fileName: info.fileName || '',
            size: info.size || info.fileSize || 0,
        });
    }
    if (openDialog) {
        ipcRenderer.invoke("openFileDialog", params);
    } else {
        ipcRenderer.send("fileFoldersOpen", params);
    }
};

export default {
    fnMonitorDownloadFileDone,
    fnFileUploadInfoGet,
    fnFileInfosGet,
    fnOperatorFile,
    fnDownloadFileInfoUpdate,
    fnMediaDownloadRequestRegister
};
