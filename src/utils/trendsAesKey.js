import { getPublicKey, applyAesKey } from "@/api/imKey";
import { encryptedData } from "./rsaEncry";
import {
    setPublicCache,
    getPublicCache,
    getPublicCacheSync,
    getPublicCachePathSync,
} from "./publicCache";
import { os } from "@/platform";

export const NODE_ENV = process.env.VUE_APP_PACKNAME;

export const getApiMacAddressSync = (macAddress) => {
    let mac = macAddress;
    try {
        if (!macAddress) {
            const aesKeyData = getPublicCacheSync("aesKeyData");
            if (aesKeyData?.mac) {
                mac = aesKeyData.mac;
            } else {
                mac = getMacAddress();
            }
        }
    } catch {
        mac = getMacAddress();
    }
    return mac;
};

export const getApiMacAddress = (macAddress) => {
    return new Promise(async (resolve) => {
        let mac = macAddress;
        try {
            if (!macAddress) {
                const aesKeyData = await getPublicCache("aesKeyData");
                if (aesKeyData?.mac) {
                    mac = aesKeyData.mac;
                } else {
                    mac = getMacAddress();
                }
            }
        } catch {
            mac = getMacAddress();
        }
        resolve(mac);
    });
};

//判断密钥时间是否到期
const aesKeyTimeIsExpire = (createTime) => {
    let currentTimestamp = getCurrentZeroDate();
    // 计算30天前的零点时间戳
    let thirtyDaysAgoTimestamp = currentTimestamp - 30 * 24 * 60 * 60;
    return createTime < thirtyDaysAgoTimestamp;
};

//判断密钥是否生效
const aesKeyIsExpire = (createTime, aesKey, mac) => {
    let cMac = getMacAddress();
    return aesKeyTimeIsExpire(createTime) || !aesKey || mac != cMac;
};

//同步获取aesKey，aesKey不存在或过期将会获取不到，可调用异步自动获取
export const getAesKeySync = () => {
    try {
        const { aesKey, createTime, mac } =
            getPublicCacheSync("aesKeyData") || {};
        if (aesKeyIsExpire(createTime, aesKey, mac)) {
            return "";
        }
        return aesKey.toString();
    } catch (error) {
        return "";
    }
};

export const showConfigLog = () => {
    try {
        let mac = getMacAddress();
        const { aesKey, createTime, version } =
            getPublicCacheSync("aesKeyData") || {};
        let path = getPublicCachePathSync();
        console.log(
            "动态密钥-信息-",
            `mac地址${mac},aesKey:${aesKey},创建时间：${new Date(
                createTime * 1000
            )},版本：${version},缓存路径：${path}`
        );
    } catch (error) {}
};

export const initAesKey = () => {
    clearInterval(window.timerInitAesKey);
    window.timerInitAesKey = setInterval(() => {
        getAesKey();
    }, 2000);
    showConfigLog();
};

export const getAesKey = async () => {
    return new Promise(async (resolve, reject) => {
        let { aesKey, createTime, version, mac } =
            (await getPublicCache("aesKeyData")) || {};
        if (aesKeyIsExpire(createTime, aesKey, mac)) {
            try {
                const v = !aesKey || !version ? 1 : version + 1;
                const aesKeyConfig = await createTrendsAesKey(v);
                cacheAesKeyConfig(aesKeyConfig);
                aesKey = aesKeyConfig.aesKey;
            } catch (error) {
                setPublicCache("aesKeyData", {});
                // console.error("获取动态aesKey失败", error);
                reject();
            }
        }
        resolve(aesKey + "");
    });
};

const cacheAesKeyConfig = (aesKeyConfig) => {
    const { aesKey, outTime, version, mac } = aesKeyConfig;
    const createTime = getCurrentTenDigitTimestamp() + (outTime || 0);
    // const createTime = getCurrentZeroDate() + (outTime || 0)
    const data = {
        aesKey: aesKey,
        createTime: createTime,
        version,
        mac,
    };
    setPublicCache("aesKeyData", data);
};

//获取当日零点十位格式的时间戳
const getCurrentZeroDate = () => {
    // 获取当前日期
    var currentDate = new Date();
    // 将时间设置为零点
    currentDate.setHours(0, 0, 0, 0);
    // 获取时间戳（10位）
    var timestamp = Math.floor(currentDate.getTime() / 1000);
    return timestamp;
};

// 获取当前时间的时间戳 十位
function getCurrentTenDigitTimestamp() {
    // 获取当前时间的毫秒数
    var now = Date.now();

    // 将毫秒数转换为秒数（10位时间戳）
    var timestamp = Math.round(now / 1000);

    return timestamp;
}

const createTrendsAesKey = (version) => {
    return new Promise(async (resolve, reject) => {
        const obj = await getPublicKey();
        const { publicKey, keySecret } = obj?.data || {};
        const aesKeyConfig = createAesKeyConfig(version);
        if (!aesKeyConfig.encryptedText) {
            console.error("生成AesKey失败，获取encryptedText失败！");
            return;
        }
        const encryptedTextEncry = encryptedData(
            publicKey,
            aesKeyConfig.encryptedText
        );
        if (!encryptedTextEncry) {
            console.error("生成AesKey失败，获取encryptedTextEncry失败！");
            return;
        }
        let result = null;
        try {
            result = await applyAesKey({
                encryptedText: encryptedTextEncry,
                keySecret,
            });
            let isSuccess = result.data;
            if (isSuccess) {
                resolve(aesKeyConfig);
            } else {
                reject(result);
            }
        } catch (error) {
            console.error(error);
            reject(error);
        }
    });
};

//获取当天已过时间的秒数
function getSecondsSinceMidnight() {
    // 创建一个Date对象表示当天的开始（00:00:00）
    var startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // 创建一个Date对象表示当前时间
    var now = new Date();

    // 计算两个日期之间的毫秒数，然后转换为秒
    var diffInMilliseconds = now - startOfDay;
    var diffInSeconds = Math.round(diffInMilliseconds / 1000);

    return diffInSeconds;
}

const createAesKeyConfig = (version) => {
    let encryptedText = "";
    let mac = getMacAddress();
    let aesKey = createRandomNumber(1000000000000000, 9999999999999999);
    // let outTime = 1
    let outTime = createRandomNumber(0, 86400);
    if (mac && aesKey && outTime && version) {
        encryptedText = [mac, aesKey, outTime, version].join(",");
    }
    return { encryptedText, mac, aesKey, outTime, version };
};

const createRandomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

export const getMacAddress = () => {
    // return 'e9:fb:1c:c5:9f:468'
    const interfaces = os.networkInterfaces();
    let result = "";
    if (interfaces?.WLAN?.length) {
        let item = interfaces.WLAN[0];
        result = item.mac;
    } else {
        for (const key in interfaces) {
            const networkInterface = interfaces[key];
            for (const item of networkInterface) {
                if (!item.internal && item.mac !== "00:00:00:00:00:00") {
                    result = item.mac;
                }
            }
        }
    }
    result = NODE_ENV + "-" + result;

    return result;
};
