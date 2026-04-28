export const MediaType = Object.freeze({
  IMAGE: 1,  // 图片
  VIDEO: 3,  // 视频
  FILE: 7,   // 文件（与 enumMsgType.file / 消息 chatType 一致）
});

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
