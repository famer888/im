// MsgPropertyPersist：Picture / Poster 的持久化适配器（design.md §12.3 + §13）
//
// ────────────────────────────────────────────────────────────────────────────
// [预留 / 后续内容]
// 本文件为伪代码；本期 (Avatar) 不引用；Avatar 用 NoopPersist 不入库。
// Picture/Poster 接入 NativeImage 时再投产。
// 与之配套的 utils/db/patchMsgNativeImage 也是本期纯伪代码、不引用。
//
// 不做双写 / 不做旧版本兼容（design.md §12.7）：
//   - 仅写新字段 msg.nativeImage.slots[K].{m}
//   - 不回写 msg.local* / thumb_${i} / percent_${i}
//   - 旧字段在派生组件接入 PR 内一次性下线，由 DB migration 清除
// ────────────────────────────────────────────────────────────────────────────
//
// 关键职责（接入时按此实现）：
//   1. 调 $db.patchMsgNativeImage 写新字段 msg.nativeImage.slots[K].{m}（§13.4）
//   2. 重算 aggregated.state（§13.5）
//   3. taskId 单调写入：stale 写直接 drop（§13.7）
//
// scope 形态约定：
//   { kind: 'picture'|'poster', id: msgId, sub: slotKey }   // slotKey: 'main'|'0'|'1'|...

import { BasePersistAdapter } from './PersistAdapter';
import { STATE, MACHINE } from '../core/constants';

const slotKeyFromScope = (scope) => scope.sub || 'main';

const machineFromScope = (scope) => {
    // picture → image machine
    // poster  → poster machine
    // 视频文件单独走 video machine 时，派生层用 scope.kind='picture' 但 ext.machine='video' 标记
    if (scope.kind === 'poster') return MACHINE.POSTER;
    return MACHINE.IMAGE;
};

const machineFromScopeOrExt = (scope, snapshot) =>
    (snapshot?.ext?.machine) || machineFromScope(scope);

/**
 * §13.5 aggregated.state 派生函数（pseudocode）。
 * UI 也用同一函数渲染，不要复制实现。
 */
export const displayStateOfSlot = (slot) => {
    if (slot.kind === 'image') return slot.image?.state || STATE.IDLE;
    return slot.poster?.state || STATE.IDLE; // video 永远不影响 aggregated（§13.5）
};

export const computeAggregated = (slots) => {
    const errors = [];
    const allStates = [];
    let maxUpdated = 0;
    for (const k of Object.keys(slots).sort()) {
        const s = displayStateOfSlot(slots[k]);
        allStates.push(s);
        if ([STATE.EXPIRED, STATE.DOWNLOAD_ERROR, STATE.DECRYPT_ERROR].includes(s)) {
            errors.push(s);
        }
        for (const m of [MACHINE.IMAGE, MACHINE.POSTER, MACHINE.VIDEO]) {
            const t = slots[k]?.[m]?.updatedAt;
            if (typeof t === 'number' && t > maxUpdated) maxUpdated = t;
        }
    }
    let state = 'pending';
    if (errors.length) state = errors[0];
    else if (allStates.length && allStates.every((s) => s === STATE.READY)) state = STATE.READY;
    return { state, updatedAt: maxUpdated };
};

export class MsgPropertyPersist extends BasePersistAdapter {
    /**
     * @param {{ db: object, conversation: { id: string|number, type: 'group'|'channel'|'friend' }, layout: 'image'|'video'|'mixed' }} opts
     */
    constructor({ db, conversation, layout }) {
        super('MsgProperty');
        this.db = db;
        this.conversation = conversation;
        this.layout = layout;
    }

    async hydrate(scope, resourceKey) {
        // 伪代码：仅从 msg.nativeImage.slots[slotKey][machine] 反序列化 Snapshot；
        // 历史消息（只有 msg.local* / thumb_${i} 等旧字段）一律返回 null，
        // 让 base 跑完整流水线（缓存命中即 ready，未命中重新下载/解密）。
        // 不做任何旧字段反解（§12.7）。
        return null;
    }

    async persist(scope, resourceKey, snapshot) {
        const msgId = String(scope.id);
        const slotKey = slotKeyFromScope(scope);
        const machine = machineFromScopeOrExt(scope, snapshot);

        // §13.4 子键 patch
        const machineState = {
            state:        snapshot.state,
            taskId:       snapshot.taskId,
            resourcePath: snapshot.state === STATE.READY ? snapshot.resourcePath : null,
            error:        [STATE.EXPIRED, STATE.DOWNLOAD_ERROR, STATE.DECRYPT_ERROR].includes(snapshot.state)
                            ? (snapshot.error || { code: 'unknown', detail: null, at: Date.now() })
                            : null,
            expiredAt:    snapshot.expiredAt || null,
            updatedAt:    snapshot.updatedAt || Date.now(),
        };

        // 伪代码：调用新 DB API（utils/db/patchMsgNativeImage.js）
        // 仅写新字段；不传 legacySync，不回写旧字段（§12.7）。
        await this.db.patchMsgNativeImage?.({
            msgId,
            kindLayout: this.layout,
            patches: [{ slotKey, machine, machineState }],
        });
    }

    async invalidate(scope, resourceKey) {
        // 伪代码：把 slots[slotKey][machine] 写成 resolving 终态前快照
        // 或调 db.invalidateMsgNativeImage（视实现而定）
    }
}
