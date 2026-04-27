import { ipcRenderer } from "@/platform";

// 工具
import { getPublicCacheSync, setPublicCache } from "@/utils/publicCache";

const Cache = async (key, value) => {
    if (!key) return;

    try {
        // 兼容旧签名：只传 key 时读取；value 为 null 时删除；其它情况写入
        if (value === undefined) {
            const res = await Storage.get(key);
            return res?.success ? res.data : undefined;
        }

        if (value === null) {
            await Storage.delete(key);
            return;
        }

        await Storage.set(key, value);
        return value;
    } catch (error) {
        console.warn(`Cache dispatch failed [${key}]`, error);
    }
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

const middleware = (operation, tableName, key, res) => {
    if (!res?.success && res?.error) {
        console.log(`Storage ${operation} [${tableName}] [${key}] [false] [${res.error}]`);
    } else {
        console.log(`Storage ${operation} [${tableName}] [${key}] [true]`);
    }

    if (operation === "get") {
        if (!res || typeof res !== "object") {
            return { success: false, data: undefined, error: "invalid IPC response" };
        }
        if (res.success) {
            return { success: true, data: res.data };
        }
        return {
            success: false,
            data: res.data,
            error: res.error || "unknown error",
        };
    }

    return res?.data || res;
};

// 导出Storage对象，提供与原Storage类相同的方法
const Storage = {
    get: async (tableName, key = "data") => {
        const storage = getStorage();
        if (!storage) {
            return { success: false, data: undefined, error: "Storage API not available" };
        }
        return storage.get(tableName, key).then((res) => middleware("get", tableName, key, res));
    },
    set: async (tableName, value, key = "data") => {
        const storage = getStorage();
        if (!storage) {
            return { success: false, error: "Storage API not available" };
        }
        return storage.set(tableName, value, key).then((res) => middleware("set", tableName, key, res));
    },
    delete: async (tableName, key = "data") => {
        const storage = getStorage();
        if (!storage) {
            return { success: false, error: "Storage API not available" };
        }
        return storage.delete(tableName, key).then((res) => middleware("delete", tableName, key, res));
    },
    clear: async (tableName) => {
        const storage = getStorage();
        if (!storage) {
            return { success: false, error: "Storage API not available" };
        }
        return storage.clear(tableName).then((res) => middleware("clear", tableName, "all", res));
    },
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
