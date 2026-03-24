const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('media-window:minimize'),
  maximize: () => ipcRenderer.send('media-window:maximize'),
  close: () => ipcRenderer.send('media-window:close'),
  saveAs: (filePath) => ipcRenderer.invoke('media-window:saveAs', filePath),
  openPath: (filePathOrUrl) => ipcRenderer.invoke('media-window:openPath', filePathOrUrl),
});
