/**
 * msgType 9（enumMsgType.gif）下载落盘后的 magic 预检与密钥候选。
 *
 * 解密本身走 public/worker.js（与 msgType 1 等一致，不阻塞 renderer 主线程）。
 * 迁移 NativeImage Picture 派生后本文件可删（design.md §3.3 / §10.1）。
 */
import {
    verifyBuffer,
    detectPlainMagic,
    DEFAULT_ENCRYPT_KEY,
    toByteView,
} from '@/utils/nativeImageCrypto';

/** 去重、保序：E2EE fileKey → VUE_APP_HEAD_AES_KEY */
export const buildGifDecryptKeyCandidates = (fileKey) => {
    const keys = [];
    const push = (k) => {
        if (k && typeof k === 'string' && !keys.includes(k)) keys.push(k);
    };
    push(fileKey);
    push(DEFAULT_ENCRYPT_KEY);
    return keys;
};

/**
 * magic 预检：判断明文直出 or 需要 Worker 解密。
 *
 * @returns {{ ok: true, plain: true, buffer: Uint8Array, magic: string }
 *         | { ok: true, plain: false, buffer: Uint8Array, decryptKeys: string[] }
 *         | { ok: false, reason: string, detail?: object }}
 */
export const inspectGifDownload = (fileData, { fileKey } = {}) => {
    const buf = toByteView(fileData);
    const verify = verifyBuffer(buf);

    if (!verify.ok) {
        return { ok: false, reason: verify.reason, detail: verify.detail };
    }

    if (verify.plain) {
        return { ok: true, plain: true, buffer: buf, magic: verify.magic };
    }

    return {
        ok: true,
        plain: false,
        buffer: buf,
        decryptKeys: buildGifDecryptKeyCandidates(fileKey),
    };
};

/** Worker 解密结果是否像合法图片（与 NativeImage headerCheck magic 一致） */
export const isValidImagePlaintext = (plainBytes) => {
    if (!plainBytes || !plainBytes.length) return null;
    return detectPlainMagic(toByteView(plainBytes).subarray(0, 32));
};
