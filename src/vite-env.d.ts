/// <reference types="vite/client" />

declare module "virtual:pwa-register" {
  interface RegisterSWOptions {
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    immediate?: boolean;
  }

  export function registerSW(options?: RegisterSWOptions): void;
}
