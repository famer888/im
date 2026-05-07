/**
 * 私聊发送诊断器（仅 OneToOneMessage friend 路径）
 *
 * 目的：排查 App 端解密失败的根因，捕捉以下"对标点"是否一致：
 *   - prv ↔ prk          （own privateKey 与 keyVersion 是否同源）
 *   - pbk ↔ pbv          （好友 app publicKey 与版本是否同源）
 *   - pbv ↔ appCV        （加密时取的 pbv 是否与 stamp 在 appContent.version 上的一致）
 *   - prk ↔ outerVer     （own keyVersion 是否与 stamp 在 params.version 上的一致）
 *   - relKeyApp / appCmiss / webCmiss（最终密文与缺失情况）
 *
 * 生命周期：
 *   start → markKey → markFinal → complete   （正常）
 *   任何阶段未达到，TASK_TTL_MS 超时自动 flush，标 INCOMPLETE
 *
 * 安全约束：
 *   - 全部操作 try/catch 包裹，不可影响业务
 *   - 公私钥仅记录长度+md5 摘要前缀，不留原始值
 *   - 文本仅记录长度+md5 摘要+短预览（默认 60 字符）
 */

import md5 from 'js-md5';

const TASK_TTL_MS = 10000;
const MAX_RAW_PREVIEW = 60;
const MAX_TASKS = 200;

// 本次 renderer 启动的实例 ID（区分多窗口/重启；6 位 base36 足够防碰撞）
const INSTANCE_ID = (() => {
    try {
        return (Date.now().toString(36) + Math.random().toString(36).slice(2, 6)).slice(-8);
    } catch {
        return 'NA';
    }
})();

// 懒加载 loginId（避免启动时 eventCommon 还没初始化）
const _getLoginId = () => {
    try {
        // 延迟 require 防止循环依赖
        const eventCommon = require('@/event/common').default;
        return eventCommon.fnCommonInfoRU({ getId: 'loginId' }) || null;
    } catch {
        return null;
    }
};

const tasks = new Map();

const _h = (s) => {
    if (s == null || s === '') return null;
    try {
        const str = (typeof s === 'string') ? s : String(s);
        return str.length + ':' + md5(str).slice(0, 12);
    } catch {
        return 'ERR';
    }
};

const _hBuf = (b) => {
    if (b == null) return null;
    try {
        if (typeof b === 'string') return _h(b);
        if (b.byteLength != null) {
            const view = b instanceof Uint8Array ? b : new Uint8Array(b);
            // js-md5 接受 Uint8Array
            return view.byteLength + ':' + md5(view).slice(0, 12);
        }
        return _h(b);
    } catch {
        return 'ERR';
    }
};

const _preview = (s) => {
    if (s == null) return null;
    try {
        const str = (typeof s === 'string') ? s : '';
        if (!str) return null;
        return str.length <= MAX_RAW_PREVIEW ? str : (str.slice(0, MAX_RAW_PREVIEW) + '..');
    } catch {
        return null;
    }
};

const _ensureCapacity = () => {
    if (tasks.size < MAX_TASKS) return;
    // 删除最早的（FIFO）
    const firstKey = tasks.keys().next().value;
    if (firstKey != null) {
        const t = tasks.get(firstKey);
        if (t && t._timer) clearTimeout(t._timer);
        tasks.delete(firstKey);
    }
};

const _flush = (taskId, reason) => {
    const t = tasks.get(taskId);
    if (!t) return;
    tasks.delete(taskId);
    if (t._timer) {
        clearTimeout(t._timer);
        t._timer = null;
    }

    try {
        // 对标判定
        const eq = (a, b) => (a != null && b != null && Number(a) === Number(b));
        const NA = 'NA';
        const align = {
            // 加密用的 friend app pubKey 版本 与 stamp 在 appContent.version 上的版本
            pbvEqAppCV: t.pbv != null || t.appContentVer != null
                ? (eq(t.pbv, t.appContentVer) ? 'Y' : 'N!')
                : NA,
            // own keyVersion 与 stamp 在 params.version (outer) 上的版本
            prkEqOuter: t.prk != null || t.outerVer != null
                ? (eq(t.prk, t.outerVer) ? 'Y' : 'N!')
                : NA,
            // accountConfig.keyVersion 在 entry 与 final 是否一致（异步更新检测）
            prkStable: t.prkAtStart != null && t.prk != null
                ? (eq(t.prkAtStart, t.prk) ? 'Y' : 'N!')
                : NA,
            // privateKey hash 在 entry 与 final 是否一致
            prvStable: t.prvAtStart != null && t.prv != null
                ? (t.prvAtStart === t.prv ? 'Y' : 'N!')
                : NA,
            // friend pc pubKey 版本 与 webContent.version
            wpbvEqWebCV: t.wpbv != null || t.webContentVer != null
                ? (eq(t.wpbv, t.webContentVer) ? 'Y' : 'N!')
                : NA,
        };

        const issues = [];
        if (!t.complete) issues.push('INCOMPLETE');
        if (t.appContentMissing) issues.push('NO_APPCONTENT');
        if (t.webContentMissing) issues.push('NO_WEBCONTENT');
        if (align.pbvEqAppCV === 'N!') issues.push('PBV_NEQ_APPCV');
        if (align.prkEqOuter === 'N!') issues.push('PRK_NEQ_OUTER');
        if (align.prkStable === 'N!') issues.push('PRK_DRIFTED');
        if (align.prvStable === 'N!') issues.push('PRV_DRIFTED');
        if (align.wpbvEqWebCV === 'N!') issues.push('WPBV_NEQ_WEBCV');
        if (t.markKeyDone !== true) issues.push('NO_KEY_STAGE');
        if (t.markFinalDone !== true) issues.push('NO_FINAL_STAGE');
        if (t.relKeyApp == null && !t.appContentMissing && t.appContentVer != null) {
            issues.push('STAMPED_APPCV_NO_RELKEY');
        }
        if (t.fnFriendRelKeyGetReturnedNull) issues.push('REL_KEY_NULL');

        const tag = issues.length ? `ISSUE:${issues.join('|')}` : 'OK';

        const summary = {
            tag,
            reason,
            // === 实例/账号 标识（用于多窗口/多账号场景下区分） ===
            inst: INSTANCE_ID,
            loginId: t.loginId,
            cmid: t.customMsgId,
            id: t.id,
            durMs: t.completeTs ? (t.completeTs - t.startTs) : (Date.now() - t.startTs),
            // === 自身密钥 ===
            prv: t.prv,
            prk: t.prk,
            prvAtStart: t.prvAtStart,
            prkAtStart: t.prkAtStart,
            // === 好友 app pubKey（用于 appContent 解密的关键） ===
            pbk: t.pbk,
            pbv: t.pbv,
            // === 好友 pc pubKey（用于 webContent 解密） ===
            wpbk: t.wpbk,
            wpbv: t.wpbv,
            // === 自身 app pubKey（用于 myselfAppContent） ===
            ownAppPbk: t.ownAppPbk,
            ownAppPbv: t.ownAppPbv,
            // === 生成的 relKey ===
            relKeyApp: t.relKeyApp,
            relKeyPc: t.relKeyPc,
            relKeyAppOwn: t.relKeyAppOwn,
            // === 最终 stamp 在 OneToOneMessage 上的版本号 ===
            outerVer: t.outerVer,
            appContentVer: t.appContentVer,
            webContentVer: t.webContentVer,
            myselfAppContentVer: t.myselfAppContentVer,
            // === 最终密文 hash + 缺失标记 ===
            appContentHash: t.appContentHash,
            webContentHash: t.webContentHash,
            appContentMissing: t.appContentMissing,
            webContentMissing: t.webContentMissing,
            // === 原文（解密前/明文） ===
            rawHash: t.rawHash,
            rawLen: t.rawLen,
            rawPv: t.rawPv,
            // === 决策与 flag ===
            cacheKeysBefore: t.cacheKeysBefore,
            needsApiSupplement: t.needsApiSupplement,
            apiSupplementFlagSet: t.apiSupplementFlagSet,
            apiCalled: t.apiCalled,
            apiAppKv: t.apiAppKv,
            apiPcKv: t.apiPcKv,
            // === 对标 ===
            align,
        };

        if (typeof console.$collect === 'function') {
            console.$collect(
                `[私聊诊断:${tag}] inst=${INSTANCE_ID} login=${t.loginId || '?'} cmid=${t.customMsgId} id=${t.id}`,
                summary,
            );
        }
    } catch {
        // 静默
    }
};

const start = ({ taskId, id, raw, msgType, chatType }) => {
    if (!taskId) return null;
    try {
        _ensureCapacity();
        // 已存在则先 flush（视为重置场景）
        if (tasks.has(taskId)) {
            _flush(taskId, 'RESTART');
        }
        const rawStr = (raw == null) ? '' : (typeof raw === 'string' ? raw : '');
        const t = {
            customMsgId: taskId,
            id,
            msgType,
            chatType,
            loginId: _getLoginId(),
            startTs: Date.now(),
            complete: false,
            markKeyDone: false,
            markFinalDone: false,
            rawHash: _h(rawStr),
            rawLen: rawStr.length,
            rawPv: _preview(rawStr),
            _timer: setTimeout(() => _flush(taskId, 'TIMEOUT'), TASK_TTL_MS),
        };
        tasks.set(taskId, t);
    } catch {}
    return taskId;
};

// 在 fnFriendRelKeyGet entry 时调用，记录入口快照
const markEntry = (taskId, info) => {
    if (!taskId) return;
    const t = tasks.get(taskId);
    if (!t) return;
    try {
        if (info.privateKey !== undefined) t.prvAtStart = _h(info.privateKey);
        if (info.ownKeyVersion !== undefined) t.prkAtStart = info.ownKeyVersion;
        if (info.cacheKeys !== undefined) t.cacheKeysBefore = info.cacheKeys;
        if (info.apiSupplementFlagSet !== undefined) t.apiSupplementFlagSet = info.apiSupplementFlagSet;
    } catch {}
};

// 在 fnFriendRelKeyGet 关键决策点 / API 后调用
const markDecision = (taskId, info) => {
    if (!taskId) return;
    const t = tasks.get(taskId);
    if (!t) return;
    try {
        if (info.needsApiSupplement !== undefined) t.needsApiSupplement = info.needsApiSupplement;
        if (info.apiCalled !== undefined) t.apiCalled = info.apiCalled;
        if (info.apiAppKeyVersion !== undefined) t.apiAppKv = info.apiAppKeyVersion;
        if (info.apiPcKeyVersion !== undefined) t.apiPcKv = info.apiPcKeyVersion;
    } catch {}
};

// 在 fnFriendRelKeyGet 出 relKey 时调用
const markKey = (taskId, info) => {
    if (!taskId) return;
    const t = tasks.get(taskId);
    if (!t) return;
    try {
        if (info.privateKey !== undefined) t.prv = _h(info.privateKey);
        if (info.ownKeyVersion !== undefined) t.prk = info.ownKeyVersion;
        if (info.appKeyPair !== undefined) {
            t.pbk = info.appKeyPair ? _h(info.appKeyPair.publicKey) : null;
            t.pbv = info.appKeyPair ? info.appKeyPair.keyVersion : null;
        }
        if (info.webKeyPair !== undefined) {
            t.wpbk = info.webKeyPair ? _h(info.webKeyPair.publicKey) : null;
            t.wpbv = info.webKeyPair ? info.webKeyPair.keyVersion : null;
        }
        if (info.appKeyPairOwn !== undefined) {
            t.ownAppPbk = info.appKeyPairOwn ? _h(info.appKeyPairOwn.publicKey) : null;
            t.ownAppPbv = info.appKeyPairOwn ? info.appKeyPairOwn.keyVersion : null;
        }
        if (info.relKeyApp !== undefined) t.relKeyApp = info.relKeyApp ? _h(info.relKeyApp) : null;
        if (info.relKeyPc !== undefined) t.relKeyPc = info.relKeyPc ? _h(info.relKeyPc) : null;
        if (info.relKeyAppOwn !== undefined) t.relKeyAppOwn = info.relKeyAppOwn ? _h(info.relKeyAppOwn) : null;
        t.markKeyDone = true;
    } catch {}
};

// fnFriendRelKeyGet 返回 null（密钥失败）时调用
const markRelKeyNull = (taskId) => {
    if (!taskId) return;
    const t = tasks.get(taskId);
    if (!t) return;
    try {
        t.fnFriendRelKeyGetReturnedNull = true;
    } catch {}
};

// 在 fnFormartMsgParams 末尾（params 已构建好）调用
const markFinal = (taskId, info) => {
    if (!taskId) return;
    const t = tasks.get(taskId);
    if (!t) return;
    try {
        if (info.outerVersion !== undefined) t.outerVer = info.outerVersion;
        if (info.appContent !== undefined) {
            t.appContentMissing = !info.appContent;
            t.appContentVer = info.appContent ? info.appContent.version : null;
            t.appContentHash = info.appContent ? _hBuf(info.appContent.content) : null;
        }
        if (info.webContent !== undefined) {
            t.webContentMissing = !info.webContent;
            t.webContentVer = info.webContent ? info.webContent.version : null;
            t.webContentHash = info.webContent ? _hBuf(info.webContent.content) : null;
        }
        if (info.myselfAppContent !== undefined) {
            t.myselfAppContentVer = info.myselfAppContent ? info.myselfAppContent.version : null;
        }
        t.markFinalDone = true;
    } catch {}
};

// 在 CReqChatSendPrivate 真正向 ws 发送时调用，标 complete
const complete = (taskId) => {
    if (!taskId) return;
    const t = tasks.get(taskId);
    if (!t) return;
    try {
        t.complete = true;
        t.completeTs = Date.now();
    } catch {}
    _flush(taskId, 'COMPLETE');
};

// 主动取消（如发送链路中途失败需要立即 flush）
const cancel = (taskId, reason) => {
    if (!taskId) return;
    if (!tasks.has(taskId)) return;
    _flush(taskId, reason || 'CANCEL');
};

export default {
    start,
    markEntry,
    markDecision,
    markKey,
    markRelKeyNull,
    markFinal,
    complete,
    cancel,
};
