// Renderer-side shim for 'electron' module.
// With contextIsolation: true & nodeIntegration: false, the real 'electron' package
// is not available in the renderer. All APIs are exposed via window.electronAPI from the preload script.

const api = (typeof window !== 'undefined' && window.electronAPI) || {};

export const ipcRenderer = api.ipcRenderer || {};
export const shell = api.shell || {};
export const clipboard = api.clipboard || {};
export const desktopCapturer = api.desktopCapturer || {};
export default { ipcRenderer, shell, clipboard, desktopCapturer };
