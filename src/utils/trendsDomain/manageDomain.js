import { 
    getDomainListFirstNormal, 
    getDomainListAllNormal,
    getOssUrlsContent, 
    fetchFileContent,
    generateSign,
    domainListSort,
} from "./workTools";
import {
    setPublicCache,
    getPublicCacheSync,
} from "../publicCache";
import { getClientTokenData } from "./manageToken";
import { getCurrentTimestamp13Digits, throttle } from "./tools";
import { getDomainListApi } from "@/api/imDomain";
import { updateDomainAlarm } from "./manageDomainUpdate";

export const domainPoolAddData = (domains) => {
    const { domainDtoList = [], getTime = 0 } = getPublicCacheSync("domainList") || {}
    let newData = []
    domains.forEach(item => {
       let data = domainDtoList.find(i => i.moduleCode===item.moduleCode && i.domainUrl===item.domainUrl)
       if(!data) {
        newData.push(item)
       }
    })
    let result = { domainDtoList: [...domainDtoList, ...newData], getTime}
    setPublicCache("domainList", result);
}

export const domainPoolDeleteData = (domainUrl,moduleCode) => {
    let { domainDtoList = [], getTime = 0 } = getPublicCacheSync("domainList") || {}
    if(!domainDtoList.length) return
    let data = domainDtoList.filter(i => (i.moduleCode!==moduleCode || i.domainUrl!==domainUrl))
    let result = { domainDtoList: data, getTime}
    setPublicCache("domainList", result);
    checkModlueDomainNum(moduleCode, {domainList: data})
}

// 检测某域名是否低于阈值
export const checkModlueDomainNum = throttle((moduleCode, {domainList} = {}) => {
    let domainListCache = getPublicCacheSync("domainList")?.domainDtoList || []
    let domainDtoList = domainList ||domainListCache || []
    let num = domainDtoList.filter(i => i.moduleCode===moduleCode).length
    let thresholdNum = getDomainNumThreshold(moduleCode)
    if(num  <= thresholdNum) {
        updateDomainAlarm()
    }
}, 1000 * 3)

// 获取首个可使用的域名
export const getFirstNormalDomain = (moduleCode) => {
    return new Promise( async resolve => {
        let result = await getTrendsDomainFirstNormal(moduleCode)?.domainUrl || ""
        if(!result) {
           let prepareDomain = await getPrepareDomainPool(moduleCode)
           if(prepareDomain.length) result = prepareDomain[0]
        }
        resolve(result || "")
    })
}

// 获取动态域名池
export const getTrendsDomainPool = async (opts) => {
    const { moduleCode } = opts || {}

    let domainLists= []
    const { domainDtoList, getTime } = getPublicCacheSync("domainList") || {}
    domainLists = domainDtoList || []

    function filterDomainList(list) {
        if(!list?.length) return []
        let newList = []
        if(moduleCode) {
            newList = list.filter(item => item.moduleCode === moduleCode)
        }
        return newList
    }
    domainLists = filterDomainList(domainLists)
    domainLists = domainListSort(domainLists)

    return domainLists
}

export const getDomainListByApi = throttle(
    (opts) => {
        const { moduleCode = "" } = opts || {};
        return new Promise( async resolve => {
            const { mchId, secretKey, accessToken } = await getClientTokenData();  
            let reqTime = getCurrentTimestamp13Digits();
            let listDomainReq = {
                mchId,
                reqTime,
                sign: "",
                moduleCode,
                deviceIp: "",
                deviceNo: "",
            }
            listDomainReq.sign = generateSign(listDomainReq, secretKey)
          
            const pra = {
                secretKey,
                datas: listDomainReq, 
                headers: { accessToken },
            }
            
            getDomainListApi(pra).then(res => {
                resolve(res)
            })
        })
    },
    10000
) 

// 获取预埋域名
export const getPrepareDomainPool = async (moduleType) => {
    let urls = []
    if(moduleType === "webSession") {
        urls = []
    } else if(moduleType === "domain"){
        urls = [process.env.VUE_APP_BASE_DOMAIN]
    } else {
        urls = [process.env.VUE_APP_BASE_API]
    }
    return urls
}

export const getOssDomainPool =  async (moduleType) => {
    if( moduleType === "domain" ) {
        const ossDomainUrl = process.env.VUE_APP_OSS_HOST_DOMAIN;
        let domainUrlData = await fetchFileContent(ossDomainUrl);
        return domainUrlData
    } else if( moduleType === "webSession" ) {
        return []
    } else {
        const ossBizUrl = process.env.VUE_APP_OSS_HOST_BIZ;
        let bizUrlData = await fetchFileContent(ossBizUrl)
        return bizUrlData
    }
}

// 获取动态域名池中首个可用域名
export const getTrendsDomainFirstNormal = async (moduleCode) => {
    let domainDtoList = await getTrendsDomainPool({moduleCode}) || {}
    let domainUrls = domainDtoList.map(item => item.domainUrl)
    let result = await getDomainListFirstNormal(domainUrls)
    return result || ""
}

// 获取预埋域名中首个可用的域名
export const getPrepareFirstNormal = async (moduleCode) => {
    let prepareDomain = await getPrepareDomainPool(moduleCode)
    let result = await getDomainListFirstNormal(prepareDomain)
    return result || ""
}

// 获取动态OSS中首个可用的域名
export const getTrendsOssFirstNormal = async () => {
    let domainDtoList = await getTrendsDomainPool({moduleCode: "config"}) || {}
    let ossUrls = domainDtoList.map(item => item.domainUrl)
    let domains = await getOssUrlsContent(ossUrls)
    let result = await getDomainListFirstNormal(domains)
    return result || ""
}


// 获取预埋OSS中首个可用的域名
export const getPrepareOssFirstNormal = async () => {
    let prepareDomains = await getOssDomainPool("webBiz")
    let result = await getDomainListFirstNormal(prepareDomains)
    return result || ""
}

// 获取动态OSS中所有可用的域名
export const getTrendsOssAllNormal = async () => {
    let domainDtoList = await getTrendsDomainPool({moduleCode: "config"}) || {}
    let ossUrls = domainDtoList.map(item => item.domainUrl)
    let domains = await getOssUrlsContent(ossUrls)
    let result = await getDomainListAllNormal(domains)
    return result || []
}

// 获取预埋OSS中所有可用的域名
export const getPrepareOssAllNormal = async () => {
    let prepareDomains = await getOssDomainPool("webBiz")
    let result = await getDomainListAllNormal(prepareDomains)
    return result || []
}

// 获取对应模块域名的阈值
export const getDomainNumThreshold = (moduleCode) => {
    const moduleTotals = getPublicCacheSync("domainModuleTotals") || {};
    let num = moduleTotals[moduleCode] || 0
    let threshold = 0
    if(num >= 4) {
        threshold = 2
    }else if(num >= 3) { 
        threshold = 1
    }
    return threshold
 }