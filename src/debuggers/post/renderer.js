import { fs, ipcRenderer } from "@/platform";
import { getUploadUrl } from "@/api/imBase";

const POST_LOG_UPLOAD_CHANNEL = "debug:post:prepare-log-upload";
const POST_LOG_UPLOAD_CLEANUP_CHANNEL = "debug:post:cleanup-log-upload-temp";
const OSS = require("ali-oss");

const toHttpsUrl = (url = "") => {
  if (url.includes("http:")) return url.replace("http:", "https:");
  return url;
};

export const uploadPackagedLog = async ({ loginId, onProgress }) => {
  let prepareResult = null;
  try {
    prepareResult = await ipcRenderer.invoke(POST_LOG_UPLOAD_CHANNEL, { loginId });
    if (!prepareResult || !prepareResult.success || !prepareResult.filepath) {
      return {
        success: false,
        msg: (prepareResult && prepareResult.msg) || "prepare failed",
        filepath: "",
        password: "",
      };
    }

    const filename = String(prepareResult.filepath).split(/[\\/]/).pop() || "log.zip";
    const suffix = "zip";
    // 走 readFileSync：preload 同步版会把 Node Buffer 显式转 Uint8Array，
    // 异步 readFile 跨 contextIsolation 后 Buffer 原型链会丢失，无法用于 new File。
    const fileBuffer = fs.readFileSync(prepareResult.filepath);
    if (!fileBuffer) {
      return {
        success: false,
        msg: "read local file failed",
        filepath: "",
        password: prepareResult.password,
      };
    }
    const file = new File([fileBuffer], filename, { type: "application/zip" });

    const keyData = await getUploadUrl({
      attachType: 4,
      attachWorkspaceType: 1,
      fileSize: file.size,
      suffix,
    });
    if (!keyData || !keyData.fileId) {
      return {
        success: false,
        msg: "getUploadUrl failed",
        filepath: "",
        password: prepareResult.password,
      };
    }

    const ossData = window.ossData;
    if (!ossData || !ossData.securityToken) {
      return {
        success: false,
        msg: "missing oss token",
        filepath: "",
        password: prepareResult.password,
      };
    }

    const client = new OSS({
      region: ossData.ossEndpoint.split(".")[0],
      accessKeyId: ossData.accessKeyId,
      accessKeySecret: ossData.accessKeySecret,
      stsToken: ossData.securityToken,
      bucket: ossData.ossBucket,
    });

    const res = await client.multipartUpload(keyData.fileId, file, {
      progress: (p) => {
        if (onProgress) {
          const percent = Math.min(95, Math.round(p * 100));
          onProgress(percent);
        }
      },
      parallel: 4,
      partSize: 1024 * 512,
      timeout: 120000,
    });
    let url = (((res || {}).res || {}).requestUrls || [])[0] || "";
    if (url && url.lastIndexOf("?uploadId") !== -1) {
      url = url.slice(0, url.lastIndexOf("?uploadId"));
    }
    url = toHttpsUrl(url);

    if (!url) {
      return {
        success: false,
        msg: "upload failed",
        filepath: "",
        password: prepareResult.password,
      };
    }

    if (onProgress) onProgress(100);
    return {
      success: true,
      msg: "upload success",
      filepath: url,
      password: prepareResult.password,
      localFilepath: prepareResult.filepath,
    };
  } catch (error) {
    return {
      success: false,
      msg: (error && error.message) || "upload failed",
      filepath: "",
      password: (prepareResult && prepareResult.password) || "",
    };
  } finally {
    if (prepareResult && prepareResult.filepath) {
      ipcRenderer.invoke(POST_LOG_UPLOAD_CLEANUP_CHANNEL, {
        filepath: prepareResult.filepath,
      });
    }
  }
};
