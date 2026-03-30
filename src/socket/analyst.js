import Vue from "vue";
import i18n from "@/assets/lang/i18n";
import { benchmark } from "@/debuggers";
import { getPublicCacheSync } from "@/utils/publicCache";

/**
 * Analyst：数据层 + UI（render 挂载，无 .vue 文件）
 *
 * 新建 Analyst，模态窗，内部管理开关状态，外部函数控制开关（openPanel / closePanel / setPanelOpen）
 * 可挂载在 #app 根节点（仅遮罩+面板）或带行内「网络诊断」按钮；chat network-tips 使用 root + 点击整行打开
 * 使用本模块 socket 采集的数据，动态更新展示，逐步遍历诊断显示结果并增加列表
 * loading、√ 和 × 图标；列表项有子项目，对每个诊断进行信息展示，颜色较浅
 * 样式为单行注入；整体按暗色面板视觉（固定深灰底，不做 prefers-color-scheme 切换）
 *
 * 1–2：benchmark / onSocketClose
 * 3：urlSourceLast + reconnectSourceHits；isLoginSessionLast（/login/isLogin 下发 urls）
 * 4：touchListDomain（tapDomainListApi / traceLoginDomainsListDomain）
 * 5：domainPoolSnapshot（读缓存）+ 来源计数
 * 6：runDiagnostics 内 WSS 短时探测
 * 7：navigator.onLine + no-cors 外网探测
 */

/** @typedef {'login' | 'domainPool' | 'fallback' | 'session'} WsUrlSource */

/** WSS 短时探测最多条数（isLogin·预埋 + 域名池 webSession + 最近尝试，顺序去重后截断） */
const WS_PROBE_MAX_URLS = 20;

// 所有选择器挂在根节点 id 下，避免污染全局样式（一行压缩）
const ANALYST_STYLE_ONE_LINE =
    "#js-analyst-ui-root{display:inline-flex;align-items:center;flex-shrink:0}#js-analyst-ui-root.analyst-root--portal{display:block;position:fixed;left:0;top:0;width:0;height:0;overflow:visible;z-index:10049;margin:0;padding:0;border:0}#js-analyst-ui-root .analyst-trigger{border:0;background:transparent;font-size:12px;padding:0 8px;cursor:pointer;color:#666;line-height:32px;white-space:nowrap}#js-analyst-ui-root .analyst-trigger:hover{text-decoration:underline;color:#333}#js-analyst-ui-root .analyst-mask{position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center}#js-analyst-ui-root .analyst-panel{position:relative;width:min(420px,92vw);max-height:min(72vh,560px);overflow:hidden;display:flex;flex-direction:column;border-radius:8px;background:#1e1e1e;color:#d0d0d0;box-shadow:0 8px 32px rgba(0,0,0,.55)}#js-analyst-ui-root .analyst-head{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.08)}#js-analyst-ui-root .analyst-title{font-size:14px;font-weight:600}#js-analyst-ui-root .analyst-close{border:0;background:transparent;font-size:22px;line-height:1;cursor:pointer;color:inherit;opacity:.7;padding:0 4px}#js-analyst-ui-root .analyst-close:hover{opacity:1}#js-analyst-ui-root .analyst-body{padding:10px 14px 14px;overflow-y:auto;flex:1;min-height:0}#js-analyst-ui-root .analyst-body.analyst-body--with-copy{padding-bottom:52px}#js-analyst-ui-root .analyst-loading{font-size:12px;margin:0 0 10px;display:flex;align-items:center;gap:8px;opacity:.85}#js-analyst-ui-root .spin{width:12px;height:12px;border:2px solid rgba(255,255,255,.2);border-top-color:#ccc;border-radius:50%;animation:js-analyst-spin .7s linear infinite}@keyframes js-analyst-spin{to{transform:rotate(360deg)}}#js-analyst-ui-root .analyst-list{list-style:none;margin:0;padding:0}#js-analyst-ui-root .analyst-item{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)}#js-analyst-ui-root .analyst-item:last-child{border-bottom:none}#js-analyst-ui-root .analyst-icon{flex-shrink:0;width:18px;text-align:center;font-size:13px;line-height:1.4}#js-analyst-ui-root .analyst-icon.ok{color:#5cdb7a}#js-analyst-ui-root .analyst-icon.fail{color:#ff6b6b}#js-analyst-ui-root .analyst-icon.pending{color:#888}#js-analyst-ui-root .analyst-row-title{font-size:13px;font-weight:500;color:#fff}#js-analyst-ui-root .analyst-sub{margin:4px 0 0;padding:0 0 0 12px;list-style:disc;font-size:11px;line-height:1.45;color:#9a9a9a}#js-analyst-ui-root .analyst-copy-fab{position:absolute;right:12px;bottom:12px;z-index:2;padding:8px 14px;font-size:12px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:#2d2d2d;color:#e8e8e8;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.45);white-space:nowrap}#js-analyst-ui-root .analyst-copy-fab:hover{background:#383838;border-color:rgba(255,255,255,.22)}#js-analyst-ui-root .analyst-copy-fab:active{transform:translateY(1px)}";

let _styleInjected = false;

function injectAnalystStyles() {
    if (_styleInjected || typeof document === "undefined") return;
    if (document.getElementById("analyst-ui-styles")) {
        _styleInjected = true;
        return;
    }
    const s = document.createElement("style");
    s.id = "analyst-ui-styles";
    s.textContent = ANALYST_STYLE_ONE_LINE;
    document.head.appendChild(s);
    _styleInjected = true;
}

function _glyphForPlainText(status) {
    if (status === "ok") return "✓";
    if (status === "fail") return "✕";
    if (status === "running") return "…";
    return "·";
}

/**
 * @param {Array<{ title: string, status: string, children?: string[] }>} rows
 */
function formatDiagnosticsPlainText(rows) {
    const lines = [];
    lines.push(`[${new Date().toISOString()}]`);
    lines.push("");
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        lines.push(`${_glyphForPlainText(row.status)} ${row.title}`);
        const kids = row.children || [];
        for (let j = 0; j < kids.length; j++) lines.push(`  ${kids[j]}`);
        lines.push("");
    }
    return lines.join("\n").replace(/\n+$/, "");
}

/**
 * @param {string} text
 * @returns {Promise<void>}
 */
async function copyTextToClipboard(text) {
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
        if (!document.execCommand("copy")) throw new Error("execCommand copy failed");
    } finally {
        document.body.removeChild(ta);
    }
}

class Analyst {
    listeners = new Set();

    /** @type {boolean} */
    panelOpen = false;

    /** @type {import('vue').default | null} */
    _uiVm = null;

    /** @type {string} */
    _pendingConnectSource = "session";

    state = {
        sessionWsUrl: "",
        lastAttemptUrl: "",
        lastAttemptSource: /** @type {WsUrlSource} */ ("session"),
        /** 最近一次实际连 WSS 时的来源说明 */
        urlSourceLast: /** @type {null | { time: number, url: string, source: WsUrlSource, explain: string }} */ (null),
        /** 各来源累计次数（每次 onWsConnecting） */
        reconnectSourceHits: { login: 0, domainPool: 0, fallback: 0, session: 0 },
        /** isLogin 成功时下发的 urls.session（早于首页 setWsUrl / websocketCreate） */
        isLoginSessionLast: /** @type {null | { time: number, sessionUrl: string }} */ (null),
        lastClose: /** @type {null | { time: number, code?: number, reason: string, wasClean?: boolean }} */ (
            null
        ),
        lastError: /** @type {null | { time: number }} */ (null),
        /** ④ api/v4/listDomain 最近一次打点 */
        listDomainLast: /** @type {null | { time: number, success: boolean, source: string, message: string, total: null | number, webSessionCount: null | number }} */ (
            null
        ),
        domainPoolLast: /** @type {null | { time: number, moduleCode: string, success: boolean, detail: string }} */ (
            null
        ),
        /** ⑤ 读 domainList 缓存快照（诊断时刷新） */
        domainPoolSnapshot: /** @type {null | { cacheTime?: number, totalAll: number, webSessionTotal: number, samples: string[] }} */ (
            null
        ),
        /** 最近一次 WSS 探测 */
        wsProbeLast: /** @type {null | { time: number, results: { url: string, ok: boolean, reason: string }[] }} */ (null),
        /** ⑦ 外网探测 */
        healthCheckLast: /** @type {null | { time: number, lines: string[] }} */ (null),
        diagnostics: [],
        runningDiagnostics: false,
    };

    constructor() {
        if (typeof window !== "undefined") {
            window.addEventListener("online", () => this.notify());
            window.addEventListener("offline", () => this.notify());
        }
    }

    /**
     * 将诊断模态挂载到宿主元素；可选显示行内「网络诊断」按钮
     * @param {HTMLElement} el
     * @param {{ showTrigger?: boolean }} [options] showTrigger 默认 true；为 false 时仅模态，由外部触发 openPanel
     */
    mountTrigger(el, options = {}) {
        if (!el || this._uiVm) return;
        const showTrigger = options.showTrigger !== false;
        injectAnalystStyles();
        const service = this;
        const UI = Vue.extend({
            name: "AnalystUi",
            i18n,
            data() {
                return {
                    panelOpen: false,
                    diagnostics: [],
                    runningDiagnostics: false,
                    _unsub: null,
                    copyHint: "",
                    _copyHintTimer: null,
                };
            },
            mounted() {
                this._unsub = service.subscribe((snap) => {
                    this.panelOpen = snap.panelOpen;
                    this.diagnostics = snap.diagnostics || [];
                    this.runningDiagnostics = snap.runningDiagnostics;
                });
            },
            beforeDestroy() {
                if (this._unsub) this._unsub();
                if (this._copyHintTimer) clearTimeout(this._copyHintTimer);
            },
            methods: {
                statusGlyph(status) {
                    if (status === "ok") return "✓";
                    if (status === "fail") return "✕";
                    if (status === "running") return "…";
                    return "·";
                },
                handleOpen() {
                    service.openPanel();
                    this.$nextTick(() => service.runDiagnostics());
                },
                handleClose() {
                    service.closePanel();
                    this.copyHint = "";
                    if (this._copyHintTimer) {
                        clearTimeout(this._copyHintTimer);
                        this._copyHintTimer = null;
                    }
                },
                async handleCopyReport() {
                    const t = this;
                    try {
                        await copyTextToClipboard(formatDiagnosticsPlainText(t.diagnostics));
                        t.copyHint = t.$t("复制成功");
                    } catch (e) {
                        t.copyHint = t.$t("复制失败");
                    }
                    if (t._copyHintTimer) clearTimeout(t._copyHintTimer);
                    t._copyHintTimer = setTimeout(() => {
                        t.copyHint = "";
                        t._copyHintTimer = null;
                    }, 2200);
                },
            },
            render(h) {
                const t = this;
                const p = t.panelOpen;
                const d = t.diagnostics;
                const r = t.runningDiagnostics;
                const b = [
                    r
                        ? h("p", { class: "analyst-loading" }, [
                              h("span", { class: "spin" }),
                              t.$t("检测中") + "…",
                          ])
                        : null,
                    h(
                        "ul",
                        { class: "analyst-list" },
                        d.map((row) =>
                            h("li", { key: row.id, class: "analyst-item" }, [
                                h(
                                    "span",
                                    {
                                        class: {
                                            "analyst-icon": true,
                                            ok: row.status === "ok",
                                            fail: row.status === "fail",
                                            pending: row.status === "pending" || row.status === "running",
                                        },
                                    },
                                    t.statusGlyph(row.status)
                                ),
                                h("div", { class: "analyst-main" }, [
                                    h("div", { class: "analyst-row-title" }, row.title),
                                    row.children && row.children.length
                                        ? h(
                                              "ul",
                                              { class: "analyst-sub" },
                                              row.children.map((line, idx) =>
                                                  h("li", { key: idx }, line)
                                              )
                                          )
                                        : null,
                                ]),
                            ])
                        )
                    ),
                ].filter(Boolean);
                const k = [];
                if (showTrigger) {
                    k.push(
                        h(
                            "button",
                            {
                                class: "analyst-trigger",
                                attrs: { type: "button" },
                                on: {
                                    click(e) {
                                        e.stopPropagation();
                                        t.handleOpen();
                                    },
                                },
                            },
                            t.$t("网络诊断")
                        )
                    );
                }
                if (p) {
                    const showCopyFab = !r && d.length;
                    const panelChildren = [
                        h("header", { class: "analyst-head" }, [
                            h("span", { class: "analyst-title" }, t.$t("网络诊断")),
                            h(
                                "button",
                                {
                                    class: "analyst-close",
                                    attrs: { type: "button" },
                                    on: { click: t.handleClose },
                                },
                                "×"
                            ),
                        ]),
                        h(
                            "div",
                            {
                                class: {
                                    "analyst-body": true,
                                    "analyst-body--with-copy": showCopyFab,
                                },
                            },
                            b
                        ),
                    ];
                    if (showCopyFab) {
                        panelChildren.push(
                            h(
                                "button",
                                {
                                    class: "analyst-copy-fab",
                                    attrs: { type: "button" },
                                    on: {
                                        click(e) {
                                            e.stopPropagation();
                                            t.handleCopyReport();
                                        },
                                    },
                                },
                                t.copyHint || t.$t("复制诊断报告")
                            )
                        );
                    }
                    k.push(
                        h(
                            "div",
                            {
                                class: "analyst-mask",
                                on: {
                                    click(e) {
                                        if (e.target === e.currentTarget) t.handleClose();
                                    },
                                },
                            },
                            [
                                h(
                                    "div",
                                    {
                                        class: "analyst-panel",
                                        on: {
                                            click(e) {
                                                e.stopPropagation();
                                            },
                                        },
                                    },
                                    panelChildren
                                ),
                            ]
                        )
                    );
                }
                return h(
                    "div",
                    {
                        class: {
                            "analyst-root": true,
                            "analyst-root--portal": !showTrigger,
                        },
                        attrs: { id: "js-analyst-ui-root" },
                    },
                    k
                );
            },
        });
        this._uiVm = new UI().$mount();
        el.appendChild(this._uiVm.$el);
    }

    /** 销毁 UI 实例（network-tips 卸载或切回已连接状态时调用） */
    unmountTrigger() {
        if (this._uiVm) {
            this._uiVm.$destroy();
            if (this._uiVm.$el && this._uiVm.$el.parentNode) {
                this._uiVm.$el.parentNode.removeChild(this._uiVm.$el);
            }
            this._uiVm = null;
        }
    }

    /**
     * @param {(snapshot: ReturnType<Analyst['getSnapshot']>) => void} fn
     * @returns {() => void}
     */
    subscribe(fn) {
        this.listeners.add(fn);
        let snap;
        try {
            snap = this.getSnapshot();
        } catch (e) {
            console.warn("[Analyst] subscribe getSnapshot error", e);
            return () => this.listeners.delete(fn);
        }
        try {
            fn(snap);
        } catch (e) {
            console.warn("[Analyst] subscriber error", e);
        }
        return () => this.listeners.delete(fn);
    }

    notify() {
        let snap;
        try {
            snap = this.getSnapshot();
        } catch (e) {
            console.warn("[Analyst] notify getSnapshot error", e);
            return;
        }
        this.listeners.forEach((cb) => {
            try {
                cb(snap);
            } catch (e) {
                console.warn("[Analyst] notify error", e);
            }
        });
    }

    getSnapshot() {
        return {
            panelOpen: this.panelOpen,
            sessionWsUrl: this.state.sessionWsUrl,
            lastAttemptUrl: this.state.lastAttemptUrl,
            lastAttemptSource: this.state.lastAttemptSource,
            urlSourceLast: this.state.urlSourceLast,
            isLoginSessionLast: this.state.isLoginSessionLast,
            reconnectSourceHits: { ...this.state.reconnectSourceHits },
            lastClose: this.state.lastClose,
            lastError: this.state.lastError,
            listDomainLast: this.state.listDomainLast,
            domainPoolLast: this.state.domainPoolLast,
            domainPoolSnapshot: this.state.domainPoolSnapshot,
            wsProbeLast: this.state.wsProbeLast,
            healthCheckLast: this.state.healthCheckLast,
            reconnectCount5m: benchmark.getReconnectCount(),
            navigatorOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
            diagnostics: this.state.diagnostics.slice(),
            runningDiagnostics: this.state.runningDiagnostics,
        };
    }

    setPanelOpen(open) {
        this.panelOpen = !!open;
        this.notify();
    }

    openPanel() {
        this.setPanelOpen(true);
    }

    closePanel() {
        this.setPanelOpen(false);
    }

    /**
     * /login/isLogin 成功时下发的 urls（仅记录 session WSS；与 deviceConfig 合并时刻一致）
     * @param {{ session?: string } | null | undefined} urls
     */
    onIsLoginUrls(urls) {
        const raw = urls && typeof urls === "object" ? urls.session : "";
        const sessionUrl = raw != null && raw !== "" ? String(raw).trim() : "";
        this.state.isLoginSessionLast = {
            time: Date.now(),
            sessionUrl,
        };
        this.notify();
    }

    /**
     * 首页 handleNetworkInit：setWsUrl(deviceConfig.urls.session)
     * @param {string} url
     */
    onSessionUrlSet(url) {
        this.state.sessionWsUrl = url || "";
        this.notify();
    }

    /**
     * 下一次 websocketCreate 所用的来源（在 getNewWebSocketUrl 与首次连接之间设置）
     * @param {WsUrlSource} source
     */
    setNextConnectSource(source) {
        this._pendingConnectSource = source;
    }

    /**
     * @param {string} url
     */
    onWsConnecting(url) {
        const effective = url || "";
        const src = /** @type {WsUrlSource} */ (this._pendingConnectSource || "session");
        const explainMap = {
            login: "登录/设备配置 urls.session",
            domainPool: "缓存 domainList(webSession) 解析",
            fallback: "回落当前会话 wsUrl",
            session: "沿用会话地址",
        };
        this.state.lastAttemptUrl = effective;
        this.state.lastAttemptSource = src;
        this.state.urlSourceLast = {
            time: Date.now(),
            url: effective,
            source: src,
            explain: explainMap[src] || src,
        };
        const hits = { ...this.state.reconnectSourceHits };
        hits[src] = (hits[src] || 0) + 1;
        this.state.reconnectSourceHits = hits;
        this._pendingConnectSource = "session";
        this.notify();
    }

    /**
     * ④ listDomain（api/v4/listDomain）成功/失败；由 imDomain / login 探测等调用
     * @param {{ success: boolean, source: string, message?: string, domainDtoList?: unknown }} p
     */
    touchListDomain(p) {
        const list = Array.isArray(p?.domainDtoList) ? p.domainDtoList : null;
        this.state.listDomainLast = {
            time: Date.now(),
            success: !!(p && p.success),
            source: String(p?.source || ""),
            message: String(p?.message || ""),
            total: list ? list.length : null,
            webSessionCount: list
                ? list.filter((i) => i && i.moduleCode === "webSession").length
                : null,
        };
        this.notify();
    }

    /**
     * getDomainListApi（api/v4/listDomain）专用：在 Promise 上挂载成功/失败打点，不改变业务返回值与 reject 行为
     * @template T
     * @param {Promise<T & { domainDtoList?: unknown }>} promise
     * @returns {Promise<T>}
     */
    tapDomainListApi(promise) {
        return promise.then(
            (res) => {
                try {
                    this.touchListDomain({
                        success: true,
                        source: "imDomain.getDomainListApi",
                        message: "ok",
                        domainDtoList: res?.domainDtoList,
                    });
                } catch (e) {
                    /* analyst 仅观测 */
                }
                return res;
            },
            (err) => {
                try {
                    this.touchListDomain({
                        success: false,
                        source: "imDomain.getDomainListApi",
                        message: err?.message || String(err),
                    });
                } catch (e) {
                    /* */
                }
                return Promise.reject(err);
            }
        );
    }

    /**
     * login `domains.js` 内 fetch listDomain 探测路径（checkDomainByGetListDomain）
     * @param {boolean} success
     * @param {string} [message]
     * @param {unknown} [domainDtoList]
     */
    traceLoginDomainsListDomain(success, message, domainDtoList) {
        try {
            this.touchListDomain({
                success: !!success,
                source: "login-domains.fetch",
                message: String(message || ""),
                domainDtoList,
            });
        } catch (e) {
            /* 观测 */
        }
    }

    /** ⑤ 从 publicCache 刷新 domainList 计数（仅读，不改业务缓存） */
    refreshDomainPoolSnapshot() {
        try {
            const raw0 = getPublicCacheSync("domainList");
            const raw = raw0 && typeof raw0 === "object" ? raw0 : {};
            const domainDtoList = raw.domainDtoList || [];
            const ws = domainDtoList.filter((i) => i && i.moduleCode === "webSession");
            this.state.domainPoolSnapshot = {
                cacheTime: raw.getTime,
                totalAll: domainDtoList.length,
                webSessionTotal: ws.length,
                samples: ws.slice(0, 4).map((i) => i.domainUrl).filter(Boolean),
            };
        } catch (e) {
            this.state.domainPoolSnapshot = {
                totalAll: 0,
                webSessionTotal: 0,
                samples: [],
            };
        }
        this.notify();
    }

    _ensureWsUrl(u) {
        if (!u || typeof u !== "string") return "";
        let x = u.trim();
        if (!x.startsWith("ws://") && !x.startsWith("wss://")) x = `ws://${x}`;
        return x;
    }

    /** domainList 缓存中 moduleCode=webSession 的 domainUrl，顺序与缓存一致 */
    _getWebSessionUrlsFromDomainList() {
        try {
            const raw0 = getPublicCacheSync("domainList");
            const raw = raw0 && typeof raw0 === "object" ? raw0 : {};
            const list = raw.domainDtoList || [];
            const out = [];
            for (let i = 0; i < list.length; i++) {
                const item = list[i];
                if (item && item.moduleCode === "webSession" && item.domainUrl) {
                    out.push(String(item.domainUrl).trim());
                }
            }
            return out;
        } catch (e) {
            return [];
        }
    }

    /**
     * 待探测 WSS：① isLogin·预埋（setWsUrl → sessionWsUrl）② 域名池 webSession ③ 最近连接 URL（去重保序）
     */
    _collectWsProbeCandidates() {
        const poolRaw = this._getWebSessionUrlsFromDomainList();
        const out = [];
        const seen = new Set();
        const pushNorm = (raw) => {
            const x = this._ensureWsUrl(raw);
            if (!x || seen.has(x)) return;
            seen.add(x);
            out.push(x);
        };
        pushNorm(this.state.sessionWsUrl);
        for (let i = 0; i < poolRaw.length; i++) {
            pushNorm(poolRaw[i]);
        }
        pushNorm(this.state.lastAttemptUrl);
        return out;
    }

    _probeOneWsUrl(url, ms) {
        return new Promise((resolve) => {
            let done = false;
            let ws;
            const finish = (ok, reason) => {
                if (done) return;
                done = true;
                try {
                    ws && ws.close();
                } catch (e) {
                    /* */
                }
                resolve({ url, ok, reason });
            };
            const t = setTimeout(() => finish(false, `超时 ${ms}ms`), ms);
            try {
                ws = new WebSocket(url);
            } catch (e) {
                clearTimeout(t);
                return finish(false, `构造失败: ${e.message || e}`);
            }
            ws.onopen = () => {
                clearTimeout(t);
                finish(true, "onopen");
            };
            ws.onerror = () => {
                clearTimeout(t);
                finish(false, "onerror");
            };
            ws.onclose = (ev) => {
                clearTimeout(t);
                const code = ev && ev.code != null ? ` code=${ev.code}` : "";
                const reason = ev && ev.reason ? ` ${String(ev.reason)}` : "";
                finish(false, `onclose${code}${reason}`.trim());
            };
        });
    }

    async _runWsProbeBatch() {
        const urls = this._collectWsProbeCandidates().slice(0, WS_PROBE_MAX_URLS);
        const results = [];
        for (let i = 0; i < urls.length; i++) {
            results.push(await this._probeOneWsUrl(urls[i], 4200));
        }
        this.state.wsProbeLast = { time: Date.now(), results };
        this.notify();
        return results;
    }

    /** ⑦ 外网探测（no-cors，不读响应体） */
    async _runHealthProbes() {
        const nav = typeof navigator !== "undefined" ? navigator.onLine : true;
        const lines = [`navigator.onLine: ${nav}`];
        const targets = [
            ["msft connecttest", "http://www.msftconnecttest.com/connecttest.txt"],
            ["阿里云", "https://www.aliyun.com/favicon.ico"],
            ["腾讯云", "https://cloud.tencent.com/favicon.ico"],
            // ["gstatic 204", "https://www.gstatic.com/generate_204"],
        ];
        for (let i = 0; i < targets.length; i++) {
            const [name, u] = targets[i];
            try {
                await Promise.race([
                    fetch(u, { method: "GET", mode: "no-cors", cache: "no-store" }),
                    new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 4000)),
                ]);
                lines.push(`${name}: fetch 已返回(no-cors)`);
            } catch (e) {
                lines.push(`${name}: ${e.message || "fail"}`);
            }
        }
        this.state.healthCheckLast = { time: Date.now(), lines };
        this.notify();
        return lines;
    }

    /**
     * getNewNormalDomain 重连快照（与 listDomain 打点 touchListDomain 分离）
     */
    onDomainPoolFetch(moduleCode, success, detail) {
        this.state.domainPoolLast = {
            time: Date.now(),
            moduleCode,
            success,
            detail: String(detail || ""),
        };
        this.notify();
    }

    /**
     * @param {CloseEvent} [ev]
     */
    onSocketClose(ev) {
        this.state.lastClose = {
            time: Date.now(),
            code: ev?.code,
            reason: (ev && ev.reason) || "",
            wasClean: ev?.wasClean,
        };
        this.notify();
    }

    onSocketError() {
        this.state.lastError = { time: Date.now() };
        this.notify();
    }

    _formatTime(ts) {
        if (!ts) return "—";
        try {
            return new Date(ts).toLocaleString();
        } catch {
            return String(ts);
        }
    }

    /**
     * 供 UI 逐步展示；可多次调用，会重置列表
     * @returns {Promise<void>}
     */
    async runDiagnostics() {
        if (this.state.runningDiagnostics) return;
        this.state.runningDiagnostics = true;
        this.state.diagnostics = [];
        this.notify();

        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        const items = [];

        const setItem = (index, patch) => {
            items[index] = { ...items[index], ...patch };
            this.state.diagnostics = items.map((x) => ({ ...x }));
            this.notify();
        };

        const addRunning = (id, title) => {
            const i = items.length;
            items.push({
                id,
                title,
                status: /** @type {'running'} */ ("running"),
                children: [],
            });
            this.state.diagnostics = items.map((x) => ({ ...x }));
            this.notify();
            return i;
        };

        try {
            this.refreshDomainPoolSnapshot();

            let i = addRunning("health", "网络：onLine + 外网探测");
            await this._runHealthProbes();
            const hl = this.state.healthCheckLast?.lines || [];
            const navBad = hl[0] && hl[0].includes("false");
            const probeBad = hl.slice(1).some((x) => /timeout|:\s*fail/i.test(x));
            setItem(i, {
                status: navBad || probeBad ? "fail" : "ok",
                children: hl.length ? hl : ["—"],
            });

            i = addRunning("url-src", "WSS 来源（最近一条 + 累计）");
            await sleep(40);
            const us = this.state.urlSourceLast;
            const hits = this.state.reconnectSourceHits;
            const poolUrlsRaw = this._getWebSessionUrlsFromDomainList();
            const poolLines = [];
            if (poolUrlsRaw.length) {
                poolLines.push(`域名池 webSession（${poolUrlsRaw.length}）:`);
                const maxShow = 40;
                const n = Math.min(poolUrlsRaw.length, maxShow);
                for (let pi = 0; pi < n; pi++) {
                    poolLines.push(`  ${this._ensureWsUrl(poolUrlsRaw[pi])}`);
                }
                if (poolUrlsRaw.length > maxShow) {
                    poolLines.push(`  … 其余 ${poolUrlsRaw.length - maxShow} 条`);
                }
            } else {
                poolLines.push("域名池 webSession: （domainList 缓存中无）");
            }
            const commonHead = us
                ? [
                      `最近 onWsConnecting: ${us.explain} (${us.source})`,
                      `URL: ${us.url || "—"}`,
                      `累计 login/domainPool/fallback/session: ${hits.login}/${hits.domainPool}/${hits.fallback}/${hits.session}`,
                  ]
                : ["尚无 onWsConnecting 打点"];
            const il = this.state.isLoginSessionLast;
            const isLoginLine = il
                ? [
                      `isLogin 下发 urls.session: ${this._ensureWsUrl(il.sessionUrl) || "（空）"} · ${this._formatTime(il.time)}`,
                  ]
                : ["isLogin 下发 urls.session: （本轮无打点，或未走扫码 isLogin）"];
            setItem(i, {
                status: us ? "ok" : "pending",
                children: [
                    ...commonHead,
                    ...isLoginLine,
                    `setWsUrl 基线（首页 deviceConfig.urls.session）: ${this.state.sessionWsUrl || "—"}`,
                    ...poolLines,
                ],
            });

            i = addRunning("list-domain", "api/v4/listDomain 最近打点");
            await sleep(40);
            const ld = this.state.listDomainLast;
            if (ld) {
                setItem(i, {
                    status: ld.success ? "ok" : "fail",
                    children: [
                        `时间: ${this._formatTime(ld.time)}`,
                        `来源: ${ld.source}`,
                        `成功: ${ld.success}`,
                        ld.message ? `说明: ${ld.message}` : "",
                        ld.total != null ? `domainDtoList 条数: ${ld.total}` : "",
                        ld.webSessionCount != null ? `其中 webSession: ${ld.webSessionCount}` : "",
                    ].filter(Boolean),
                });
            } else {
                setItem(i, { status: "pending", children: ["尚无 listDomain 打点"] });
            }

            i = addRunning("pool-stat", "域名池缓存 + 重连取池");
            await sleep(40);
            const snap = this.state.domainPoolSnapshot;
            const dp = this.state.domainPoolLast;
            const snapKids = snap
                ? [
                      `缓存条数(全模块): ${snap.totalAll}`,
                      `webSession 条数: ${snap.webSessionTotal}`,
                      snap.cacheTime ? `缓存时间: ${this._formatTime(snap.cacheTime)}` : "",
                      snap.samples.length ? `示例: ${snap.samples.join(" | ")}` : "",
                  ].filter(Boolean)
                : ["无法读取 domainList 缓存"];
            if (dp) {
                snapKids.push(
                    `重连 getNewNormalDomain: ${dp.success ? "有 URL" : "空→回落"} — ${dp.detail || ""}`
                );
            }
            setItem(i, {
                status: snap && snap.webSessionTotal > 0 ? "ok" : "pending",
                children: snapKids,
            });

            i = addRunning("reconnect", "近 5 分钟重连次数");
            await sleep(40);
            setItem(i, {
                status: "ok",
                children: [`${benchmark.getReconnectCount()} 次`],
            });

            i = addRunning("last-close", "最近一次 Socket 关闭");
            await sleep(40);
            const lc = this.state.lastClose;
            if (lc) {
                setItem(i, {
                    status: "ok",
                    children: [
                        `时间: ${this._formatTime(lc.time)}`,
                        `code: ${lc.code ?? "—"}`,
                        `reason: ${lc.reason || "—"}`,
                    ],
                });
            } else {
                setItem(i, { status: "pending", children: ["尚无关闭记录"] });
            }

            i = addRunning("ws-probe", "WSS候选短时探测");
            await this._runWsProbeBatch();
            const pr = this.state.wsProbeLast?.results || [];
            const okn = pr.filter((r) => r.ok).length;
            setItem(i, {
                status: pr.length ? (okn > 0 ? "ok" : "fail") : "pending",
                children: pr.length
                    ? pr.map((r) => `${r.ok ? "✓" : "✕"} ${r.url} — ${r.reason}`)
                    : ["无候选 URL"],
            });

            i = addRunning("last-err", "最近一次 Socket error");
            await sleep(20);
            const le = this.state.lastError;
            setItem(i, {
                status: le ? "fail" : "ok",
                children: le ? [`时间: ${this._formatTime(le.time)}`] : ["无"],
            });
        } catch (e) {
            console.warn("[Analyst] runDiagnostics error", e);
            const msg =
                e && typeof e === "object" && "message" in e && e.message != null
                    ? String(e.message)
                    : String(e);
            try {
                for (let idx = 0; idx < items.length; idx++) {
                    if (items[idx] && items[idx].status === "running") {
                        items[idx] = {
                            ...items[idx],
                            status: /** @type {'fail'} */ ("fail"),
                            children: ["因异常中断"],
                        };
                    }
                }
                items.push({
                    id: `diag-err-${Date.now()}`,
                    title: "诊断流程异常",
                    status: /** @type {'fail'} */ ("fail"),
                    children: [msg],
                });
                this.state.diagnostics = items.map((x) => ({ ...x }));
                this.notify();
            } catch (e2) {
                console.warn("[Analyst] runDiagnostics recovery error", e2);
            }
        } finally {
            this.state.runningDiagnostics = false;
            this.notify();
        }
    }
}

export default new Analyst();
