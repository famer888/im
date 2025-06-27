//管理OSS下发

import { getTrendsDomainPool } from "./manageDomain";
import { getDomainListAllNormal, domainListSort, getDomainListFirstNormal } from "./workTools";
import { getRemainingUrl } from "@/utils/base.js";

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

export const getNewImgDownUrl = (oriUrl, channelType) => {
  let newUrls = getOssDomains(channelType)
  let newUrl = newUrls[0]
  newUrl = newUrl.replace(/\/$/, "") + getRemainingUrl(url);
  return newUrl
}

export const getNewFileDownUrl = async (oriUrl, channelType, index) => {
   let newUrls = await getOssDomains(channelType)
   if(!newUrls[index]) return ""
   newUrls = domainListSort(newUrls)
   let newUrl = newUrls[index].domainUrl
   newUrl = newUrl.replace(/\/$/, "") + getRemainingUrl(oriUrl);
   return newUrl
}