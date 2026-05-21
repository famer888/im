# NativeImage 重构设计（design.md）

> 配合同目录 `description` 阅读。
> 约定：标题或条目带 `[本期]` 为本次迭代落地，带 `[预留]` 为占位/扩展点，先写接口与挂载位置但不实现。
> 范围：本期仅替换"头像"链路（`src/components/image.vue` + `Vue.component("ComImage", …)`），但所有抽象按"头像 + 图片消息 + 视频封面 (poster) + MediaCaption（仅布局壳）"的并集设计。
> 派生组件三家：`Avatar / Picture / Poster`。**没有 MediaCell**——`MediaCaption` 内 `<component :is>` 直接选 Picture/Poster，不再多一层包装（见 §3.4）。

---

## 0. 目标与非目标

### 0.1 本期目标
- 引入 `NativeImage` 基底组件：负责"拿到一个语义化 URL → 触发主进程下载+解密 → 拿到本地文件 / 状态 → 按 fallback 链路渲染"。
- 派生 `Avatar` 组件，替换现有 `ComImage`。
  - 文件落到独立的 `images/avatar/` 目录。
  - 无 loading、无 failure UI，任何失败一律 fallback 到 `<TextAvatar>` / 群组 / 频道默认 icon。
  - 动态域名：仅做"用 `ossDefaultUrl` 替换 host"，不做轮换/降权。
- 新建 `src/components/NativeImage/node/`，承接重写后的下载+解密流程（脱离 `webContents.downloadURL`，可拿到 HTTP 状态码）。
- 引入新的 custom URL pattern（替代 `local-resource://`，用于触发并消费 NativeImage 链路）。
- 状态机最小子集：`idle → resolving → downloading → decrypting → ready | expired | downloadError | decryptError`，通过 `taskId` 守卫消除 `description` 末尾 Q1/Q2 两类已知 bug。
- 全部代码集中在 `src/components/NativeImage/` 下，外部仅通过 `import NativeImage` / `import Avatar` 调用，禁止从其他位置拼装下载链路。

### 0.2 非目标（本期不做）
- 图片消息、视频 poster、MediaCaption 的迁移（仅预留派生位）。MediaCell 已从设计中取消（见 §3.4.3）。
- 进度条、动态域名轮换、降权、上报、并发控制、视界内判定、减数重试、多 slot 落库重新设计、点击打开 MediaView。
- DB schema 调整（仍走现有 `window.$db.updateMsgProperty` 接口，本期 Avatar 不入库）。

### 0.3 设计原则
- **单一职责**：renderer 只负责"声明我要什么图 + 提供 fallback"；node 负责"网络/磁盘/解密"；状态机串起来。
- **强幂等**：同一 `(scopeId, resourceKey)` 的多次请求合并为一次实际下载；后到的请求不退化前次成功状态（修复 Q1）。
- **工作目录与结果目录隔离**：下载/解密在 tmp 目录原子完成后 rename，渲染端永远只读"结果目录"中的最终文件（修复 Q2）。
- **可扩展派生**：派生组件只决定"语义 URL 怎么构造、fallback 怎么排、状态 → UI 怎么映射"，不重写下载链路。

---

## 1. 现状速写（why refactor）

| 现状 | 痛点 |
|---|---|
| `src/components/image.vue` 用 `<img :src>` 直接挂网图，错误时只能 fallback 到默认 icon | 无解密能力；动态域名只能在 `loadErr` 后做一次替换；和图片消息逻辑各写一遍 |
| `src/pages/.../msg/image.vue` 拼 `ipcRenderer.send('fileDownload', …)`，结果靠 `msgInfo.local` 字段经 IPC 回写 | 业务字段 (`local` / `localThumbUrl` / `local_${slot}`) 与"显示路径 / 错误标识 / 下载状态"混在同一字段，已经诱发 Q1/Q2 |
| 解密在 `src/event/file.js` 用 web Worker 跑 `crypto-js`，密文直接 `writeFileSync` 覆盖原下载路径 | Worker 写盘与 `Image` 探针读盘存在 truncate 竞态（Q2）；多次 `downloadFileDone` 触发只能靠 `_processedDownloadRequestIds` LRU 兜底 |
| `background.js` 用 `webContents.session.on('will-download') + webContents.downloadURL(url)` 触发下载 | 拿不到 HTTP 状态码，404/410（过期）和真·下载失败无法区分（对应 description #10） |
| 头像注册为全局 `ComImage`，调用点遍布 30+ 文件 | 改 props 牵动面广，需要保持外部 API 兼容 |

---

## 2. 目录结构

```
src/components/NativeImage/
├── index.js                # 仅导出 NativeImage / Avatar / 常量，外部唯一入口
├── plan/
│   ├── description         # 需求描述（已有）
│   └── design.md           # 本文件
│
├── NativeImage.vue         # 基底组件（[本期]）
├── Avatar.vue              # 派生：头像（[本期]）
├── Picture.vue             # 派生：图片消息（[预留]）
├── Poster.vue              # 派生：视频封面（[预留]）
├── MediaCaption.vue        # 派生：图说（[预留]）
│
├── core/
│   ├── customUrl.js        # 新 custom url pattern 编解码（[本期]）
│   ├── stateMachine.js     # 状态机定义与 reducer（[本期]）
│   ├── taskRegistry.js     # taskId 注册 / cancel token / 状态守卫（[本期]）
│   ├── fallback.js         # fallback 链路求值（[本期]）
│   ├── domain.js           # 动态域名 host 替换（[本期]，预留轮换接口）
│   └── constants.js        # 状态枚举 / 错误码 / 协议常量
│
├── ipc/
│   ├── channels.js         # IPC channel 名（renderer + node 共用）
│   ├── renderer.js         # renderer 侧封装：request / cancel / on(status)（[本期]）
│   └── (node/* 见下)
│
└── node/                   # 主进程逻辑（[本期] 仅 Avatar 链路必需）
    ├── index.js            # ipcMain.handle 注册入口
    ├── downloader.js       # 重写下载（拿到 statusCode、headers）（[本期]）
    ├── decryptor.js        # 解密器（默认 child_process 池；可降级 in-process）（[本期]）
    ├── headerCheck.js      # 加密文件头部预检（[本期]）
    ├── paths.js            # 工作目录 / 结果目录管理（[本期]）
    └── concurrency.js      # 并发控制 / 文件锁（[预留]，本期仅做"单 key 串行"）
```

> 所有"非 NativeImage 派生"的图片渲染都不允许直接 import `core/` / `node/`，统一过 `NativeImage` props 或派生组件。

---

## 3. 组件 API

### 3.1 `NativeImage`（基底，[本期]）

```text
props:
  url:           String               // 远端 / 本地 / custom-url，三种都允许
  encryptKey:    String?              // 有则走解密路径
  decrypted:     Boolean = false      // 上游已声明本资源不需要解密（fileKey 缺省时短路）
  scope:         { kind, id, sub? }   // 例：{ kind: 'avatar', id: <uid>, sub: 'friend' }
                                      //     用于落库目录 + taskId 命名空间
  resourceKey:   String               // 同 scope 内的唯一键；同 key 的请求强幂等
  fallback:      Array<FallbackEntry> // 见 §6
  slotIndex:     Number?              // [预留] 多图/视频 slot
  taskId:        String?              // [预留] 外部进度任务 id
  decryptHint:   { headerCheck?: true } // [本期] 是否启用头部预检
  resultDir:     String?              // [本期] 覆盖默认结果目录（Avatar 用 'images/avatar'）
  persistAdapter: PersistAdapter?     // [扩展] 落库策略，缺省 Noop；Picture/Poster/MediaCaption 各自注入；见 §14.3
  domainAdapter:  DomainAdapter?      // [扩展] 域名选择策略，缺省"replace host with ossDefaultUrl"；见 §14.4
  decryptAdapter: DecryptAdapter?     // [扩展] 替换解密实现（child_process 池 / 原生 addon / wasm），见 §14.5
  smPlugins:      Array<SmPlugin>?    // [扩展] 状态机插件：注册新状态/事件/守卫，见 §14.1
  wrapper:        Boolean | String | Component = true
                                      // 外层是否包 <span class="native-image" data-state="...">
                                      //   true  默认；span 自身 display:contents，仅作 data-state / CSS 锚点
                                      //   false 不包；组件根 = 内部 <img>/fallback 节点本身，class/$attrs 直接合并到该根
                                      //         （Avatar 走该路径，DOM 结构与旧 ComImage 一致）
                                      //   String / Component：作为自定义包裹标签/组件，同样挂 class + data-state

events:
  @status        ({ state, error?, localPath? })   // 每次状态变更
  @ready         ({ localPath })                   // ready 一次性
  @error         ({ state: 'expired'|'downloadError'|'decryptError', detail })
  @click, @contextmenu, @load, @error              // 透传 <img>

slots:
  default        // 正常态默认渲染 <img>，业务可覆盖（用于自定义 wrap / 圆角 / 标记）
  loading        // [预留] state ∈ {resolving, downloading, decrypting}
  expired        // state === 'expired'
  decryptError   // state === 'decryptError'
  downloadError  // state === 'downloadError'
  fallback       // 兜底 slot，等价于 fallback 链路最后一项命中
```

行为：
- mount → 调 `customUrl.encode(props)` 得到 `native-image://...`，存入 `<img :src>`。
- 自定义协议触发 main 进程下载/解密 → 通过 `streamProtocol` 直接返回最终文件流（不写消息体到 DB，避免 Avatar 触发不必要的落库）。
- 同步监听 `ipc/renderer.on('nativeImage:status', taskId)` 接收非渲染向状态变更（用于驱动 slot）。
- 默认 fallback 求值时机：`mounted` 即跑一次，每次 `state` 变化再跑一次；命中哪个 entry 就显示哪个 slot/默认 icon。

### 3.2 `Avatar`（派生，[本期]）

```text
props:
  src:        String        // 与现 ComImage 兼容（远端头像 URL）
  type:       'friend' | 'group' | 'channel'    // 决定默认 icon
  defaultUrl: String?       // 与现 ComImage 兼容
  name:       String?       // 用于 TextAvatar fallback 首字
  uid:        Number?       // 用于 TextAvatar 颜色
  size:       Number = 32
  encryptKey: String?       // 默认读 process.env.VUE_APP_HEAD_AES_KEY；业务侧可显式覆盖（如传 '' 表示未加密源）

emits:
  onClick(e), onContextmenu(e)   // 与现 ComImage 完全兼容
```

内部：
- `scope = { kind: 'avatar', id: uid, sub: type }`
- `resourceKey = sha1(src) || src`
- `resultDir = '<userData>/images/avatar/'`
- `encryptKey` 缺省 `process.env.VUE_APP_HEAD_AES_KEY`（与发送侧 AES-128-ECB key 对齐，见 §5.4.1），调用方传空串视为未加密源，直通 rename 落库
- `fallback = [defaultUrl, <type 默认 icon>, <TextAvatar slot>]`
- **不显示 loading**：`<NativeImage>` 默认 slot 渲染 `<img>` 即可；resolving/downloading/decrypting 三态阶段 fallback 求值 → 直接挂默认 icon（与现有"未加载完成则用 defaultIcon"行为对齐），下载/解密完成 `@ready` 再切到真图。
- **不显示 failure**：`expired / downloadError / decryptError` 一律 fallback 到 `<TextAvatar>` 或 `defaultIcon`，不报红。
- 保留 ctrl+click 复制头像地址逻辑（来自现 `image.vue`），平迁过去。

> 替换策略：保持 `Vue.component('ComImage', Avatar)` 全局别名一段时间，便于回滚。新代码直接 `import Avatar from '@/components/NativeImage'`。

### 3.3 派生占位（[预留]）

- `Picture`：状态由自身文件决定；fallback：[loading, expired, decryptError, downloadError, defaultBigIcon]
- `Poster`：状态默认 fallback 到 default overlay，仅当显式触发视频下载（点击播放 / 右键打开目录）才进入 expired/decryptError
- `MediaCaption`：仅为**布局壳**（CSS grid + caption），**不**承载状态管理逻辑；内部用 `<component :is="slot.kind === 'video' ? Poster : Picture">` 直接派单，**不再有 MediaCell 这一层**（见 §3.4）

### 3.4 MediasCaption / Cell 的"复杂度蒸发"（取代现 `medias-caption.vue + medias-caption-cell.vue + msg-type-17.js` 渲染端 ~700 行）

> 现复杂度根源是"状态被鸭子类型在 `local_${i} / percent_${i} / thumb_${i}` 字段里"，每个 cell 必须各自跑下载、各自解析字符串、各自维护并发队列。新设计把这一切搬到 base + 状态机 + schema，派生层只剩布局。

#### 3.4.1 旧职责 → 新接管者

| 旧职责 | 新接管者 | UI 还需关心？ |
|---|---|---|
| 解析 `content`（`image:url\|\|thumb\|\|...` / `video:url*Pthumb\|\|...`） | `utils/mediasCaptionParser.js` 纯函数 | 否，UI 拿到 `Array<{kind, url, thumb, width, height, duration}>` |
| 维护 `local_${i} / percent_${i} / thumb_${i}` 字段 | `msg.nativeImage.slots[K].{m}` + §13.5 派生 | 否 |
| 各 cell 各跑下载/解密生命周期 | base 内部 `taskRegistry` + 状态机 + `native-image://` 协议 | 否 |
| `createFifoConcurrencyQueue(3)` 限流 | `node/concurrency.js`（[预留]，按 `scope.kind` 配上限） | 否 |
| `waitMediaSlot` slot 排队 | 状态机以 `scope+resourceKey` 强幂等，天然不重复 | 否 |
| `bindVideoThumbPropertyUpdate` 跨进程 thumb 广播 | `slots[K].poster` 写入触发派生组件 reactive 重渲染 | 否 |

#### 3.4.2 新 `MediaCaption.vue`（约 50 行）

```text
<template>
  <div class="media-caption" @click.right="(e) => $emit('rightClick', { e, info: msgInfo })">
    <div class="grid" :style="{ '--cols': cols }">
      <component
        v-for="(slot, i) in slots"
        :key="`${msgInfo.customMsgId}-${i}`"
        :is="slot.kind === 'video' ? Poster : Picture"
        :scope="{ kind: slot.kind, id: msgInfo.customMsgId, sub: String(i) }"
        :resource-key="slot.url"
        :encrypt-key="msgInfo.fileKey"
        :url="slot.url"
        :slot-index="i"
      />
    </div>
    <div v-if="caption" class="caption">{{ caption }}</div>
  </div>
</template>

<script>
import { parseMediasCaptionContent } from '@/utils/mediasCaptionParser'
import { Picture, Poster } from '@/components/NativeImage'

export default {
  name: 'MediaCaption',
  props: ['msgInfo'],
  components: { Picture, Poster },
  computed: {
    parsed()  { return parseMediasCaptionContent(this.msgInfo.content) },
    slots()   { return this.parsed.slots },
    caption() { return this.parsed.caption },
    cols()    { return Math.min(3, this.slots.length) },
  },
}
</script>
```

零状态、零 IPC、零生命周期 hook（除 mount/unmount，那些已经在 `<Picture>`/`<Poster>` 里）。

#### 3.4.3 不要 MediaCell 这一层
原始想法是引入 `MediaCell.vue` 作为"polymorphic dispatcher"（按 `slot.kind` 选 Picture/Poster），便于挂右键菜单 / 拖拽选择 / hover overlay。**后期决定取消**：
- `<component :is="slot.kind === 'video' ? Poster : Picture">` 在 MediaCaption 模板里只是一行，**抽不出剥夺感知**。
- 拖拽选择 / 右键菜单 / hover overlay 这类"网格级 UI 行为"已经在 `MediaCaption` 的容器层完成（事件代理 + slotIndex 定位），cell 包装层提供的封装收益小、维护成本不低。
- 多一层组件，多一份 props 透传、多一份 emit 声明、多一次 reactive 依赖追踪——属于"为可能性付费"的反模式。

如果未来真的出现某种必须 per-cell 持有状态的场景（如格子级 selection 高亮），优先选择**在 MediaCaption 里维护 `selectedSlot` 状态 + CSS 类切换**，而不是回头加 MediaCell。

#### 3.4.4 边界：上传路径暂不归 NativeImage 管

`msg-type-17.js` 的 `handleMsgType17Send`（含 `createFifoConcurrencyQueue` 用于上传并发、`sharedMediasCaptionFileKey` 等）是**发送侧**逻辑，与本设计的"接收 + 显示"链路解耦：

- 本期不动，仍由 `event/file.js + msg-type-17.js` 处理。
- 接 description #15「上传时直接 copy 到本地」时，再设计 `NativeImageUpload` 派生 + `UploadAdapter`，与 base 共享 `paths.js`、`taskRegistry`，[预留]。

---

## 4. 新 Custom URL Pattern

替换现有 `local-resource://` 的直接落盘 URL，改为携带语义的 `native-image://`，仅服务 NativeImage 链路，独立于 `xpy:` deep-link 与 `local-resource://`。

### 4.1 协议形态

```
native-image://<scope.kind>/<scope.id>[/<scope.sub>]/<resourceKey>?u=<base64url(url)>&k=<encryptKey>&v=<schemaVersion>
```

- 不在 URL 里塞 query 之外的业务字段，便于 Chromium 缓存命中（同 key 同 URL，自然命中浏览器层缓存）。
- `resourceKey` 必须是稳定哈希（如 `sha1(originalUrl)` 取前 32 位），不要直接放原始 URL，否则 OSS 签名变化每次都 cache miss。
- 注册阶段：`app.on('ready')` 之前调用 `protocol.registerSchemesAsPrivileged([{ scheme: 'native-image', privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: false, corsEnabled: true } }])`。

### 4.2 主进程注册

`background.js` 启动时由 `NativeImage/node/index.js` 注册：

```text
protocol.registerStreamProtocol('native-image', async (request, callback) => {
  const desc = customUrl.decode(request.url)
  const { state, stream, statusCode, headers } = await pipeline.resolve(desc)
  callback({ statusCode, headers, data: stream })
  // 同时通过 webContents.send('nativeImage:status', { taskId, state }) 通知 renderer
})
```

- 走 `registerStreamProtocol` 的关键收益：HTTP 语义齐全，`<img>` 的 `naturalWidth`/`onerror` 与浏览器原生一致；statusCode=410 / 404 时 renderer 直接拿到 `expired` 信号（对应 description #10、#16）。
- `native-image://` **仅** main 进程能解析；外部脚本伪造 URL 不会命中真实磁盘（安全性优于裸 `local-resource://`）。
- 仍保留 `local-resource://` 协议，本期不删（图片消息组件还在用）。

### 4.3 与 `description` #15「新 custom url pattern」对齐
本设计即落地该条；同时 description #16「重写 node 的下载，不要用 .downloadUrl」由 §5.2 落地。

---

## 5. Node 侧链路（NativeImage/node/）

### 5.1 总流水线

```
native-image:// 命中
   │
   ▼
taskRegistry.acquire(scope, resourceKey)        // 同 key 复用 in-flight Promise（修 Q1）
   │  hit → 直接返回上次 stream
   ▼
paths.resolveResult(scope, resourceKey)         // <userData>/images/<scope.kind>/<resourceKey>.bin
   │  存在 + 文件健康 → 直接返回 fs stream  → state=ready
   ▼
downloader.fetch(url)                           // 见 §5.2
   │  4xx/410/404 → state=expired               // 不 retry，渲染端 fallback
   │  其他失败    → state=downloadError
   ▼
[encryptKey 存在?]
   ├─ 否 → 工作文件 rename 到结果目录 → state=ready
   └─ 是 ↓
headerCheck.verify(workPath, encryptKey)        // [本期] 简单 magic 检查（见 §5.4）
   │  失败 → state=decryptError
   ▼
decryptor.decrypt(workPath, encryptKey) → tmpPath
   │  失败 → state=decryptError
   ▼
fs.rename(tmpPath, resultPath)                  // 原子（修 Q2）
   │
   ▼
state=ready，返回 fs.createReadStream(resultPath)
```

整个流程被 `taskRegistry` 包成单个 in-flight Promise；多个 `native-image://` 请求同时到达只跑一次，剩下的 await 同一 Promise。

### 5.2 重写的 downloader（取代 `webContents.downloadURL`）

- 主进程内用 `net.request`（Electron `net` 模块走 Chromium 网络栈，沿用现有 session 的 cookie/proxy/cert/CORS 策略）。
- 写入 **工作目录** `<userData>/images/.work/<resourceKey>-<random>.part`，写完后才参与 rename。
- 暴露：
  ```text
  download(url, { onProgress?, cancelToken, timeoutMs })
    → { statusCode, headers, workPath } | throws { code: 'EXPIRED'|'NETWORK'|'TIMEOUT'|'ABORT', cause }
  ```
- 收益：
  - 拿到 HTTP 状态码：`410 / 404 / 403(signature expired)` 一律映射 `expired`，其余网络失败 `downloadError`（落 description #10）。
  - 支持 cancelToken：派生组件卸载时主动 abort（落 description #7）。
  - 进度事件挂着但 Avatar 不订阅（[预留] description #2）。

### 5.3 decryptor（child_process 池）

- 默认实现：维护一个 `min=1, max=2` 的 worker 进程池（`child_process.fork('node/decryptor.worker.js')`），跑等价于现 `public/worker.js` 的 AES-128-ECB 解密逻辑。
- 协议：父子之间走 `process.send({ inPath, outPath, key })`，子端读流→分片解密→写流→ack；不在 main 进程做大块同步 CPU。
- **关键改动**：不再"原地覆写"。子进程写到 `tmpPath = workPath + '.dec'`，父进程收到 ack 后 `fs.rename(tmpPath, resultPath)`（这一步是 §5.6 描述的原子性根本来源）。
- 若性能不达标（Avatar 通常很小，估计单次 < 200ms），打印一次 `console.warn('[NativeImage] decrypt > 500ms, consider native')`，符合 description #6「有性能问题的话提醒下」。

### 5.4 headerCheck（description #4，加密文件头部预检）

> 目的：在把字节流交给 `decryptor`（child_process 池）之前花 ~30 字节的代价过滤掉**已知坏输入**，避免吃满 CPU 跑一遍解密只为得到一个 `decryptError`。Avatar 缺省 `encryptKey = VUE_APP_HEAD_AES_KEY` 即走这条路径，Picture/Poster 共用。

#### 5.4.1 现况上下文（约束 headerCheck 能做什么）

发送侧实际用的是 `public/worker.js` 的 AES-128-ECB + PKCS7：
- key = `fileKey` 的前 16 字节 UTF-8（消息级 sharedFileKey）
- 分块大小 102416 字节（≈ 100KB+16），每块独立 PKCS7 padding
- 文件结构：`[102416 cipher][102416 cipher]...[final cipher block(变长但 16 对齐)]`
- **没有自定义 magic / version 头部**

可推论：
- 任意合法加密图片文件大小必然是 16 字节倍数，且 ≥ 16。
- 整文件大小 < 102416 时只有 1 个 cipher block。
- 头部完全是 AES 密文 → 看起来**像随机数据**；这是 headerCheck 能利用的最重要特征。

#### 5.4.2 检查项（按代价从低到高排）

> 业务现状：同一 `encryptKey` 下并存"老的已加密文件"与"灰度去加密后的明文文件"。
> 所以"明文 magic 命中"是**合法快路径**而非错误 —— `verify()` 返回 `{ ok: true, plain: true }`，
> pipeline 据此跳过 decryptor 直接 commit（见 §5.4.4 与 §7 状态机新增的
> `VERIFYING --START_COMMIT--> COMMITTING` 转移）。

| # | 检查 | 命中后判定 | 防的是 |
|---|---|---|---|
| 1 | `fileSize >= 16` | `decryptError(reason='tooSmall')` | 空文件 / 极小残片（下载阶段已被 `downloadError` 拦掉一部分） |
| 2 | 前 16 字节匹配已知**明文图片 magic**：`\x89PNG\r\n\x1a\n`、`FFD8FF`（JPEG）、`GIF87a/GIF89a`、`RIFF....WEBP`、`II*\0`/`MM\0*`（TIFF）、`BM`（BMP）、`\0\0\0\?\?ftyp`（HEIF/HEIC） | `ok: true, plain: true` —— pipeline 跳过 decryptor 直 commit | 区分"未加密源"，避免对明文头像跑一次 AES 浪费 CPU 并误判 `decryptError` |
| 3 | `fileSize >= 32`（业务约定：真实加密图片最小 cipher ≥ 32） | `decryptError(reason='suspiciousSize')` | 上游返回了 0-pad 后凑数的"几乎空文件"（仅在 #2 未命中时检查，即"既不是已知明文格式又太小"） |
| 4 | `fileSize % 16 === 0` | `decryptError(reason='notBlockAligned')` | 文件被截断；或被中间人替换为非 AES 产物（同样仅在 #2 未命中时检查 —— 明文 PNG/JPEG 本来就允许任意字节长度） |
| 5 | 前 16 字节的 Shannon 熵 ≥ 7.0 bits/byte（粗略判 "够随机"） | 不通过则 `warn`（不拒绝），打日志便于排查 | 仅作弱信号，**不**作为终止条件——AES-ECB 头部短样本熵不一定很高，硬卡会误杀 |

> 检查顺序固定为 1 → 2 → 3 → 4 → 5：先卡"绝对损坏"，再判明文（命中即短路返回 plain），
> 最后才用块对齐 / 熵这些"只对密文成立"的形状约束做剩余兜底。

#### 5.4.3 不在 headerCheck 里做的事（明确边界）

| 不做 | 原因 |
|---|---|
| 验证 fileKey 是否正确 | AES-ECB 没有 key check 字段；除非整文件解出后再判，否则无法在头部判定 |
| 校验完整性 hash | 服务端没有提供 hash 字段；引入需要协议改动 |
| 检测中间区块损坏 | 头部看不出；只能靠 §5.3 解完后跑 `<img>` 探针（图片）/ ffprobe（视频） |
| 验证 PKCS7 padding 是否合法 | 需读文件**末尾** 16 字节，I/O 多一次；可选实现，对 100KB+ 文件其实代价仍低 → 列为可选项 §5.4.5 |

#### 5.4.4 头部预检在状态机里的位置

完整路径见 §5.1。具体到 headerCheck 的状态机映射（与 §7.2、§13.3 一致）：

```
[downloading] ──START_VERIFY──▶ [verifying]
                                     │
                          headerCheck.verify() 内部:
                              read first 32B → 检查项 1~5
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │ ok                         │ ok + plain                 │ fail
        ▼                            ▼                            ▼
START_DECRYPT (event)        START_COMMIT (event)          VERIFY_FAIL (event)
        │                            │                            │
        ▼                            ▼                            ▼
[decrypting]                  [committing]                  [decryptError]
                          (跳过 decryptor，                error.code ∈ {tooSmall|
                           原文件直接 rename               suspiciousSize|
                           入结果目录)                     notBlockAligned|
                                                          workerFailed}
```

注：`plainText` 不再是错误码 —— 改走"ok + plain"快路径。原 `error.code` 集合相应剔除。

DB 落库直接体现在 `slots[K].{m}.error.code`，UI 拿到的就是结构化原因，可在 description 提到的"图片文件解密失败" 后期改造为更细颗粒提示。

#### 5.4.5 可选增强（[预留]，本期不做）
- **尾部 PKCS7 padding 检查**：读末 16 字节解密，验 `lastByte ∈ [1,16]` 且最后 `lastByte` 字节相同。catches 末块被截或 padding 攻击；但需要 key（必须在解密器内做）。可降为：仅在 `decryptError(reason='workerFailed')` 后回头跑一次精确诊断。
- **服务端协议层加 magic 头**：长期最干净；要求服务端约定（描述 #15 重写 custom url pattern 时一并谈）。
- **抽样块解密体检**：读中间随机偏移 16 字节先解出，看是否像图片 chunk。代价 ≈ 一个 block decrypt，命中率高，但需要 key 进 headerCheck（破坏当前"无 key 也能做预检"的轻量定位） → 暂列预留。

#### 5.4.6 接口签名（base 一次成型）

```text
// src/components/NativeImage/node/headerCheck.js
async function verify(workPath, encryptKey, { maxHeadBytes = 32 } = {}) =>
  | { ok: true,  plain: true, magic: 'PNG'|'JPEG'|..., headBytes: Buffer } // 明文快路径
  | { ok: true,  headBytes: Buffer }                                       // 形状像密文，走 decryptor
  | { ok: false, reason: 'tooSmall' | 'suspiciousSize' | 'notBlockAligned',
                  detail: { fileSize, head?: hexString } }
```

- `encryptKey` 当前**不使用**，但留在签名里以便 §5.4.5 任一增强落地时无需改调用方。
- 返回 `headBytes` 供 §5.3 decryptor 复用首块，省一次磁盘 read。

### 5.5 paths（结果目录 vs 工作目录）

| 目录 | 路径 | 用途 | 清理策略 |
|---|---|---|---|
| 结果目录（按 scope.kind 分） | `<userData>/images/avatar/` 等 | 渲染端 / Chromium 缓存最终命中点 | 不清，可被 §5.7 状态机管理 |
| 下载工作目录 | `<userData>/images/.work/download/` | 接收 net.request 流 | 进程启动时清空 |
| 解密工作目录 | `<userData>/images/.work/decrypt/` | 解密 worker 写盘临时 | 进程启动时清空 |

对应 description #14：「下载完成的目录跟解密完成的目录隔离」。Avatar 的 result 目录固定 `images/avatar/`，未来 Picture/Poster 各自独立。

### 5.6 原子性

- 工作目录与结果目录在**同盘**（都在 `userData` 下）才能保证 `fs.rename` 原子。
- rename 前若 result 目录已存在同名文件，先 unlink 再 rename；renamed 完成才向 renderer 抛 `state=ready`。
- 这一性质直接消除 Q2：渲染端读到的永远是已完整 rename 的最终文件，不会撞到"写一半"。

### 5.7 taskRegistry / 状态守卫（修 Q1）

数据结构：
```text
Map<scope+resourceKey, {
  taskId,         // monotonic
  state,
  inflight: Promise<Result>,
  cancel: () => void,
  subscribers: Set<webContentsId>,
}>
```

规则：
1. 同 key 第二个请求 → 直接复用 `inflight`，订阅 `subscribers`，不重启下载。
2. 任何 `state` 变更必须满足：`canTransition(prev → next)`（见 §7 状态机）。
3. 已经 `ready` 的 key，在没有显式 invalidate 的前提下，禁止回退到 `downloading/decrypting/...Error`。
4. 卸载（renderer 通知 `nativeImage:cancel`）时只断订阅；其他订阅者还在则继续；订阅者为空则触发 cancel token。

→ 直接解决 description Q1：「success → decrypting → decrypt failed」不可能再出现，因为状态机拒绝该转移。

### 5.8 taskId 规则（description #17）

```
taskId = `${scope.kind}:${scope.id}:${resourceKey}:${monotonic()}`
```

- `scope+resourceKey` 部分用于幂等查找；尾部 `monotonic()` 用于在外部 progress 系统区分"同 key 多次重试"。
- Avatar 本期不订阅 progress，但 taskId 仍照此生成，便于 Picture/Poster 平移。

---

## 6. Fallback 链路

`fallback` prop 是有序数组，求值时第一个"可用"项胜出。

```text
FallbackEntry =
  | { kind: 'url',       value: string }                 // 远端或本地 URL
  | { kind: 'asset',     value: require('@/assets/...') }
  | { kind: 'slot',      name: string }                  // 渲染指定具名 slot
  | { kind: 'component', value: VueComponent, props }     // 例如 TextAvatar
  | { kind: 'state',     when: StateName, then: FallbackEntry } // 状态相关
```

求值规则（自上而下）：
1. 若 `state === 'ready'` 且有 `localPath`，直接显示，跳过 fallback。
2. 否则按数组顺序找第一个匹配项：
   - `state` 类型条目：仅在 `when === currentState` 时考虑其 `then`；
   - 其他类型条目：总是匹配。
3. 命中后渲染（slot > component > url/asset 普通 `<img>`）。

Avatar 的 fallback（[本期]）：
```text
[
  { kind: 'url',       value: props.defaultUrl, condition: !!defaultUrl },
  { kind: 'state',     when: 'expired',       then: { kind: 'asset', value: defaultIcon[type] } },
  { kind: 'state',     when: 'downloadError', then: { kind: 'asset', value: defaultIcon[type] } },
  { kind: 'state',     when: 'decryptError',  then: { kind: 'asset', value: defaultIcon[type] } },
  { kind: 'component', value: TextAvatar, props: { value: name, id: uid, ... } },
  { kind: 'asset',     value: defaultIcon[type] },
]
```

> description #5 列的 `default slot / loading / decrypt error / expired / download error` 全部对应到这里；本期 Avatar 不需要 loading，所以 `state==='downloading'` 时按"普通条目从头取"，自然命中 `defaultUrl` 或 `defaultIcon`。

---

## 7. 状态机

每一个 `(scope, resourceKey)` 在 `taskRegistry` 中拥有一台独立的状态机；同 key 的多个 NativeImage 实例订阅同一台状态机（不会各自跑一份）。状态机本体位于主进程 `core/stateMachine.js`，renderer 只是镜像观察者。

### 7.1 状态集

| 状态 | 性质 | 含义 | 渲染端表现 |
|---|---|---|---|
| `idle` | 起始 | 任务未创建 / 已 cancel 释放 | fallback 链路按非 ready 求值 |
| `resolving` | 中间 | 解析 customUrl、查结果目录缓存、replay 动态域名、taskRegistry 注册 | fallback 链路（同 idle） |
| `downloading` | 中间 | `net.request` 在飞 | fallback 链路；可订阅 `progress` 事件（本期 Avatar 不订阅） |
| `verifying` | 中间 | 已下载到 `.work/download/`，跑 headerCheck | fallback 链路 |
| `decrypting` | 中间 | child_process 解密中，写到 `.work/decrypt/` | fallback 链路 |
| `committing` | 中间 | 解密/直通完成，正在 `fs.rename` 到结果目录 | fallback 链路 |
| `ready` | **终态-成功** | 结果文件 ok 落盘 | 直接显示 `<img>` |
| `expired` | **终态-业务失败** | HTTP 4xx/410/404（含 OSS 签名过期） | 显示 `expired` fallback |
| `downloadError` | **终态-临时失败** | 其他网络错误 / 超时 | 显示 `downloadError` fallback |
| `decryptError` | **终态-临时失败** | headerCheck 失败 或 解密失败 | 显示 `decryptError` fallback |

> 把 `verifying / committing` 拆出来是为了让 description Q2 那种"读到写一半的解密文件"在状态机上不可表示——renderer 只在 `state === 'ready'` 后才允许把结果文件当真图，而 `ready` 的进入条件就是 rename 完成。

### 7.2 事件集

```text
MOUNT          // 组件挂载 / 新订阅者加入（idempotent，可能直接命中 ready）
START_FETCH    // resolve 后没命中本地缓存，需要下载
START_VERIFY   // 下载完成且 encryptKey 存在
START_DECRYPT  // headerCheck 通过
START_COMMIT   // 直通 (无 encryptKey) 或 解密 完成
COMMITTED      // fs.rename 成功
HTTP_4XX       // downloader 报出 EXPIRED
HTTP_FAIL      // downloader 报出 NETWORK / TIMEOUT
VERIFY_FAIL    // headerCheck 拒绝
DECRYPT_FAIL   // child_process 解密失败
CANCEL         // 最后一个订阅者退订（unmount / src 变更）
INVALIDATE     // 调用方显式要求重跑（强制跳过本地缓存）
UNSUBSCRIBE    // 订阅者减一但还有人在听（不触发 CANCEL）
```

### 7.3 转移表（含 entry action）

| from | event | to | entry action |
|---|---|---|---|
| `idle` | `MOUNT` | `resolving` | `taskRegistry.acquire`，命名空间内分配新 `taskId` |
| `resolving` | 缓存命中 | `ready` | 直接打开结果文件流 |
| `resolving` | `START_FETCH` | `downloading` | `domain.rewriteHost` + `downloader.fetch`，挂 `cancelToken` |
| `downloading` | `START_VERIFY` | `verifying` | 读前 32B，`headerCheck.verify` |
| `downloading` | `START_COMMIT` | `committing` | 无 encryptKey 直通，准备 rename |
| `downloading` | `HTTP_4XX` | `expired` | 释放 .part；不重试 |
| `downloading` | `HTTP_FAIL` | `downloadError` | 释放 .part；本期不重试，[预留] 减数重试 |
| `verifying` | `START_DECRYPT` | `decrypting` | `decryptor.decrypt` 提交到池 |
| `verifying` | `VERIFY_FAIL` | `decryptError` | 释放工作文件 |
| `decrypting` | `START_COMMIT` | `committing` | 子进程 ack，得到 `tmpPath` |
| `decrypting` | `DECRYPT_FAIL` | `decryptError` | 释放工作文件 |
| `committing` | `COMMITTED` | `ready` | `fs.rename` 成功，更新 result manifest |
| `committing` | `HTTP_FAIL` (rename 失败) | `downloadError` | 罕见路径：跨盘退化失败，[预留] |
| 任意中间态 | `CANCEL` | `idle` | 触发 cancelToken；清 .work 文件 |
| 任意中间态 | `UNSUBSCRIBE` | *不变* | 仅 `subscribers.delete(id)` |
| `ready` | `MOUNT` | `ready` | 仅订阅；不重启 |
| `expired / downloadError / decryptError` | `MOUNT` | *不变* | 仅订阅；新组件直接看见终态 |
| `expired / downloadError / decryptError` | `INVALIDATE` | `resolving` | `taskId++`，并把结果文件标记 `skipCache=true` |
| `ready` | `INVALIDATE` | `resolving` | 同上；强制重新下载 |

### 7.4 不变量（invariant）

1. **单调成功**：进入 `ready` 之后，除非显式 `INVALIDATE`，否则不允许任何转移。直接堵死 description Q1「success → decrypting → decrypt failed」。
2. **结果文件单写者**：只有 `committing` 状态的 entry action 能写结果目录；任何中间态都只允许写 `.work/`。配合 §5.6 的 rename，描述 Q2「读到写一半」从状态层面不可表示。
3. **taskId 单调**：每次 `idle → resolving` 或 终态 `INVALIDATE → resolving` 都 `++taskId`；renderer 收到 `status` 事件时如发现 `taskId < self.taskId`，直接丢弃（防 IPC 乱序）。
4. **订阅者归零**：`subscribers.size === 0` 立即触发 `CANCEL`，避免 description Q2 中"前一下载完成解密完成后，第二个下载仍在跑"的资源浪费。
5. **错误不污染缓存**：所有 `*Error / expired` 终态不会写入结果目录；下一次 `INVALIDATE` 必然走完整 fetch 链。

### 7.5 ASCII 总图

```
                ┌──────────────────────────────── INVALIDATE ────────────────────────────────┐
                │                                                                              │
                ▼                                                                              │
[idle] ── MOUNT ──▶ [resolving] ──cache hit──────────────────────────────▶ [ready] ───────────┘
                          │
                    START_FETCH
                          ▼
                    [downloading] ── HTTP_4XX ───▶ [expired] ─────INVALIDATE─────▶ [resolving]
                          │       ── HTTP_FAIL ──▶ [downloadError] ─INVALIDATE──▶ [resolving]
                          │
              ┌── encryptKey? ──┐
              │ yes             │ no
              ▼                 ▼
        [verifying]        [committing] ── COMMITTED ──▶ [ready]
              │ VERIFY_FAIL ──▶ [decryptError] ────INVALIDATE────▶ [resolving]
              │
        START_DECRYPT
              ▼
        [decrypting] ── DECRYPT_FAIL ──▶ [decryptError] ──INVALIDATE──▶ [resolving]
              │
        START_COMMIT
              ▼
        [committing] ── COMMITTED ──▶ [ready]

任意中间态 ── CANCEL (订阅者归零) ──▶ [idle]
```

### 7.6 与多机联动（description #20）
- 单组件单状态机即可覆盖 Avatar。
- Picture/Poster 后续若需要"主图状态 ↔ 缩略图状态"两机联动，以 `taskId` 关联，`taskRegistry` 增加 `linkedTaskIds`：主图 `expired` 时联动缩略图自动 `INVALIDATE`，[预留]。
- 视频消息（`SlotState.kind === 'video'`）固定运行两台同级状态机 `poster` 和 `video`，**不互相联动**：poster 决定显示态、video 仅在用户点击播放时驱动。两者在 schema 里独立存储（§13.6），状态机本身完全相同，不需要任何特例化。

### 7.7 状态机 ↔ Schema 诚实性
状态机的"诚实"由两侧夹逼证明，详见 §13.3 / §13.7：

- **正向**：§7.2 每一条转移在 §13.3 都有且仅有一条 DB 写入路径，写入只触碰 `slots[K].{machine}` 子键。
- **反向**：§13.7 列的所有"非法 schema 形态"在状态机里都不可表示（如 `state==='ready'` 且 `resourcePath===null`）。

> Review checklist：动状态机 §7.2 时**必须**同步过 §13.3 表；schema 加字段时**必须**回头检查是否引入新的可表达但状态机无对应转移的形态。

---

## 8. 动态域名

### 8.1 本期范围
- `core/domain.js` 暴露：
  ```text
  rewriteHost(originalUrl) // 只把 host 替换为 ossDefaultUrl，逻辑与 manageOssDownUpload.getOssFirstNormalUrl 等价
  ```
- 调用时机：`pipeline.resolve` 入口先 `rewriteHost(desc.url)`，得到的新 URL 用于 `downloader.fetch`。

### 8.2 预留
- 轮换 / 降权 / 上报（description #1）接口先定义：
  ```text
  selectHost(originalUrl, { failedHosts, channelType }) → newUrl
  reportHost(host, reason)
  ```
  本期返回 `getOssFirstNormalUrl(url)` 直通，标记 TODO。
- 失败重试（description #11、#19）在 downloader 的 cancelToken / retry 钩子里挂 TODO 注释。

---

## 9. IPC 契约

`NativeImage/ipc/channels.js`：

```text
const Channels = {
  resolve:    'nativeImage:resolve',    // renderer → main (request/response, ipcRenderer.invoke)
  status:     'nativeImage:status',     // main → renderer (broadcast)
  cancel:     'nativeImage:cancel',     // renderer → main
  invalidate: 'nativeImage:invalidate', // renderer → main，强制终态 → resolving
}
```

renderer 流程：
1. 进 `mounted` → 构造 customUrl → 直接挂到 `<img :src>`；这是常态流程，不走 ipcRenderer.invoke。
2. 同时 `ipcRenderer.invoke(Channels.resolve, { scope, resourceKey, url, encryptKey })` 拿 `taskId`，并注册 `status` 监听。

> 两条通道并存：customUrl 经由 `registerStreamProtocol` 走的是浏览器网络栈，得到的是"图片像素流"；`status` 走 IPC，得到的是"状态变更事件"。前者是必经路径，后者用于 fallback slot 切换。

---

## 10. 与现有代码的耦合点 / 迁移步骤

### 10.1 不动的部分
- `src/event/file.js` 整条下载/解密链路保持原样，继续承担"图片消息 + 视频消息"，本期不重写。
- `local-resource://` 协议保持注册，图片消息仍依赖。
- `manageOssDownUpload.getOssFirstNormalUrl` 不动，仅被 `core/domain.js` 包装。

### 10.2 替换的部分
1. 新建上述 `NativeImage/` 目录与文件。
2. `src/main.js` 把 `Vue.component("ComImage", ComImage)` 改为：
   ```text
   import { Avatar } from '@/components/NativeImage'
   Vue.component('ComImage', Avatar)   // 别名兼容
   ```
3. `src/background.js`：
   - 启动时 `require('./components/NativeImage/node').register({ userData, mainWindow })`。
   - 与 `registerLocalResourceProtocol` 并列注册 `native-image`。
4. 调用点（30+ 文件）暂不动，靠 `Avatar` 兼容 `src/v-old ComImage` 的 props（`src/type/defaultUrl/@onClick/@onContextmenu`）。
5. `Avatar` 直接替换旧 `image.vue`：本次重构不引入运行期开关、不保留旧实现路径；`src/components/image.vue` 在 §13 的 M4 一次性删除。

### 10.3 与 description Q1/Q2 的对应
- Q1（状态回退）：由 §5.7 + §7.2 拒绝非法转移消除。
- Q2（多 IPC 注册导致写盘竞态）：由 §5.6 工作目录原子 rename + §5.3 「不再原地覆写」消除；renderer 端无需再像 `file.js` 那样靠 `_processedDownloadRequestIds` 兜底。

---

## 11. 测试计划（本期 Avatar）

| 用例 | 场景 | 预期 |
|---|---|---|
| A1 | 普通头像 URL，使用默认 `VUE_APP_HEAD_AES_KEY` 加密 | downloader 拉成功 → headerCheck pass → decryptor 解出 → rename → `<img>` 显示真图 |
| A1b | 业务侧显式 `encryptKey=""`（未加密源） | downloader 拉成功 → 跳过 headerCheck / decrypt → rename → `<img>` 显示真图 |
| A2 | `src=null` | 直接命中 fallback → 显示 `defaultIcon[type]` 或 TextAvatar |
| A3 | 远端 404 | state=`expired` → 显示默认 icon，不报红，不重试 |
| A4 | 远端 5xx / 网络断 | state=`downloadError` → 显示默认 icon |
| A5 | 头像 ctrl+click | 触发复制原始地址，与现有行为一致 |
| A6 | 同一头像在列表里出现 100 次 | 仅发起 1 次 net.request（taskRegistry 命中） |
| A7 | 用户头像变更（src 改变）→ resourceKey 变更 | 触发新 taskId、新下载，旧 task cancel |
| A8 | 头像组件 unmount in flight | downloader 收到 cancel，工作文件清理（不残留 .part） |
| A9 | 重启 App | 直接命中 `<userData>/images/avatar/` 缓存，无网络请求 |
| A10 | 动态域名切换（ossDefaultUrl 变化） | 下一次 resolve 用新 host；老的已 ready 文件继续命中本地缓存 |
| A11 | encryptKey 错误（构造异常 key） | headerCheck pass → decryptor 抛 `workerFailed` → state=`decryptError` → fallback 到默认 icon |
| A12 | 明文图片但带了 encryptKey | headerCheck 命中 `plainText` → state=`decryptError` → fallback 到默认 icon |

> 缺省 encryptKey 为 `VUE_APP_HEAD_AES_KEY`，集成测试默认走加密路径；A1b 用例覆盖业务侧透传空串的未加密短路。

---

## 12. 扩展性契约（base 与派生 / DB / 状态机的边界）

> 这一节是给"后期需求"（Picture / Poster / MediaCaption / 进度 / 域名轮换 / 减数重试 / 多机联动 / DB 重新设计）预先签的合同。**所有派生功能必须只通过本节列出的 6 个扩展点接入；任何绕过的修改都视为破坏基底。**

### 12.1 状态机：开放事件 + 锁定终态

为了避免后期一个新需求就改 `stateMachine.js` 源码，状态机改用「**核心 + 插件**」两层：

```text
core:
  states:  { idle, resolving, downloading, verifying, decrypting,
             committing, ready, expired, downloadError, decryptError }   ← 锁定
  events:  { MOUNT, UNSUBSCRIBE, START_FETCH, HTTP_4XX, HTTP_FAIL,
             START_VERIFY, VERIFY_FAIL, START_DECRYPT, DECRYPT_FAIL,
             START_COMMIT, COMMITTED, CANCEL, INVALIDATE }                ← 锁定
  invariants: §7.4 五条                                                   ← 锁定

plugins (Array<SmPlugin>):
  - addStates(['paused', 'outOfView', 'retrying', 'linkedWaiting'])      // 仅中间态可加
  - addEvents(['PAUSE', 'RESUME', 'ENTER_VIEW', 'LEAVE_VIEW', 'RETRY'])
  - addTransitions([
      { from: 'downloading', event: 'PAUSE',  to: 'paused' },
      { from: 'paused',      event: 'RESUME', to: 'downloading' },
      { from: 'idle',        event: 'LEAVE_VIEW', to: 'outOfView' },
      { from: 'outOfView',   event: 'ENTER_VIEW', to: 'resolving' },
      ...
    ])
  - addGuards({ INVALIDATE: ({prev, slot}) => slot.expiredAt > Date.now() - 4*86400e3 })
  - addMiddleware(async (prev, next, ctx) => { /* logging / metric */ })
```

**硬规则**：
1. **终态不可扩展**：终态集（`ready / expired / downloadError / decryptError`）由 base 锁定；插件**不能**新增终态。任何新失败模式必须复用现有 3 个错误终态，原因是 §7.4 的 5 条不变量都建立在"终态有限"上。
2. **invariant 不可削弱**：插件不能放宽"单调成功"等不变量；可以**附加**更严的转移守卫。
3. **核心事件不可改语义**：插件可加新事件，不能 override `MOUNT/CANCEL/INVALIDATE/COMMITTED/...` 的现有处理。
4. **state 命名空间**：插件新增的状态必须带前缀（如 `ext:paused`），避免与核心同名。

具体业务对照（description 全 21 条）：

| description | 落地方式 | 是否动 base |
|---|---|---|
| #1 动态域名轮换/降权/上报 | `domainAdapter` 插件 | 否 |
| #2 上传/下载进度 | base 已经在 `downloading/committing` 期间通过 `@progress` 事件吐数据；插件无需改状态机 | 否 |
| #3 slotIndex 多图视频 | base 的 `scope+resourceKey` 自然区分；DB 层由 `persistAdapter` 决定多 slot 原子性 | 否 |
| #7 cancel token | base 已实现 `CANCEL` 事件 | 否 |
| #9 视界内判定 | `smPlugins` 注册 `ext:outOfView` 状态 | **否**（开放扩展） |
| #11 4 天 expired 短路 | `smPlugins` 注册 `INVALIDATE` 的 `addGuards`，命中即维持 `expired` 终态 | **否** |
| #12 并发控制 / 时序锁 / 文件锁 | `node/concurrency.js` 内部强化，对状态机透明 | 否 |
| #13 多 slot 落库 | `persistAdapter` 实现 | 否 |
| #18 点击打开 MediaView | 派生层（如 Poster）自己处理 click 事件 | 否 |
| #19 减数重试 | `smPlugins` 注册 `ext:retrying`，在 `downloadError → resolving` 之间插入计数衰减 | 否 |
| #20 多状态机联动 | `taskRegistry.linkedTaskIds` + `smPlugins` 监听对端状态 | 否 |

### 12.2 派生 → 基底契约（边界硬约束）

派生**只能**通过 4 个面接触 base：

```
┌─────────────────────────────────┐
│  Derived (Avatar/Picture/...)   │
└──────────┬──────────────────────┘
           │ ① props (含 plugins / adapters)
           │ ② events (@status @ready @error @progress)
           │ ③ slots (default / loading / *Error 等)
           │ ④ scope.kind (在 taskRegistry 里做命名空间隔离)
           ▼
┌─────────────────────────────────┐
│  NativeImage (base)             │
│  core/ + ipc/ + node/           │
└─────────────────────────────────┘
```

**派生禁止**：
1. `import .../NativeImage/core/*` 或 `.../node/*`（用 ESLint `no-restricted-imports` 强制：`src/components/NativeImage/core/**` 只允许被 `NativeImage.vue` import）。
2. 直接 `ipcRenderer.invoke('nativeImage:*', ...)`（用 ESLint 自定义规则禁掉，统一过 `ipc/renderer.js` export 的方法）。
3. 直接读写结果目录（`paths.resolveResult(...)` 不 export，对派生不可见）。
4. 修改 base props 的默认值或新增 base 状态。

**派生鼓励**：
1. 把自己的"本地业务状态机"（如 Poster 的 `playing/paused/cover-only`）建在派生组件内部，**叠加**在 base 状态机之上，而不是塞进 base。
2. 通过 `persistAdapter` 完成入库，绝不让 base 知道 DB schema。
3. 通过 `smPlugins` 注入业务专属状态/事件。

### 12.3 PersistAdapter（落库反转控制）

base **永远不写数据库**。所有落库由调用方注入的 adapter 完成。

```text
interface PersistAdapter {
  // 组件 mount 时让 adapter 提供一份初始快照（用于"重启 App 后状态恢复"）
  hydrate(scope, resourceKey): Promise<Snapshot | null>

  // 每次状态机转移后 base 调用，adapter 自行决定写哪张表 / 写哪个字段
  // 必须满足：同 (scope, resourceKey) 的多次 persist 按 taskId 单调写入，stale 丢弃
  persist(scope, resourceKey, snapshot): Promise<void>

  // 显式失效（如：用户主动清缓存、消息被撤回）
  invalidate(scope, resourceKey): Promise<void>
}

type Snapshot = {
  state:        StateName
  taskId:       string          // 主进程 monotonic taskId，DB 层用于 stale check
  resourcePath: string | null   // 仅 state==='ready' 非空
  error:        { code, detail, at } | null
  slotIndex:    number | null
  updatedAt:    number          // 主进程时钟，毫秒
  ext:          Record<string, any>  // 派生自定义扩展字段（slot 完成时间、4天过期判定时间戳等）
}
```

派生实现样例：

| 派生 | adapter | 写到哪 |
|---|---|---|
| `Avatar` | `NoopPersist` | 不写库；只依赖文件系统缓存 |
| `Picture` | `MsgPropertyPersist` | 通过 `$db.patchMsgNativeImage` 写 `msg.nativeImage.slots[K].image`（§13） |
| `Poster` | `MsgPropertyPersist` | 同上，写 `msg.nativeImage.slots[K].poster`；video 点击后再写 `slots[K].video` |
| `MediaCaption` | `MediaCaptionPersist`（[预留]） | 写新表 `media_caption_states`，多 slot 原子事务（description #13、#21） |

**关键收益**：
- description Q1/Q2 已经在状态机层堵死；这里再叠一层「DB 也按 taskId 单调写」的语义，IPC 乱序回退在 DB 层也表现为 no-op。
- 全新 schema：`msg.nativeImage` 是图片/视频显示态的**唯一**真实数据源；不存在"字段混存路径和错误标识"（旧 `msg.local = "decryptionError"` 形态）这种污染（详见 §13）。

### 12.4 DomainAdapter（描述 #1）

```text
interface DomainAdapter {
  pick(originalUrl, { attempt, failedHosts, channelType }): Promise<string>
  report(host, { reason, statusCode? }): Promise<void>
}
```

- 本期：`OssDefaultDomainAdapter` = 现 `getOssFirstNormalUrl`，`report` 为空。
- 后期：实现轮换/降权/池上报，base 完全不感知。

### 12.5 DecryptAdapter（描述 #6）

```text
interface DecryptAdapter {
  verifyHeader(headBytes, encryptKey): { ok: boolean, reason? }
  decrypt({ inPath, outPath, encryptKey, signal }): Promise<void>
}
```

- 本期：`ChildProcessAesEcbAdapter`，写 `outPath = inPath + '.dec'`，父进程负责 rename。
- 后期：性能不足时切 `NativeAesAdapter`（C++ addon）或 `WasmAesAdapter`，无需 base 改动。

### 12.6 多派生干扰矩阵

base 通过下面这张矩阵保证任意派生组合不会互相影响：

| 派生 | scope.kind | resultDir | encryptKey | smPlugins | persistAdapter | 与其他派生关系 |
|---|---|---|---|---|---|---|
| Avatar | 'avatar' | `images/avatar/` | - | - | Noop | 完全独立 |
| Picture | 'picture' | `images/picture/<msgId>/` | √ | - | MsgPropertyPersist | 与 Poster 通过 msg 索引共享，不共享 task |
| Poster | 'poster' | `images/poster/<msgId>/` | √ | ext:playing/paused | MsgPropertyPersist | linkedTaskIds 关联视频文件 task（[预留]） |
| MediaCaption（仅布局壳） | 不创建自己的 task；按 slot 转交给 Picture/Poster | 复用 | √ | - | 不写库 | 仅是 grid 容器，不参与 taskRegistry |

> 旧设计里 `MediaCell` 作为"纯订阅者 / join existing task"是因为 cell 与 caption 内部需要状态拷贝；新设计 MediaCaption 直接渲染 Picture/Poster 实例，**没有 cell 层**，也就没有"订阅者派生"。如果未来真出现需要 `join existing task`（如同一张图被多处复用），用 `Picture` 自己的 `scope+resourceKey` 命中已存在的状态机即可——不需要新派生类型。

**隔离保证**：
- `taskRegistry` 以 `scope.kind + scope.id + resourceKey` 为 key，不同 kind 永不串台。
- `resultDir` 由 base 计算，派生只能传"结果根目录"（如 `images/poster`），子路径 (`<msgId>/`) 由 base 用 scope.id 拼接，避免派生写到其他 kind 的目录。
- 同 `scope.kind + scope.id + resourceKey` 的多个 Picture/Poster 实例自动 join 同一 task（§5.7 taskRegistry.acquire 已支持），不需要"订阅者派生"这种二等公民概念。

### 12.7 不做双写 / 不做旧版本兼容

本次重构状态机 + DB schema 一律以新版本为准，**不与旧 `msg.local / msg.localThumbUrl / msg.local_${i} / thumb_${i} / percent_${i}` 字段做任何双写或反向兼容**：

- `MsgPropertyPersist.persist` 只写新字段 `msg.nativeImage.slots[K].{m}`（§13.4），**不**回写旧字段。
- `MsgPropertyPersist.hydrate` 只反序列化 `msg.nativeImage`；遇到只有旧字段的"历史消息"直接返回 `null`，让 base 跑完整流水线（缓存命中即直接 ready，没命中则重新下载/解密）。
- 旧字段在迁移期由 DB schema migration 一次性清除；不存在"双写期 / 灰度期"，没有"先写新再写旧、读优先新"这种合流逻辑。
- 派生组件（Picture/Poster/MediaCaption）接入 NativeImage 时，调用点完全切换到新 schema；老 UI 路径同步下线，不保留运行期开关。

> 这与 §14.3 提到的 `local-resource://` 共存不同：`local-resource://` 是**协议层**临时保留（图片消息尚未接 NativeImage），与 DB 字段双写无关。所有显式涉及 `msg.local*` / `thumb_${i}` / `percent_${i}` 的代码路径都在 NativeImage 接入时一次性删除。

---

## 13. DB Schema 演进路线（[预留]）

> 本节是状态机的**诚实性体检**：任何在状态机里能表达的合法转移、任何 description 列的消息形态（单图 / 视频 / 图视频混合多格），都必须能在 schema 里**无歧义、原子、符合直觉**地落库；任何写不进去的形态都是状态机/schema 设计漏洞。

### 13.1 目标

1. 消除"字段混存路径与错误标识"（现 `msg.local = "decryptionError"`）。
2. **视频消息**：UI 显示状态以 **poster** 为准；video 文件是次状态机，仅"点击播放"流程涉及。两机独立落库，UI 聚合层做选择。
3. **多格子**（description #13）：每个 slot、每台状态机独立 `updatedAt`；写 slot N **不读、不写** slot M。
4. schema 直觉：「一条消息 = 一组格子，每个格子按 kind 携带 1~2 台状态机」，不塞混合字段、不靠位运算约定。
5. 全新 schema 单一真相源：UI / 派生 / 状态机一律只读写 `msg.nativeImage`，**不**与旧 `msg.local*` / `thumb_${i}` / `percent_${i}` 字段共存或双写（§12.7）。

### 13.2 核心结构

```text
# msg 表新增一个 JSON 字段（新版本唯一显示态来源；旧 msg.local* / thumb_${i} / percent_${i} 由 migration 一次性清除）
msg.nativeImage = {
  schemaVersion: 1,
  layout: 'image' | 'video' | 'mixed',          // 来自消息体；schema 不靠自检
  slots: {
    [slotKey: string]: SlotState                // slotKey: "main" | "0" | "1" | ...
  },
  aggregated: {                                  // 派生，每次 slot 写入后由 persistAdapter 重算
    state: 'ready' | 'pending' | 'expired' | 'downloadError' | 'decryptError',
    updatedAt: number,                           // = max(任一 Machine.updatedAt)
  }
}

SlotState = OneOf:
  | { kind: 'image', image:  Machine }
  | { kind: 'video', poster: Machine, video: Machine }
  // [预留] 'audio' 等未来类型 base 不动

Machine = {
  state:        StateName,                       // = §7.1 的 10 个值，1:1 对应
  taskId:       string,                          // 主进程 monotonic taskId
  resourcePath: string | null,                   // 仅 state === 'ready' 非空
  error:        { code, detail, at } | null,     // 终态 *Error / expired 时非空
  expiredAt:    number | null,                   // 消息体时间 + 4 天，由 #11 INVALIDATE 守卫拦截
  updatedAt:    number,                          // 主进程时钟，毫秒
}
```

**slotKey 用字符串不用数组**：避免"空洞 slot"歧义；IndexedDB 子键路径也更稳。单图/单视频固定 `"main"`，UI 读出后不必做"是否多 slot"分支。

### 13.3 状态机 → DB 写入映射表（诚实性体检）

每个状态机转移**有且仅有一条写入路径**。如果某个合法转移无法在 schema 里写出，或 schema 里能写出的形态在状态机里没有对应转移，就是漏洞。

| §7 状态机转移 | DB 写操作（针对 `slots[K].{m}`，其中 `m ∈ {image, poster, video}`） | 是否触碰其他 slot/Machine |
|---|---|---|
| `idle → resolving` | `state='resolving', taskId=T, updatedAt=now` | 否 / 否 |
| `resolving → ready` (缓存命中) | `state='ready', resourcePath, error=null, taskId, updatedAt` | 否 / 否 |
| `resolving → downloading` | `state='downloading'` | 否 / 否 |
| `downloading → verifying` | `state='verifying'` | 否 / 否 |
| `downloading → committing`（无 encryptKey） | `state='committing'` | 否 / 否 |
| `downloading → expired` | `state='expired', error={code:'HTTP_4XX',...}, taskId, updatedAt` | 否 / 否 |
| `downloading → downloadError` | `state='downloadError', error={code:'NETWORK',...}` | 否 / 否 |
| `verifying → decrypting` | `state='decrypting'` | 否 / 否 |
| `verifying → decryptError` | `state='decryptError', error={code:'HEADER_CHECK_FAILED',...}` | 否 / 否 |
| `decrypting → committing` | `state='committing'` | 否 / 否 |
| `decrypting → decryptError` | `state='decryptError', error={code:'WORKER_FAILED',...}` | 否 / 否 |
| `committing → ready` | `state='ready', resourcePath, error=null, taskId, updatedAt` | 否 / 否 |
| 任意中间态 `→ idle`（CANCEL） | **不写 DB**（重启后下次 MOUNT 重跑） | – |
| 任意终态 `→ resolving`（INVALIDATE） | `state='resolving', taskId=T+1, resourcePath=null, error=null, updatedAt` | 否 / 否 |

写入后 `persistAdapter` 在同一 IndexedDB tx 里重算 `aggregated`（§13.5），所以**一次状态机转移 = 一次原子写入 = 一次 slot 子键 patch + 一次 aggregated 重算**。

> 这张表就是"诚实性"的形式化合同：审核状态机改动时，必须同步过这张表，否则 PR 不能合。

### 13.4 原子性：单 slot 单 Machine 的子键 patch

为了让 §13.3"否 / 否" 成立，**不能**用现 `updateMsgProperty` 整段 read-modify-write `msg.nativeImage`（并发会丢更新）。新 API：

```text
$db.patchMsgNativeImage({
  msgId,
  patches: [
    { slotKey: 'main' | '0' | ..., machine: 'poster' | 'image' | 'video', machineState: Machine },
    ...
  ]
}) ⇒ 内部一个 IDBTransaction:
   1. cursor 拿到 msg 行（readwrite）
   2. for each patch: msg.nativeImage.slots[slotKey][machine] = machineState
                       msg.nativeImage.slots[slotKey].kind ||= 推断(machine)
   3. recompute msg.nativeImage.aggregated
   4. put 整行
   // IDB 串行化跨调用：同 msgId 的两次并发 patch 自然排队，永不互相覆盖
```

**关键性质**：
- **slot 隔离**：slot N 的 patch 不读 slot M 的内容；并发的 slot N / slot M 各排各的 tx，互不影响。
- **Machine 隔离**：同 slot 的 `poster` 与 `video` 互不读写，符合"video 状态不影响 poster 状态"的语义需求。
- **批量原子**：同一 tx 内可以同时 patch 多个 slot / 多个 Machine（例如初始 hydrate、批量 INVALIDATE 9 格），仍原子。
- **唯一写入路径**：所有 `msg.nativeImage` 写入必须经 `patchMsgNativeImage`；`updateMsgProperty` 与旧字段 (`msg.local*` / `thumb_${i}` / `percent_${i}`) 不再被 NativeImage 链路触碰（§12.7）。

### 13.5 派生：消息级聚合状态（UI 入口）

UI 列表/缩略只读 `aggregated.state`，不应自己枚举 slots。`aggregated` 在每次 patch 末尾由 `persistAdapter` 重算：

```text
displayStateOfSlot(slot) :=
  slot.kind === 'image' ? slot.image.state
                        : slot.poster.state          // ← 视频以 poster 为准；video 永远不影响显示态

aggregated.state := reduce(slots, displayStateOfSlot):
  if any displayState ∈ {expired, downloadError, decryptError} → first such (按 slotKey 升序)
  else if all displayState === 'ready'                          → 'ready'
  else                                                          → 'pending'   // 所有中间态合并展示
```

- 单图：`aggregated.state === slots.main.image.state`。
- 单视频：`aggregated.state === slots.main.poster.state`；`slots.main.video.state` **不影响**。
- 多格混合：取第一个错误终态，否则 ready / pending。

> "视频消息以 poster 状态决定" 这一业务规则在 schema 里**仅由 §13.5 第一行表达**——不在 base 状态机里、不在 base 组件里。状态机只管自己的 10 态，"显示哪个" 是聚合层的视图职责。这样将来若头像消息也允许"以缩略图状态决定"，再加一个 `displayStateOfSlot` case 即可，base 完全不动。

### 13.6 三种消息形态的实例

#### 单图

```text
msg.nativeImage = {
  schemaVersion: 1,
  layout: 'image',
  slots: {
    "main": { kind: 'image', image: { state:'ready', resourcePath:'.../a.jpg', taskId:'t1', updatedAt: 1700000001, expiredAt: 1700345601, error: null } }
  },
  aggregated: { state: 'ready', updatedAt: 1700000001 }
}
```

#### 单视频（封面 ready，未点击播放）

```text
msg.nativeImage = {
  schemaVersion: 1,
  layout: 'video',
  slots: {
    "main": {
      kind: 'video',
      poster: { state:'ready', resourcePath:'.../poster.jpg', taskId:'t1', updatedAt: 1700000002, expiredAt: 1700345602, error: null },
      video:  { state:'idle',  resourcePath: null,            taskId: null, updatedAt: null,        expiredAt: null,        error: null }
    }
  },
  aggregated: { state: 'ready', updatedAt: 1700000002 }     // ← poster 决定，与 video.idle 无关
}
```

> 点击播放后 `slots.main.video` 走完 `idle → resolving → downloading → committing → ready`；`aggregated.state` **不会改变**（poster 没变），但 MediaView 直接读 `slots.main.video.state` 即可显示视频。

#### 4 格混合（image, image, video, video），中间态

```text
msg.nativeImage = {
  schemaVersion: 1,
  layout: 'mixed',
  slots: {
    "0": { kind:'image', image: { state:'ready',       resourcePath:'.../0.jpg', taskId:'t1', updatedAt: 1700000001, expiredAt: 1700345601, error: null } },
    "1": { kind:'image', image: { state:'expired',     resourcePath: null,       taskId:'t2', updatedAt: 1700000003, expiredAt: 1700345603, error: { code:'HTTP_404', at: 1700000003 } } },
    "2": { kind:'video', poster:{ state:'downloading', resourcePath: null,       taskId:'t3', updatedAt: 1700000004, expiredAt: 1700345604, error: null },
                          video: { state:'idle',       resourcePath: null,       taskId: null, updatedAt: null,         expiredAt: null,        error: null } },
    "3": { kind:'video', poster:{ state:'ready',       resourcePath:'.../3p.jpg', taskId:'t4', updatedAt: 1700000005, expiredAt: 1700345605, error: null },
                          video: { state:'idle',       resourcePath: null,       taskId: null, updatedAt: null,         expiredAt: null,        error: null } }
  },
  aggregated: { state: 'expired', updatedAt: 1700000005 }   // slot "1" 命中错误终态优先
}
```

**为什么"符合直觉不复杂"**：
- 三段命名空间正交：`slotKey → kind → machine`。看到 `slots["2"].poster.state === 'downloading'` 不会和 `slots["1"].image` 串台；看到 `slots["3"].video.state === 'idle'` 立即知道"这一格视频文件还没被点过"。
- 没有"哪个字段代表错误"的二义：`error` 字段非空当且仅当 `state ∈ {*Error, expired}`。
- 没有"路径还是错误标识"的占位污染：`resourcePath` 只在 `state === 'ready'` 时为字符串，否则严格 `null`。

### 13.7 非法写入会被 schema 直接拒绝（反向证明诚实性）

| 非法写入 | 拒绝方式 |
|---|---|
| 把 `video.state = 'expired'` 当成"视频过期" UI 展示 | 不行，UI 只读 `displayStateOfSlot(slot)`，video 永远不影响显示。`aggregated.state` 不会变 expired。要让 UI 看到"视频过期"必须改 poster 状态或叠加业务态（属于 Poster 派生的 `smPlugins`） |
| 写 `image.resourcePath` 非空但 `state !== 'ready'` | `patchMsgNativeImage` 在写入前断言 `(state==='ready') ⟺ (resourcePath !== null)`；不一致直接抛错 + 写错误日志 |
| 跨 slot 的 read-modify-write 整段 `nativeImage` | `updateMsgProperty` 路径**禁止**写 `nativeImage` 字段（ESLint + DB 层双重拦截）；只允许走 `patchMsgNativeImage` |
| 把 `error` 写在 `state === 'ready'` 上 | 同 row-level invariant，断言 `error === null ⟺ state ∈ {non-error states}`，违反抛错 |
| 同 msgId 并发写 slot 0 / slot 1 互相覆盖 | IDB 自动串行化同 store 同 key 的 readwrite tx；无须应用层加锁 |

这五条加起来等价于"schema 反过来约束状态机不可越界"。

### 13.8 MediaCaption（description #21，[预留]）
- 不需要新表：MediaCaption 是消费 `msg.nativeImage` 的视图组件，状态由 `aggregated.state` 派生。
- 若一个 caption 跨多条 msg，加一张 `media_caption_index` 表存 `captionId → [msgId, ...]`，状态仍从被引用 msg 的 `aggregated` 派生，**不重复落库**，避免双向同步。

### 13.9 真实多图视频消息的写入轨迹（msgType=17 mediasCaption）

> 取一条 4 格 (`image, image, video, video`) `msgType=17` 消息，对端接收后由 `MediaCaption` 在内部 v-for 渲染 4 个 `<Picture>` / `<Poster>`（**没有 cell 包装层**）；每个组件实例对应一个 slot 的状态机。下面按时间序列出 `msg.nativeImage` 的实际形态。

#### 13.9.1 消息体原始字段（DB 内已存在，不归我们管）

```text
msg = {
  MsgID:        "m_a1b2c3",
  customMsgId:  "m_a1b2c3",
  msgType:      17,                          // mediasCaption
  chatType:     17,
  channelId:    "ch_42",
  fileKey:      "abc1234567890def",          // sharedMediasCaptionFileKey，4 个 slot 共享
  sendTime:     "1700000000000",
  caption:      "周末团建素材",
  content:      "image:https://r22.zhenyoumei.top/.../0.enc||https://r22.../0_thumb||1024||0|||"
              + "image:https://r22.zhenyoumei.top/.../1.enc||https://r22.../1_thumb||2048||0|||"
              + "video:https://r22.zhenyoumei.top/.../2.mp4.enc*Phttps://r22.../2_poster||10||5000000||1280||720|||"
              + "video:https://r22.zhenyoumei.top/.../3.mp4.enc*Phttps://r22.../3_poster||8||3000000||1920||1080"
              + "##caption##周末团建素材",
  // 新版本唯一显示态来源；旧 msg.local_${i} / thumb_${i} / percent_${i} 由 migration 一次性清掉（§12.7）
  nativeImage: ...                            // 见下
}
```

`MediaCaption` 通过 `utils/mediasCaptionParser.js` 解析 `content` 字符串得到 4 个 slot 的 `kind` 和远端 URL；`fileKey` 是消息级，4 个 slot 共享。

#### 13.9.2 T0 — 刚入库，消息列表还没渲染到这条

```text
msg.nativeImage = {
  schemaVersion: 1,
  layout: 'mixed',
  slots: {},                                 // 空 — 没有任何 NativeImage mount 过
  aggregated: { state: 'pending', updatedAt: 1700000000000 }
}
```

> 没有 mount 就没有状态机，`slots` 为空 map 而非"4 个 idle"。这一条很重要：避免 hydrate 时凭空合成幽灵状态。

#### 13.9.3 T1 — 列表滚到这条，MediaCaption v-for 出 4 个 Picture/Poster 同时 mount

每个 cell 实例化一个 `NativeImage`：
- slot 0/1 (image)：1 台 `image` 状态机；
- slot 2/3 (video)：2 台同级 `poster` + `video` 状态机；`video` 用户没点，保持 `idle`。

`patchMsgNativeImage` 在**同一个** IDBTransaction 内提交 4 条 patch（base 知道这是批量 MOUNT，会合并发送）：

```text
patches = [
  { slotKey: '0', machine: 'image',  machineState: { state:'resolving', taskId:'t#1', ... } },
  { slotKey: '1', machine: 'image',  machineState: { state:'resolving', taskId:'t#2', ... } },
  { slotKey: '2', machine: 'poster', machineState: { state:'resolving', taskId:'t#3', ... } },
  { slotKey: '3', machine: 'poster', machineState: { state:'resolving', taskId:'t#4', ... } },
  // slots[2].video / slots[3].video 不写：保持隐式 idle，由 schema 默认值表达
]
```

写入后：

```text
msg.nativeImage = {
  schemaVersion: 1,
  layout: 'mixed',
  slots: {
    "0": { kind:'image', image:  { state:'resolving', taskId:'t#1', resourcePath:null, error:null, expiredAt:1700345600000, updatedAt:1700000100000 } },
    "1": { kind:'image', image:  { state:'resolving', taskId:'t#2', resourcePath:null, error:null, expiredAt:1700345600000, updatedAt:1700000100000 } },
    "2": { kind:'video', poster: { state:'resolving', taskId:'t#3', resourcePath:null, error:null, expiredAt:1700345600000, updatedAt:1700000100000 } },
    "3": { kind:'video', poster: { state:'resolving', taskId:'t#4', resourcePath:null, error:null, expiredAt:1700345600000, updatedAt:1700000100000 } }
  },
  aggregated: { state: 'pending', updatedAt: 1700000100000 }
}
```

> slot 2/3 的 `video` 字段**故意不写入**：派生层一旦发现 `slots[K].kind==='video'` 且 `slots[K].video===undefined`，按"video 处于 idle，从未被点击"语义渲染，不消耗一行 DB。

#### 13.9.4 T2 — 4 个下载并行；poster 命中已加密路径

4 条独立的 net.request 同时在飞；每台状态机 `resolving → downloading` 各自发一次 patch（**不同 slot 不同 tx，互不阻塞**）：

```text
slots["0"].image.state  = 'downloading'      // t#1
slots["1"].image.state  = 'downloading'      // t#2
slots["2"].poster.state = 'downloading'      // t#3
slots["3"].poster.state = 'downloading'      // t#4
aggregated.state        = 'pending'
```

#### 13.9.5 T3 — slot 1 远端 404；slot 0/2/3 进入 verifying

```text
slots["0"].image  : downloading → verifying        // 已下载到 .work/，跑 headerCheck
slots["1"].image  : downloading → expired          // HTTP 4xx
  ↳ machineState = { state:'expired', taskId:'t#2', resourcePath:null,
                     error:{ code:'HTTP_404', detail:{ status:404 }, at:1700000150000 },
                     updatedAt:1700000150000, expiredAt:1700345600000 }
slots["2"].poster : downloading → verifying
slots["3"].poster : downloading → verifying
aggregated.state  = 'expired'                       // slot 1 命中错误终态，aggregated 立即翻
aggregated.updatedAt = 1700000150000
```

此刻 schema：

```text
msg.nativeImage = {
  schemaVersion: 1,
  layout: 'mixed',
  slots: {
    "0": { kind:'image', image:  { state:'verifying',  taskId:'t#1', resourcePath:null,                        error:null,
                                   expiredAt:1700345600000, updatedAt:1700000140000 } },
    "1": { kind:'image', image:  { state:'expired',    taskId:'t#2', resourcePath:null,
                                   error:{ code:'HTTP_404', detail:{ status:404 }, at:1700000150000 },
                                   expiredAt:1700345600000, updatedAt:1700000150000 } },
    "2": { kind:'video', poster: { state:'verifying',  taskId:'t#3', resourcePath:null,                        error:null,
                                   expiredAt:1700345600000, updatedAt:1700000145000 } },
    "3": { kind:'video', poster: { state:'verifying',  taskId:'t#4', resourcePath:null,                        error:null,
                                   expiredAt:1700345600000, updatedAt:1700000148000 } }
  },
  aggregated: { state: 'expired', updatedAt: 1700000150000 }
}
```

> **诚实性体检通过**：slot 1 的 `expired` 写入只触碰 `slots["1"].image`；slot 0/2/3 的并发写入分散在各自的 IDB tx 里，不相互覆盖。`aggregated.state` 由 §13.5 规则自动算出，UI 列表立刻能看到"4 格里有 1 格挂了"。

#### 13.9.6 T4 — slot 0/2/3 顺利 verifying → decrypting → committing → ready

每个状态机分别发 3 次 patch（间隔约 50~200ms）：

```text
slots["0"].image.state  = 'decrypting'
slots["0"].image.state  = 'committing'
slots["0"].image       := { state:'ready', resourcePath:'<userData>/images/picture/m_a1b2c3/0.bin', taskId:'t#1', error:null,
                            expiredAt:1700345600000, updatedAt:1700000180000 }

slots["2"].poster.state = 'decrypting'
slots["2"].poster.state = 'committing'
slots["2"].poster      := { state:'ready', resourcePath:'<userData>/images/poster/m_a1b2c3/2.bin', taskId:'t#3', error:null,
                            expiredAt:1700345600000, updatedAt:1700000190000 }

slots["3"].poster.state = 'decrypting'
slots["3"].poster.state = 'committing'
slots["3"].poster      := { state:'ready', resourcePath:'<userData>/images/poster/m_a1b2c3/3.bin', taskId:'t#4', error:null,
                            expiredAt:1700345600000, updatedAt:1700000200000 }
```

终态：

```text
msg.nativeImage = {
  schemaVersion: 1,
  layout: 'mixed',
  slots: {
    "0": { kind:'image', image:  { state:'ready',   taskId:'t#1', resourcePath:'<userData>/images/picture/m_a1b2c3/0.bin',
                                   error:null,        expiredAt:1700345600000, updatedAt:1700000180000 } },
    "1": { kind:'image', image:  { state:'expired', taskId:'t#2', resourcePath:null,
                                   error:{ code:'HTTP_404', detail:{ status:404 }, at:1700000150000 },
                                   expiredAt:1700345600000, updatedAt:1700000150000 } },
    "2": { kind:'video', poster: { state:'ready',   taskId:'t#3', resourcePath:'<userData>/images/poster/m_a1b2c3/2.bin',
                                   error:null,        expiredAt:1700345600000, updatedAt:1700000190000 } },
    "3": { kind:'video', poster: { state:'ready',   taskId:'t#4', resourcePath:'<userData>/images/poster/m_a1b2c3/3.bin',
                                   error:null,        expiredAt:1700345600000, updatedAt:1700000200000 } }
  },
  aggregated: { state: 'expired', updatedAt: 1700000200000 }   // 仍 expired（slot 1 没动）
}
```

UI 状态对应（由 §13.5 规则推出，无需另存）：
- 格 0：显示真图 `0.bin`
- 格 1：fallback 到"图片已过期"占位
- 格 2：显示视频封面 `2.bin`，覆盖播放按钮（封面 ready，video 未点）
- 格 3：同 格 2

> 关键：`slots["2"].video` 与 `slots["3"].video` 在 schema 里**仍不存在**。"video 尚未被点击"由"字段缺失"表达，不浪费一行 DB；点击后才创建。

#### 13.9.7 T5 — 用户点击 slot 3 的播放按钮

派生 Poster/Picture 组件捕获 click，向 base 发送 "mount video machine" 的请求（实际是 `NativeImage` 实例化第二台，scope/resourceKey 指向视频文件 URL）。

```text
slots["3"].video := { state:'resolving',  taskId:'t#5', resourcePath:null, error:null, expiredAt:1700345600000, updatedAt:1700000300000 }
slots["3"].video.state = 'downloading'
slots["3"].video.state = 'verifying'
slots["3"].video.state = 'decrypting'
slots["3"].video.state = 'committing'
slots["3"].video := { state:'ready', taskId:'t#5', resourcePath:'<userData>/images/picture/m_a1b2c3/3.mp4',  // 视频结果目录与图片同级
                      error:null, expiredAt:1700345600000, updatedAt:1700000350000 }
```

终终态：

```text
slots["3"] = {
  kind:  'video',
  poster:{ state:'ready', resourcePath:'.../poster/m_a1b2c3/3.bin', taskId:'t#4', ..., updatedAt:1700000200000 },
  video: { state:'ready', resourcePath:'.../picture/m_a1b2c3/3.mp4', taskId:'t#5', ..., updatedAt:1700000350000 }
}

aggregated.state    = 'expired'             // ← 不变！slot 1 仍 expired，且 video 永远不影响 aggregated
aggregated.updatedAt = 1700000350000        // updatedAt 跟随最新写入
```

> 验证 §13.5 第一行的"视频以 poster 决定显示态"：`video.state` 从 idle → ready 全程不改 `aggregated.state`；MediaView 直接读 `slots["3"].video.resourcePath` 播放。

#### 13.9.8 这条 walkthrough 体检了什么

| 体检项 | 结果 |
|---|---|
| §13.3 状态机 → schema 1:1 覆盖 | 14 次写入全部命中映射表 |
| §13.4 单 slot 单 Machine 子键 patch | 4 路并发 + slot 3 video 二阶段写入，无 read-modify-write 冲突 |
| §13.5 显示态由 poster 决定 | T5 video ready 后 aggregated.state 保持 expired ✓ |
| §13.6 多 slot 不串台 | 任一时刻 `slots[K].{m}` 只被自己的状态机 patch ✓ |
| §13.7 非法形态不可写入 | 没出现 `resourcePath !== null && state !== 'ready'`、没出现整段 read-modify-write ✓ |
| §12.7 无旧字段双写 | 整条轨迹不触碰 `local_${i}` / `thumb_${i}` / `percent_${i}`，旧字段由 migration 清除 ✓ |

### 13.10 落地节奏（无双写期）

| 阶段 | 写出 | 读取 | 触发条件 |
|---|---|---|---|
| 0（本期） | 不写 `msg.nativeImage`（Avatar 不入库） | 不读 | Avatar 阶段 |
| 1 | 仅 `msg.nativeImage` | 仅 `msg.nativeImage` | Picture / Poster / MediaCaption 接入 NativeImage；老 UI 路径同步切换 |
| 2 | 仅 `msg.nativeImage` | 仅 `msg.nativeImage` | 跑 DB migration 清掉旧 `msg.local*` / `thumb_${i}` / `percent_${i}` |

- 阶段 0→1 在派生组件接入 PR 内完成：调用点切换 + 老 `event/file.js` 触发路径下线，**没有运行期开关**、**不做双写**。
- 阶段 1→2 只是 DB 清理，base / 派生都不动。
- 任何"先 base 切新字段、后 UI 慢慢迁"的灰度策略**不被允许**——只要某派生在写 `msg.nativeImage`，其对应的老字段写入路径必须同 PR 移除。

---

## 14. 风险与开放问题

1. **`registerStreamProtocol` 与 contextIsolation**：`native-image://` 必须在 `app.on('ready')` 之前调用 `protocol.registerSchemesAsPrivileged` 声明 `standard / secure / supportFetchAPI / corsEnabled`，`ready` 后再调 `registerStreamProtocol`。需要在 `background.js` 引导期统一处理；漏掉 privileged 注册会导致 `<img>` 直接报 `ERR_UNKNOWN_URL_SCHEME`。
2. **Avatar 不入库**：本期 Avatar 完全依赖文件系统缓存。如果后续业务依赖"头像本地路径在 IndexedDB 缓存"，再为 Avatar 派生一个独立 `persistAdapter`（不影响 base）；**不**回头给 Avatar 触发任何旧字段写入（§12.7）。
3. **`local-resource://` 共存**：图片消息尚未接 NativeImage，旧协议保留；图片消息接入时**同 PR 删除** `local-resource://` 触发链路与对应旧字段 (`msg.local*` / `thumb_${i}`)，不走灰度。
4. **child_process 池冷启动**：首张头像走默认加密路径，可能多几十毫秒；如热路径明显劣化，按 §5.3 提示降为 `NativeAesAdapter`。Avatar 调用方若已知源未加密可显式传 `encryptKey=""` 短路 headerCheck/decrypt。
5. **跨盘 rename**：`userData` 在某些 OEM 机器上跨卷挂载 → `fs.rename` 退化为 copy+unlink。`paths.js` 启动时探测同盘性，否则 fallback 到 `fs.copyFile + fs.unlink` 并打 warn。
6. **MediaCaption / 多 slot 落库**（description #13、#21）：本期不解决，由 §12.3 `MediaCaptionPersist` 和 §13.3 新表承接，base 不感知。
7. **派生绕过 ESLint 兜底**：§12.2 列的"派生禁止" 4 条用 `no-restricted-imports` 和自定义规则在 CI 强制。漏配会让派生重新发明 IPC 通道，重蹈 description Q2 的覆辙。
8. **状态机插件冲突**：多个 `smPlugins` 同时注册同名 `ext:` 状态时如何兼容？本期约定：插件注册时强制带 namespace 前缀（如 `Poster.ext:playing`），冲突直接抛错，不做合并。
9. **未加密源仍触发头像加密路径**：Avatar 缺省 `encryptKey` 非空，若线上仍存在未加密头像源，headerCheck 会命中 `plainText` → `decryptError` → fallback 到默认 icon。处理方式：调用点显式传 `encryptKey=""`；不在 base 内做"自动检测明文头并降级"，避免破坏 §7.4 不变量。

---

## 15. 落地里程碑

| 里程碑 | 范围 | 完成判据 |
|---|---|---|
| M1（骨架） | `core/*`、`ipc/*`、`node/index.js` 注册 `native-image`，支持"直通"（业务侧显式 `encryptKey=""`） | 跑通 A1b / A2 / A6 / A9 |
| M2（错误链） | 接入 4xx → expired、网络失败 → downloadError、taskRegistry 复用 | A3 / A4 / A7 / A8 |
| M3（加密默认） | headerCheck + decryptor worker + 原子 rename，Avatar 缺省 `encryptKey=VUE_APP_HEAD_AES_KEY` 走完整加密路径 | A1 / A11 / A12 通过；Q2 复现脚本不再触发 |
| M4（替换 + 清理） | 全局 `Vue.component('ComImage', Avatar)`，**一次性删除** `src/components/image.vue` | 30+ 调用点视觉无差异，构建无残留 import |

