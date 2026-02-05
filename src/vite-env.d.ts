/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KEYCLOAK_URL: string;
  readonly VITE_KEYCLOAK_REALM: string;
  readonly VITE_KEYCLOAK_CLIENT_ID: string;
  readonly VITE_SERVER_URL?: string;
  readonly VITE_WATCHTOWER_BASE_URL?: string;
  readonly VITE_WATCHTOWER_JWT?: string;
}
