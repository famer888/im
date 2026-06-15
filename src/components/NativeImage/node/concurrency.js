// 并发控制 / 文件锁（design.md §5.5 / description #12）
// 同 queueKey 内串行（相同 key 的请求按序排队）；不同 queueKey 并行，但受全局上限约束。
//
// 注意：调用方需保证 queueKey 能区分不同资源。Avatar 的 scope.id 在多数调用点缺省为 0，
// 若只用 (kind,id) 会把所有头像挤进一个队列串行（群成员列表头像奇慢）。drivePipeline
// 因此把 resourceKey 也并进 scheduling scope 的 id，确保不同头像各自独立队列。

const _queues = new Map(); // queueKey -> Promise chain

const queueKey = (scope) => `${scope.kind}|${scope.id}`;

// 全局并发上限：群成员列表可能一次性铺开上百个头像，若全部并行会瞬时发起上百个
// net.request 互相拖垮、反而更慢。8 为经验值，远好于此前"全部串行"。
const GLOBAL_LIMIT = 8;
let _active = 0;
const _waiters = [];

const acquireSlot = () =>
    new Promise((resolve) => {
        if (_active < GLOBAL_LIMIT) {
            _active += 1;
            resolve();
        } else {
            _waiters.push(resolve);
        }
    });

const releaseSlot = () => {
    const next = _waiters.shift();
    if (next) {
        // 名额直接转交下一个等待者，_active 保持不变
        next();
    } else {
        _active -= 1;
    }
};

/**
 * 串行执行：同 queueKey 上的多次 schedule 会按调用顺序排队。
 * 不同 queueKey 并行，但全局同时执行数不超过 GLOBAL_LIMIT。
 *
 * @param {{ kind: string, id: string|number }} scope
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
export const schedule = (scope, fn) => {
    const key = queueKey(scope);
    const prev = _queues.get(key) || Promise.resolve();
    const run = async () => {
        await acquireSlot();
        try {
            return await fn();
        } finally {
            releaseSlot();
        }
    };
    const next = prev.then(run, run);
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
