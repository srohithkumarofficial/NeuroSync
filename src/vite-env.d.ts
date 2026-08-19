/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_USE_MOCK_API: string;
  readonly VITE_MRI_AI_SERVICE_URL: string;
  readonly VITE_MRI_AI_API_URL: string;
  readonly VITE_MRI_STATUS_STREAM_URL: string;
  readonly VITE_ENABLE_SPINAL_MRI: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
