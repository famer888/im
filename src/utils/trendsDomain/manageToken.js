
import { getClientToken } from "@/api/imDomain";
import { setPublicCache, getPublicCacheSync } from "../publicCache";
import { 
    getTrendsDomainFirstNormal, 
    getPrepareFirstNormal, 
    getTrendsOssFirstNormal,
    getPrepareOssFirstNormal,
} from "./manageDomain";
import { isPastTimestamp, getMacAddress, throttle } from "./tools";
import eventCommon from "@/event/common.js";

const getToken = (domain) => {
    return new Promise((resolve, reject) => {
        let sysMac = getMacAddress()
        let sysModel = "PC"
        
        const prams = {
            ...eventCommon.fnClientInfoGet(),
            sysMac,
            sysModel,
        }
        getClientToken(prams, {domain}).then(res => {
            if( !res?.accessToken ) {
                reject(0)
                return
            }
            setPublicCache("clientTokenData", res);
            resolve(res)
        })
    })
   
}

export const getClientTokenData = async () => {
    const clientTokenData = getPublicCacheSync("clientTokenData") || {};  
    if(tokenIsExpire(clientTokenData)) {
        let result = {}
        try {
            result = await getToken()
        } catch (error) {
            result = await updateToken()
        }
       return result
    } else {
       return clientTokenData
    }
}  

export const tokenIsExpire = (clientToken) => {
    const clientTokenData = clientToken || getPublicCacheSync("clientTokenData") || {};  
    const { expirationMillis } = clientTokenData;  

    return !expirationMillis || isPastTimestamp(expirationMillis)
}



// 获取能使用的域名
export const updateToken = async () => {
         let result = {}
        try {
            result = await getToken()
        } catch (error) {
            let newDomain = ""
            newDomain = await getTrendsDomainFirstNormal("biz")
    
            if(!newDomain) {
                newDomain = await getTrendsOssFirstNormal("biz")
            }
    
            if(!newDomain) {
                newDomain = await getPrepareFirstNormal("biz")
            }
    
            if(!newDomain) {
                newDomain = await getPrepareOssFirstNormal("biz")
            }
            result = await getToken(newDomain)
        }
        return result
}

// 处理接口解密异常，修复一下token
export const repairToken = throttle(
    () => {
        updateToken()
    },
    30000
)