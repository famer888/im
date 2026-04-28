export const MediaType = Object.freeze({
  IMAGE: 1,  // 图片
  VIDEO: 3,  // 视频
  FILE: 7,   // 文件（与 enumMsgType.file / 消息 chatType 一致）
});

const GIF_CHAT_TYPE = 9;
const FILE_PREVIEW_EXTS = Object.freeze([".pdf", ".doc", ".docx", ".xls", ".xlsx"]);

export const getFileExtension = (input = "") => {
  if (!input || typeof input !== "string") return "";
  const normalized = input.split("?")[0].split("#")[0].split(/[\\/]/).pop() || "";
  const dotIndex = normalized.lastIndexOf(".");
  if (dotIndex < 0) return "";
  return normalized.slice(dotIndex).toLowerCase();
};

export const isFileMediaPreviewExt = (fileNameOrPath = "") => {
  const ext = getFileExtension(fileNameOrPath);
  return FILE_PREVIEW_EXTS.includes(ext);
};

export const shouldOpenInMediaPreview = ({ chatType, fileName, fileUrl, local } = {}) => {
  const type = Number(chatType);
  if ([MediaType.IMAGE, MediaType.VIDEO, GIF_CHAT_TYPE].includes(type)) return true;
  if (type !== MediaType.FILE) return false;
  return (
    isFileMediaPreviewExt(fileName) ||
    isFileMediaPreviewExt(fileUrl) ||
    isFileMediaPreviewExt(local)
  );
};

/**
 * @typedef {Object} MediaPayload
 * @property {'play'|'pause'|'next'|'prev'} action - 操作类型
 * @property {string} [url] - 媒体文件地址
 * @property {number} [mediaType] - 媒体类型 (1: 图片, 3: 视频, 7: 文件)
 * @property {number} [width] - 媒体宽度
 * @property {number} [height] - 媒体高度
 * @property {string} [id] - 媒体ID
 * @property {boolean} [external] - 外部播放器
 */

export const MediaAction = Object.freeze({
  PLAY: 'play',
  PAUSE: 'pause',
  NEXT: 'next',
  PREV: 'prev'
});
