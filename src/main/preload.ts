// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
  db: {
    getProjects: () => ipcRenderer.invoke('db:getProjects'),
    saveProject: (project: any) =>
      ipcRenderer.invoke('db:saveProject', project),
    deleteProject: (id: string) => ipcRenderer.invoke('db:deleteProject', id),
    getChats: (projectId?: string) =>
      ipcRenderer.invoke('db:getChats', projectId),
    saveChat: (chat: any) => ipcRenderer.invoke('db:saveChat', chat),
    deleteChat: (id: string) => ipcRenderer.invoke('db:deleteChat', id),
    getMessages: (chatId: string) =>
      ipcRenderer.invoke('db:getMessages', chatId),
    saveMessage: (message: any, content: string) =>
      ipcRenderer.invoke('db:saveMessage', message, content),
    addMessageSibling: (messageId: string, content: string) =>
      ipcRenderer.invoke('db:addMessageSibling', messageId, content),
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
