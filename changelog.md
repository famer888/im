# Changelog — Electron 安全加固

> 目的：逐步消除 Electron 窗口中的安全隐患，恢复 Chromium 安全机制。

---

## 2026-04-16 — CSP 兼容修复与 CORS 去重

> 修复 CSP 策略导致的编译错误和运行时报错，修复 CORS 响应头重复值问题。

### 变更清单

| # | 功能模块 | 涉及到的功能 | 用户操作路径 | 修改内容 |
|---|---------|------------|------------|---------|
| 23 | **主窗口 CSP — 模板语法修复** | 开发环境编译 | `npm run dev:test` → webpack 编译 | `public/index.html`：CSP `<meta>` 中 lodash 模板表达式内的 `&quot;` 改为 `"`，修复 `SyntaxError: Unexpected token '&'` 编译错误 |
| 24 | **主窗口 CSP — 开发环境放行** | 开发环境 HMR / eval | 启动应用 → 开发模式热更新 | `public/index.html`：`script-src` 新增 `https://www.googletagmanager.com`，开发环境动态追加 `'unsafe-eval'`（通过 lodash 模板 `<%= %>`），生产环境不包含 |
| 25 | **主窗口 webPreferences** | 开发环境 CSP 绕过 | 启动应用 → 主窗口渲染 | `src/background.js`：webPreferences 新增 `bypassCSP: true`，开发阶段避免 CSP 阻断调试 |
| 26 | **CORS 响应头去重** | 所有 HTTP API 请求 | 应用中所有涉及服务端 API 调用的操作 | `src/background.js`：`onHeadersReceived` 改为检测 `Access-Control-Allow-Origin` 是否有多个值（如 `http://localhost:8080, *`），仅在重复时去重保留具体 origin；单值不修改，缺失时补 `*` |
| 27 | **内联 `javascript:` URL 移除** | 聊天消息中的链接点击 | 聊天窗口 → 点击消息中的链接 | `src/pages/home/com/lable-ele.vue`：`href="javascript:void(0)"` → `href="#"` + `@click.prevent.stop`，消除 CSP `script-src` 对 `javascript:` URL 的拦截 |

### 背景说明

| 原问题 | 解决方案 |
|--------|---------|
| lodash 模板引擎将 `&quot;` 当作 JS 执行，`&` 导致编译失败 | 在 `<%= %>` 内使用真正的 `"` 双引号 |
| 开发环境 webpack 需要 `eval()` 构建源码映射，被 CSP `script-src` 拦截 | 开发环境动态追加 `'unsafe-eval'`，生产环境保持严格策略 |
| 后端返回重复 `Access-Control-Allow-Origin`（如 `http://localhost:8080, *`），浏览器拒绝 | `onHeadersReceived` 检测多值时去重，保留具体 origin 以兼容带 credentials 的请求（如 sockjs-node HMR） |
| `javascript:void(0)` 被 CSP `script-src` 拦截 | 改用 `href="#"` + Vue `.prevent` 修饰符阻止默认行为 |

---

## 2026-04-16 — 移除 `bypassCSP`，配置严格 CSP

> 移除 `app://` 协议注册中的 `bypassCSP: true`，为所有 `app://` 页面配置严格的 Content Security Policy，并将受影响的内联代码外部化以符合 CSP 要求。

### 变更清单

| # | 功能模块 | 涉及到的功能 | 用户操作路径 | 修改内容 |
|---|---------|------------|------------|---------|
| 17 | **`app://` 协议注册** | 自定义协议安全策略 | 所有 `app://` 页面 | `src/background.js`：`protocol.registerSchemesAsPrivileged` 移除 `bypassCSP: true` |
| 18 | **主窗口 CSP** | 页面内容安全策略 | 启动应用 → 主窗口渲染 | `public/index.html`：新增 `<meta http-equiv="Content-Security-Policy">` — `script-src 'self' https://www.gstatic.com`; `style-src 'self' 'unsafe-inline'`; `object-src 'none'` 等 |
| 19 | **媒体播放器 CSP** | 媒体窗口内容安全策略 | 聊天中点击图片/视频 → 媒体播放器窗口 | `public/media/media.html`：新增 `<meta http-equiv="Content-Security-Policy">` — `script-src 'self'`; `style-src 'self' 'unsafe-inline'`; `object-src 'none'` 等 |
| 20 | **媒体播放器 — 内联样式外部化** | 媒体窗口 CSS | 聊天中点击图片/视频 → 媒体播放器窗口 | `public/media/media.html` 内联 `<style>`（~36行）提取为 `public/media/media.css` |
| 21 | **媒体播放器 — 内联脚本外部化** | 媒体窗口 JS 逻辑 | 聊天中点击图片/视频 → 媒体播放器窗口 | `public/media/media.html` 内联 `<script>`（~360行）提取为 `public/media/media.js`；5 处内联 `onclick` 事件处理器改为 `addEventListener` |
| 22 | **主窗口 — Firebase 内联脚本外部化** | Firebase Analytics 初始化 | 启动应用 → 主窗口渲染 | `public/index.html` 内联 `<script type="module">` 提取为 `public/firebase-init.js` |

### 背景说明

#### `bypassCSP: true` 的风险

- **绕过内容安全策略**：即使页面设置了 CSP 头或 `<meta>` 标签，该协议下的页面也会完全忽略，使 CSP 形同虚设
- **允许任意内联脚本执行**：`<script>` 内联代码、`onclick` 等内联事件处理器、`eval()` 均不受限制，XSS 攻击面扩大
- **允许任意来源资源加载**：脚本、样式、图片等可从任何 URL 加载，无法通过 CSP 限制恶意资源注入

#### 修复策略

| 原问题 | 解决方案 |
|--------|---------|
| `app://` 页面绕过所有 CSP 检查 | 移除 `bypassCSP: true`，通过 `<meta>` 标签为每个 HTML 页面配置精细化 CSP 策略 |
| `media.html` 大量内联 `<script>` 和 `<style>` | 提取为外部文件 `media.js` / `media.css`，CSP 允许 `'self'` 同源加载 |
| `media.html` 内联 `onclick` 事件处理器 | 改为 JS `addEventListener` 绑定，无需 `'unsafe-inline'` script 豁免 |
| `index.html` 内联 Firebase 初始化脚本 | 提取为外部模块 `firebase-init.js`，CSP 仅放行 `https://www.gstatic.com` CDN |

#### 未受影响的窗口

- **通知窗口** `notification.html`：通过 `loadFile()` 以 `file://` 协议加载，不经过 `app://` 的 `bypassCSP` 配置，本次无需修改

---

## 2026-04-16 — 启用 webSecurity: true

> 将所有 Electron 窗口的 `webSecurity` 从 `false` 改为 `true`，恢复 Chromium 同源策略，消除跨域安全风险。同时修复因此产生的本地文件加载与 CORS 问题。

### 变更清单

| # | 功能模块 | 涉及到的功能 | 用户操作路径 | 修改内容 |
|---|---------|------------|------------|---------|
| 1 | **Electron 主窗口** | 应用启动、页面加载 | 启动应用 → 主窗口渲染 | `src/background.js`：`webSecurity: false` → `true`；移除 `allowRunningInsecureContent: true` |
| 2 | **Electron 媒体播放器窗口** | 视频/音频独立播放器 | 聊天中点击视频/音频 → 打开媒体播放器窗口 | `src/utils/media/MediaProcess.js`：`webSecurity: false` → `true` |
| 3 | **Electron 通知窗口** | 系统通知弹窗 | 收到新消息 → 弹出桌面通知 | `src/notification/index.js`：`webSecurity: false` → `true`；移除 `allowRunningInsecureContent: true` |
| 4 | **Electron Builder 构建配置** | 开发/打包构建默认配置 | `electron:serve` / `electron:build` | `vue.config.js`：`webSecurity: false` → `true` |
| 5 | **聊天消息 — 图片显示** | 图片消息渲染、本地缩略图展示 | 聊天窗口 → 查看图片消息 | `src/pages/.../msg/image.vue`：`macFixImagePath()` 中 `file://` → `local-resource://`；`getUrl()` 新增非 Mac 平台的 `local-resource://` 协议前缀 |
| 6 | **聊天消息 — 音频播放** | 本地音频文件播放 | 聊天窗口 → 播放语音消息 | `src/pages/.../msg/audio.vue`：`<audio>` 标签 src 从 `file://` → `local-resource://` |
| 7 | **聊天消息 — 引用消息缩略图** | 引用消息中的图片缩略图 | 聊天窗口 → 查看被引用的图片消息 | `src/pages/.../msg/quote.vue`：`<img>` src 从 `file://` → `local-resource://` |
| 8 | **发送栏 — 引用信息缩略图** | 输入框上方引用预览的图片 | 聊天窗口 → 引用一条图片消息 → 输入框上方显示预览 | `src/pages/.../send/quote-info.vue`：`<img>` src 从 `file://` → `local-resource://` |
| 9 | **发送栏 — 转发信息缩略图** | 转发面板中的图片预览 | 聊天窗口 → 转发消息 → 预览面板显示图片 | `src/pages/.../send/forward-info.vue`：`` `file:///${localUrl}` `` → `` `local-resource://${localUrl}` `` |
| 10 | **发送栏 — 文件获取** | 编辑器中通过 fetch 读取本地文件 | 聊天窗口 → 粘贴/拖入本地文件 | `src/pages/.../send/editor.vue`：`fetch("file://"+url)` → `fetch("local-resource://"+url)` |
| 11 | **文件事件 — 解密校验** | 文件下载解密后的正确性检测 | 接收文件消息 → 自动下载解密 → 校验文件完整性 | `src/event/file.js`：`checkFileCorrect("file://"+path)` → `checkFileCorrect("local-resource://"+path)` |
| 12 | **HTML 内容净化** | 富文本/消息 HTML 的 URI 白名单 | 聊天窗口 → 接收/展示富文本消息 | `src/utils/sanitizeHtml.js`：DOMPurify URI 正则白名单新增 `local-resource:` 协议 |
| 13 | **网络请求 CORS 兼容** | 所有 HTTP API 请求的跨域处理 | 应用中所有涉及服务端 API 调用的操作 | `src/background.js`：新增 `session.defaultSession.webRequest.onHeadersReceived` 处理器，仅在服务端响应未携带 CORS 头时注入 `Access-Control-Allow-Origin/Headers/Methods: *`，避免与服务端已有头重复导致 `*, *` 问题 |
| 14 | **媒体播放器 — 本地文件加载** | 图片/视频在独立媒体窗口中的加载与展示 | 聊天中点击图片/视频 → 媒体播放器窗口显示内容 | `public/media/media.html`：`ensureFileOrRemoteUrl()` 将本地路径转为 `local-resource://` 而非 `file://`；已有 `file://` URL 也统一转换 |
| 15 | **媒体播放器 — 路径解析** | "使用默认应用打开"、"另存为"功能的路径提取 | 媒体播放器窗口 → 点击"使用默认应用打开"或"另存为" | `public/media/media.html`：`fileUrlToLocalPath()` 新增 `local-resource://` 协议解析，并修复 Windows 路径前导多余斜杠问题（`/C:/path` → `C:/path`） |
| 16 | **媒体播放器 — 路径显示** | 媒体窗口底部文件路径标签 | 媒体播放器窗口 → 查看底部文件路径 | `public/media/media.html`：`formatPathForDisplay()` 新增对 `local-resource://` 协议的识别 |

### 背景说明

#### `webSecurity: false` 的风险

- **禁用同源策略**：渲染进程可向任意源发起请求，恶意注入的脚本可窃取数据
- **允许 `file://` 跨域访问**：`app://` 页面可直接读取本地任意文件
- **`allowRunningInsecureContent: true`**：允许 HTTPS 页面加载 HTTP 资源，存在中间人攻击风险

#### 修复策略

| 原问题 | 解决方案 |
|--------|---------|
| 渲染进程用 `file://` 加载本地文件 | 改用项目已注册的 `local-resource://` 自定义协议（`registerLocalResourceProtocol`），该协议通过 Electron 的 `protocol.registerFileProtocol` 安全提供文件访问 |
| API 请求依赖 CORS 豁免 | 在主进程通过 `webRequest.onHeadersReceived` 为响应注入 CORS 头，仅在 Electron 层面处理而非完全关闭安全策略 |
| 混合内容加载 | 移除 `allowRunningInsecureContent`，强制使用安全连接 |
