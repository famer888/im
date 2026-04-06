import DOMPurify from "dompurify";

/**
 * 富文本 / 消息 HTML：允许常见标签，移除 script、事件处理器、javascript:/data: 危险 URL 等。
 * 对 span+隐藏样式+img onerror 一类 payload 依赖 DOMPurify 默认策略 + 禁用高风险标签。
 */
const RICH_HTML_CONFIG = {
  USE_PROFILES: { html: true },
  ADD_TAGS: ["video", "source"],
  ADD_ATTR: ["controls", "poster", "type", "data-key"],
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
  FORBID_ATTR: ["style"],
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
