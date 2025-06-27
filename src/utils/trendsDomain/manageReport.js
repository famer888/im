import { checkDomainIsError, setErrorRecord } from "./manageErrorDomain";
import { getClientTokenData } from "./manageToken";
import { getCurrentTimestamp13Digits, sortObjectByKeys, getUrlDomain, isPastTimestamp } from "./tools";
import { generateSign, getModuleType, getDeviceType } from "./workTools";
import { reportErrorDomainApi, batchReportErrorDomainApi } from "@/api/imDomain";
import { domainPoolDeleteData } from "./manageDomain";

let lastReportTime = 0;

let waitReport = {
    list: [],
    add(dmianUrl, prams) {
       let newList = this.list.filter(item => item.dmianUrl !== dmianUrl)
       newList.push({dmianUrl, prams})
       this.list = newList
    },
    clear() {
        this.list = []
    }
};

export const pollingBatchReport = () => {
    clearInterval(window.timerBatchReport)
    window.timerBatchReport = setInterval(() => {
    if(waitReport.list.length) {
        batchReport()
    }
  }, 1000 * 10);
}

const batchReport = async () => {
    let list = waitReport.list
    if(!list.length) return
    const { mchId, secretKey, accessToken } = await getClientTokenData();  
    list.forEach(item => {
        item.prams.mchId = mchId
    })
    let pra = {
        secretKey,
        datas: list.map(item => item.prams), 
        headers: { accessToken },
    } 
    batchReportErrorDomainApi(pra) 
    waitReport.clear()
}

// 上报异常域名
export const reportErrorDomain = async (errorPath, opts) => {
    let { 
        httpStatus = 0,
        errorDesc = "", 
        moduleCode = "",
    } = opts || {};


    if([429, 403,502, 504].includes(httpStatus)) return


    let domainUrl = getUrlDomain(errorPath);
    let reqTime = Number(getCurrentTimestamp13Digits());

    if(!moduleCode) {
     moduleCode = getModuleType(errorPath).name;
    }

    domainPoolDeleteData(domainUrl, moduleCode)

    if(checkDomainIsError(domainUrl)) {
        return
    } 

    const { mchId, secretKey, accessToken } = await getClientTokenData();  
    let reportReq = {
        deviceIp: "",
        deviceNo: "",
        deviceType: getDeviceType() || "pc",
        domainSource: 0,
        domainUrl,
        errorDesc: errorDesc.toString(),
        errorType: 0,
        errorPath,
        httpStatus,
        mchId,
        moduleCode,
        reqTime,
        responseType: 0,
        sign: "",
    }

    reportReq = sortObjectByKeys(reportReq)
    reportReq.sign = generateSign(reportReq, secretKey)

    const pra = {
        secretKey,
        datas: reportReq, 
        headers: { accessToken },
    }
    if(isPastTimestamp(lastReportTime, 10000)) {
        lastReportTime = Date.now()
        reportErrorDomainApi(pra)
    } else {
        waitReport.add(domainUrl, reportReq) 
    }
    setErrorRecord(domainUrl, reqTime)
}
