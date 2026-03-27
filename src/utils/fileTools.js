import fs from "fs";
const mime = require("mime-types");
const path = require("path");
const https = require('https');

import { ipcRenderer } from "@/platform";

export const isNetworkImageUrl = (imageUrl) => {
    if(!imageUrl) return false
    // 使用正则表达式检查URL是否以http://、https://或ftp://开头（可选）
    const networkProtocolPattern = /^(https?:\/\/|ftp:\/\/)/;
    return networkProtocolPattern.test(imageUrl);
}

export const downloadImageToLocal = async (imageUrl, savePath) => {
      return new Promise((resolve, reject) => {
          const { hostname, pathname } = new URL(imageUrl);
          https.get({ hostname, path: pathname }, (res) => {
            // 检查响应状态码
            if (res.statusCode !== 200) {
              return reject(new Error(`Failed to download image: ${res.statusCode}`));
            }
     
            // 创建写入流
            const fileStream = fs.createWriteStream(savePath);
     
            // 处理响应数据
            res.pipe(fileStream);
     
            // 监听写入完成事件
            fileStream.on('finish', () => resolve(savePath));
     
            // 监听错误事件
            fileStream.on('error', (err) => reject(err));
          }).on('error', (err) => reject(err));
        });
}

export const exportBase64ImgToLocal = (base64Image, path) => {
    return new Promise((resolve, reject) => {
        try {
            // 移除Base64字符串的数据说明部分
            let base64Data = base64Image.replace(
                /^data:image\/\w+;base64,/,
                ""
            );
            // 解码Base64字符串
            let buffer = Buffer.from(base64Data, "base64");
            fs.writeFile(path, buffer, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        } catch (error) {
            reject(error);
        }
    });
};

//用户选择保存路径
export const userSelectSavePath = (fileName, options) => {
    return new Promise((resolve, reject) => {
        try {
            let key = Date.now();
            ipcRenderer.send("select-dir", {
                fileName,
                key,
                ...options,
            });
            const callback = (e, args) => {
                resolve(args);
            };
            ipcRenderer.removeListener("select-dir-callback", callback);
            ipcRenderer.on("select-dir-callback", callback);
        } catch (err) {
            reject(err);
        }
    });
};

// 检查文件夹路径是否存在，不存在则创建
export const checkDirectory = (dirPath) => {
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

//同步 检查文件夹路径是否存在，不存在则创建
export const checkDirectorySync = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

/*
 * 截取视频的第一帧
 */
export const getVideoPreview = (file) => {
    return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        // 为视频添加加载完成的监听器
        video.addEventListener("loadeddata", () => {
            // 将视频的宽度和高度设置为canvas的宽度和高度
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // 在canvas上绘制视频的第一帧
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // 将canvas转换为base64编码的图像数据
            const preview = canvas.toDataURL();

            // 释放资源
            video.pause();
            video.src = "";

            // 返回预览图
            resolve(preview);
        });

        // 为视频添加错误监听器
        video.addEventListener("error", () => {
            // 释放资源
            video.pause();
            video.src = "";

            // 返回错误
            reject(new Error("Failed to load video"));
        });

        // 加载视频文件
        video.src = URL.createObjectURL(file);

        // 开始播放视频（自动触发loadeddata事件）
        video.play();
    });
};

export const base64ToFile = (base64, fileName, type) => {
    let base = base64.split(",")[1];
    const byteCharacters = atob(base);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: "application/octet-stream" });

    if (type) {
        return new File([blob], fileName, {
            type,
        });
    }
    return new File([blob], fileName);
};

export const fileToBuffer = (file) => {
    return new Promise((reject) => {
        let blob = new Blob([file], { type: "text/plain;charset=utf-8" });
        let reader = new FileReader();
        reader.onload = function (result) {
            reject(result.target.result);
        };
        reader.readAsArrayBuffer(blob);
    });
};

export const bufferToFile = (
    buffer,
    name,
    options = { type: "application/octet-stream" }
) => {
    const blob = new Blob([buffer], options);
    const file = new File([blob], name, options);
    return file;
};

/**
 * 文件保存到指定路径，如果该路径有同名文件，则创建独立文件夹进行保存
 */
export const saveFileToDirectory = (file, directory, fileName) => {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();
            reader.onload = function (event) {
                // 获取文件内容
                const content = event.target.result;

                // 将文件内容转换为Buffer对象
                const data = Buffer.from(content);

                // 构建完整的文件路径（须用 join，避免 directory 无尾部分隔符时与 fileName 粘连，或混用 / 与 \）
                let filePath = path.join(directory, fileName);

                // 检查目录是否存在，如果不存在则创建目录
                if (!fs.existsSync(directory)) {
                    fs.mkdirSync(directory, { recursive: true });
                } else if (fs.existsSync(filePath)) {
                    // 新的文件夹路径
                    const directoryNew = path.join(
                        directory,
                        `${fileName.slice(0, fileName.lastIndexOf("."))}-${Math.floor(
                            1000000000 + Math.random() * 9000000000
                        )}`
                    );

                    // 如果有相同的文件存在，则创建独立文件夹
                    fs.mkdirSync(directoryNew, { recursive: true });

                    // 修改文件的保存路径
                    filePath = path.join(directoryNew, fileName);
                }

                fs.writeFileSync(filePath, data); // 写入文件
                resolve(filePath);
            };
            reader.readAsArrayBuffer(file); // 读取文件内容
        } catch (err) {
            reject(err);
        }
    });
};

export const getImageDimensions = (file) => {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();

            reader.onload = function (e) {
                const img = new Image();
                img.src = e.target.result;

                img.onload = function () {
                    const width = img.width;
                    const height = img.height;

                    resolve({ width, height });
                };
            };

            reader.onerror = function (error) {
                resolve({ width: 0, height: 0 });
            };

            reader.readAsDataURL(file);
        } catch {
            resolve({ width: 0, height: 0 });
        }
    });
};

export const getFileInfo = (filePath) => {
    const data = fs.readFileSync(filePath);

    // 获取 MIME 类型
    const mimeType = mime.lookup(filePath);

    return new File([data], path.basename(filePath), {
        type: mimeType,
    });
};


export function checkImageLoad(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = function() {
            resolve(true); // 图片加载成功
        };
        
        img.onerror = function() {
            resolve(false); // 图片加载失败
        };
        
        img.src = url;
    });
}