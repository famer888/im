import { ipcRenderer, remote, fs, BufferUtil } from "@/platform";
import BDBase from "@/database/queue";
import _ from "lodash";

// api
import { _encrypt, _decrypt } from "@/api/base/index";

// 另存为
export function otherSave(message) {
    let fileName = message.fileName || getFileName(message.value);
    if (!fileName || !message.id) return;
    ipcRenderer.invoke("openFileDialog", {
        messageId: message.id,
        remotePath: message.value,
        fileName,
        windowId: remote.getCurrentWindow().getMediaSourceId(),
        fileKey: message.fileKey,
    });
}
// 导出历史记录
export function outFile(key) {
    ipcRenderer.invoke("outFile", {
        fileName: "45历史记录导出文件",
        key,
    });
}

export const autoImportCache = async (path, key) => {
    let fileBuffer = fs.readFileSync(path);
    let data2 = await inFileFun(fileBuffer, key);
    importCache(data2);
};

export function importCache(data) {
    if (data.history && data.history.length) {
        window.$db = new BDBase(data.uid);
        setTimeout(() => {
            data.history.forEach((item) => {
                window.$db.addDB(item.name, item.list);
            });
        }, 1000);
    }
}

/**
 * 导出历史记录回调
 */
export const outFileFun = (filePath, key, opt = { hideTip: false }) => {
    window.$db.exportDatabase().then((res) => {
        const { uid } = res;
        const history = JSON.parse(res.history);
        for (const key of Object.keys(history)) {
            if (history[key].length === 0) {
                delete history[key];
            }
        }

        const buffer = BufferUtil.from(JSON.stringify({ uid, history }));
        const decodeFile = (arrayBuffer, fileKey) => {
            if (!fileKey) return;
            return new Promise(async (resolve) => {
                const arrbuf = _encrypt(fileKey, arrayBuffer);
                fs.writeFileSync(filePath, arrbuf);
                if (!opt.hideTip) {
                    window.$toast("导出成功");
                }
                resolve(true);
            });
        };
        decodeFile(buffer, key);
    });
};

export async function inFileFun(file, key) {
    return new Promise(async (resolve) => {
        if (!key) return resolve({});
        const getBlob = ({ file }) => {
            return new Promise((resolve) => {
                let blob = new Blob([file], {
                    type: "text/plain;charset=utf-8",
                });
                let reader = new FileReader();
                reader.onload = function (result) {
                    resolve(result.target.result);
                };
                reader.readAsArrayBuffer(blob);
            });
        };
        try {
            let FileBuf = await getBlob({ file });
            let arrbuf = _decrypt(new Int8Array(FileBuf), key);
            let jsonObj = BufferUtil.toString(BufferUtil.from(arrbuf, "base64"));
            let obj = JSON.parse(jsonObj);
            resolve(obj);
        } catch (error) {
            return resolve({});
        }
    });
}

// 暂停
export function downloadStatusCheck(message) {
    ipcRenderer.send("downloadStatusCheck", {
        messageId: message.id,
        delFlg: message.delFlg,
    });
}

const getFileName = (src) => {
    return _.last(src.split("/"));
};
