import { getClientToken, getDomainListApi, reportErrorDomainApi } from "@/api/imDomain";
import { pollingUpdateDomainPool, updateTrendsDomain } from "./manageDomainUpdate";
import { getFirstNormalDomain } from "./manageDomain";
import { getModuleType } from "./workTools";
import { pollingCheckErrorDomain } from "./manageErrorDomain";
import { updateToken } from "./manageToken";
import { pollingBatchReport } from "./manageReport";
// 事件
import eventCommon from "@/event/common.js";

// 设置当前使用的域名
export const setCurrentUseDomain = (domainList) => {
    console.log("setCurrentUseDomain-1-", JSON.parse(JSON.stringify(domainList)) )
    let domains = eventCommon.fnDomainsGet();
    for(let moduleCode in domains){
      let  moduleUrls =  domainList.filter(item => item.moduleCode === moduleCode)
      if(moduleUrls.length && moduleUrls[0]) {
         domains[moduleCode] = moduleUrls[0]?.domainUrl || ""
      }
    }
    console.log("setCurrentUseDomain-2-", domains)
    eventCommon.fnDomainsSet(domains);
}

// 初始化域名
export const initDomain = async () => {
    console.log("initDomain-1-")
    pollingUpdateDomainPool()
    pollingCheckErrorDomain()
    pollingBatchReport()
    await updateToken()
    await updateTrendsDomain()
}

// 获取一个新的可用域名
export const getNewNormalDomain = async (moduleCode) => {  
    let result = ""
    try {
        result = await getFirstNormalDomain(moduleCode);
    } catch (error) {
        console.log(error)
    }
    return result
};  
  













