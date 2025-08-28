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

export const getNewImgDownUrl = async (oriUrl) => {
  let newUrl = "";
  const { ossDefaultUrl } = eventCommon.fnDomainsGet() || {};
  let newDomain = ossDefaultUrl || "";
  if(!newDomain) {
     let newDomainObjs = await getOssDomains('ossDefaultUrl') || [];
     const newDomains = newDomainObjs.map(item => item?.domainUrl)
      newDomain = await getDomainListFirstNormal(newDomains) || ""
  }
  if(newDomain) {
    newUrl = String(newDomain).replace(/\/$/, "") + getRemainingUrl(oriUrl);
      const state = await checkImageLoad(newUrl)
      if(!state) {
        newUrl = ""
        newDomain = ""
      }
      eventCommon.fnDomainsAttribSet({key : "ossDefaultUrl", value: newDomain});
      return newUrl
    } else if(ossDefaultUrl){
      eventCommon.fnDomainsAttribSet({key :"ossDefaultUrl", value: ""});
      return ""
    } else {
      return ""
  }
}

export const getNewFileDownUrl = async (oriUrl, channelType, index) => {
   let newUrls = await getOssDomains(channelType)
   if(!newUrls[index]) return ""
   newUrls = domainListSort(newUrls)
   let newUrl = newUrls[index].domainUrl
   newUrl = newUrl.replace(/\/$/, "") + getRemainingUrl(oriUrl);
   return newUrl
}