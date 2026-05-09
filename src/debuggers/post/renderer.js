import { fs, ipcRenderer } from "@/platform";
import { getUploadUrl } from "@/api/imBase";

const POST_LOG_UPLOAD_CHANNEL = "debug:post:prepare-log-upload";
const POST_LOG_UPLOAD_CLEANUP_CHANNEL = "debug:post:cleanup-log-upload-temp";
const OSS = require("ali-oss");

const toHttpsUrl = (url = "") => {
  if (url.includes("http:")) return url.replace("http:", "https:");
  return url;
};

const stripProtocol = (url = "") => String(url).replace(/^https?:\/\//i, "");

const buildLogTextPath = ({ uploadUrl = "", uploadKey = "" }) => {
  const plainUrl = stripProtocol(uploadUrl).split("?")[0];
  const slashIndex = plainUrl.indexOf("/");
  const host = slashIndex === -1 ? plainUrl : plainUrl.slice(0, slashIndex);
  const urlPath = slashIndex === -1 ? "" : plainUrl.slice(slashIndex + 1);
  const uid = location.href.match(/\d+$/g) ? `?${location.href.match(/\d+$/g)[0]}` : '';
  const keyPath = String(uploadKey || urlPath)
    .replace(/^\/+/, "")
    .replace(/^(test\/)?common\/log\//, "");
  return `logs:${host}/test-${keyPath}${uid}`;
};

const extractDateKeyFromUploadKey = (uploadKey = "") => {
  const keyText = String(uploadKey || "");
  const match = keyText.match(/(\d{6}\/\d{2})/);
  if (match) return match[1];

  const rawFilename = keyText.split("/").pop() || "";
  return rawFilename.replace(/\.[^/.]+$/, "");
};

export const uploadPackagedLog = async ({ loginId, onProgress }) => {
  let prepareResult = null;
  try {
    const suffix = "zip";
    const bootstrapKeyData = await getUploadUrl({
      attachType: 4,
      attachWorkspaceType: 0,
      fileSize: 0,
      suffix,
    });
    if (!bootstrapKeyData || !bootstrapKeyData.fileId) {
      return {
        success: false,
        msg: "getUploadUrl failed",
        filepath: "",
      };
    }

    const passwordDateKey = extractDateKeyFromUploadKey(bootstrapKeyData.fileId);

    prepareResult = await ipcRenderer.invoke(POST_LOG_UPLOAD_CHANNEL, {
      loginId,
      passwordDateKey,
    });
    if (!prepareResult || !prepareResult.success || !prepareResult.filepath) {
      return {
        success: false,
        msg: (prepareResult && prepareResult.msg) || "prepare failed",
        filepath: "",
      };
    }

    const filename = String(prepareResult.filepath).split(/[\\/]/).pop() || "log.zip";
    // 走 readFileSync：preload 同步版会把 Node Buffer 显式转 Uint8Array，
    // 异步 readFile 跨 contextIsolation 后 Buffer 原型链会丢失，无法用于 new File。
    const fileBuffer = fs.readFileSync(prepareResult.filepath);
    if (!fileBuffer) {
      return {
        success: false,
        msg: "read local file failed",
        filepath: "",
      };
    }
    const file = new File([fileBuffer], filename, { type: "application/zip" });

    const keyData = await getUploadUrl({
      attachType: 4,
      attachWorkspaceType: 0,
      fileSize: file.size,
      suffix,
    });
    if (!keyData || !keyData.fileId) {
      return {
        success: false,
        msg: "getUploadUrl failed",
        filepath: "",
      };
    }

    const ossData = window.ossData;
    if (!ossData || !ossData.securityToken) {
      return {
        success: false,
        msg: "missing oss token",
        filepath: "",
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
      };
    }
    const logTextPath = buildLogTextPath({
      uploadUrl: url,
      uploadKey: keyData.fileId,
    });

    if (onProgress) onProgress(100);
    return {
      success: true,
      msg: "upload success",
      filepath: logTextPath,
      localFilepath: prepareResult.filepath,
    };
  } catch (error) {
    return {
      success: false,
      msg: (error && error.message) || "upload failed",
      filepath: "",
    };
  } finally {
    if (prepareResult && prepareResult.filepath) {
      ipcRenderer.invoke(POST_LOG_UPLOAD_CLEANUP_CHANNEL, {
        filepath: prepareResult.filepath,
      });
    }
  }
};
