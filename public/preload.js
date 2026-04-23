const { contextBridge, ipcRenderer, clipboard, shell, desktopCapturer } = require('electron');
const remote = require('@electron/remote');
const fs = require('fs');
const nodePath = require('path');
const os = require('os');

// ── Path Guard ──────────────────────────────────────────────────────────────
const _normPath = (p) => {
  const r = nodePath.resolve(String(p));
  return process.platform === 'win32' ? r.toLowerCase() : r;
};

const _allowedBaseDirs = (() => {
  const dirs = [os.tmpdir(), os.homedir()];
  const names = ['userData', 'appData', 'downloads', 'desktop', 'documents', 'pictures'];
  for (const n of names) { try { dirs.push(remote.app.getPath(n)); } catch (e) { /* ignore */ } }
  try { dirs.push(remote.app.getAppPath()); } catch (e) { /* ignore */ }
  return [...new Set(dirs.map(_normPath))];
})();

const _isPathAllowed = (p) => {
  try {
    const r = _normPath(p);
    return _allowedBaseDirs.some(d => r === d || r.startsWith(d + nodePath.sep));
  } catch { return false; }
};

const _assertPath = (p) => {
  if (!_isPathAllowed(p)) throw new Error(`[preload] path blocked by guard: ${p}`);
};
// ────────────────────────────────────────────────────────────────────────────

contextBridge.exposeInMainWorld('electronAPI', {
  // ── IPC Bridge ──
  ipcRenderer: {
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    sendSync: (channel, ...args) => ipcRenderer.sendSync(channel, ...args),
    on: (channel, func) => {
      ipcRenderer.on(channel, func);
    },
    once: (channel, func) => {
      ipcRenderer.once(channel, func);
    },
    removeListener: (channel, func) => ipcRenderer.removeListener(channel, func),
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  },

  // ── Shell ──
  shell: {
    beep: () => shell.beep(),
    openExternal: (url) => shell.openExternal(url),
    openPath: (filePath) => shell.openPath(filePath),
    showItemInFolder: (filePath) => shell.showItemInFolder(filePath),
  },

  // ── Clipboard ──
  clipboard: {
    readText: (type) => clipboard.readText(type),
    writeText: (text, type) => clipboard.writeText(text, type),
    readHTML: (type) => clipboard.readHTML(type),
    writeHTML: (markup, type) => clipboard.writeHTML(markup, type),
    readImage: (type) => {
      const img = clipboard.readImage(type);
      if (!img || img.isEmpty()) return { isEmpty: true, toPNG: null, toDataURL: '' };
      return { isEmpty: false, toPNG: img.toPNG(), toDataURL: img.toDataURL() };
    },
    writeImage: (dataURL) => {
      const { nativeImage } = require('electron');
      const img = nativeImage.createFromDataURL(dataURL);
      clipboard.writeImage(img);
    },
  },

  // ── Window Management (替代 @electron/remote 的窗口操作) ──
  windowControl: {
    minimize: () => remote.getCurrentWindow().minimize(),
    maximize: () => remote.getCurrentWindow().maximize(),
    unmaximize: () => remote.getCurrentWindow().unmaximize(),
    isMaximized: () => remote.getCurrentWindow().isMaximized(),
    close: () => remote.getCurrentWindow().close(),
    show: () => remote.getCurrentWindow().show(),
    hide: () => remote.getCurrentWindow().hide(),
    focus: () => remote.getCurrentWindow().focus(),
    isMinimized: () => remote.getCurrentWindow().isMinimized(),
    isVisible: () => remote.getCurrentWindow().isVisible(),
    restore: () => remote.getCurrentWindow().restore(),
    getMediaSourceId: () => remote.getCurrentWindow().getMediaSourceId(),
    setSize: (w, h) => remote.getCurrentWindow().setSize(w, h),
    getSize: () => remote.getCurrentWindow().getSize(),
    flashFrame: (flag) => remote.getCurrentWindow().flashFrame(flag),
    isFocused: () => remote.getCurrentWindow().isFocused(),
  },

  // ── App ──
  app: {
    getAppPath: () => remote.app.getAppPath(),
    getPath: (name) => remote.app.getPath(name),
    isPackaged: remote.app.isPackaged,
  },

  // ── Desktop Capturer ──
  desktopCapturer: {
    getSources: (opts) => desktopCapturer.getSources(opts),
  },

  // ── File System (path-guarded) ──
  fs: {
    readFileSync: (p, options) => {
      _assertPath(p);
      const result = fs.readFileSync(p, options);
      if (Buffer.isBuffer(result)) return new Uint8Array(result);
      return result;
    },
    writeFileSync: (p, data, options) => {
      _assertPath(p);
      fs.writeFileSync(p, data instanceof Uint8Array ? Buffer.from(data) : data, options);
    },
    readFile: (p, encoding, callback) => {
      if (typeof encoding === 'function') { callback = encoding; encoding = undefined; }
      try { _assertPath(p); } catch (err) { return callback(err); }
      fs.readFile(p, encoding, callback);
    },
    writeFile: (p, data, callback) => {
      try { _assertPath(p); } catch (err) { return typeof callback === 'function' ? callback(err) : undefined; }
      fs.writeFile(p, data instanceof Uint8Array ? Buffer.from(data) : data, callback);
    },
    existsSync: (p) => {
      if (!_isPathAllowed(p)) return false;
      try { return fs.existsSync(p); } catch { return false; }
    },
    access: (p, mode, callback) => {
      if (typeof mode === 'function') { callback = mode; mode = fs.F_OK; }
      try { _assertPath(p); } catch (err) { return typeof callback === 'function' ? callback(err) : undefined; }
      fs.access(p, mode, callback);
    },
    accessSync: (p, mode) => {
      _assertPath(p);
      fs.accessSync(p, mode);
    },
    statSync: (p) => {
      _assertPath(p);
      const stat = fs.statSync(p);
      return { isFile: () => stat.isFile(), isDirectory: () => stat.isDirectory(), size: stat.size, mtime: stat.mtime };
    },
    stat: (p, callback) => {
      try { _assertPath(p); } catch (err) { return callback(err); }
      fs.stat(p, (err, stat) => {
        if (err) return callback(err);
        callback(null, { isFile: () => stat.isFile(), isDirectory: () => stat.isDirectory(), size: stat.size, mtime: stat.mtime });
      });
    },
    mkdirSync: (p, options) => {
      _assertPath(p);
      fs.mkdirSync(p, options);
    },
    mkdir: (p, options, callback) => {
      try { _assertPath(p); } catch (err) { return typeof callback === 'function' ? callback(err) : undefined; }
      fs.mkdir(p, options, callback);
    },
    rmdirSync: (p) => {
      _assertPath(p);
      fs.rmdirSync(p);
    },
    unlinkSync: (p) => {
      _assertPath(p);
      if (nodePath.basename(p) !== 'temporarydata.txt') {
        throw new Error('[preload] delete restricted to temporarydata.txt');
      }
      fs.unlinkSync(p);
    },
    unlink: (p, callback) => {
      try {
        _assertPath(p);
        if (nodePath.basename(p) !== 'temporarydata.txt') {
          throw new Error('[preload] delete restricted to temporarydata.txt');
        }
      } catch (err) {
        return typeof callback === 'function' ? callback(err) : undefined;
      }
      fs.unlink(p, (err) => {
        if (typeof callback === 'function') callback(err);
      });
    },
    readdirSync: (p) => {
      _assertPath(p);
      return fs.readdirSync(p);
    },
    createWriteStream: (p, options) => {
      _assertPath(p);
      return fs.createWriteStream(p, options);
    },
    F_OK: fs.F_OK,
    constants: { F_OK: fs.F_OK, R_OK: fs.constants.R_OK, W_OK: fs.constants.W_OK },
  },

  // ── Path ──
  path: {
    join: (...args) => nodePath.join(...args),
    basename: (p, ext) => nodePath.basename(p, ext),
    dirname: (p) => nodePath.dirname(p),
    extname: (p) => nodePath.extname(p),
    resolve: (...args) => nodePath.resolve(...args),
    sep: nodePath.sep,
  },

  // ── OS ──
  os: {
    tmpdir: () => os.tmpdir(),
    platform: () => os.platform(),
    homedir: () => os.homedir(),
    type: () => os.type(),
    release: () => os.release(),
    networkInterfaces: () => {
      const ifaces = os.networkInterfaces();
      const result = {};
      for (const [name, addrs] of Object.entries(ifaces)) {
        result[name] = addrs.map(a => ({ address: a.address, netmask: a.netmask, family: a.family, mac: a.mac, internal: a.internal }));
      }
      return result;
    },
  },

  // ── Buffer 工具 ──
  Buffer: {
    from: (data, encoding) => {
      const buf = Buffer.from(data, encoding);
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    },
    isBuffer: (obj) => Buffer.isBuffer(obj) || obj instanceof Uint8Array,
    alloc: (size) => new Uint8Array(size),
    toString: (uint8arr, encoding) => Buffer.from(uint8arr).toString(encoding),
  },

  // ── Process ──
  process: {
    platform: process.platform,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      WEBPACK_DEV_SERVER_URL: process.env.WEBPACK_DEV_SERVER_URL,
    },
    versions: { electron: (process.versions || {}).electron, node: (process.versions || {}).node },
    type: process.type,
    execPath: process.execPath,
  },

  // ── Storage ──
  storage: {
    get: (tableName, key = 'data') => ipcRenderer.invoke('storage:get', { tableName, key }),
    set: (tableName, value, key = 'data') => ipcRenderer.invoke('storage:set', { tableName, value, key }),
    delete: (tableName, key = 'data') => ipcRenderer.invoke('storage:delete', { tableName, key }),
    clear: (tableName) => ipcRenderer.invoke('storage:clear', { tableName }),
  },
});
