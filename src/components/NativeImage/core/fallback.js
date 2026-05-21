// Fallback 链路求值（design.md §6）
//
// FallbackEntry 类型：
//   { kind: 'url',       value: string }
//   { kind: 'asset',     value: any }  // require('@/assets/...')
//   { kind: 'slot',      name: string }
//   { kind: 'component', value: VueComponent, props?: object }
//   { kind: 'state',     when: StateName, then: FallbackEntry }
//
// 求值规则：
//   1. state === 'ready' 且有 localPath → 直接显示真图，跳过 fallback。
//   2. 否则按数组顺序取第一个 "可用" 项，state 类型仅在 when === currentState 时匹配其 then。

import { STATE } from './constants';

const isUsable = (entry) => {
    if (!entry || typeof entry !== 'object') return false;
    switch (entry.kind) {
        case 'url':       return typeof entry.value === 'string' && entry.value.length > 0;
        case 'asset':     return entry.value != null;
        case 'slot':      return typeof entry.name === 'string' && entry.name.length > 0;
        case 'component': return entry.value != null;
        case 'state':     return entry.then != null;
        default:          return false;
    }
};

/**
 * @param {FallbackEntry[]} entries
 * @param {{ state: string, localPath?: string }} ctx
 * @returns {FallbackEntry | null}
 */
export const evaluate = (entries, ctx) => {
    if (ctx.state === STATE.READY && ctx.localPath) return null;
    if (!Array.isArray(entries)) return null;
    for (const e of entries) {
        if (!isUsable(e)) continue;
        if (e.kind === 'state') {
            if (e.when === ctx.state) {
                const inner = e.then;
                if (isUsable(inner)) return inner;
            }
            continue;
        }
        return e;
    }
    return null;
};

/**
 * 便捷构造器（design.md §3.2 Avatar 用）。
 */
export const makeStateEntry = (when, then) => ({ kind: 'state', when, then });
export const makeUrl = (value) => ({ kind: 'url', value });
export const makeAsset = (value) => ({ kind: 'asset', value });
export const makeComponent = (value, props) => ({ kind: 'component', value, props });
export const makeSlot = (name) => ({ kind: 'slot', name });
