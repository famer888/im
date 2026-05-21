// renderer 侧 IPC 封装（design.md §9 / §12.2 第 2 条）
// 派生组件**只**通过本文件与 main 通信；禁止直接 ipcRenderer.invoke('nativeImage:*')。
// ESLint 规则将在 M4 期强制约束（仅本文件可 import 'platform' 的 ipcRenderer）。

import { ipcRenderer } from '@/platform';
import Channels from './channels';

const listeners = new Map(); // taskId → Set<fn>
let _bound = false;

// 修 H1 竞态：main 端在 IPC `resolve` 的同一 tick 内可能同步把 SM 从 resolving
// 一路推到 ready（缓存命中路径尤其如此），而 renderer 侧 `_subscribeStatus`
// 只能在 `await ipc.resolve(...)` 拿到 taskId 之后才能 `subscribe(taskId, fn)`。
// 这中间到达的 status 事件若被丢弃，组件会永远停留在 resolving。
// 这里缓存"最近一次该 taskId 的 snapshot"，`subscribe` 注册后立即重放最新值，
// 把丢失的状态补齐（status 本身是单调推进的，最新 snapshot 一定能正确反映终态）。
const latestSnapshots = new Map(); // taskId → snap
const MAX_SNAPSHOT_CACHE = 256;

const cacheLatestSnapshot = (snap) => {
    if (!snap || !snap.taskId) return;
    // LRU：相同 key 删后再插以挪到队尾
    if (latestSnapshots.has(snap.taskId)) latestSnapshots.delete(snap.taskId);
    latestSnapshots.set(snap.taskId, snap);
    if (latestSnapshots.size > MAX_SNAPSHOT_CACHE) {
        const oldest = latestSnapshots.keys().next().value;
        latestSnapshots.delete(oldest);
    }
};

const ensureBound = () => {
    if (_bound) return;
    _bound = true;
    ipcRenderer.on?.(Channels.status, (_evt, snap) => {
        if (!snap || !snap.taskId) return;
        cacheLatestSnapshot(snap);
        const set = listeners.get(snap.taskId);
        if (!set) return;
        for (const fn of set) {
            try { fn(snap); } catch (_e) { /* 订阅者抛错不影响其他 */ }
        }
    });
};

/**
 * 显式 resolve：拿到 taskId + 当前 snapshot。
 * 大多数派生不需要主动 invoke，挂到 <img :src> 上即可触发 main 流水线。
 * 仅当组件想在挂 <img> 之前先拿 taskId 做 hydrate 时调用。
 */
export const resolve = async ({ scope, resourceKey, url, encryptKey } = {}) => {
    ensureBound();
    return ipcRenderer.invoke?.(Channels.resolve, { scope, resourceKey, url, encryptKey });
};

/**
 * 订阅指定 taskId 的状态变更。
 * @returns {() => void} unsubscribe 函数
 */
export const subscribe = (taskId, fn) => {
    if (!taskId || typeof fn !== 'function') return () => {};
    ensureBound();
    let set = listeners.get(taskId);
    if (!set) {
        set = new Set();
        listeners.set(taskId, set);
    }
    set.add(fn);
    // 追平：补发注册前已到达的最新 snapshot（修 status-handler 与 per-taskId
    // listener 注册之间的竞态）。status 在到达 ready/错误终态前是单调推进的，
    // 最新一帧即可代表"被错过的所有中间态结果"。
    const cached = latestSnapshots.get(taskId);
    if (cached) {
        try { fn(cached); } catch (_e) { /* 订阅者抛错不影响其他 */ }
    }
    return () => {
        const s = listeners.get(taskId);
        if (!s) return;
        s.delete(fn);
        if (s.size === 0) listeners.delete(taskId);
    };
};

/** renderer 主动断订阅 / 触发资源释放。 */
export const cancel = ({ scope, resourceKey }) => {
    return ipcRenderer.send?.(Channels.cancel, { scope, resourceKey });
};

/** 显式 INVALIDATE：让 main 端从终态回到 resolving。 */
export const invalidate = ({ scope, resourceKey }) => {
    return ipcRenderer.send?.(Channels.invalidate, { scope, resourceKey });
};
