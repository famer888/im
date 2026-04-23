import { ipcRenderer } from "@/platform";

// 工具
import { getPublicCacheSync, setPublicCache } from "@/utils/publicCache";

const Cache = async (key, value) => {
    let data = await ipcRenderer.invoke("getLocalFile", {
        key,
        value,
    });
    if (data) return JSON.parse(data);
};

// 使用函数延迟获取electronAPI.storage，避免模块加载时未初始化的问题
const getStorage = () => {
    try {
        return window?.electronAPI?.storage;
    } catch (error) {
        console.warn('Storage API not available:', error);
        return null;
    }
};

const report = (operation, tableName, key, res) => {
    if (!res?.success && res?.error) {
        console.log(`Storage ${operation} [${tableName}] [${key}] [false] [${res.error}]`);
    } 
    else {
        console.log(`Storage ${operation} [${tableName}] [${key}] [true]`);
    }
    return res?.data || res;
};

// 导出Storage对象，提供与原Storage类相同的方法
const Storage = {
    get: async (tableName, key = 'data') => {
        const storage = getStorage();
        if (!storage) {
            return [];
        }
        return storage.get(tableName, key).then(res => report('get', tableName, key, res));
    },
    set: async (tableName, value, key = 'data') => {
        const storage = getStorage();
        if (!storage) {
            return { success: false, error: 'Storage API not available' };
        }
        return storage.set(tableName, value, key).then(res => report('set', tableName, key, res));
    },
    delete: async (tableName, key = 'data') => {
        const storage = getStorage();
        if (!storage) {
            return { success: false, error: 'Storage API not available' };
        }
        return storage.delete(tableName, key).then(res => report('delete', tableName, key, res));
    },
    clear: async (tableName) => {
        const storage = getStorage();
        if (!storage) {
            return { success: false, error: 'Storage API not available' };
        }
        return storage.clear(tableName).then(res => report('clear', tableName, 'all', res));
    }
};

export const initUserCachePath = (loginId) => {
    return new Promise(async (resolve) => {
        const key = `cachePath-${loginId}`;
        let path = getPublicCacheSync(key);
        if (path) {
            ipcRenderer.invoke("set-user-data-path", path);
        } else {
            path = await ipcRenderer.invoke("get-user-data-path");
            if (path) {
                setPublicCache(key, path);
            }
        }
        setTimeout(() => {
            resolve();
        }, 500);
    });
};

export { Cache, Storage };
