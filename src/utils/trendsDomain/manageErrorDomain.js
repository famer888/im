import { Cache } from "@/cache";
import { Local } from "@/utils";
import { checkDomainIsNormal, getModuleType } from "./workTools";
import { domainPoolAddData } from "./manageDomain";
import { isTestEnv } from "./tools";

export const addErrorDomainToCache = (domainUrl) => {
   let errorDomainCache = Cache(`errorDomainCache`);
   errorDomainCache = ErrorDomainCache.filter(item => item.domainUrl === domainUrl);  
   errorDomainCache.push(domainUrl)
   Cache(`errorDomainCache`, errorDomainCache)
}

// 轮询检测错误域名池
export const pollingCheckErrorDomain = () => {
    // 过期时间
    const expireTime = isTestEnv ? 1000 * 60 * 20 : 1000 * 60 * 60
    // 扫描时间
    const scanTime = isTestEnv ? 1000 * 60 * 10 : 1000 * 60 * 30
    
    function isExpireTime(timestamp) {  
        const now = Date.now();  
        const tenMinutesAgo = now - expireTime;  
        return timestamp < tenMinutesAgo;
    } 
    clearInterval(window.manageRecordTimer)
    window.manageRecordTimer = setInterval(() => {
        let errorDomainRecord = Local("errorDomainRecord") || []
        let newErrorDomainRecord = []
        errorDomainRecord.forEach( async item => {
            if(isExpireTime(item.reqTime)) {
                const { domainUrl } = item
                const state = await checkDomainIsNormal(domainUrl)
                if(state === 1) {
                    let moduleCode = getModuleType(domainUrl).name;
                    domainPoolAddData([{domainUrl, moduleCode}])
                } 
            } else {
                newErrorDomainRecord.push(item)
            }
        })
        Local("errorDomainRecord", newErrorDomainRecord) 
    }, scanTime);
}

export const deleteEroorDomain = (domains) => {
    let errorDomainRecord = Local("errorDomainRecord") || []
    errorDomainRecord = errorDomainRecord.filter(item => !domains.includes(item.domainUrl))
    Local("errorDomainRecord", errorDomainRecord)
}

export const checkDomainIsError = (domainUrl) => {
   let errorDomainRecord = Local("errorDomainRecord") || []
   return errorDomainRecord.find(item => item.domainUrl === domainUrl)
}

export const setErrorRecord = (domainUrl, reqTime) => {  
    let errorDomainRecord = Local("errorDomainRecord") || []
    if (errorDomainRecord.length >= 100) {  
        errorDomainRecord.shift(); // 移除最旧的记录  
    }
    errorDomainRecord = errorDomainRecord.filter(item => item.domainUrl !== domainUrl)  
    errorDomainRecord.push({ domainUrl, reqTime }); // 使用 this 引用类属性  
    Local("errorDomainRecord", errorDomainRecord) 
}  


export const filterErrorDoaminPool = (domainList) => {
    let errorDomainRecord = Local("errorDomainRecord") || []
    let result = domainList.filter(item => !errorDomainRecord.some(i => i.domainUrl === item.domainUrl))
    return result
}