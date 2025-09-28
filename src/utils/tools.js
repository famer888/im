import { require } from "@electron/remote";
import { ipcRenderer } from "@/platform";
import i18n from "@/assets/lang/i18n";

// 事件
import eventCommon from "@/event/common";

/**
 * 字符串过滤敏感词
 */
const filterSensitiveWords = (str) => {
    // 白名单
    const whiteArr = [i18n.t("我们已成为好友，打声招呼吧")]; 
    if(whiteArr.some(item => item === str)) return str;

    const arr = eventCommon.fnSensitiveWordsGet();
    let result = str; // 遍历数组中的每个字符串
    arr.forEach((item) => {
        if (["<", ">", "="].includes(item)) return;
        // 使用正则表达式将匹配到的字符替换为*
        const regex = new RegExp(item, "g");
        result = result.replace(regex, "*".repeat(item.length));
    });

    return result;
};

const getCachDirectory = ({ GroupID, UserID }) => {
    return new Promise((resolve) => {
        let path = require("os").tmpdir();
        const nodePath = require("path");
        path = nodePath.join(
            path,
            `/68LocalStorage/${
                GroupID ? "group-" + GroupID : "user-" + UserID
            }/`
        );
        resolve(path);
    });
};

const getUserDataDirectory = ({ GroupID, UserID, ChannelID }) => {
    return new Promise(async (resolve) => {
        let path = "";
        path = await ipcRenderer.invoke("get-user-data-path");
        if (!path) {
            path = require("os").tmpdir();
        }
        if (GroupID || UserID) {
            const nodePath = require("path");
            path = nodePath.join(
                path,
                `/Local Storage/${
                    GroupID ? "group-" + GroupID 
                            : ChannelID ? "channel-" + ChannelID
                            : "user-" + UserID
                }/`
            );
        }
        resolve(path);
    });
};

const getPublicCacheDirSync = () => {
    let path = require("os").tmpdir();
    const nodePath = require("path");
    path = nodePath.join(path, `/68LocalStorage/pbc/`);
    return path;
};

const getPublicCacheDir = () => {
    return new Promise((resolve) => {
        let path = require("os").tmpdir();
        const nodePath = require("path");
        path = nodePath.join(path, `/68LocalStorage/pbc/`);
        resolve(path);
    });
};

const getWorkingDir = () => {
    return new Promise( async (resolve) => {
        let path = "";
        path = await ipcRenderer.invoke("get-working-dir");
        resolve(path);
    });
};

export {
    getPublicCacheDir,
    getPublicCacheDirSync,
    filterSensitiveWords,
    getCachDirectory,
    getUserDataDirectory,
    getWorkingDir,
};
