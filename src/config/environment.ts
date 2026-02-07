/**
 * Runtime configuration for the application
 * Values are loaded from window.__APP_CONFIG__ at runtime (injected at container startup)
 * Fallbacks are provided for local development
 */

// Type for runtime config
declare global {
  interface Window {
    __APP_CONFIG__?: {
      KEYCLOAK_URL?: string;
      KEYCLOAK_REALM?: string;
      KEYCLOAK_CLIENT_ID?: string;
      API_SERVER_URL?: string;
      WATCHTOWER_BASE_URL?: string;
      WATCHTOWER_JWT?: string;
    };
  }
}

// Get runtime config with fallbacks
const getConfig = () => window.__APP_CONFIG__ || {};

// Keycloak Configuration
export const KEYCLOAK_CONFIG = {
  url: getConfig().KEYCLOAK_URL || import.meta.env.VITE_KEYCLOAK_URL || "https://dev-auth-vistaar.da.gov.in/auth",
  realm: getConfig().KEYCLOAK_REALM || import.meta.env.VITE_KEYCLOAK_REALM || "bharat-vistaar",
  clientId: getConfig().KEYCLOAK_CLIENT_ID || import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "bharat-vistaar",
};

// API Configuration
export const API_CONFIG = {
  SERVER_URL: getConfig().API_SERVER_URL || import.meta.env.VITE_API_SERVER_URL || "https://dev-dashboard-vistaar.da.gov.in/v1",
};

// Watchtower Status API Configuration
export const WATCHTOWER_CONFIG = {
  BASE_URL: getConfig().WATCHTOWER_BASE_URL || import.meta.env.VITE_WATCHTOWER_BASE_URL || "https://dev-dashboard-vistaar.da.gov.in/api",
  JWT_TOKEN: getConfig().WATCHTOWER_JWT || import.meta.env.VITE_WATCHTOWER_JWT || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.acOzzZC-2K7W0_ImyPJqnBflsE14ndwqAIBKLXinKbc",
};
