/**
 * Cannon：本地 WS 二进制回放（与 socket onMessage 的 event.data 一致）。
 * 每一帧：前 16 字节包头 + 加密载荷；入口内会先 decrypt，再 protobuf decode。
 *
 * 捕获方式示例：在 src/socket/index.js 的 onMessage 里临时
 *   console.log(btoa(String.fromCharCode(...new Uint8Array(event.data))));
 * 将输出贴到下方（或用 DevTools 对二进制帧做 Base64）。
 *
 * 批量生成（调试面板按钮或命令行）会写入与本文件同目录的
 * cannon-ws-frames.generated.json，运行时自动合并进回放列表。
 * CLI：node src/debuggers/cannon-generate-ws-frames.cjs --help
 */
export const CANNON_WS_FRAMES_B64 = [
  // 'YOUR_BASE64_OF_FULL_FRAME_HERE',
];

const CANNON_GENERATED_FILE = "cannon-ws-frames.generated.json";
let cached = null;

const readGeneratedFrames = () => {
  try {
    const req = window.require || null;
    if (!req) return [];
    const fs = req("fs");
    const path = req("path");
    const filePath = path.join(
      process.cwd(),
      "src",
      "debuggers",
      "fixtures",
      CANNON_GENERATED_FILE
    );
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(raw || "{}");
    return Array.isArray(json.framesB64) ? json.framesB64 : [];
  } catch (error) {
    console.warn("[Cannon] 读取本地生成帧失败", error);
    return [];
  }
};

export function getCannonWsFrameArrayBuffers() {
  if (cached) return cached;
  const list = [
    ...CANNON_WS_FRAMES_B64,
    ...readGeneratedFrames(),
  ].filter((s) => typeof s === "string" && s.length > 0);
  cached = list.map((b64) => {
    const binary = atob(b64);
    const buf = new ArrayBuffer(binary.length);
    const v = new Uint8Array(buf);
    for (let i = 0; i < binary.length; i++) {
      v[i] = binary.charCodeAt(i);
    }
    return buf;
  });
  return cached;
}

export function refreshCannonWsFramesCache() {
  cached = null;
}

