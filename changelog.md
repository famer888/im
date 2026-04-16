# Changelog — 启用 webSecurity: true

> 日期：2026-04-16
>
> 目的：将所有 Electron 窗口的 `webSecurity` 从 `false` 改为 `true`，恢复 Chromium 同源策略，消除跨域安全风险。同时修复因此产生的本地文件加载与 CORS 问题。

---

## 变更清单

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

---

## 背景说明

### `webSecurity: false` 的风险

- **禁用同源策略**：渲染进程可向任意源发起请求，恶意注入的脚本可窃取数据
- **允许 `file://` 跨域访问**：`app://` 页面可直接读取本地任意文件
- **`allowRunningInsecureContent: true`**：允许 HTTPS 页面加载 HTTP 资源，存在中间人攻击风险

### 修复策略

| 原问题 | 解决方案 |
|--------|---------|
| 渲染进程用 `file://` 加载本地文件 | 改用项目已注册的 `local-resource://` 自定义协议（`registerLocalResourceProtocol`），该协议通过 Electron 的 `protocol.registerFileProtocol` 安全提供文件访问 |
| API 请求依赖 CORS 豁免 | 在主进程通过 `webRequest.onHeadersReceived` 为响应注入 CORS 头，仅在 Electron 层面处理而非完全关闭安全策略 |
| 混合内容加载 | 移除 `allowRunningInsecureContent`，强制使用安全连接 |
