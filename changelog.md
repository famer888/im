# Changelog — Electron 安全加固

> 目的：逐步消除 Electron 窗口中的安全隐患，恢复 Chromium 安全机制。

---

## 2026-04-16 — 通知窗口 HTML 注入防御 & `local-resource:` CSP 旁路修复

> 修复通知窗口 (`notification.html`) 未对来自其他用户的消息内容做 HTML 净化直接拼接 innerHTML 的 XSS 漏洞；移除 `local-resource:` 协议的 `bypassCSP`，堵住 CSP 旁路。

### 变更清单

| # | 功能模块 | 涉及到的功能 | 用户操作路径 | 修改内容 |
|---|---------|------------|------------|---------|
| 41 | **通知窗口 — 用户输入净化** | 桌面通知弹窗中的消息渲染 | 收到新消息 → 弹出桌面通知 | `public/notification.html` 内联 `<script>`（~290 行）提取为 `public/notification-app.js`；新增 `escapeHtml()` 函数，对 `item.name`、`item.userName`、`item.id` 做 HTML 实体转义；`handleMsgContent()` → `textToEmojiImage()` 重写为先转义全文再替换表情标记 |
| 42 | **通知窗口 — 头像 URL 校验** | 通知弹窗中的头像图片 | 收到新消息 → 弹出桌面通知 → 显示头像 | `public/notification-app.js`：新增 `safeSrc()` 函数，白名单校验头像 URL 协议（`./`、`local-resource:`、`app:`、`file:`、`http(s):`），拒绝 `javascript:` 等危险协议 |
| 43 | **通知窗口 — 内联事件移除** | 通知弹窗头像加载失败处理 | 收到新消息 → 头像加载失败 | `public/notification.html`：移除 `<img onerror="this.style.display='none'">` 内联事件处理器（CSP `script-src 'self'` 下会被拦截） |
| 44 | **通知窗口 CSP** | 通知窗口内容安全策略 | 收到新消息 → 弹出桌面通知 | `public/notification.html`：新增 `<meta http-equiv="Content-Security-Policy">` — `script-src 'self'`; `style-src 'self' 'unsafe-inline'`; `object-src 'none'`; `base-uri 'self'` 等 |
| 45 | **`local-resource:` 协议 — 移除 `bypassCSP`** | 自定义协议安全策略 | 所有通过 `local-resource:` 加载的资源 | `src/background.js`：`protocol.registerSchemesAsPrivileged` 中 `local-resource:` 的 `privileges` 移除 `bypassCSP: true` |

### 背景说明

#### 通知窗口 XSS 风险

- **直接拼接用户输入**：`item.name`（发送者昵称）、`item.userName`（群内用户名）、`item.content`（消息内容）通过模板字符串直接嵌入 HTML，攻击者可通过恶意昵称/消息注入 `<script>`、`<img onerror=...>`、`<iframe>` 等
- **无 CSP 保护**：通知窗口此前无 Content-Security-Policy，即使注入了 `<script>` 也不会被浏览器拦截
- **无 DOMPurify**：通知窗口是独立 HTML 页面，未引入 DOMPurify 库

#### `local-resource:` bypassCSP 旁路

- DOMPurify 的 `ALLOWED_URI_REGEXP` 白名单包含 `local-resource:` 协议
- 若该协议的 `bypassCSP: true` 保留，攻击者可构造 `local-resource:` URL 引用恶意资源绕过 CSP

#### 修复策略

| 原问题 | 解决方案 |
|--------|---------|
| 通知窗口直接拼接用户输入为 HTML | 所有用户可控字段通过 `escapeHtml()` 转义；表情处理改为先转义再替换 |
| 头像 URL 可注入 `javascript:` | 新增 `safeSrc()` 白名单校验 |
| 内联 `onerror` 事件处理器 | 移除（CSP 会拦截，且头像加载失败无需特殊处理） |
| 通知窗口无 CSP | 添加严格 CSP `<meta>` 标签，`script-src 'self'` 禁止内联脚本和 `on*` 事件 |
| 内联 `<script>` 不兼容 CSP | 提取为外部文件 `notification-app.js` |
| `local-resource:` 绕过 CSP | 移除协议注册中的 `bypassCSP: true` |

---

## 2026-04-16 — contextIsolation: true / nodeIntegration: false 全局迁移

> 将所有 BrowserWindow 切换为 `contextIsolation: true` + `nodeIntegration: false`，渲染进程不再直接访问 Node.js API，改由 preload 脚本通过 `contextBridge` 桥接。

### 变更清单

| # | 功能模块 | 涉及文件 | 修改内容 |
|---|---------|---------|---------|
| 28 | **主窗口 webPreferences** | `src/background.js` | `nodeIntegration: false`, `contextIsolation: true`, 新增 `preload` 路径；`@electron/remote/main.enable()` 移至 `loadURL()` 之前 |
| 29 | **通知窗口 webPreferences** | `src/notification/index.js` | 同上，新增 `notification-preload.js` |
| 30 | **主窗口 preload 脚本** | `public/preload.js`（新增） | 通过 `contextBridge.exposeInMainWorld('electronAPI', ...)` 暴露 ipcRenderer、shell、clipboard、windowControl、fs、path、os、Buffer 等 API |
| 31 | **通知窗口 preload** | `public/notification-preload.js`（新增） | 仅暴露 `ipcRenderer.send` / `ipcRenderer.on` |
| 32 | **Webpack 配置** | `vue.config.js` | `target` 改为 `'web'`；添加 webpack alias 将 `electron`、`@electron/remote`、`file-system` 指向 shim 模块；node polyfill 配置 |
| 33 | **平台抽象层** | `src/platform.js` | 完全重写，所有导出改为读取 `window.electronAPI`；`remote.getCurrentWindow()` 兼容层映射到 `windowControl` |
| 34 | **Webpack shim 模块** | `src/shims/electron-renderer.js`、`electron-remote-renderer.js`、`file-system.js`（新增） | 为 webpack 提供 renderer 侧的模块替身 |
| 35 | **渲染进程直接 Node 引用清理** | `src/utils/tools.js`、`publicCache.js`、`cacheDB.js`、`clipboard.js`、`fileTools.js`、`upload.js`、`trendsDomain/workTools.js`、`trendsDomain/tools.js`、`trendsAesKey.js`、`event/msg.js`、`database/index.js`、`platformHelper.js`、`debuggers/benchmark.js` | 移除 `require('fs')`/`require('path')`/`require('os')`/`import fs from 'fs'` 等直接 Node.js 引用，改为从 `@/platform` 导入 |
| 36 | **直接 electron 引用清理** | `src/pages/home/chat-window/send/editor.vue`、`src/utils/widget/lockDomBeforeResize.js` | `import { clipboard/ipcRenderer } from 'electron'` 改为从 `@/platform` 导入 |
| 37 | **process.platform 迁移** | `src/utils/base.js`、`src/event/common.js`、`src/config.js` | `process.platform` / `window.process.platform` 改为 `window.electronAPI.process.platform` |
| 38 | **通知页面** | `public/notification.html` | `require('electron')` 改为 `window.electronAPI.ipcRenderer` |
| 39 | **downloadImageToLocal** | `src/utils/fileTools.js` | `https.get` + `fs.createWriteStream` + `pipe` 改为调用 preload 的 `downloadFile()` 方法（stream 对象无法跨 contextBridge） |
| 40 | **Buffer 迁移** | `src/platformHelper.js`、`src/utils/fileTools.js` | `Buffer.from()` 改为 `BufferUtil.from()`（通过 platform.js 代理 preload 的 Buffer 工具）；其余文件依赖 webpack 4 的 Buffer polyfill |

### 设计决策

| 问题 | 方案 |
|------|------|
| IPC 通道是否全部迁移到 preload function？ | 否。保持 `ipcRenderer.send/invoke/on` 桥接，已有的 IPC 通道名不变，渲染进程代码改动最小 |
| `@electron/remote` 如何处理？ | 保留在 preload 脚本中使用；渲染进程通过 `windowControl` 代理（minimize / maximize / getMediaSourceId 等）；不直接暴露 remote 对象 |
| fs / path / os 如何提供？ | preload 脚本中使用真实 Node.js 模块，通过 contextBridge 暴露子集 API；webpack target 切为 `web`，不再依赖 renderer 的 Node.js runtime |
| Buffer 如何处理？ | 大量旧代码使用全局 `Buffer`，由 webpack 4 内置 `buffer` polyfill 覆盖；少量位置显式使用 preload 的 `BufferUtil` |
| stream 对象（createWriteStream 等）如何跨 bridge？ | 不跨 bridge。`downloadImageToLocal` 改为调用 preload 封装的 `downloadFile` 方法，stream 操作全部在 preload 上下文内完成 |

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
