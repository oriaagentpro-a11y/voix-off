import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("voxStudioDesktop", {
  isDesktop: true,
  platform: process.platform,
  version: "1.0.0",
  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  close: () => ipcRenderer.send("window-close"),
  onMenuAction: (channel: string, callback: () => void) => {
    const validChannels = [
      "open-teleprompter",
      "open-script-doctor",
      "open-api-keys",
      "menu-new-session",
      "open-about-modal",
    ];
    if (validChannels.includes(channel)) {
      const subscription = () => callback();
      ipcRenderer.on(channel, subscription);
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
    return () => {};
  },
});
