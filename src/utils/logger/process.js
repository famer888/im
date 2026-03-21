import log from 'electron-log';
import { ipcMain, app } from 'electron';
import path from 'path';
import fs from 'fs';

function getLogDir() {
    return path.join(app.getPath('userData'), 'logs');
}

function pad(n) { return String(n).padStart(2, '0'); }

function formatDate(d) {
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function stringify(item) {
    if (item == null || typeof item !== 'object') return String(item);
    if (item instanceof Error) {
        const o = { name: item.name, message: item.message, stack: item.stack };
        if (item.code) o.code = item.code;
        if (item.cause) o.cause = stringify(item.cause);
        return JSON.stringify(o);
    }
    if (typeof item.then === 'function') return '[Promise]';
    try { return JSON.stringify(item); } catch { return '[Circular]'; }
}

function formatLine({ data, date, level }) {
    try {
        let logType = 'app';
        let rest = data;
        if (rest.length > 0 && typeof rest[0] === 'string' && /^\[.+\]$/.test(rest[0])) {
            logType = rest[0].slice(1, -1);
            rest = rest.slice(1);
        }
        const content = rest.map(stringify).join(' ').replace(/[\r\n]+/g, ' ');
        return `[${formatDate(date)}][${logType}][${level}] ${content}`;
    } catch {
        return `[${level}] [format error] ${String(data)}`;
    }
}

try { fs.mkdirSync(getLogDir(), { recursive: true }); } catch { /* silent */ }

const logger = log.create('verbose');
logger.transports.console.level = false;
logger.transports.file.sync = false;
logger.transports.file.maxSize = 10 * 1024 * 1024;
logger.transports.file.maxFiles = 5;
logger.transports.file.format = formatLine;
logger.transports.file.resolvePath = () => path.join(getLogDir(), 'verbose.log');
logger.transports.file.archiveLog = function (file) {
    try {
        const filePath = file.toString();
        const info = path.parse(filePath);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        fs.renameSync(filePath, path.join(info.dir, `${info.name}_${timestamp}${info.ext}`));
    } catch {
        // silent
    }
};

const VALID_LEVELS = new Set(['info', 'warn', 'error', 'debug', 'verbose', 'silly']);

export function writeLog(logType, level, message, meta) {
    try {
        if (!VALID_LEVELS.has(level)) return;
        const tag = `[${logType}]`;
        if (meta !== undefined) {
            logger[level](tag, message, meta);
        } else {
            logger[level](tag, message);
        }
    } catch {
        // 日志系统自身不可影响业务流程
    }
}

const CRASH_REASONS = {
    'gpu-process-crashed': 'GPU进程崩溃',
    'renderer-process-crashed': '渲染进程崩溃',
    'render-process-gone': '渲染进程终止',
    'child-process-gone': '子进程终止',
};
const EXIT_REASONS = {
    'clean-exit': '正常退出', 'abnormal-exit': '异常退出', 'killed': '被终止',
    'crashed': '崩溃', 'oom': 'OOM', 'launch-failed': '启动失败', 'integrity-failure': '完整性校验失败',
};

export function writeCrashReport(type, details = {}) {
    try {
        const p = [CRASH_REASONS[type] || type];
        if (details.killed !== undefined) p.push(`killed:${details.killed}`);
        if (details.reason) p.push(`reason:${EXIT_REASONS[details.reason] || details.reason}`);
        if (details.exitCode !== undefined) p.push(`exitCode:${details.exitCode}`);
        if (details.type) p.push(`proc:${details.type}`);
        if (details.serviceName) p.push(`service:${details.serviceName}`);
        if (details.name) p.push(`name:${details.name}`);
        if (details.url) p.push(`url:${details.url}`);
        const v = process.versions;
        p.push(`electron:${v.electron || '?'} node:${v.node || '?'} os:${process.platform}/${process.arch}`);
        writeLog('crash-report', 'error', `[${type}] ${p.join(' | ')}`);
    } catch {
        // 崩溃收集自身不可再抛错
    }
}

export function initProcessLogger() {
    ipcMain.on('write-log', (_event, logType, level, message, meta) => {
        writeLog(logType, level, message, meta);
    });
}

export { logger };
