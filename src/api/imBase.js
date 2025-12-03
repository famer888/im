/**
 *功能：基础接口
 *作者：long
 *时间：2022年10月01日 16:28:44
 *版本：v1.3.0
 * */
import { getUrl, baseBuildUrl, baseUrl, getSignHeader, FairGuard } from "./base/unit";
import axios from "axios";
const crypto = require('crypto');
import eventCommon from "@/event/common.js";

// 获取token
export const getQrCodeUrl = (errCallback) =>
    getUrl(
        // { type: "QrCodeUrl", url: `${baseBuildUrl}/login/qrCodeUrl` },
        { type: "QrCodeUrl", url: `${baseUrl()}/login/qrCodeUrl` },
        errCallback
    );
export const getIsLogin = (data) =>
    // getUrl({ type: "IsLogin", url: `${baseBuildUrl}/login/isLogin`, data });
    getUrl({ type: "IsLogin", url: `${baseUrl()}/login/isLogin`, data });
export const getUserInfo = (data) =>
    getUrl({ type: "UserInfo", url: `${baseUrl()}/user/userInfo`, data });
export const GetKeyPairList = (data) =>
    getUrl({
        type: "GetKeyPairList",
        url: `${baseUrl()}/sys/GetKeyPairList`,
        data,
    });
export const UpdateKeyPair = (data) =>
    getUrl({
        type: "UpdateKeyPair",
        url: `${baseUrl()}/sys/updateKeyPair`,
        data,
    });
export const GetKeyPair = (data) =>
    getUrl({ type: "GetKeyPair", url: `${baseUrl()}/sys/getKeyPair`, data });
export const UpdateContacts = (data) =>
    getUrl({
        type: "UpdateContacts",
        url: `${baseUrl()}/contacts/updateContacts`,
        data,
    });
export const getUploadToken = (data) =>
    getUrl({
        type: "GetUploadToken",
        url: `${baseUrl()}/sys/getUploadToken`,
        data,
    });
export const getUploadUrl = (data) =>
    getUrl({
        protoType: "sys",
        type: "GetUploadUrl",
        url: `${baseUrl()}/sys/getUploadUrl`,
        data,
    });
export const checkVersion = (data) =>
    getUrl({
        type: "CheckVersion",
        url: `${baseUrl()}/sys/checkVersion`,
        data,
    });
export const updateUserInfo = (data) =>
    getUrl({ type: "Update", url: `${baseUrl()}/user/update`, data });
export const UploadLog = (data) =>
    getUrl({
        type: "UploadLog",
        url: `${baseUrl()}/sys/uploadAbnormalLog`,
        data,
    });
export const getChatSensitive = (data) =>
    getUrl({
        protoType: "user",
        type: "GetChatSensitive",
        url: `${baseUrl()}/user/getChatSensitive`,
        data,
    });
export const ListUrlReq = (data) =>
    getUrl({
        protoType: "domain_url",
        type: "ListUrl",
        url: `${baseUrl("domain")}/domain/QueryUrlList`,
        data,
    });
export const CreateArchiveReq = (data) =>
    getUrl({
        protoType: "user",
        type: "CreateArchive",
        url: `${baseUrl()}/user/createArchive`,
        data,
    });
export const QueryArchiveReq = (data) =>
    getUrl({
        protoType: "user",
        type: "QueryArchive",
        url: `${baseUrl()}/user/queryArchive`,
        data,
    });
export const RemoveArchiveReq = (data) =>
    getUrl({
        protoType: "user",
        type: "RemoveArchive",
        url: `${baseUrl()}/user/removeArchive`,
        data,
    });

export const getGameGlobalConfig = (data) =>
    requestAxios(`https://test-gateway.68chat.co/channel/getChannelById`,{
    // requestAxios(`http://test-gateway.68chat.co/global-config/globalConfig/getGameGlobalConfig`,{
    // requestAxios(`https://dev-gateway.68chat.co/global-config/globalConfig/getGameGlobalConfig`,{
        // "X-Client-Info": eventCommon.fnClientInfoGet(),
        ...data
    }, {
        headers: {
            // "X-Client-Info": JSON.stringify(eventCommon.fnClientInfoGet()),
            ...getSignHeader()
        }
    });

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
    const cipher = crypto.createCipheriv('aes-128-ecb', Buffer.from(key), null);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return Buffer.from(encrypted, 'hex');
}

// Convert integer to bytes (big-endian)
function toBytes(val) {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(val, 0);
    return buffer;
}


function postEncrypted(key, data) {
    // Convert data to string if it's an object
    if (typeof data === 'object') {
        data = JSON.stringify(data);
    }

    const dataBuffer = Buffer.from(data, 'utf8');
    const signed = aesEncode(dataBuffer, key);

    // Create header [0xC1, 0x80]
    const header = Buffer.from([0xC1, 0x80]);

    // Create length buffer (4 bytes)
    const length = toBytes(signed.length);

    // Combine buffers
    return concatBuffers([header, length, signed]);
}


function requestAxios(url, params, opts) {
    const {
        method = "POST",
        headers ={}
    } = opts || {}
    const bodyAesKey = "f7c49b85cfd76e76"
    const reqBody = {
        "channelId": 100095
    };

     const encryptedBody = postEncrypted(bodyAesKey, reqBody);

    return new Promise( async (resolve, reject) => {

        const finalHeaders = {
            'Content-Type': 'application/octet-stream',
             ...headers };
        const httpDefault = {
            method,
            url: url,
            data:  encryptedBody,
            timeout: 5000,
            headers: finalHeaders, // 设置请求头
        };
        axios(httpDefault)
        .then((res) => {
            if(res.code === 200) {
                FairGuard.recieve(res);
                resolve(res.data);
            }else {
                reject(res)
            }
        }).catch(err => {
            reject(err)
        })
    })
}
