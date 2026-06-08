import { fs, clipboard, toFsPathFromDisplayUrl } from '@/platform';

const createImage = (options) => {
    options = options || {};
    const img = document.createElement("img");
    if (options.src) {
        img.src = options.src;
    }
    return img;
};

const blobToDataURL = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error('read blob failed'));
        reader.readAsDataURL(blob);
    });
};

const copyTextViaExecCommand = (text) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-999999px";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (!ok) {
        throw new Error("execCommand copy failed");
    }
};

const tryPreloadCopy = async (blob) => {
    if (blob.type === "text/plain" || blob.type.startsWith("text/")) {
        if (typeof clipboard.writeText !== "function") {
            throw new Error("clipboard.writeText unavailable");
        }
        clipboard.writeText(await blob.text());
        return;
    }
    if (blob.type.startsWith("image/")) {
        if (typeof clipboard.writeImage !== "function") {
            throw new Error("clipboard.writeImage unavailable");
        }
        clipboard.writeImage(await blobToDataURL(blob));
        return;
    }
    throw new Error(`unsupported blob type for preload copy: ${blob.type}`);
};

const tryNavigatorCopy = async (blob) => {
    if (!navigator.clipboard?.write) {
        throw new Error("navigator.clipboard.write unavailable");
    }
    await navigator.clipboard.write([
        // eslint-disable-next-line no-undef
        new ClipboardItem({
            [blob.type]: blob,
        }),
    ]);
};

const tryExecCommandCopy = async (blob) => {
    if (blob.type !== "text/plain" && !blob.type.startsWith("text/")) {
        throw new Error("execCommand only supports text");
    }
    copyTextViaExecCommand(await blob.text());
};

export const copyToClipboard = async (blob) => {
    const attempts = [
        () => tryPreloadCopy(blob),
        () => tryNavigatorCopy(blob),
        () => tryExecCommandCopy(blob),
    ];
    let lastError;
    for (const attempt of attempts) {
        try {
            await attempt();
            console.log("content copied");
            return;
        } catch (error) {
            lastError = error;
        }
    }
    console.error(lastError);
};

const convertToPng = (imgBlob) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const imageEl = createImage({ src: window.URL.createObjectURL(imgBlob) });
    imageEl.onload = (e) => {
        canvas.width = e.target.width;
        canvas.height = e.target.height;
        ctx.drawImage(e.target, 0, 0, e.target.width, e.target.height);
        canvas.toBlob(copyToClipboard, "image/png", 1);
    };
};

export const copyImg = async (src) => {
    // 本地 URL（local-resource:// / file:// / 原始磁盘路径）：fetch 在 CORS 模式下不允许非 http(s) scheme，
    // 全部走 Electron 原生剪贴板（主进程 nativeImage 读盘 → 写剪贴板，省一次 base64 IPC）。
    if (src && !/^https?:\/\//i.test(src)) {
        const fsPath = toFsPathFromDisplayUrl(src);
        const ok = clipboard.writeImageFromPath && clipboard.writeImageFromPath(fsPath);
        if (!ok) console.error("copyImg(local) failed:", fsPath);
        return;
    }

    const img = await fetch(src);
    const imgBlob = await img.blob();
    const extension = src.split(".").pop();
    const supportedToBeConverted = ["jpeg", "jpg", "gif"];
    if (supportedToBeConverted.includes(extension.toLowerCase())) {
        return convertToPng(imgBlob);
    } else if (extension.toLowerCase() === "png") {
        return copyToClipboard(imgBlob);
    }
    console.error("Format unsupported");
};

const readLocalImg = (url) => {
    return new Promise((resolve) => {
        fs.readFile(url, function (err, data) {
            if (err) {
                // console.log(err);
            } else {
                resolve("data:image/jpg;base64," + data.toString('base64'))
            }
        })
    })
}

export const copyText = (text) => {
    const blob = new Blob([text], { type: 'text/plain' })
    copyToClipboard(blob)
}
