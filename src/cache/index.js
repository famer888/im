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

const middleware = (operation, tableName, key, res) => {
    if (!res?.success && res?.error) {
        console.log(`Storage ${operation} [${tableName}] [${key}] [false] [${res.error}]`);
    } else {
        console.log(`Storage ${operation} [${tableName}] [${key}] [true]`);
    }

    if (operation === "get") {
        if (!res || typeof res !== "object") {
            return { success: false, data: [], error: "invalid IPC response" };
        }
        if (res.success) {
            return Object.prototype.hasOwnProperty.call(res, "data")
                ? { success: true, data: res.data }
                : { success: true, data: [] };
        }
        return {
            success: false,
            data: Array.isArray(res.data) ? res.data : [],
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
            return { success: false, data: [], error: "Storage API not available" };
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
