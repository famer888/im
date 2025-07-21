import * as $root from "./web.js";
import * as $root_user from "./user.js";
import * as $root_domain_url from "./domain_url.js";
import * as $root_sys from "./sys.js";
import * as $root_group from "./group.js";
import * as $root_group_message from "./group_message.js";
import { _decrypt, _encrypt, encrypt } from "./index";
import { getUint32Bytes } from "../../socket/unit";
require("./protobuf");
import config from "@/config.js";
import {
    getApiMacAddress,
    getApiMacAddressSync,
    getAesKeySync,
} from "@/utils/trendsAesKey";
import { getRemainingUrl } from "@/utils/base";
import { getNewNormalDomain } from "@/utils/trendsDomain";
import { getModuleType } from "@/utils/trendsDomain/workTools";
import { getMacAddress } from "@/utils/trendsDomain/tools";
import { checkModlueDomainNum } from "@/utils/trendsDomain/manageDomain";
// 事件
import eventCommon from "@/event/common.js";

// 测试环境
export const AES_KEY = process.env.VUE_APP_AES_KEY;
// export const NEW_SIGN = process.env.VUE_APP_NEW_SIGN;
// export const SECRET_NAME = process.env.VUE_APP_SECRET_NAME;
// 正式|预生产
// export const AES_KEY = 'nzV7S12FDcc5h2S7';
// 测试环境
// export const baseBuildUrl = 'https://test-webbiz.68chat.co'
// dev环境
// export const baseBuildUrl = 'http://devlogin.zsae86.com:8083'
// 正式环境
export const baseBuildUrl = process.env.VUE_APP_BASE_API;
// 预生产环境
// export const baseBuildUrl = 'http://35.220.152.12:8080'
// 联调环境
// export const baseBuildUrl = 'http://34.150.29.102:11001'

export const baseUrl = (moduleName) => {
    let moduleCode = moduleName || "webBiz";
    const domains = eventCommon.fnDomainsGet();
    const urls = eventCommon.fnCommonInfoRU({
        getId: "urls",
    });
    // console.log("domains---", domains)
    setTimeout(() => {
        checkModlueDomainNum(moduleCode);
    }, 10);
    return domains[moduleCode] || urls?.biz || baseBuildUrl;
};

function getBufferLength(list) {
    return list.reduce((sum, item) => {
        0;
        return (sum += item.length);
    }, 0);
}
function ConcatInt8(list = []) {
    let long = 0;
    let res = list.reduce((arr, item) => {
        arr.set(item, long);
        long += item.length;
        return arr;
    }, new Int8Array(getBufferLength(list)));
    return res;
}

const getRoot = (protoType) => {
    let root = $root;
    if (protoType === "user") {
        root = $root_user;
    } else if (protoType === "domain_url") {
        root = $root_domain_url;
    } else if (protoType === "sys") {
        root = $root_sys;
    } else if (protoType === "group") {
        root = $root_group;
    } else if (protoType === "group_message") {
        root = $root_group_message;
    }
    return root;
};

function getByte(text) {
    const encoder = new TextEncoder(); // 创建一个 TextEncoder 实例
    const bytes = encoder.encode(text); // 将字符串编码为 UTF-8 字节数组

    // console.log(bytes); // 输出 Uint8Array 类型的字节数组
    return bytes;
}

function aesEncode(data, key) {
    const cipher = crypto.createCipheriv("aes-128-ecb", Buffer.from(key), null);
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");
    return Buffer.from(encrypted, "hex");
}

export const getSignHeader = () => {
    const NEW_SIGN = "f58c15f54e8f7826";
    const SECRET_NAME = "4669ae8d7010521fcaf4855dbfbb1303";
    let client = eventCommon.fnClientInfoGet();
    client.appVer = 163;
    client.sysMac = getApiMacAddressSync();

    // const SECRET_NAME ="da4a207e3ea1d2d7911c2002397c60d0";
    // let client = {
    //     "language": 2,
    //     "sysModel": "iPhone 30 Simulator",
    //     "sessionId": "fb67f512beea5f00000038fbb5ef3df7",
    //     "sysMac": "e72c8fecc70838e5a960c0299160a18bcoin",
    //     "appVer": 580,
    //     "plat": 0,
    //     "packageCode": 1000
    // }

    let clientStr = JSON.stringify(client);

    const timestamp = Date.now();
    const tenStr = `${clientStr}//${timestamp}`;
    const oneStr = `${SECRET_NAME},${timestamp}`;

    const ten = encrypt(tenStr, NEW_SIGN);
    const one = encrypt(oneStr, NEW_SIGN);

    const tenOrigin = clientStr + "//" + timestamp;
    const result = {
        "X-one": one,
        "X-ten": ten,
        "X-ten-origin": JSON.stringify(tenOrigin),
    };
    return result;
};

export const getUrl = async (opts, errCallback) => {
    //  console.log(url,"传入值===》", data);
    const { isRepairDomain = true } = opts || {};
    let result = {};
    try {
        result = await requestApi(opts, errCallback);
    } catch (error) {
        let code = error.errorCode;
        if (isRepairDomain && error.errorCode < 500) {
            let newUrl = await replaceNewDomain(opts.url);
            if (newUrl) {
                opts.url = newUrl;
                result = await requestApi(opts, errCallback);
            }
        } else {
            result = error;
        }
    }
    console.log('requestApi--r-', result)
    return result;
};

// Url替换新域名
const replaceNewDomain = async (url) => {
    //  console.log("replaceNewDomain-1-", url)
    let moduleCode = getModuleType(url).name || "webBiz";
    let newDomain = (await getNewNormalDomain(moduleCode)) || "";
    if (!newDomain) return "";
    let newUrl = newDomain.replace(/\/$/, "") + getRemainingUrl(url);
    store.commit("user/setDomainsAttrib", {
        key: moduleCode,
        value: newDomain,
    });
    return newUrl;
};

const requestApi = async (opt, errCallback) => {
    let {
        method = "POST",
        type,
        url,
        protoType,
        data = {},
        headers = {},
        noEncrypt = false,
    } = opt;

    return new Promise(async (resolve, reject) => {
        let header = new Headers();
        let { aesKey } = noEncrypt ? {} : await handleTrendsAesKeyPrams(header);

        let params = {
            clientInfo: eventCommon.fnClientInfoGet(),
            ...data,
        };

        let array = noEncrypt
            ? params
            : handleEncode({ protoType, type, params, aesKey });

        //  console.log("requestApi--",url, array, header)

        fetch(url, {
            method,
            body: array,
            headers: { ...header, ...headers },
        })
            .then((response) => {
                if (response.status !== 200) {
                    reject({
                        errorCode: response.status,
                        errorDesc: "接口请求失败",
                    });
                }
                return response.arrayBuffer();
            })
            .then((data) => {
                if (data.proto == "sys") {
                    reject({ errorCode: 0, errorDesc: "data.proto!=sys" });
                    return;
                }
                let message = noEncrypt
                    ? data
                    : handleDecode({ data, protoType, type, aesKey });

                const errCode = message?.commonResult?.errCode;

                // 该群聊因违反相关规定，已被限制使用。
                if (errCode == 1021) {
                    resolve(errCode);
                }

                if (errCode != 200) {
                    console.error(
                        `接口报错：${message?.commonResult?.errMsg}。接口地址：${url}，`,
                        message
                    );

                    reject({
                        errorCode: errCode,
                        errorDesc: message?.commonResult?.errMsg,
                    });
                    return;
                }

                resolve(message);
            })
            .catch(async (err) => {
                if (errCallback) {
                    errCallback();
                }
                reject({ errorCode: 0, errorDesc: err });
            });
    });
};

const handleEncode = ({ protoType, type, params, aesKey }) => {
    let root = getRoot(protoType);
    let reqMethod = root[`${type}Req`];
    let param = reqMethod.create(params);
    // console.log("requestApi--",url,JSON.parse(JSON.stringify(data)),param)
    let paramsEncode = reqMethod.encode(param).finish();

    const signed = _encrypt(aesKey, paramsEncode);
    let headers = [
        Uint8Array.from([0b11000001]),
        Uint8Array.from([0b10000000]),
    ];
    let length = getUint32Bytes(signed.length);
    let array = ConcatInt8([headers, length, signed]);
    return array;
};

const handleDecode = ({ data, protoType, type, aesKey }) => {
    let root = getRoot(protoType);
    let data2 = _decrypt(new Int8Array(data.slice(6)), aesKey);
    let respMethod = root[`${type}Resp`];
    let message = respMethod.decode(new Uint8Array(data2));
    return message;
};

const handleTrendsAesKeyPrams = async (header) => {
    let openTrendsAesKey = config.TRENDS_AES_KEY;
    let aesKey = AES_KEY;
    try {
        if (openTrendsAesKey) {
            aesKey = getAesKeySync();
        }
    } catch (error) {
        aesKey = AES_KEY;
        openTrendsAesKey = false;
    }

    if (!aesKey) {
        aesKey = AES_KEY;
        openTrendsAesKey = false;
    }

    if (openTrendsAesKey) {
        const macAddress = await getApiMacAddress();
        header.append("X-MAC-ADDRESS", macAddress || "");
    }
    aesKey = aesKey.toString();
    return { aesKey, header };
};
