import { MediaAction, MediaPayload } from './index';
const STORAGE_KEY = 'media_player_state';

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

  /**
   * 发送媒体播放状态到其他窗口
   * @param {MediaPayload} payload
   */
  send(payload) {
    const data = JSON.stringify({
      ...payload,
      _timestamp: Date.now()
    });
    localStorage.setItem(STORAGE_KEY, data);
  }

  play(url, mediaType, width, height) {
    this.send({ action: MediaAction.PLAY, url, mediaType, width, height });
  }

  pause() {
    this.send({ action: MediaAction.PAUSE });
  }

  next() {
    this.send({ action: MediaAction.NEXT });
  }

  prev() {
    this.send({ action: MediaAction.PREV });
  }

  /**
   * 订阅媒体播放状态变更
   * @param {(payload: MediaPayload) => void} callback
   * @returns {() => void} 取消订阅函数
   */
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

  destroy() {
    this._listeners = [];
    window.removeEventListener('storage', this._handleStorageChange);
  }
}
export default new MediaPlayerState();
