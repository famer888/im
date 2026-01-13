import * as $root from "./web.js";
import * as $root_user from "./user.js";
import * as $root_domain_url from "./domain_url.js";
import * as $root_sys from "./sys.js";
import * as $root_group from "./group.js";
import * as $root_group_message from "./group_message.js";
import * as $root_channel_api from "./channel_api.js";
import * as $root_imweb_web from "./imweb-web.js";
import { _decrypt, _encrypt, encrypt } from "./index";
import { getUint32Bytes, stringToAscii } from "../../socket/unit";
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
// 正式环境
export const baseBuildUrl = process.env.VUE_APP_BASE_API;

// openchat的head加密密钥
const HEAD_AES_KEY = process.env.VUE_APP_HEAD_AES_KEY;
// openchat的SECRET_NAME
const SECRET_NAME = process.env.VUE_APP_SECRET_NAME;


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
    } else if (protoType === "channel_api") {
        root = $root_channel_api;
    } else if (protoType === "imweb-web") {
        root = $root_imweb_web;
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
    let client = eventCommon.fnClientInfoGet();
    client.sysMac = getApiMacAddressSync();
    client.packageCode = 6000;

    // console.log('HEAD_AES_KEY:', HEAD_AES_KEY, 'SECRET_NAME:', SECRET_NAME, client)
    let clientStr = JSON.stringify(client);

    const timestamp = Date.now();
    const tenStr = `${clientStr}//${timestamp}`;
    const oneStr = `${SECRET_NAME},${timestamp}`;

    const ten = encrypt(tenStr, HEAD_AES_KEY);
    const one = encrypt(oneStr, HEAD_AES_KEY);

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
        result = await requestApi(opts);
    } catch (error) {
        if (isRepairDomain && error.errorCode < 500) {
            let newUrl = await replaceNewDomain(opts.url);
            if (newUrl) {
                opts.url = newUrl;
                try {
                 result = await requestApi(opts);
                } catch (error) {
                 errCallback && errCallback()
                }
            }
        } else {
            errCallback && errCallback()
            return error
        }
    }
    return result;
};

// Url替换新域名
const replaceNewDomain = async (url) => {
    let moduleCode = getModuleType(url).name || "webBiz";
    let newDomain = (await getNewNormalDomain(moduleCode)) || "";
    if (!newDomain) return "";
    let newUrl = newDomain.replace(/\/$/, "") + getRemainingUrl(url);
    eventCommon.fnDomainsAttribSet({
        key: moduleCode,
        value: newDomain,
    })
    return newUrl;
};

const requestApi = async (opt) => {
    let {
        method = "POST",
        type,
        url,
        protoType,
        data = {},
        headers = {},
        noEncrypt = false,
        customAesKey = "",
    } = opt;

    return new Promise(async (resolve, reject) => {
        let header = new Headers();
        let { aesKey } = noEncrypt ? {} : await handleTrendsAesKeyPrams(header);
        if( customAesKey ) aesKey = customAesKey;

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
                FairGuard.recieve(response);
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

                if (errCode != 200 && errCode != 1023) {
                    console.error(
                        `接口报错：${message?.commonResult?.errMsg}。接口地址：${url}，`,
                        message,
                        opt
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
                // if (errCallback) {
                //     errCallback();
                // }
                reject({ errorCode: 0, errorDesc: err });
            });
    });
};

export const handleEncode = ({ protoType, type, params, aesKey }) => {
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

export const handleDecode = ({ data, protoType, type, aesKey, noResp }) => {
    let root = getRoot(protoType);
    let data2 = _decrypt(new Int8Array(data.slice(6)), aesKey);
    let respMethod = noResp ? root[type] : root[`${type}Resp`];
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

export const FairGuard = (() => {
  const tasks = new Set();
  const lastConsumeKeys = new Map();
  let maximumConsumeTime, weight = 0;
  const map = { 29901: 19901, 20101: 10101, 20201: 10201, 4201: 4101 };
  const induded = `19901,10101,10201,4101`;
  // const induded = `10101,10201,4101`;
  // 数学期望计算：期望50次调用内必中
  // P(命中) = P(Math.random() * M + weight > N)
  // 初始weight=0，每次不命中后weight += W
  // 第k次调用时的weight = (k-1) * W
  // P(不命中|k) = max(0, (N - (k-1)*W) / M)
  // 选择参数使第50次调用时P(不命中)接近0
  const M = 1000; // 随机数范围放大因子
  const N = 750;  // 初始阈值
  const W = 10;   // 每次权重递增
  const X = 950;  // 强制命中阈值

  const tossCoin = () => {
    // 当计算值大到X值或当前时间到达maximumConsumeTime，必中
    if (weight >= X || Date.now() >= maximumConsumeTime) {
      // console.log(`[FairGuard]丢硬币命中, ${weight >= X ? '权重大于X' : '时间大于最大消费时间'}`);
      weight = 0; // 重置权重
      return true;
    }
    const randomValue = Math.random() * M + weight;
    const isHit = randomValue > N;

    // 每次计算权重weight增加W，增加命中率
    if (!isHit) {
      weight += W;
    } else {
      weight = 0; // 命中后重置权重
    }
    // console.log(`[FairGuard]丢硬币中：${isHit ? '命中' : '未命中'}, 当前权重为: ${weight}, 随机值为: ${randomValue}`);
    return isHit;
  }
  const recieve = (response) => {
    const headers = response.headers;
    const isFetchHeaders = Object.prototype.toString.call(headers) === '[object Headers]';
    const tag = isFetchHeaders ? headers.get("f_tag") : _.get(headers, "f_tag");
    const content = isFetchHeaders ? headers.get("f_content") : _.get(headers, "f_content");
    if (tag === "3" && content) {
      if (tasks.size === 0 || maximumConsumeTime === undefined) {
        maximumConsumeTime = Date.now() + 3000 * 50;
      }
      // console.log(`[FairGuard]收到http请求头部内容为: ${content}, 当前tasks长度为: ${tasks.size}, 最大消费时间为: ${maximumConsumeTime}, 当前权重为: ${weight}`);
      tasks.add(content);
    }
  }
  const generate = (sendCode, flag) => {
    try {
      if (!induded.includes(sendCode) || tasks.size === 0) return [false, []];
      if (!tossCoin()) return [false, []];
      const task = Array.from(tasks).join(',');
      lastConsumeKeys.set(`${sendCode}-${flag}`, task);
      const acii = stringToAscii(task);
      const len = getUint32Bytes(acii.length);
      return [true, [len, acii]];
    } catch (e) {
      return [false, []];
    }
  }
  // 心跳 19901 | 29901
  // 私聊 10101 | 20101
  // 群聊 10201 | 20201
  // 频道 4101 | 4201
  // 锁在ws.send生成，钥匙在ws.onMessage生成并解锁，message和ack码必须一一对应，除心跳外，其他消息仍然需要flag解锁，防止tasks被意外清空
  const consume = (ackCode, message) => {
    try {
      if (!map[ackCode]) return;
      const key = `${map[ackCode]}-${message?.flag}`;
      if (lastConsumeKeys.has(key)) {
        const task = lastConsumeKeys.get(key);
        task.split(',').forEach(item => {
          tasks.has(item) && tasks.delete(item);
        });
        lastConsumeKeys.delete(key);
        maximumConsumeTime = undefined;
        weight = 0;
        // 粗暴清空防止内存泄漏，反正你可以重新掷硬币
        if (lastConsumeKeys.size > 100) {
          lastConsumeKeys.clear();
        }
      }
    } catch(e) {
      console.log('errr', e);
    }
  }
  return {
    consume,
    recieve,
    generate,
  }
})();
