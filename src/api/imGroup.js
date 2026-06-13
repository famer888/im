/**
 *功能：群组接口
 *作者：long
 *时间：2022年10月01日 16:28:44
 *版本：v1.3.0
 * */
import { getUrl, baseUrl, getSignHeader } from "./base/unit";
import axios from "axios";
const crypto = require("crypto");
const JSONBig = require("json-bigint")({ storeAsString: true });
import { FairGuard } from "./base/unit";
import eventCommon from "@/event/common.js";
const bodyAesKey = process.env.VUE_APP_SECRET_KEY;
const domainUrl =  process.env.VUE_APP_OPEN_CHAT_DOMAIN;


// 获取群列表
export const getGroupContactList = (data, errCallback) =>
    getUrl(
        {
            type: "GroupContactList",
            url: `${baseUrl()}/group/groupContactList`,
            data,
        },
        errCallback
    );
// 获取群详情
export const getGroupDetail = (data, errCallback) =>
    getUrl(
        {
            type: "GroupDetail",
            url: `${baseUrl()}/group/groupDetail`,
            data,
        },
        errCallback
    );
// 获取群成员列表
export const getGroupMemberList = (data, errCallback) =>
    getUrl(
        {
            type: "GroupMemberList",
            url: `${baseUrl()}/group/groupMemberList`,
            data,
        },
        errCallback
    );
// 获取群成员列表
export const getGroupMemberListV2 = (data, errCallback) =>
    getUrl(
        {
            type: "GroupMemberList",
            protoType: "group",
            url: `${baseUrl()}/group/groupMemberListV2`,
            data,
        },
        errCallback
    );
// 获取最新事件消息ID接口
export const getGroupEventLatest = (data, errCallback) =>
    getUrl(
        {
            type: "GroupEventLatest",
            protoType: "group_message",
            url: `${baseUrl()}/group/groupEventLatest`,
            data,
        },
        errCallback
    );

// 新增删除群
export const GroupMember = (data) =>
    getUrl({
        type: "GroupMember",
        url: `${baseUrl()}/group/groupMember`,
        data,
    });
// 修改群设置
export const GroupUpdate = (data) =>
    getUrl({
        type: "GroupUpdate",
        url: `${baseUrl()}/group/groupUpdate`,
        data,
    });
// 获取群消息列表
export const getGroupReqList = (data) =>
    getUrl({
        type: "GroupReqList",
        url: `${baseUrl()}/group/groupReqList`,
        data,
    });
// 获取群消息列表
export const getGroupReqListV2 = (data) =>
    getUrl({
        type: "GroupReqList",
        url: `${baseUrl()}/group/groupReqListV2`,
        data,
    });
// 编辑群聊
export const groupMsgReceipt = (data) =>
    getUrl({
        type: "GroupReqList",
        url: `${baseUrl()}/group/groupMsgReceipt`,
        data,
    });
// 审核
export const groupCheckJoin = (data) =>
    getUrl({
        type: "GroupCheckJoin",
        url: `${baseUrl()}/group/groupCheckJoin`,
        data,
    });
// 入群邀请审核
export const GroupUserCheckJoin = (data) =>
    getUrl({
        type: "GroupUserCheckJoin",
        url: `${baseUrl()}/group/groupUserCheckJoin`,
        data,
    });
// 删除群申请记录
// export const DelGroupReqRecord = (data) =>
//     getUrl({
//         type: "DelGroupReqRecord",
//         url: `${baseUrl()}/group/delGroupReqRecord`,
//         data,
//     });

// 绑定机器人
export const groupBindBot = (data) => {
    return getUrl({
        type: "WebGroupBindBot",
        url: `${baseUrl()}/group/groupBindBot`,
        data,
    });
};
// 移除群管理
export const groupRemoveAdmin = (data) => {
    return getUrl({
        type: "GroupRemoveAdmin",
        url: `${baseUrl()}/group/groupRemoveAdmin`,
        data,
    });
};
// 通过群别名查群详情或通讯号查用户详情
export const groupOrUserDetail = (data) => {
    return getUrl({
        type: "GroupOrUser",
        url: `${baseUrl()}/group/groupOrUserDetail`,
        data,
    });
};
// 加入群聊
export const groupJoin = (data) => {
    return getUrl({
        protoType: "group",
        type: "GroupJoin",
        url: `${baseUrl()}/group/groupJoin`,
        data,
    });
};

// 获取群二维码
export const groupQrCode = (data) =>
    getUrl({
        protoType: "group",
        type: "GroupQrCode",
        url: `${baseUrl()}/group/groupQrCode`,
        data,
    });

// 获取和好友共同群信息
export const getfriendCommonGroupList = (data) =>
    getUrl({
        type: "FriendCommonGroupList",
        url: `${baseUrl()}/group/friendCommonGroupList`,
        data,
    });

// 获取补偿信息
export const getGroupEventList = (data, errCallback) =>
    getUrl(
        {
            protoType: "group_message",
            type: "GroupEvent",
            url: `${baseUrl()}/group/groupEventList`,
            data,
        },
        errCallback
    );

// 群成员在线状态
export const groupMemberOnLineStatusList = (data) =>
    getUrl({
        protoType: "group",
        type: "GroupMemberOnLineStatusList",
        url: `${baseUrl()}/group/groupMemberOnLineStatusList`,
        data,
    });

// 强制群初始化接口
export const groupEventForceInit = (data, errCallback) =>
    getUrl(
        {
            protoType: "group_message",
            type: "GroupEventForceInit",
            url: `${baseUrl()}/group/groupEventForceInit`,
            data,
        },
        errCallback
    );

// 查询群链接
export const queryGroupLink = (data) =>
    getUrl({
        protoType: "group",
        type: "GroupDetailFromQrCode",
        url: `${baseUrl()}/group/groupDetailFromQrCode`,
        data,
    });

// 群别名查询群
export const groupSearch = (data) =>
    getUrl({
        type: "GroupOrUser",
        url: `${baseUrl()}/group/groupSearch`,
        data,
    });

// 解散群聊
export const disableGroup = (data) =>
    getUrl({
        protoType: "group",
        type: "DisableGroup",
        url: `${baseUrl()}/group/disableGroup`,
        data,
    });

// 退出群聊
export const groupExit = (data) =>
    getUrl({
        protoType: "group",
        type: "GroupExit",
        url: `${baseUrl()}/group/groupExit`,
        data,
    });

// 删除或增加群成员
export const manageGroupMember = (data) =>
    getUrl({
        protoType: "group",
        type: "GroupMember",
        url: `${baseUrl()}/group/groupMember`,
        data,
    });

// 短链转长链
export const groupQrUrlFromShortLink = (data) =>
    getUrl({
        protoType: "group",
        type: "GroupQrUrlFromShortLink",
        url: `${baseUrl()}/group/groupQrUrlFromShortLink`,
        data,
    });

// 群配置（全局配置 禁用无感知）
export const groupGlobalConfigAPI = (data) => {
    return requestAxios(`/group/groupConfig/globalConfig`, data, {
        headers: {
            ...getSignHeader(),
        },
    });
};

// OSS 上传 token（gateway 域名，与 globalConfig 一致）
export const getUploadTokenAPI = (data = {}) =>
    requestAxios(`/sys/unauthorized/uploadConfig/getUploadToken`, data, {
        headers: {
            ...getSignHeader(),
        },
    });

// OSS 上传 url（gateway 域名，与 globalConfig 一致）
export const getUploadUrlAPI = (data = {}) =>
    requestAxios(`/sys/unauthorized/uploadConfig/getUploadUrl`, data, {
        headers: {
            ...getSignHeader(),
        },
    });

// 查询群申请UID列表
export const checkUidList = (data) => {
    return requestAxios(`/group/groupReq/checkUidList`, data, {
        headers: {
            ...getSignHeader(),
        },
    });
};


function concatBuffers(buffers) {
    const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
    const result = Buffer.alloc(totalLength);
    let offset = 0;

    for (const buf of buffers) {
        buf.copy(result, offset);
        offset += buf.length;
    }

    return result;
}
// AES encryption function
function aesEncode(data, key) {
    const cipher = crypto.createCipheriv("aes-128-ecb", Buffer.from(key), Buffer.alloc(0));
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");
    return Buffer.from(encrypted, "hex");
}

// Convert integer to bytes (big-endian)
function toBytes(val) {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(val, 0);
    return buffer;
}
function postEncrypted(key, data) {
    // Convert data to string if it's an object
    if (typeof data === "object") {
        data = JSON.stringify(data);
    }

    const dataBuffer = Buffer.from(data, "utf8");
    const signed = aesEncode(dataBuffer, key);

    // Create header [0xC1, 0x80]
    const header = Buffer.from([0xc1, 0x80]);

    // Create length buffer (4 bytes)
    const length = toBytes(signed.length);

    // Combine buffers
    return concatBuffers([header, length, signed]);
}
function requestAxios(url, params, opts) {
    const { method = "POST", headers = {}, bigIntRequestKeys = [], useBigIntResponseBody = false } = opts || {};
    const reqBody = params || {
        // "channelId": 100095,
        pageNum: 1,
        pageSize: 10,
    };
    // console.log('bodyAesKey', bodyAesKey)
    let reqBodyStr;
    if (bigIntRequestKeys && bigIntRequestKeys.length > 0) {
        // 先用普通 JSON.stringify 序列化
        reqBodyStr = JSON.stringify(reqBody);
        // 只对指定的 key 把字符串值转成数字（去掉引号），如 "id":"123" -> "id":123
        bigIntRequestKeys.forEach(key => {
            const regex = new RegExp(`"${key}":"(\\d+)"`, 'g');
            reqBodyStr = reqBodyStr.replace(regex, `"${key}":$1`);
        });
    } else {
        reqBodyStr = reqBody;
    }
    const encryptedBody = postEncrypted(bodyAesKey, reqBodyStr);

    return new Promise(async (resolve, reject) => {
        const finalHeaders = {
            "Content-Type": "application/octet-stream",
             'Accept': 'application/json', // 最终生效的 Accept 头，仅保留 JSON
            ...headers,
        };

        const httpDefault = {
            method,
            url: domainUrl + url,
            data: encryptedBody,
            timeout: 5000,
            headers: finalHeaders, // 设置请求头
            responseType: "arraybuffer",
        };
        axios(httpDefault)
            .then((res) => {
                if (res.status === 200) {
                    // aesDecrypted()
                    FairGuard.recieve(res);
                    const responseData = Buffer.from(res.data);
                    try {
                        const header = responseData.slice(0, 6);
                        const body = responseData.slice(6);
                        // console.log('requestAxios--', body)
                        const result = aesDecode(body, bodyAesKey);
                        //    console.log('requestAxios-2-', result)
                        const parsedResult = useBigIntResponseBody ? JSONBig.parse(result) : JSON.parse(result);
                        if (parsedResult && (parsedResult.code === 100 || (parsedResult.commonResult && parsedResult.commonResult.errCode === 100))) {
                            window.$toast(parsedResult.msg || parsedResult.commonResult?.errMsg || "登录已过期，请重新登录");
                            const { ipcRenderer } = require("@/platform");
                            ipcRenderer.send("auto-export-db", {});
                            setTimeout(() => {
                                eventCommon.fnLoginout();
                            }, 2000);
                            reject(parsedResult);
                            return;
                        }
                        resolve(parsedResult);
                    } catch (e) {
                        try {
                            const str = responseData.toString("utf8");
                            const parsedResult = useBigIntResponseBody ? JSONBig.parse(str) : JSON.parse(str);
                            if (parsedResult && (parsedResult.code === 100 || (parsedResult.commonResult && parsedResult.commonResult.errCode === 100))) {
                                window.$toast(parsedResult.msg || parsedResult.commonResult?.errMsg || "登录已过期，请重新登录");
                                const { ipcRenderer } = require("@/platform");
                                ipcRenderer.send("auto-export-db", {});
                                setTimeout(() => {
                                    eventCommon.fnLoginout();
                                }, 2000);
                                reject(parsedResult);
                                return;
                            }
                            resolve(parsedResult);
                        } catch (err) {
                            reject(e);
                        }
                    }
                } else {
                    reject(res);
                }
            })
            .catch((err) => {
                reject(err);
            });
    });
}
function aesDecode(encryptedData) {
    // 将加密数据从 Buffer 转换为十六进制字符串（如果输入是 Buffer）
    let encryptedHex = encryptedData.toString("hex");

    // 创建解密器
    const decipher = crypto.createDecipheriv(
        "aes-128-ecb",
        Buffer.from(bodyAesKey),
        Buffer.alloc(0)
    );

    // 解密数据
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}
