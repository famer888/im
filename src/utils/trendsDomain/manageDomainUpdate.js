import { getDomainListFirstNormal, getOssUrlsContent, checkModuleDomainLack, getDomainListAllNormal } from "./workTools";
import { tokenIsExpire, updateToken } from "./manageToken";
import { setPublicCache, setPublicCacheSync, getPublicCacheSync } from "../publicCache";
import { filterErrorDoaminPool, deleteEroorDomain } from "./manageErrorDomain";
import { isTestEnv } from "./tools";
import { 
    getOssDomainPool, 
    getPrepareDomainPool, 
    getTrendsDomainPool, 
    getDomainListByApi, 
    getTrendsOssAllNormal, 
    domainPoolAddData, 
    getPrepareOssAllNormal,
    getDomainNumThreshold,
} from "./manageDomain";
import { setCurrentUseDomain } from "./index";
import preloadedDomainList from "../../../scripts/domains.json";
// 事件
import eventCommon from "@/event/common.js";

export const pollingUpdateDomainPool = async () => {
    let time = isTestEnv ? 1000 * 60 * 5 : 1000 * 60 * 30
    clearInterval(window.timerTrendsDomain)
    window.timerTrendsDomain = setInterval(() => {
        updateDomain()
    }, time);
}

// 域名更新告警
export const updateDomainAlarm = async () => {
    if(window.domainAlarmHandleIng) return
    window.domainAlarmHandleIng = true
    await updateDomain()
    setTimeout(() => {
        window.domainAlarmHandleIng = false   
    }, 1000 * 20);
}

const updateDomain = async () => {
    if(tokenIsExpire()) {
       await updateToken()
    }
    let domainList = await getTrendsDomainPool({moduleCode: "domain"}) || {}
    let thresholdNum = getDomainNumThreshold("domain")
    if(domainList.length <= thresholdNum) {
        await updateDomainModule()
    }
    if(checkModuleDomainLack(["webBiz", "webSession","domain"])) {
        await updateTrendsDomain()
    }
}

// 更新domain模块的域名池
const updateDomainModule = async () => {
    return new Promise( async resolve => {
        let result = []

        let domainDtoList = await getTrendsDomainPool({moduleCode: "domainConfig"}) || {}
        let ossUrls = domainDtoList.map(item => item.domainUrl)
        let ossDomains = await getOssUrlsContent(ossUrls)
        result = await getDomainListAllNormal(ossDomains)

        if(result.length < 3) {
            let prepareDomain = await getPrepareDomainPool("domain")
            let result2 = await getDomainListAllNormal(prepareDomain)
            result = [...result, ...result2]
        }

        if(result.length < 3) {
            let prepareDomain = await getOssDomainPool("webBiz")
            let result3 = await getDomainListAllNormal(prepareDomain)
            result = [...result, ...result3]
        }
        domainPoolAddData(result.map(domainUrl => { return {moduleCode: "domain", domainUrl}}))
        resolve(result) 
    })
}

const domainListAddPriority = (domainList) => {
   return domainList.map((item, index) => { 
     item.priority = index
     return item
    })
}

export const updateDomainListByResponse = async (response) => {
    let res = response || {}
    let domainDtoList = res.domainDtoList || []
    if(domainDtoList?.length) {
        updateDomainModuleTotal(domainDtoList)
        domainDtoList = domainListAddPriority([...domainDtoList])
        res.domainDtoList = await getDomainListAllNormal(domainDtoList, {objKey: "domainUrl", moduleCodes: ["webBiz"]})
        let deleteDmains = res.domainDtoList.filter(item => item.moduleCode === 'webBiz').map(item => item.domainUrl);  
        deleteEroorDomain(deleteDmains)
        let getTime = new Date().getTime(); 
        const data = {...res, getTime}
        setPublicCacheSync("domainList", data);
        setCurrentUseDomain(res.domainDtoList)
      
    } 
    if(checkModuleDomainLack(["webBiz"], domainDtoList)) {
       let ossDomainFileUrl = domainDtoList.find(item => item.moduleCode === "config")
       let domains = []
       if(!ossDomainFileUrl) {
         domains = await getTrendsOssAllNormal()
       }
       if(!domains.length) {
        domains = await getPrepareOssAllNormal()
       }
       let domainObjs = domains.map(domainUrl =>{ return {moduleCode: "webBiz", domainUrl}})
       domainPoolAddData(domainObjs)
    }
}

export const updatePreloadedDomainList = async () => {
    try {
        if(process.env.VUE_APP_ENV !== "prod") return false;

        const res = preloadedDomainList?.domainDtoList?.length
            ? JSON.parse(JSON.stringify(preloadedDomainList))
            : {};
        if(!res.domainDtoList?.length) return false;

        await updateDomainListByResponse(res);
        const collectData = {
            env: process.env.VUE_APP_ENV,
            total: res.domainDtoList.length,
            source: "domains.json",
        };
        console.log("[domains] preload domainList success", collectData);
        console.$collect && console.$collect("[domains] preload domainList success", collectData);
        return true;
    } catch (error) {
        console.warn("[domains] preload domainList failed", error);
        console.$collect && console.$collect("[domains] preload domainList failed", {
            env: process.env.VUE_APP_ENV,
            message: error?.message || String(error),
        });
        return false;
    }
}

export const updateTrendsDomain = async () => {
    let res = await getDomainListByApi() || {}
    await updateDomainListByResponse(res)
}


export const updateDomainModuleTotal = (domainDtoList) => {
    let domains = eventCommon.fnDomainsGet();
    let domainModuleTotals = {}
   for(let moduleCode in domains){
     let dm = domainDtoList.filter(item => item.moduleCode === moduleCode) || []
     domainModuleTotals[moduleCode] = dm.length
   }
   setPublicCache("domainModuleTotals", domainModuleTotals);
}


