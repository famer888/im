/**
 *功能：基础接口
 *作者：long
 *时间：2022年10月01日 16:28:44
 *版本：v1.3.0
 * */
import { getUrl, baseBuildUrl, baseUrl, getSignHeader } from "./base/unit";
import { decrypt } from "./base/index";
import axios from "axios";
const crypto = require("crypto");
import eventCommon from "@/event/common.js";
const JSONBig = require("json-bigint")({ storeAsString: true });

const bodyAesKey = process.env.VUE_APP_SECRET_KEY;
const domainUrl =  process.env.VUE_APP_OPEN_CHAT_DOMAIN;

export const channelCheckJoin = (data) => {
  return requestAxios(`/channel/channelEventReq/userCheckJoin`, data, {
    bigIntRequestKeys: ['id'],
    headers: {
      ...getSignHeader(),
    },
    useBigIntResponseBody: true,
  });
}
// 获取频道最后的一条消息信息
export const getChannelLastMsgInfo = (data) => {
    return requestAxios(`/message/channelMessage/latestId`, data, {
        headers: {
           "Content-Type": "application/json",
            ...getSignHeader(),
        },
    });
};

// 获取频道列表
export const getChannelList = (data) => {
    return requestAxios(`/channel/channelList`, data, {
        headers: {
            ...getSignHeader(),
        },
    });
};

// 查询频道成员
export const getChannelUsers = (data) => {
    return requestAxios(
        `/channel/channelMember/pageChannelNormalMember`,
        data,
        {
            headers: {
                ...getSignHeader(),
            },
        }
    );
};

// 查询频道管理列表
export const getChannelManages = (data) => {
    return requestAxios(
        `/channel/channelAdminRight/pageAdmin`,
        data,
        {
            headers: {
                ...getSignHeader(),
            },
        }
    );
};

// 获取频道事件请求列表
export const getChannelEventList = (data) => {
    return requestAxios(`/channel/channelEventReq/listChannelEventReq`, data, {
        headers: {
            ...getSignHeader(),
        },
        useBigIntResponseBody: true,
    });
};

// 查询频道详情
export const getChannelDetail = (data) => {
    return requestAxios(`/channel/getChannelById`, data, {
        headers: {
            ...getSignHeader(),
        },
    });
};

// 修改频道信息
export const updateChannel = (data) => {
    return requestAxios(`/channel/updateChannel`, data, {
        headers: {
            ...getSignHeader(),
        },
    });
};

// 查询是否是频道链接
export const isChannelLink = (data) => {
    return requestAxios(`/channel/getChannelByLink`, data, {
        headers: {
            ...getSignHeader(),
        },
    });
};

// 加入频道
export const subscribeChannel = (data) => {
    return requestAxios(`/channel/channelMember/subscribeChannel`, data, {
        headers: {
            ...getSignHeader(),
        },
    });
};

export const searchAliasContent = (data) => requestAxios('/user/search/content', data, {
  headers: {
    ...getSignHeader(),
  },
})


// 更新成员信息
export const updateMember = (data) => {
    return requestAxios(`/channel/channelMember/updateMember`, data, {
        headers: {
            ...getSignHeader(),
        },
    });
};

// 移除管理员
export const deleteManage = (data) => {
    return requestAxios(`/channel/channelAdminRight/delete`, data, {
        headers: {
            ...getSignHeader(),
        },
    });
};

// // 拉取历史消息
export const getHistoryMsgs = (data) =>
    getUrl({
        protoType: "channel_api",
        type: "MessageList",
        url: `${domainUrl}/message/channelMessage/list`,
        customAesKey: bodyAesKey,
        data,
         headers: {
            ...getSignHeader(),
            'Accept': 'application/x-protobuf',
            'content-type': 'application/x-protobuf',
        },
    });

export const getGameGlobalConfig = (data) =>
    requestAxios(
        `/channel/getChannelById`,
        {
            // requestAxios(`http://test-gateway.68chat.co/global-config/globalConfig/getGameGlobalConfig`,{
            // requestAxios(`https://dev-gateway.68chat.co/global-config/globalConfig/getGameGlobalConfig`,{
            // "X-Client-Info": eventCommon.fnClientInfoGet(),
            ...data,
        },
        {
            headers: {
                // "X-Client-Info": JSON.stringify(eventCommon.fnClientInfoGet()),
                ...getSignHeader(),
            },
        }
    );

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
    const cipher = crypto.createCipheriv("aes-128-ecb", Buffer.from(key), null);
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
                    const responseData = Buffer.from(res.data);
                    const header = responseData.slice(0, 6);
                    const body = responseData.slice(6);
                    // console.log('requestAxios--', body)
                    const result = aesDecode(body, bodyAesKey);
                        //    console.log('requestAxios-2-', result)
                    resolve(useBigIntResponseBody ? JSONBig.parse(result) : JSON.parse(result));
                } else {
                    reject(res);
                }
            })
            .catch((err) => {
                reject(err);
            });
    });
}

const aesDecrypted = (decodedBody) => {
    // Decrypt response
    const cipher = crypto.createDecipheriv(
        "aes-128-ecb",
        Buffer.from(bodyAesKey),
        null
    );
    let decrypted = cipher.update(decodedBody);
    decrypted = Buffer.concat([decrypted, cipher.final()]);
    // Convert to string
    const decryptedStr = decrypted.toString("utf8");
    return decryptedStr;
};

function aesDecode(encryptedData) {
    // 将加密数据从 Buffer 转换为十六进制字符串（如果输入是 Buffer）
    let encryptedHex = encryptedData.toString("hex");

    // 创建解密器
    const decipher = crypto.createDecipheriv(
        "aes-128-ecb",
        Buffer.from(bodyAesKey),
        null
    );

    // 解密数据
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}
