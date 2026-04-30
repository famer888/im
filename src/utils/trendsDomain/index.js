import {
    pollingUpdateDomainPool,
    updatePreloadedDomainList,
    updateTrendsDomain,
} from "./manageDomainUpdate";
import { getFirstNormalDomain } from "./manageDomain";
import { pollingCheckErrorDomain } from "./manageErrorDomain";
import { updateToken } from "./manageToken";
import { pollingBatchReport } from "./manageReport";
import { getOssDomain } from "./manageOssDownUpload";
// 事件
import eventCommon from "@/event/common.js";

// 设置当前使用的域名
export const setCurrentUseDomain = (domainList) => {
    let domains = eventCommon.fnDomainsGet();
    for (let moduleCode in domains) {
        let moduleUrls = domainList.filter(
            (item) => item.moduleCode === moduleCode
        );
        if (moduleUrls.length && moduleUrls[0]) {
            domains[moduleCode] = moduleUrls[0]?.domainUrl || "";
        }
    }
    eventCommon.fnDomainsSet(domains);
};

// 初始化域名
export const initDomain = async () => {
    pollingUpdateDomainPool();
    pollingCheckErrorDomain();
    pollingBatchReport();
    await updatePreloadedDomainList();
    await updateToken();
    await updateTrendsDomain();
    await getOssDomain()
};

// 获取一个新的可用域名
export const getNewNormalDomain = async (moduleCode) => {
    let result = "";
    try {
        result = await getFirstNormalDomain(moduleCode);
    } catch (error) {
        console.log(error);
    }
    return result;
};
