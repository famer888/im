import { shell } from "electron";

/**
 * 打开文件
 */
export const openFile = (filePath, isDir) => {
    if (isDir) {
        shell.showItemInFolder(filePath);
    } else {
        shell.openPath(filePath);
    }

    let suffix = filePath.slice(filePath.lastIndexOf("."));
    return ![".jpg", ".png", ".gif", ".webp"].includes(suffix);
};
