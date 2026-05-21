// renderer 侧 IPC 封装（design.md §9 / §12.2 第 2 条）
// 派生组件**只**通过本文件与 main 通信；禁止直接 ipcRenderer.invoke('nativeImage:*')。
// ESLint 规则将在 M4 期强制约束（仅本文件可 import 'platform' 的 ipcRenderer）。

import { ipcRenderer } from '@/platform';
import Channels from './channels';

const listeners = new Map(); // taskId → Set<fn>
let _bound = false;

const ensureBound = () => {
    if (_bound) return;
    _bound = true;
    ipcRenderer.on?.(Channels.status, (_evt, snap) => {
        if (!snap || !snap.taskId) return;
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
