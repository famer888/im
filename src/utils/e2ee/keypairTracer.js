/**
 * UpdateKeyPair 调用链追踪器
 * 在调用 UpdateKeyPair 接口前记录上游来源信息，便于排查调用链路
 *
 * 用法：
 *   import { setUpdateKeyPairSource, consumeUpdateKeyPairDesc } from './keypairTracer';
 *   setUpdateKeyPairSource('fnName', '触发场景');
 *   // ... 后续链路中 UpdateKeyPair 会自动携带 desc
 */

let _currentSource = null;

/**
 * 设置 UpdateKeyPair 的调用来源
 * @param {string} functionName - 触发的函数名
 * @param {string} description - 触发场景描述
 */
export const setUpdateKeyPairSource = (functionName, description) => {
    _currentSource = {
        functionName,
        description,
        timestamp: Date.now(),
    };
};

/**
 * 获取并消费当前的调用来源，返回格式化的 desc 字符串
 * @returns {string} 格式: "functionName:description"
 */
export const consumeUpdateKeyPairDesc = () => {
    if (!_currentSource) {
        return 'unknown:未设置调用来源';
    }
    const desc = `${_currentSource.functionName}:${_currentSource.description}`;
    _currentSource = null;
    return desc;
};
