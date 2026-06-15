// 解密器（design.md §5.3）
//
// ─── 当前实现：主进程内 Node `crypto` 同步解密 ─────────────────────────────
// `fs.promises.readFile` → 同步 `_decryptBlock` × N → `Buffer.concat` →
// `fs.promises.writeFile`。无 worker、无流式、无并发限流。
//
// 适用场景：现网 Avatar 单文件 <200KB，单次 CPU ~4ms，主线程阻塞可忽略；
// 配合 §5.7 in-flight 合并，同屏 30–50 张头像的初次加载用户感知不到。
//
// ─── 已知不足（[TODO] 后续实现，当前未在本 PR 范围） ──────────────────────
// 1. 大文件 OOM：`readFile` 把整文件读进 V8 Buffer，加上 `Buffer.concat` 再
//    分配一份 plain。1GB 视频瞬时占用 2–3GB 堆，必超 Electron 默认
//    `max-old-space-size`（~2GB）抛 `Cannot create a Buffer larger than ...`。
// 2. 同步阻塞 main loop：Avatar 单张 ~7ms（4ms AES + 2ms concat + 1ms cipher
//    构造），100 并发可累计 ~700ms 冻结，期间 IPC handler / `native-image://`
//    protocol / 其他窗口全部排队。当前未观察到是因为 concurrency.schedule 按
//    (kind, id) 串行已经天然限了同一头像的多次触发，且现网头像普遍 <50KB；
//    一旦业务侧出现"100 张 + 单张偶发偏大"组合，立即放大。
//    [缓解] 解块循环已加 `await yieldToLoop()`（setImmediate），每块解完让出
//    一拍 event loop，IPC / protocol callback 可见即时插入；这只是把"独占"
//    变"可让出"，不省 CPU、不真并行，根治仍要靠 worker_threads 池。
// 3. 无 scheduleWithLimit：concurrency.js 当前只串行同 (kind, id)，不同 id
//    完全并行，瞬时高并发场景下 #2 会放大且无任何节流。
//
// ─── 计划升级方向：worker_threads 池（非 child_process） ──────────────────
// 经横向评估，worker_threads 在所有维度均优于 child_process，故弃 fork 路线：
//
//   维度          | worker_threads     | child_process.fork
//   ------------- | ------------------ | -------------------
//   启动税        | ~5–10ms            | ~80–200ms（首张延迟一个量级）
//   单实例内存    | ~5–10MB heap       | ~30MB RSS（满进程）
//   buffer 通信   | 零拷贝 transferable | structured clone 序列化
//   API 依赖      | Node 12+ 标准      | Node 12+ 标准
//   实现复杂度    | 中                 | 中（IPC + 进程生命周期）
//   崩溃隔离      | 同进程，无          | 子进程 crash 不拖垮 main
//
// 唯一短板（崩溃隔离）对纯 JS `crypto.createDecipheriv` 价值为零 —— AES 解密
// 不会 segfault，子进程级隔离换 fork 启动税不划算。design.md §5.3 历史上写的
// "child_process 池" 是从旧 `public/worker.js`（Web Worker 模型）直译过来的
// 次优选型，本次结合"100×2MB 视频/Picture 场景"重审已订正。
//
// 计划实现形态（不在本 PR 范围；接 Picture/Poster 时一起做）：
//   * node/decryptor.worker.js：streaming pipeline
//     (createReadStream → AES Transform → createWriteStream)，入参只传文件
//     路径，worker 内部 readFile / writeFile，主进程内存零增长，1GB 文件
//     峰值 ~2–4MB
//   * 本文件改为薄 WorkerPool 包装：lazy spawn / idle 30s 超时回收 / max=4
//     （核数上限），保持 `decrypt({ inPath, outPath, encryptKey, signal })`
//     签名 1:1 不变，drivePipeline 不感知
//   * concurrency.js 补全 `scheduleWithLimit`（[预留] 已占位），按 kind 配
//     全局上限：avatar 8 / picture 4 / poster 2
//
// ─── 为什么 Avatar 也要上 worker（虽然当前无瓶颈） ────────────────────────
// 防御性 + 顺路：
//   - 消除"100 张 + 单张偶发偏大"等边缘 case 下 main loop 几百 ms 冻结的
//     可能；现在没观察到不代表不会发生（业务历史 OSS 上的老群头像出现过
//     >1MB 的样本）
//   - 接 Picture/Poster 时本来就要做 worker pool，Avatar 顺路接入零额外
//     代码成本，避免 base 流水线里"avatar 走 inline / picture 走 worker"
//     两套分支
//   - 用户预期：聊天软件主窗口任何时刻都应即时响应，解密 50KB 头像哪怕
//     只占 main loop 4ms 也不应发生
//
// ─── 与发送侧（public/worker.js）协议必须 1:1 对齐（design.md §5.4.1） ────
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

/** 与 public/worker.js 一致：每块明文 102400 字节 → 密文 102416 字节（含 16 字节 PKCS7 整填充块）。 */
const PLAIN_CHUNK = 102400;
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

/** ECB 解密但不去填充（用于探测加密方案）。 */
const _decryptBlockNoPad = (cipherBlock, key) => {
    const decipher = crypto.createDecipheriv('aes-128-ecb', key, null);
    decipher.setAutoPadding(false);
    return Buffer.concat([decipher.update(cipherBlock), decipher.final()]);
};

/**
 * 判定是否为 PC 端「102400 明文分块 + 逐块 PKCS7」加密方案。
 *   - PC 分块：第 0 块 = encrypt(102400 明文 + 16 字节 0x10 填充块)，
 *     故密文 [102400,102416) 这一块（ECB 独立）解密(不去填充)应为 16 个 0x10。
 *   - 安卓/整文件：该位置是真实图像数据，几乎不可能恰为 16 个 0x10。
 *   - 体积 <= BLOCK_SIZE 时两种方案等价（单块），统一整文件解密，无需区分。
 * 与 public/worker.js 的 isPcChunkedScheme 一致。
 */
const isPcChunkedScheme = (cipherBuf, key) => {
    if (cipherBuf.length <= BLOCK_SIZE) return false;
    try {
        const padCipher = cipherBuf.slice(PLAIN_CHUNK, BLOCK_SIZE);
        const padPlain = _decryptBlockNoPad(padCipher, key);
        if (!padPlain || padPlain.length < 16) return false;
        for (let i = 0; i < 16; i++) {
            if (padPlain[i] !== 0x10) return false;
        }
        return true;
    } catch (_e) {
        return false;
    }
};

/**
 * 把当前同步执行栈切回 event loop 跑一拍。
 *
 * 用途见下方 decrypt() 主循环：每解完一块 AES 让出 main thread，
 * 避免多张 Avatar / 偶发大文件场景下连续 _decryptBlock 把 IPC handler /
 * `native-image://` protocol / 渲染进程帧投递排队几十～几百 ms。
 *
 * 用 setImmediate 而非 Promise.resolve()/queueMicrotask：后者是微任务，
 * 解析完会立刻在同一 tick 继续跑，根本没让出；setImmediate 排在 I/O / timer
 * 之后的 check 阶段，能保证一拍内 pending IPC / fs callback 先跑完。
 *
 * 单次开销 ~0.1–0.3ms，远低于一块 AES 的 ~4ms，加 yield 后单张 Avatar 总耗时
 * 上限 +几 ms 但 main loop 不再被独占；属于"让性能不变差到能感知，但抢回可
 * 中断性"的便宜方案。worker_threads 池上线后此函数与 yield 点一并移除。
 */
const yieldToLoop = () => new Promise((r) => setImmediate(r));

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

        // 探测加密方案：PC 分块（102416 密文块逐块去填充）vs 安卓整文件（单次 ECB/PKCS7）。
        // 安卓大头像若按 PC 分块去填充会在每个块边界剥掉真实数据 → 错位花屏/解密失败。
        const chunked = isPcChunkedScheme(cipherBuf, key);

        const parts = [];
        if (chunked) {
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
                // 让出 main loop：见 yieldToLoop 注释。yield 后立刻补 abort 检查，
                // 避免 setImmediate 这一拍里 onAbort 被触发但本轮还多解一块的窗口。
                await yieldToLoop();
                if (aborted) failAbort();
            }
        } else {
            // 安卓 / 整文件方案：整体单次 ECB/PKCS7 解密（修复大图分块去填充导致的错位花屏）
            parts.push(_decryptBlock(cipherBuf, key));
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
