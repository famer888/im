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
   let newUrls = await getOssDomains(channelType)
   if(!newUrls[index]) return ""
   newUrls = domainListSort(newUrls)
   let newUrl = newUrls[index].domainUrl
   newUrl = newUrl.replace(/\/$/, "") + getRemainingUrl(oriUrl);
   return newUrl
}