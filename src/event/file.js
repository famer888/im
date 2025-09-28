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
import { getNewFileDownUrl } from "@/utils/trendsDomain/manageOssDownUpload";
import { reportErrorDomain } from "@/utils/trendsDomain/manageReport";


// 事件
import eventBase from "./base";
import eventCommon from "./common";

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
                checkFileCorrect("file://" + fileLocalPath).then((exists) => {
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
        reportErrorDomain(url, {errorDesc: "下载失败", moduleCode})  
        let downFailNum = data.downFailNum || 0
        if(downFailNum <=3 ) {
            data.downFailNum = downFailNum + 1
            data.trendsFileUrl = await getNewFileDownUrl(url, channelType, data.downFailNum-1) || "";
            ipcRenderer.send("fileDownload", data)
        }else {
            fnDownloadFileInfoUpdate(data, "downloadError");
        }
    }, 100);
};

/**
 * 下载文件信息更新
 */
const fnDownloadFileInfoUpdate = (data, errorType) => {
    // console.log('下载成功后更新', data)
    const id = data.groupId || data.channelId || data.userId;
    const type = data.groupId ? "group" 
                              : data.channelId ? "channel" : "friend";
    const { customMsgId, fileLocalPath, isOpen, isDir, chatType, local, localThumbUrl } = data;
    let updated = { local: errorType || fileLocalPath };

    // 如果是视频
    if (chatType === 3) {
        if ([".mp4", "webm", ".ogg"].includes(fileLocalPath.slice(-4).toLowerCase())) {
            updated = { local: fileLocalPath };
        } else {
            updated = { localThumbUrl: errorType || localThumbUrl || local || fileLocalPath };
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

    // 通讯
    eventBase.fnCommunicationSendMsg({
        operator: "msgListPropertyUpdate",
        data: params,
    });

    // 打开文件
    if (isOpen) {
        openFile(fileLocalPath, isDir);
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
    const { file, fileThumb, params, type, id } = values;
    const { chatType, width, height } = params;

    let fileInfos = null;

    // 文件的相关信息
    const fileKey = createHash(16, 10);

    // 文件后缀
    const suffix = file.path.slice(file.path.lastIndexOf("."));

    // 上传文件
    const fileUrl = await uploadFile(
        file,
        {
            fileKey,
            chatType,
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
        UserID: type === "user" ? id : null,
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
const fnOperatorFile = async ({ id, type, info, openDialog, isDir }) => {
    // 文件路径
    let fileUrl = info.local || "";

    // 登录id
    const loginId = eventCommon.fnCommonInfoRU({
        getId: "loginId",
    });

    if (info.content) {
        if (!info.content.includes("||") && !info.content.includes("*P")) {
            openFile(info.local, isDir);
            return;
        }

        // 文件路径
        fileUrl = info.content.split("||")[1];
        if (info.chatType === 3) {
            if(info.content.includes('*P')){
                fileUrl = info.content.split("*P")[0];
            } else if(info.content.includes('||')){
                fileUrl = info.content.split("||")[0];
            }
        } else if (info.chatType === 1 || info.chatType === 7) {
            fileUrl = info.content.split("||")[0];
        }
    }

    // 后缀
    const suffix = getFileSuffix(info.chatType, info.fileName || fileUrl);

    let params = {
        fileUrl,
        fileName: fileUrl.split("/").pop() + suffix,
        uid: loginId,
        userId: type === "group" ? null : id,
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
    };
    
    if(!info.local) {
        // 优先使用动态域名    
        params.trendsFileUrl = await getNewFileDownUrl(fileUrl, 0, 0);
    }
    if (openDialog) {
        console.log('openFileDialog')
        ipcRenderer.invoke("openFileDialog", params);
    } else {
        console.log('fileFoldersOpen')
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
