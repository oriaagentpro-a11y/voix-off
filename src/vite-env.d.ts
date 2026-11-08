/// <reference types="vite/client" />

interface Window {
  voxStudioDesktop?: {
    isDesktop: boolean;
    platform: string;
    version: string;
    openExternal?: (url: string) => Promise<boolean>;
    minimize?: () => void;
    maximize?: () => void;
    close?: () => void;
    onMenuAction?: (channel: string, callback: () => void) => () => void;
  };
}
