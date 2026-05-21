// 并发控制 / 文件锁（design.md §5.5 / description #12）
// 本期：仅做 "同 (scope.kind, scope.id) 内串行" 的轻量限流。
// [预留] 真正落地时按 scope.kind 配置 max；picture 6，poster 3 等。

const _queues = new Map(); // queueKey -> Promise chain

const queueKey = (scope) => `${scope.kind}|${scope.id}`;

/**
 * 串行执行：同 queueKey 上的多次 schedule 会按调用顺序排队。
 * 不同 queueKey 完全并行。
 *
 * @param {{ kind: string, id: string|number }} scope
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
export const schedule = (scope, fn) => {
    const key = queueKey(scope);
    const prev = _queues.get(key) || Promise.resolve();
    const next = prev.then(fn, fn);
    // 链不断增长会爆内存；当 next 结束且仍是当前链尾时清掉
    _queues.set(key, next);
    next.finally(() => {
        if (_queues.get(key) === next) _queues.delete(key);
    });
    return next;
};

/**
 * [预留] 按 scope.kind 配置并发上限的版本。
 * 接 description #12 时实现：
 *   - 维护 { kind → semaphore }
 *   - schedule 时 semaphore.acquire(); fn finally semaphore.release()
 */
export const scheduleWithLimit = (/* scope, fn, limit */) => {
    throw new Error('[NativeImage concurrency] scheduleWithLimit not implemented; [预留]');
};
