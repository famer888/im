// Noop 持久化适配器（design.md §12.3，Avatar 用）
//
// Avatar 完全不入库，仅依赖文件系统缓存。

import { BasePersistAdapter } from './PersistAdapter';

export class NoopPersist extends BasePersistAdapter {
    constructor() { super('Noop'); }
    async hydrate(/* scope, resourceKey */) { return null; }
    async persist(/* scope, resourceKey, snapshot */) { /* no-op */ }
    async invalidate(/* scope, resourceKey */) { /* no-op */ }
}

export const noopPersist = new NoopPersist();
export default noopPersist;
