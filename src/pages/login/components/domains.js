import { getClientTokenData } from "@/utils/trendsDomain/manageToken";
import analyst from "@/socket/analyst";

// 预埋域名配置 - 需要下载解密的oss文件地址
const OSS_CONFIG_URLS = {
    // 登录备用域名oss文件地址
    backup_url: "https://backup-res2.oss-cn-hongkong.aliyuncs.com/config/backup_url",
    // domain预埋oss域名文件地址
    domainOssConfigUrl: "https://a1-res2.oss-cn-hongkong.aliyuncs.com/domainapi_url-b2.txt",
    // socket预埋oss域名文件地址
    socketOssConfigUrl: "https://backup-chat6kyo-res.oss-ap-northeast-1.aliyuncs.com/config/chat_url.txt",
};

// 预埋域名配置 - 直接可用的域名地址
const DIRECT_DOMAIN_URLS = {
    // 登录预埋域名地址
    local_login_url: "https://blo.yimengwh.xyz",
    // 新版本登录预埋域名地址
    local_loginV2_url: "https://openchat-loginv2.evanth.xyz",
    // domain预埋域名地址
    domainEmbedUrl: "https://a1.uuds.xyz",
};

// 合并所有配置
const DOMAIN_CONFIG = {
    ...OSS_CONFIG_URLS,
    ...DIRECT_DOMAIN_URLS,
};

// 获取域名列表
const getDomainList = async (key = 'backup_url') => {
    let result = [];

    // 直接域名，无需下载解密
    if (DIRECT_DOMAIN_URLS[key]) {
        const url = DIRECT_DOMAIN_URLS[key];
        result = [{ domainUrl: url }];
        return result;
    }

    // OSS文件地址，需要下载解密
    const url = OSS_CONFIG_URLS[key];
    if (!url) {
        console.log("getDomainList: invalid key", key);
        return result;
    }

    try {
        const response = await fetch(url);
        if (response.ok) {
            const content = await response.text();
            // Base64 解密
            const decrypted = JSON.parse(atob(content));
            result = formatDomainList(decrypted);
        }
    } catch (error) {
        console.log("getDomainList error:", error);
    }
    return result;
};

// 格式化域名列表
const formatDomainList = (data) => {
    let list = [];
    if (!data) return list;
    // 优先取 url 字段
    if (data.url && Array.isArray(data.url)) {
        list = data.url.map(item => {
            if (typeof item === 'string') {
                return { domainUrl: item };
            }
            return item;
        });
    } else if (Array.isArray(data)) {
        list = data.map(item => {
            if (typeof item === 'string') {
                return { domainUrl: item };
            }
            return item;
        });
    } else if (data.list && Array.isArray(data.list)) {
        list = data.list;
    } else if (data.domains && Array.isArray(data.domains)) {
        list = data.domains;
    }
    return list;
};

// 遍历获取所有OSS配置的域名列表
const getAllOssDomainList = async () => {
    let allDomains = {};
    const keys = Object.keys(OSS_CONFIG_URLS);

    for (const key of keys) {
        const list = await getDomainList(key);
        allDomains[key] = list;
        console.log(`getDomainList [${key}]:`, list);
    }

    return allDomains;
};

// 遍历获取所有域名列表（包括OSS和直接域名）
const getAllDomainList = async () => {
    let allDomains = {};

    // 获取OSS配置的域名列表
    for (const key of Object.keys(OSS_CONFIG_URLS)) {
        const list = await getDomainList(key);
        allDomains[key] = list;
        console.log(`getDomainList [${key}]:`, list);
    }

    // 获取直接域名列表
    for (const key of Object.keys(DIRECT_DOMAIN_URLS)) {
        const list = await getDomainList(key);
        allDomains[key] = list;
        console.log(`getDomainList [${key}]:`, list);
    }

    return allDomains;
};

export const domainsTesting = async () => {
    const allDomains = await getAllDomainList();
    console.log('allDomains:', allDomains);
    const checkResults = await checkDomainList(allDomains);
    console.log('checkResults:', checkResults);
    return { allDomains, checkResults };
};

// 通用请求头
const getCommonHeaders = () => {
    return {
        'Content-Type': 'application/json',
    };
};

// 通用客户端信息
const getClientInfo = () => {
    return {
        clientType: 3,
        packageName: "ocs-im",
        versionCode: 1,
        versionName: "1.6.8",
    };
};

// 检查域名 - 通过获取二维码接口
const checkDomainByGetQrcode = async (domainUrl) => {
    const url = `${domainUrl.replace(/\/$/, '')}/login/qrCodeUrl`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: getCommonHeaders(),
            body: JSON.stringify({ clientInfo: getClientInfo() }),
        });
        if (!response.ok) {
            return { domainUrl, qrcode: 'failed', error: `HTTP ${response.status}` };
        }
        const data = await response.arrayBuffer();
        // 检查是否有返回数据（token存在）
        if (data && data.byteLength > 0) {
            return { domainUrl, qrcode: 'success' };
        }
        return { domainUrl, qrcode: 'failed', error: 'no token' };
    } catch (error) {
        return { domainUrl, qrcode: 'failed', error: error.message };
    }
};

// 获取客户端Token（使用项目已有的函数）
const getClientToken = async () => {
    try {
        const tokenData = await getClientTokenData();
        if (tokenData && tokenData.accessToken) {
            return {
                success: true,
                accessToken: tokenData.accessToken,
                secretKey: tokenData.secretKey,
            };
        }
        return { success: false, error: 'no token in response' };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// 检查域名 - 通过获取域名列表接口（需要token）
const checkDomainByGetListDomain = async (domainUrl, tokenResult) => {
    // 如果没有传入token，则先获取
    if (!tokenResult) {
        tokenResult = await getClientToken(domainUrl);
    }
    if (!tokenResult.success) {
        analyst.traceLoginDomainsListDomain(false, `getToken failed: ${tokenResult.error}`);
        return { domainUrl, listDomain: 'failed', error: `getToken failed: ${tokenResult.error}` };
    }

    const url = `${domainUrl.replace(/\/$/, '')}/api/v4/listDomain`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                ...getCommonHeaders(),
                'accessToken': tokenResult.accessToken,
            },
            body: JSON.stringify({
                clientReq: getClientInfo(),
                data: {},
            }),
        });
        if (!response.ok) {
            analyst.traceLoginDomainsListDomain(false, `HTTP ${response.status}`);
            return { domainUrl, listDomain: 'failed', error: `HTTP ${response.status}` };
        }
        const result = await response.json();
        // 检查是否有list
        if (result && (result.data || result.list || result.code === 200)) {
            const dto = result.domainDtoList || result.data?.domainDtoList;
            analyst.traceLoginDomainsListDomain(true, "check ok", Array.isArray(dto) ? dto : undefined);
            return { domainUrl, listDomain: 'success' };
        }
        analyst.traceLoginDomainsListDomain(false, "no list");
        return { domainUrl, listDomain: 'failed', error: 'no list' };
    } catch (error) {
        analyst.traceLoginDomainsListDomain(false, error.message);
        return { domainUrl, listDomain: 'failed', error: error.message };
    }
};

// 检查WSS域名 - 通过连接测试
const checkWssDomainByConnect = (domainUrl, timeout = 5000) => {
    return new Promise((resolve) => {
        let wsUrl = domainUrl;
        // 确保有ws前缀
        if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
            wsUrl = 'wss://' + wsUrl;
        }

        let ws = null;
        let timeoutId = null;

        const cleanup = () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (ws) {
                ws.onopen = null;
                ws.onerror = null;
                ws.onclose = null;
                ws.close();
            }
        };

        try {
            ws = new WebSocket(wsUrl);

            timeoutId = setTimeout(() => {
                cleanup();
                resolve({ domainUrl, wss: 'failed', error: 'timeout' });
            }, timeout);

            ws.onopen = () => {
                cleanup();
                resolve({ domainUrl, wss: 'success' });
            };

            ws.onerror = (e) => {
                cleanup();
                resolve({ domainUrl, wss: 'failed', error: 'connection error' });
            };

            ws.onclose = (e) => {
                cleanup();
                resolve({ domainUrl, wss: 'failed', error: 'connection closed' });
            };
        } catch (error) {
            cleanup();
            resolve({ domainUrl, wss: 'failed', error: error.message });
        }
    });
};

// 检查域名 - 通过简单fetch请求
const checkDomainByFetchUrl = async (domainUrl, timeout = 5000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(domainUrl, {
            method: 'GET',
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (response.ok) {
            return { domainUrl, fetch: 'success', status: response.status };
        }
        return { domainUrl, fetch: 'failed', error: `HTTP ${response.status}` };
    } catch (error) {
        clearTimeout(timeoutId);
        return { domainUrl, fetch: 'failed', error: error.message };
    }
};

// 检查域名列表 - 所有域名均检查四项
const checkDomainList = async (allDomains) => {
    const results = {};

    // 使用项目已有函数获取一次token，供所有需要的API使用
    const tokenResult = await getClientToken();
    console.log('getClientToken result:', tokenResult);

    // 遍历所有域名配置
    for (const [key, domainList] of Object.entries(allDomains)) {
        results[key] = [];

        for (const item of domainList) {
            const domainUrl = item.domainUrl || item;

            // 所有域名均检查四项（使用统一的token）
            const [qrcodeResult, listDomainResult, wssResult, fetchResult] = await Promise.all([
                checkDomainByGetQrcode(domainUrl),
                checkDomainByGetListDomain(domainUrl, tokenResult),
                checkWssDomainByConnect(domainUrl),
                checkDomainByFetchUrl(domainUrl),
            ]);

            const checkResult = {
                domainUrl,
                qrcode: qrcodeResult.qrcode,
                qrcodeError: qrcodeResult.error,
                listDomain: listDomainResult.listDomain,
                listDomainError: listDomainResult.error,
                wss: wssResult.wss,
                wssError: wssResult.error,
                fetch: fetchResult.fetch,
                fetchError: fetchResult.error,
            };

            results[key].push(checkResult);
            console.log(`checkDomainList [${key}]:`, checkResult);
        }
    }

    // 在结果中记录token状态
    results._tokenStatus = {
        success: tokenResult.success,
        error: tokenResult.error,
    };

    return results;
};

export {
    DOMAIN_CONFIG,
    OSS_CONFIG_URLS,
    DIRECT_DOMAIN_URLS,
    getDomainList,
    getAllOssDomainList,
    getAllDomainList,
    formatDomainList,
    checkDomainList,
    getClientToken,
    checkDomainByGetQrcode,
    checkDomainByGetListDomain,
    checkWssDomainByConnect,
    checkDomainByFetchUrl,
};
