/**
 * 主进程跨域处理（Electron webRequest 层）
 *
 * 背景：
 *   渲染进程里的 OSS SDK 直传 / CDN 回源 OSS 经常因源站没配 CORS 或预检返回 4xx/5xx
 *   而失败。由于业务接入的是"动态下发"的域名，无法维护可靠的域名白名单，所以判定
 *   完全基于**请求 / 响应的指纹**：
 *     1) onBeforeSendHeaders —— 实际请求看 `Authorization: OSS ...` 或任意 `x-oss-*`，
 *        预检 OPTIONS 看 `Access-Control-Request-Headers` 是否列了 `x-oss-*`。
 *     2) onHeadersReceived   —— 用 `Server: AliyunOSS` / `x-oss-request-id` 兜底，
 *        即便 OSS 拒绝该请求也会带这两个响应头。
 *
 * 命中 OSS：清掉源站 CORS 头后强制注入一套宽松配置；OPTIONS 预检非 2xx 改写成 200 OK。
 * 未命中：   走温和策略（只在缺失时补齐，已有多值时挑一个有效值）。
 *
 * 对外只暴露 installCorsHandlers(session)，在 app ready 后调用一次。
 */

const OSS_ALLOW_HEADERS = [
    "Authorization",
    "Content-Type",
    "Content-MD5",
    "Content-Length",
    "Content-Disposition",
    "Cache-Control",
    "Origin",
    "Accept",
    "X-Requested-With",
    "x-oss-date",
    "x-oss-user-agent",
    "x-oss-security-token",
    "x-oss-content-sha256",
    "x-oss-meta-*",
    "x-oss-copy-source",
    "x-oss-copy-source-range",
    "x-oss-server-side-encryption",
    "x-oss-object-acl",
    "x-oss-storage-class",
].join(", ");

const OSS_EXPOSE_HEADERS =
    "ETag, x-oss-request-id, x-oss-version-id, Content-Length, Content-Type";

const OSS_ALLOW_METHODS = "GET, POST, PUT, DELETE, HEAD, OPTIONS, PATCH";

const STRIP_CORS_HEADER_NAMES = [
    "access-control-allow-origin",
    "access-control-allow-headers",
    "access-control-allow-methods",
    "access-control-allow-credentials",
    "access-control-expose-headers",
    "access-control-max-age",
];

// 防止 ossRequestIds 无限增长的阈值
const OSS_REQ_MAX = 2000;
const OSS_REQ_TTL_MS = 10 * 60 * 1000;

const findHeaderKey = (headers, name) =>
    Object.keys(headers).find((k) => k.toLowerCase() === name);

/**
 * 基于请求头判断是否是 OSS 请求
 *   - Authorization: `OSS ...` / `OSS4-HMAC-SHA256 ...`
 *   - 任意 x-oss-* 请求头（实际请求）
 *   - Access-Control-Request-Headers 里列了 x-oss-*（预检 OPTIONS）
 */
function isOssByRequest(requestHeaders) {
    const h = requestHeaders || {};
    let auth = "";
    let acrh = "";
    let hasOssHdr = false;
    for (const k of Object.keys(h)) {
        const lk = k.toLowerCase();
        if (lk === "authorization") {
            auth = Array.isArray(h[k]) ? h[k].join(",") : h[k];
        } else if (lk === "access-control-request-headers") {
            acrh = (Array.isArray(h[k]) ? h[k].join(",") : h[k]).toLowerCase();
        } else if (lk.startsWith("x-oss-")) {
            hasOssHdr = true;
        }
    }
    return /^oss[ 4]/i.test(auth) || hasOssHdr || acrh.includes("x-oss-");
}

/**
 * 基于响应头判断是否来自 OSS（Server: AliyunOSS 或 x-oss-request-id）
 * 即便 OSS 拒绝请求也会带这两个头，所以可以作为兜底
 */
function isOssByResponse(responseHeaders) {
    const h = responseHeaders || {};
    for (const k of Object.keys(h)) {
        const lk = k.toLowerCase();
        if (lk === "x-oss-request-id") return true;
        if (lk === "server") {
            const v = (h[k] || []).join(",");
            if (/aliyunoss/i.test(v)) return true;
        }
    }
    return false;
}

/** 命中 OSS：覆写 CORS 头 */
function applyOssCors(headers) {
    STRIP_CORS_HEADER_NAMES.forEach((name) => {
        const k = findHeaderKey(headers, name);
        if (k) delete headers[k];
    });
    headers["Access-Control-Allow-Origin"] = ["*"];
    headers["Access-Control-Allow-Methods"] = [OSS_ALLOW_METHODS];
    headers["Access-Control-Allow-Headers"] = [OSS_ALLOW_HEADERS];
    headers["Access-Control-Expose-Headers"] = [OSS_EXPOSE_HEADERS];
    headers["Access-Control-Max-Age"] = ["86400"];
}

/**
 * 未命中 OSS：温和策略
 *   - ACAO 有多值时保留一个有效值，避免 "multiple values" 报错
 *   - 缺失时补 "*"
 */
function applyLenientCors(headers) {
    const acaoKey = findHeaderKey(headers, "access-control-allow-origin");
    if (acaoKey) {
        const values = headers[acaoKey]
            .flatMap((v) => v.split(",").map((s) => s.trim()))
            .filter(Boolean);
        if (values.length > 1) {
            delete headers[acaoKey];
            headers["Access-Control-Allow-Origin"] = [
                values.find((v) => v !== "*") || "*",
            ];
        }
    } else {
        headers["Access-Control-Allow-Origin"] = ["*"];
    }
    if (!findHeaderKey(headers, "access-control-allow-headers")) {
        headers["Access-Control-Allow-Headers"] = ["*"];
    }
    if (!findHeaderKey(headers, "access-control-allow-methods")) {
        headers["Access-Control-Allow-Methods"] = ["*"];
    }
}

/**
 * 把预检 OPTIONS 的非 2xx 状态改写成 200 OK
 * 否则浏览器会报 "Response to preflight request doesn't pass access control check:
 * It does not have HTTP ok status."
 */
function rewritePreflightStatus(details) {
    const method = (details.method || "").toUpperCase();
    if (method !== "OPTIONS") return details.statusLine;
    const sc = details.statusCode || 0;
    if (sc >= 200 && sc < 300) return details.statusLine;
    return "HTTP/1.1 200 OK";
}

/**
 * 在指定 session 上安装跨域处理钩子
 * 推荐在 app.on('ready') 里对 session.defaultSession 调用一次
 *
 * @param {Electron.Session} ses
 */
export function installCorsHandlers(ses) {
    // details.id -> timestamp，用来把 onBeforeSendHeaders 的判定传递到 onHeadersReceived
    const ossRequestIds = new Map();
    const markOssRequest = (id) => {
        ossRequestIds.set(id, Date.now());
        if (ossRequestIds.size > OSS_REQ_MAX) {
            const cutoff = Date.now() - OSS_REQ_TTL_MS;
            for (const [k, t] of ossRequestIds) {
                if (t < cutoff) ossRequestIds.delete(k);
            }
        }
    };

    ses.webRequest.onBeforeSendHeaders((details, callback) => {
        if (isOssByRequest(details.requestHeaders)) {
            markOssRequest(details.id);
        }
        callback({ requestHeaders: details.requestHeaders });
    });

    ses.webRequest.onHeadersReceived((details, callback) => {
        const headers = details.responseHeaders || {};

        const ossHit =
            ossRequestIds.has(details.id) || isOssByResponse(headers);
        if (ossHit) ossRequestIds.delete(details.id);

        if (ossHit) {
            applyOssCors(headers);
        } else {
            applyLenientCors(headers);
        }

        const statusLine = ossHit
            ? rewritePreflightStatus(details)
            : details.statusLine;

        callback({ responseHeaders: headers, statusLine });
    });
}
