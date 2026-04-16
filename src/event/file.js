import { remote, ipcRenderer } from "@/platform";

// 工具
import { createHash, getFileSuffix, enumMsgType } from "@/utils/base";
import { getImageDimensions, saveFileToDirectory } from "@/utils/fileTools";
import { getUserDataDirectory } from "@/utils/tools";
import {
    checkFileSize,
    uploadFile,
    getKeys,
    getVideoPreviewLocal,
} from "@/utils/upload";
import { openFile } from "@/utils/server";
import { getNewFileDownUrl, getOssFirstNormalUrl } from "@/utils/trendsDomain/manageOssDownUpload";
import { reportErrorDomain } from "@/utils/trendsDomain/manageReport";


// 事件
import eventBase from "./base";
import eventCommon from "./common";
import progress from "@/utils/progress";

//////////////////  下载解密

/**
 * 下载成功
 */
const handleDownloadFileDone = (_$, data) => {
    const { fileLocalPath, fileKey, chatType } = data;
    // console.log('下载成功 ----------》 26', data)
    if (fileKey) {
        const myWorker = new Worker("/worker.js");
        myWorker.postMessage({ filePath: fileLocalPath, fileKey });
        myWorker.onmessage = () => {
            // 类型
            let checkFileType = "";
            if ([1, 9].includes(chatType)) {
                // 图片
                checkFileType = "image";
            }

            // 可以检测的文件
            if (checkFileType !== "") {
                // 检测文件正确
                checkFileCorrect("local-resource://" + fileLocalPath).then((exists) => {
                    // 更新文件信息
                    fnDownloadFileInfoUpdate(
                        data,
                        exists ? null : "decryptionError"
                    );
                });
            } else {
                // 更新文件信息
                fnDownloadFileInfoUpdate(data);
            }

            // 终止
            myWorker.terminate();
        };
    } else {
        setTimeout(() => {
            // 更新文件信息
            fnDownloadFileInfoUpdate(data);
        }, 10);
    }
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
        let { channelType = 0 } = data || {};
        let moduleCode = {0: "ossDefaultUrl", 1: "ossChatUrl", 2: "ossLowRateUrl"}[channelType] || "ossDefaultUrl"
        let url = data.trendsFileUrl || data.fileUrl;
        // console.log('下载文件失败: ', url)
        reportErrorDomain(url, {errorDesc: "下载失败", moduleCode})
        let downFailNum = data.downFailNum || 0
        if(downFailNum <=3 ) {
            data.downFailNum = downFailNum + 1
            data.trendsFileUrl = await getNewFileDownUrl(url, channelType, data.downFailNum-1) || "";
            // console.error('下载文件失败-替换新域名进行下载-', data.trendsFileUrl)
            ipcRenderer.send("fileDownload", data)
        }else {
            // console.error('下载文件失败-结束-', url)
            fnDownloadFileInfoUpdate(data, "downloadError");
        }
    }, 100);
};

/**
 * 下载文件信息更新
 */
const fnDownloadFileInfoUpdate = (data, errorType) => {
    const id = data.groupId || data.channelId || data.userId;
    const type = data.groupId ? "group"
                              : data.channelId ? "channel" : "friend";
    const { customMsgId, fileLocalPath, isOpen, isDir, chatType, local, localThumbUrl, taskId, mediaSlotIndex } = data;
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
            if ([".mp4", "webm", ".ogg"].includes((fileLocalPath || "").slice(-4).toLowerCase())) {
                updated = { [`local_${slotIdx}`]: errorType || fileLocalPath, ...slotPercent };
            } else {
                updated = {
                    [`thumb_${slotIdx}`]: errorType || localThumbUrl || local || fileLocalPath,
                    ...slotPercent,
                };
            }
        } else {
            updated = { [`local_${slotIdx}`]: errorType || fileLocalPath, ...slotPercent };
        }
    } else {
        updated = { local: errorType || fileLocalPath, ...percent };
        if (chatType === 3) {
            if ([".mp4", "webm", ".ogg"].includes((fileLocalPath || '').slice(-4).toLowerCase())) {
                updated = { local: fileLocalPath, ...percent };
            } else {
                updated = { localThumbUrl: errorType || localThumbUrl || local || fileLocalPath, ...percent };
            }
        }
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
    window.$db.updateMsgProperty(params);

    progress.complete(data);

    // 通讯
    eventBase.fnCommunicationSendMsg({
        operator: "msgListPropertyUpdate",
        data: params,
    });

    // 打开文件
    if (isOpen) {
        if (!isDir && [1, 3, 9].includes(chatType)) {
            window.mediaState && window.mediaState.send({
                url: fileLocalPath,
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
};

/**
 * 监听下载成功
 */
const fnMonitorDownloadFileDone = (isMonitor) => {
    if (isMonitor) {
        ipcRenderer.on("downloadFileDone", handleDownloadFileDone);
        ipcRenderer.on("downloadFileFailed", handleDownloadFileFailed);
    } else {
        ipcRenderer.removeListener("downloadFileDone", handleDownloadFileDone);
        ipcRenderer.removeListener(
            "downloadFileFailed",
            handleDownloadFileFailed
        );
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
            local: fileLocalPath,
            localThumbUrl,
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
    // 文件路径
    let fileUrl = info.local || "";

    // 登录id
    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });

    if (info.content) {
        const hasSplit = info.content.includes("||");
        const hasThumbSep = info.content.includes("*P");
        // 图片 / 视频 / GIF 统一走媒体窗 + fileFoldersOpen；转发时 content 常被收成纯 URL，不能走 openFile
        const isMediaType = [1, 3, 9].includes(info.chatType);
        if (!isMediaType && !hasSplit && !hasThumbSep) {
            openFile(info.local, isDir);
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

    if(!info.local) {
        // 优先使用动态域名
        // 优先使用动态域名
        params.trendsFileUrl = await getOssFirstNormalUrl(fileUrl, 0, 0);
    }

    // 图片/视频：通过 localStorage 传递媒体信息给播放器
    if (info.local && !isDir && [1, 3, 9].includes(info.chatType)) {
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
    fnDownloadFileInfoUpdate
};
