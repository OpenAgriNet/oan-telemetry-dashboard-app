/**
 * Environment configuration for the application
 */

// API Configuration
export const API_CONFIG = {
  // SERVER_URL: 'http://localhost:4000/v1',
  SERVER_URL: 'https://vistaar-dashboard-dev.mahapocra.gov.in/v1',
};

// Watchtower Status API Configuration
export const WATCHTOWER_CONFIG = {
  BASE_URL: import.meta.env.VITE_WATCHTOWER_BASE_URL || 'https://vistaar-dashboard-dev.mahapocra.gov.in/api',
  JWT_TOKEN: import.meta.env.VITE_WATCHTOWER_JWT || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCTAyMn0'
};
