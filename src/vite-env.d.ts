/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_ADVISOR_WEBHOOK_URL: string;
    readonly VITE_GROQ_API_KEY: string;
    // more env variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
