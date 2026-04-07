const fs = require("fs");
const nodePath = require("path");
import { getCachDirectory } from "@/utils/tools";
import { Local } from "@/utils";
import { ipcRenderer } from "@/platform";
import { autoImportCache } from "@/platformHelper";

const checkDirectory = (dirPath) => {
    return new Promise((resolve) => {
        if (!fs.existsSync(dirPath)) {
            fs.mkdir(dirPath, { recursive: true }, () => {
                resolve();
            });
        } else {
            resolve();
        }
    });
};

export const cacheDB = async (uid) => {
    let myWorker = new Worker("worker/cacheDB.js");
    let dbName = `${uid}-97-2.0.3`;
    const { path, key, directoryPath } = await getCachPar(uid);
    await checkDirectory(directoryPath);
    myWorker.postMessage({ dbName, params: { uid }, key, savePath: path });
    myWorker.onmessage = (e) => {
        setExportInfo(uid);
        ipcRenderer.send("cache-success", {});
        myWorker.terminate();
    };
};

const setExportInfo = async (uid) => {
    let data = {
        exportTime: new Date().getTime(),
    };
    let directoryPath = await getCachDirectory({
        UserID: uid,
    });
    let path = nodePath.join(directoryPath, "/temporarydata.txt");
    await checkDirectory(directoryPath);
    fs.writeFile(path, JSON.stringify(data), (err) => {});
    Local(`exportTime-${uid}`, new Date().getTime());
};

const getExportInfo = async (uid) => {
    return new Promise(async (resolve) => {
        try {
            const directoryPath = await getCachDirectory({
                UserID: uid,
            });
            if(!directoryPath) return resolve({});
            const path = nodePath.join(directoryPath, "/temporarydata.txt");
            // path地址为
            // C:\Users\admin\AppData\Local\Temp\97LocalStorage\user-665497\temporarydata.txt
            // temporarydata.txt 文件内容格式：{"exportTime":1736408227677}
            // console.log(path, 533333333)
            fs.readFile(path, "utf8", (err, data) => {
                if (err) {
                    return resolve({});
                }
                if (data) {
                    const par = JSON.parse(data);
                    resolve(par);
                } else {
                    resolve({});
                }
            });
        } catch (e) {
            resolve({});
        }
    });
};

const getCachPar = async (uid) => {
    let directoryPath = await getCachDirectory({
        UserID: uid,
    });

    let path = nodePath.join(directoryPath, "/abc");
    let key = `9754`;
    return { path, key, directoryPath };
};

export const importDB = async (uid, noImport) => {
    const { path, key } = await getCachPar(uid);
    // console.log({ noImport, path });
    if (noImport) {
        Local(`exportTime-${uid}`, 0);

        // 清掉旧数据
        try {
            const directoryPath = await getCachDirectory({
                UserID: uid,
            });
            if(!directoryPath) return;
            const path = nodePath.join(directoryPath, "/temporarydata.txt");
            fs.unlink(path, (err) => {
                if (err) throw err;
                console.log("文件已删除", path);
            });
        } catch (err) {
            //
        }

        return;
    }


    const exportInfo = await getExportInfo(uid);
    let exportTime = exportInfo.exportTime || 0;
    let exportTimeStore = Local(`exportTime-${uid}`) || 0;

    //检查文件是否存在
    fs.access(path, fs.constants.F_OK, (err) => {
        if (err) {
            console.warn("文件不存在");
            return;
        }
        if (exportTime > exportTimeStore || !exportTimeStore) {
            Local(`exportTime-${uid}`, new Date().getTime());
            autoImportCache(path, key);
        }
    });
};
