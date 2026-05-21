// 加密文件头部预检（design.md §5.4，落 description #4）
// 检查项见 §5.4.2；本期 Avatar 不加密，但接口先成型供 Picture/Poster 复用。

import fs from 'fs';
import { ERROR_CODE } from '../core/constants';

// 明文图片 magic（design.md §5.4.2 第 4 条）
const PLAIN_MAGICS = [
    { name: 'PNG',  bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
    { name: 'JPEG', bytes: [0xFF, 0xD8, 0xFF] },
    { name: 'GIF87a', bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] },
    { name: 'GIF89a', bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] },
    { name: 'WEBP',  bytes: [0x52, 0x49, 0x46, 0x46], tail4: [0x57, 0x45, 0x42, 0x50] }, // "RIFF....WEBP"
    { name: 'TIFF-LE', bytes: [0x49, 0x49, 0x2A, 0x00] },
    { name: 'TIFF-BE', bytes: [0x4D, 0x4D, 0x00, 0x2A] },
    { name: 'BMP',  bytes: [0x42, 0x4D] },
    // HEIC: 'ftyp' 在偏移 4-7 处
    { name: 'HEIC', offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] },
];

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

const computeShannonEntropy = (buf) => {
    const n = buf.length;
    if (!n) return 0;
    const counts = new Uint32Array(256);
    for (let i = 0; i < n; i++) counts[buf[i]]++;
    let h = 0;
    for (let i = 0; i < 256; i++) {
        if (!counts[i]) continue;
        const p = counts[i] / n;
        h -= p * Math.log2(p);
    }
    return h;
};

/**
 * @param {string} workPath
 * @param {string|null} encryptKey  - 当前未使用；签名稳定供 §5.4.5 增强用
 * @param {{ maxHeadBytes?: number }} opts
 * @returns {Promise<{ ok: true, headBytes: Buffer } | { ok: false, reason: string, detail: object }>}
 */
export const verify = async (workPath, encryptKey, { maxHeadBytes = 32 } = {}) => {
    const stat = await fs.promises.stat(workPath);
    const fileSize = stat.size;

    // 1. fileSize >= 16
    if (fileSize < 16) {
        return { ok: false, reason: ERROR_CODE.TOO_SMALL, detail: { fileSize } };
    }
    // 2. fileSize >= 32
    if (fileSize < 32) {
        return { ok: false, reason: ERROR_CODE.SUSPICIOUS_SIZE, detail: { fileSize } };
    }
    // 3. AES block aligned
    if (fileSize % 16 !== 0) {
        return { ok: false, reason: ERROR_CODE.NOT_BLOCK_ALIGNED, detail: { fileSize } };
    }

    // 读前 maxHeadBytes 字节
    const fh = await fs.promises.open(workPath, 'r');
    const headBytes = Buffer.alloc(maxHeadBytes);
    try {
        await fh.read(headBytes, 0, maxHeadBytes, 0);
    } finally {
        await fh.close();
    }

    // 4. 明文 magic 命中
    for (const m of PLAIN_MAGICS) {
        if (matchMagic(headBytes, m)) {
            return {
                ok: false,
                reason: ERROR_CODE.PLAIN_TEXT,
                detail: { fileSize, magic: m.name, head: headBytes.slice(0, 16).toString('hex') },
            };
        }
    }

    // 5. 低熵 warn（不拒绝）
    const entropy = computeShannonEntropy(headBytes);
    if (entropy < 7.0) {
        console.warn(`[NativeImage headerCheck] low entropy ${entropy.toFixed(2)} for ${workPath}`);
    }

    return { ok: true, headBytes };
};
