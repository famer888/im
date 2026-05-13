/**
 * 跨平台薄壳：设置 VIRBOX_PROTECT=1，然后转发执行 npm 子脚本。
 *
 * 用法： node scripts/run-protected.js <npm-script-name> [extra args...]
 *
 * 例如  package.json 里这样接入：
 *   "cross-package-win:test:protected":
 *       "node scripts/run-protected.js cross-package-win:test"
 *
 * 这样 Windows / macOS / Linux 都能用同一行，无需 cross-env 依赖。
 */

const { spawn } = require("child_process");
const path = require("path");

const target = process.argv[2];
if (!target) {
    console.error("[run-protected] missing argument: <npm-script-name>");
    process.exit(2);
}
const extraArgs = process.argv.slice(3);

const root = path.resolve(__dirname, "..");
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

const env = {
    ...process.env,
    VIRBOX_PROTECT: "1",
};

console.log(`[run-protected] VIRBOX_PROTECT=1 npm run ${target} ${extraArgs.join(" ")}`.trim());

const child = spawn(npmCmd, ["run", target, ...(extraArgs.length ? ["--", ...extraArgs] : [])], {
    cwd: root,
    env,
    stdio: "inherit",
    shell: false,
});

child.on("exit", (code, signal) => {
    if (signal) {
        console.error(`[run-protected] child killed by signal ${signal}`);
        process.exit(1);
    }
    process.exit(code == null ? 1 : code);
});

child.on("error", (err) => {
    console.error(`[run-protected] failed to spawn npm: ${err.message}`);
    process.exit(1);
});
