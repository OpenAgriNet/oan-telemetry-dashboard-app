/**
 * Environment configuration for the application.
 * Values are read from VITE_* env vars at build time.
 */

export const API_CONFIG = {
  SERVER_URL: import.meta.env.VITE_SERVER_URL ?? '',
};

export const WATCHTOWER_CONFIG = {
  BASE_URL: import.meta.env.VITE_WATCHTOWER_BASE_URL ?? '',
  JWT_TOKEN: import.meta.env.VITE_WATCHTOWER_JWT ?? '',
};
