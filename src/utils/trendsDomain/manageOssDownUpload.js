//管理OSS下发

import { getTrendsDomainPool } from "./manageDomain";
import { getDomainListAllNormal, domainListSort, getDomainListFirstNormal, checkImageLoad } from "./workTools";
import { getRemainingUrl } from "@/utils/base.js";
import eventCommon from "@/event/common";

export const getOssDomains = async (channelType) => {
    let urls = []
    if(channelType === 1) {
       urls = await getTrendsDomainPool({moduleCode: "ossChatUrl"})
    } else if (channelType === 2) {
       urls = await getTrendsDomainPool({moduleCode: "ossLowRateUrl"})
    } else if (channelType === 9) {
      urls = await getTrendsDomainPool({moduleCode: "ossEndpoint"})
    } else {
      urls = await getTrendsDomainPool({moduleCode: "ossDefaultUrl"})
    }
    return urls || []
}

export const getOssDomain = async () => {
    let newDomainObjs = await getOssDomains('ossDefaultUrl') || [];
     const newDomains = newDomainObjs.map(item => item?.domainUrl)
    let newDomain = await getDomainListFirstNormal(newDomains) || ""
    eventCommon.fnDomainsAttribSet({key : "ossDefaultUrl", value: newDomain});
}

const OSS_CHANNEL_MODULE_KEY = {
    0: "ossDefaultUrl",
    1: "ossChatUrl",
    2: "ossLowRateUrl",
};

const OSS_CHANNEL_TYPE_ALIASES = {
    OSS_DEFAULT: 0,
    OSS_CHAT: 1,
    OSS_LOW_RATE: 2,
};

/**
 * 新桶（OSS 直连）地址：上传接口下发的完整 OSS 地址（aliyuncs.com 直连桶）。
 * 这类地址本身就是权威可访问地址，回显/下载时直接使用，不再重写成旧的动态域名池，
 * 否则换成不含该资源的旧 CDN 域名会直接下载失败、显示「已过期」。
 */
const isDirectOssBucketUrl = (url) => {
    return typeof url === "string" && /\.aliyuncs\.com\//i.test(url);
};

/**
 * 新桶资源标识：新上传通道的资源路径形如 /.../v2/chat/...（pic、video、emoticon 等）。
 * 这类地址由发送方上传时下发，URL 自身（含 host + 桶名）就是权威可访问地址；
 * 注意：每条消息的桶名可能不同（如 ulb-26pic、xpz-xire86），
 * 绝不能用「接收端自己的 ossData.ossBucket」去重建，否则跨桶会拼成错误地址、下载失败。
 */
const isNewBucketResource = (url) => {
    return typeof url === "string" && /\/v2\/chat\//i.test(url);
};

/** 消息里的 channelType 可能是 1 或 "OSS_CHAT"，统一成数字 */
export const resolveOssChannelType = (msgInfo, fallback = 1) => {
    const raw = msgInfo?.channelType;
    if (raw in OSS_CHANNEL_TYPE_ALIASES) {
        return OSS_CHANNEL_TYPE_ALIASES[raw];
    }
    const ct = Number(raw);
    if (!Number.isNaN(ct) && ct >= 0) return ct;
    return fallback;
};

export const getOssFirstNormalUrl = async (oriUrl, channelType = 0) => {
    // 新桶直连地址 / 新桶结构资源（/v2/chat/）：URL 自身即权威地址，
    // 直接原样回显/下载，不重写域名、不跨桶重建（每条消息桶名可能不同）。
    if (isDirectOssBucketUrl(oriUrl) || isNewBucketResource(oriUrl)) return oriUrl;

    const moduleKey = OSS_CHANNEL_MODULE_KEY[channelType] || "ossDefaultUrl";
    const domains = eventCommon.fnDomainsGet() || {};
    let newDomain = domains[moduleKey] || "";

    if (!newDomain) {
        const pool = await getOssDomains(channelType);
        if (pool.length) {
            const sorted = domainListSort(pool);
            newDomain =
                (await getDomainListFirstNormal(sorted.map((item) => item.domainUrl))) ||
                sorted[0]?.domainUrl ||
                "";
        }
    }

    if (!newDomain && channelType !== 0) {
        newDomain = domains.ossDefaultUrl || "";
    }

    if (!newDomain) return "";
    return String(newDomain).replace(/\/$/, "") + getRemainingUrl(oriUrl);
};

export const getNewFileDownUrl = async (oriUrl, channelType, index) => {
   // 新桶资源：用新桶直连，不换旧动态域名重试
   if (isDirectOssBucketUrl(oriUrl) || isNewBucketResource(oriUrl)) return ""
   let newUrls = await getOssDomains(channelType)
   if(!newUrls[index]) return ""
   newUrls = domainListSort(newUrls)
   let newUrl = newUrls[index].domainUrl
   newUrl = newUrl.replace(/\/$/, "") + getRemainingUrl(oriUrl);
   return newUrl
}