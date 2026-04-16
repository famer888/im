// Shim for 'file-system' npm module in renderer process.
// Provides the .fs property that the original package exposes.
const api = (typeof window !== 'undefined' && window.electronAPI) || {};
module.exports = { fs: api.fs || {} };
