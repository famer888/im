# protect/ —— VirboxProtector 工程文件目录（DS 保护方式）

本目录存放 VirboxProtector 的 `.ssp` 工程文件，由 `scripts/virbox-protect.js`（electron-builder 的 afterPack 钩子）在打 test / uat / prod 包时消费。

## 我们走的是 DS 路线（不是 H5）

参考 Virbox 官方文档 [Electron 程序资源文件保护流程](https://h.virbox.com/vbp/docs/other_program_protector/electron-js-protect/)，Electron 资源保护**二选一**：

- **H5 方式**：对 asar 里的 .js 文件单独加密、运行时实时解密。本项目**没采用**。
- **DS 方式（本项目采用）**：主程序加壳时勾上 DS 选项 + 设密码，再用 DSProtector 工具对整个 `app.asar` 一次性加密。安装包发布时**主程序和资源文件必须同步替换**。

## 加壳目标和工具对照

| 目标文件 | 工具 | .ssp 模板 | .ssp 内 DS 选项 |
|---|---|---|---|
| `<productFilename>.exe` (Win) / `<productFilename>` (Mac 主二进制) | `virboxprotector_con` | `protect/win/app.ssp` / `protect/mac/app.ssp` | **必须开 + 设密码** |
| `marswrapper.node` | `virboxprotector_con` | `protect/{win,mac,linux}/marswrapper.ssp` | **不要开**（DS 只针对资源文件，不针对原生模块） |
| `app.asar`（资源文件 DS 加密） | `dsprotector_con` | 复用主程序的 `app.ssp`（用 `-c` 传入） | 同上，从主程序 .ssp 读取 DS 密钥 |

## 目录结构

```
protect/
├── README.md              本文件
├── win/
│   ├── app.ssp            主程序加壳工程（必须开 DS + 密码）
│   └── marswrapper.ssp    marswrapper.node 加壳工程（不开 DS）
├── mac/
│   ├── app.ssp
│   └── marswrapper.ssp
└── linux/
    └── marswrapper.ssp    Linux 默认只加壳 .node；如要 asar DS，自行加 app.ssp 并改脚本
```

---

## 一次性：在 IDE 里生成 .ssp（以 Windows 为例）

> 需要先装好 **Virbox Protector 3**（默认路径 `C:\Program Files\senseshield\Virbox Protector 3\`），并插 SenseShield 加密锁。

### 准备一份未加壳的产物

```powershell
npm run cross-package-win:test
```

产物在 `dist/win-unpacked/`。我们要从里面拿到真实的 `<productFilename>.exe`、`marswrapper.node` 路径。

> 提示：`<productFilename>` 三套环境名字不一样，**只在一套环境里生成 .ssp 即可，三套通用**——脚本会把模板 .ssp 拷成 sidecar 时按当前环境的 productFilename 重命名，因此 .ssp 内嵌的 exe 名称差异不影响。

### 生成 `protect/win/app.ssp`（主程序，开 DS）

1. 启动 Virbox Protector GUI（不是 `virboxprotector_con.exe`，是带界面的那个）。
2. 拖入 `dist/win-unpacked/ocs-im-new-test.exe`。
3. 右侧"保护选项"建议勾选（DS 路线下推荐项）：
   - **压缩**
   - **调试器检测 Anti-Debug**
   - **内存校验 / 完整性校验**
   - **导入表加密**
   - 不要勾"代码加密"和"代码虚拟化"——Electron 主程序是框架代码，加这些容易踩坑且收益低
4. **关键**：找到 **DS 选项**（或叫"资源加密"开关）→ **打开** → 设置密码（建议保留默认随机密码，复杂度足够）。
5. 菜单"保存配置" → 保存为 `protect/win/app.ssp`。
6. **不要点"立即保护"** —— 我们只要 .ssp 模板，实际加壳由 CI 跑 CLI 完成。

### 生成 `protect/win/marswrapper.ssp`（marswrapper.node，不开 DS）

1. 新建工程，拖入 `dist/win-unpacked/resources/app.asar.unpacked/marswrapper.node`。
   - 如果 unpacked 目录不存在，先确认 `vue.config.js` 里 `builderOptions.asarUnpack` 包含 `**/*.node`，再重新打一次包。
2. 勾选保护选项（推荐对 .node 的方案）：
   - 压缩
   - 调试器检测
   - 完整性校验
   - **代码加密**（对 .node 这类原生模块收益高）
   - **代码虚拟化**：只对核心导出函数开（整体 VM 启动慢）
3. **DS 选项保持关闭** —— DS 是给资源文件用的，对 .node 没有意义。
4. 保存为 `protect/win/marswrapper.ssp`。

### macOS / Linux 同理

- `protect/mac/app.ssp` / `protect/mac/marswrapper.ssp`：流程相同，注意是 Mach-O 不是 PE。
- `protect/linux/marswrapper.ssp`：linux 一般不加壳主二进制（Electron framework ELF），只保护 .node。

完成后把 `protect/` 全部提交到 git。

---

## 本机验证（一次完整加壳跑通）

```powershell
# 一次性配置环境变量（PowerShell 用户级）
[Environment]::SetEnvironmentVariable("VIRBOX_CLI_WIN", "C:\Program Files\senseshield\Virbox Protector 3\bin\virboxprotector_con.exe", "User")
[Environment]::SetEnvironmentVariable("DSPROTECTOR_CLI_WIN", "C:\Program Files\senseshield\Virbox Protector 3\bin\dsprotector_con.exe", "User")
# 新开一个终端让环境变量生效，然后：
npm run cross-package-win:test:protected
```

期望日志（关键行）：

```
[virbox][win32][test] [shell-ds] sidecar ocs-im-new-test.exe.ssp ← .../protect/win/app.ssp
[virbox][win32][test] [shell-ds] vbp dist/win-unpacked/ocs-im-new-test.exe
[virbox][win32][test] [shell]    sidecar marswrapper.node.ssp   ← .../protect/win/marswrapper.ssp
[virbox][win32][test] [shell]    vbp dist/win-unpacked/resources/app.asar.unpacked/marswrapper.node
[virbox][win32][test] [ds-res]   resources/app.asar (using ssp: protect/win/app.ssp)
[virbox][win32][test] done. 3/3 targets protected.
```

装出来的 setup 安装 → 启动 → 登录 → 收发消息 → 历史记录全过，DS 路线就跑通了。

---

## CI 集成

```yaml
# 伪 GitHub Actions
- name: Build & Protect (test)
  env:
    VIRBOX_CLI_WIN:      'C:/Program Files/senseshield/Virbox Protector 3/bin/virboxprotector_con.exe'
    DSPROTECTOR_CLI_WIN: 'C:/Program Files/senseshield/Virbox Protector 3/bin/dsprotector_con.exe'
  run: npm run cross-package-win:test:protected
```

CI runner **必须长期插着 SenseShield 加密锁**，否则 CLI 非零退出，本钩子默认抛错阻断发布。

---

## 紧急回退

| 情况 | 操作 |
|---|---|
| 想发一版无壳安装包 | 用旧命令 `npm run cross-package-win:test`（不带 `:protected`） |
| 加壳失败但要继续发包 | 设置 `VIRBOX_PROTECT_SOFT=1` 后再跑 `:protected`，钩子只 warn 不 throw |

---

## DS 路线必须注意的几件事

1. **主程序和 asar 一一对应**：DS 加密的 asar 只能被对应密钥的主程序解密。**升级时主程序和 asar 必须一起换**，不能只换 asar；这也是 DS 路线相比 H5 的最大限制。
2. **代码签名顺序**：加壳改 PE 头/Mach-O 结构，**必须在签名之前完成**（即 afterPack 之后才能 afterSign）。electron-builder 默认顺序就是 afterPack → afterSign，无需额外操作。
3. **Electron asar integrity**：Electron 30+ 默认开启 asar 哈希校验，会把 asar SHA 嵌进主 exe；DS 加密会改 asar 内容，主 exe 启动时校验失败。本项目 `electron 13.6.9` 不受影响；如果未来升 Electron 大版本，要在 `builderOptions` 里关掉 `asarIntegrity`。
4. **electron-builder 的 `sanityCheckPackage` 必然失败 → 已自动跳过**：electron-builder 在 afterPack 之后会重新打开 `app.asar` 验证 `background.js` 是否合法（`platformPackager.ts:549`）。DS 加密后 asar 头部已非合法 ASAR 格式，校验会抛 `ERR_BUFFER_OUT_OF_BOUNDS`。`scripts/virbox-protect.js` 在做完 ds-res 后会自动 monkey-patch 当前 packager 实例的 `sanityCheckPackage` 跳过这次校验，日志里看到 `sanityCheckPackage skipped (app.asar is DS-encrypted ...)` 是预期行为，运行时由 DS 加壳的主 exe 负责解密 asar，这层静态校验对最终安装包无意义。
5. **macOS notarization**：加壳 Mach-O 通常无法公证。要么不公证（用户需"允许任何来源"），要么 `protect/mac/app.ssp` 里关掉 anti-debug，要么放弃 mac 加壳。
6. **macOS universal**：当前 `vue.config.js` 的 `mac.target.arch` 是 `['universal']`，Virbox 只能处理单架构 Mach-O。落地 mac 加壳前要改成 `['x64','arm64']`。
7. **`.ssp` 内的 DS 必须真开了 + 设了密码**。如果 .ssp 里 DS 开关没开 / 密码节点丢失，dsprotector_con 会报错 `0x00000024` / `0x00000025`。生成 .ssp 时务必在 GUI 里确认 DS 状态。
8. **sidecar .ssp 不要进安装包**：脚本会在加壳完成后自动 `unlink` sidecar，但如果你手动改流程，注意在 `app.asar.unpacked/marswrapper.node.ssp` 这种文件出现时清干净，避免泄漏密钥派生信息进安装包。
