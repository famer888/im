/**
 * dmg-builder 自带的 dmgbuild/core.py 为 Python2 写法，在 python3 下会报
 * NameError: reload / setdefaultencoding。npm install 后打补丁，便于 Mac DMG 打包。
 */
const fs = require("fs");
const path = require("path");

const corePath = path.join(
  __dirname,
  "..",
  "node_modules",
  "dmg-builder",
  "vendor",
  "dmgbuild",
  "core.py"
);

if (!fs.existsSync(corePath)) {
  process.exit(0);
}

let src = fs.readFileSync(corePath, "utf8");
const needle = `import sys\nreload(sys)  # Reload is a hack\nsys.setdefaultencoding('UTF8')`;
const replacement = `import sys\nif sys.version_info[0] < 3:\n  reload(sys)  # Reload is a hack\n  sys.setdefaultencoding('UTF8')`;

if (!src.includes(needle)) {
  if (src.includes("if sys.version_info[0] < 3:")) {
    process.exit(0);
  }
  console.warn(
    "[patch-dmg-builder-py3] core.py 内容与预期不符，跳过补丁:",
    corePath
  );
  process.exit(0);
}

fs.writeFileSync(corePath, src.replace(needle, replacement), "utf8");
console.log("[patch-dmg-builder-py3] 已适配 Python3:", corePath);
