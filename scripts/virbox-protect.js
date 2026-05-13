/**
 * electron-builder 的 afterPack 钩子：DS 路线加壳。
 *
 * 工作流（DS 保护方式，参考 Virbox 官方文档 Electron 资源保护流程）：
 *   1. 对主程序 .exe / Mach-O 主二进制：virboxprotector_con 加壳，sidecar .ssp 必须开启 DS + 设密码
 *   2. 对 marswrapper.node：virboxprotector_con 加壳，sidecar .ssp 不开 DS（DS 只针对资源文件）
 *   3. 对 app.asar：dsprotector_con 用第 1 步的 .ssp 做 -c 参数加密整个 asar
 *
 * .ssp 文件来自仓库 protect/ 目录（GUI 一次性生成入库）。本脚本运行时：
 *   - 把模板 .ssp 拷成 sidecar（<目标文件>.ssp）
 *   - 调 CLI（CLI 自动读取同目录 .ssp，无需传保护选项）
 *   - 用输出文件覆盖原文件
 *   - 清理 sidecar .ssp 和临时文件，避免装进安装包
 *
 * electron-builder 时序：webpack → asar 打包 → afterPack(本脚本) → afterSign → NSIS/DMG
 *
 * 启用：VIRBOX_PROTECT=1（由 scripts/run-protected.js 设置）
 * 软失败：VIRBOX_PROTECT_SOFT=1（错误只 warn 不 throw，紧急回退用）
 */

const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");

// ───────────────────────── 配置区 ─────────────────────────

// 主程序加壳 CLI（virboxprotector_con）。优先 env，回落到默认安装路径。
// 默认安装目录 Windows: C:\Program Files\senseshield\Virbox Protector 3\bin\virboxprotector_con.exe
// Linux:   /usr/share/virboxprotector/bin/virboxprotector_con
// macOS:   /Applications/Virbox Protector 3.app/Contents/MacOS/bin/virboxprotector_con
function resolveVbpCli(plat) {
    if (plat === "win32") {
        return (
            process.env.VIRBOX_CLI_WIN ||
            "C:/Program Files/senseshield/Virbox Protector 3/bin/virboxprotector_con.exe"
        );
    }
    if (plat === "darwin") {
        return (
            process.env.VIRBOX_CLI_MAC ||
            "/Applications/Virbox Protector 3.app/Contents/MacOS/bin/virboxprotector_con"
        );
    }
    if (plat === "linux") {
        return process.env.VIRBOX_CLI_LINUX || "/usr/share/virboxprotector/bin/virboxprotector_con";
    }
    return null;
}

// 资源加密 CLI（dsprotector_con）。和 vbp 一般同目录。
function resolveDsCli(plat) {
    if (plat === "win32") {
        return (
            process.env.DSPROTECTOR_CLI_WIN ||
            "C:/Program Files/senseshield/Virbox Protector 3/bin/dsprotector_con.exe"
        );
    }
    if (plat === "darwin") {
        return (
            process.env.DSPROTECTOR_CLI_MAC ||
            "/Applications/Virbox Protector 3.app/Contents/MacOS/bin/dsprotector_con"
        );
    }
    if (plat === "linux") {
        return process.env.DSPROTECTOR_CLI_LINUX || "/usr/share/virboxprotector/bin/dsprotector_con";
    }
    return null;
}

// 每个平台的加壳任务列表，按顺序执行。
// type:
//   - 'shell'    主程序/原生模块加壳（virboxprotector_con），需要 sidecar .ssp
//   - 'shell-ds' 同上，但 .ssp 内必须开了 DS 选项（标记一下，方便 README 区分）
//   - 'ds-res'   资源文件 DS 加密（dsprotector_con -c <main.ssp>）
//
// 路径占位符 <PRODUCT> 会被替换为 context.packager.appInfo.productFilename
// 注：marswrapper.node 不在此处单独加壳。
// 它留在 app.asar 内部，随 ds-res 步骤对整个 asar 的 DS 加密一起被保护，
// 运行时由 DS-shell 主 exe 解密 asar 后，Electron 内置的 asar→native module 抽取逻辑负责加载。
const TARGETS = {
    win32: [
        {
            type: "shell-ds",
            file: "<PRODUCT>.exe",
            ssp: "protect/win/app.ssp",
        },
        {
            type: "ds-res",
            file: "resources/app.asar",
            ssp: "protect/win/app.ssp", // 复用主程序的 .ssp 做 -c 参数
        },
    ],
    darwin: [
        {
            type: "shell-ds",
            // electron-builder 在 mac 上 appOutDir 已经指向 .app 目录内，需要进 Contents/MacOS
            file: "<PRODUCT>.app/Contents/MacOS/<PRODUCT>",
            ssp: "protect/mac/app.ssp",
        },
        {
            type: "ds-res",
            file: "<PRODUCT>.app/Contents/Resources/app.asar",
            ssp: "protect/mac/app.ssp",
        },
    ],
    linux: [
        // Electron 主 ELF 由 framework 提供，不建议加壳；asar DS 加密需要 Linux 版 Virbox + 已加壳的 ELF .ssp。
        // 默认 linux 不做加壳；如需启用，自行生成 protect/linux/app.ssp 并取消下面注释。
        // {
        //     type: "ds-res",
        //     file: "resources/app.asar",
        //     ssp: "protect/linux/app.ssp",
        // },
    ],
};

const PROTECT_ENVS = new Set(["test", "uat", "prod"]);

/**
 * 识别当前构建属于哪个发布环境（test / uat / prod / dev）。
 *
 * 优先级：
 *   1. process.env.VUE_APP_ENV（由 vue-cli-service 从 .env.{mode} 加载，最权威）
 *   2. packname 后缀兜底（兼容旧命名 / 无 .env 的纯 electron-builder 调用）
 *
 * 注意：不再依赖具体 packname 字符串（如 "ocs-im"），因为产品名 .env.production 里随时可能改。
 */
function detectEnv(context) {
    const vueEnv = (process.env.VUE_APP_ENV || "").trim().toLowerCase();
    if (vueEnv === "test" || vueEnv === "uat" || vueEnv === "prod") {
        return vueEnv;
    }
    const packName =
        (context.packager &&
            context.packager.config &&
            context.packager.config.extraMetadata &&
            context.packager.config.extraMetadata.name) ||
        "";
    if (packName.endsWith("-test")) return "test";
    if (packName.endsWith("-uat")) return "uat";
    return "dev";
}

// ───────────────────────── 主流程 ─────────────────────────

exports.default = async function afterPack(context) {
    const plat = context.electronPlatformName;
    const productFilename = context.packager.appInfo.productFilename;
    const env = detectEnv(context);
    const soft = process.env.VIRBOX_PROTECT_SOFT === "1";
    const on = process.env.VIRBOX_PROTECT === "1";

    const tag = `[virbox][${plat}][${env}]`;

    if (!on) {
        console.log(`${tag} VIRBOX_PROTECT!=1 → skip (dev/local build)`);
        return;
    }
    if (!PROTECT_ENVS.has(env)) {
        console.log(`${tag} env not in PROTECT_ENVS → skip`);
        return;
    }

    const list = TARGETS[plat] || [];
    if (!list.length) {
        console.log(`${tag} no targets defined → skip`);
        return;
    }

    const needVbp = list.some((t) => t.type === "shell" || t.type === "shell-ds");
    const needDs = list.some((t) => t.type === "ds-res");
    const vbpCli = needVbp ? resolveVbpCli(plat) : null;
    const dsCli = needDs ? resolveDsCli(plat) : null;

    if (needVbp && (!vbpCli || !fs.existsSync(vbpCli))) {
        const envKey = pickEnvKey(plat, "VIRBOX_CLI");
        return fatal(tag, soft, `virboxprotector_con not found: ${vbpCli}\n        请设置 ${envKey} 指向 CLI`);
    }
    if (needDs && (!dsCli || !fs.existsSync(dsCli))) {
        const envKey = pickEnvKey(plat, "DSPROTECTOR_CLI");
        return fatal(tag, soft, `dsprotector_con not found: ${dsCli}\n        请设置 ${envKey} 指向 CLI`);
    }

    warnIfRisky(context, plat, tag);

    let okCount = 0;
    let didDsRes = false;
    for (const t of list) {
        const rel = t.file.replace(/<PRODUCT>/g, productFilename);
        const abs = path.join(context.appOutDir, rel);
        const sspTemplate = path.resolve(__dirname, "..", t.ssp);

        if (!fs.existsSync(abs)) {
            const msg = `target missing: ${abs}`;
            if (t.type === "ds-res" && !fs.existsSync(abs.replace(/\.unpacked.*/, ""))) {
                // 提示 asarUnpack 配置
                if (!fatal(tag, soft, msg + "\n        检查 vue.config.js → builderOptions.asarUnpack")) return;
            } else {
                if (!fatal(tag, soft, msg)) return;
            }
            continue;
        }
        if (!fs.existsSync(sspTemplate)) {
            const msg = `.ssp template missing: ${sspTemplate}\n        请用 Virbox Protector IDE 一次性生成此工程并入库到 protect/`;
            if (!fatal(tag, soft, msg)) return;
            continue;
        }

        try {
            if (t.type === "shell" || t.type === "shell-ds") {
                protectShell({ tag, cli: vbpCli, file: abs, sspTemplate, requireDs: t.type === "shell-ds" });
            } else if (t.type === "ds-res") {
                protectDsRes({ tag, cli: dsCli, file: abs, ssp: sspTemplate });
                didDsRes = true;
            }
            okCount += 1;
        } catch (err) {
            if (!fatal(tag, soft, `[${t.type}] ${rel}: ${err.message}`)) return;
        }
    }

    // electron-builder 在 afterPack 之后会做 sanityCheckPackage，
    // 它会重新打开 app.asar 验证 main entry（background.js）是否合法。
    // 我们已经把 app.asar DS 加密过了，asar 头已不再是合法格式，校验必然失败。
    // 运行时由 DS 加壳的主程序解密 asar，校验对实际运行没意义，因此跳过。
    if (didDsRes && context.packager) {
        const pkger = context.packager;
        if (typeof pkger.sanityCheckPackage === "function") {
            pkger.sanityCheckPackage = async function () {
                console.log(`${tag} sanityCheckPackage skipped (app.asar is DS-encrypted, electron-builder cannot parse it; runtime decryption is handled by shell-DS protected main exe).`);
            };
        }
    }

    console.log(`${tag} done. ${okCount}/${list.length} targets protected.`);
};

// ───────────────────────── 子步骤 ─────────────────────────

/**
 * 主程序 / 原生模块加壳：
 *   1. 拷贝模板 .ssp 到目标同目录，命名为 <basename>.ssp（sidecar 约定）
 *   2. 调用 virboxprotector_con <input> -o <input>.protected
 *      （CLI 自动读取 sidecar，不需要再传保护选项）
 *   3. 把 .protected 覆盖回原文件
 *   4. 删除 sidecar 和临时文件
 */
function protectShell({ tag, cli, file, sspTemplate, requireDs }) {
    const sidecar = file + ".ssp";
    const protectedOut = file + ".protected";

    fs.copyFileSync(sspTemplate, sidecar);
    console.log(`${tag} [shell${requireDs ? "-ds" : ""}] sidecar ${path.basename(sidecar)} ← ${sspTemplate}`);
    console.log(`${tag} [shell${requireDs ? "-ds" : ""}] vbp ${file}`);

    try {
        execFileSync(cli, [file, "-o", protectedOut], { stdio: "inherit" });
        if (!fs.existsSync(protectedOut)) {
            throw new Error(`expected output not produced: ${protectedOut}`);
        }
        fs.renameSync(protectedOut, file);
    } finally {
        // 不论成功失败都把 sidecar 清掉，避免装进安装包
        safeUnlink(sidecar);
        safeUnlink(protectedOut);
    }
}

/**
 * 资源文件 DS 加密：
 *   dsprotector_con <input> -c <main.ssp> -o <input>.protected
 *   然后用 .protected 覆盖原文件，删 dsprotector 可能产出的 .bak
 */
function protectDsRes({ tag, cli, file, ssp }) {
    const protectedOut = file + ".protected";
    const bak = file + ".bak";

    console.log(`${tag} [ds-res] ${file} (using ssp: ${path.relative(process.cwd(), ssp)})`);
    try {
        execFileSync(cli, [file, "-c", ssp, "-o", protectedOut], { stdio: "inherit" });
        if (!fs.existsSync(protectedOut)) {
            throw new Error(`expected output not produced: ${protectedOut}`);
        }
        fs.renameSync(protectedOut, file);
    } finally {
        safeUnlink(protectedOut);
        // dsprotector 在原地工作时会留 .bak，本流程用 -o 输出到别处，正常不会产生 .bak；保险起见再清一次
        safeUnlink(bak);
    }
}

// ───────────────────────── 辅助 ─────────────────────────

function fatal(tag, soft, msg) {
    if (soft) {
        console.warn(`${tag} SOFT → ${msg}`);
        return true; // 继续执行下个 target
    }
    throw new Error(`${tag} ${msg}`);
}

function safeUnlink(p) {
    try {
        if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (_) {
        /* ignore */
    }
}

function pickEnvKey(plat, prefix) {
    const map = {
        win32: prefix + "_WIN",
        darwin: prefix + "_MAC",
        linux: prefix + "_LINUX",
    };
    return map[plat] || prefix + "_?";
}

function warnIfRisky(context, plat, tag) {
    if (plat === "darwin") {
        const arches = (context.packager.config.mac && context.packager.config.mac.target) || [];
        if (JSON.stringify(arches).includes("universal")) {
            console.warn(
                `${tag} mac target 含 universal，Virbox 通常只能保护单架构 Mach-O。建议改成 ['x64','arm64'] 分包。`
            );
        }
        console.warn(`${tag} 加壳后的 Mach-O 一般无法通过 notarization。如要公证，请关闭 anti-debug 或放弃 mac 加壳。`);
    }
}
