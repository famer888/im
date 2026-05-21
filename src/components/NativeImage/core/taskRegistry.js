// NativeImage taskRegistry
// 实现 design.md §5.7（in-flight 合并、状态守卫、cancel token） + §7.6（linkedTaskIds 多机联动占位）。
//
// 关键性质：
// - 同 (scope.kind, scope.id, scope.sub, resourceKey) 的多次 acquire 只跑一次实际下载；
//   后到的 subscriber 拿到的是同一台 StateMachine。
// - 维护 renderer-side refCount：每个 acquire +1，每个 release -1；归 0 触发 CANCEL → idle。
//   注意：StateMachine._subscribers 记录的是"main 进程内的 broadcastStatus 函数引用"，
//   它一旦订阅就常驻；renderer-side 的真实订阅只能用计数追踪。两者职责不同，不合并。
// - 跨 (scope, resourceKey) 的状态机互不影响，命名空间通过 key 前缀隔离。

import { StateMachine } from './stateMachine';
import { EVENT } from './constants';

const makeKey = (scope, resourceKey) =>
    `${scope.kind}|${scope.id}|${scope.sub || ''}|${resourceKey}`;

class TaskRegistry {
    constructor() {
        this._tasks = new Map(); // key → { sm, inflight, cancelToken, linkedTaskIds, refCount }
    }

    /**
     * 获取或创建状态机。返回 { sm, isNew, taskId, snapshot }。
     * 调用方需要：
     *   1. 拿 sm.subscribe(fn) 监听状态；
     *   2. isNew=true 时由调用方负责驱动 pipeline；isNew=false 直接复用。
     */
    acquire({ scope, resourceKey, plugins = [] }) {
        const key = makeKey(scope, resourceKey);
        let entry = this._tasks.get(key);
        if (!entry) {
            const sm = new StateMachine({ scope, resourceKey, plugins });
            entry = {
                sm,
                cancelToken: { cancelled: false, abort: null },
                linkedTaskIds: new Set(),
                inflight: null,
                refCount: 0,
            };
            this._tasks.set(key, entry);
            sm.dispatch(EVENT.MOUNT);
            entry.refCount += 1;
            return { sm, isNew: true, taskId: sm.taskId, snapshot: sm.snapshot() };
        }
        // 已存在：仅订阅，不重启；MOUNT 在非 idle 时是 no-op
        entry.sm.dispatch(EVENT.MOUNT);
        entry.refCount += 1;
        return { sm: entry.sm, isNew: false, taskId: entry.sm.taskId, snapshot: entry.sm.snapshot() };
    }

    /**
     * 调用方在 unsubscribe 之后调；refCount 归 0 触发 CANCEL，释放资源。
     * 返回 true 表示真正触发了 CANCEL；false 表示仅减引用。
     */
    release({ scope, resourceKey }) {
        const key = makeKey(scope, resourceKey);
        const entry = this._tasks.get(key);
        if (!entry) return false;
        entry.refCount = Math.max(0, entry.refCount - 1);
        if (entry.refCount > 0) return false;
        entry.cancelToken.cancelled = true;
        try { entry.cancelToken.abort && entry.cancelToken.abort(); } catch (_) {}
        entry.sm.dispatch(EVENT.CANCEL);
        this._tasks.delete(key);
        return true;
    }

    /**
     * 显式 invalidate：强制跳过本地缓存重跑一次。
     * design.md §7 转移表里 ready / *Error → resolving 的入口。
     */
    invalidate({ scope, resourceKey }) {
        const key = makeKey(scope, resourceKey);
        const entry = this._tasks.get(key);
        if (!entry) return;
        entry.cancelToken.cancelled = true;
        try { entry.cancelToken.abort && entry.cancelToken.abort(); } catch (_) {}
        // bump cancelToken：避免被旧 abort 引用持续触发新一轮的 fail
        entry.cancelToken = { cancelled: false, abort: null };
        entry.inflight = null;
        entry.sm.dispatch(EVENT.INVALIDATE, { skipCache: true });
        // pipeline 由外部 watch 状态变更触发；本函数只负责状态转移
    }

    /**
     * 取已存在的任务（不创建）。
     */
    peek({ scope, resourceKey }) {
        const key = makeKey(scope, resourceKey);
        return this._tasks.get(key) || null;
    }

    /**
     * design.md §7.6 多机联动占位：把 taskB 的 taskId 挂到 taskA 的 linkedTaskIds 上。
     * 用例：Poster 关联 Video 文件 task；主图 expired 时联动缩略图 INVALIDATE。
     * 本期不实现联动语义，仅维护数据结构；接 description #20 时再消费。
     */
    link(taskAKey, taskBKey) {
        const a = this._tasks.get(taskAKey);
        const b = this._tasks.get(taskBKey);
        if (!a || !b) return;
        a.linkedTaskIds.add(taskBKey);
        b.linkedTaskIds.add(taskAKey);
    }

    /**
     * 设置 abort 回调（由 downloader / decryptor 实现）。
     */
    bindAbort({ scope, resourceKey }, abortFn) {
        const key = makeKey(scope, resourceKey);
        const entry = this._tasks.get(key);
        if (entry) entry.cancelToken.abort = abortFn;
    }

    /**
     * 调试用：当前所有任务的简要快照。
     */
    debugDump() {
        const result = [];
        for (const [key, entry] of this._tasks) {
            result.push({
                key,
                ...entry.sm.snapshot(),
                refCount: entry.refCount,
                subscribers: entry.sm.subscriberCount,
                hasInflight: !!entry.inflight,
            });
        }
        return result;
    }
}

// 单例（main 进程一份；renderer 不直接持有，通过 IPC 间接访问）。
export const taskRegistry = new TaskRegistry();
export default taskRegistry;
