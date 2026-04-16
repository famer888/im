import { getPublicCacheDir, getPublicCacheDirSync } from "./tools.js";
import { checkDirectory, checkDirectorySync } from "./fileTools";
import { encrypt, decrypt } from "@/api/base";
import { fs, path as nodePath } from "@/platform";

const publicCachekey = "publicCache111222333";
export const AES_KEY = process.env.VUE_APP_AES_KEY;
export const NODE_ENV = process.env.VUE_APP_PACKNAME;

export const setPublicCache = async (key, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let cacheObj = (await getPublicCache()) || {};
            cacheObj[key] = data;
            let cacheJsonString = JSON.stringify(cacheObj);
            const encryptCache = encrypt(cacheJsonString, publicCachekey);
            writePublicCache(encryptCache);
            resolve(true);
        } catch (err) {
            reject(err);
        }
    });
};

export const setPublicCacheSync = (key, data) => {
    try {
        let cacheObj = getPublicCacheSync() || {};
        cacheObj[key] = data;
        let cacheJsonString = JSON.stringify(cacheObj);
        const encryptCache = encrypt(cacheJsonString, publicCachekey);
        writePublicCacheSync(encryptCache);
        return true;
    } catch (err) {
        return err;
    }
};

export const getPublicCache = async (key) => {
    return new Promise(async (resolve, reject) => {
        try {
            let path = await getPublicCachePath();
            fs.readFile(path, "utf8", (err, data) => {
                if (err) {
                    return resolve(data);
                }
                if (data) {
                    let params = decrypt(data, publicCachekey);
                    let result = JSON.parse(params);
                    if (key) {
                        result = result[key] || "";
                    }
                    resolve(result);
                }
            });
        } catch (err) {
            reject(err);
        }
    });
};

export const getPublicCacheSync = (key) => {
    try {
        let path = getPublicCachePathSync();
        const data = fs.readFileSync(path, "utf8");
        if (data) {
            let params = decrypt(data, publicCachekey);
            let result = JSON.parse(params);
            if (key) {
                result = result[key] || "";
            }
            return result;
        }
    } catch (err) {
        return "";
    }
};

const getPublicCachePath = () => {
    return new Promise(async (resolve) => {
        let directoryPath = await getPublicCacheDir();
        await checkDirectory(directoryPath);
        let path = nodePath.join(directoryPath, `/pbca-${NODE_ENV}.txt`);
        resolve(path);
    });
};
export const getPublicCachePathSync = () => {
    let directoryPath = getPublicCacheDirSync();
    checkDirectorySync(directoryPath);
    let path = nodePath.join(directoryPath, `/pbca-${NODE_ENV}.txt`);
    return path;
};

export const writePublicCache = async (data) => {
    let path = await getPublicCachePath();
    fs.writeFile(path, data, (err) => {
        if (err) {
            console.error('writePublicCache:', err); 
            return;
        }
    });
};

export const writePublicCacheSync = (data) => {
    let path = getPublicCachePathSync();
    try {
        fs.writeFileSync(path, data);
    } catch (err) {
        console.error("写入文件时发生错误:", err);
    }
};
