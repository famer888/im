import Vue from "vue";
import { getUrl, baseUrl } from "./base/unit";
import axios from "axios";
import { reportErrorDomain } from "@/utils/trendsDomain/manageReport";
import { repairToken } from "@/utils/trendsDomain/manageToken";
import {
    _encrypt,
    _decrypt,
    decrypt,
    encrypt,
    encryptHex,
    decryptHex,
} from "./base";
// const CryptoJS = require('crypto-js');
let CryptoJS = require("./base/crypto-js.min.js");
// 事件
import eventCommon from "@/event/common.js";

export const getDomainUrl = () => {
    const domains = eventCommon.fnDomainsGet();
    return domains?.domain || process.env.VUE_APP_BASE_DOMAIN;
};

// let domainUrl ="http://test-do3main-api.68chat.co"

export const getClientToken = (clientInfo, opts) => {
    const { domain = "" } = opts || {};
    const pra = {
        protoType: "web",
        type: "ClientToken",
        url: `${domain || baseUrl("webBiz")}/domain/clientToken`,
        data: { clientInfo },
        isRepairDomain: false,
    };

    return getUrl(pra);
};

// 获取动态域名池
export const getDomainListApi = (payload) => {
    return postAxios(`${getDomainUrl()}/api/v4/listDomain`, payload.datas, {
        headers: { accessToken: payload.headers.accessToken },
        secretKey: payload.secretKey,
    });
};

// 上报异常域名接口
export const reportErrorDomainApi = (payload) => {
    return postAxios(`${getDomainUrl()}/api/v4/report`, payload.datas, {
        headers: { accessToken: payload.headers.accessToken },
        secretKey: payload.secretKey,
    });
};

// 批量上报异常域名接口
export const batchReportErrorDomainApi = (payload) => {
    return postAxios(`${getDomainUrl()}/api/v4/batchReport`, payload.datas, {
        headers: { accessToken: payload.headers.accessToken },
        secretKey: payload.secretKey,
    });
};

const postAxios = async (url, data, opts) => {
    const { secretKey } = opts;
    let prams = {
        clientReq: eventCommon.fnClientInfoGet(),
        data,
    };

    if (secretKey) {
        prams.data = encryptHex(JSON.stringify(data), secretKey);
    }

    let result = "";
    try {
        result = await requestAxios(url, prams, opts);
    } catch (error) {
        console.error("postAxios-3-", error);
        repairToken();
    }

    if (secretKey && result) {
        result = decryptHex(result, secretKey);
        result = JSON.parse(result);
    }
    return result || {};
};

function requestAxios(url, params, opts) {
    const { method = "POST", headers = {} } = opts || {};

    return new Promise((resolve, reject) => {
        const finalHeaders = { "Content-Type": "application/json", ...headers };
        const httpDefault = {
            method,
            url: url,
            data: params,
            timeout: 5000,
            headers: finalHeaders, // 设置请求头
        };
        axios(httpDefault)
            .then((values) => {
                const res = values?.data || {}
                if (res?.code === 200) {
                    resolve(res.data);
                } else {
                    reject(res);
                }
            })
            .catch((err) => {
                reject(err);
            });
    });
}
