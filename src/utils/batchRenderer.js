/**
 * 批量渲染调度器
 * 在时间窗口内收集消息，合并后一次性分发给监听器
 *
 * 使用 requestAnimationFrame 确保在下一帧统一处理，避免高频触发导致的性能问题
 */

// 需要进行批处理的事件类型
const BATCH_OPERATORS = ['msgNew', 'msgListPropertyUpdate'];

// 批量模式标记
const BATCH_MODE = '__batch__';

/**
 * 判断是否为批量模式
 * @param {string} operatorType - 操作类型
 * @param {any} info - 消息数据
 * @returns {boolean}
 */
const isBatchMode = (operatorType, info) => {
  return operatorType === BATCH_MODE && Array.isArray(info);
};

/**
 * 创建批量事件处理器
 * 简化组件中的批量处理逻辑，减少重复代码
 *
 * @param {Object} config - 配置对象
 * @param {Function} config.getFilterKey - 获取当前组件的过滤键（如 chatContent.id + chatContent.type）
 * @param {Object} config.handlers - 批量处理器映射 { operator: (messages) => void }
 * @param {Function} config.fallback - 单条消息的处理函数 (info, operator, operatorType) => void
 * @returns {Function} 事件处理函数
 */
const createBatchEventHandler = (config) => {
  const { getFilterKey, handlers, fallback } = config;

  return function(info, operator, operatorType) {
    // 批量模式
    if (isBatchMode(operatorType, info)) {
      // 过滤出相关消息
      const filterKey = getFilterKey ? getFilterKey() : null;
      const relevantMessages = filterKey
        ? info.filter((msg) => msg.data.id + msg.data.type === filterKey)
        : info;

      if (relevantMessages.length === 0) {
        return;
      }

      // 查找对应的批量处理器
      const handler = handlers[operator];
      if (handler) {
        handler.call(this, relevantMessages);
      } else if (fallback) {
        // 没有批量处理器，逐条处理
        relevantMessages.forEach((msg) => {
          fallback.call(this, msg.data, operator, msg.operatorType);
        });
      }
      return;
    }

    // 单条消息模式，调用 fallback
    if (fallback) {
      fallback.call(this, info, operator, operatorType);
    }
  };
};

class BatchRenderer {
  constructor(options = {}) {
    // operator -> Array<{ data, operatorType }>
    this.queue = new Map();
    // 调度器 ID
    this.rafId = null;
    // 监听器引用
    this.listeners = null;
    // 调试模式
    this.debug = options.debug || false;
    // 上次 flush 时间
    this.lastFlushTime = 0;
    // 间隔阈值（ms），超过此间隔的首条消息立即处理
    this.intervalThreshold = options.intervalThreshold || 160;
  }

  /**
   * 设置监听器引用
   * @param {Object} listeners - mgsGetFns 对象
   */
  setListeners(listeners) {
    this.listeners = listeners;
  }

  /**
   * 判断是否需要批处理
   * @param {string} operator - 事件类型
   * @returns {boolean}
   */
  shouldBatch(operator) {
    return BATCH_OPERATORS.includes(operator);
  }

  /**
   * 添加消息到批处理队列
   * @param {string} operator - 事件类型
   * @param {Object} data - 消息数据
   * @param {string} operatorType - 操作子类型
   */
  add(operator, data, operatorType) {
    const now = Date.now();
    const timeSinceLastFlush = now - this.lastFlushTime;

    // 如果距离上次 flush 超过阈值，且队列为空，立即处理（单条模式）
    if (timeSinceLastFlush > this.intervalThreshold && this.queue.size === 0) {
      // console.log(`[BatchRenderer] 低频消息，间隔 ${timeSinceLastFlush}ms > ${this.intervalThreshold}ms，立即分发: ${operator}`);
      this.dispatchSingle(operator, data, operatorType);
      this.lastFlushTime = now;
      return;
    }

    // 在阈值内，加入批处理队列
    if (!this.queue.has(operator)) {
      this.queue.set(operator, []);
    }

    this.queue.get(operator).push({
      data,
      operatorType,
      timestamp: now
    });

    // console.log(`[BatchRenderer] 高频消息，间隔 ${timeSinceLastFlush}ms <= ${this.intervalThreshold}ms，加入队列: ${operator}, 队列大小: ${this.queue.get(operator).length}`);

    this.scheduleFlush();
  }

  /**
   * 单条消息立即分发（不走批量模式）
   * @param {string} operator - 事件类型
   * @param {Object} data - 消息数据
   * @param {string} operatorType - 操作子类型
   */
  dispatchSingle(operator, data, operatorType) {
    if (!this.listeners) return;

    for (const key of Object.keys(this.listeners)) {
      const eventsObj = this.listeners[key];
      if (eventsObj?.eventIdList.includes(operator)) {
        try {
          // 单条模式：直接传递原始数据
          eventsObj.runEvent(data, operator, operatorType);
        } catch (err) {
          console.error(`[BatchRenderer] 单条分发事件出错: ${operator}`, err);
        }
      }
    }
  }

  /**
   * 调度批量处理
   */
  scheduleFlush() {
    // 如果已经调度了，不重复调度
    if (this.rafId !== null) {
      return;
    }

    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.flush();
    });
  }

  /**
   * 执行批量分发
   */
  flush() {
    if (!this.listeners || this.queue.size === 0) {
      return;
    }

    const startTime = Date.now();
    this.lastFlushTime = startTime;

    // 按 operator 分组批量处理
    for (const [operator, messages] of this.queue) {
      if (messages.length === 0) continue;

      if (this.debug) {
        console.log(`[BatchRenderer] 批量分发: ${operator}, 消息数量: ${messages.length}`);
      }

      // 遍历所有监听器
      for (const key of Object.keys(this.listeners)) {
        const eventsObj = this.listeners[key];
        if (eventsObj?.eventIdList.includes(operator)) {
          try {
            // 批量模式：传递消息数组和特殊标记
            eventsObj.runEvent(messages, operator, BATCH_MODE);
          } catch (err) {
            console.error(`[BatchRenderer] 分发事件出错: ${operator}`, err);
          }
        }
      }
    }

    if (this.debug) {
      console.log(`[BatchRenderer] 批量分发完成，耗时: ${Date.now() - startTime}ms`);
    }

    // 清空队列
    this.queue.clear();
  }

  /**
   * 强制立即处理队列（用于组件销毁等场景）
   */
  forceFlush() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.flush();
  }

  /**
   * 清空队列（用于重置场景）
   */
  clear() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.queue.clear();
  }

  /**
   * 获取当前队列状态（调试用）
   */
  getStatus() {
    const status = {};
    for (const [operator, messages] of this.queue) {
      status[operator] = messages.length;
    }
    return {
      pending: this.rafId !== null,
      queues: status
    };
  }
}

// 单例模式
const batchRenderer = new BatchRenderer({
  debug: false // 生产环境关闭调试
});

export {
  batchRenderer,
  BatchRenderer,
  BATCH_OPERATORS,
  BATCH_MODE,
  isBatchMode,
  createBatchEventHandler
};
export default batchRenderer;

