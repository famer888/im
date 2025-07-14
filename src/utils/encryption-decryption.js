import { Cache } from "@/cache";
import { enumMsgType } from "@/utils/base";
import i18n from "@/assets/lang/i18n";
import md5 from "js-md5";

// 事件
import eventCommon from "@/event/common";

// api
import { GetKeyPair } from "@/api/imBase";
import {
    secret,
    _encrypt,
    _decrypt,
    _encrypt2,
    _decrypt2,
} from "@/api/base/index";
import { ConcatInt8 } from "@/socket/api/request";
import { ReceiveKeyPairMessage } from "@/socket/api/message";

import {
    SystemObj,
    LocationObj,
    SetImageObj,
    AnimatedGameObj,
    TextObj,
    ImageObj,
    VideoObj,
    AudioObj,
    DynamicImageObj,
    FileObj,
    NameCardObj,
    GroupNoticeObj,
    HtmlObj,
} from "@/api/base/imweb-web";

// 好友 密钥对象集
let friendKeyObjs = {};

// 群 密钥对象集
let groupKeyObjs = {};

/**
 * 全部密钥的对象初始化
 */
export const fnKeyObjsInit = () => {
    // 登录的id
    const loginId = eventCommon.fnCommonInfoRU({ getId: "loginId" });

    // 初始化群的 密钥对象集
    Cache(`${loginId}-group-key-objs`).then((res) => {
        if (res) {
            groupKeyObjs = res;
        }
    });

    // 初始化好友的 密钥对象集
    Cache(`${loginId}-friend-key-objs`).then((res) => {
        if (res) {
            friendKeyObjs = res;
        }
    });
};

// 登录成功初始化所有群的key为空，获取接口新key存储进去
export const fnInitAllGroupKey = (loginId) => {
    groupKeyObjs = {};
    Cache(`${loginId}-group-key-objs`, null);
};

export const fnInitAllFriendKey = (loginId) => {
    friendKeyObjs = {};
    Cache(`${loginId}-friend-key-objs`, null);
};

/**
 * 获取群真实的密钥
 */
export const fnGroupRelKeyGet = async (id) => {
    // 登录的id
    const loginId = eventCommon.fnCommonInfoRU({ getId: "loginId" });

    // 密钥信息
    let keyInfos = groupKeyObjs[id];

    // 密钥不存在，则需要api获取
    if (!keyInfos) {
        const keyPair = await GetKeyPair({
            targetId: id,
            flag: 1,
            groupKeyVersion: 1,
        });

        if (keyPair && !_.isEmpty(keyPair.groupKeyPair)) {
            keyInfos = keyPair.groupKeyPair;

            // 记录
            groupKeyObjs[id] = keyInfos;

            // 保存到本地
            Cache(`${loginId}-group-key-objs`, groupKeyObjs);
        } else {
            // 解密错误
            console.error("解密-获取密钥失败-3-", keyInfos);
            return null;
        }
    }

    // 账户配置信息
    const { accountConfig } = eventCommon.fnConfigRU();

    // 自己的私key，同账户app的公key
    const { privateKey } = accountConfig;

    // 解密出真实的密钥
    let key = null;
    try {
         key = secret(privateKey, keyInfos.publicKey).toUpperCase();
    } catch (error) {
        console.error('解密-生成秘钥异常-2-',privateKey, keyInfos)
    }
   
    const msgKeyBuffer = Uint8Array.from(Buffer.from(keyInfos.msgKey, "hex"));
    let msgkey = null; 
    try {
      msgkey = _decrypt(msgKeyBuffer, key);
    } catch (error) {
        console.error('解密异常-msgkey-', privateKey, keyInfos)
    }
    const buffer = ConcatInt8([
        Uint8Array.from([10]),
        Uint8Array.from([msgkey.byteLength]),
        msgkey,
    ]);

    // 返回真实的群密钥
    return fnUtf8ArrayToStr(buffer).trim();
};

/**
 * 密钥信息获取
 */
export const fnFriendRelKeyGet = async ({
    id,
    msgEncryptionVersion,
    source,
    isSelf,
}) => {
    // 登录的id
    const loginId = eventCommon.fnCommonInfoRU({ getId: "loginId" });

    // 账户配置信息
    const { accountConfig } = eventCommon.fnConfigRU();

    // 自己的私key，同账户app的公key
    const { privateKey, appKeyPair: appKeyPairOwn } = accountConfig;

    // 如果是助手
    if (msgEncryptionVersion === -1 && id === 10002) {
        // 同账户的 app 密钥
        try {
            return {
                appOwn: {
                    relKey: secret(
                        privateKey,
                        appKeyPairOwn.publicKey
                    ).toUpperCase(),
                    keyVersion: appKeyPairOwn.keyVersion,
                },
            };
        } catch (error) {
            console.error("解密-生成秘钥异常-1-", accountConfig)
        }
       
    }

    // 旧的密钥信息
    const keyInfos = friendKeyObjs[id] || {};

    // 使用的密钥信息
    let keyInfosActive = null;

    if (msgEncryptionVersion === -1) {
        // 获取最新
        for (const key of Object.keys(keyInfos)) {
            if (!keyInfosActive) {
                keyInfosActive = {};
            }

            const keyVersion = Number(
                key.replace("app-", "").replace("pc-", "")
            );

            if (key.includes("app")) {
                if (
                    !keyInfosActive.appKeyPair ||
                    keyInfosActive.appKeyPair.keyVersion < keyVersion
                ) {
                    keyInfosActive.appKeyPair = {
                        publicKey: keyInfos[key],
                        keyVersion,
                    };
                }
            } else {
                if (
                    !keyInfosActive.webKeyPair ||
                    keyInfosActive.webKeyPair.keyVersion < keyVersion
                ) {
                    keyInfosActive.webKeyPair = {
                        publicKey: keyInfos[key],
                        keyVersion,
                    };
                }
            }
        }
    } else if (!isSelf && keyInfos) {
        // 指定版本，肯定是收到消息，如果是同账户发的信息，不需要去获取
        const publicKey =
            keyInfos[(source === 1 ? "pc-" : "app-") + msgEncryptionVersion];

        if (publicKey) {
            if (source === 1) {
                keyInfosActive = {
                    webKeyPair: {
                        publicKey,
                    },
                };
            } else {
                keyInfosActive = {
                    appKeyPair: {
                        publicKey,
                    },
                };
            }
        }
    }

    // 如果指定版本的密钥不存在，则需要api获取
    if (!keyInfosActive && (!isSelf || msgEncryptionVersion === -1)) {
        const params = {
            targetId: id,
        };

        if (source === 1) {
            // pc
            params.webKeyVersion = msgEncryptionVersion;
        } else {
            // 手机
            params.appKeyVersion = msgEncryptionVersion;
        }

        // api获取密钥
        const keyPair = await GetKeyPair(params);

        if (keyPair) {
            const { appKeyPair, webKeyPair } = keyPair;

            const appKeyVersion = _.get(appKeyPair, "keyVersion");
            const pcKeyVersion = _.get(webKeyPair, "keyVersion");

            // 如果
            if (appKeyVersion || pcKeyVersion) {
                if (appKeyVersion) {
                    keyInfos["app-" + appKeyVersion] = appKeyPair.publicKey;

                    if (source === 0 || msgEncryptionVersion === -1) {
                        keyInfosActive = {
                            ...keyInfosActive,
                            appKeyPair,
                        };
                    }
                }

                if (pcKeyVersion) {
                    keyInfos["pc-" + pcKeyVersion] = webKeyPair.publicKey;

                    if (source === 1 || msgEncryptionVersion === -1) {
                        keyInfosActive = {
                            ...keyInfosActive,
                            webKeyPair,
                        };
                    }
                }
                // 记录
                friendKeyObjs[id] = keyInfos;

                // 保存到本地
                Cache(`${loginId}-friend-key-objs`, friendKeyObjs);
            } else {
                // 解密错误
                console.error("解密-获取密钥失败-1-", keyPair, params);
                return null;
            }
        } else {
            // 解密错误
            console.error("解密-获取密钥失败-2-", keyPair, params );
            return null;
        }
    }

    const { appKeyPair, webKeyPair } = keyInfosActive || {};

    if (msgEncryptionVersion === -1) {
        try {
             // 发送消息加密用
            const data = {
                appOwn: {
                    relKey: secret(
                        privateKey,
                        appKeyPairOwn.publicKey
                    ).toUpperCase(),
                    keyVersion: appKeyPairOwn.keyVersion,
                },
            };

            if (webKeyPair) {
                data.pc = {
                    relKey: secret(privateKey, webKeyPair.publicKey).toUpperCase(),
                    keyVersion: webKeyPair.keyVersion,
                };
            }

            if (appKeyPair) {
                data.app = {
                    relKey: secret(privateKey, appKeyPair.publicKey).toUpperCase(),
                    keyVersion: appKeyPair.keyVersion,
                };
            }

            return data;
        } catch (error) {
            console.error('解密-生成秘钥异常-3-',privateKey, appKeyPairOwn, webKeyPair, appKeyPair)
        }
    } else {
        try {
             // 收到消息解密用
            if (isSelf) {
                // 同账户的 app 密钥
                return secret(privateKey, appKeyPairOwn.publicKey).toUpperCase();
            }

            if (source === 1) {
                // 好友的 pc 密钥
                return secret(privateKey, webKeyPair.publicKey).toUpperCase();
            }

            // 好友的 app 密钥
            return secret(privateKey, appKeyPair.publicKey).toUpperCase();
        } catch (error) {
            console.error('解密-生成秘钥异常-4-',privateKey, appKeyPairOwn, webKeyPair, appKeyPair)
        }
       
    }
};

/**
 * 消息解密
 */
export const fnMsgDecryption = async ({
    id,
    type,
    msgType,
    msgEncryptionVersion,
    content,
    attachmentKey,
    source,
    isSelf,
}) => {
    // 新的内容
    let contentNew = content;

    // 文件密钥
    let fileKey = null;

    // 有加密版本才需要解密
    if (msgEncryptionVersion) {
        let relKey = "";

        if (type === "group") {
            relKey = await fnGroupRelKeyGet(id);

            // 如果群密钥没获取到，则直接结束
            if (!relKey) {
                console.error("群消息 解密失败-1-");
                return {};
            }

            // 群消息解密
            try {
                contentNew = _decrypt(content, relKey);
            } catch (err) {
                // 消息解密失败
                console.error("群消息 解密失败-2-");
                return {};
            }
        } else {
            relKey = await fnFriendRelKeyGet({
                id,
                msgEncryptionVersion,
                source,
                isSelf,
            });

            // 如果好友密钥没获取到，则直接结束
            if (!relKey) {
                console.error("好友消息 解密失败");
                return {};
            }

            // 解密
            try {
                contentNew = _decrypt(content, relKey);
            } catch (err) {
                // 消息解密失败
                console.error("消息 解密失败");
                return {};
            }
        }

        if (attachmentKey) {
            try {
                fileKey = fnUtf8ArrayToStr(
                    _decrypt(Buffer.from(attachmentKey, "hex"), relKey),
                    "all"
                );
            } catch (err) {
                console.error("fileKey 解密失败");
            }
        }
    }

    // 附加信息解码
    const otherInfo = fnOtherUtf8ArrayToStr(contentNew, msgType);

    // 内容解析字符串
    const contentStr = fnUtf8ArrayToStr(contentNew, msgType);

    return {
        otherInfo,
        contentStr,
        fileKey,
    };
};

/**
 * buffer转字符串 todo 临时兼容之前的格式 后面可换成返回对象
 */
const fnUtf8ArrayToStr = (buffer, type) => {
    const UnitBuffer = Uint8Array.from(buffer);

    switch (type) {
        case "all": {
            const encodedString = String.fromCodePoint.apply(
                null,
                new Uint8Array(buffer)
            );
            return decodeURIComponent(escape(encodedString)); //没有这一步中文会乱码
        }
        case enumMsgType.image: {
            // 图片
            const imgObj = ImageObj.decode(UnitBuffer);
            const txt = `${imgObj.url}||${imgObj.thumbUrl}||${Number(
                imgObj.fileSize
            )}||${imgObj.sizeType}`;

            if (imgObj.ref) {
                txt = fnFormartMsgToStr(imgObj.ref, txt);
            }
            return txt;
        }
        case enumMsgType.gif: {
            // gif
            const dynamicImageObj = DynamicImageObj.decode(UnitBuffer);
            let txt = `${dynamicImageObj.url}||${dynamicImageObj.url}`;
            if (dynamicImageObj.ref) {
                txt = fnFormartMsgToStr(dynamicImageObj.ref, txt);
            }
            return txt;
        }
        case enumMsgType.file: {
            //文件
            const { size, fileUrl, name, ref } = FileObj.decode(UnitBuffer);
            let txt = `${fileUrl}||${name}||${String(size)}`;
            if (ref) {
                txt = fnFormartMsgToStr(ref, txt);
            }
            return txt;
        }
        case enumMsgType.video: {
            // 视频
            const videoObj = VideoObj.decode(UnitBuffer);
            let txt = `${videoObj.url}*P${videoObj.thumbUrl}`;
            if (videoObj.ref) {
                txt = fnFormartMsgToStr(videoObj.ref, txt);
            }
            return txt;
        }
        case enumMsgType.voice: {
            // 音频
            const audioObj = AudioObj.decode(UnitBuffer);
            let txt = `${audioObj.url}||${audioObj.duration}`;
            if (audioObj.ref) {
                txt = fnFormartMsgToStr(audioObj.ref, txt);
            }
            return txt;
        }
        case enumMsgType.shareCard: {
            // 分享名片
            const { nickName, uid, icon, ref } = NameCardObj.decode(UnitBuffer);

            let txt = icon
                ? `${nickName}*|*|*${icon}*|*|*${String(uid)}`
                : `${nickName}*|*|*${String(uid)}`;

            if (ref) {
                txt = fnFormartMsgToStr(ref, txt);
            }
            return txt;
        }
        case enumMsgType.groupNotice: {
            // 群公告
            return GroupNoticeObj.decode(UnitBuffer).content;
        }
        case enumMsgType.dice: {
            // 骰子
            const data = SetImageObj.decode(UnitBuffer);
            if (data.ref && data.ref.msgId && Number(data.ref.msgId)) {
                return `${data.currentImage}||${Number(data.ref.msgId)}`;
            }
            return data.currentImage;
        }
        case enumMsgType.address: {
            // 地址
            return LocationObj.decode(UnitBuffer).address;
        }
        case enumMsgType.redEnvelope: {
            // 红包
            return "[红包消息，暂不支持]";
        }
        case enumMsgType.transfer: {
            // 转账
            return "[转账消息，暂不支持]";
        }
        case enumMsgType.payments: {
            // 转账收款
            return "[收款消息，暂不支持]";
        }
        case enumMsgType.system: {
            // 系统消息
            return SystemObj.decode(UnitBuffer).content;
        }
        case enumMsgType.animatedGame: {
            // 扑克游戏
            const data = AnimatedGameObj.decode(UnitBuffer);
            if (data.ref && data.ref.msgId && Number(data.ref.msgId)) {
                return `${data.currentImage}||${Number(data.ref.msgId)}`;
            }
            return data.currentImage;
        }
        default: {
            // 文本
            const { content, ref } = TextObj.decode(UnitBuffer);
            if (ref && Number(ref.uid) != 0) {
                return fnFormartMsgToStr(ref, content);
            }
            return content;
        }
    }
};

/**
 * 附加信息解码
 */
const fnOtherUtf8ArrayToStr = (buffer, type) => {
    let UnitBuffer = Uint8Array.from(buffer);
    if (type == enumMsgType.TWMessageTypeRobot) {
        return HtmlObj.decode(UnitBuffer);
    } else {
        return {};
    }
};

/**
 * 格式化消息为字符串
 */
const fnFormartMsgToStr = (ref, str) => {
    const map = {
        1: "[图片]",
        2: "[语音]",
        3: "[视频]",
        4: "[位置]",
        5: "[名片]",
        6: "[系统]",
        7: "[文件]",
        8: "[群公告]",
        9: "[动图]",
        12: "[骰子]",
        18: "[扑克牌]",
    };

    const { msgId, content, nickname, uid, type } = ref;

    return `${str}${type ? "-||-type:" + map[type] : ""}${
        content ? "-||-content:" + content : ""
    }-||-uid:${String(uid)}-||-name:${nickname}-||-msgId:${String(msgId)}`;
};

/**
 * 字符串转流
 */
const fnEncode = (str, type, picData) => {
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
            let { fileName: name, fileType: mimeType, size } = picData;
            return FileObj.encode({
                size,
                fileUrl: str,
                name,
                mimeType,
            }).finish();
        }
        case enumMsgType.video: {
            // 视频
            let { width, height, thumbUrl, size, duration } = picData;
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
            let dataList = str.split("*|*|*");
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
        case enumMsgType.animatedGame: {
            // 扑克游戏
            return AnimatedGameObj.encode({
                gameId: 1,
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
};

/**
 * 格式化消息参数
 */
export const fnFormartMsgParams = async ({ data, customMsgId, id, type }) => {
    const {
        groupId,
        text,
        sendTime,
        msgType,
        chatType,
        width,
        height,
        size,
        fileName,
        fileType,
        thumbUrl,
        duration,
        atUsers,
        receiveUid,
        groupAttachmentKey,
        ownAppAttachmentKey,
        appAttachmentKey,
        webAttachmentKey,
    } = data;

    // 是否是官方
    const isOfficial =
        receiveUid &&
        receiveUid >= 10000 &&
        receiveUid <= 100000 &&
        receiveUid != 10002;

    const contentCode = fnEncode(text, msgType, {
        width,
        height,
        size,
        fileName,
        fileType,
        thumbUrl,
        duration,
    });

    const params = {
        msgId: null, // 消息ID
        sendUid: null, // 发送人uid
        receiveUid: null, // 接收人uid
        msgType, // 消息类型
        contentMd5: md5(contentCode), // 消息内容md5值
        sendTime: Number(sendTime), // 发送时间
        sendUser: null, // 发送者信息
        snapchatTime: 0, // 阅后即焚设置时间 5秒， 10秒
        source: 1, // 消息来源 add v1.2.0
        customMsgId,
        atUsers,
    };

    // 如果为骰子或者官方，则不加密
    if (chatType == enumMsgType.dice || chatType == enumMsgType.animatedGame  || isOfficial) {
        params.content = contentCode;

        params.appContent = {
            content: contentCode,
        };

        params.webContent = {
            content: contentCode,
        };

        params.myselfAppContent = {
            content: contentCode,
        };
    } else {
        if (type === "group") {
            // 如果是群，版本固定
            params.version = 1;

            // 文件 密钥
            params.attachmentKey = groupAttachmentKey;

            // 获取真实的密钥
            const relKey = await fnGroupRelKeyGet(id);

            // 如果群密钥没获取到，则直接结束
            if (!relKey) {
                window.$toast(i18n.t("密钥异常，发送消息失败"));
                return;
            }

            // 加密内容
            params.content = _encrypt2(relKey, contentCode);
        } else {
            const { accountConfig } = eventCommon.fnConfigRU();
            params.version = accountConfig.keyVersion;

            const data = await fnFriendRelKeyGet({
                id,
                msgEncryptionVersion: -1,
                source: 1,
                isSelf: true,
            });

            if (!data) {
                console.log(2);
                window.$toast(i18n.t("密钥异常，发送消息失败"));
                return;
            }

            const { app, pc, appOwn } = data;

            // 如果群密钥没获取到，则直接结束
            if (!app && !pc && id !== 10002) {
                window.$toast(i18n.t("密钥异常，发送消息失败"));
                return;
            }

            if (app) {
                params.appContent = {
                    content: _encrypt2(app.relKey, contentCode),
                    attachmentKey: appAttachmentKey,
                    version: app.keyVersion,
                };
            }

            if (pc) {
                params.webContent = {
                    content: _encrypt2(pc.relKey, contentCode),
                    attachmentKey: webAttachmentKey,
                    version: pc.keyVersion,
                };
            }

            if (appOwn) {
                params.myselfAppContent = {
                    content: _encrypt2(appOwn.relKey, contentCode),
                    attachmentKey: ownAppAttachmentKey,
                    version: appOwn.keyVersion,
                };
            }
        }
    }

    if (type === "group") {
        params.groupId = groupId;
    } else {
        params.receiveUid = receiveUid;
    }

    return { atUids: [], ...data, ...params };
};

/**
 * 更新好友的密钥
 */
export const fnUpdateKeyFriend = async ({ appKeyPair, webKeyPair, uid }) => {
    const friendId = Number(uid);

    if (appKeyPair || webKeyPair) {
        if (!friendKeyObjs[friendId]) {
            friendKeyObjs[friendId] = {};
        }

        // app的key
        if (appKeyPair) {
            friendKeyObjs[friendId]["app-" + appKeyPair.keyVersion] =
                appKeyPair.publicKey;
        }

        // pc的key
        if (webKeyPair) {
            friendKeyObjs[friendId]["pc-" + webKeyPair.keyVersion] =
                webKeyPair.publicKey;
        }

        // 登录的id
        const loginId = eventCommon.fnCommonInfoRU({ getId: "loginId" });

        // 保存到本地
        Cache(`${loginId}-friend-key-objs`, friendKeyObjs);

        // 确认收到
        const version =
            (appKeyPair && appKeyPair.keyVersion) ||
            (webKeyPair && webKeyPair.keyVersion);
        ReceiveKeyPairMessage({ version, sendUid: friendId });
    }
};
