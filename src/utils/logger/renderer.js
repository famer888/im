// 日志收集系统
import { ipcRenderer } from "@/platform";

// 判断是否为 plain object
const isPlainObject = (val) => {
    return Object.prototype.toString.call(val) === '[object Object]' && (val.constructor === Object || val.constructor === undefined)
}

// 从 Error 对象中提取尽可能多的信息
const extractErrorInfo = (err, depth = 0) => {
    try {
        if (depth > MAX_DEPTH) return '[MaxDepth]'
        if (err == null) return String(err)
        if (err instanceof Error) {
            const info = {
                name: err.name,
                message: err.message,
                stack: err.stack,
            }
            if (err.cause) info.cause = extractErrorInfo(err.cause, depth + 1)
            if (err.code) info.code = err.code
            if (err.fileName) info.fileName = err.fileName
            if (err.lineNumber) info.lineNumber = err.lineNumber
            if (err.columnNumber) info.columnNumber = err.columnNumber
            return info
        }
        return safeSerialize(err, depth)
    } catch {
        return '[Error: extractErrorInfo failed]'
    }
}

const MAX_DEPTH = 6;

// 安全序列化，处理非 plainObject 数据
const safeSerialize = (data, depth = 0) => {
    try {
        if (depth > MAX_DEPTH) return '[MaxDepth]'
        if (data === undefined) return 'undefined'
        if (data === null) return null
        if (typeof data === 'function') return `[Function: ${data.name || 'anonymous'}]`
        if (typeof data === 'symbol') return data.toString()
        if (typeof data === 'bigint') return data.toString() + 'n'
        if (data instanceof Error) return extractErrorInfo(data, depth)
        if (data instanceof Date) return data.toISOString()
        if (data instanceof RegExp) return data.toString()
        if (data instanceof Map) return { __type: 'Map', entries: Array.from(data.entries()).map(([k, v]) => [safeSerialize(k, depth + 1), safeSerialize(v, depth + 1)]) }
        if (data instanceof Set) return { __type: 'Set', values: Array.from(data.values()).map(v => safeSerialize(v, depth + 1)) }
        if (data instanceof ArrayBuffer) return { __type: 'ArrayBuffer', byteLength: data.byteLength }
        if (ArrayBuffer.isView(data)) return { __type: data.constructor.name, length: data.length }
        if (typeof data === 'object' && data !== null && typeof data.nodeType === 'number') {
            return `[DOM: ${data.nodeName || 'Node'}]`
        }
        if (Array.isArray(data)) return data.map(item => safeSerialize(item, depth + 1))
        if (isPlainObject(data)) {
            const result = {}
            for (const key of Object.keys(data)) {
                result[key] = safeSerialize(data[key], depth + 1)
            }
            return result
        }
        if (typeof data === 'object') {
            const ctorName = data.constructor?.name || 'Object'
            try {
                const props = {}
                for (const key of Object.keys(data)) {
                    props[key] = safeSerialize(data[key], depth + 1)
                }
                return { __type: ctorName, ...props }
            } catch {
                return `[${ctorName}]`
            }
        }
        return data
    } catch {
        return '[Unserializable]'
    }
}

// 安全发送日志，logType: 'app' | 'crash-report' | 'e2ee'
const safeSend = (logType, level, message, meta) => {
    try {
        ipcRenderer.send('write-log', logType, level, safeSerialize(message), safeSerialize(meta))
    } catch {
        // collect 系统本身不可出错，静默失败
    }
}

let initialized = false;

export const initLogCollectSystem = () => {
    if (initialized) return;
    initialized = true;

    console.$collect = function (message, meta) {
        safeSend('app', 'info', message, meta)
    };
    console.$collectError = function (message, meta) {
        safeSend('app', 'error', message, meta)
    };
    console.$collectCrash = function (message, meta) {
        safeSend('crash-report', 'error', message, meta)
    };
    console.$collectE2ee = function (message, meta) {
        safeSend('e2ee', 'info', message, meta)
    };
    console.$collectE2eeError = function (message, meta) {
        safeSend('e2ee', 'error', message, meta)
    };

    watchAllJsError()
}

// 监听全局 JavaScript 错误
const watchAllJsError = () => {
    window.addEventListener('error', (event) => {
        try {
            console.$collectError(['[JS_ERROR]', event.message, event.filename, event.lineno, extractErrorInfo(event.error)])
        } catch { /* 静默 */ }
    });
    window.addEventListener('unhandledrejection', (event) => {
        try {
            console.$collectError(['[PROMISE_ERROR]', extractErrorInfo(event.reason)])
        } catch { /* 静默 */ }
    });
    const originalConsoleError = console.error;
    console.error = function(...args) {
        try {
            console.$collectError(['[CONSOLE_ERROR]', ...args.map(extractErrorInfo)])
        } catch { /* 静默 */ }
        originalConsoleError.apply(console, args);
    }
}
