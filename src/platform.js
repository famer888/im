// 平台相关代码，目前主要用来处理electron 和 浏览器之间不同
// contextIsolation: true / nodeIntegration: false
// 所有 Node.js / Electron API 通过 preload 脚本的 window.electronAPI 访问

const api = (typeof window !== 'undefined' && window.electronAPI) || {};

export function isElectron() {
    if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
        return true;
    }
    return !!api.process;
}

// IPC
export const ipcRenderer = api.ipcRenderer || {};

// Shell
export const shell = api.shell || {};

// Clipboard
export const clipboard = api.clipboard || {};

// Window control (替代 @electron/remote 的 getCurrentWindow())
export const windowControl = api.windowControl || {};

// remote 兼容层 —— 仅提供 getCurrentWindow() 代理，其他功能已迁移
export const remote = {
    getCurrentWindow() {
        return api.windowControl || {};
    },
};

// App info
export const app = api.app || {};
export const AppPath = (api.app && api.app.getAppPath && api.app.getAppPath()) || '';

// Desktop Capturer
export const desktopCapturer = api.desktopCapturer || {};

// File System
export const fs = api.fs || {};

// Path
export const path = api.path || {};

// OS
export const os = api.os || {};

// Buffer utilities
export const BufferUtil = api.Buffer || {};

// 兼容旧代码中 currentWindow 的使用
export const currentWindow = api.windowControl || {};

// Process info
export const processInfo = api.process || {};

// BrowserWindow 不再直接可用 —— 如需操作其他窗口请通过 IPC
export const BrowserWindow = null;

// Convert a local file path (or file:// URL) to a local-resource:// URL
// Windows：反斜杠 + local-resource://C:\... 在 Chromium 中常导致 img/Image 无法完成加载；统一为 local-resource:///C:/...
export function toLocalResourceUrl(filePath) {
    if (!filePath) return filePath;
    if (filePath.startsWith('http') || filePath.startsWith('local-resource://')) return filePath;
    if (filePath.startsWith('file://')) {
        const rest = filePath.replace(/^file:\/\/\/?/, '');
        return toLocalResourceUrl(rest);
    }
    let p = String(filePath).replace(/\\/g, '/');
    if (!p.startsWith('/') && /^[A-Za-z]:\//.test(p)) {
        p = `/${p}`;
    }
    return `local-resource://${p}`;
}

/** 将 local-resource:// 或 file:// 还原为供 Node fs / shell 使用的磁盘路径 */
export function toFsPathFromDisplayUrl(url) {
    if (!url || typeof url !== 'string') return url;
    if (/^https?:\/\//i.test(url)) return url;
    let p = url;
    if (/^local-resource:\/\//i.test(p)) {
        p = p.replace(/^local-resource:\/\//i, '');
    } else if (/^file:\/\//i.test(p)) {
        p = p.replace(/^file:\/\/\/?/i, '');
    } else {
        return url;
    }
    try {
        p = decodeURIComponent(p);
    } catch (e) {
        /* ignore */
    }
    if (
        typeof process !== 'undefined' &&
        process.platform === 'win32' &&
        p.startsWith('/') &&
        /^\/[A-Za-z]:[\\/]/.test(p)
    ) {
        p = p.slice(1);
    }
    if (typeof path.normalize === 'function') {
        return path.normalize(p);
    }
    return p;
}

// for web
export const PostMessageEventEmitter = null;
