// NativeImage 主进程入口（design.md §4.2 / §5.1 / §9，本期）
//
// background.js 应在两处分别调入：
//   1. app.ready 之前：declareSchemes()  注册 native-image 为 privileged scheme
//   2. createMainWindow 之后：register({ userData, mainWindow, domainAdapter? })
//      注册 streamProtocol + IPC handlers
//
// 整个流水线（§5.1）：
//   native-image:// 命中
//     → taskRegistry.acquire（in-flight 合并）
//     → paths.peekResult（结果目录缓存命中即 ready）
//     → domain.pick（动态域名替换 host）
//     → downloader.fetch（net.request，拿到 statusCode）
//     → [encryptKey?] headerCheck.verify → decryptor.decrypt
//     → paths.commit（fs.rename 原子提交到结果目录）
//     → COMMITTED → ready

import { app, protocol, ipcMain } from 'electron';
import fs from 'fs';
import * as paths from './paths';
import { download } from './downloader';
import * as headerCheck from './headerCheck';
import * as decryptor from './decryptor';
import * as concurrency from './concurrency';
import { decode as decodeCustomUrl } from '../core/customUrl';
import taskRegistry from '../core/taskRegistry';
import { EVENT, ERROR_CODE, PROTOCOL, STATE } from '../core/constants';
import Channels from '../ipc/channels';

let _mainWindow = null;
let _domainAdapter = null;
let _broadcastBound = false;

/**
 * background.js 在 app.whenReady().then(...) 中调用一次。
 * 必须确保 declareSchemes() 已经在 app.ready 之前调过（见 §14 风险 1）。
 */
export const register = ({ userData, mainWindow, domainAdapter } = {}) => {
    if (!app.isReady()) {
        throw new Error('[NativeImage node] register() must be called after app.ready');
    }

    _mainWindow = mainWindow || _mainWindow;
    _domainAdapter = domainAdapter || _domainAdapter;
    paths.init({ userDataDir: userData || app.getPath('userData') });

    const ok = protocol.registerStreamProtocol(PROTOCOL, handleProtocolRequest);
    if (!ok) {
        console.error(`[NativeImage node] registerStreamProtocol(${PROTOCOL}) failed`);
    }

    if (!_broadcastBound) {
        ipcMain.handle(Channels.resolve, (_evt, req) => handleResolveIpc(req));
        ipcMain.on(Channels.cancel, (_evt, req) => taskRegistry.release(req));
        ipcMain.on(Channels.invalidate, (_evt, req) => taskRegistry.invalidate(req));
        _broadcastBound = true;
    }
};

/**
 * declareSchemes()：必须在 app.ready 之前调，否则 <img src="native-image://...">
 * 直接 ERR_UNKNOWN_URL_SCHEME（§14 风险 1）。
 *
 * background.js 引导期 import 本模块即触发；漏调会在 register() 时 throw 后退化为
 * registerStreamProtocol 报 "scheme not registered as standard"，便于排查。
 */
export const declareSchemes = () => {
    protocol.registerSchemesAsPrivileged([
        {
            scheme: PROTOCOL,
            privileges: {
                standard: true,
                secure: true,
                supportFetchAPI: true,
                bypassCSP: false,
                corsEnabled: true,
                stream: true,
            },
        },
    ]);
};

/** main 端：把当前 mainWindow 暴露给 broadcastStatus；便于 register 后再创建窗口的场景。 */
export const setMainWindow = (mainWindow) => { _mainWindow = mainWindow; };

/** main 端：替换或注入域名适配器（design.md §12.4），缺省直通。 */
export const setDomainAdapter = (adapter) => { _domainAdapter = adapter; };

// ──────────────────────────────────────────────────────────────────────────────
// 主流水线（design.md §5.1）
// ──────────────────────────────────────────────────────────────────────────────

const broadcastStatus = (snap) => {
    if (!_mainWindow || (typeof _mainWindow.isDestroyed === 'function' && _mainWindow.isDestroyed())) return;
    try { _mainWindow.webContents.send(Channels.status, snap); } catch (_) {}
};

const handleResolveIpc = ({ scope, resourceKey, url, encryptKey, candidateUrls }) => {
    if (!scope || !resourceKey) {
        return { state: STATE.IDLE, taskId: null, error: { code: 'badRequest' }, resourcePath: null };
    }
    const { sm } = taskRegistry.acquire({ scope, resourceKey });
    sm.subscribe(broadcastStatus); // Set 内函数引用相同自动去重
    // 异步驱动 pipeline；不阻塞 invoke 的返回（renderer 拿到 snapshot 后立即可订阅 status）
    drivePipeline({ scope, resourceKey, url, encryptKey, candidateUrls }).catch((e) => {
        // 错误已在 pipeline 内派发到状态机；此处仅吞掉 unhandled rejection
        // 写日志便于排查（保持低噪声：只在 main 进程 stderr 上一行）
        console.warn('[NativeImage node] pipeline rejected', (e && e.code) || (e && e.message) || e);
    });
    return sm.snapshot();
};

const handleProtocolRequest = async (request, callback) => {
    const desc = decodeCustomUrl(request.url);
    if (!desc) {
        callback({ statusCode: 400, headers: {}, data: emptyStream() });
        return;
    }
    const { scope, resourceKey, url, encryptKey } = desc;

    // protocol consumer 也持一份 ref：与 renderer 端 resolve IPC 的 acquire 共同
    // 决定 refCount 归零时机；流读完 / 出错时 release，避免"renderer 还在用、
    // SM 已被误清"或反过来"流早早消费完仍卡在 ready 不清"。
    const { sm } = taskRegistry.acquire({ scope, resourceKey });
    sm.subscribe(broadcastStatus);
    let released = false;
    const releaseOnce = () => {
        if (released) return;
        released = true;
        try { taskRegistry.release({ scope, resourceKey }); } catch (_) {}
    };

    try {
        // 这里刻意不传 candidateUrls：customUrl 协议本身不携带备选列表，且时序上 ipc.resolve
        // 一定先于 streamProtocol（NativeImage.vue 是先 await ipc.resolve 拿到 snap 再 rerender
        // 出 <img src="native-image://...">），ipc.resolve 路径已经把 candidateUrls 算进 inflight，
        // 此处 drivePipeline 第一行的 peek(inflight) 必然命中复用，不会真的拿 [url] 单候选重跑。
        // 若极端时序倒置（理论上不会），退化为单候选 [url] 也安全 —— 跟未接入两段式的派生行为一致。
        const resultPath = await drivePipeline({ scope, resourceKey, url, encryptKey });
        const stream = fs.createReadStream(resultPath);
        stream.on('close', releaseOnce);
        stream.on('error', releaseOnce);
        callback({
            statusCode: 200,
            headers: { 'Content-Type': sniffMime(resultPath) },
            data: stream,
        });
    } catch (e) {
        const code = e && e.code;
        let statusCode = 500;
        if (code === ERROR_CODE.HTTP_404) statusCode = 404;
        else if (code === ERROR_CODE.HTTP_410) statusCode = 410;
        else if (code === ERROR_CODE.HTTP_403) statusCode = 403;
        else if (code === ERROR_CODE.HTTP_4XX_OTHER) statusCode = 400;
        else if (code === ERROR_CODE.ABORT) statusCode = 499;
        else if (code === ERROR_CODE.TIMEOUT) statusCode = 504;
        callback({ statusCode, headers: {}, data: emptyStream() });
        releaseOnce();
    }
};

/**
 * 真正驱动状态机走完一次。同 key 在飞复用：返回 inflight Promise。
 * @returns {Promise<string>} resultPath
 */
const drivePipeline = async ({ scope, resourceKey, url, encryptKey, candidateUrls }) => {
    const existing = taskRegistry.peek({ scope, resourceKey });
    if (existing && existing.inflight) return existing.inflight;

    // 多数 Avatar 调用点不传 uid → scope.id 恒为 0，若仅按 (kind,id) 调度会把所有头像
    // 挤进同一队列串行（群成员列表头像奇慢）。把 resourceKey 并进调度 id，使不同头像
    // 各自独立队列、可并行（受 concurrency 全局上限约束）。相同头像的在途去重已由
    // taskRegistry.peek(inflight) 在上面完成，这里不影响合并语义。
    const schedulingScope = { kind: scope.kind, id: `${scope.id}|${resourceKey}` };
    const inflight = concurrency.schedule(schedulingScope, async () => {
        const entry = taskRegistry.peek({ scope, resourceKey });
        if (!entry) {
            // 极端情况：在 schedule 排队期间被 release 掉了；直接退出
            throw { code: ERROR_CODE.ABORT, detail: { stage: 'pre-fetch' }, at: Date.now() };
        }
        const { sm, cancelToken } = entry;

        // 缓存命中
        const cached = paths.peekResult(scope, resourceKey);
        if (cached) {
            // resolving → committing → ready：保持 §13.3 写入路径一致
            sm.dispatch(EVENT.START_COMMIT, { cacheHit: true });
            sm.dispatch(EVENT.COMMITTED, { resourcePath: cached });
            return cached;
        }

        // 构造按优先级排序的候选 url 列表（design.md §8.1 两段式）：
        //   1) renderer 传入 candidateUrls（Avatar：[原 url, ossDefaultUrl 重写后 url]）
        //   2) 缺省 → [url] 单候选；保持与未接入派生（Picture/Poster 等）的行为兼容
        //   3) _domainAdapter 注入时（trendsDomain 池升级，§8.2 [预留]）由 adapter.pick
        //      在循环内对每个候选再次按 attempt 重写 host —— candidate × pick 两层，向前兼容
        // 这里只做"非空 + 去重 + 字符串"的最小清洗，不解析 URL，不限制长度。
        const rawCandidates = (Array.isArray(candidateUrls) && candidateUrls.length ? candidateUrls : [url])
            .filter((u) => typeof u === 'string' && u.length > 0);
        const seenUrls = new Set();
        const candidates = [];
        for (const u of rawCandidates) {
            if (!seenUrls.has(u)) {
                seenUrls.add(u);
                candidates.push(u);
            }
        }
        if (candidates.length === 0) {
            // 兜底：renderer 传了奇怪输入；不下载，直接 dispatch downloadError 终态便于排查
            const err = { code: ERROR_CODE.HTTP_FAIL, detail: { stage: 'pre-fetch', message: 'no candidate url' }, at: Date.now() };
            sm.dispatch(EVENT.START_FETCH, { url });
            sm.dispatch(EVENT.HTTP_FAIL, { error: err });
            throw err;
        }

        // 状态机层面这次"取数据"只发生一次：START_FETCH 用候选 0 上报，循环内不再 dispatch
        // 中间错误。两段式失败后整体只 dispatch 一次最终 HTTP_4XX / HTTP_FAIL，对外观察者
        // 看到的是 "downloading → ready" 或 "downloading → 终态错误"，不会闪烁。
        sm.dispatch(EVENT.START_FETCH, { url: candidates[0] });

        let dl;
        let lastErr;
        for (let attempt = 0; attempt < candidates.length; attempt++) {
            let finalUrl = candidates[attempt];
            // 预留：_domainAdapter 注入时在每个候选上再做 host 重写（§8.2）；
            // 本期 _domainAdapter 默认 null，下面这段是 no-op。
            if (_domainAdapter && _domainAdapter.pick) {
                try { finalUrl = await _domainAdapter.pick(finalUrl, { attempt, failedHosts: candidates.slice(0, attempt).map(hostOf) }); }
                catch (_) { finalUrl = candidates[attempt]; }
            }
            try {
                // 非最后一个候选用更短超时快速失败回退，避免某个不可达/慢域名白等满 20s
                // 导致头像迟迟不显示；最后一个候选给足 20s 尽量成功。
                const isLastCandidate = attempt === candidates.length - 1;
                dl = await download(finalUrl, {
                    cancelToken, // downloader 内会装上 abort 回调到 cancelToken.abort
                    timeoutMs: isLastCandidate ? 20000 : 8000,
                });
                lastErr = null;
                break;
            } catch (err) {
                lastErr = err;
                const code = err && err.code;
                // 显式取消：立刻终止重试链，由后面统一 dispatch 处理（这里抛给外层 catch 都行，
                // 但为了行为对称统一在循环外 dispatch）。
                if (code === ERROR_CODE.ABORT) break;
                // 上报（§8.2 [预留]）：本期 _domainAdapter 默认 null，no-op
                if (_domainAdapter && _domainAdapter.report) {
                    try { _domainAdapter.report(hostOf(finalUrl), { reason: code, statusCode: undefined }); } catch (_) {}
                }
                // 还有下一个候选 → 继续循环；耗尽 → 跳出去 dispatch 最终错误
            }
        }

        if (!dl) {
            // 所有候选都失败：派出最后一次错误终态
            const code = lastErr && lastErr.code;
            if (code === ERROR_CODE.HTTP_404 || code === ERROR_CODE.HTTP_410 ||
                code === ERROR_CODE.HTTP_403 || code === ERROR_CODE.HTTP_4XX_OTHER) {
                sm.dispatch(EVENT.HTTP_4XX, { error: lastErr });
            } else {
                sm.dispatch(EVENT.HTTP_FAIL, { error: lastErr });
            }
            throw lastErr;
        }

        // 加密：headerCheck → decrypt
        // 业务现状：同一 encryptKey 下既有"老的已加密头像"，也有"新上传的明文头像"。
        // 所以即使 caller 传了 encryptKey，也以 headerCheck 实测为准 ——
        //   ok + plain: true   → 跳过 decryptor，直接把原文件 commit（design.md §5.4.4）
        //   ok                 → 走 decryptor
        //   !ok                → VERIFY_FAIL → decryptError
        let toCommit;
        if (encryptKey) {
            sm.dispatch(EVENT.START_VERIFY);
            const v = await headerCheck.verify(dl.workPath, encryptKey).catch((e) => ({
                ok: false, reason: ERROR_CODE.WORKER_FAILED, detail: { message: e && e.message },
            }));
            if (!v.ok) {
                sm.dispatch(EVENT.VERIFY_FAIL, { error: { code: v.reason, detail: v.detail, at: Date.now() } });
                try { fs.unlinkSync(dl.workPath); } catch (_) {}
                throw { code: v.reason, detail: v.detail };
            }
            if (v.plain) {
                // 明文头像快路径：VERIFYING --START_COMMIT--> COMMITTING
                toCommit = dl.workPath;
            } else {
                sm.dispatch(EVENT.START_DECRYPT);
                try {
                    const out = await decryptor.decrypt({ inPath: dl.workPath, encryptKey });
                    try { fs.unlinkSync(dl.workPath); } catch (_) {}
                    toCommit = out.outPath;
                } catch (err) {
                    sm.dispatch(EVENT.DECRYPT_FAIL, { error: err });
                    try { fs.unlinkSync(dl.workPath); } catch (_) {}
                    throw err;
                }
            }
        } else {
            toCommit = dl.workPath;
        }

        // 提交（§5.6 原子 rename）
        sm.dispatch(EVENT.START_COMMIT);
        const resultPath = paths.resolveResult(scope, resourceKey);
        try {
            await paths.commit(toCommit, resultPath);
        } catch (err) {
            sm.dispatch(EVENT.HTTP_FAIL, { error: { code: ERROR_CODE.RENAME_FAILED, detail: { message: err && err.message }, at: Date.now() } });
            try { fs.unlinkSync(toCommit); } catch (_) {}
            throw err;
        }
        sm.dispatch(EVENT.COMMITTED, { resourcePath: resultPath });
        return resultPath;
    });

    const entryNow = taskRegistry.peek({ scope, resourceKey });
    if (entryNow) entryNow.inflight = inflight;
    inflight.finally(() => {
        const e = taskRegistry.peek({ scope, resourceKey });
        if (e && e.inflight === inflight) e.inflight = null;
    });

    return inflight;
};

// ──────────────────────────────────────────────────────────────────────────────
// 工具
// ──────────────────────────────────────────────────────────────────────────────

const emptyStream = () => {
    const { Readable } = require('stream');
    return Readable.from(Buffer.alloc(0));
};

const sniffMime = (filePath) => {
    const ext = (filePath.split('.').pop() || '').toLowerCase();
    if (ext === 'png') return 'image/png';
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'gif') return 'image/gif';
    if (ext === 'webp') return 'image/webp';
    if (ext === 'mp4') return 'video/mp4';
    return 'application/octet-stream';
};

const hostOf = (u) => {
    try { return new URL(u).host; } catch (_) { return ''; }
};

export default { register, declareSchemes, setMainWindow, setDomainAdapter };
