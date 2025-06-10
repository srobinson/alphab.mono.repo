/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Add any other environment variables used in the auth-frontend package
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
