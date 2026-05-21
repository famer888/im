// 工作目录 / 结果目录管理（design.md §5.5）
//
// 结构（默认 base = userData/images）：
//   <base>/avatar/<id>/<resourceKey>.bin       // Avatar 结果
//   <base>/picture/<msgId>/<resourceKey>.bin   // Picture 结果（[预留]）
//   <base>/poster/<msgId>/<resourceKey>.bin    // Poster 结果（[预留]）
//   <base>/.work/download/<random>.part        // 下载工作文件
//   <base>/.work/decrypt/<random>.dec          // 解密工作文件
//
// 不变量：工作目录与结果目录在同盘 → fs.rename 原子；跨盘自动退化为 copyFile+unlink 并 warn。

import fs from 'fs';
import nodePath from 'path';

let _baseDir = null;
let _sameVolume = true;

export const init = ({ userDataDir }) => {
    _baseDir = nodePath.join(userDataDir, 'images');
    ensureDir(_baseDir);
    ensureDir(workDir('download'));
    ensureDir(workDir('decrypt'));
    cleanupWorkDirs();
    detectSameVolume();
};

const ensureDir = (p) => {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
};

/** 工作目录（download / decrypt）。 */
export const workDir = (which) => {
    if (!_baseDir) throw new Error('[NativeImage paths] not initialized; call init() first');
    return nodePath.join(_baseDir, '.work', which);
};

/** 单次随机工作文件路径。 */
export const allocWorkFile = (which, ext = '.part') => {
    const random = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    return nodePath.join(workDir(which), `${random}${ext}`);
};

/**
 * 结果目录解析。仅 NativeImage base 内可调；派生组件不可见（design.md §12.2 第 3 条）。
 * @param {{ kind: string, id: string|number, sub?: string }} scope
 * @param {string} resourceKey
 * @param {{ ext?: string }} opts
 */
export const resolveResult = (scope, resourceKey, { ext = '.bin' } = {}) => {
    if (!_baseDir) throw new Error('[NativeImage paths] not initialized');
    const idSeg = String(scope.id);
    const subSeg = scope.sub ? `/${scope.sub}` : '';
    const dir = nodePath.join(_baseDir, scope.kind, `${idSeg}${subSeg}`);
    ensureDir(dir);
    return nodePath.join(dir, `${resourceKey}${ext}`);
};

/** 检测结果目录是否已有缓存文件。 */
export const peekResult = (scope, resourceKey, opts) => {
    const p = resolveResult(scope, resourceKey, opts);
    return fs.existsSync(p) && fs.statSync(p).size > 0 ? p : null;
};

/**
 * 原子提交：workPath → resultPath。跨盘退化为 copyFile + unlink。
 * 这是状态机 committing → ready 转移的唯一写入路径（design.md §5.6）。
 */
export const commit = async (workPath, resultPath) => {
    ensureDir(nodePath.dirname(resultPath));
    if (_sameVolume) {
        await fs.promises.rename(workPath, resultPath);
        return resultPath;
    }
    // 跨盘 fallback
    await fs.promises.copyFile(workPath, resultPath);
    try { await fs.promises.unlink(workPath); } catch (_) {}
    return resultPath;
};

const cleanupWorkDirs = () => {
    for (const which of ['download', 'decrypt']) {
        try {
            const dir = workDir(which);
            const entries = fs.readdirSync(dir);
            for (const name of entries) {
                try { fs.unlinkSync(nodePath.join(dir, name)); } catch (_) {}
            }
        } catch (_) {}
    }
};

const detectSameVolume = () => {
    try {
        const a = fs.statSync(_baseDir);
        const b = fs.statSync(nodePath.join(_baseDir, '.work'));
        _sameVolume = a.dev === b.dev;
        if (!_sameVolume) {
            console.warn('[NativeImage paths] cross-volume detected; commit() will fallback to copy+unlink');
        }
    } catch (_) {
        _sameVolume = true;
    }
};
