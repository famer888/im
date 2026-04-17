# Changelog — Electron 安全加固

> 目的：逐步消除 Electron 窗口中的安全隐患，恢复 Chromium 安全机制。
>
> **49 files changed, 1661 insertions(+), 1029 deletions(-)**（截至 2026-04-17）

---

## 2026-04-17 — OSS 上传 CORS 预检失败修复

> 在 `webSecurity: true` 启用后，ali-oss SDK 的 `multipartUpload` 对自建 CNAME（如 `oss-cn-hongkong.clb77.zsae86.com`）发起的 `OPTIONS` 预检被源站返回非 2xx，浏览器报 `Response to preflight request doesn't pass access control check: It does not have HTTP ok status.`，导致消息中的图片/文件/视频/语音全部无法上传。无权限改动 OSS Bucket / CDN 配置，改为在 Electron 主进程按域名伪造 CORS 预检响应 + 渲染进程侧加防御。
>
> **本次增量：3 files changed, +225 insertions, +50 deletions**（累计自 `89bae9ad`：49 files / +1661 / -1029）
>
> 触及文件：`src/background.js`、`src/utils/upload.js`、`changelog.md`

### 涉及功能（测试清单）

| # | 用户操作路径 | 预期表现 | 涉及模块 |
|---|------------|---------|---------|
| 1 | 聊天窗口 → 发送图片消息 | 上传成功、对端可见，DevTools Network 中 `OPTIONS` 返回 200 | ali-oss 直传 + 主进程 CORS 伪造 |
| 2 | 聊天窗口 → 发送视频/文件/语音 | 同上，任意类型附件均可上传 | ali-oss 直传 |
| 3 | 聊天窗口 → 发送大文件触发分片上传 | 分片并发正常，进度条可达 95% | `ossUpload` multipart |
| 4 | 动态域名池下发的 OSS CNAME 不可达 | 自动跳过坏节点并回退到 `ossEndpoint`，最终上传成功 | 上传路径预检 + 上报 |
| 5 | 下发的 OSS endpoint 为 `http://` 前缀 | 客户端强制升为 `https://` 后再交给 ali-oss | endpoint 归一化 |
| 6 | DevTools 查看非 OSS 域名请求 | CORS 行为保持原有策略，未被过度放开 | `onHeadersReceived` 命中范围 |

### 变更详情

| # | 功能模块 | 修改内容 |
|---|---------|---------|
| 48 | **主进程 CORS 预检伪造** | `src/background.js`：`onHeadersReceived` 引入 `ossCorsHostPattern` 命中 `*.aliyuncs.com` / `oss-*` / `*.zsae86.com` / `clbNN.*` 等 OSS 相关域名；命中后强制覆盖 `Access-Control-Allow-Origin/Methods/Headers/Expose-Headers/Max-Age`，显式列出 `Authorization` 与 `x-oss-*` 系列头（避开 `*` 不匹配凭据头的规范问题） |
| 49 | **OPTIONS 状态行改写** | `src/background.js`：命中 OSS 且 `method === 'OPTIONS'`、状态码非 2xx 时，在 `callback` 中把 `statusLine` 改写为 `HTTP/1.1 200 OK`，绕过源站/CDN 未正确处理预检的问题 |
| 50 | **非 OSS 请求行为隔离** | `src/background.js`：未命中 OSS 的请求保持原来的"仅在缺失时注入 + 多值去重"温和策略，避免全局过度放开 CORS |
| 51 | **上传 endpoint 强制 HTTPS** | `src/utils/upload.js` `ossUpload`：将传入的 `endpoint` 归一化为 `https://`，并设置 `ossOption.secure = true`，防止下发的 `http://` CNAME 触发混合内容 / 预检异常 |
| 52 | **上传域名连通性预检** | `src/utils/upload.js` `uploadFile`：在交给 ali-oss 之前，用 `getDomainListAllNormal(list, { objKey: "domainUrl" })` 先对动态 OSS CNAME 做一次 GET 探活，过滤掉明显不可达的节点 |
| 53 | **上传失败域名上报** | `src/utils/upload.js` `uploadFile`：捕获 `ossUpload` 异常后调用 `reportErrorDomain(domainUrl, { moduleCode: "ossEndpoint", ... })`，接入已有的域名池轮换/剔除逻辑 |
| 54 | **循环越界修复** | `src/utils/upload.js` `uploadFile`：for 循环 `i <= length` → `i < length`，消除多跑一次的隐患 |

### 设计决策

| 问题 | 方案 |
|------|------|
| 无 OSS Bucket 权限，改不了源站 CORS | 在主进程 `webRequest` 层按域名匹配伪造 200 响应，不动 `webSecurity: true`、不动渲染进程同源策略 |
| `Access-Control-Allow-Headers: *` 不匹配 `Authorization` | 显式枚举 ali-oss SDK 会发的 `Authorization` / `x-oss-date` / `x-oss-user-agent` / `x-oss-security-token` 等 header |
| 仅对预检改状态行，非预检保留真实状态 | 以 `details.method === 'OPTIONS'` 为条件，真正的 `PUT/POST` 分片仍能看到真实 4xx/5xx，不掩盖鉴权错误 |
| 伪造范围边界 | 正则限定 4 类 OSS 相关域名后缀，后续若新增 CNAME 后缀需要同步扩充 `ossCorsHostPattern` |
| 客户端防御 vs 服务端修复 | 客户端做兜底（归一化 + 预检 + 上报 + 伪造），但最终仍建议运维在 OSS Bucket / CNAME CDN 层正确配置 CORS，本次改动只为在当前无权限场景保住业务可用 |

### 已知局限

- 正则 `ossCorsHostPattern` 为 allow-list，若后端下发新的 CNAME 后缀（例如 `clb99.other.com`），需要同步更新，否则新节点不会被注入 CORS 头。
- 主进程伪造仅作用于 Electron 壳，直接用浏览器访问 `http://localhost:8080` 调试 dev server 时不生效，此场景仍需依赖源站 CORS。
- 对 DNS 解析失败 / TCP 连不上类错误，主进程无响应可改写，依赖客户端 `getDomainListAllNormal` 预检 + `reportErrorDomain` 轮换。

---

## 2026-04-16 — Electron 安全加固全量变更

> 一次性完成 `webSecurity: true`、CSP 策略、`contextIsolation` / `nodeIntegration` 迁移、通知窗口 XSS 防御及 HTTP 请求头注入，覆盖 Electron 渲染进程主要安全面。

### 涉及功能（测试清单）

| # | 用户操作路径 | 预期表现 | 涉及模块 |
|---|------------|---------|---------|
| 1 | 启动应用 → 主窗口正常渲染 | 页面加载无白屏、无控制台报错 | webSecurity / CSP / contextIsolation / preload |
| 2 | 聊天窗口 → 查看图片消息 | 本地缩略图正常显示 | `file://` → `local-resource://` 迁移 |
| 3 | 聊天窗口 → 播放语音消息 | 本地音频正常播放 | `file://` → `local-resource://` 迁移 |
| 4 | 聊天窗口 → 查看被引用的图片消息 | 引用中缩略图正常显示 | `file://` → `local-resource://` 迁移 |
| 5 | 聊天窗口 → 引用一条图片消息 → 输入框上方预览 | 引用预览图正常显示 | `file://` → `local-resource://` 迁移 |
| 6 | 聊天窗口 → 转发消息 → 预览面板 | 转发预览图正常显示 | `file://` → `local-resource://` 迁移 |
| 7 | 聊天窗口 → 粘贴/拖入本地文件 | 文件正常读取并发送 | `file://` → `local-resource://` 迁移 |
| 8 | 接收文件消息 → 自动下载解密 | 文件解密校验通过，不报错 | `file://` → `local-resource://` 迁移 |
| 9 | 聊天窗口 → 接收/展示富文本消息 | 包含本地图片的富文本正常渲染 | DOMPurify 白名单 |
| 10 | 聊天中点击图片 → 媒体播放器窗口 | 图片正常显示；缩放/旋转正常 | 媒体播放器 CSP + 脚本外部化 |
| 11 | 聊天中点击视频 → 媒体播放器窗口 | 视频自动播放；缩放/全屏正常 | 媒体播放器 CSP + 脚本外部化 |
| 12 | 媒体播放器 → "使用默认应用打开" | 调起系统默认应用打开该文件 | 路径解析 `local-resource://` → 本地路径 |
| 13 | 媒体播放器 → 底部查看文件路径 | 路径正确显示（无协议前缀） | `formatPathForDisplay()` |
| 14 | 媒体播放器 → 最小化 / 最大化 / 关闭 | 窗口控制按钮正常工作 | `onclick` → `addEventListener` |
| 15 | 聊天窗口 → 点击消息中的链接 | 正常跳转，无控制台 CSP 报错 | `javascript:void(0)` → `href="#"` |
| 16 | 所有涉及服务端 API 调用的操作（登录、发消息、拉列表等） | 请求正常返回，无 CORS 错误 | CORS 头注入 + 去重 |
| 17 | 开发环境 `npm run dev:test` → 热更新 | HMR 正常工作，无 CSP 拦截 eval | 开发环境 `unsafe-eval` 放行 |
| 18 | 收到新消息 → 弹出桌面通知 | 通知弹窗正常显示：昵称、内容、头像、表情 | 通知窗口 preload + XSS 防御 |
| 19 | 通知弹窗 → 点击通知跳转对话 | 点击后主窗口聚焦并跳转到对应会话 | 通知窗口 IPC |
| 20 | 通知弹窗 → 点击回复 → 输入内容 → 发送 | 回复功能正常 | 通知窗口 IPC |
| 21 | 聊天窗口 → 复制文本 / 粘贴 | 剪贴板操作正常 | clipboard 通过 preload 桥接 |
| 22 | 聊天窗口 → 发送消息（含表情） | 表情正常渲染，不出现 HTML 实体 | `escapeHtml()` + 表情替换顺序 |
| 23 | 聊天窗口 → 下载图片到本地 | 图片下载成功保存到本地 | `downloadFile()` preload 封装 |
| 24 | 窗口最小化 / 最大化 / 拖拽 | 窗口操作正常 | `windowControl` 代理 |
| 25 | 检查任意 API 请求的请求头（DevTools → Network） | 包含 `X-App-Version` 和 `X-Secret-Name` | HTTP 自定义请求头注入 |
| 26 | Firebase 统计上报 | 应用启动后 Firebase Analytics 事件正常发送 | `firebase-init.js` 外部化 |

---

### 一、启用 webSecurity: true

将所有 BrowserWindow 的 `webSecurity` 从 `false` 改为 `true`，恢复 Chromium 同源策略；`file://` 本地资源访问统一迁移到 `local-resource://` 自定义协议；主进程注入 CORS 响应头替代原先的全局豁免。

| # | 功能模块 | 修改内容 |
|---|---------|---------|
| 1 | **主窗口 webPreferences** | `src/background.js`：`webSecurity: false` → `true`；移除 `allowRunningInsecureContent: true` |
| 2 | **媒体播放器窗口** | `src/utils/media/MediaProcess.js`：`webSecurity: false` → `true` |
| 3 | **通知窗口** | `src/notification/index.js`：`webSecurity: false` → `true`；移除 `allowRunningInsecureContent: true` |
| 4 | **构建配置** | `vue.config.js`：`webSecurity: false` → `true` |
| 5 | **图片消息** | `msg/image.vue`：`file://` → `local-resource://` |
| 6 | **音频播放** | `msg/audio.vue`：`file://` → `local-resource://` |
| 7 | **引用消息缩略图** | `msg/quote.vue`：`file://` → `local-resource://` |
| 8 | **引用信息缩略图** | `send/quote-info.vue`：`file://` → `local-resource://` |
| 9 | **转发信息缩略图** | `send/forward-info.vue`：`file://` → `local-resource://` |
| 10 | **文件获取** | `send/editor.vue`：`fetch("file://"+url)` → `fetch("local-resource://"+url)` |
| 11 | **文件解密校验** | `src/event/file.js`：`checkFileCorrect` URL 协议替换 |
| 12 | **HTML 内容净化** | `src/utils/sanitizeHtml.js`：DOMPurify URI 白名单新增 `local-resource:` |
| 13 | **CORS 兼容** | `src/background.js`：`onHeadersReceived` 仅在缺失时注入 CORS 头，避免 `*, *` 重复 |
| 14–16 | **媒体播放器路径处理** | `media.html`：`ensureFileOrRemoteUrl()` / `fileUrlToLocalPath()` / `formatPathForDisplay()` 适配 `local-resource://` |

### 二、移除 bypassCSP，配置严格 CSP

移除 `app://` 和 `local-resource:` 协议注册中的 `bypassCSP: true`，为所有页面通过 `<meta>` 标签配置精细化 CSP；内联代码外部化以符合 CSP 要求。

| # | 功能模块 | 修改内容 |
|---|---------|---------|
| 17 | **`app://` 协议注册** | `src/background.js`：移除 `bypassCSP: true` |
| 18 | **主窗口 CSP** | `public/index.html`：新增 `<meta>` CSP — `script-src 'self' https://www.gstatic.com`; 开发环境动态追加 `'unsafe-eval'` |
| 19 | **媒体播放器 CSP** | `public/media/media.html`：新增 `<meta>` CSP — `script-src 'self'` |
| 20 | **媒体播放器样式外部化** | 内联 `<style>` 提取为 `public/media/media.css` |
| 21 | **媒体播放器脚本外部化** | 内联 `<script>` 提取为 `public/media/media.js`；`onclick` → `addEventListener` |
| 22 | **Firebase 脚本外部化** | 内联 `<script type="module">` 提取为 `public/firebase-init.js` |
| 23 | **CSP 模板语法修复** | `index.html`：lodash 模板内 `&quot;` → `"` 修复编译错误 |
| 24 | **开发环境 CSP 放行** | `index.html`：`script-src` 新增 `https://www.googletagmanager.com` |
| 25 | **主窗口 bypassCSP** | `src/background.js`：webPreferences 新增 `bypassCSP: true`（开发阶段） |
| 26 | **CORS 响应头去重** | `src/background.js`：`onHeadersReceived` 检测多值时去重，保留具体 origin |
| 27 | **javascript: URL 移除** | `lable-ele.vue`：`href="javascript:void(0)"` → `href="#"` + `@click.prevent.stop` |
| 45 | **`local-resource:` bypassCSP** | `src/background.js`：协议注册移除 `bypassCSP: true` |

### 三、contextIsolation: true / nodeIntegration: false 全局迁移

所有 BrowserWindow 切换为 `contextIsolation: true` + `nodeIntegration: false`，渲染进程不再直接访问 Node.js API，改由 preload 脚本通过 `contextBridge` 桥接。

| # | 功能模块 | 修改内容 |
|---|---------|---------|
| 28 | **主窗口 webPreferences** | `src/background.js`：`nodeIntegration: false`, `contextIsolation: true`, 新增 `preload` 路径 |
| 29 | **通知窗口 webPreferences** | `src/notification/index.js`：同上，新增 `notification-preload.js` |
| 30 | **主窗口 preload 脚本** | `public/preload.js`（新增）：`contextBridge.exposeInMainWorld('electronAPI', ...)` 暴露 ipcRenderer、shell、clipboard、windowControl、fs、path、os、Buffer 等 |
| 31 | **通知窗口 preload** | `public/notification-preload.js`（新增）：仅暴露 `ipcRenderer.send` / `on` |
| 32 | **Webpack 配置** | `vue.config.js`：`target: 'web'`；alias 将 `electron`、`@electron/remote`、`file-system` 指向 shim |
| 33 | **平台抽象层** | `src/platform.js`：完全重写，所有导出改为读取 `window.electronAPI` |
| 34 | **Webpack shim** | `src/shims/electron-renderer.js`、`electron-remote-renderer.js`、`file-system.js`（新增） |
| 35 | **Node 引用清理** | `tools.js`、`publicCache.js`、`cacheDB.js`、`clipboard.js`、`fileTools.js`、`upload.js`、`trendsDomain/*`、`trendsAesKey.js`、`event/msg.js`、`database/index.js`、`platformHelper.js`、`benchmark.js`：移除直接 `require('fs')`/`require('path')` 等，改为从 `@/platform` 导入 |
| 36 | **electron 引用清理** | `editor.vue`、`lockDomBeforeResize.js`：`import from 'electron'` → `@/platform` |
| 37 | **process.platform 迁移** | `base.js`、`common.js`、`config.js`：改为 `window.electronAPI.process.platform` |
| 38 | **通知页面** | `notification.html`：`require('electron')` → `window.electronAPI.ipcRenderer` |
| 39 | **downloadImageToLocal** | `fileTools.js`：`https.get` + `fs.createWriteStream` 改为 preload 的 `downloadFile()` |
| 40 | **Buffer 迁移** | `platformHelper.js`、`fileTools.js`：`Buffer.from()` → `BufferUtil.from()`；其余依赖 webpack polyfill |

**设计决策**

| 问题 | 方案 |
|------|------|
| IPC 通道迁移 | 保持 `ipcRenderer.send/invoke/on` 桥接，通道名不变，改动最小 |
| `@electron/remote` | 保留在 preload 中；渲染进程通过 `windowControl` 代理 |
| fs / path / os | preload 暴露子集 API；webpack target 切为 `web` |
| Buffer | webpack 4 内置 polyfill + 少量位置显式使用 preload `BufferUtil` |
| stream 跨 bridge | 不跨。`downloadImageToLocal` 改为 preload 封装的 `downloadFile` |

### 四、通知窗口 XSS 防御

修复通知窗口未对用户输入做 HTML 净化的 XSS 漏洞，新增 CSP。

| # | 功能模块 | 修改内容 |
|---|---------|---------|
| 41 | **用户输入净化** | `notification.html` 内联脚本提取为 `notification-app.js`；新增 `escapeHtml()` 转义用户可控字段 |
| 42 | **头像 URL 校验** | `notification-app.js`：新增 `safeSrc()` 白名单校验，拒绝 `javascript:` 等危险协议 |
| 43 | **内联事件移除** | `notification.html`：移除 `<img onerror="...">` |
| 44 | **通知窗口 CSP** | `notification.html`：新增 `<meta>` CSP — `script-src 'self'` 等 |

### 五、HTTP 请求注入自定义 Headers

主进程通过 `onBeforeSendHeaders` 为出站请求统一注入版本与密钥标识。

| # | 功能模块 | 修改内容 |
|---|---------|---------|
| 46 | **自定义请求头注入** | `src/background.js`：注入 `X-App-Version`（package.json version）和 `X-Secret-Name`（环境变量），仅在不存在时添加 |
| 47 | **路径黑名单** | `src/background.js`：`headerInjectBlacklist` 数组，匹配前缀时跳过注入 |
