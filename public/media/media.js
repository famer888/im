let isMaximized = false;
const maxIcon = document.getElementById('max-icon');
const svgRestore = '<path d="M5 3h8v8M3 5h8v8H3z" fill="none" stroke-width="1.5"/>';
const svgMaximize = '<rect x="3" y="3" width="10" height="10" rx="1.5" fill="none" stroke-width="1.5"/>';
function toggleMaximize() { window.electronAPI?.maximize?.(); isMaximized = !isMaximized; maxIcon.innerHTML = isMaximized ? svgRestore : svgMaximize; }

document.querySelector('.titlebar-btn.minimize').addEventListener('click', () => window.electronAPI?.minimize?.());
document.querySelector('.titlebar-btn.maximize').addEventListener('click', toggleMaximize);
document.querySelector('.titlebar-btn.close').addEventListener('click', () => window.electronAPI?.close?.());

const videoPlayer = new Plyr('#video-player', {
  controls: ['play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'fullscreen'],
  tooltips: { controls: false, seek: true },
  invertTime: false,
  autoplay: true
});

/** 图片与视频共用；非 image 类型时不等待 load，可用 width/height 覆盖原始尺寸 */
const MEDIA_WZOOM_BASE = { minScale: 1, maxScale: 3, speed: 2, zoomOnClick: false, zoomOnDblClick: false };
function mediaWZoomOptions(overrides) {
  return Object.assign({}, MEDIA_WZOOM_BASE, overrides);
}

function debounce(fn, wait) {
  let t;
  return function debounced() {
    clearTimeout(t);
    t = setTimeout(fn, wait);
  };
}

/**
 * 无协议时，将绝对本地路径转为 local-resource URL；已有 file:// 的也统一转为 local-resource://。
 * http(s)/blob/data 等原样返回。
 */
function ensureFileOrRemoteUrl(src) {
  if (!src || typeof src !== 'string') return src;
  const s = src.trim();
  if (!s) return src;
  if (/^(https?|blob|data|local-resource):/i.test(s)) return s;
  if (/^file:/i.test(s)) return s.replace(/^file:\/\//i, 'local-resource://');
  const normalized = s.replace(/\\/g, '/');
  if (/^[a-zA-Z]:\//.test(normalized)) {
    return 'local-resource:///' + encodeURI(normalized);
  }
  if (normalized.startsWith('/')) {
    return 'local-resource://' + encodeURI(normalized);
  }
  return s;
}

/** file: / local-resource: 大小写不敏感；提取本地文件路径 */
function fileUrlToLocalPath(src) {
  if (!src || typeof src !== 'string') return src;
  if (/^local-resource:/i.test(src)) {
    try {
      let p = decodeURIComponent(src.replace(/^local-resource:\/\//i, ''));
      if (/^\/[A-Za-z]:[\\/]/.test(p)) p = p.slice(1);
      return p;
    } catch (e) {
      let p = src.replace(/^local-resource:\/\//i, '');
      if (/^\/[A-Za-z]:[\\/]/.test(p)) p = p.slice(1);
      return p;
    }
  }
  if (!/^file:/i.test(src)) return src;
  try {
    const u = new URL(src);
    let p = decodeURIComponent(u.pathname.replace(/\+/g, ' '));
    if (/^\/[A-Za-z]:\//.test(p)) p = p.slice(1);
    return p;
  } catch (e) {
    try {
      const stripped = src.replace(/^file:\/\/?/i, '');
      return decodeURIComponent(stripped);
    } catch (e2) {
      return src.replace(/^file:\/\/?/i, '');
    }
  }
}

function formatPathForDisplay(src) {
  if (!src) return '';
  if (/^(file|local-resource):/i.test(src)) return fileUrlToLocalPath(src);
  return src;
}

function setMediaFilePathLabel(src) {
  const el = document.getElementById('media-file-path');
  if (!el) return;
  const text = formatPathForDisplay(src);
  el.textContent = text;
  el.style.display = text ? '' : 'none';
}

/** 放大态下：位移超过此值视为 drag，不触发缩放回 1（图片与视频共用） */
const MEDIA_TAP_MOVE_MAX_PX = 12;
const MEDIA_TAP_TIME_MAX_MS = 500;

const mediaView = {
  _rotation: 0,
  _wz: null,
  _src: '',
  _mediaType: '',
  _naturalWidth: 0,
  _naturalHeight: 0,
  /** 视频 tap 复位后吞掉紧随的 click，避免误触播放/暂停 */
  _consumeNextVideoClick: false,

  /** WZoom 在首次 init 时缓存了 viewport 尺寸，窗口拉伸/最大化后需重建，否则缩放的坐标焦点会偏移 */
  _syncImageZoomChrome(scale) {
    const layer = document.getElementById('image-layer');
    if (!layer || this._mediaType !== window.MediaType.IMAGE) return;
    layer.classList.toggle('image-zoomed', scale > 1);
  },

  _syncVideoZoomChrome(scale) {
    const layer = document.getElementById('video-layer');
    if (!layer || this._mediaType !== window.MediaType.VIDEO) return;
    layer.classList.toggle('video-zoomed', scale > 1);
  },

  _rebuildWheelZoom() {
    if (this._wz) {
      this._wz.destroy();
      this._wz = null;
    }
    if (this._mediaType === window.MediaType.IMAGE) {
      if (!document.querySelector('#img-wrap img')) return;
      const w = this._naturalWidth || undefined;
      const h = this._naturalHeight || undefined;
      const self = this;
      const opts = mediaWZoomOptions({
        type: 'image',
        rescale(wz) {
          self._syncImageZoomChrome(wz.content.currentScale);
        }
      });
      if (w) opts.width = w;
      if (h) opts.height = h;
      this._wz = WZoom.create('#img-wrap img', opts);
      this._syncImageZoomChrome(this._wz.content.currentScale);
    } else if (this._mediaType === window.MediaType.VIDEO) {
      const plyrEl = document.querySelector('#video-wrap .plyr');
      if (!plyrEl) return;
      const w = this._naturalWidth || undefined;
      const h = this._naturalHeight || undefined;
      const self = this;
      const opts = mediaWZoomOptions({
        type: 'html',
        rescale(wz) {
          self._syncVideoZoomChrome(wz.content.currentScale);
        }
      });
      if (w) opts.width = w;
      if (h) opts.height = h;
      this._wz = WZoom.create(plyrEl, opts);
      this._syncVideoZoomChrome(this._wz.content.currentScale);
    }
  },

  init(src, mediaType, width, height, cover) {
    const resolvedSrc = ensureFileOrRemoteUrl(src);
    this._src = resolvedSrc;
    this._mediaType = mediaType;
    this._naturalWidth = width || 0;
    this._naturalHeight = height || 0;
    this._cover = cover || '';
    this._rotation = 0;
    setMediaFilePathLabel(resolvedSrc);

    const typeLabel = mediaType === window.MediaType.VIDEO ? '视频' : '图片';
    document.title = typeLabel;
    const labelEl = document.getElementById('media-type-label');
    if (labelEl) labelEl.textContent = typeLabel;

    const imageLayer = document.getElementById('image-layer');
    const videoLayer = document.getElementById('video-layer');

    document.getElementById('rotate-btn').style.display = mediaType === window.MediaType.IMAGE ? '' : 'none';

    if (mediaType === window.MediaType.IMAGE) {
      imageLayer.classList.add('active');
      imageLayer.classList.remove('image-zoomed');
      videoLayer.classList.remove('active');
      videoLayer.classList.remove('video-zoomed');
      if (this._wz) { this._wz.destroy(); this._wz = null; }
      imageLayer.innerHTML = '<div id="img-wrap"><img /></div>';
      const img = imageLayer.querySelector('img');
      img.src = resolvedSrc;
      if (width) img.setAttribute('data-width', width);
      if (height) img.setAttribute('data-height', height);
      this._rebuildWheelZoom();
    } else if (mediaType === window.MediaType.VIDEO) {
      videoLayer.classList.add('active');
      videoLayer.classList.remove('video-zoomed');
      imageLayer.classList.remove('active');
      imageLayer.classList.remove('image-zoomed');
      if (this._wz) { this._wz.destroy(); this._wz = null; }
      imageLayer.innerHTML = '';
      const videoEl = document.getElementById('video-player');
      if (cover) videoEl.poster = ensureFileOrRemoteUrl(cover);
      videoPlayer.source = { type: 'video', sources: [{ src: resolvedSrc }] };
      videoPlayer.once('ready', () => {
        videoPlayer.play();
        this._rebuildWheelZoom();
      });
    }
  },

  _getImg() { return document.querySelector('#image-layer img'); },

  rotate() { const wrap = document.getElementById('img-wrap'); if (!wrap) return; this._rotation += 90; wrap.style.transform = `rotate(${this._rotation}deg)`; },

  async saveAs() {
    const src = this._src;
    if (!src) return;
    const filePath = fileUrlToLocalPath(src);
    window.electronAPI?.saveAs(filePath);
  },

  setSize(width, height) {
    this._naturalWidth = width;
    this._naturalHeight = height;
  },

  async openWithDefaultApp() {
    const src = this._src;
    if (!src) return;
    const filePath = fileUrlToLocalPath(src);
    const res = await window.electronAPI?.openPath?.(filePath);
    if (res && !res.success && res.error) console.error('openPath:', res.error);
  }
};

document.getElementById('rotate-btn').addEventListener('click', () => mediaView.rotate());
document.getElementById('open-default-app-btn').addEventListener('click', () => mediaView.openWithDefaultApp());

function handleMediaState(state) {
  if (!state || !state.url) return;
  const mediaType = state.mediaType === 3 ? window.MediaType.VIDEO : window.MediaType.IMAGE;
  mediaView.init(state.url, mediaType, state.width, state.height, state.cover);
}

handleMediaState(window.mediaState?.get());
window.mediaState?.subscribe(handleMediaState);

/** 媒体窗口「在前台、展示中」：可见且当前接收键盘焦点（主窗口在前台时本窗口不会收到 keydown） */
function isMediaPresentationActive() {
  return (
    !document.hidden &&
    document.visibilityState === 'visible' &&
    document.hasFocus()
  );
}

window.addEventListener(
  'keydown',
  (e) => {
    if (e.key !== 'Escape') return;
    if (!isMediaPresentationActive()) return;
    if (document.fullscreenElement) return;
    e.preventDefault();
    window.electronAPI?.close?.();
  },
  true
);

window.addEventListener('resize', debounce(() => mediaView._rebuildWheelZoom(), 120));

(function bindMediaZoomTapReset() {
  const imageLayer = document.getElementById('image-layer');
  const videoWrap = document.getElementById('video-wrap');
  const videoLayer = document.getElementById('video-layer');
  if (!imageLayer || !videoWrap || !videoLayer) return;

  let tapTrack = null;

  function removeGlobalPointerListeners() {
    window.removeEventListener('pointermove', onGlobalPointerMove, true);
    window.removeEventListener('pointerup', onGlobalPointerUp, true);
    window.removeEventListener('pointercancel', onGlobalPointerCancel, true);
  }

  function onGlobalPointerMove(e) {
    if (!tapTrack || e.pointerId !== tapTrack.id) return;
    if (Math.hypot(e.clientX - tapTrack.x, e.clientY - tapTrack.y) > MEDIA_TAP_MOVE_MAX_PX) {
      tapTrack.moved = true;
    }
  }

  function onGlobalPointerCancel(e) {
    if (!tapTrack || e.pointerId !== tapTrack.id) return;
    tapTrack = null;
    removeGlobalPointerListeners();
  }

  function onGlobalPointerUp(e) {
    if (!tapTrack || e.pointerId !== tapTrack.id) return;
    const track = tapTrack;
    tapTrack = null;
    removeGlobalPointerListeners();
    if (mediaView._mediaType !== track.mode) return;
    if (!mediaView._wz || mediaView._wz.content.currentScale <= 1) return;
    if (track.moved) return;
    if (Date.now() - track.t > MEDIA_TAP_TIME_MAX_MS) return;
    mediaView._wz.maxZoomDown();
    if (track.mode === window.MediaType.VIDEO) {
      mediaView._consumeNextVideoClick = true;
      setTimeout(() => {
        if (mediaView._consumeNextVideoClick) mediaView._consumeNextVideoClick = false;
      }, 400);
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }

  function beginTapTrack(e, mode) {
    if (!e.isPrimary || mediaView._mediaType !== mode) return;
    if (!mediaView._wz || mediaView._wz.content.currentScale <= 1) return;
    if (tapTrack) {
      removeGlobalPointerListeners();
      tapTrack = null;
    }
    tapTrack = { id: e.pointerId, x: e.clientX, y: e.clientY, t: Date.now(), moved: false, mode };
    window.addEventListener('pointermove', onGlobalPointerMove, true);
    window.addEventListener('pointerup', onGlobalPointerUp, true);
    window.addEventListener('pointercancel', onGlobalPointerCancel, true);
  }

  imageLayer.addEventListener(
    'pointerdown',
    (e) => {
      if (!imageLayer.classList.contains('active')) return;
      if (!e.target.closest('#img-wrap')) return;
      beginTapTrack(e, window.MediaType.IMAGE);
    },
    true
  );

  videoWrap.addEventListener(
    'pointerdown',
    (e) => {
      if (!videoLayer.classList.contains('active')) return;
      if (!e.target.closest('#video-wrap')) return;
      beginTapTrack(e, window.MediaType.VIDEO);
    },
    true
  );

  videoWrap.addEventListener(
    'click',
    (e) => {
      if (mediaView._consumeNextVideoClick) {
        mediaView._consumeNextVideoClick = false;
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      if (mediaView._mediaType !== window.MediaType.VIDEO) return;
      if (!videoLayer.classList.contains('video-zoomed')) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    },
    true
  );
})();
