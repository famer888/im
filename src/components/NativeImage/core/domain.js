// DomainAdapter（design.md §12.4 / §8）
//
// 本期实现：
//   - 仅做"用 ossDefaultUrl 替换 host"，逻辑与 manageOssDownUpload.getOssFirstNormalUrl 等价。
//   - 重写发生在 renderer 侧（Avatar 拼 url 之前），native-image:// 编码里直接是改写后的 URL，
//     main 端 downloader 拿到即用。
//
// 预留（description #1 / #11 / §8.2）：
//   - selectHost / report 接口先定义；接 trendsDomain 池后由 main 端持有，按 failedHosts /
//     channelType 选 host，与 renderer 解耦（届时 main 通过状态机回滚事件触发 attempt+1）。
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
        const { ossDefaultUrl } = (eventCommon?.fnDomainsGet?.() || {});
        if (!ossDefaultUrl) return originalUrl;
        const remaining = getRemainingUrl(originalUrl);
        return String(ossDefaultUrl).replace(/\/$/, '') + remaining;
    } catch (_e) {
        return originalUrl;
    }
};

/**
 * 默认 adapter（main 侧调用形态，本期未启用）：把 host 替换为 ossDefaultUrl 透传给 downloader.fetch。
 *
 * 注意：当前本期的"renderer 端先重写"路径已经把改写完成的 URL 编码进 native-image:// 里，
 * main 端默认不再重复重写；这里保留 adapter shape 仅供 description #1 接 trendsDomain 池时使用。
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
