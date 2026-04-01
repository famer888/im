"use strict";

const path = require("path");
const {
  generateAndWriteFile,
  parseArgs,
  defaultOutPath,
  loadPeerIdsFile,
} = require("./cannonWsFramesGeneratorCore.cjs");

function printHelp() {
  console.log(`Usage:
node src/debuggers/cannon-generate-ws-frames.cjs --count 10000 --key <AES_KEY> --receiveUid <loginId> (--sendUid <uid> | --peerIdsFile <path.json>)
  path.json: { "ids": [808658, 738341, ...] }

Examples:
node src/debuggers/cannon-generate-ws-frames.cjs --count 10000 --key 1234567890abcdef --sendUid 10001 --receiveUid 572083
node src/debuggers/cannon-generate-ws-frames.cjs --count 5000 --key xxx --receiveUid 572083 --peerIdsFile ./peer-ids.json --out ${defaultOutPath()}
`);
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  let peerIds;
  if (args.peerIdsFile) {
    peerIds = loadPeerIdsFile(args.peerIdsFile);
  }
  if (!args.aesKeyUtf8 || !args.receiveUid) {
    printHelp();
    throw new Error("缺少必填参数：--key --receiveUid（以及 --sendUid 或 --peerIdsFile）");
  }
  if (!peerIds && !args.sendUid) {
    printHelp();
    throw new Error("请提供 --sendUid 或 --peerIdsFile");
  }
  const outPath = path.resolve(args.outPath || defaultOutPath());
  console.log(`[CannonWSGen] 开始生成，count=${args.count}, out=${outPath}${peerIds ? `, rotatePeers=${peerIds.length}` : ""}`);
  const t0 = Date.now();
  const res = generateAndWriteFile({
    count: args.count,
    aesKeyUtf8: args.aesKeyUtf8,
    sendUid: args.sendUid,
    receiveUid: args.receiveUid,
    peerIds,
    baseMsgId: args.baseMsgId,
    outPath,
    onProgress: (n) => console.log(`[CannonWSGen] 进度：${n}`),
  });
  const ms = Date.now() - t0;
  console.log(`[CannonWSGen] 完成，count=${res.count}, file=${res.outPath}, elapsed=${ms}ms`);
}

try {
  main();
} catch (error) {
  console.error("[CannonWSGen] 失败:", error.message || error);
  process.exit(1);
}
