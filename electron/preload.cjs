const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onGrabText: (callback) => {
    ipcRenderer.removeAllListeners('grab-text');
    ipcRenderer.on('grab-text', (_event, text) => callback(text));
  },
  onTriggerSexting: (callback) => {
    ipcRenderer.removeAllListeners('trigger-sexting');
    ipcRenderer.on('trigger-sexting', () => callback());
  },
  onResetApp: (callback) => {
    ipcRenderer.removeAllListeners('reset-app');
    ipcRenderer.on('reset-app', () => callback());
  },
  onShortcutPressedFocused: (callback) => {
    ipcRenderer.removeAllListeners('shortcut-pressed-focused');
    ipcRenderer.on('shortcut-pressed-focused', () => callback());
  },
  windowClose: () => ipcRenderer.send('window-close'),
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowHide: () => ipcRenderer.send('window-hide'),
  windowQuit: () => ipcRenderer.send('window-quit'),
  copyText: (text) => ipcRenderer.send('copy-text', text),
  setWindowSize: (width, height) => ipcRenderer.send('set-window-size', width, height)
});
