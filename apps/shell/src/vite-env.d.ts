/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_SMART40_WS_URL?: string;
  readonly VITE_SMART40_WS_TOKEN?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
