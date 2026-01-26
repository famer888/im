// 日志收集系统
import { ipcRenderer } from "@/platform";

// 判断是否为 plain object
const isPlainObject = (val) => {
    return Object.prototype.toString.call(val) === '[object Object]' && (val.constructor === Object || val.constructor === undefined)
}

// 从 Error 对象中提取尽可能多的信息
const extractErrorInfo = (err) => {
    try {
        if (err == null) return String(err)
        if (err instanceof Error) {
            const info = {
                name: err.name,
                message: err.message,
                stack: err.stack,
            }
            if (err.cause) info.cause = extractErrorInfo(err.cause)
            if (err.code) info.code = err.code
            if (err.fileName) info.fileName = err.fileName
            if (err.lineNumber) info.lineNumber = err.lineNumber
            if (err.columnNumber) info.columnNumber = err.columnNumber
            return info
        }
        return safeSerialize(err)
    } catch {
        return '[Error: extractErrorInfo failed]'
    }
}

// 安全序列化，处理非 plainObject 数据
const safeSerialize = (data) => {
    try {
        if (data === undefined) return 'undefined'
        if (data === null) return null
        if (typeof data === 'function') return `[Function: ${data.name || 'anonymous'}]`
        if (typeof data === 'symbol') return data.toString()
        if (typeof data === 'bigint') return data.toString() + 'n'
        if (data instanceof Error) return extractErrorInfo(data)
        if (data instanceof Date) return data.toISOString()
        if (data instanceof RegExp) return data.toString()
        if (data instanceof Map) return { __type: 'Map', entries: Array.from(data.entries()).map(([k, v]) => [safeSerialize(k), safeSerialize(v)]) }
        if (data instanceof Set) return { __type: 'Set', values: Array.from(data.values()).map(safeSerialize) }
        if (data instanceof ArrayBuffer) return { __type: 'ArrayBuffer', byteLength: data.byteLength }
        if (ArrayBuffer.isView(data)) return { __type: data.constructor.name, length: data.length }
        if (typeof data === 'object' && data !== null && typeof data.nodeType === 'number') {
            // DOM 元素
            return `[DOM: ${data.nodeName || 'Node'}]`
        }
        if (Array.isArray(data)) return data.map(safeSerialize)
        if (isPlainObject(data)) {
            const result = {}
            for (const key of Object.keys(data)) {
                result[key] = safeSerialize(data[key])
            }
            return result
        }
        // 其他对象尝试转换
        if (typeof data === 'object') {
            const ctorName = data.constructor?.name || 'Object'
            try {
                const props = {}
                for (const key of Object.keys(data)) {
                    props[key] = safeSerialize(data[key])
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

// 安全发送日志
const safeSend = (level, message, meta) => {
    try {
        ipcRenderer.send('renderer-log', level, safeSerialize(message), safeSerialize(meta))
    } catch {
        // collect 系统本身不可出错，静默失败
    }
}

export const initLogCollectSystem = () => {
    console.$collect = function (message, meta) {
        safeSend('info', message, meta)
    };
    console.$collectError = function (message, meta) {
        safeSend('error', message, meta)
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
