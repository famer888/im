// PersistAdapter 接口契约（design.md §12.3）
//
// base 永远不写数据库；所有落库由派生组件注入的 adapter 完成。
// 任何 adapter 必须保证：
//   - 同 (scope, resourceKey) 的多次 persist 按 taskId 单调写入，stale 丢弃（防 IPC 乱序）
//   - persist / invalidate 应保持事务原子；写失败一律回滚，不留半截状态

/**
 * @typedef {Object} Snapshot
 * @property {string}        state        // §7.1 的 10 个值
 * @property {string|null}   taskId       // 主进程 monotonic taskId
 * @property {string|null}   resourcePath // 仅 state==='ready' 非空
 * @property {{code:string, detail:any, at:number}|null} error
 * @property {number|null}   slotIndex
 * @property {number|null}   expiredAt    // 消息体时间 + 4 天（description #11）
 * @property {number}        updatedAt
 * @property {Record<string, any>} ext    // 派生自定义扩展字段
 */

/**
 * @typedef {Object} PersistAdapter
 * @property {string} name
 *
 * @property {(scope: Scope, resourceKey: string) => Promise<Snapshot|null>} hydrate
 *   组件 mount 时让 adapter 提供初始快照（用于"重启 App 后状态恢复"）。
 *
 * @property {(scope: Scope, resourceKey: string, snapshot: Snapshot) => Promise<void>} persist
 *   每次状态机转移后 base 调用。adapter 自行决定写哪张表 / 哪个字段。
 *
 * @property {(scope: Scope, resourceKey: string) => Promise<void>} invalidate
 *   显式失效（用户清缓存、消息撤回等）。
 */

/**
 * 适配器基类（JSDoc-only 抽象）；JS 没有 interface 关键字，约定继承。
 */
export class BasePersistAdapter {
    /* eslint-disable no-unused-vars */
    constructor(name) { this.name = name; }
    async hydrate(scope, resourceKey) { return null; }
    async persist(scope, resourceKey, snapshot) { /* override */ }
    async invalidate(scope, resourceKey) { /* override */ }
    /* eslint-enable no-unused-vars */
}
