import { setPublicCache, getPublicCacheSync } from "../publicCache";
import { reportErrorDomain } from "./manageReport";
import { getDomainNumThreshold } from "./manageDomain";
import { isWebSocketUrl } from "./tools";
import { FairGuard } from "@/api/base/unit";
import { os } from "@/platform";

// 获取域名列表中第一个正常的域名
export const getDomainListFirstNormal = (urlList) => {
    return new Promise( async resolve => {
        let result = ""
        for(let i = 0; i < urlList.length; i++) {
            let url = urlList[0]
            const state = await checkDomainIsNormal(url)
            if(state === 1) {
                result = url
                break;
            }
        }
        resolve(result)
    })

}

// 获取域名列表所有正常的域名
export async function getDomainListAllNormal(urlList, opts){
    const { objKey = "", moduleCodes= [] } = opts || {}
    let result = []
    for(let i = 0; i < urlList.length; i++) {
        let item = urlList[i]
        // 不需要检测的域名
        if(moduleCodes.length && !moduleCodes.includes(item.moduleCode)) {
            result.push(item)
            continue;
        }
        let url = objKey? item[objKey]: item
        const state = await checkDomainIsNormal(url)
        if(state === 1) {
            result.push(item)
        }
    }
    return result
}

// 检测域名是否可用
export function checkDomainIsNormal(url) {
    let timerTimeout = null

    return new Promise((resolve, reject) => {
        timerTimeout = setTimeout(() => {
            reportErrorDomain(url, {errorDesc: "域名检测异常,异常原因:检测超时"})
            resolve(3)
        }, 2000);

        // 检测webSocket域名
        if(isWebSocketUrl(url)) {
            console.log('checkWssDomain-2-', url)
            checkWssDomain(url).then(res => {
                console.log('checkWssDomain-3-', res)
                clearTimeout(timerTimeout)
                if(res.state === 1) {
                  resolve(1)
                } else {
                 reportErrorDomain(url, {errorDesc: `域名检测异常,异常原因:${res.error}`, httpStatus: 0})
                   resolve(0)
                }
            })
            return;
        }

       // 检测http域名
        fetch(url, {
            method: 'GET',
            mode: 'cors', // 注意这里使用了'cors'，这要求服务器支持CORS
        })
        .then(response => {
            clearTimeout(timerTimeout)
            FairGuard.recieve(response);
            const { status } = response
            if (!response.ok || status !== 200) {
                reportErrorDomain(url, {errorDesc: `域名检测异常,异常原因: 网络或请求异常`, httpStatus: status})
                resolve(2)
                return
            }
            resolve(1)
        })
        .catch(error => {
            clearTimeout(timerTimeout)
            const httpStatus = error?.response?.status || 0
            reportErrorDomain(url, {errorDesc: `域名检测异常,异常原因:${error?.message || error}`, httpStatus})
            resolve(0)
        });
    })
}

// 检测webSocket域名是否正常
function checkWssDomain(url) {
    return new Promise((resolve) => {
        const ws = new WebSocket(url);
        const fn = (state, error) => {
            ws.close()
            resolve({state, error})
        }
        ws.onopen = () => fn(1, "");
        ws.onerror = (e) => fn(0, '连接失败' + e);
        ws.onclose = (e) => fn(0, '连接失败' + e);
    })
}

export function getDeviceType() {
    let v =  os.type()+"-"+os.release()
    return v
}

// 生成签名
export function generateSign(data, appSecret) {
    let unsignedString = '';

    for (let key in data) {
        if (data.hasOwnProperty(key)) {
            const value = data[key];
            if (value == null || value.toString() === '') {
                continue;
            }
            unsignedString += `&${key}=${value}`;
        }
    }
    if(unsignedString.length) {
        unsignedString = unsignedString.substring(1);
    }
    unsignedString += '&key=' + appSecret;
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(unsignedString, 'utf8').digest('hex'); // 确保使用utf8编码
    return hash.toUpperCase();
}


export const getModuleType = (url) => {
    if(url.includes("ws://")) {
        return {name: "webSession", value: 26}
    }  else if (url.includes("/domain/")){
        return {name: "domain", value: 20}
    } else {
        return {name: "webBiz", value: 25}
    }
}

export const getOssUrlsContent = async (urls) => {
    let domains = []
    for(let i=0; i<urls.length; i++) {
        let url = urls[i]
        let result = await fetchFileContent(url)
        domains = [ ...domains, ...result]
    }

    return domains
}

export async function fetchFileContent(url) {
    if(!url) return []
    try {
      const response = await fetch(url);
      FairGuard.recieve(response);
      if (!response.ok) {
        return []
      }
      const content = await response.text(); // 对于文本文件使用.text()，对于JSON使用.json()
      let result =JSON.parse(atob(content))
      return result.url || []
    } catch (error) {
      console.error( error);
      return []
    }
}

// 检测模块域名是否低于阀值
export const checkModuleDomainLack = (moduleCodes, domainList) => {
    const domainDtoList = domainList || getPublicCacheSync("domainList")?.domainDtoList || []
    let results = []
    moduleCodes.forEach(moduleCode => {
       let domains = domainDtoList.filter(i => i.moduleCode === moduleCode)
       let thresholdNum = getDomainNumThreshold(moduleCode)
       if(domains.length <= thresholdNum) {
         results.push(moduleCode)
       }
    })
    return results.length
}

// 域名列表根据优先级排序
export const domainListSort = (domainList) => {
   if(!domainList || domainList.length<=1) return domainList
   return domainList.sort((a, b) => {
        const priorityA = (a.priority || Infinity) - 0;
        const priorityB = (b.priority || Infinity) - 0;
        // 比较 priority 属性
        if (priorityA < priorityB) {
            return -1; // a 排在 b 前面
        } else if (priorityA > priorityB) {
            return 1;  // b 排在 a 前面
        } else {
            return 0;
        }
    });

}
