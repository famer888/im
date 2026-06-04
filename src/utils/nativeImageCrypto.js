/**
 * NativeImage 协议纯函数（与 decryptor.js / headerCheck.js / public/worker.js 1:1）
 *
 * ─── 定位 ───────────────────────────────────────────────────────────────────
 * 共享的「magic 预检 + AES 解密」算法层，供 renderer 复用且**不** import NativeImage/node。
 *
 * 解密实现说明：
 *   - renderer（webpack target: web）下 Node `crypto.createDecipheriv('aes-128-ecb')` 不可用，
 *     会抛 `Cannot read property 'length' of null`；此处与 public/worker.js 一致走 CryptoJS。
 *   - CLI（scripts/lib/nativeImageDecrypt.mjs）仍用 Node crypto，与 main 进程 decryptor 对齐。
 *
 * 当前调用方：
 *   - src/event/gifDownloadPlaintext.js  → msgType 9 短期解密
 *
 * 协议：AES-128-ECB + PKCS7，key = encryptKey UTF-8 前 16 字节，102416 字节分块。
 */

import { _decrypt } from '@/api/base/index';

export const BLOCK_SIZE = 102416;
export const DEFAULT_ENCRYPT_KEY = process.env.VUE_APP_HEAD_AES_KEY || 'f58c15f54e8f7826';

const PLAIN_MAGICS = [
    { name: 'PNG', bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
    { name: 'JPEG', bytes: [0xFF, 0xD8, 0xFF] },
    { name: 'GIF87a', bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] },
    { name: 'GIF89a', bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] },
    { name: 'WEBP', bytes: [0x52, 0x49, 0x46, 0x46], tail4: [0x57, 0x45, 0x42, 0x50] },
    { name: 'TIFF-LE', bytes: [0x49, 0x49, 0x2A, 0x00] },
    { name: 'TIFF-BE', bytes: [0x4D, 0x4D, 0x00, 0x2A] },
    { name: 'BMP', bytes: [0x42, 0x4D] },
    { name: 'HEIC', offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] },
];

/** @returns {Uint8Array} */
export const toByteView = (input) => {
    if (input instanceof Uint8Array) return input;
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) {
        return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    }
    if (Array.isArray(input) || ArrayBuffer.isView(input)) {
        return new Uint8Array(input);
    }
    throw new Error('unsupported byte input');
};

const concatByteChunks = (list) => {
    const total = list.reduce((sum, item) => sum + item.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const item of list) {
        out.set(item, offset);
        offset += item.length;
    }
    return out;
};

const matchMagic = (buf, m) => {
    const off = m.offset || 0;
    if (buf.length < off + m.bytes.length) return false;
    for (let i = 0; i < m.bytes.length; i++) {
        if (buf[off + i] !== m.bytes[i]) return false;
    }
    if (m.tail4) {
        if (buf.length < 12) return false;
        for (let i = 0; i < 4; i++) {
            if (buf[8 + i] !== m.tail4[i]) return false;
        }
    }
    return true;
};

export const detectPlainMagic = (buf) => {
    const view = toByteView(buf);
    for (const m of PLAIN_MAGICS) {
        if (matchMagic(view, m)) return m.name;
    }
    return null;
};

/**
 * headerCheck.verify 等价
 * @returns {{ ok: true, plain?: boolean, magic?: string } | { ok: false, reason: string, detail: object }}
 */
export const verifyBuffer = (cipherBuf, { maxHeadBytes = 32 } = {}) => {
    const bytes = toByteView(cipherBuf);
    const fileSize = bytes.length;

    if (fileSize < 16) {
        return { ok: false, reason: 'tooSmall', detail: { fileSize } };
    }

    const headBytes = bytes.subarray(0, Math.min(maxHeadBytes, fileSize));
    const magic = detectPlainMagic(headBytes);
    if (magic) {
        return { ok: true, plain: true, magic, headBytes };
    }

    if (fileSize < 32) {
        return { ok: false, reason: 'suspiciousSize', detail: { fileSize } };
    }
    if (fileSize % 16 !== 0) {
        return { ok: false, reason: 'notBlockAligned', detail: { fileSize } };
    }

    return { ok: true, headBytes };
};

/**
 * 解密整文件（CryptoJS ECB，与 public/worker.js 分块循环一致）
 * @returns {Uint8Array}
 */
export const decryptBuffer = (cipherBuf, encryptKey) => {
    if (!encryptKey || typeof encryptKey !== 'string') {
        throw new Error('encryptKey is empty');
    }

    const bytes = toByteView(cipherBuf);
    if (bytes.length === 0 || bytes.length % 16 !== 0) {
        throw new Error(`cipher size ${bytes.length} not 16-aligned`);
    }

    const parts = [];
    for (let offset = 0; offset < bytes.length; offset += BLOCK_SIZE) {
        const end = Math.min(offset + BLOCK_SIZE, bytes.length);
        if (end === offset) break;
        const block = bytes.subarray(offset, end);
        if (block.length % 16 !== 0) {
            throw new Error(`block at offset ${offset} not 16-aligned (size=${block.length})`);
        }
        // _decrypt 与 worker.js 单块解密一致；key.slice(0,16) 在 api/base/index 内完成
        const plain = _decrypt(block, encryptKey);
        parts.push(plain instanceof Uint8Array ? plain : new Uint8Array(plain));
    }

    return concatByteChunks(parts);
};
