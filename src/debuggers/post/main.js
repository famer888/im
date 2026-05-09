import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { app, ipcMain } from "electron";
import { writeLog } from "@/utils/logger/process";

const archiver = require("archiver");
const zipEncrypted = require("archiver-zip-encrypted");

const CHANNEL_PREPARE_LOG_UPLOAD = "debug:post:prepare-log-upload";
const CHANNEL_CLEANUP_LOG_UPLOAD_TEMP = "debug:post:cleanup-log-upload-temp";

let isZipRegistered = false;

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const getUserDataRoot = () => {
  const current = app.getPath("userData");
  const baseName = path.basename(current);
  if (/^DATA_\d+$/i.test(baseName)) {
    return path.dirname(current);
  }
  return current;
};

const getInstanceTagByPath = (filePath, rootPath) => {
  const relative = path.relative(rootPath, filePath);
  const segments = relative.split(path.sep);
  const instance = segments.find((part) => /^DATA_\d+$/i.test(part));
  return instance || "DATA_0";
};

const walkFiles = (dirPath, files = []) => {
  if (!fs.existsSync(dirPath)) return files;
  const list = fs.readdirSync(dirPath, { withFileTypes: true });
  list.forEach((entry) => {
    const filePath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(filePath, files);
      return;
    }
    files.push(filePath);
  });
  return files;
};

const getUniqueFileName = (targetDir, filename) => {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let index = 0;
  let current = filename;
  while (fs.existsSync(path.join(targetDir, current))) {
    index += 1;
    current = `${base}-${index}${ext}`;
  }
  return current;
};

const removeDirRecursive = (dirPath) => {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  entries.forEach((entry) => {
    const currentPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      removeDirRecursive(currentPath);
      return;
    }
    fs.unlinkSync(currentPath);
  });
  fs.rmdirSync(dirPath);
};

const SCAN_LOG_DIR = "logs";
const SCAN_KEY_DIR = "Code Cache";

const isAccountConfigName = (name) => /-account-config\.json$/i.test(name);
const isFriendKeyName = (name) =>
  /-friend-keys-objs\.json$/i.test(name) || /-friend-key-objs\.json$/i.test(name);
const isChannelKeyName = (name) => /-channel-key-objs\.json$/i.test(name);
const isGroupKeyName = (name) => /-group-key-objs\.json$/i.test(name);

// 只扫每个实例下确实需要的目录，避免递归 IndexedDB / Cache / Local Storage 等无关大目录
const collectInstanceFiles = (instanceDir) => {
  const logsRoot = path.join(instanceDir, SCAN_LOG_DIR);
  const cacheRoot = path.join(instanceDir, SCAN_KEY_DIR);

  const logsFiles = walkFiles(logsRoot, []);
  const accountConfigFiles = [];
  const friendKeyFiles = [];
  const channelKeyFiles = [];
  const groupKeyFiles = [];

  if (fs.existsSync(cacheRoot)) {
    fs.readdirSync(cacheRoot, { withFileTypes: true }).forEach((entry) => {
      if (!entry.isFile()) return;
      const filePath = path.join(cacheRoot, entry.name);
      if (isAccountConfigName(entry.name)) {
        accountConfigFiles.push(filePath);
      } else if (isFriendKeyName(entry.name)) {
        friendKeyFiles.push(filePath);
      } else if (isChannelKeyName(entry.name)) {
        channelKeyFiles.push(filePath);
      } else if (isGroupKeyName(entry.name)) {
        groupKeyFiles.push(filePath);
      }
    });
  }

  return {
    logsFiles,
    accountConfigFiles,
    friendKeyFiles,
    channelKeyFiles,
    groupKeyFiles,
  };
};

const collectPatternFiles = (userDataPath) => {
  const aggregate = {
    logsFiles: [],
    accountConfigFiles: [],
    friendKeyFiles: [],
    channelKeyFiles: [],
    groupKeyFiles: [],
  };

  const accumulate = (collected) => {
    aggregate.logsFiles.push(...collected.logsFiles);
    aggregate.accountConfigFiles.push(...collected.accountConfigFiles);
    aggregate.friendKeyFiles.push(...collected.friendKeyFiles);
    aggregate.channelKeyFiles.push(...collected.channelKeyFiles);
    aggregate.groupKeyFiles.push(...collected.groupKeyFiles);
  };

  // 主实例（DATA_0，目录就是 userData 根）
  accumulate(collectInstanceFiles(userDataPath));

  // 其它实例：DATA_1 / DATA_2 / ...
  if (fs.existsSync(userDataPath)) {
    fs.readdirSync(userDataPath, { withFileTypes: true }).forEach((entry) => {
      if (!entry.isDirectory()) return;
      if (!/^DATA_\d+$/i.test(entry.name)) return;
      accumulate(collectInstanceFiles(path.join(userDataPath, entry.name)));
    });
  }

  return aggregate;
};

const formatNow = () => {
  const now = new Date();
  const pad = (num) => String(num).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(
    now.getHours()
  )}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
};

const getDateMd5Password = (dateKey = "") => {
  const input = String(dateKey || "").trim();
  if (!input) return "";
  return crypto.createHash("md5").update(input, "utf8").digest("hex").slice(0, 10);
};

const copyKeyFile = ({
  sourcePath,
  rootPath,
  tempDir,
  uidPattern,
  shortTag,
  collected,
}) => {
  const instanceTag = getInstanceTagByPath(sourcePath, rootPath);
  const fileName = path.basename(sourcePath);
  const uid = fileName.replace(uidPattern, "");
  const targetName = getUniqueFileName(tempDir, `${instanceTag}-${uid}-${shortTag}`);
  const targetPath = path.join(tempDir, targetName);
  fs.copyFileSync(sourcePath, targetPath);
  collected.push(targetPath);
};

const copyFilesToTemp = ({
  logsFiles,
  accountConfigFiles,
  friendKeyFiles,
  channelKeyFiles,
  groupKeyFiles,
  tempDir,
  rootPath,
}) => {
  const copiedLogs = [];
  const copiedConfigs = [];

  logsFiles.forEach((sourcePath) => {
    const instanceTag = getInstanceTagByPath(sourcePath, rootPath);
    const filename = getUniqueFileName(tempDir, `${instanceTag}-${path.basename(sourcePath)}`);
    const targetPath = path.join(tempDir, filename);
    fs.copyFileSync(sourcePath, targetPath);
    copiedLogs.push(targetPath);
  });

  accountConfigFiles.forEach((sourcePath) => {
    copyKeyFile({
      sourcePath,
      rootPath,
      tempDir,
      uidPattern: /-account-config\.json$/i,
      shortTag: "dc",
      collected: copiedConfigs,
    });
  });

  friendKeyFiles.forEach((sourcePath) => {
    copyKeyFile({
      sourcePath,
      rootPath,
      tempDir,
      // 兼容历史文件名（带 s / 不带 s）
      uidPattern: /-friend-keys?-objs\.json$/i,
      shortTag: "fnk",
      collected: copiedConfigs,
    });
  });

  channelKeyFiles.forEach((sourcePath) => {
    copyKeyFile({
      sourcePath,
      rootPath,
      tempDir,
      uidPattern: /-channel-key-objs\.json$/i,
      shortTag: "cnk",
      collected: copiedConfigs,
    });
  });

  groupKeyFiles.forEach((sourcePath) => {
    copyKeyFile({
      sourcePath,
      rootPath,
      tempDir,
      uidPattern: /-group-key-objs\.json$/i,
      shortTag: "gnk",
      collected: copiedConfigs,
    });
  });

  return { copiedLogs, copiedConfigs };
};

const createEncryptedZip = async ({ copiedLogs, copiedConfigs, tempDir, zipName, password }) => {
  if (!isZipRegistered) {
    archiver.registerFormat("zip-encrypted", zipEncrypted);
    isZipRegistered = true;
  }
  const zipPath = path.join(tempDir, zipName);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver.create("zip-encrypted", {
    zlib: { level: 9 },
    encryptionMethod: "aes256",
    password,
  });

  const done = new Promise((resolve, reject) => {
    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);
  });

  archive.pipe(output);

  copiedLogs.forEach((filePath) => {
    archive.file(filePath, { name: path.basename(filePath) });
  });
  copiedConfigs.forEach((filePath) => {
    archive.file(filePath, { name: path.basename(filePath) });
  });

  archive.finalize();
  await done;
  return zipPath;
};

const safeRemoveTempDir = (dirPath) => {
  try {
    removeDirRecursive(dirPath);
  } catch (_) {
    // 清理失败忽略，避免遮蔽真正的错误
  }
};

const prepareLogUploadPackage = async ({ loginId, passwordDateKey }) => {
  if (!loginId) {
    return {
      success: false,
      msg: "loginId is required",
      filepath: "",
      password: "",
    };
  }

  const userDataPath = getUserDataRoot();
  // 按需求：压缩密码改为“getUploadUrl 日期键（如 202601/30）的 md5”
  const password = getDateMd5Password(passwordDateKey);
  // 临时目录仍保持随机，避免同一天多次上传发生目录冲突
  const tempDir = path.join(os.tmpdir(), `post-log-upload-${crypto.randomBytes(8).toString("hex")}`);
  ensureDir(tempDir);

  try {
    const {
      logsFiles,
      accountConfigFiles,
      friendKeyFiles,
      channelKeyFiles,
      groupKeyFiles,
    } = collectPatternFiles(userDataPath);
    const { copiedLogs, copiedConfigs } = copyFilesToTemp({
      logsFiles,
      accountConfigFiles,
      friendKeyFiles,
      channelKeyFiles,
      groupKeyFiles,
      tempDir,
      rootPath: userDataPath,
    });

    if (!copiedLogs.length && !copiedConfigs.length) {
      // 文件没采集到也要回收已建出来的空临时目录
      safeRemoveTempDir(tempDir);
      return {
        success: false,
        msg: "logs/* and key files are not found",
        filepath: "",
        password: "",
      };
    }

    const zipName = `${loginId}-${formatNow()}.zip`;
    const zipPath = await createEncryptedZip({
      copiedLogs,
      copiedConfigs,
      tempDir,
      zipName,
      password,
    });

    return {
      success: true,
      msg: "package prepared",
      filepath: zipPath,
      password,
    };
  } catch (error) {
    // 拷贝/打包流程任一环节抛错都要回收临时目录，否则 renderer 的 finally 因没有 filepath 而漏清理
    safeRemoveTempDir(tempDir);
    throw error;
  }
};

export const initPostLogUploadIpc = () => {
  ipcMain.handle(CHANNEL_PREPARE_LOG_UPLOAD, async (event, payload = {}) => {
    try {
      return await prepareLogUploadPackage({
        loginId: payload.loginId,
        passwordDateKey: payload.passwordDateKey,
      });
    } catch (error) {
      writeLog("app", "error", "[post-log-upload] prepare failed", {
        message: error && error.message ? error.message : String(error),
      });
      return {
        success: false,
        msg: (error && error.message) || "prepare failed",
        filepath: "",
        password: "",
      };
    }
  });

  ipcMain.handle(CHANNEL_CLEANUP_LOG_UPLOAD_TEMP, (event, payload = {}) => {
    try {
      const filepath = payload.filepath || "";
      if (!filepath) return { success: false, msg: "filepath is required" };
      const tempDir = path.dirname(filepath);
      const osTemp = path.resolve(os.tmpdir());
      const resolvedTempDir = path.resolve(tempDir);
      // 必须严格落在 os.tmpdir() 的子路径里，避免 startsWith 前缀绕过（/tmp 命中 /tmpfoo）
      // 同时禁止把 os.tmpdir() 自身整个删掉
      if (
        resolvedTempDir === osTemp ||
        !resolvedTempDir.startsWith(osTemp + path.sep)
      ) {
        return { success: false, msg: "invalid temp path" };
      }
      removeDirRecursive(resolvedTempDir);
      return { success: true };
    } catch (error) {
      writeLog("app", "warn", "[post-log-upload] cleanup temp failed", {
        message: error && error.message ? error.message : String(error),
      });
      return { success: false, msg: (error && error.message) || "cleanup failed" };
    }
  });
};

export const postLogUploadChannel = CHANNEL_PREPARE_LOG_UPLOAD;
export const postLogUploadCleanupChannel = CHANNEL_CLEANUP_LOG_UPLOAD_TEMP;
