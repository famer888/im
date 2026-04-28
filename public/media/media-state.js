const STORAGE_KEY = 'media_player_state';

/** 与 src/utils/base.js enumMsgType 一致：image 1、video 3、file 7 */
const MediaType = Object.freeze({ IMAGE: 1, VIDEO: 3, FILE: 7 });

const MediaAction = Object.freeze({ PLAY: 'play', PAUSE: 'pause', NEXT: 'next', PREV: 'prev' });

class MediaPlayerState {
  constructor() {
    this._listeners = [];
    this._handleStorageChange = this._handleStorageChange.bind(this);
  }

  _handleStorageChange(event) {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      const payload = JSON.parse(event.newValue);
      this._listeners.forEach(callback => callback(payload));
    } catch (e) {
      console.error('MediaPlayerState: failed to parse payload', e);
    }
  }

  get() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { return {}; }
  }

  send(payload, extend) {
    const data = extend ? { ...this.get(), ...payload, _timestamp: Date.now() } : { ...payload, _timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  create(url, mediaType, width, height) { this.send({ url, mediaType, width, height }); }
  play() { this.send({ action: MediaAction.PLAY }, true); }
  pause() { this.send({ action: MediaAction.PAUSE }, true); }
  next(url, mediaType, width, height) { this.send({ action: MediaAction.NEXT, url, mediaType, width, height }); }
  prev(url, mediaType, width, height) { this.send({ action: MediaAction.PREV, url, mediaType, width, height }); }

  subscribe(callback) {
    if (this._listeners.length === 0) {
      window.addEventListener('storage', this._handleStorageChange);
    }
    this._listeners.push(callback);
    return () => this.unsubscribe(callback);
  }

  unsubscribe(callback) {
    this._listeners = this._listeners.filter(cb => cb !== callback);
    if (this._listeners.length === 0) {
      window.removeEventListener('storage', this._handleStorageChange);
    }
  }
}

if (typeof window !== 'undefined') {
  window.MediaType = MediaType;
  window.MediaAction = MediaAction;
  window.mediaState = new MediaPlayerState();
}
