"use strict";

/**
 * 生成与 socket onMessage 一致的完整 WS 二进制帧（16 字节头 + AES-ECB 密文）。
 * 仅依赖项目内 proto（只读 ../api/base），不修改 debuggers 外部源码。
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const protobuf = require("protobufjs");

const PUSH_CMD = 20102;

function protoDir() {
  return path.join(__dirname, "..", "api", "base");
}

let rootCached = null;
function loadRoot() {
  if (rootCached) return rootCached;
  const dir = protoDir();
  const main = path.join(dir, "imweb-web.proto");
  const root = new protobuf.Root();
  root.loadSync(main);
  rootCached = root;
  return root;
}

/** 与 socket/api/request decrypt 侧一致：key.slice(0,16) 再 Utf8 → 16 字节 AES key */
function aesKey16FromString(keyUtf8) {
  const raw = Buffer.from(String(keyUtf8).slice(0, 16), "utf8");
  const key = Buffer.alloc(16);
  raw.copy(key, 0, 0, Math.min(16, raw.length));
  return key;
}

function aesEncryptPayload(plainBuf, keyUtf8) {
  const key = aesKey16FromString(keyUtf8);
  const c = crypto.createCipheriv("aes-128-ecb", key, null);
  c.setAutoPadding(true);
  return Buffer.concat([c.update(plainBuf), c.final()]);
}

function buildFrame(aesKeyUtf8, protobufPayloadBuf) {
  const signed = aesEncryptPayload(protobufPayloadBuf, aesKeyUtf8);
  const header = Buffer.alloc(16);
  header[0] = 1;
  header[1] = 0x80;
  header.writeUInt16BE(PUSH_CMD, 2);
  header.writeUInt32BE(signed.length, 4);
  header.writeBigUInt64BE(BigInt(PUSH_CMD), 8);
  return Buffer.concat([header, signed]);
}

function loadPeerIdsFile(filePath) {
  const abs = path.resolve(filePath);
  const raw = fs.readFileSync(abs, "utf8");
  const j = JSON.parse(raw || "{}");
  const ids = j.ids || j.IDS || j;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error("peerIds 文件须为 { ids: number[] } 或非空数字数组");
  }
  return ids.map((n) => Number(n)).filter((n) => !Number.isNaN(n));
}

function buildPushPayload(root, i, { sendUid, receiveUid, baseMsgId }) {
  const TextObj = root.lookupType("TextObj");
  const PushOneToOneMessageResp = root.lookupType("PushOneToOneMessageResp");
  const textBytes = TextObj.encode({
    content: `cannon-gen-${baseMsgId + i}`,
  }).finish();
  const sendTime = Date.now();
  return PushOneToOneMessageResp.encode({
    oneToOneMessage: {
      msgId: baseMsgId + i,
      sendUid,
      receiveUid,
      msgType: 0,
      content: Buffer.from(textBytes),
      sendTime,
      version: 0,
      contentMd5: "",
      sendUser: {
        uid: sendUid,
        nickName: `User${sendUid}`,
        identify: "cannon",
        createTime: sendTime,
        userType: 1,
      },
      links: [],
      source: 1,
    },
  }).finish();
}

/**
 * @param {object} opts
 * @param {number} opts.count
 * @param {string} opts.aesKeyUtf8
 * @param {number|string} [opts.sendUid] 与 peerIds 二选一
 * @param {number|string} opts.receiveUid
 * @param {number[]} [opts.peerIds] 优先；第 i 条用 peerIds[i % peerIds.length] 作为 sendUid
 * @param {number} [opts.baseMsgId]
 * @param {function(number):void} [opts.onProgress]
 */
function generateFramesB64(opts) {
  const root = loadRoot();
  const count = Math.max(0, parseInt(opts.count, 10) || 0);
  const peerIds = Array.isArray(opts.peerIds) ? opts.peerIds : [];
  const sendUidFixed = opts.sendUid != null && opts.sendUid !== "" ? Number(opts.sendUid) : NaN;
  const receiveUid = Number(opts.receiveUid);
  const baseMsgId = parseInt(opts.baseMsgId, 10) || 100000;
  const key = opts.aesKeyUtf8;
  const useRotate = peerIds.length > 0;
  if (!key || !receiveUid) {
    throw new Error("aesKey、receiveUid 为必填");
  }
  if (!useRotate && (!sendUidFixed || Number.isNaN(sendUidFixed))) {
    throw new Error("须提供 sendUid，或提供非空 peerIds 列表");
  }
  const framesB64 = new Array(count);
  for (let i = 0; i < count; i++) {
    const sendUid = useRotate ? peerIds[i % peerIds.length] : sendUidFixed;
    const payload = buildPushPayload(root, i, { sendUid, receiveUid, baseMsgId });
    const frame = buildFrame(key, Buffer.from(payload));
    framesB64[i] = frame.toString("base64");
    if (opts.onProgress && (i + 1) % 2000 === 0) {
      opts.onProgress(i + 1);
    }
  }
  return framesB64;
}

function defaultOutPath() {
  return path.join(__dirname, "fixtures", "cannon-ws-frames.generated.json");
}

function writeGeneratedFile(outPath, framesB64) {
  const body = JSON.stringify({
    version: 1,
    meta: {
      cmd: PUSH_CMD,
      count: framesB64.length,
      generatedAt: new Date().toISOString(),
    },
    framesB64,
  });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, body, "utf8");
}

function generateAndWriteFile(opts) {
  const outPath = opts.outPath || defaultOutPath();
  const framesB64 = generateFramesB64({
    count: opts.count,
    aesKeyUtf8: opts.aesKeyUtf8,
    sendUid: opts.sendUid,
    receiveUid: opts.receiveUid,
    peerIds: opts.peerIds,
    baseMsgId: opts.baseMsgId,
    onProgress: opts.onProgress,
  });
  writeGeneratedFile(outPath, framesB64);
  return { outPath, count: framesB64.length };
}

function parseArgs(argv) {
  const o = {
    count: 10000,
    baseMsgId: 100000,
    outPath: defaultOutPath(),
  };
  const a = argv.slice(2);
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    if (x === "--count") o.count = parseInt(a[++i], 10);
    else if (x === "--key") o.aesKeyUtf8 = a[++i];
    else if (x === "--sendUid") o.sendUid = a[++i];
    else if (x === "--receiveUid") o.receiveUid = a[++i];
    else if (x === "--peerIdsFile") o.peerIdsFile = a[++i];
    else if (x === "--baseMsgId") o.baseMsgId = parseInt(a[++i], 10);
    else if (x === "--out") o.outPath = a[++i];
    else if (x === "--help" || x === "-h") o.help = true;
  }
  if (!o.aesKeyUtf8 && process.env.CANNON_WS_GEN_KEY) {
    o.aesKeyUtf8 = process.env.CANNON_WS_GEN_KEY;
  }
  return o;
}

module.exports = {
  generateFramesB64,
  generateAndWriteFile,
  writeGeneratedFile,
  defaultOutPath,
  parseArgs,
  protoDir,
  loadPeerIdsFile,
};
