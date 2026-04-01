/**
 * WebSocket 解析与 dispatch 两阶段协作调度（requestIdleCallback + 时间片）。
 * - 解析队列：单帧内按预算处理 decrypt/decode 等，避免万条连续同步占满主线程。
 * - dispatch 队列：纯数据任务 { code, data }，无 per-message 闭包。
 */

/** 默认与当前全体消息一致；数值越小优先级越高（越先被消费） */
export const DEFAULT_WS_DISPATCH_PRIORITY = 0;

/** 预留：高优先级 */
export const WS_DISPATCH_PRIORITY_HIGH = -100;

/** 预留：低优先级 */
export const WS_DISPATCH_PRIORITY_LOW = 100;

let frameBudgetMs = 6;

let idleCallbackTimeoutMs = 50;

/** @param {number} ms */
export function setWsDispatchFrameBudgetMs(ms) {
  frameBudgetMs = Math.max(1, ms);
}

/** @param {number} ms */
export function setWsDispatchIdleTimeoutMs(ms) {
  idleCallbackTimeoutMs = Math.max(16, ms);
}

/**
 * @param {Map<number, unknown[]>} queues
 */
function hasAnyWorkIn(queues) {
  for (const q of queues.values()) {
    if (q.length) return true;
  }
  return false;
}

/**
 * @param {Map<number, unknown[]>} queues
 */
function getHighestPriorityQueueFrom(queues) {
  const keys = Array.from(queues.keys()).sort((a, b) => a - b);
  for (const k of keys) {
    const q = queues.get(k);
    if (q && q.length) return q;
  }
  return null;
}

/**
 * @param {{
 *   queues: Map<number, unknown[]>,
 *   scheduledFlag: { value: boolean },
 *   processOne: (task: unknown) => void,
 * }} opts
 */
function flushWithIdleDeadlineForQueues(idleDeadline, opts) {
  const { queues, scheduledFlag, processOne } = opts;
  scheduledFlag.value = false;

  const rafSliceEnd =
    idleDeadline == null ? performance.now() + frameBudgetMs : null;
  const forcedIdleCapEnd =
    idleDeadline && idleDeadline.didTimeout
      ? performance.now() + frameBudgetMs
      : null;

  while (hasAnyWorkIn(queues)) {
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

    const q = getHighestPriorityQueueFrom(queues);
    if (!q) break;
    const task = q.shift();
    if (task == null) continue;
    try {
      processOne(task);
    } catch (e) {
      console.error("[wsScheduler]", e);
    }
  }

  if (hasAnyWorkIn(queues)) {
    scheduleIdleFlush(opts);
  }
}

function scheduleIdleFlush(opts) {
  const scheduledFlag = opts.scheduledFlag;
  if (scheduledFlag.value) return;
  scheduledFlag.value = true;

  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(
      (deadline) => {
        flushWithIdleDeadlineForQueues(deadline, opts);
      },
      { timeout: idleCallbackTimeoutMs }
    );
  } else {
    requestAnimationFrame(() => flushWithIdleDeadlineForQueues(null, opts));
  }
}

// ---------- 解析阶段 ----------

/** @type {Map<number, Array<{ arrayBuffer: ArrayBuffer, priority: number }>>} */
const parseQueues = new Map();

const parseScheduled = { value: false };

/** @type {(task: { arrayBuffer: ArrayBuffer, priority: number }) => void} */
let parseRunner = (task) => {
  console.warn("[wsScheduler] parseRunner 未注册", task);
};

export function registerWsParseRunner(fn) {
  parseRunner = fn;
}

const parseFlushOpts = {
  queues: parseQueues,
  scheduledFlag: parseScheduled,
  processOne(task) {
    parseRunner(task);
  },
};

/**
 * @param {ArrayBuffer} arrayBuffer 建议调用方已 slice(0) 拷贝，避免外部复用
 * @param {number} [priority=DEFAULT_WS_DISPATCH_PRIORITY]
 */
export function enqueueWsParseTask(
  arrayBuffer,
  priority = DEFAULT_WS_DISPATCH_PRIORITY
) {
  const p = priority ?? DEFAULT_WS_DISPATCH_PRIORITY;
  if (!parseQueues.has(p)) parseQueues.set(p, []);
  parseQueues.get(p).push({ arrayBuffer, priority: p });
  scheduleIdleFlush(parseFlushOpts);
}

// ---------- dispatch 阶段 ----------

/** @type {Map<number, Array<{ code: number, data: object }>>} */
const dispatchQueues = new Map();

const dispatchScheduled = { value: false };

/** @type {(task: { code: number, data: object }) => void} */
let dispatchRunner = (task) => {
  console.warn("[wsScheduler] dispatchRunner 未注册", task);
};

export function registerWsDispatchRunner(fn) {
  dispatchRunner = fn;
}

const dispatchFlushOpts = {
  queues: dispatchQueues,
  scheduledFlag: dispatchScheduled,
  processOne(task) {
    dispatchRunner(task);
  },
};

/**
 * @param {{ code: number, data: object }} task
 * @param {number} [priority=DEFAULT_WS_DISPATCH_PRIORITY]
 */
export function enqueueWsDispatchTask(
  task,
  priority = DEFAULT_WS_DISPATCH_PRIORITY
) {
  const p = priority ?? DEFAULT_WS_DISPATCH_PRIORITY;
  if (!dispatchQueues.has(p)) dispatchQueues.set(p, []);
  dispatchQueues.get(p).push({ code: task.code, data: task.data });
  scheduleIdleFlush(dispatchFlushOpts);
}
