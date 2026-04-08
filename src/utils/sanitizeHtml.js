import DOMPurify from "dompurify";

/**
 * 富文本 / 消息 HTML：允许常见标签，移除 script、事件处理器、javascript:/data: 危险 URL 等。
 * 事件属性、javascript:/data: 等由 DOMPurify 默认处理；style 保留但由库内建规则净化（避免误伤富文本颜色/排版）。
 * 高风险标签显式禁止，防 svg/math 等旁路。
 *
 * 自定义 URI 白名单：仅允许 Electron 打包资源使用的 app:、file:（如 app://./img/...、file:///...）。
 * 不再放行 http(s):、mailto: 等；消息内的外链 href 若需保留，应改为不走本净化配置或单独处理。
 */
const RICH_HTML_DEFAULT_URI = /^(?:app|file):/i;

const RICH_HTML_CONFIG = {
  USE_PROFILES: { html: true },
  ADD_TAGS: ["video", "source"],
  ADD_ATTR: ["controls", "poster", "type", "data-key"],
  ALLOWED_URI_REGEXP: RICH_HTML_DEFAULT_URI,
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
  ],
};

export function sanitizeHtml(dirty) {
  if (dirty == null || dirty === "") return "";
  const s = typeof dirty === "string" ? dirty : String(dirty);
  return DOMPurify.sanitize(s, RICH_HTML_CONFIG);
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
