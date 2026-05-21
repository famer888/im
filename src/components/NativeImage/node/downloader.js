// 重写下载器（design.md §5.2，落 description #16）
// 用 Electron net.request 代替 webContents.downloadURL：
//   - 拿得到 HTTP statusCode → 4xx/410/404 映射 expired
//   - 支持 cancelToken → 派生卸载即时 abort
//   - 流式写到工作目录，不污染结果目录

import fs from 'fs';
import { net } from 'electron';
import { allocWorkFile } from './paths';
import { ERROR_CODE, classifyHttpStatus } from '../core/constants';

/**
 * @typedef {Object} DownloadResult
 * @property {number}  statusCode
 * @property {object}  headers
 * @property {string}  workPath
 * @property {number}  bytes
 */

/**
 * @param {string} url
 * @param {{
 *   timeoutMs?: number,
 *   onProgress?: (bytes: number, total: number) => void,
 *   cancelToken?: { cancelled: boolean, abort?: () => void },
 * }} opts
 * @returns {Promise<DownloadResult>}
 */
export const download = (url, opts = {}) => {
    const { timeoutMs = 20000, onProgress, cancelToken } = opts;
    const workPath = allocWorkFile('download', '.part');

    return new Promise((resolve, reject) => {
        let settled = false;
        const settle = (fn) => { if (!settled) { settled = true; fn(); } };

        const req = net.request({ method: 'GET', url, redirect: 'follow' });

        let totalBytes = 0;
        let receivedBytes = 0;
        let ws = null;
        let timeoutId = null;

        const cleanup = () => {
            if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
            if (ws) { try { ws.destroy(); } catch (_) {} ws = null; }
        };

        const fail = (errCode, detail = {}) => settle(() => {
            cleanup();
            try { fs.unlinkSync(workPath); } catch (_) {}
            reject({ code: errCode, detail, at: Date.now() });
        });

        // cancelToken：装上 abort 回调供 taskRegistry 调
        if (cancelToken) {
            cancelToken.abort = () => {
                try { req.abort(); } catch (_) {}
                fail(ERROR_CODE.ABORT, { reason: 'cancelled by registry' });
            };
        }

        timeoutId = setTimeout(() => fail(ERROR_CODE.TIMEOUT, { timeoutMs }), timeoutMs);

        req.on('response', (response) => {
            const status = response.statusCode;
            const headers = response.headers || {};
            const httpErr = classifyHttpStatus(status);
            if (httpErr) {
                response.on('data', () => {}); // drain
                response.on('end', () => fail(httpErr, { status }));
                return;
            }

            totalBytes = Number(headers['content-length'] || 0);
            ws = fs.createWriteStream(workPath);
            ws.on('error', (e) => fail(ERROR_CODE.NETWORK, { stage: 'write', message: e.message }));

            response.on('data', (chunk) => {
                receivedBytes += chunk.length;
                ws.write(chunk);
                if (typeof onProgress === 'function') {
                    try { onProgress(receivedBytes, totalBytes); } catch (_) {}
                }
            });
            response.on('end', () => {
                if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
                // 必须 await 写流 flush 完成才能让下游（headerCheck.verify）正确 stat 文件。
                // 旧实现：cleanup 里 ws.end() 不等 'finish' 就 resolve，导致 fs.stat() 时
                // 文件还在缓冲中，size=0 → headerCheck tooSmall → decryptError（间歇性表现：
                // 同一张图每次可能成功也可能失败，取决于下游读时刻 flush 是否完成）。
                const localWs = ws;
                ws = null;
                if (!localWs) {
                    settle(() => resolve({ statusCode: status, headers, workPath, bytes: receivedBytes }));
                    return;
                }
                localWs.end(() => {
                    settle(() => resolve({ statusCode: status, headers, workPath, bytes: receivedBytes }));
                });
            });
            response.on('error', (e) => fail(ERROR_CODE.NETWORK, { stage: 'response', message: e.message }));
        });

        req.on('error', (e) => fail(ERROR_CODE.NETWORK, { stage: 'request', message: e.message }));
        req.on('abort', () => fail(ERROR_CODE.ABORT, { stage: 'request' }));

        req.end();
    });
};
