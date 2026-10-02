/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SGP_API?: string;
  readonly VITE_BOLETIM_VERSAO?: string;
}

interface EnvBoletim {
  VITE_SGP_API?: string;
  VITE_BOLETIM_VERSAO?: string;
}

declare global {
  interface Window {
    __ENV__?: EnvBoletim;
  }
}

export {};
