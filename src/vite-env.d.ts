/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_PUBLIC_URL?: string;
  readonly VITE_COUPLE_NAMES?: string;
  readonly VITE_WEDDING_DATE?: string;
  readonly VITE_TAGLINE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
