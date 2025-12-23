/**
 * macOS 特有的错误清理和修复工具
 * 解决 IndexedDB 版本不匹配、文件锁定等问题
 */

import fs from 'fs';
import nodePath from 'path';
import { app } from 'electron';

const isOsx = process.platform === 'darwin';

/**
 * [macOS] 清理 IndexedDB 残留的锁文件
 * 解决因应用崩溃或异常退出导致的 IndexedDB 版本不匹配问题
 */
export function cleanupIndexedDBLocks() {
    if (!isOsx) return;

    const userData = app.getPath('userData');

    try {
        const indexedDBPath = nodePath.join(userData, 'IndexedDB');
        if (!fs.existsSync(indexedDBPath)) return;

        const dirs = fs.readdirSync(indexedDBPath);
        for (const dir of dirs) {
            const leveldbPath = nodePath.join(indexedDBPath, dir);
            const stat = fs.statSync(leveldbPath);

            if (stat.isDirectory() && dir.endsWith('.leveldb')) {
                const lockFile = nodePath.join(leveldbPath, 'LOCK');

                // 检查 LOCK 文件是否存在
                if (fs.existsSync(lockFile)) {
                    try {
                        // 尝试删除锁文件
                        fs.unlinkSync(lockFile);
                        console.log(`[macOS] 已清理 IndexedDB 锁文件: ${lockFile}`);
                    } catch (e) {
                        // 如果删除失败，说明可能被其他进程持有，跳过
                        console.log(`[macOS] 锁文件正在使用中: ${lockFile}`);
                    }
                }
            }
        }
    } catch (error) {
        console.log('[macOS] 清理 IndexedDB 锁文件时出错:', error.message);
    }
}

/**
 * [macOS] 清理 localStorage 中残留的版本号缓存
 * 在 IndexedDB 被手动删除后，版本号缓存可能不同步
 */
export function cleanupStaleVersionCache() {
    if (!isOsx) return;

    const userData = app.getPath('userData');

    try {
        const indexedDBPath = nodePath.join(userData, 'IndexedDB');

        // 如果 IndexedDB 目录不存在或为空，但 Local Storage 存在
        // 说明可能是残留状态
        if (!fs.existsSync(indexedDBPath)) {
            console.log('[macOS] IndexedDB 目录不存在，版本缓存将在首次使用时重建');
        }
    } catch (error) {
        console.log('[macOS] 检查版本缓存状态时出错:', error.message);
    }
}

/**
 * [macOS] 清理损坏的 LevelDB 文件
 * LevelDB 在崩溃后可能产生损坏的日志文件，影响数据库打开
 */
export function cleanupCorruptedLevelDB() {
    if (!isOsx) return;

    const userData = app.getPath('userData');

    try {
        const indexedDBPath = nodePath.join(userData, 'IndexedDB');
        if (!fs.existsSync(indexedDBPath)) return;

        const dirs = fs.readdirSync(indexedDBPath);
        for (const dir of dirs) {
            const leveldbPath = nodePath.join(indexedDBPath, dir);
            const stat = fs.statSync(leveldbPath);

            if (stat.isDirectory() && dir.endsWith('.leveldb')) {
                cleanupSingleLevelDB(leveldbPath);
            }
        }
    } catch (error) {
        console.log('[macOS] 清理损坏的 LevelDB 文件时出错:', error.message);
    }
}

/**
 * [macOS] 清理单个 LevelDB 目录中的损坏文件
 * @param {string} leveldbPath - LevelDB 目录路径
 */
function cleanupSingleLevelDB(leveldbPath) {
    try {
        const files = fs.readdirSync(leveldbPath);

        for (const file of files) {
            const filePath = nodePath.join(leveldbPath, file);

            // 检查临时文件 (.tmp)
            if (file.endsWith('.tmp')) {
                try {
                    fs.unlinkSync(filePath);
                    console.log(`[macOS] 已清理 LevelDB 临时文件: ${file}`);
                } catch (e) {
                    // 文件可能正在使用，跳过
                }
                continue;
            }

            // 检查损坏的日志文件 (LOG.old, LOG)
            if (file === 'LOG.old') {
                try {
                    fs.unlinkSync(filePath);
                    console.log(`[macOS] 已清理 LevelDB 旧日志: ${file}`);
                } catch (e) {
                    // 跳过
                }
                continue;
            }

            // 检查空的或损坏的 .ldb/.log 文件
            if (file.endsWith('.ldb') || file.endsWith('.log')) {
                try {
                    const fileStat = fs.statSync(filePath);
                    // 如果文件大小为0，可能是损坏的
                    if (fileStat.size === 0) {
                        fs.unlinkSync(filePath);
                        console.log(`[macOS] 已清理空的 LevelDB 文件: ${file}`);
                    }
                } catch (e) {
                    // 跳过
                }
            }
        }

        // 检查 MANIFEST 文件是否存在且有效
        const manifestFiles = files.filter(f => f.startsWith('MANIFEST-'));
        if (manifestFiles.length === 0) {
            // 没有 MANIFEST 文件，数据库可能损坏
            // 检查 CURRENT 文件是否指向有效的 MANIFEST
            const currentFile = nodePath.join(leveldbPath, 'CURRENT');
            if (fs.existsSync(currentFile)) {
                try {
                    const currentContent = fs.readFileSync(currentFile, 'utf8').trim();
                    const manifestPath = nodePath.join(leveldbPath, currentContent);
                    if (!fs.existsSync(manifestPath)) {
                        console.log(`[macOS] 检测到 CURRENT 指向不存在的 MANIFEST: ${currentContent}`);
                        // 可以选择删除 CURRENT 文件让 LevelDB 重建
                        // fs.unlinkSync(currentFile);
                    }
                } catch (e) {
                    // 跳过
                }
            }
        }
    } catch (error) {
        console.log(`[macOS] 清理 LevelDB 目录失败 ${leveldbPath}:`, error.message);
    }
}

/**
 * [macOS] 执行所有启动前清理任务
 */
export function runMacStartupCleanup() {
    if (!isOsx) return;

    console.log('[macOS] 执行启动前清理...');
    cleanupIndexedDBLocks();
    cleanupCorruptedLevelDB();
    cleanupStaleVersionCache();
    console.log('[macOS] 启动前清理完成');
}

let userDataWatcher = null;

/**
 * [macOS] 使用 fs.watch 监听 userData 目录删除
 * 替代 setInterval 轮询，避免文件锁定问题
 * @param {Function} onRemoved - 目录被删除时的回调
 * @returns {Function} 停止监听的函数
 */
export function watchUserDataRemoval(onRemoved) {
    if (!isOsx) return null;

    const userData = app.getPath('userData');

    // 如果目录不存在，直接退出
    if (!fs.existsSync(userData)) {
        console.log('[macOS] userData 目录不存在，跳过监听');
        onRemoved && onRemoved();
        return null;
    }

    try {
        // 监听父目录，检测 userData 目录的删除
        const parentDir = nodePath.dirname(userData);
        const targetName = nodePath.basename(userData);

        userDataWatcher = fs.watch(parentDir, (eventType, filename) => {
            // 当检测到目标目录相关事件时，检查目录是否还存在
            if (filename === targetName || eventType === 'rename') {
                if (!fs.existsSync(userData)) {
                    console.log('[macOS] 检测到 userData 目录被删除');
                    stopWatchUserData();
                    onRemoved && onRemoved();
                }
            }
        });

        userDataWatcher.on('error', (error) => {
            console.log('[macOS] userData 监听出错:', error.message);
            stopWatchUserData();
        });

        console.log('[macOS] 已启动 userData 目录监听 (fs.watch)');

        return stopWatchUserData;
    } catch (error) {
        console.log('[macOS] 启动 userData 监听失败:', error.message);
        return null;
    }
}

/**
 * [macOS] 停止监听 userData 目录
 */
export function stopWatchUserData() {
    if (userDataWatcher) {
        try {
            userDataWatcher.close();
            userDataWatcher = null;
            console.log('[macOS] 已停止 userData 目录监听');
        } catch (e) {
            // ignore
        }
    }
}

export default {
    cleanupIndexedDBLocks,
    cleanupCorruptedLevelDB,
    cleanupStaleVersionCache,
    runMacStartupCleanup,
    watchUserDataRemoval,
    stopWatchUserData,
};

