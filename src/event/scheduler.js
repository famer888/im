/**
 * WebSocket 推送 dispatch 侧调度：Fiber 式合作调度 + 空闲感知。
 * - 优先 requestIdleCallback：用 IdleDeadline.timeRemaining() 判断浏览器分配的空闲时间。
 * - timeout：长期高负载时仍会被强制回调，避免队列饿死（此时按 frameBudgetMs 再切片）。
 * - 无 rIC 环境（旧 Safari 等）：回退 requestAnimationFrame + frameBudgetMs。
 * ACK（解析、FairGuard、ReceiveServerToClient、expired.check）仍在 event 层同步完成。
 */

/** 默认与当前全体消息一致；数值越小优先级越高（越先被消费） */
export const DEFAULT_WS_DISPATCH_PRIORITY = 0;

/** 预留：高优先级推送（例如关键信令）；接入时传入 enqueueWsDispatch(fn, WS_DISPATCH_PRIORITY_HIGH) */
export const WS_DISPATCH_PRIORITY_HIGH = -100;

/** 预留：低优先级推送（例如可延迟 UI）；接入时传入 enqueueWsDispatch(fn, WS_DISPATCH_PRIORITY_LOW) */
export const WS_DISPATCH_PRIORITY_LOW = 100;

/**
 * 单帧内连续执行 dispatch 的时间预算（毫秒）。
 * 用于：无 rIC 时的 rAF 回退；rIC 因 timeout 强制触发时的上限，避免占满主线程。
 */
let frameBudgetMs = 6;

/** rIC 的 timeout：一直无空闲时最晚多久必须执行一次，防止队列积压 */
let idleCallbackTimeoutMs = 50;

/** @param {number} ms */
export function setWsDispatchFrameBudgetMs(ms) {
  frameBudgetMs = Math.max(1, ms);
}

/** @param {number} ms */
export function setWsDispatchIdleTimeoutMs(ms) {
  idleCallbackTimeoutMs = Math.max(16, ms);
}

/** @type {Map<number, Array<() => void>>} */
const queues = new Map();

let flushScheduled = false;

function hasAnyWork() {
  for (const q of queues.values()) {
    if (q.length) return true;
  }
  return false;
}

function getHighestPriorityQueue() {
  const keys = Array.from(queues.keys()).sort((a, b) => a - b);
  for (const k of keys) {
    const q = queues.get(k);
    if (q && q.length) return q;
  }
  return null;
}

/**
 * @param {IdleDeadline | null} idleDeadline null 表示 rAF 回退路径
 */
function flushWithIdleDeadline(idleDeadline) {
  flushScheduled = false;

  const rafSliceEnd =
    idleDeadline == null ? performance.now() + frameBudgetMs : null;
  const forcedIdleCapEnd =
    idleDeadline && idleDeadline.didTimeout
      ? performance.now() + frameBudgetMs
      : null;

  while (hasAnyWork()) {
    if (idleDeadline) {
      if (idleDeadline.didTimeout) {
        if (
          forcedIdleCapEnd != null &&
          performance.now() >= forcedIdleCapEnd
        ) {
          break;
        }
      } else if (idleDeadline.timeRemaining() < 1) {
        break;
      }
    } else if (rafSliceEnd != null && performance.now() >= rafSliceEnd) {
      break;
    }

    const q = getHighestPriorityQueue();
    if (!q) break;
    const fn = q.shift();
    if (!fn) continue;
    try {
      fn();
    } catch (e) {
      console.error("[wsDispatchScheduler]", e);
    }
  }

  if (hasAnyWork()) {
    scheduleFlush();
  }
}

function scheduleFlush() {
  if (flushScheduled) return;
  flushScheduled = true;

  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(
      (deadline) => {
        flushWithIdleDeadline(deadline);
      },
      { timeout: idleCallbackTimeoutMs }
    );
  } else {
    requestAnimationFrame(() => flushWithIdleDeadline(null));
  }
}

/**
 * @param {() => void} fn
 * @param {number} [priority=DEFAULT_WS_DISPATCH_PRIORITY]
 */
export function enqueueWsDispatch(fn, priority = DEFAULT_WS_DISPATCH_PRIORITY) {
  const p = priority ?? DEFAULT_WS_DISPATCH_PRIORITY;
  if (!queues.has(p)) queues.set(p, []);
  queues.get(p).push(fn);
  scheduleFlush();
}
