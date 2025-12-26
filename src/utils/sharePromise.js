// 高阶函数
// options: { tag: string, timestamp: number, method: function, ttl: number }
// ttl: 多少毫秒内只能执行一次，默认1000毫秒
// tag和timestamp必选其一，以tag优先作为缓存key
// 以tag为key，存储timestamp，如果timestamp大于当前时间，则返回promise，否则创建promise并返回
// 以timestamp为key，存储promise，如新增的promise事件offset在ttl范围内(且method相同)，则返回同一个promise,否则创建新的promise并返回
// tag优先

// 存储结构: { [key]: { timestamp, promise, method } }
const promiseCache = new Map();

const sharePromise = (options, ...args) => {
  const { tag, timestamp, method, ttl = 1000 } = options;

  const hasTag = tag !== undefined && tag !== null && tag !== '';
  const hasTimestamp = timestamp !== undefined && timestamp !== null;

  if (!hasTag && !hasTimestamp) {
    return Promise.reject(new Error('tag or timestamp is required'));
  }
  if (!method) {
    return Promise.reject(new Error('method is required'));
  }

  const currentTimestamp = hasTimestamp ? timestamp : Date.now();

  // tag优先：直接用tag作为key
  if (hasTag) {
    const cached = promiseCache.get(tag);
    if (cached && cached.method === method && Math.abs(currentTimestamp - cached.timestamp) < ttl) {
      return cached.promise;
    }

    const promise = method(...args);
    promiseCache.set(tag, { timestamp: currentTimestamp, promise, method });

    promise.finally(() => {
      setTimeout(() => {
        const current = promiseCache.get(tag);
        if (current && current.promise === promise) {
          promiseCache.delete(tag);
        }
      }, ttl);
    });

    return promise;
  }

  // 无tag时：遍历缓存，查找timestamp在ttl范围内且method相同的缓存
  for (const [key, cached] of promiseCache) {
    if (cached.method === method && Math.abs(currentTimestamp - cached.timestamp) < ttl) {
      return cached.promise;
    }
  }

  // 未找到匹配的缓存，创建新的promise
  const cacheKey = `ts_${currentTimestamp}`;
  const promise = method(...args);

  promiseCache.set(cacheKey, { timestamp: currentTimestamp, promise, method });

  promise.finally(() => {
    setTimeout(() => {
      const current = promiseCache.get(cacheKey);
      if (current && current.promise === promise) {
        promiseCache.delete(cacheKey);
      }
    }, ttl);
  });

  return promise;
};

export default sharePromise;
