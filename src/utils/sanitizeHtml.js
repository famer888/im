import DOMPurify from "dompurify";

/**
 * 富文本 / 消息 HTML：允许常见标签，移除 script、事件处理器、javascript:/data: 危险 URL 等。
 * 事件属性、javascript:/data: 等由 DOMPurify 默认处理；style 保留但由库内建规则净化（避免误伤富文本颜色/排版）。
 * 高风险标签显式禁止，防 svg/math 等旁路。
 *
 * 自定义 URI 白名单：生产环境仅允许 Electron 资源 app:、local-resource:、file:。
 * 开发环境额外放行 webpack dev 下的 localhost / 127.0.0.1 与相对 img/*.png（如表情 require 产出）。
 */
const RICH_HTML_DEFAULT_URI = /^(?:app|local-resource|file):/i;

/** development：vue-cli 下表情等为 http(s)://localhost:port/img/... 或 src="img/xxx.png" */
const RICH_HTML_DEV_URI =
  /^(?:(?:app|local-resource|file):|https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/|(?:\.\/)?(?:img\/|\/img\/)[a-zA-Z0-9_.-]+\.png)/i;

const RICH_HTML_ALLOWED_URI =
  process.env.NODE_ENV === "development"
    ? RICH_HTML_DEV_URI
    : RICH_HTML_DEFAULT_URI;

const RICH_HTML_CONFIG = {
  USE_PROFILES: { html: true },
  ADD_TAGS: ["video", "source"],
  ADD_ATTR: ["controls", "poster", "type", "data-key"],
  ALLOWED_URI_REGEXP: RICH_HTML_ALLOWED_URI,
  FORBID_TAGS: [
    "script",
    "iframe",
    "object",
    "embed",
    "form",
    "input",
    "textarea",
    "select",
    "button",
    "meta",
    "link",
    "base",
    "template",
    "svg",
    "math",
    // CSS 注入/UI 重叠（clickjacking）防护
    "style",
  ],
  // srcset 解析存在浏览器/版本差异，禁掉避免 src 白名单被绕过
  FORBID_ATTR: ["srcset"],
};

/**
 * customLink 渲染专用：仅允许文本 + 表情 <img>（与编辑器表情产物一致）。
 * 用在 lable-ele.vue 的 customLink 分支，避免通过自定义链接夹带其它资源标签。
 */
const CUSTOM_LINK_CONFIG = {
  ALLOWED_TAGS: ["img", "br", "span"],
  ALLOWED_ATTR: ["src", "data-key", "class", "alt"],
  ALLOWED_URI_REGEXP: RICH_HTML_ALLOWED_URI,
  FORBID_ATTR: ["srcset", "style", "onload", "onerror", "onclick"],
  KEEP_CONTENT: true,
};

export function sanitizeHtml(dirty) {
  if (dirty == null || dirty === "") return "";
  const s = typeof dirty === "string" ? dirty : String(dirty);
  return DOMPurify.sanitize(s, RICH_HTML_CONFIG);
}

/**
 * customLink 内容专用净化：仅保留文本与表情图。
 */
export function sanitizeCustomLinkHtml(dirty) {
  if (dirty == null || dirty === "") return "";
  const s = typeof dirty === "string" ? dirty : String(dirty);
  return DOMPurify.sanitize(s, CUSTOM_LINK_CONFIG);
}

/**
 * 资源标签 src 协议白名单。用于 v-bind:src 直接绑定的场景（不走 sanitizeHtml）。
 * 与 public/notification-app.js 中 safeSrc 口径对齐：
 *   - app:/local-resource:/file: 本地资源
 *   - http(s): 远端资源
 *   - blob: 内存资源
 *   - 相对路径（./xxx 或 /xxx）
 */
export function safeSrc(url) {
  if (typeof url !== "string") return "";
  const s = url.trim();
  if (!s) return "";
  if (/^(?:app:|local-resource:|file:|blob:)/i.test(s)) return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^\.?\.?\//.test(s)) return s; // ./xxx, ../xxx, /xxx
  return "";
}

export function escapeHtml(text) {
  if (text == null) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 搜索高亮：先净化内容，再把关键词包进 span（关键词转义，避免注入）
 */
export function highlightSearchHtml(content, searchText, highlightClass) {
  const safe = sanitizeHtml(content == null ? "" : String(content));
  const term = searchText == null ? "" : String(searchText);
  if (!term) return safe;
  const cls = highlightClass ? ` class="${escapeHtml(highlightClass)}"` : "";
  const open = `<span${cls}>`;
  const close = "</span>";
  const out = [];
  let i = 0;
  let idx = safe.indexOf(term, i);
  while (idx !== -1) {
    out.push(safe.slice(i, idx));
    out.push(open, escapeHtml(term), close);
    i = idx + term.length;
    idx = safe.indexOf(term, i);
  }
  out.push(safe.slice(i));
  return out.join("");
}
