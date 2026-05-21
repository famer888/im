// $db.patchMsgNativeImage —— 多图视频消息状态原子 patch（design.md §13.4）
//
// ────────────────────────────────────────────────────────────────────────────
// [预留 / 后续内容 / DB schema]
// 本文件为伪代码；本期 (Avatar) 不引用；Avatar 用 NoopPersist 不写库。
// Picture / Poster / MediaCaption 接入 NativeImage 时再投产。
// 当前唯一 import：persist/MsgPropertyPersist.computeAggregated —— 同样为预留伪代码，
// 两文件互引但都不被生产路径接通，符合"可伪代码、不引用"约定。
//
// 不做双写 / 不做旧版本兼容（design.md §12.7）：
//   - 写入只触碰 msg.nativeImage.slots[K].{m}
//   - 不写 msg.local* / thumb_${i} / percent_${i}；旧字段在迁移期由 DB migration 一次性清除
// ────────────────────────────────────────────────────────────────────────────
//
// 设计契约（design.md §13.4 + §13.7）：
//   1. 一个 IDBTransaction 内：cursor → 子键 patch → 重算 aggregated → put 整行。
//   2. slot 隔离：patch slot N 不读 slot M；slot 间并发的 patch 由 IDB 自动串行。
//   3. Machine 隔离：同 slot 的 poster / video 互不读写。
//   4. row-level invariant：
//      - state === 'ready'                 ⟺ resourcePath !== null
//      - state ∈ {expired, *Error}        ⟺ error !== null
//      违反一律 reject 不写。
//   5. taskId 单调：incoming.taskId 序号小于 already-stored.taskId 时整 patch drop（防 IPC 乱序）。

import { STATE, SCHEMA_VERSION, MACHINE } from '@/components/NativeImage/core/constants';
import { computeAggregated } from '@/components/NativeImage/persist/MsgPropertyPersist';

/**
 * @typedef {Object} MachineState
 * @property {string}        state
 * @property {string}        taskId
 * @property {string|null}   resourcePath
 * @property {object|null}   error
 * @property {number|null}   expiredAt
 * @property {number}        updatedAt
 *
 * @typedef {Object} Patch
 * @property {string} slotKey   // 'main' | '0' | '1' | ...
 * @property {string} machine   // 'image' | 'poster' | 'video'
 * @property {MachineState} machineState
 *
 * @typedef {Object} PatchRequest
 * @property {string} msgId
 * @property {'image'|'video'|'mixed'} kindLayout
 * @property {Patch[]} patches
 */

/**
 * 校验 row-level invariant。
 */
const validateMachineState = (machine, ms) => {
    if (!ms || typeof ms !== 'object') {
        throw new Error('[patchMsgNativeImage] machineState must be object');
    }
    const isReady = ms.state === STATE.READY;
    const hasPath = ms.resourcePath != null && ms.resourcePath !== '';
    if (isReady !== hasPath) {
        throw new Error(
            `[patchMsgNativeImage] invariant violated for ${machine}: state=ready ⟺ resourcePath!=null (state=${ms.state}, path=${ms.resourcePath})`
        );
    }
    const isErr = [STATE.EXPIRED, STATE.DOWNLOAD_ERROR, STATE.DECRYPT_ERROR].includes(ms.state);
    const hasErr = ms.error != null;
    if (isErr && !hasErr) {
        throw new Error(`[patchMsgNativeImage] state=${ms.state} requires error object`);
    }
    if (!isErr && hasErr) {
        throw new Error(`[patchMsgNativeImage] state=${ms.state} forbids error object`);
    }
    if (!ms.taskId) {
        throw new Error('[patchMsgNativeImage] taskId required');
    }
    if (![MACHINE.IMAGE, MACHINE.POSTER, MACHINE.VIDEO].includes(machine)) {
        throw new Error(`[patchMsgNativeImage] unknown machine: ${machine}`);
    }
};

const ensureSlotShape = (slot, machine) => {
    if (!slot.kind) {
        slot.kind = (machine === MACHINE.IMAGE) ? 'image' : 'video';
    }
    return slot;
};

/**
 * taskId 单调比较：返回 true 表示 incoming 比 stored 新或并存（允许写）。
 * 实际实现需要从 taskId 字符串里解析 monotonic 后缀（design.md §5.8）。
 */
const isMonotonicNewerOrEqual = (incomingTaskId, storedTaskId) => {
    if (!storedTaskId) return true;
    const suffix = (t) => Number(String(t).split(':').pop()) || 0;
    return suffix(incomingTaskId) >= suffix(storedTaskId);
};

/**
 * @param {PatchRequest} req
 * @returns {Promise<void>}
 */
export const patchMsgNativeImage = async (req) => {
    const { msgId, kindLayout, patches } = req;
    if (!msgId || !Array.isArray(patches) || patches.length === 0) {
        throw new Error('[patchMsgNativeImage] msgId + non-empty patches required');
    }

    // 先校验，throw 不进 tx
    for (const p of patches) validateMachineState(p.machine, p.machineState);

    // 伪代码：IndexedDB tx
    //
    // const tx = db.transaction(['msg'], 'readwrite');
    // const store = tx.objectStore('msg');
    // const row = await promisify(store.get(msgId));
    // if (!row) throw new Error(`msg ${msgId} not found`);
    //
    // row.nativeImage ||= { schemaVersion: SCHEMA_VERSION, layout: kindLayout, slots: {}, aggregated: { state: 'pending', updatedAt: 0 } };
    //
    // for (const { slotKey, machine, machineState } of patches) {
    //   row.nativeImage.slots[slotKey] ||= {};
    //   ensureSlotShape(row.nativeImage.slots[slotKey], machine);
    //
    //   const stored = row.nativeImage.slots[slotKey][machine];
    //   if (stored && !isMonotonicNewerOrEqual(machineState.taskId, stored.taskId)) {
    //     continue; // drop stale
    //   }
    //
    //   row.nativeImage.slots[slotKey][machine] = machineState;
    // }
    //
    // row.nativeImage.aggregated = computeAggregated(row.nativeImage.slots);
    //
    // // 仅写新字段；旧字段（msg.local* / thumb_${i} / percent_${i}）由 DB migration 在
    // // 派生组件接入 PR 同期清除，不在这里反向写（§12.7）。
    //
    // await promisify(store.put(row));
    // await tx.done;

    // 真正接入时，需要把现 window.$db 的 msg store 暴露出来；伪代码不投产
    throw new Error('[patchMsgNativeImage] not implemented this iteration; [预留]');
};

export default { patchMsgNativeImage };
