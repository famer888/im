#!/usr/bin/env node
/**
 * electron-builder 在 macOS 打 DMG 时会 spawn `/usr/bin/python`，新系统已不存在。
 * 在 darwin 上设置 PYTHON_PATH 为 python3（可通过环境变量覆盖）。
 */
const { spawnSync } = require("child_process");

if (process.platform === "darwin") {
  process.env.PYTHON_PATH =
    process.env.PYTHON_PATH || "/usr/bin/python3";
}

const dash = process.argv.indexOf("--");
const rest = dash >= 0 ? process.argv.slice(dash + 1) : process.argv.slice(2);
if (!rest.length) {
  console.error(
    "usage: node scripts/run-with-darwin-python.js -- <command> [args...]"
  );
  process.exit(1);
}

const result = spawnSync(rest.join(" "), {
  stdio: "inherit",
  env: process.env,
  shell: true,
});
process.exit(result.status === null ? 1 : result.status);
