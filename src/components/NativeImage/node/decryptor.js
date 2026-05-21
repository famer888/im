// 解密器（design.md §5.3）
//
// 当前实现：主进程内 Node `crypto` 直接解密，无 child_process 池。
// 选型理由（与 design.md §5.3 提示对齐）：
//   - 本期 Avatar 单文件普遍 < 200KB，单次 CPU 占用通常 < 50ms；
//   - 进程内同步解密 ≪ pool fork 冷启动 + IPC round-trip 成本；
//   - design.md §14 风险 #4 已经允许"性能不达标时切 NativeAesAdapter / WasmAesAdapter"，
//     当前实现满足 base 接口（DecryptAdapter，§12.5），未来切实现不动 base 流水线。
//
// 与发送侧（public/worker.js）的协议必须 1:1 对齐（design.md §5.4.1）：
//   - AES-128-ECB + PKCS7
//   - 16 字节 key = encryptKey 的前 16 字节 UTF-8（业务侧 fileKey 截断）
//   - 文件按 102416 字节切块；每块独立 PKCS7 padding。最后一块可短，但 16 对齐
//     （headerCheck §5.4.2 第 3 项已强制）。
//
// Avatar 缺省 encryptKey = process.env.VUE_APP_HEAD_AES_KEY ('f58c15f54e8f7826') —— 走完整
// header check + decrypt + commit；调用方传空串则在 index.js drivePipeline 内短路，根本进
// 不到这里。

import fs from 'fs';
import crypto from 'crypto';
import { allocWorkFile } from './paths';
import { ERROR_CODE } from '../core/constants';

/** 与 public/worker.js 一致：每 102416 字节为一个独立 PKCS7 加密块。 */
const BLOCK_SIZE = 102416;

/** 性能告警阈值（design.md §5.3 末段：> 500ms 提示考虑 native）。 */
const SLOW_THRESHOLD_MS = 500;

/**
 * 截取前 16 字节作为 AES-128 key，与发送端 `key.slice(0,16)` 对齐。
 * 注意 `String.prototype.slice` 是按 UTF-16 code unit 截，而 Buffer.from(...).slice 是按字节；
 * 现网 fileKey / VUE_APP_HEAD_AES_KEY 都是 ASCII，两者一致；这里走字节版本更稳健。
 */
const _deriveKey = (encryptKey) => {
    if (!encryptKey || typeof encryptKey !== 'string') {
        throw new Error('encryptKey is empty');
    }
    const buf = Buffer.from(encryptKey, 'utf8');
    if (buf.length < 16) {
        throw new Error(`encryptKey too short: ${buf.length} < 16 bytes`);
    }
    return buf.slice(0, 16);
};

/** 解密单个 16 对齐的密文块。 */
const _decryptBlock = (cipherBlock, key) => {
    const decipher = crypto.createDecipheriv('aes-128-ecb', key, null);
    decipher.setAutoPadding(true); // PKCS7（Node `aes-*-ecb` 默认）
    return Buffer.concat([decipher.update(cipherBlock), decipher.final()]);
};

/**
 * 默认实现（in-process AES-128-ECB + PKCS7，匹配 public/worker.js）。
 *
 * 接口形态保持 DecryptAdapter（design.md §12.5）：未来切 child_process / native
 * 时不需要改 index.js drivePipeline。
 *
 * @param {{
 *   inPath:     string,
 *   outPath?:   string,
 *   encryptKey: string,
 *   signal?:    { aborted?: boolean, _abortFn?: () => void },
 * }} params
 * @returns {Promise<{ outPath: string }>}
 *
 * 失败时统一抛 `{ code, detail, at }`：
 *   - ERROR_CODE.WORKER_FAILED  ：key 错 / padding 错 / 文件结构错
 *   - ERROR_CODE.ABORT          ：通过 signal 主动取消
 * 与 design.md §13.3 `decrypting → decryptError` 写入路径对应。
 */
export const decrypt = async ({ inPath, outPath, encryptKey, signal }) => {
    if (!outPath) outPath = allocWorkFile('decrypt', '.dec');

    const startedAt = Date.now();
    let aborted = !!(signal && signal.aborted);
    const onAbort = () => { aborted = true; };
    if (signal) signal._abortFn = onAbort;

    const failAbort = () => {
        const err = { code: ERROR_CODE.ABORT, detail: { stage: 'decrypt' }, at: Date.now() };
        throw err;
    };

    try {
        if (aborted) failAbort();

        const key = _deriveKey(encryptKey);

        // Avatar / 头像图片体积小，整体读入再批量解密：
        //   - 简化错误处理（任一 block PKCS7 失败 → throw，整体丢弃）
        //   - 减少多次 I/O 调度抖动
        // Picture/Poster 接入时若文件 > 几 MB，可在此处切 stream 实现，签名不变。
        const cipherBuf = await fs.promises.readFile(inPath);
        if (aborted) failAbort();

        // headerCheck 已经保证 fileSize >= 32 且 % 16 === 0；这里再防御一次，
        // 避免某条历史下载残骸在没有跑 headerCheck 的路径（未来扩展）混进来。
        if (cipherBuf.length === 0 || cipherBuf.length % 16 !== 0) {
            throw new Error(`cipher size ${cipherBuf.length} not 16-aligned`);
        }

        const parts = [];
        for (let offset = 0; offset < cipherBuf.length; offset += BLOCK_SIZE) {
            if (aborted) failAbort();
            const end = Math.min(offset + BLOCK_SIZE, cipherBuf.length);
            // public/worker.js 在文件大小恰好为 BLOCK_SIZE 整数倍时会多走一轮空 slice（CryptoJS
            // 对空输入返回空，无副作用）。Node crypto 对空输入会在 final() 抛 PKCS7 unpad 错；
            // 这里直接 break，与原 worker 语义一致。
            if (end === offset) break;
            const block = cipherBuf.slice(offset, end);
            if (block.length % 16 !== 0) {
                throw new Error(`block at offset ${offset} not 16-aligned (size=${block.length})`);
            }
            parts.push(_decryptBlock(block, key));
        }

        if (aborted) failAbort();

        const plain = Buffer.concat(parts);
        await fs.promises.writeFile(outPath, plain);

        const elapsed = Date.now() - startedAt;
        if (elapsed > SLOW_THRESHOLD_MS) {
            console.warn(
                `[NativeImage decryptor] slow decrypt ${elapsed}ms ` +
                `bytes=${cipherBuf.length} inPath=${inPath} ` +
                `(consider NativeAesAdapter, design.md §12.5)`
            );
        }

        return { outPath };
    } catch (err) {
        // 失败时清理产物，避免 .work/decrypt/ 残留半成品被后续 commit 误用
        try { fs.unlinkSync(outPath); } catch (_) {}

        // 已经是结构化错误（ABORT / 之前抛过的 code）的直接透传
        if (err && err.code === ERROR_CODE.ABORT) throw err;
        if (err && err.code === ERROR_CODE.WORKER_FAILED) throw err;

        // 其他都归类为 workerFailed（key 错 / padding 错 / I/O 异常）
        throw {
            code: ERROR_CODE.WORKER_FAILED,
            detail: { message: (err && err.message) || String(err) },
            at: Date.now(),
        };
    } finally {
        if (signal && signal._abortFn === onAbort) signal._abortFn = null;
    }
};

export default { decrypt };
