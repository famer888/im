import Vue from "vue";
import i18n from "@/assets/lang/i18n";
import { benchmark } from "@/debuggers";
import { getPublicCacheSync } from "@/utils/publicCache";
import { ipcRenderer } from "@/platform";

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
const NETWORK_SUMMARY_MAX_LINES = 30;

// 所有选择器挂在根节点 id 下，避免污染全局样式（一行压缩）
const ANALYST_STYLE_ONE_LINE =
    "#js-analyst-ui-root{display:inline-flex;align-items:center;flex-shrink:0}#js-analyst-ui-root.analyst-root--portal{display:block;position:fixed;left:0;top:0;width:0;height:0;overflow:visible;z-index:10049;margin:0;padding:0;border:0}#js-analyst-ui-root .analyst-trigger{border:0;background:transparent;font-size:12px;padding:0 8px;cursor:pointer;color:#666;line-height:32px;white-space:nowrap}#js-analyst-ui-root .analyst-trigger:hover{text-decoration:underline;color:#333}#js-analyst-ui-root .analyst-mask{position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center}#js-analyst-ui-root .analyst-panel{position:relative;width:min(420px,92vw);max-height:min(72vh,560px);overflow:hidden;display:flex;flex-direction:column;border-radius:8px;background:#1e1e1e;color:#d0d0d0;box-shadow:0 8px 32px rgba(0,0,0,.55)}#js-analyst-ui-root .analyst-head{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.08)}#js-analyst-ui-root .analyst-title{font-size:14px;font-weight:600}#js-analyst-ui-root .analyst-close{border:0;background:transparent;font-size:22px;line-height:1;cursor:pointer;color:inherit;opacity:.7;padding:0 4px}#js-analyst-ui-root .analyst-close:hover{opacity:1}#js-analyst-ui-root .analyst-body{padding:10px 14px 14px;overflow-y:auto;flex:1;min-height:0}#js-analyst-ui-root .analyst-body.analyst-body--with-copy{padding-bottom:52px}#js-analyst-ui-root .analyst-body.analyst-body--with-actions{padding-bottom:62px}#js-analyst-ui-root .analyst-loading{font-size:12px;margin:0 0 10px;display:flex;align-items:center;gap:8px;opacity:.85}#js-analyst-ui-root .spin{width:12px;height:12px;border:2px solid rgba(255,255,255,.2);border-top-color:#ccc;border-radius:50%;animation:js-analyst-spin .7s linear infinite}@keyframes js-analyst-spin{to{transform:rotate(360deg)}}#js-analyst-ui-root .analyst-list{list-style:none;margin:0;padding:0}#js-analyst-ui-root .analyst-item{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)}#js-analyst-ui-root .analyst-item:last-child{border-bottom:none}#js-analyst-ui-root .analyst-icon{flex-shrink:0;width:18px;text-align:center;font-size:13px;line-height:1.4}#js-analyst-ui-root .analyst-icon.ok{color:#5cdb7a}#js-analyst-ui-root .analyst-icon.fail{color:#ff6b6b}#js-analyst-ui-root .analyst-icon.pending{color:#888}#js-analyst-ui-root .analyst-row-title{font-size:13px;font-weight:500;color:#fff}#js-analyst-ui-root .analyst-sub{margin:4px 0 0;padding:0 0 0 12px;list-style:disc;font-size:11px;line-height:1.45;color:#9a9a9a}#js-analyst-ui-root .analyst-copy-fab{position:absolute;right:12px;bottom:12px;z-index:2;padding:8px 14px;font-size:12px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:#2d2d2d;color:#e8e8e8;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.45);white-space:nowrap}#js-analyst-ui-root .analyst-copy-fab:hover{background:#383838;border-color:rgba(255,255,255,.22)}#js-analyst-ui-root .analyst-copy-fab:active{transform:translateY(1px)}#js-analyst-ui-root .analyst-actions-fab{position:absolute;right:12px;bottom:12px;left:12px;z-index:2;display:flex;justify-content:flex-end;gap:8px;pointer-events:none}#js-analyst-ui-root .analyst-action-btn{pointer-events:auto;padding:8px 10px;font-size:12px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:#2d2d2d;color:#e8e8e8;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.45);white-space:nowrap}#js-analyst-ui-root .analyst-action-btn:hover{background:#383838;border-color:rgba(255,255,255,.22)}#js-analyst-ui-root .analyst-action-btn:disabled{cursor:not-allowed;opacity:.55}#js-analyst-ui-root .analyst-action-btn.danger{border-color:rgba(255,107,107,.35);color:#ffb0b0}";

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
        lastClose: /** @type {null | { time: number, code?: number, reason: string, wasClean?: boolean, url?: string, readyState?: number, attempt?: number, aliveDuration?: number, unexpected?: boolean, netDetail?: string[], netDetailAt?: number, netDetailLoading?: boolean }} */ (
            null
        ),
        lastError: /** @type {null | { time: number, url?: string, readyState?: number, attempt?: number, aliveDuration?: number }} */ (null),
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
        networkLogHistory: [],
        runtimeNetLog: /** @type {null | { start?: unknown, stop?: unknown }} */ (null),
        networkSnapshotStart: /** @type {null | unknown} */ (null),
        networkSnapshotEnd: /** @type {null | unknown} */ (null),
        networkSnapshotDiff: [],
        recoveringNetwork: false,
        recoveryLastResult: /** @type {null | { time: number, result: unknown }} */ (null),
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
                    recoveringNetwork: false,
                    recoveryLastResult: null,
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
                    this.recoveringNetwork = snap.recoveringNetwork;
                    this.recoveryLastResult = snap.recoveryLastResult;
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
                handleRecoverNetwork() {
                    service.recoverNetwork();
                },
                handleRestartApp() {
                    service.restartAppForNetwork();
                },
            },
            render(h) {
                const t = this;
                const p = t.panelOpen;
                const d = t.diagnostics;
                const r = t.runningDiagnostics;
                const recovering = t.recoveringNetwork;
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
                    const showActions = true;
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
                                    "analyst-body--with-actions": showActions,
                                },
                            },
                            b
                        ),
                    ];
                    if (showActions) {
                        panelChildren.push(
                            h(
                                "div",
                                { class: "analyst-actions-fab" },
                                [
                                    h(
                                        "button",
                                        {
                                            class: "analyst-action-btn",
                                            attrs: { type: "button", disabled: !d.length },
                                            on: {
                                                click(e) {
                                                    e.stopPropagation();
                                                    t.handleCopyReport();
                                                },
                                            },
                                        },
                                        t.copyHint || t.$t("复制诊断报告")
                                    ),
                                    h(
                                        "button",
                                        {
                                            class: "analyst-action-btn",
                                            attrs: {
                                                type: "button",
                                                disabled: recovering || r,
                                            },
                                            on: {
                                                click(e) {
                                                    e.stopPropagation();
                                                    t.handleRecoverNetwork();
                                                },
                                            },
                                        },
                                        recovering ? t.$t("网络修复中") + "..." : t.$t("尝试网络修复")
                                    ),
                                    h(
                                        "button",
                                        {
                                            class: "analyst-action-btn danger",
                                            attrs: { type: "button", disabled: recovering },
                                            on: {
                                                click(e) {
                                                    e.stopPropagation();
                                                    t.handleRestartApp();
                                                },
                                            },
                                        },
                                        t.$t("重启应用")
                                    ),
                                ]
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
            networkLogHistory: this.state.networkLogHistory.slice(),
            runtimeNetLog: this.state.runtimeNetLog,
            networkSnapshotStart: this.state.networkSnapshotStart,
            networkSnapshotEnd: this.state.networkSnapshotEnd,
            networkSnapshotDiff: this.state.networkSnapshotDiff.slice(),
            recoveringNetwork: this.state.recoveringNetwork,
            recoveryLastResult: this.state.recoveryLastResult,
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
     * @param {{ url?: string, readyState?: number, attempt?: number, aliveDuration?: number, unexpected?: boolean }} [ctx]
     */
    onSocketClose(ev, ctx = {}) {
        const prev = this.state.lastClose;
        this.state.lastClose = {
            time: Date.now(),
            code: ev?.code,
            reason: (ev && ev.reason) || "",
            wasClean: ev?.wasClean,
            url: ctx.url || "",
            readyState: ctx.readyState,
            attempt: ctx.attempt,
            aliveDuration: ctx.aliveDuration || 0,
            unexpected: !!ctx.unexpected,
            netDetail: prev && prev.netDetail ? prev.netDetail : null,
            netDetailAt: prev && prev.netDetailAt ? prev.netDetailAt : 0,
        };
        this.notify();
        // 触发主进程补全：仅在"真正建立过的连接被断"且节流间隔到的情况下
        if (ctx.unexpected) this.requestNetDetailForLastClose();
    }

    /**
     * @param {{ url?: string, readyState?: number, attempt?: number, aliveDuration?: number }} [ctx]
     */
    onSocketError(ctx = {}) {
        this.state.lastError = {
            time: Date.now(),
            url: ctx.url || "",
            readyState: ctx.readyState,
            attempt: ctx.attempt,
            aliveDuration: ctx.aliveDuration || 0,
        };
        this.notify();
    }

    /**
     * 1006 等无 reason 关闭时，向主进程拉一段 netLog 中匹配 host 的 socket 错误事件回填。
     * 节流：最少间隔 NET_DETAIL_THROTTLE_MS；运行中诊断时不抢占。
     */
    async requestNetDetailForLastClose() {
        if (this.state.runningDiagnostics) return;
        if (!this.state.lastClose) return;
        const lc = this.state.lastClose;
        if (lc.netDetailLoading) return;
        const NET_DETAIL_THROTTLE_MS = 30 * 1000;
        if (lc.netDetailAt && Date.now() - lc.netDetailAt < NET_DETAIL_THROTTLE_MS) return;
        const wsUrl = lc.url || this._getEffectiveWsUrl();
        if (!wsUrl) return;
        this.state.lastClose = { ...lc, netDetailLoading: true };
        this.notify();
        let res = null;
        try {
            res = await this._ipcInvoke("network-log:tail-socket-errors", {
                wsUrl,
                sinceMs: 60 * 1000,
            });
        } catch (e) {
            res = { ok: false, message: e.message || String(e), lines: [] };
        }
        const cur = this.state.lastClose;
        if (!cur) return;
        this.state.lastClose = {
            ...cur,
            netDetail: (res && Array.isArray(res.lines) && res.lines.length) ? res.lines : null,
            netDetailAt: Date.now(),
            netDetailLoading: false,
        };
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

    _formatBytes(size) {
        if (size == null || Number.isNaN(Number(size))) return "—";
        const n = Number(size);
        if (n < 1024) return `${n} B`;
        if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
        return `${(n / 1024 / 1024).toFixed(1)} MB`;
    }

    async _ipcInvoke(channel, payload) {
        if (!ipcRenderer || typeof ipcRenderer.invoke !== "function") {
            return { ok: false, message: "ipcRenderer.invoke 不可用" };
        }
        return ipcRenderer.invoke(channel, payload);
    }

    _getEffectiveWsUrl() {
        return (
            this._ensureWsUrl(this.state.lastAttemptUrl) ||
            this._ensureWsUrl(this.state.sessionWsUrl) ||
            ""
        );
    }

    _formatNetworkSummary(summary) {
        if (!summary) return ["暂无常驻网络日志"];
        const lines = (summary.lines || []).filter(Boolean);
        if (!lines.length) return ["暂无可展示的网络事件摘要"];
        if (lines.length <= NETWORK_SUMMARY_MAX_LINES) return lines;
        const kept = lines.slice(0, NETWORK_SUMMARY_MAX_LINES);
        kept.push(`… 其余 ${lines.length - NETWORK_SUMMARY_MAX_LINES} 行已省略`);
        return kept;
    }

    _formatRuntimeStart(res) {
        if (!res || !res.ok) return [`[捕获启动]: 失败 - ${(res && res.message) || "unknown"}`];
        return [];
    }

    _formatRuntimeStop(res) {
        if (!res || !res.ok) return [`[捕获停止]: 失败 - ${(res && res.message) || "unknown"}`];
        return [];
    }

    _formatRuntimeNetlogSummary(res) {
        const summary = res && res.summary;
        if (!summary) return [];
        if (!summary.ok) {
            return summary.lines && summary.lines.length
                ? ["runtime-network 解析失败:", ...summary.lines]
                : ["runtime-network 解析失败"];
        }
        return Array.isArray(summary.lines) ? summary.lines : [];
    }

    _formatSnapshotBrief(label, snapshot) {
        if (!snapshot) return [`[${label}快照]: 无`];
        const dns = snapshot.dns || {};
        const dnsLine =
            dns.addresses && dns.addresses.length ? dns.addresses.join(", ") : dns.message || "—";
        const proxyLine = this._hasSystemProxy(snapshot) ? "有" : "无";
        return [
            `[${label}在线]: ${snapshot.online}`,
            `[${label}DNS]: ${dnsLine}`,
            `[${label}系统代理]: ${proxyLine}`,
        ];
    }

    _formatSnapshot(snapshot) {
        if (!snapshot) return ["无快照"];
        const dns = snapshot.dns || {};
        const interfaces = snapshot.interfaces || [];
        const vpn = snapshot.vpnSuspicion || {};
        const addresses = dns.addresses && dns.addresses.length ? dns.addresses.join(", ") : "—";
        const proxyValue = this._hasSystemProxy(snapshot) ? "有" : "无";
        const vpnSuspected = !!vpn.suspected;
        const vpnReasons =
            vpnSuspected && Array.isArray(vpn.reasons) && vpn.reasons.length
                ? vpn.reasons.slice(0, 3).join(" | ")
                : "";
        return [
            `时间: ${this._formatTime(snapshot.time)}`,
            `Electron online: ${snapshot.online}`,
            `WSS host: ${snapshot.host || "—"}`,
            `DNS(${dns.source || "none"}): ${addresses}`,
            `系统代理: ${proxyValue}`,
            `网卡: ${interfaces.length} 个`,
            `疑似 VPN/隧道网卡: ${vpnSuspected ? "有" : "无"}`,
            vpnReasons ? `疑似依据: ${vpnReasons}` : "",
        ];
    }

    _hasSystemProxy(snapshot) {
        const proxy = (snapshot && snapshot.proxy) || {};
        if (!proxy.ok) return false;
        const value = String(proxy.value || "").trim().toUpperCase();
        return !!value && value !== "DIRECT";
    }

    _formatVpnSuspicion(snapshot) {
        if (!snapshot) {
            return { status: "pending", children: ["网络快照缺失"] };
        }
        const vpn = snapshot.vpnSuspicion || {};
        const suspected = !!vpn.suspected;
        const signals = vpn.signals || {};
        const reasons = Array.isArray(vpn.reasons) ? vpn.reasons : [];
        const score = vpn.score != null ? vpn.score : "—";
        const flag = (b) => (b ? "✓" : "✕");
        const sigText = `网卡${flag(signals.interface)}/代理${flag(signals.systemProxy)}/路由${flag(signals.route)}/目标${flag(signals.target)}`;
        const head = `${suspected ? "有" : "无"} · ${vpn.level || "low"} · score=${score} · ${sigText}`;
        const reasonTail = reasons.length ? ` · 依据: ${reasons.slice(0, 3).join(" | ")}` : "";
        return {
            status: suspected ? "fail" : "ok",
            children: [head + reasonTail],
        };
    }

    async _ensureSnapshotForVpn() {
        const existing = this.state.networkSnapshotEnd || this.state.networkSnapshotStart;
        if (existing) return existing;
        try {
            const res = await this._ipcInvoke("network-env:snapshot", {
                wsUrl: this._getEffectiveWsUrl(),
            });
            const snapshot = res && res.ok ? res.snapshot : null;
            if (snapshot) {
                this.state.networkSnapshotEnd = this.state.networkSnapshotEnd || snapshot;
                this.state.networkSnapshotStart = this.state.networkSnapshotStart || snapshot;
            }
            return snapshot;
        } catch (e) {
            return null;
        }
    }

    _snapshotSignature(snapshot) {
        if (!snapshot) return {};
        const dns = snapshot.dns || {};
        const interfaces = snapshot.interfaces || [];
        const vpn = snapshot.vpnSuspicion || {};
        const vpnValue = vpn.suspected ? "有" : "无";
        return {
            online: String(snapshot.online),
            dns: (dns.addresses || []).slice().sort().join(", ") || dns.message || "—",
            systemProxy: this._hasSystemProxy(snapshot) ? "有" : "无",
            interfaceCount: String(interfaces.length || 0),
            vpnLike: vpnValue,
        };
    }

    _diffNetworkSnapshots(before, after) {
        if (!before || !after) return ["[网络快照]: — -> —"];
        const a = this._snapshotSignature(before);
        const b = this._snapshotSignature(after);
        const fields = [
            ["在线状态", "online"],
            ["DNS解析", "dns"],
            ["系统代理", "systemProxy"],
            ["网卡数量", "interfaceCount"],
            ["疑似VPN/隧道网卡", "vpnLike"],
        ];
        const out = [];
        for (let i = 0; i < fields.length; i++) {
            const [name, key] = fields[i];
            const beforeValue = a[key] == null || a[key] === "" ? "—" : String(a[key]);
            const afterValue = b[key] == null || b[key] === "" ? "—" : String(b[key]);
            out.push(`[${name}]: ${beforeValue} -> ${afterValue}`);
        }
        return out;
    }

    _collectWsFailureRawLines() {
        const lines = [];
        const lc = this.state.lastClose;
        const le = this.state.lastError;
        const probe = this.state.wsProbeLast?.results || [];
        if (lc) {
            lines.push(`[Socket close code]: ${lc.code ?? "—"}`);
            lines.push(`[Socket close reason]: ${lc.reason || "—"}`);
            lines.push(`[Socket close wasClean]: ${lc.wasClean == null ? "—" : String(lc.wasClean)}`);
            lines.push(`[Socket close time]: ${this._formatTime(lc.time)}`);
            if (lc.url) lines.push(`[Socket close url]: ${lc.url}`);
            if (lc.aliveDuration != null) {
                lines.push(
                    `[Socket close aliveDuration]: ${
                        lc.aliveDuration > 0 ? `${(lc.aliveDuration / 1000).toFixed(1)}s` : "未建立"
                    }`
                );
            }
            if (lc.attempt != null) lines.push(`[Socket close attempt]: ${lc.attempt}`);
            if (lc.netDetail && lc.netDetail.length) {
                lines.push("[Socket netLog 补全]:");
                for (let i = 0; i < Math.min(lc.netDetail.length, 8); i++) {
                    lines.push(`  ${lc.netDetail[i]}`);
                }
            }
        }
        if (probe.length) {
            lines.push(`[短探测样本数]: ${probe.length}`);
            for (let i = 0; i < Math.min(probe.length, 5); i++) {
                const item = probe[i];
                lines.push(`[probe ${i + 1}]: ${item.ok ? "ok" : "fail"} | ${item.url} | ${item.reason}`);
            }
        }
        if (le) {
            lines.push(`[Socket error time]: ${this._formatTime(le.time)}`);
            if (le.url) lines.push(`[Socket error url]: ${le.url}`);
            if (le.readyState != null) lines.push(`[Socket error readyState]: ${le.readyState}`);
        }
        if (!lines.length) {
            lines.push("[原始错误]: 本轮未捕获到明确错误字段");
        }
        return lines;
    }

    _formatRefreshResult(result) {
        if (!result) return ["无修复结果"];
        const steps = Array.isArray(result.steps) ? result.steps : [];
        const lines = [
            `时间: ${this._formatTime(result.time || Date.now())}`,
            `整体结果: ${result.ok ? "已执行" : "未完成"}`,
        ];
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            lines.push(
                `${step.ok ? "✓" : "✕"} ${step.name}: ${
                    step.skipped ? "不支持" : step.message || "ok"
                }`
            );
        }
        if (result.message) lines.push(`说明: ${result.message}`);
        return lines;
    }

    async _rebuildWebSocketAfterRefresh() {
        await new Promise((resolve) => setTimeout(resolve, 600));
        try {
            const mod = await import("./index");
            if (mod && typeof mod.websocketCreate === "function") {
                mod.websocketCreate(this._getEffectiveWsUrl());
                return true;
            }
        } catch (e) {
            console.warn("[Analyst] rebuild websocket after refresh failed", e);
        }
        return false;
    }

    async recoverNetwork() {
        if (this.state.recoveringNetwork || this.state.runningDiagnostics) return;
        this.state.recoveringNetwork = true;
        this.notify();
        try {
            const result = await this._ipcInvoke("network-env:refresh");
            const rebuilt = await this._rebuildWebSocketAfterRefresh();
            this.state.recoveryLastResult = {
                time: Date.now(),
                result: {
                    ...result,
                    rebuilt,
                },
            };
        } catch (e) {
            this.state.recoveryLastResult = {
                time: Date.now(),
                result: { ok: false, message: e.message || String(e), steps: [] },
            };
        } finally {
            this.state.recoveringNetwork = false;
            this.notify();
        }
        await this.runDiagnostics({ reason: "after-recovery" });
    }

    async restartAppForNetwork() {
        const ok =
            typeof window === "undefined" ||
            window.confirm("重启应用会关闭当前窗口并重新打开，是否继续？");
        if (!ok) return;
        await this._ipcInvoke("app:restart-for-network");
    }

    /**
     * 供 UI 逐步展示；可多次调用，会重置列表
     * @param {{ reason?: string }} [options]
     * @returns {Promise<void>}
     */
    async runDiagnostics(options = {}) {
        if (this.state.runningDiagnostics) return;
        this.state.runningDiagnostics = true;
        this.state.diagnostics = [];
        this.notify();

        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        const items = [];
        const traceId = `diag-${Date.now()}`;
        let runtimeNetLogStarted = false;
        let runtimeNetLogStopped = false;
        let networkSummary = null;
        let logsRes = null;
        let i = -1;

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
            logsRes = await this._ipcInvoke("network-log:list", { resume: false });
            networkSummary = logsRes && logsRes.ok ? logsRes.summary : null;
            this.state.networkLogHistory = networkSummary ? [networkSummary] : [];

            const startLogRes = await this._ipcInvoke("network-log:start-runtime", {
                loginId: "anonymous",
                wsUrl: this._getEffectiveWsUrl(),
                traceId,
            });
            runtimeNetLogStarted = !!(startLogRes && startLogRes.ok);
            this.state.runtimeNetLog = { start: startLogRes };
            const startSnapRes = await this._ipcInvoke("network-env:snapshot", {
                wsUrl: this._getEffectiveWsUrl(),
            });
            const startSnapshot = startSnapRes && startSnapRes.ok ? startSnapRes.snapshot : null;
            this.state.networkSnapshotStart = startSnapshot;

            if (this.state.recoveryLastResult) {
                i = addRunning("network-recovery-last", "最近一次网络修复");
                await sleep(20);
                const rr = this.state.recoveryLastResult.result || {};
                const kids = this._formatRefreshResult(rr);
                if (rr.rebuilt != null) {
                    kids.push(`Socket 重建: ${rr.rebuilt ? "已触发" : "未触发"}`);
                }
                setItem(i, {
                    status: rr.ok ? "ok" : "fail",
                    children: kids,
                });
            }

            this.refreshDomainPoolSnapshot();

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

            i = addRunning("health", "网络：onLine + 外网探测");
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
                const closeKids = [
                    `时间: ${this._formatTime(lc.time)}`,
                    `code: ${lc.code ?? "—"}`,
                    `reason: ${lc.reason || "—"}`,
                    lc.url ? `URL: ${lc.url}` : "",
                    lc.aliveDuration != null
                        ? `存活时长: ${lc.aliveDuration > 0 ? `${(lc.aliveDuration / 1000).toFixed(1)}s` : "未建立"}`
                        : "",
                    lc.attempt != null ? `连接尝试: 第 ${lc.attempt} 次` : "",
                    lc.readyState != null ? `关闭时 readyState: ${lc.readyState}` : "",
                    lc.unexpected ? "判定: 已建立后被断 (unexpected)" : "",
                ].filter(Boolean);
                if (lc.netDetailLoading) {
                    closeKids.push("[netLog 补全]: 拉取中…");
                } else if (lc.netDetail && lc.netDetail.length) {
                    closeKids.push("[netLog 补全 (renderer 缺失字段由 main 补)]:");
                    for (let li = 0; li < Math.min(lc.netDetail.length, 12); li++) {
                        closeKids.push(`  ${lc.netDetail[li]}`);
                    }
                } else if (lc.netDetailAt) {
                    closeKids.push("[netLog 补全]: 命中范围内无 socket 错误事件");
                }
                setItem(i, { status: "ok", children: closeKids });
                // 若本次 close 还没拿过 netDetail，主动补一次（节流内会自然忽略）
                if (lc.unexpected && !lc.netDetailAt && !lc.netDetailLoading) {
                    this.requestNetDetailForLastClose().catch(() => {});
                }
            } else {
                setItem(i, { status: "pending", children: ["尚无关闭记录"] });
            }

            i = addRunning("last-err", "最近一次 Socket error");
            await sleep(20);
            const le = this.state.lastError;
            setItem(i, {
                status: le ? "fail" : "ok",
                children: le
                    ? [
                          `时间: ${this._formatTime(le.time)}`,
                          le.url ? `URL: ${le.url}` : "",
                          le.aliveDuration != null
                              ? `存活时长: ${le.aliveDuration > 0 ? `${(le.aliveDuration / 1000).toFixed(1)}s` : "未建立"}`
                              : "",
                          le.attempt != null ? `连接尝试: 第 ${le.attempt} 次` : "",
                          le.readyState != null ? `触发时 readyState: ${le.readyState}` : "",
                      ].filter(Boolean)
                    : ["无"],
            });

            const endSnapRes = await this._ipcInvoke("network-env:snapshot", {
                wsUrl: this._getEffectiveWsUrl(),
            });
            const endSnapshot = endSnapRes && endSnapRes.ok ? endSnapRes.snapshot : null;
            this.state.networkSnapshotEnd = endSnapshot;
            const diff = this._diffNetworkSnapshots(this.state.networkSnapshotStart, this.state.networkSnapshotEnd);
            this.state.networkSnapshotDiff = diff;

            i = addRunning("network-history-summary", "常驻网络日志摘要");
            setItem(i, {
                status: networkSummary && networkSummary.ok ? "ok" : "pending",
                children:
                    logsRes && logsRes.ok
                        ? this._formatNetworkSummary(networkSummary)
                        : [`读取失败: ${(logsRes && logsRes.message) || "ipc unavailable"}`],
            });

            i = addRunning("runtime-network-capture", "本次诊断网络捕获");
            if (runtimeNetLogStarted && !runtimeNetLogStopped) {
                const stopLogRes = await this._ipcInvoke("network-log:stop-runtime");
                runtimeNetLogStopped = true;
                this.state.runtimeNetLog = {
                    ...(this.state.runtimeNetLog || {}),
                    stop: stopLogRes,
                };
                setItem(i, {
                    status: stopLogRes && stopLogRes.ok ? "ok" : "fail",
                    children: [
                        ...this._formatRuntimeStart(startLogRes),
                        ...this._formatRuntimeStop(stopLogRes),
                        ...this._formatRuntimeNetlogSummary(stopLogRes),
                        ...diff,
                        "[WS原始错误/事件]:",
                        ...this._collectWsFailureRawLines(),
                    ],
                });
            } else {
                setItem(i, {
                    status: "pending",
                    children: [
                        ...this._formatRuntimeStart(startLogRes),
                        ...diff,
                        "[WS原始错误/事件]:",
                        ...this._collectWsFailureRawLines(),
                    ],
                });
            }

            i = addRunning("vpn-suspect", "疑似VPN/隧道网卡");
            await sleep(20);
            const vpnSnapshot = await this._ensureSnapshotForVpn();
            const vpnResult = this._formatVpnSuspicion(vpnSnapshot);
            setItem(i, vpnResult);
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
            if (runtimeNetLogStarted && !runtimeNetLogStopped) {
                try {
                    const stopLogRes = await this._ipcInvoke("network-log:stop-runtime");
                    this.state.runtimeNetLog = {
                        ...(this.state.runtimeNetLog || {}),
                        stop: stopLogRes,
                    };
                } catch (e) {
                    console.warn("[Analyst] stop runtime netLog error", e);
                }
            }
            this.state.runningDiagnostics = false;
            this.notify();
        }
    }
}

export default new Analyst();
