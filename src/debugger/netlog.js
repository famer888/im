import fs from "fs";
import path from "path";
import os from "os";
import dns from "dns";
import { execFile } from "child_process";
import { app, ipcMain, net, netLog, session } from "electron";

const NETWORK_LOG_DIR = "network";
const RUNTIME_LOG_DIR = "runtime-network";
const NETWORK_LOG_NAME = "network.netlog";
const NETWORK_MAX_FILE_SIZE = 30 * 1024 * 1024;
const RUNTIME_MAX_FILE_SIZE = 20 * 1024 * 1024;
const SUMMARY_EVENT_LIMIT = 12;

let registered = false;
let activeRuntime = null;
let activeNetworkLog = null;

function getNetworkLogDir() {
    return path.join(app.getPath("userData"), "logs", NETWORK_LOG_DIR);
}

function getRuntimeLogDir() {
    return path.join(app.getPath("userData"), "logs", RUNTIME_LOG_DIR);
}

function getNetworkLogPath() {
    return path.join(getNetworkLogDir(), NETWORK_LOG_NAME);
}

async function ensureNetworkLogDir() {
    const dir = getNetworkLogDir();
    await fs.promises.mkdir(dir, { recursive: true });
    return dir;
}

async function ensureRuntimeLogDir() {
    const dir = getRuntimeLogDir();
    await fs.promises.mkdir(dir, { recursive: true });
    return dir;
}

function sanitizePart(value, fallback) {
    const raw = value == null || value === "" ? fallback : String(value);
    return raw.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || fallback;
}

function formatTimestamp(ts) {
    return new Date(ts).toISOString().replace(/[:.]/g, "-");
}

async function startNetworkLog() {
    if (netLog.currentlyLogging) return { ok: false, message: "netLog is already recording" };
    const dir = await ensureNetworkLogDir();
    const filePath = path.join(dir, NETWORK_LOG_NAME);
    await netLog.startLogging(filePath, {
        captureMode: "default",
        maxFileSize: NETWORK_MAX_FILE_SIZE,
    });
    activeNetworkLog = {
        name: NETWORK_LOG_NAME,
        path: filePath,
        startedAt: Date.now(),
    };
    return { ok: true, network: activeNetworkLog };
}

async function stopActiveLog() {
    if (!netLog.currentlyLogging) return "";
    return netLog.stopLogging();
}

function getEventTypeNameById(constants) {
    const map = {};
    const types = constants && constants.logEventTypes ? constants.logEventTypes : {};
    Object.keys(types).forEach((name) => {
        map[String(types[name])] = name;
    });
    return map;
}

function getEventPhaseNameById(constants) {
    const map = {};
    const phases = constants && constants.logEventPhase ? constants.logEventPhase : {};
    Object.keys(phases).forEach((name) => {
        map[String(phases[name])] = name;
    });
    return map;
}

function readString(value) {
    if (value == null) return "";
    if (typeof value === "string") return value;
    try {
        return JSON.stringify(value);
    } catch (e) {
        return String(value);
    }
}

function getSourceTypeNameById(constants) {
    const map = {};
    const sourceTypes = constants && constants.logSourceType ? constants.logSourceType : {};
    Object.keys(sourceTypes).forEach((name) => {
        map[String(sourceTypes[name])] = name;
    });
    return map;
}

function normalizeSourceKey(source) {
    const id = source && source.id != null ? String(source.id) : "";
    const type = source && source.type != null ? String(source.type) : "";
    if (!id || !type) return "";
    return `${type}:${id}`;
}

function parseTargetHints(targetUrl) {
    const raw = String(targetUrl || "").trim();
    if (!raw) return null;
    let normalized = raw;
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(normalized)) normalized = `ws://${normalized}`;
    try {
        const u = new URL(normalized);
        return {
            raw,
            normalized,
            host: String(u.hostname || "").toLowerCase(),
            hostWithPort: String(u.host || "").toLowerCase(),
            protocol: String(u.protocol || "").toLowerCase(),
        };
    } catch (e) {
        const stripped = raw.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, "");
        const hostWithPort = stripped.split("/")[0].toLowerCase();
        const host = hostWithPort.split(":")[0];
        return {
            raw,
            normalized: raw,
            host,
            hostWithPort,
            protocol: "",
        };
    }
}

function parseEventTimeMs(eventTime, timeTickOffset) {
    const t = Number(eventTime);
    if (!Number.isFinite(t)) return null;
    const base = Number(timeTickOffset);
    if (!Number.isFinite(base)) return null;
    return base + t;
}

function matchTargetByParams(params, targetHints) {
    if (!targetHints) return true;
    const fields = [
        params && params.url,
        params && params.host,
        params && params.hostname,
        params && params.group_id,
        params && params.address,
        params && params.remote_address,
        params && params.local_address,
    ]
        .filter(Boolean)
        .map((x) => String(x).toLowerCase());
    if (!fields.length) return false;
    const host = targetHints.host;
    const hostWithPort = targetHints.hostWithPort;
    return fields.some((value) => {
        if (hostWithPort && value.includes(hostWithPort)) return true;
        if (host && value.includes(host)) return true;
        return false;
    });
}

function appendAdjacency(adjacency, a, b) {
    if (!a || !b || a === b) return;
    if (!adjacency.has(a)) adjacency.set(a, new Set());
    if (!adjacency.has(b)) adjacency.set(b, new Set());
    adjacency.get(a).add(b);
    adjacency.get(b).add(a);
}

function collectConnectedSources(seedSet, adjacency) {
    const out = new Set();
    const queue = [];
    seedSet.forEach((seed) => {
        if (!seed) return;
        out.add(seed);
        queue.push(seed);
    });
    for (let i = 0; i < queue.length; i++) {
        const cur = queue[i];
        const neighbors = adjacency.get(cur);
        if (!neighbors) continue;
        neighbors.forEach((next) => {
            if (out.has(next)) return;
            out.add(next);
            queue.push(next);
        });
    }
    return out;
}

function findShortestSourcePath(start, targets, adjacency) {
    if (!start || !targets || !targets.size) return [];
    const parent = new Map();
    const visited = new Set([start]);
    const queue = [start];
    let matched = targets.has(start) ? start : "";
    for (let i = 0; i < queue.length && !matched; i++) {
        const cur = queue[i];
        const neighbors = adjacency.get(cur);
        if (!neighbors) continue;
        neighbors.forEach((next) => {
            if (visited.has(next)) return;
            visited.add(next);
            parent.set(next, cur);
            if (!matched && targets.has(next)) {
                matched = next;
            }
            queue.push(next);
        });
    }
    if (!matched) return [];
    const path = [matched];
    while (path[path.length - 1] !== start) {
        const prev = parent.get(path[path.length - 1]);
        if (!prev) break;
        path.push(prev);
    }
    return path.reverse();
}

function collectUsefulNetLogEvents(data, options = {}) {
    const typeById = getEventTypeNameById(data.constants);
    const phaseById = getEventPhaseNameById(data.constants);
    const sourceTypeById = getSourceTypeNameById(data.constants);
    const events = Array.isArray(data.events) ? data.events : [];
    const timeTickOffset = Number(data && data.constants ? data.constants.timeTickOffset : NaN);
    const targetHints = parseTargetHints(options.targetUrl);
    const startTime = Number(options.startTime);
    const endTime = Number(options.endTime);
    const hasStartTime = Number.isFinite(startTime);
    const hasEndTime = Number.isFinite(endTime);
    const useful = [];
    const counters = {
        dns: 0,
        proxy: 0,
        connect: 0,
        ssl: 0,
        websocket: 0,
        errors: 0,
    };
    const rawSocketErrorEvents = [];
    const socketErrorPhaseCounters = {
        dns: 0,
        proxy: 0,
        connect: 0,
        tls: 0,
        websocket: 0,
        other: 0,
    };
    const socketTimeline = [];
    const seenSocketHints = new Set();
    const sourceMetaByKey = new Map();
    const adjacency = new Map();
    const normalizedEvents = [];
    const patterns = [
        "HOST_RESOLVER",
        "DNS",
        "PROXY",
        "SOCKET",
        "SSL",
        "WEBSOCKET",
        "URL_REQUEST",
        "TRANSPORT_CONNECT",
    ];

    const getSocketPhase = (typeName) => {
        const upper = String(typeName || "").toUpperCase();
        if (upper.includes("HOST_RESOLVER") || upper.includes("DNS")) return "dns";
        if (upper.includes("PROXY")) return "proxy";
        if (upper.includes("SSL") || upper.includes("CERT")) return "tls";
        if (upper.includes("WEBSOCKET")) return "websocket";
        if (
            upper.includes("SOCKET") ||
            upper.includes("TRANSPORT_CONNECT") ||
            upper.includes("CONNECT_JOB") ||
            upper.includes("URL_REQUEST")
        ) {
            return "connect";
        }
        return "other";
    };

    for (let i = 0; i < events.length; i++) {
        const event = events[i] || {};
        const typeName = typeById[String(event.type)] || String(event.type || "");
        const phaseName = phaseById[String(event.phase)] || String(event.phase || "");
        const params = event.params || {};
        const source = event.source || {};
        const sourceKey = normalizeSourceKey(source);
        const dep = params && params.source_dependency ? params.source_dependency : null;
        const depKey = normalizeSourceKey(dep);
        const sourceTypeName =
            sourceTypeById[String(source.type)] || `SOURCE_TYPE_${String(source.type || "")}`;
        const eventTimeMs = parseEventTimeMs(event.time, timeTickOffset);
        if (sourceKey && !sourceMetaByKey.has(sourceKey)) {
            sourceMetaByKey.set(sourceKey, {
                key: sourceKey,
                id: source.id,
                type: source.type,
                typeName: sourceTypeName,
            });
        }
        if (sourceKey && depKey) appendAdjacency(adjacency, sourceKey, depKey);
        const text = `${typeName} ${readString(params)}`;
        const matched = patterns.some((p) => text.indexOf(p) >= 0);
        const hasError =
            params.net_error != null ||
            params.os_error != null ||
            params.error != null ||
            /ERR_|FAILED|TIMEOUT|ABORT/i.test(text);
        const isSocketRelated =
            typeName.indexOf("SOCKET") >= 0 ||
            typeName.indexOf("WEBSOCKET") >= 0 ||
            typeName.indexOf("TRANSPORT_CONNECT") >= 0 ||
            typeName.indexOf("URL_REQUEST") >= 0;
        const rawLine = [
            `event=${typeName}`,
            phaseName ? `phase=${phaseName}` : "",
            sourceTypeName ? `source_type=${sourceTypeName}` : "",
            sourceKey ? `source_key=${sourceKey}` : "",
            sourceKey && depKey ? `depends_on=${depKey}` : "",
            `socket_phase=${getSocketPhase(typeName)}`,
            (params.host || params.hostname || params.url || params.group_id) &&
            String(params.host || params.hostname || params.url || params.group_id)
                ? `target=${String(params.host || params.hostname || params.url || params.group_id)}`
                : "",
            `net_error=${params.net_error == null ? "null" : String(params.net_error)}`,
            `os_error=${params.os_error == null ? "null" : String(params.os_error)}`,
            `error=${params.error == null ? "null" : String(params.error)}`,
        ].filter(Boolean).join(" | ");
        normalizedEvents.push({
            typeName,
            phaseName,
            params,
            text,
            matched,
            hasError,
            isSocketRelated,
            sourceKey,
            depKey,
            sourceTypeName,
            eventTimeMs,
            rawLine,
        });
    }

    const scopedEvents = normalizedEvents.filter((entry) => {
        if ((hasStartTime || hasEndTime) && entry.eventTimeMs == null) return false;
        if (hasStartTime && entry.eventTimeMs < startTime) return false;
        if (hasEndTime && entry.eventTimeMs > endTime) return false;
        return true;
    });

    const directlyMatchedEvents = targetHints
        ? scopedEvents.filter((entry) => matchTargetByParams(entry.params, targetHints))
        : scopedEvents.slice();
    const targetSourceSet = new Set(
        directlyMatchedEvents.map((entry) => entry.sourceKey).filter(Boolean)
    );
    const chainSourceSet = targetHints
        ? collectConnectedSources(targetSourceSet, adjacency)
        : new Set(scopedEvents.map((entry) => entry.sourceKey).filter(Boolean));
    const analysisEvents = targetHints
        ? scopedEvents.filter((entry) => !entry.sourceKey || chainSourceSet.has(entry.sourceKey))
        : scopedEvents;

    for (let i = 0; i < analysisEvents.length; i++) {
        const entry = analysisEvents[i];
        const { typeName, phaseName, params, text, matched, hasError, isSocketRelated } = entry;
        if (typeName.indexOf("HOST_RESOLVER") >= 0 || typeName.indexOf("DNS") >= 0) counters.dns++;
        if (typeName.indexOf("PROXY") >= 0) counters.proxy++;
        if (typeName.indexOf("SOCKET") >= 0 || typeName.indexOf("TRANSPORT_CONNECT") >= 0) counters.connect++;
        if (typeName.indexOf("SSL") >= 0) counters.ssl++;
        if (typeName.indexOf("WEBSOCKET") >= 0) counters.websocket++;
        if (hasError) counters.errors++;
        if (isSocketRelated && socketTimeline.length < 10) {
            const target = params.host || params.hostname || params.url || params.group_id || "";
            socketTimeline.push(
                [
                    `事件=${typeName}`,
                    phaseName ? `phase=${phaseName}` : "",
                    target ? `target=${target}` : "",
                ].filter(Boolean).join(" | ")
            );
        }
        if (hasError) {
            const netErr = params.net_error;
            const osErr = params.os_error;
            const err = params.error;
            const target = params.host || params.hostname || params.url || params.group_id || "";
            const socketPhase = getSocketPhase(typeName);
            const key = `${typeName}|${target}|${String(netErr)}|${String(osErr)}|${String(err)}`;
            if (isSocketRelated && !seenSocketHints.has(key) && rawSocketErrorEvents.length < 10) {
                seenSocketHints.add(key);
                rawSocketErrorEvents.push(entry.rawLine);
                socketErrorPhaseCounters[socketPhase] = (socketErrorPhaseCounters[socketPhase] || 0) + 1;
            }
        }
        if ((isSocketRelated || hasError || matched) && useful.length < SUMMARY_EVENT_LIMIT) {
            const host = params.host || params.hostname || params.url || params.group_id || "";
            const err = params.net_error || params.os_error || params.error || "";
            useful.push(
                [
                    `事件: ${typeName}`,
                    host ? `目标: ${host}` : "",
                    err ? `错误: ${err}` : "",
                ].filter(Boolean).join(" · ")
            );
        }
    }

    let chain = null;
    if (targetHints) {
        const chainErrors = analysisEvents.filter((entry) => entry.hasError && entry.isSocketRelated);
        const root = chainErrors.length ? chainErrors[chainErrors.length - 1] : null;
        const sourcePath = root
            ? findShortestSourcePath(root.sourceKey, targetSourceSet, adjacency)
            : [];
        chain = {
            target: targetHints.raw,
            matchedEvents: directlyMatchedEvents.length,
            matchedSources: targetSourceSet.size,
            chainEvents: analysisEvents.length,
            chainSources: chainSourceSet.size,
            rootCause: root ? root.rawLine : "",
            sourcePath: sourcePath
                .map((key) => {
                    const meta = sourceMetaByKey.get(key);
                    if (!meta) return key;
                    return `${meta.typeName || "SOURCE"}#${meta.id}`;
                })
                .filter(Boolean),
        };
    }

    return { counters, useful, rawSocketErrorEvents, socketErrorPhaseCounters, socketTimeline, chain };
}

function buildSocketFocusedLines(eventSummary) {
    const lines = [
        `Socket/连接事件: ${eventSummary.counters.connect}`,
        `WebSocket事件: ${eventSummary.counters.websocket}`,
        `Socket错误事件: ${eventSummary.rawSocketErrorEvents.length}`,
        [
            "Socket错误阶段分布",
            `DNS=${eventSummary.socketErrorPhaseCounters.dns || 0}`,
            `PROXY=${eventSummary.socketErrorPhaseCounters.proxy || 0}`,
            `CONNECT=${eventSummary.socketErrorPhaseCounters.connect || 0}`,
            `TLS=${eventSummary.socketErrorPhaseCounters.tls || 0}`,
            `WEBSOCKET=${eventSummary.socketErrorPhaseCounters.websocket || 0}`,
            `OTHER=${eventSummary.socketErrorPhaseCounters.other || 0}`,
        ].join(": "),
        ...(eventSummary.socketTimeline.length
            ? ["Socket时序样本:", ...eventSummary.socketTimeline]
            : ["Socket时序样本: 无"]),
        ...(eventSummary.rawSocketErrorEvents.length
            ? ["Socket原始错误事件:", ...eventSummary.rawSocketErrorEvents]
            : ["Socket原始错误事件: 无"]),
    ];
    if (eventSummary.chain) {
        const chain = eventSummary.chain;
        lines.push(`目标URL过滤: ${chain.target || "—"}`);
        lines.push(
            `目标命中事件/源: ${chain.matchedEvents}/${chain.matchedSources} · 链路事件/源: ${chain.chainEvents}/${chain.chainSources}`
        );
        lines.push(`链路根因: ${chain.rootCause || "未在目标链路命中错误事件"}`);
        lines.push(
            `链路source路径: ${
                chain.sourcePath && chain.sourcePath.length ? chain.sourcePath.join(" -> ") : "无可用路径"
            }`
        );
    }
    return lines;
}

// netLog 文件被强杀/进程崩溃时 JSON 不闭合 — 截掉最后一段不完整的 event 后补 ']}'
function repairNetLogJsonString(raw) {
    if (typeof raw !== "string" || raw.length < 32) return "";
    let idx = raw.lastIndexOf("},\n");
    if (idx < 0) idx = raw.lastIndexOf("},");
    if (idx < 0) return "";
    return raw.slice(0, idx + 1) + "]}";
}

const NETLOG_PARSE_HARD_LIMIT = 50 * 1024 * 1024;

// 容错读 netlog: 文件超过硬上限直接跳过；正常读不开则尝试 brace-anchor 修复后重试
async function readNetLogJsonTolerant(filePath) {
    const stat = await fs.promises.stat(filePath);
    if (stat.size > NETLOG_PARSE_HARD_LIMIT) {
        throw new Error(`netlog too large to parse (${stat.size} bytes)`);
    }
    const raw = await fs.promises.readFile(filePath, "utf8");
    try {
        return { data: JSON.parse(raw), repaired: false, size: stat.size, mtime: stat.mtimeMs };
    } catch (e) {
        const repaired = repairNetLogJsonString(raw);
        if (!repaired) {
            throw new Error(`netlog parse failed and no repair anchor: ${e.message}`);
        }
        try {
            return { data: JSON.parse(repaired), repaired: true, size: stat.size, mtime: stat.mtimeMs };
        } catch (e2) {
            throw new Error(`netlog parse failed (after repair): ${e2.message}`);
        }
    }
}

async function summarizeNetLogFile(filePath, options = {}) {
    const { data, repaired, size, mtime } = await readNetLogJsonTolerant(filePath);
    const eventSummary = collectUsefulNetLogEvents(data, options);
    const lines = buildSocketFocusedLines(eventSummary);
    if (repaired) lines.unshift("(netlog 截断修复: 最后一段不完整事件被丢弃)");
    return {
        ok: true,
        path: filePath,
        size,
        mtime,
        repaired,
        eventCount: Array.isArray(data.events) ? data.events.length : 0,
        counters: eventSummary.counters,
        lines,
    };
}

const RUNTIME_LOG_KEEP = 8;

async function pruneRuntimeLogs(dir, keep = RUNTIME_LOG_KEEP) {
    try {
        const files = await fs.promises.readdir(dir);
        const candidates = [];
        for (let i = 0; i < files.length; i++) {
            const name = files[i];
            if (!name.endsWith(".netlog")) continue;
            const fullPath = path.join(dir, name);
            try {
                const s = await fs.promises.stat(fullPath);
                if (s.isFile()) candidates.push({ p: fullPath, mtime: s.mtimeMs });
            } catch (e) {
                // 单个 stat 失败不影响其它
            }
        }
        candidates.sort((a, b) => b.mtime - a.mtime);
        for (let i = keep; i < candidates.length; i++) {
            await fs.promises.unlink(candidates[i].p).catch(() => {});
        }
    } catch (e) {
        // 清理是 best-effort，不抛错
    }
}

async function summarizeNetworkLog(options = {}) {
    const wasRecordingNetwork = !!activeNetworkLog && netLog.currentlyLogging;
    if (wasRecordingNetwork) {
        await stopActiveLog();
        activeNetworkLog = null;
    }

    const filePath = getNetworkLogPath();
    let stat = null;
    try {
        stat = await fs.promises.stat(filePath);
    } catch (e) {
        stat = null;
    }

    let summary = {
        ok: !!stat,
        name: NETWORK_LOG_NAME,
        path: filePath,
        size: stat ? stat.size : 0,
        mtime: stat ? stat.mtimeMs : null,
        lines: stat ? [] : ["暂无 network 常驻日志"],
    };

    if (stat) {
        try {
            const parsed = await summarizeNetLogFile(filePath);
            summary = {
                ...summary,
                eventCount: parsed.eventCount,
                counters: parsed.counters,
                lines: parsed.lines,
            };
        } catch (err) {
            summary = {
                ...summary,
                ok: false,
                lines: [`network 日志暂不可解析: ${err.message || String(err)}`],
            };
        }
    }

    if (options.resume !== false && !netLog.currentlyLogging) {
        try {
            await startNetworkLog();
        } catch (e) {
            // Keep the summary readable even if the background log cannot resume.
        }
    }

    return summary;
}

async function startRuntimeLog(payload = {}) {
    if (activeNetworkLog && netLog.currentlyLogging) {
        await stopActiveLog();
        activeNetworkLog = null;
    }
    if (netLog.currentlyLogging) {
        return {
            ok: false,
            currentlyLogging: true,
            message: "netLog is already recording",
            runtime: activeRuntime,
        };
    }

    const dir = await ensureRuntimeLogDir();
    // 在写新 runtime 之前先按 mtime 保留最近 RUNTIME_LOG_KEEP 个，避免无限增长
    pruneRuntimeLogs(dir).catch(() => {});
    const loginId = sanitizePart(payload.loginId, "anonymous");
    const traceId = sanitizePart(payload.traceId, "diag");
    const startedAt = Date.now();
    const name = `runtime-${loginId}-${formatTimestamp(startedAt)}-${traceId}.netlog`;
    const filePath = path.join(dir, name);

    try {
        await netLog.startLogging(filePath, {
            captureMode: "default",
            maxFileSize: RUNTIME_MAX_FILE_SIZE,
        });
    } catch (err) {
        // 启动失败：保证常驻 network log 能恢复（避免 netLog 完全无录制状态）
        if (!netLog.currentlyLogging) {
            startNetworkLog().catch(() => {});
        }
        throw err;
    }

    activeRuntime = {
        name,
        path: filePath,
        startedAt,
        wsUrl: payload.wsUrl || "",
        traceId,
    };

    return {
        ok: true,
        currentlyLogging: true,
        runtime: activeRuntime,
    };
}

async function stopRuntimeLog(payload = {}) {
    const runtime = activeRuntime;
    if (!netLog.currentlyLogging) {
        activeRuntime = null;
        return {
            ok: false,
            message: "netLog is not recording",
            runtime,
        };
    }

    const writtenPath = await netLog.stopLogging();
    activeRuntime = null;
    const targetPath = writtenPath || (runtime && runtime.path);
    let stat = null;
    if (targetPath) {
        try {
            stat = await fs.promises.stat(targetPath);
        } catch (e) {
            stat = null;
        }
    }

    const result = {
        ok: true,
        currentlyLogging: false,
        runtime,
        name: runtime && runtime.name,
        path: targetPath,
        size: stat ? stat.size : null,
        durationMs: runtime ? Date.now() - runtime.startedAt : null,
    };
    if (targetPath && stat) {
        try {
            const targetUrl =
                payload && typeof payload.targetUrl === "string" && payload.targetUrl.trim()
                    ? payload.targetUrl.trim()
                    : runtime && runtime.wsUrl
                      ? String(runtime.wsUrl)
                      : "";
            const startTime = runtime && runtime.startedAt ? runtime.startedAt - 1500 : undefined;
            const endTime = Date.now() + 1500;
            result.summary = await summarizeNetLogFile(targetPath, {
                targetUrl,
                startTime,
                endTime,
            });
        } catch (e) {
            result.summary = {
                ok: false,
                path: targetPath,
                lines: [`runtime-network 日志暂不可解析: ${e.message || String(e)}`],
            };
        }
    }
    try {
        await startNetworkLog();
        result.networkResumed = true;
    } catch (e) {
        result.networkResumed = false;
        result.networkResumeMessage = e.message || String(e);
    }
    return result;
}

function getHostFromUrl(url) {
    if (!url) return "";
    try {
        const normalized = /^wss?:\/\//i.test(url) ? url : `wss://${url}`;
        return new URL(normalized).hostname;
    } catch (e) {
        return "";
    }
}

// 强信号：明确的 VPN/代理工具命名 — 命中即认定为 VPN 工具
const VPN_NAME_STRONG = [
    { pattern: /\bclash\b|mihomo/i, reason: "name:clash/mihomo" },
    { pattern: /v2ray|trojan|shadowsocks|surge|sing-?box/i, reason: "name:proxy-tool" },
    { pattern: /openvpn/i, reason: "name:openvpn" },
    { pattern: /wireguard|wintun/i, reason: "name:wireguard" },
    { pattern: /tailscale|zerotier/i, reason: "name:tailscale/zerotier" },
    { pattern: /\bvpn\b/i, reason: "name:vpn" },
];

// 弱信号：模糊隧道命名 — 必须叠加"承载有效 IPv4"才算有效
const VPN_NAME_WEAK = [
    { pattern: /^utun\d+$/, reason: "name:utun" },
    { pattern: /^tun\d+$/, reason: "name:tun" },
    { pattern: /^tap\d+$/, reason: "name:tap" },
    { pattern: /^ppp\d*$/, reason: "name:ppp" },
];

// 系统/虚拟接口隔离：不论是否带 IPv4 都不计入 VPN 评估
const SYSTEM_NAME_PATTERNS = [
    /^awdl\d*$/i, /^llw\d*$/i, /^anpi\d*$/i, /^ap\d+$/i,
    /^gif\d*$/i, /^stf\d*$/i, /^bridge\d+$/i, /^lo\d*$/i,
    /teredo/i, /isatap/i, /iphttps/i, /6to4/i,
    /vEthernet \(WSL/i, /vEthernet \(Default Switch/i, /vEthernet \(Hyper-V/i,
    /loopback pseudo-interface/i,
    /VMware Network Adapter VMnet/i,
    /VirtualBox Host-Only/i,
];

const VPN_ADDR_SIGNALS = [
    { cidr: "100.64.0.0/10", reason: "addr:cgnat/tunnel-common" },
    { cidr: "10.8.0.0/16", reason: "addr:openvpn-default" },
    { cidr: "10.9.0.0/16", reason: "addr:vpn-common" },
    { cidr: "10.10.0.0/16", reason: "addr:vpn-common" },
];

function isValidIpv4(value) {
    if (!value || typeof value !== "string") return false;
    const parts = value.trim().split(".");
    if (parts.length !== 4) return false;
    for (let i = 0; i < parts.length; i++) {
        const n = Number(parts[i]);
        if (!Number.isInteger(n) || n < 0 || n > 255) return false;
    }
    return true;
}

function ipv4ToInt(value) {
    if (!isValidIpv4(value)) return null;
    const parts = value.split(".").map((part) => Number(part));
    return ((parts[0] << 24) >>> 0) + ((parts[1] << 16) >>> 0) + ((parts[2] << 8) >>> 0) + (parts[3] >>> 0);
}

function isIpv4InCidr(value, cidr) {
    if (!isValidIpv4(value) || !cidr || typeof cidr !== "string") return false;
    const pair = cidr.split("/");
    if (pair.length !== 2) return false;
    const baseInt = ipv4ToInt(pair[0]);
    const bits = Number(pair[1]);
    if (baseInt == null || !Number.isInteger(bits) || bits < 0 || bits > 32) return false;
    const valueInt = ipv4ToInt(value);
    if (valueInt == null) return false;
    if (bits === 0) return true;
    const mask = (0xffffffff << (32 - bits)) >>> 0;
    return (valueInt & mask) === (baseInt & mask);
}

function isLinkLocalIpv4(addr) {
    return isValidIpv4(addr) && /^169\.254\./.test(addr);
}

function isLoopbackIpv4(addr) {
    return isValidIpv4(addr) && /^127\./.test(addr);
}

function classifyInterfaceName(name) {
    const n = String(name || "");
    for (let i = 0; i < SYSTEM_NAME_PATTERNS.length; i++) {
        if (SYSTEM_NAME_PATTERNS[i].test(n)) return { tier: "system", reasons: [`system:${n}`] };
    }
    for (let i = 0; i < VPN_NAME_STRONG.length; i++) {
        if (VPN_NAME_STRONG[i].pattern.test(n)) {
            return { tier: "strong", reasons: [VPN_NAME_STRONG[i].reason] };
        }
    }
    for (let i = 0; i < VPN_NAME_WEAK.length; i++) {
        if (VPN_NAME_WEAK[i].pattern.test(n)) {
            return { tier: "weak", reasons: [VPN_NAME_WEAK[i].reason] };
        }
    }
    return { tier: "none", reasons: [] };
}

function summarizeInterfaceAddresses(rows = []) {
    const out = { reasons: [], hasRoutableIPv4: false };
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i] || {};
        const addr = typeof row.address === "string" ? row.address.trim() : "";
        if (!addr) continue;
        if (!isValidIpv4(addr)) continue;
        if (isLoopbackIpv4(addr) || isLinkLocalIpv4(addr)) continue;
        out.hasRoutableIPv4 = true;
        for (let j = 0; j < VPN_ADDR_SIGNALS.length; j++) {
            const signal = VPN_ADDR_SIGNALS[j];
            if (isIpv4InCidr(addr, signal.cidr)) out.reasons.push(`${signal.reason}:${addr}`);
        }
    }
    out.reasons = Array.from(new Set(out.reasons));
    return out;
}

/**
 * 把 os.networkInterfaces() 转成统一目录，每条带 kind/score/vpnReasons
 * kind: vpn-strong | vpn-likely | tunnel-idle | system-tunnel | loopback | physical
 */
function buildInterfaceCatalog() {
    const interfaces = os.networkInterfaces();
    const result = [];
    Object.keys(interfaces).forEach((name) => {
        const rows = interfaces[name] || [];
        const internalOnly = rows.length > 0 && rows.every((r) => r && r.internal);
        const nameClass = classifyInterfaceName(name);
        const addrInfo = summarizeInterfaceAddresses(rows);
        let kind = "physical";
        let score = 0;
        const reasons = [];
        if (internalOnly) {
            kind = "loopback";
        } else if (nameClass.tier === "system") {
            kind = "system-tunnel";
            reasons.push(...nameClass.reasons);
        } else if (nameClass.tier === "strong") {
            kind = "vpn-strong";
            score += 3;
            reasons.push(...nameClass.reasons);
            if (addrInfo.hasRoutableIPv4) score += 1;
        } else if (nameClass.tier === "weak") {
            if (addrInfo.hasRoutableIPv4) {
                kind = "vpn-likely";
                score += 2;
                reasons.push(...nameClass.reasons);
            } else {
                kind = "tunnel-idle";
            }
        }
        if (addrInfo.reasons.length && kind !== "system-tunnel" && kind !== "loopback") {
            score += 2;
            reasons.push(...addrInfo.reasons);
        }
        result.push({
            name,
            kind,
            score,
            vpnReasons: reasons,
            hasRoutableIPv4: addrInfo.hasRoutableIPv4,
            internalOnly,
            addresses: rows
                .filter((row) => row && !row.internal)
                .map((row) => ({
                    family: row.family,
                    address: row.address,
                    netmask: row.netmask,
                    cidr: row.cidr,
                    mac: row.mac,
                })),
        });
    });
    // try {
    //     console.info(
    //         "[network-env] interface catalog",
    //         JSON.stringify(result.map((i) => ({ name: i.name, kind: i.kind, score: i.score })))
    //     );
    // } catch (e) {
    //     // diagnostics 不能因日志失败
    // }
    return result.slice(0, 24);
}

function getPublicInterfaceSummary(catalog) {
    const out = [];
    for (let i = 0; i < catalog.length; i++) {
        const item = catalog[i];
        if (item.internalOnly && item.kind === "loopback") continue;
        const addrs = (item.addresses || []).slice(0, 4);
        if (!addrs.length) continue;
        out.push({
            name: item.name,
            kind: item.kind,
            score: item.score,
            // 兼容旧字段：vpnLike 仍然导出，但严格只在 vpn-strong/vpn-likely 时为 true
            vpnLike: item.kind === "vpn-strong" || item.kind === "vpn-likely",
            vpnReasons: (item.vpnReasons || []).slice(0, 6),
            addresses: addrs,
        });
    }
    return out.slice(0, 16);
}

function execFileAsync(command, args) {
    return new Promise((resolve, reject) => {
        execFile(command, args, { windowsHide: true }, (err, stdout, stderr) => {
            if (err) {
                reject(new Error(stderr || err.message || String(err)));
                return;
            }
            resolve(stdout || "");
        });
    });
}

async function readWindowsInternetSettings() {
    if (process.platform !== "win32") {
        return {
            ok: false,
            skipped: true,
            source: "wininet-registry",
            message: "only supported on win32",
        };
    }
    const key = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings";
    let output = "";
    try {
        output = await execFileAsync("reg", ["query", key]);
    } catch (err) {
        return {
            ok: false,
            source: "wininet-registry",
            message: err.message || String(err),
        };
    }
    const lines = output.split(/\r?\n/);
    const values = {};
    lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        const match = trimmed.match(/^([^\s]+)\s+REG_\w+\s+(.+)$/);
        if (!match) return;
        values[match[1]] = match[2].trim();
    });

    const proxyEnableRaw = values.ProxyEnable || "0x0";
    const proxyEnabled =
        proxyEnableRaw === "1" ||
        proxyEnableRaw.toLowerCase() === "0x1" ||
        proxyEnableRaw.toLowerCase() === "0x00000001";
    const autoDetectRaw = values.AutoDetect || "0x0";
    const autoDetect =
        autoDetectRaw === "1" ||
        autoDetectRaw.toLowerCase() === "0x1" ||
        autoDetectRaw.toLowerCase() === "0x00000001";
    const autoConfigUrl = values.AutoConfigURL || "";
    const proxyServer = values.ProxyServer || "";
    const proxyOverride = values.ProxyOverride || "";

    const parts = [];
    if (proxyEnabled && proxyServer) parts.push(`manual=${proxyServer}`);
    if (autoConfigUrl) parts.push(`pac=${autoConfigUrl}`);
    if (autoDetect) parts.push("autoDetect=true");
    const value = parts.length ? parts.join(" ; ") : "DIRECT";

    return {
        ok: true,
        source: "wininet-registry",
        value,
        raw: {
            ProxyEnable: proxyEnableRaw,
            ProxyServer: proxyServer,
            ProxyOverride: proxyOverride,
            AutoConfigURL: autoConfigUrl,
            AutoDetect: autoDetectRaw,
        },
    };
}

function parseMacProxyFlag(value) {
    const text = String(value == null ? "" : value).trim().toLowerCase();
    return text === "1" || text === "yes" || text === "true";
}

function parseMacScutilProxy(output = "") {
    const lines = String(output).split(/\r?\n/);
    const raw = {};
    lines.forEach((line) => {
        const trimmed = line.trim();
        const match = trimmed.match(/^([A-Za-z0-9_]+)\s*:\s*(.+)$/);
        if (!match) return;
        raw[match[1]] = match[2].trim();
    });
    return raw;
}

async function readMacInternetSettings() {
    if (process.platform !== "darwin") {
        return {
            ok: false,
            skipped: true,
            source: "scutil-proxy",
            message: "only supported on darwin",
        };
    }
    let output = "";
    try {
        output = await execFileAsync("scutil", ["--proxy"]);
    } catch (err) {
        return {
            ok: false,
            source: "scutil-proxy",
            message: err.message || String(err),
        };
    }
    const raw = parseMacScutilProxy(output);
    const hasHttp = parseMacProxyFlag(raw.HTTPEnable) && raw.HTTPProxy && raw.HTTPPort;
    const hasHttps = parseMacProxyFlag(raw.HTTPSEnable) && raw.HTTPSProxy && raw.HTTPSPort;
    const hasSocks = parseMacProxyFlag(raw.SOCKSEnable) && raw.SOCKSProxy && raw.SOCKSPort;
    const hasPac = raw.ProxyAutoConfigEnable === "1" && raw.ProxyAutoConfigURLString;
    const autoDetect = parseMacProxyFlag(raw.ProxyAutoDiscoveryEnable);

    const parts = [];
    if (hasHttp) parts.push(`http=${raw.HTTPProxy}:${raw.HTTPPort}`);
    if (hasHttps) parts.push(`https=${raw.HTTPSProxy}:${raw.HTTPSPort}`);
    if (hasSocks) parts.push(`socks=${raw.SOCKSProxy}:${raw.SOCKSPort}`);
    if (hasPac) parts.push(`pac=${raw.ProxyAutoConfigURLString}`);
    if (autoDetect) parts.push("autoDetect=true");
    const value = parts.length ? parts.join(" ; ") : "DIRECT";

    return {
        ok: true,
        source: "scutil-proxy",
        value,
        raw,
    };
}

async function readSystemInternetSettings() {
    if (process.platform === "win32") return readWindowsInternetSettings();
    if (process.platform === "darwin") return readMacInternetSettings();
    return {
        ok: false,
        skipped: true,
        source: "system-proxy",
        message: `unsupported platform: ${process.platform}`,
    };
}

function hasEnabledSystemProxy(proxy) {
    if (!proxy || !proxy.ok) return false;
    const value = String(proxy.value || "").trim().toUpperCase();
    return !!value && value !== "DIRECT";
}

function buildInterfaceAddressMapFromCatalog(catalog = []) {
    const map = new Map();
    for (let i = 0; i < catalog.length; i++) {
        const item = catalog[i] || {};
        const addresses = Array.isArray(item.addresses) ? item.addresses : [];
        for (let j = 0; j < addresses.length; j++) {
            const row = addresses[j] || {};
            const addr = row && typeof row.address === "string" ? row.address.trim() : "";
            if (!isValidIpv4(addr)) continue;
            map.set(addr, item);
        }
    }
    return map;
}

// Windows: route print -4 — 解析所有默认路由（0.0.0.0 mask 0.0.0.0），按 metric 升序
// 注意: 中文 Windows 输出的表头是 GBK，但数据行均为 ASCII 数字 + IPv4，正则解析不受影响
function parseWindowsDefaultRoutes(output = "", catalog = []) {
    const lines = String(output).split(/\r?\n/);
    const addrMap = buildInterfaceAddressMapFromCatalog(catalog);
    const defaultRoutes = [];
    const seen = new Set();
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!/^\s*0\.0\.0\.0\s+0\.0\.0\.0\s+/.test(line)) continue;
        const cols = line.trim().split(/\s+/);
        if (cols.length < 5) continue;
        const gateway = cols[2] || "";
        const interfaceAddress = cols[3] || "";
        const metricRaw = cols[4] || "";
        const iface = addrMap.get(interfaceAddress) || null;
        const key = `${gateway}|${interfaceAddress}|${metricRaw}`;
        if (seen.has(key)) continue;
        seen.add(key);
        defaultRoutes.push({
            gateway,
            interfaceAddress,
            metric: Number(metricRaw) || metricRaw,
            interfaceName: iface ? iface.name : "",
            interfaceKind: iface ? iface.kind : "",
        });
    }
    defaultRoutes.sort((a, b) => (Number(a.metric) || 9999) - (Number(b.metric) || 9999));
    return defaultRoutes;
}

async function readWindowsRouteSnapshot(catalog = []) {
    if (process.platform !== "win32") {
        return {
            ok: false,
            skipped: true,
            source: "route-print",
            message: "only supported on win32",
            defaultRoutes: [],
        };
    }
    let output = "";
    try {
        output = await execFileAsync("route", ["print", "-4"]);
    } catch (err) {
        return {
            ok: false,
            source: "route-print",
            message: err.message || String(err),
            defaultRoutes: [],
        };
    }
    return {
        ok: true,
        source: "route-print",
        defaultRoutes: parseWindowsDefaultRoutes(output, catalog),
    };
}

// macOS: netstat -rn -f inet — 拿全部 default 路由（route -n get default 只能拿一条，
// 同时存在 VPN 与物理网卡时会漏判）
function parseDarwinDefaultRoutes(output = "", catalog = []) {
    const ifaceByName = new Map();
    for (let i = 0; i < catalog.length; i++) {
        const item = catalog[i];
        if (item && item.name) ifaceByName.set(item.name, item);
    }
    const lines = String(output).split(/\r?\n/);
    const out = [];
    const seen = new Set();
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!/^default\s+/.test(line)) continue;
        const cols = line.trim().split(/\s+/);
        // 典型: default <gateway> <flags> <netif> [Expire]
        const gateway = cols[1] || "";
        const ifaceName = cols[3] || "";
        const iface = ifaceByName.get(ifaceName) || null;
        const key = `${gateway}|${ifaceName}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
            gateway,
            interfaceAddress: "",
            metric: "",
            interfaceName: ifaceName,
            interfaceKind: iface ? iface.kind : "",
        });
    }
    return out;
}

async function readDarwinRouteSnapshot(catalog = []) {
    if (process.platform !== "darwin") {
        return {
            ok: false,
            skipped: true,
            source: "netstat-rn",
            message: "only supported on darwin",
            defaultRoutes: [],
        };
    }
    let output = "";
    try {
        output = await execFileAsync("netstat", ["-rn", "-f", "inet"]);
    } catch (err) {
        return {
            ok: false,
            source: "netstat-rn",
            message: err.message || String(err),
            defaultRoutes: [],
        };
    }
    return {
        ok: true,
        source: "netstat-rn",
        defaultRoutes: parseDarwinDefaultRoutes(output, catalog),
    };
}

async function readSystemRouteSnapshot(catalog = []) {
    if (process.platform === "win32") return readWindowsRouteSnapshot(catalog);
    if (process.platform === "darwin") return readDarwinRouteSnapshot(catalog);
    return {
        ok: false,
        skipped: true,
        source: "route",
        message: `unsupported platform: ${process.platform}`,
        defaultRoutes: [],
    };
}

/**
 * 综合判定 VPN：
 *   - 强证据(+4): 默认路由经过 vpn-strong/vpn-likely 网卡（流量真的走 VPN）
 *   - 中证据(+3): 网卡名匹配明确 VPN 工具（clash / openvpn / wireguard / tailscale ...）
 *   - 中证据(+2): 系统代理被显式启用（非 DIRECT）
 *   - 中证据(+2): 网卡名为 utun/tun/tap/ppp 且承载有效 IPv4
 *   - 中证据(+2): IPv4 命中 VPN 常见网段（CGNAT / OpenVPN 默认段）
 *   - 弱证据(+1): 针对目标 URL 的 PAC 解析返回非 DIRECT
 * 阈值: score>=5 high · >=3 medium(suspected) · 其它 low
 */
function evaluateVpnSuspicion({ catalog = [], proxy = null, route = null, proxyResolvedByUrl = null }) {
    let score = 0;
    const reasons = [];
    const signals = { interface: false, systemProxy: false, route: false, target: false };

    const vpnIfaces = catalog.filter(
        (i) => i && (i.kind === "vpn-strong" || i.kind === "vpn-likely")
    );
    if (vpnIfaces.length) {
        signals.interface = true;
        const peak = vpnIfaces.reduce((m, i) => Math.max(m, i.score || 0), 0);
        score += peak;
        reasons.push(
            `interface:${vpnIfaces.map((i) => `${i.name}(${i.kind})`).join(",")}`
        );
    }

    if (hasEnabledSystemProxy(proxy)) {
        signals.systemProxy = true;
        score += 2;
        reasons.push(`system-proxy:${proxy.value || "enabled"}`);
    }

    const defRoutes =
        route && route.ok && Array.isArray(route.defaultRoutes) ? route.defaultRoutes : [];
    const vpnRoute = defRoutes.find(
        (r) => r && (r.interfaceKind === "vpn-strong" || r.interfaceKind === "vpn-likely")
    );
    if (vpnRoute) {
        signals.route = true;
        score += 4;
        reasons.push(
            `default-route:${vpnRoute.interfaceName || vpnRoute.gateway}(${vpnRoute.interfaceKind})`
        );
    }

    if (proxyResolvedByUrl && proxyResolvedByUrl.ok && typeof proxyResolvedByUrl.value === "string") {
        const pv = proxyResolvedByUrl.value.trim().toUpperCase();
        if (pv && pv !== "DIRECT") {
            signals.target = true;
            score += 1;
            reasons.push(`target-proxy:${proxyResolvedByUrl.value}`);
        }
    }

    let level = "low";
    if (score >= 5) level = "high";
    else if (score >= 3) level = "medium";

    return {
        suspected: score >= 3,
        score,
        level,
        reasons,
        signals,
    };
}

function invokeSessionMethod(ses, method, args = []) {
    if (!ses || typeof ses[method] !== "function") {
        return Promise.resolve({ ok: false, skipped: true, message: `${method} not supported` });
    }
    return new Promise((resolve) => {
        let settled = false;
        const done = (err, value) => {
            if (settled) return;
            settled = true;
            if (err) {
                resolve({ ok: false, message: err.message || String(err) });
            } else {
                resolve({ ok: true, value });
            }
        };
        const doneFromCallback = (...values) => {
            if (values[0] instanceof Error) {
                done(values[0]);
                return;
            }
            done(null, values.length > 1 ? values[1] : values[0]);
        };
        try {
            const ret = ses[method](...args, doneFromCallback);
            if (ret && typeof ret.then === "function") {
                ret.then((value) => done(null, value), (err) => done(err));
            } else if (ses[method].length <= args.length) {
                done(null, ret);
            }
        } catch (err) {
            done(err);
        }
    });
}

async function resolveProxyForUrl(url) {
    if (!url) return { ok: false, skipped: true, message: "empty url" };
    return invokeSessionMethod(session.defaultSession, "resolveProxy", [url]);
}

async function resolveHostWithElectron(host) {
    const ses = session.defaultSession;
    const options = { cacheUsage: "disallowed", source: "dns" };
    if (ses && typeof ses.resolveHost === "function") {
        try {
            const result = await ses.resolveHost(host, options);
            return { ok: true, source: "session.resolveHost", result };
        } catch (err) {
            try {
                const result = await ses.resolveHost(host);
                return { ok: true, source: "session.resolveHost", result };
            } catch (err2) {
                return { ok: false, source: "session.resolveHost", message: err2.message || String(err2) };
            }
        }
    }
    if (net && typeof net.resolveHost === "function") {
        try {
            const result = await net.resolveHost(host, options);
            return { ok: true, source: "net.resolveHost", result };
        } catch (err) {
            try {
                const result = await net.resolveHost(host);
                return { ok: true, source: "net.resolveHost", result };
            } catch (err2) {
                return { ok: false, source: "net.resolveHost", message: err2.message || String(err2) };
            }
        }
    }
    return { ok: false, skipped: true, source: "electron", message: "resolveHost not supported" };
}

async function resolveHostFallback(host) {
    return new Promise((resolve) => {
        dns.lookup(host, { all: true }, (err, addresses) => {
            if (err) {
                resolve({ ok: false, source: "dns.lookup", message: err.message || String(err) });
                return;
            }
            resolve({ ok: true, source: "dns.lookup", result: addresses });
        });
    });
}

function normalizeAddresses(result) {
    if (!result) return [];
    if (Array.isArray(result)) {
        return result
            .map((item) => {
                if (typeof item === "string") return item;
                return item && item.address ? item.address : "";
            })
            .filter(Boolean);
    }
    if (Array.isArray(result.addresses)) return result.addresses.filter(Boolean);
    if (result.address) return [result.address];
    return [];
}

async function resolveHost(host) {
    if (!host) return { ok: false, source: "none", addresses: [], message: "empty host" };
    const electronResult = await resolveHostWithElectron(host);
    const chosen = electronResult.ok ? electronResult : await resolveHostFallback(host);
    return {
        ...chosen,
        host,
        addresses: normalizeAddresses(chosen.result),
    };
}

async function getNetworkSnapshot(payload = {}) {
    const wsUrl = payload.wsUrl || "";
    const host = getHostFromUrl(wsUrl);
    const proxyUrl = wsUrl || (host ? `https://${host}` : "");
    const catalog = buildInterfaceCatalog();
    const [dnsResult, systemProxyResult, proxyResult, routeResult] = await Promise.all([
        resolveHost(host),
        readSystemInternetSettings(),
        resolveProxyForUrl(proxyUrl),
        readSystemRouteSnapshot(catalog),
    ]);
    const proxy = systemProxyResult.ok ? systemProxyResult : proxyResult;
    const vpnSuspicion = evaluateVpnSuspicion({
        catalog,
        proxy,
        route: routeResult,
        proxyResolvedByUrl: proxyResult,
    });

    return {
        time: Date.now(),
        online: typeof net.isOnline === "function" ? net.isOnline() : net.online,
        platform: process.platform,
        wsUrl,
        host,
        interfaces: getPublicInterfaceSummary(catalog),
        dns: dnsResult,
        proxy,
        proxyResolvedByUrl: proxyResult,
        route: routeResult,
        vpnSuspicion,
    };
}

async function runRefreshStep(method, args = []) {
    const result = await invokeSessionMethod(session.defaultSession, method, args);
    return {
        name: method,
        ...result,
    };
}

async function runOsDnsFlush() {
    try {
        if (process.platform === "win32") {
            await execFileAsync("ipconfig", ["/flushdns"]);
            return { name: "ipconfig:flushdns", ok: true };
        }
        if (process.platform === "darwin") {
            // mac dscacheutil 不需要 sudo 即可清自己 cache；mDNSResponder 重启需要 sudo，跳过
            await execFileAsync("dscacheutil", ["-flushcache"]);
            return { name: "dscacheutil:flushcache", ok: true };
        }
    } catch (err) {
        return { name: "os-dns-flush", ok: false, message: err.message || String(err) };
    }
    return null;
}

async function refreshNetworkEnvironment() {
    const steps = [];
    // 顺序: 先断开链接 → 清 DNS 缓存 → 清认证缓存 → 强制直连 → 重载代理配置
    // (已直连了再关连接是错乱的；先 close 才能让 chromium 在下次请求时走全新栈)
    steps.push(await runRefreshStep("closeAllConnections"));
    steps.push(await runRefreshStep("clearHostResolverCache"));
    steps.push(await runRefreshStep("clearAuthCache"));
    steps.push(await runRefreshStep("setProxy", [{ mode: "direct" }]));
    steps.push(await runRefreshStep("forceReloadProxyConfig"));
    const osFlush = await runOsDnsFlush();
    if (osFlush) steps.push(osFlush);
    return {
        ok: steps.some((step) => step.ok),
        time: Date.now(),
        steps,
    };
}

function restartForNetwork() {
    setTimeout(() => {
        try {
            app.relaunch();
            app.exit(0);
        } catch (err) {
            try {
                console.warn("[network-env] relaunch failed, fallback to quit", err);
                app.quit();
            } catch (e) {
                process.exit(0);
            }
        }
    }, 100);
    return { ok: true, message: "relaunch scheduled" };
}

export function initNetworkDiagnostics() {
    if (registered) return;
    registered = true;

    startNetworkLog().catch(() => {});

    ipcMain.handle("network-log:list", async (_event, payload = {}) => {
        try {
            const summary = await summarizeNetworkLog({ resume: payload.resume });
            return { ok: true, summary, dir: getNetworkLogDir() };
        } catch (err) {
            return { ok: false, message: err.message || String(err), summary: null };
        }
    });

    ipcMain.handle("network-log:start-runtime", async (_event, payload = {}) => {
        try {
            return await startRuntimeLog(payload);
        } catch (err) {
            if (!netLog.currentlyLogging) {
                startNetworkLog().catch(() => {});
            }
            return { ok: false, message: err.message || String(err) };
        }
    });

    ipcMain.handle("network-log:stop-runtime", async (_event, payload = {}) => {
        try {
            return await stopRuntimeLog(payload);
        } catch (err) {
            activeRuntime = null;
            return { ok: false, message: err.message || String(err) };
        }
    });

    ipcMain.handle("network-env:snapshot", async (_event, payload = {}) => {
        try {
            return { ok: true, snapshot: await getNetworkSnapshot(payload) };
        } catch (err) {
            return { ok: false, message: err.message || String(err) };
        }
    });

    // 1006 补全：renderer 在 onClose 时主动拉一段 socket 错误事件回填
    // 注意: 短暂停掉常驻 network log -> 解析 -> 重启，调用方需自行节流
    ipcMain.handle("network-log:tail-socket-errors", async (_event, payload = {}) => {
        const wsUrl = (payload && typeof payload.wsUrl === "string") ? payload.wsUrl : "";
        const sinceMs = Number(payload && payload.sinceMs) > 0 ? Number(payload.sinceMs) : 60000;
        const wasLogging = !!activeNetworkLog && netLog.currentlyLogging;
        if (wasLogging) {
            try {
                await stopActiveLog();
            } catch (e) {
                // stop 失败不致命，下面读不到也会兜底
            }
            activeNetworkLog = null;
        }
        const filePath = getNetworkLogPath();
        let result = { ok: false, wsUrl, sinceMs, lines: [], message: "" };
        try {
            const stat = await fs.promises.stat(filePath);
            if (!stat || !stat.isFile()) throw new Error("network.netlog not found");
            const summary = await summarizeNetLogFile(filePath, {
                targetUrl: wsUrl,
                startTime: Date.now() - sinceMs,
                endTime: Date.now() + 1000,
            });
            result = {
                ok: true,
                wsUrl,
                sinceMs,
                size: summary.size,
                eventCount: summary.eventCount,
                counters: summary.counters,
                lines: summary.lines,
            };
        } catch (err) {
            result = {
                ok: false,
                wsUrl,
                sinceMs,
                lines: [`tail-socket-errors 失败: ${err.message || String(err)}`],
                message: err.message || String(err),
            };
        }
        if (wasLogging) {
            startNetworkLog().catch(() => {});
        }
        return result;
    });

    ipcMain.handle("network-env:refresh", async () => {
        try {
            return await refreshNetworkEnvironment();
        } catch (err) {
            return { ok: false, message: err.message || String(err), steps: [] };
        }
    });

    ipcMain.handle("app:restart-for-network", async () => restartForNetwork());
}
