import _ from "lodash";
import { ipcRenderer } from "@/platform";
import eventBase from "@/event/base";

// api
import { _encrypt, _decrypt, _encrypt2, _decrypt2 } from "@/api/base/index";
import {
    SetImageObj,
    TextObj,
    ImageObj,
    VideoObj,
    AudioObj,
    DynamicImageObj,
    FileObj,
    NameCardObj,
} from "@/api/base/imweb-web";
import { getUploadUrl } from "@/api/imBase";

// 工具
import { fileToBuffer, saveFileToDirectory } from "./fileTools";
import { getVideoPreview, base64ToFile, bufferToFile } from "@/utils/fileTools";
import {
    fnGroupRelKeyGet,
    fnFriendRelKeyGet,
    fnChannelRelKeyGet,
} from "@/utils/encryption-decryption";
import { getOssDomains } from "@/utils/trendsDomain/manageOssDownUpload";

import { enumMsgType } from "@/utils/base";

const OSS = require("ali-oss");
import i18n from "@/assets/lang/i18n";
const fs = require("fs");

export const getVideoPreviewLocal = async (videoFile, savePath) => {
    // 获取视频预览图
    let videoPreviewBase64 = await getVideoPreview(videoFile);
    let preImgName = `${Date.now()}.jpg`;
    let file = base64ToFile(videoPreviewBase64, preImgName);
    let localPath = await saveFileToDirectory(file, savePath, preImgName);
    return { localPath, file };
};

/**
 * to Blob
 */
const convertBase64UrlToBlob = (urlData) => {
    var arr = urlData.split(","),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
};

// 字符串转流
function encode(str, type, picData) {
    switch (type) {
        case "all": {
            const arr = [...str];
            const buffer = new Uint8Array(arr.length * 4);
            let index = 0;
            for (let i = 0; i < arr.length; i++) {
                const codePoint = arr[i].codePointAt(0);
                // 四字节字符
                if (codePoint >= 0x10000) {
                    buffer[index++] = ((codePoint >> 18) & 0x7) | 0xf0;
                    buffer[index++] = ((codePoint >> 12) & 0x3f) | 0x80;
                    buffer[index++] = ((codePoint >> 6) & 0x3f) | 0x80;
                    buffer[index++] = (codePoint & 0x3f) | 0x80;
                } else if (codePoint >= 0x800) {
                    // 三字节字符
                    buffer[index++] = ((codePoint >> 12) & 0xf) | 0xe0;
                    buffer[index++] = ((codePoint >> 6) & 0x3f) | 0x80;
                    buffer[index++] = (codePoint & 0x3f) | 0x80;
                } else if (codePoint >= 0x80) {
                    // 两字节字符
                    buffer[index++] = ((codePoint >> 6) & 0x1f) | 0xc0;
                    buffer[index++] = (codePoint & 0x3f) | 0x80;
                } else {
                    // 单字节字符
                    buffer[index++] = codePoint;
                }
            }
            return Uint8Array.from(buffer.slice(0, index));
        }
        case enumMsgType.image: {
            // 图片
            const { width, height, size, thumbUrl } = picData;
            return ImageObj.encode({
                width,
                height,
                fileSize: size,
                url: str,
                thumbUrl: thumbUrl || str,
            }).finish();
        }
        case enumMsgType.gif: {
            // 动图
            const { width, height, size } = picData;
            return DynamicImageObj.encode({
                width,
                height,
                fileSize: size,
                url: str,
                thumbUrl: str,
            }).finish();
        }
        case enumMsgType.file: {
            // 文件
            const { fileName, fileType, size } = picData;
            return FileObj.encode({
                size,
                fileUrl: str,
                name: fileName,
                mimeType: fileType,
            }).finish();
        }
        case enumMsgType.video: {
            // 视频
            const { width, height, thumbUrl, size, duration } = picData;
            return VideoObj.encode({
                fileSize: size,
                url: str,
                thumbUrl: thumbUrl,
                duration,
                width,
                height,
            }).finish();
        }
        case enumMsgType.voice: {
            // 音频
            return AudioObj.encode({
                fileSize: 10,
                url: str,
                duration: 10,
            }).finish();
        }
        case enumMsgType.shareCard: {
            // 分享名片
            const dataList = str.split("*|*|*");
            return NameCardObj.encode({
                nickName: dataList[0],
                uid: dataList[2],
                icon: dataList[1],
            }).finish();
        }
        case enumMsgType.dice: {
            // 骰子
            return SetImageObj.encode({
                setImageId: isNaN(str) ? 1 : str,
                currentImage: 0,
                imageSize: 7,
            }).finish();
        }
        default: {
            // 文本
            const params = {};
            if (str && str.indexOf("-||-uid:") != -1) {
                try {
                    let content = str.split("-||-content:")[1].split("-||-")[0];
                    content = content.split("-||-")[0].split("*|*|*")[0];
                    let ref = {
                        uid: str.split("-||-uid:")[1].split("-||-")[0],
                        type: str.split("-||-type:")[1].split("-||-")[0],
                        nickname: str.split("-||-name:")[1].split("-||-")[0],
                        msgId: str.split("-||-msgId:")[1].split("-||-")[0],
                        content,
                    };
                    params.ref = ref;
                } catch (error) {}
            }
            str = str ? str.split("-||-")[0].split("*|*|*")[0] : "";
            params.content = str;
            return TextObj.encode(params).finish();
        }
    }
}

////////////////////// file's encode and decode

const fileEncode = async (file, fileKey) => {
    const FileBuf = await fileToBuffer(file);
    const arraybuffer = await decodeFile(new Int8Array(FileBuf), fileKey);
    const blob = new Blob([arraybuffer]);
    const File = new window.File([blob], file.name);
    return File;
};

const decodeFile = (buf, fileKey, cb) => {
    if (!fileKey) return;
    let myWorker = new Worker("/worker2.js");
    myWorker.postMessage({ buf, fileKey });
    return new Promise((resolve) => {
        myWorker.onmessage = (e) => {
            cb && cb();
            resolve(e.data);
            myWorker.terminate();
        };
        myWorker.onerror = (e) => {
            myWorker.terminate();
        };
    });
};

////////////////////// compress image

const compressImg = (file, obj = {}) => {
    var ready = new FileReader();
    /*开始读取指定的Blob对象或File对象中的内容.
            当读取操作完成时,readyState属性的值会成为DONE,
            如果设置了onloadend事件处理程序,则调用之.
            同时,result属性中将包含一个data: URL格式的字符串以表示所读取文件的内容.*/
    ready.readAsDataURL(file);
    return new Promise((reject) => {
        ready.onload = function () {
            var path = this.result;
            // ↓压缩
            var img = new Image();
            img.src = path;
            img.onload = function () {
                var that = this;
                // 默认按比例压缩
                var w = that.width,
                    h = that.height,
                    scale = w / h;
                w = obj.width || w;
                h = obj.height || w / scale;
                var quality = obj.quality || 0.2; // 默认图片质量为0.2
                //生成canvas
                var canvas = document.createElement("canvas");
                var ctx = canvas.getContext("2d");
                // 创建属性节点
                var anw = document.createAttribute("width");
                anw.nodeValue = w;
                var anh = document.createAttribute("height");
                anh.nodeValue = h;
                canvas.setAttributeNode(anw);
                canvas.setAttributeNode(anh);
                ctx.drawImage(that, 0, 0, w, h);
                // 图像质量
                let fileSize = file.size;
                if (!obj.quality && fileSize && fileSize > 1024 * 1024) {
                    quality = (1024 * 1024 * quality) / fileSize;
                }
                // quality值越小，所绘制出的图像越模糊
                var base64 = canvas.toDataURL("image/jpeg", quality);
                // 转换为Blob数据
                var BlobData = convertBase64UrlToBlob(base64);
                // 转换为file数据
                let this_file = new File([BlobData], file.name);
                // 回调函数返回file的值
                reject(this_file);
                // ↑压缩
            };
        };
    });
};

const compressOriginImg = async (File) => {
    try {
        let quality = 1;
        let fileSize = File.size || 0;
        if (fileSize > 10 * 1024 * 1024) {
            quality = 0.6;
        } else if (fileSize > 5 * 1024 * 1024) {
            quality = 0.7;
        } else if (fileSize > 3 * 1024 * 1024) {
            quality = 0.8;
        } else if (fileSize > 1 * 1024 * 1024) {
            quality = 0.9;
        } else {
            quality = 0.5;
        }
        return await compressImg(File, { quality: quality });
    } catch (er) {
        console.error("原图压缩失败", er);
        return File;
    }
};

////////////////////// Upload file
export const checkFileSize = (file, chatType) => {
    // 文件最大50M
    const M = 1024 * 1024;
    let fileMaxSize = 50 * M;
    // 图片最大10M
    if (chatType === 1) {
        // compress
        //  fileNew = compressOriginImg(file);

        // Set max-size of image
        fileMaxSize = 10 * M;
    }

    // Cannot be greater than the maximum value
    if (file.size > fileMaxSize) {
        window.$toast(`${i18n.t("上传文件不能超过")}${fileMaxSize / M}M`);
        return false;
    }
    return true;
};

export const uploadFileByLocalPath = (filePath, suffix, options) => {
    return new Promise(async (resolve, reject) => {
        const { chatType = 7, fileKey = "" } = options || {};
        fs.readFile(filePath, (err, buffer) => {
            if (err) {
                reject(err);
                return;
            }
            let File = bufferToFile(buffer);
            return uploadFile(File, { chatType, fileKey }, suffix)
                .then((res) => {
                    resolve(res);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    });
};

export const uploadFile = async (file, { chatType, fileKey, taskId }, suffix) => {
    if (!checkFileSize(file, chatType)) {
        return;
    }

    let fileNew = file;

    // Get upload's info
    const obj = {
        7: 3,
        1: 0,
        3: 1,
        9: 4,
    };
    const attachType = obj[chatType];
    const keyData = await getUploadUrl({
        attachType,
        attachWorkspaceType: 1,
        fileSize: fileNew.size,
        suffix,
    });
    // const channelType = keyData.channelType || 0;

    if (!keyData || !keyData.fileId) {
        // Failed to get data
        return;
    }

    // Check oss's info
    const ossData = window.ossData;
    if (!ossData || !ossData.securityToken) {
        return;
    }
    // Encode file
    const encodeFile = fileKey ? await fileEncode(fileNew, fileKey) : fileNew;

    // 优先使用动态域名上传
    let trendsOssDomains = await getOssDomains(9);
    trendsOssDomains.push({domainUrl: ossData.ossEndpoint})
    let res = {};
    for(let i = 0; i<= trendsOssDomains.length; i++) {
        const item = trendsOssDomains[i];
        try {
          if(!item?.domainUrl) continue;
          const result = await ossUpload(keyData.fileId, encodeFile, item.domainUrl, taskId);
          if(result) {
            res = result;
            break;
          }
        } catch (error) {
            console.error(error, '捕获上传异常 --1------------> 371')
        }
    }

    function handleUrl(url) {
        if (url && url.lastIndexOf("?uploadId") !== -1) {
            url = url.slice(0, url.lastIndexOf("?uploadId"));
        }

        if (url &&url.includes("http:")) {
            url = url.replace("http:", "https:");
        }

        return url || '';
    }

    let url = _.get(res, "res.requestUrls[0]");
    if(url) {
        return handleUrl(url);
    }

    // 使用getUploadUrl反url上传
    try {
        res = await ossUpload(keyData.fileId, encodeFile, undefined, taskId)
        url = _.get(res, "res.requestUrls[0]");
    } catch (error) {
        console.error(error, '捕获上传异常 --3------------> 371')
    }
    return handleUrl(url);
};

const ossUpload = async (fileId, File, endpoint, taskId) => {
    // Check oss's info
    const ossData = window.ossData;
    if (!ossData || !ossData.securityToken) {
        return;
    }
    // console.log(ossData, ' ossData ---------------> 353')
    // Set oss's option
    let ossOption = {
        region: ossData.ossEndpoint.split(".")[0],
        // endpoint: ossData.ossEndpoint,
        accessKeyId: ossData.accessKeyId,
        accessKeySecret: ossData.accessKeySecret,
        stsToken: ossData.securityToken,
        bucket: ossData.ossBucket,
        cname: false,
    };

    if(endpoint) {
        ossOption.endpoint = endpoint;
        ossOption.cname = true;
        delete ossOption.region;
    }
    // 创建 OSS 客户端实例
    let ALIclient = new OSS(ossOption);
    return ALIclient.multipartUpload(fileId, File, {
        progress: function (p) {
            // 有 taskId 则发送上传进度，上限 95
            if (taskId) {
                let percent = Math.round(p * 100);
                percent = percent >= 95 ? 95 : percent;
                eventBase.fnCommunicationSendMsg({
                    operator: "upload-progress",
                    data: { taskId, percent },
                });
            }
        },
        parallel: 4, //并发上传的分片数量
        partSize: 1024 * 512 * 1, //分片大小
        timeout: 120000,
    });
};

////////////////////// Get keys
export const getKeys = async ({ fileKey, ToUserID, groupId, channelId }) => {
    // Keys
    let ownAppAttachmentKey;
    let appAttachmentKey;
    let webAttachmentKey;
    let groupAttachmentKey;
    let channelAttachmentKey;

    if (groupId) {
        // group
        // 获取真实的密钥
        const relKey = await fnGroupRelKeyGet(groupId);

        if (relKey) {
            try {
                groupAttachmentKey = Buffer.from(
                    _encrypt2(relKey, encode(fileKey, "all")),
                    "hex"
                )
                    .toString("hex")
                    .toUpperCase();
            } catch (error) {
                //
            }
        }
    } else if (channelId) {
        const relKey = await fnChannelRelKeyGet(channelId);

        if (relKey) {
            try {
                channelAttachmentKey = Buffer.from(
                    _encrypt2(relKey, encode(fileKey, "all")),
                    "hex"
                )
                    .toString("hex")
                    .toUpperCase();
            } catch (error) {
                //
            }
        }
    } else {
        // friend
        const data = await fnFriendRelKeyGet({
            id: Number(ToUserID),
            msgEncryptionVersion: -1,
            source: 1,
            isSelf: true,
        });

        if (!data) {
            window.$toast(i18n.t("密钥异常，发送消息失败"));
            return;
        }

        const { app, pc, appOwn } = data;
        // console.log('relKey-', data)

        if (app) {
            appAttachmentKey = Buffer.from(
                _encrypt2(app.relKey, encode(fileKey, "all")),
                "hex"
            )
                .toString("hex")
                .toUpperCase();
        }

        if (pc) {
            webAttachmentKey = Buffer.from(
                _encrypt2(pc.relKey, encode(fileKey, "all")),
                "hex"
            )
                .toString("hex")
                .toUpperCase();
        }

        if (appOwn) {
            ownAppAttachmentKey = Buffer.from(
                _encrypt2(appOwn.relKey, encode(fileKey, "all")),
                "hex"
            )
                .toString("hex")
                .toUpperCase();
        }
    }

    return {
        ownAppAttachmentKey,
        appAttachmentKey,
        webAttachmentKey,
        groupAttachmentKey,
        channelAttachmentKey,
    };
};
