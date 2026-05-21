// DomainAdapter（design.md §12.4 / §8）
//
// 本期实现（两段式 candidateUrls，对齐旧 image.vue 的 loadUrl → loadErr 双段语义）：
//   - rewriteHost(url)：把 host 替换为 ossDefaultUrl，逻辑与 manageOssDownUpload.getOssFirstNormalUrl 等价。
//   - wouldRewrite(url)：纯查询，原 url 的 host 与 ossDefaultUrl 的 host 是否不同（仅 host 比较）。
//   - buildAvatarCandidates(url)：根据上面两个原语产出 Avatar 的"按优先级排序的候选 url 数组"：
//       * 不需要重写（无 ossDefaultUrl / 已是 oss host） → [原 url]
//       * 需要重写 → [原 url, rewriteHost(原 url)]
//     这个数组通过 ipc.resolve 传给 main，drivePipeline 在 fetch 阶段按数组顺序失败循环（§5.1）。
//     状态机和观察者全程只看到一次 downloading → ready 或 downloading → downloadError，
//     不会感知"中间错误"，从而避免视觉上"闪默认 icon 再切回真图"的抖动。
//
// 为什么不在 main 端读 eventCommon：
//   ossDefaultUrl 是 renderer 侧的动态域名池状态（trendsDomain），main 端没有直接句柄；
//   要让 main 拿到，要么 IPC push、要么 require renderer 模块（vue 不可在 main 跑）。
//   选择"在 renderer 把 candidates 算好作为 IPC 入参"——
//   * main 端 pipeline 对"候选从哪来"完全不关心，纯按数组顺序重试，简单且可测；
//   * trendsDomain 池升级（§8.2）时只需 renderer 端把更多候选放进数组，main 端零改动；
//   * 真正接入 main 持有的 trendsDomain 池时，再让 `_domainAdapter.pick` 在循环内
//     按 attempt 进一步重写每个 candidate（candidate × pick 两层），向前兼容。
//
// 预留（description #1 / #11 / §8.2）：
//   - selectHost / report 接口先定义；接 trendsDomain 池后由 main 端持有，按 failedHosts /
//     channelType 选 host，与 renderer 解耦。
//   - 失败重试钩子在 downloader 的 cancelToken 处插桩；本期不实现。

import { getRemainingUrl } from '@/utils/base';

/**
 * @typedef {Object} DomainAdapter
 * @property {(originalUrl: string, opts?: { attempt?: number, failedHosts?: string[], channelType?: number }) => Promise<string>} pick
 * @property {(host: string, info: { reason: string, statusCode?: number }) => Promise<void>} [report]
 */

/**
 * 同步 host 替换（renderer 侧；ossDefaultUrl 已在内存里）。
 * 与 manageOssDownUpload.getOssFirstNormalUrl 同语义，但不必走 await。
 *
 * @param {string} originalUrl
 * @param {{ fnDomainsGet?: () => { ossDefaultUrl?: string } }} eventCommon
 * @returns {string}
 */
export const rewriteHost = (originalUrl, eventCommon) => {
    if (!originalUrl) return originalUrl;
    if (!/^https?:\/\//i.test(originalUrl)) return originalUrl;
    try {
        const { ossDefaultUrl } = ((eventCommon && typeof eventCommon.fnDomainsGet === 'function' && eventCommon.fnDomainsGet()) || {});
        if (!ossDefaultUrl) return originalUrl;
        const remaining = getRemainingUrl(originalUrl);
        return String(ossDefaultUrl).replace(/\/$/, '') + remaining;
    } catch (_e) {
        return originalUrl;
    }
};

/**
 * 判断"对 originalUrl 调 rewriteHost 后，host 是否会改变"。
 *
 * 用途：avatar 两段式候选构造（§8.1）—— 当 ossDefaultUrl 缺失，或原 url 已经在 oss 域上时，
 * "把 oss 重写后的 url 加进候选"没有意义，candidate 退化为单元素 [原 url]，省一次必然失败
 * 的请求 + 一次 invalidate / dispatch 抖动。
 *
 * 只比较 host（含端口）：
 *   - protocol 差异（http vs https）：oss 池自己决定走哪种，不应阻止重试候选；
 *   - path/query 差异：rewriteHost 本来保留 path+query，不影响"重试是否值得"。
 * 任何解析异常（非 http(s) / URL ctor throw）一律 false：上层默认"不加 oss 候选"，
 * 保持与"未配 ossDefaultUrl"等价的语义。
 */
export const wouldRewrite = (originalUrl, eventCommon) => {
    try {
        if (!originalUrl || !/^https?:\/\//i.test(originalUrl)) return false;
        const { ossDefaultUrl } = ((eventCommon && typeof eventCommon.fnDomainsGet === 'function' && eventCommon.fnDomainsGet()) || {});
        if (!ossDefaultUrl) return false;
        const origHost = new URL(originalUrl).host;
        const ossHost = new URL(/^https?:\/\//i.test(ossDefaultUrl) ? ossDefaultUrl : `http://${ossDefaultUrl}`).host;
        return !!origHost && !!ossHost && origHost !== ossHost;
    } catch (_e) {
        return false;
    }
};

/**
 * Avatar 两段式候选构造（§8.1）。返回按优先级排序的 url 数组：
 *   [原 url]                       —— 原 host 已是 oss / 缺 ossDefaultUrl / 非 http(s) 等
 *   [原 url, rewriteHost(原 url)]  —— oss host 与原 host 不同，多挂一个 oss 重写后的 url 兜底
 *
 * main 端 drivePipeline 拿到这个数组后，fetch 阶段按顺序失败循环，全部失败才 dispatch 终态。
 * 数组内的字符串可能重复（极端情况）—— main 端会再做一次去重，本函数不强制。
 *
 * 不返回 null / 空数组：调用方拿到的一定是至少 1 个候选；空 src 由 Avatar.hasRealSrc 在
 * 挂 NativeImage 前就拦掉，不会走到这里。
 */
export const buildAvatarCandidates = (originalUrl, eventCommon) => {
    if (!originalUrl) return [];
    if (!wouldRewrite(originalUrl, eventCommon)) return [originalUrl];
    return [originalUrl, rewriteHost(originalUrl, eventCommon)];
};

/**
 * 默认 adapter（main 侧调用形态，本期未启用）：把 host 替换为 ossDefaultUrl 透传给 downloader.fetch。
 *
 * 注意：本期 main 端默认不持有 _domainAdapter，drivePipeline 直接消费 ipc 传过来的 candidateUrls；
 * 这里保留 adapter shape 仅供 description #1 接 trendsDomain 池时由 main 端注入使用 ——
 * 届时 adapter 在 candidate 循环内对每个候选再按 attempt 进一步重写（candidate × pick 两层）。
 */
export const createOssDefaultAdapter = (eventCommon) => ({
    name: 'ossDefault',
    async pick(originalUrl /*, opts */) {
        return rewriteHost(originalUrl, eventCommon);
    },
    async report(/* host, info */) {
        // 本期不上报；description #1 接入 trendsDomain 时落地
    },
});

/** [预留] 轮换/降权 adapter 占位；接入 description #1 时实现，base 不动。 */
export const createRotationAdapter = (/* options */) => ({
    name: 'rotation',
    async pick(originalUrl /*, { attempt = 0, failedHosts = [], channelType = 0 } = {} */) {
        // TODO: 调用 manageDomain.getTrendsDomainPool，按 attempt + failedHosts 选 host
        return originalUrl;
    },
    async report(/* host, info */) {
        // TODO: 调用 manageReport.reportErrorDomain
    },
});
