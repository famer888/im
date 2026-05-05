const { spawnSync } = require("child_process");
const path = require("path");

const mode = process.argv[2] || "development";
const runtimeArgs = process.argv.slice(3);
const root = path.resolve(__dirname, "..");

function run(command, args, opts = {}) {
    const result = spawnSync(command, args, {
        cwd: root,
        stdio: "inherit",
        env: { ...process.env, ...(opts.env || {}) },
        shell: false,
    });

    if (result.error) {
        console.error(result.error);
        process.exit(1);
    }

    if (result.status !== 0) {
        process.exit(result.status || 1);
    }
}

function script(name) {
    return path.join(__dirname, name);
}

const vueCliService = path.join(
    root,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "vue-cli-service.cmd" : "vue-cli-service"
);

run(process.execPath, [script("generate-build-time.js")]);
run(process.execPath, [script("validate.js")]);
run(process.execPath, [script("del.js"), "./marswrapper.node"]);
run(process.execPath, [script("copy-proto.js")]);
run(vueCliService, [
    "electron:serve",
    "--disable-background-timer-throttling",
    "--mode",
    mode,
], {
    env: {
        VUE_APP_RUN_ARGS: JSON.stringify(runtimeArgs),
        OCS_PROJECT_ROOT: root,
    },
});
