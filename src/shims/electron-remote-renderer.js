// Shim for '@electron/remote' in renderer process.
// window.electronAPI exposes the real Electron APIs via the preload script.
const api = (typeof window !== 'undefined' && window.electronAPI) || {};

const getCurrentWindow = () => api.windowControl || {};

module.exports = {
  getCurrentWindow,
  app: api.app || {},
  BrowserWindow: null,
  require: () => ({}),
};
