/**
 * Runtime configuration for the Maharashtra dashboard.
 * Deployments can override these defaults through window.__APP_CONFIG__ or
 * the matching VITE_* build variables.
 */

declare global {
  interface Window {
    __APP_CONFIG__?: {
      KEYCLOAK_URL?: string;
      KEYCLOAK_REALM?: string;
      KEYCLOAK_CLIENT_ID?: string;
      API_SERVER_URL?: string;
      WATCHTOWER_BASE_URL?: string;
      WATCHTOWER_JWT?: string;
      LANGFUSE_BASE_URL?: string;
      LANGFUSE_PROJECT_ID?: string;
    };
  }
}

const runtimeConfig = () => window.__APP_CONFIG__ || {};

export const KEYCLOAK_CONFIG = {
  url:
    runtimeConfig().KEYCLOAK_URL ||
    import.meta.env.VITE_KEYCLOAK_URL ||
    "https://auth-vistaar-dev.mahapocra.gov.in",
  realm:
    runtimeConfig().KEYCLOAK_REALM ||
    import.meta.env.VITE_KEYCLOAK_REALM ||
    "Vistaar-dashboard",
  clientId:
    runtimeConfig().KEYCLOAK_CLIENT_ID ||
    import.meta.env.VITE_KEYCLOAK_CLIENT_ID ||
    "vistaar-ui",
};

export const API_CONFIG = {
  SERVER_URL:
    runtimeConfig().API_SERVER_URL ||
    import.meta.env.VITE_API_SERVER_URL ||
    "https://vistaar-dashboard-dev.mahapocra.gov.in/v1",
};

export const WATCHTOWER_CONFIG = {
  BASE_URL:
    runtimeConfig().WATCHTOWER_BASE_URL ||
    import.meta.env.VITE_WATCHTOWER_BASE_URL ||
    "https://vistaar-dashboard-dev.mahapocra.gov.in/api",
  JWT_TOKEN:
    runtimeConfig().WATCHTOWER_JWT ||
    import.meta.env.VITE_WATCHTOWER_JWT ||
    "",
};

export const LANGFUSE_CONFIG = {
  BASE_URL:
    runtimeConfig().LANGFUSE_BASE_URL ||
    import.meta.env.VITE_LANGFUSE_BASE_URL ||
    "https://vistaar-langfuse.mahapocra.gov.in",
  PROJECT_ID:
    runtimeConfig().LANGFUSE_PROJECT_ID ||
    import.meta.env.VITE_LANGFUSE_PROJECT_ID ||
    "vistaar-telemetry",
};
