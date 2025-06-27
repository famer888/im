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

export { Cache };
