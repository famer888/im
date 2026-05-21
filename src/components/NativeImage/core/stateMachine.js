// NativeImage 状态机
// 实现 design.md §7（核心 10 态 + 13 事件 + 5 不变量） + §12.1（plugin 开放扩展）。
//
// 设计要点：
// - 终态锁定：plugin 不能新增终态，只能加中间态。
// - invariants 强制：
//   1. ready 进入后非 INVALIDATE 不可转移（单调成功；修 description Q1）。
//   2. 写结果目录仅 committing 状态的 entry 允许（修 description Q2）。
//   3. taskId 单调递增；renderer 收到旧 taskId 的事件直接丢弃。
//   4. 订阅者归零即 CANCEL → idle，自动释放资源。
//   5. 错误终态不污染缓存；INVALIDATE 走完整 fetch 链。
//
// 本期 Avatar 链路完整覆盖；Picture/Poster 接入后无需改本文件，只通过 plugins 注入扩展。

import {
    STATE,
    EVENT,
    isTerminal,
    isErrorTerminal,
} from './constants';

/** 内部 taskId 计数器（per-process 单调）。 */
let _taskIdCounter = 0;
const nextTaskIdSuffix = () => {
    _taskIdCounter = (_taskIdCounter + 1) >>> 0;
    return _taskIdCounter;
};

/**
 * 构造一个完整 taskId（design.md §5.8）。
 * 格式：${scope.kind}:${scope.id}:${resourceKey}:${monotonic}
 */
export const makeTaskId = (scope, resourceKey) =>
    `${scope.kind}:${scope.id}${scope.sub ? '/' + scope.sub : ''}:${resourceKey}:${nextTaskIdSuffix()}`;

/**
 * 核心转移表（不含 plugin 扩展）。
 * key: `${from}::${event}`，value: { to, entry?: (ctx) => void }
 * entry 仅承担状态机层副作用（如 bump taskId 时清缓存标记）；外部副作用
 * 通过 middleware / subscribers 触发，不在 entry 内调 IPC/IO。
 */
const CORE_TRANSITIONS = (() => {
    const t = {};
    const add = (from, event, to, entry) => {
        t[`${from}::${event}`] = { to, entry };
    };

    add(STATE.IDLE,        EVENT.MOUNT,         STATE.RESOLVING);
    add(STATE.RESOLVING,   EVENT.START_FETCH,   STATE.DOWNLOADING);
    // 命中本地缓存直接 ready；payload.cacheHit=true，外部 pipeline 触发 START_COMMIT 等价路径
    add(STATE.RESOLVING,   EVENT.START_COMMIT,  STATE.COMMITTING);

    add(STATE.DOWNLOADING, EVENT.START_VERIFY,  STATE.VERIFYING);
    add(STATE.DOWNLOADING, EVENT.START_COMMIT,  STATE.COMMITTING);   // 无 encryptKey 路径
    add(STATE.DOWNLOADING, EVENT.HTTP_4XX,      STATE.EXPIRED);
    add(STATE.DOWNLOADING, EVENT.HTTP_FAIL,     STATE.DOWNLOAD_ERROR);

    add(STATE.VERIFYING,   EVENT.START_DECRYPT, STATE.DECRYPTING);
    add(STATE.VERIFYING,   EVENT.VERIFY_FAIL,   STATE.DECRYPT_ERROR);

    add(STATE.DECRYPTING,  EVENT.START_COMMIT,  STATE.COMMITTING);
    add(STATE.DECRYPTING,  EVENT.DECRYPT_FAIL,  STATE.DECRYPT_ERROR);

    add(STATE.COMMITTING,  EVENT.COMMITTED,     STATE.READY);
    add(STATE.COMMITTING,  EVENT.HTTP_FAIL,     STATE.DOWNLOAD_ERROR); // rename 跨盘失败兜底

    // 任意中间态 → idle（CANCEL）：由 dispatch() 内统一兜底，不在表里枚举

    // ready → ready (MOUNT) 幂等订阅；不在转移表里，由 dispatch() 短路

    // 终态 → resolving (INVALIDATE)：由 dispatch() 内特判，bump taskId

    return Object.freeze(t);
})();

/**
 * @typedef {Object} SmPlugin
 * @property {string} name
 * @property {(sm: StateMachine) => void} [install]  // 注册时调用
 *
 * plugin 可通过 sm.registerTransition / sm.registerMiddleware 等接口扩展
 * （design.md §12.1）。注册的 state/event 必须带 plugin namespace 前缀，
 * 例 'Poster.ext:playing'，由 install 自行保证。
 */

export class StateMachine {
    /**
     * @param {{
     *   scope: { kind: string, id: string|number, sub?: string },
     *   resourceKey: string,
     *   initial?: string,
     *   plugins?: SmPlugin[],
     * }} opts
     */
    constructor({ scope, resourceKey, initial = STATE.IDLE, plugins = [] }) {
        this.scope = scope;
        this.resourceKey = resourceKey;
        this.state = initial;
        this.taskId = null;

        this._extraTransitions = new Map();   // pluginKey -> { to, entry }
        this._middlewares = [];
        this._subscribers = new Set();        // (snapshot) => void
        this._linkedTaskIds = new Set();      // design.md §7.6 多机联动占位
        this._history = [];                   // 仅 debug，最多 50 条
        this._lastError = null;
        this._lastResourcePath = null;

        for (const p of plugins) {
            if (typeof p?.install === 'function') p.install(this);
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // plugin API（§12.1）
    // ────────────────────────────────────────────────────────────────────────

    /**
     * 注册扩展转移。to 必须是中间态或现有终态——禁止新增终态。
     * @param {{ from: string, event: string, to: string, entry?: (ctx) => void }} t
     */
    registerTransition(t) {
        if (isTerminal(t.to) && !isErrorTerminal(t.to) && t.to !== STATE.READY) {
            throw new Error(`[NativeImage SM] plugin 不能新增终态: ${t.to}`);
        }
        this._extraTransitions.set(`${t.from}::${t.event}`, { to: t.to, entry: t.entry });
    }

    /**
     * 注册 middleware；签名 (fromState, toState, ctx) => void，throw 会中断转移。
     */
    registerMiddleware(mw) {
        this._middlewares.push(mw);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 订阅
    // ────────────────────────────────────────────────────────────────────────

    subscribe(fn) {
        this._subscribers.add(fn);
        // 立即把当前态发给新订阅者（hydrate）
        fn(this.snapshot());
        return () => this._subscribers.delete(fn);
    }

    unsubscribe(fn) {
        this._subscribers.delete(fn);
    }

    get subscriberCount() {
        return this._subscribers.size;
    }

    snapshot() {
        return {
            scope: this.scope,
            resourceKey: this.resourceKey,
            state: this.state,
            taskId: this.taskId,
            error: this._lastError,
            resourcePath: this._lastResourcePath,
            at: Date.now(),
        };
    }

    // ────────────────────────────────────────────────────────────────────────
    // 核心：dispatch
    // ────────────────────────────────────────────────────────────────────────

    /**
     * 触发事件。返回下一个状态；非法转移返回 null（外部决定是否抛错）。
     * @param {string} event
     * @param {object} payload
     */
    dispatch(event, payload = {}) {
        const prev = this.state;

        // ---- 特殊事件：CANCEL / UNSUBSCRIBE / MOUNT / INVALIDATE ----
        if (event === EVENT.UNSUBSCRIBE) {
            // 由 subscribe() 返回的 unsubscribe 闭包自行调；状态不变
            return prev;
        }

        if (event === EVENT.CANCEL) {
            if (prev === STATE.IDLE) return prev;
            return this._commit(prev, STATE.IDLE, event, payload, /*entry*/ ({ sm }) => {
                sm._lastError = null;
                sm._lastResourcePath = null;
            });
        }

        if (event === EVENT.MOUNT) {
            if (prev === STATE.IDLE) {
                return this._commit(prev, STATE.RESOLVING, event, payload, ({ sm }) => {
                    sm.taskId = makeTaskId(sm.scope, sm.resourceKey);
                    sm._lastError = null;
                    sm._lastResourcePath = null;
                });
            }
            // 已存在的状态机被新订阅者 MOUNT：纯订阅，不动状态
            return prev;
        }

        if (event === EVENT.INVALIDATE) {
            if (!isTerminal(prev) && prev !== STATE.READY) {
                // 中间态不响应 INVALIDATE，避免与正在进行的下载竞争
                return prev;
            }
            return this._commit(prev, STATE.RESOLVING, event, payload, ({ sm }) => {
                sm.taskId = makeTaskId(sm.scope, sm.resourceKey);
                sm._lastError = null;
                sm._lastResourcePath = null;
            });
        }

        // ---- 不变量：ready 拒绝任何其他事件（修 Q1） ----
        if (prev === STATE.READY) {
            console.warn(`[NativeImage SM] ready 状态拒绝事件 ${event}（仅 INVALIDATE / UNSUBSCRIBE 合法）`);
            return prev;
        }

        // ---- 转移表查找（plugin 优先于 core，便于 plugin 用守卫升级语义） ----
        const key = `${prev}::${event}`;
        const transition = this._extraTransitions.get(key) || CORE_TRANSITIONS[key];
        if (!transition) {
            console.warn(`[NativeImage SM] 非法转移 ${prev} --${event}--> (no rule)`);
            return null;
        }

        return this._commit(prev, transition.to, event, payload, ({ sm, ctx }) => {
            // 错误事件：写 _lastError
            if (transition.to === STATE.EXPIRED || transition.to === STATE.DOWNLOAD_ERROR || transition.to === STATE.DECRYPT_ERROR) {
                sm._lastError = payload.error || { code: 'unknown', detail: null, at: Date.now() };
            }
            // COMMITTED 到 READY：写 _lastResourcePath
            if (transition.to === STATE.READY) {
                sm._lastResourcePath = payload.resourcePath || sm._lastResourcePath;
                sm._lastError = null;
            }
            if (typeof transition.entry === 'function') transition.entry(ctx);
        });
    }

    // ────────────────────────────────────────────────────────────────────────
    // 内部：commit 转移并通知订阅者
    // ────────────────────────────────────────────────────────────────────────

    _commit(from, to, event, payload, entry) {
        const ctx = { from, to, event, payload, sm: this };

        // middleware 可 throw 中断
        try {
            for (const mw of this._middlewares) mw(from, to, ctx);
        } catch (e) {
            console.warn('[NativeImage SM] middleware 中断转移:', e);
            return null;
        }

        this.state = to;
        if (typeof entry === 'function') entry({ sm: this, ctx });

        // 调试历史（环形缓存）
        this._history.push({ from, to, event, at: Date.now(), taskId: this.taskId });
        if (this._history.length > 50) this._history.shift();

        // 通知订阅者
        const snap = this.snapshot();
        for (const fn of this._subscribers) {
            try { fn(snap); } catch (e) { /* 订阅者抛错不影响 SM */ }
        }

        return to;
    }
}
