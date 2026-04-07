import { require } from "@electron/remote";
import { ipcRenderer } from "@/platform";
import i18n from "@/assets/lang/i18n";

// 事件
import eventCommon from "@/event/common";

// 假发送
const shouldPreventSendingMessage = (text) => {
  if (!text) return false;
  const sensitives = eventCommon.fnFakeSendSensitivesGet();
  const match = sensitives.some(item => text.includes(item));
  return match;
}
/**
 * 字符串过滤敏感词
 */
const filterSensitiveWords = (str) => {
    // 白名单
    const whiteArr = [i18n.t("我们已成为好友，打声招呼吧")];
    if(whiteArr.some(item => item === str)) return str;

    const arr = eventCommon.fnSensitiveWordsGet();
    let result = str;
    arr.forEach((item) => {
        if (!item || ["<", ">", "="].includes(item)) return;
        const replacement = "*".repeat(item.length);
        result = result.split(item).join(replacement);
    });

    return result;
};

const getCachDirectory = ({ GroupID, UserID }) => {
    return new Promise((resolve) => {
        let path = require("os").tmpdir();
        const nodePath = require("path");
        path = nodePath.join(
            path,
            `/97LocalStorage/${
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
        if (GroupID || UserID || ChannelID) {
            const nodePath = require("path");
            const subDir = GroupID
                ? "group-" + GroupID
                : ChannelID
                  ? "channel-" + ChannelID
                  : "user-" + UserID;
            path = nodePath.join(path, "Local Storage", subDir);
        }
        resolve(path);
    });
};

const getPublicCacheDirSync = () => {
    let path = require("os").tmpdir();
    const nodePath = require("path");
    path = nodePath.join(path, `/97LocalStorage/pbc/`);
    return path;
};

const getPublicCacheDir = () => {
    return new Promise((resolve) => {
        let path = require("os").tmpdir();
        const nodePath = require("path");
        path = nodePath.join(path, `/97LocalStorage/pbc/`);
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
    shouldPreventSendingMessage,
};
