// This module is only used by the guard tests; it is never imported by the app.
export const useAppAuth = () => ({ keycloak: globalThis.__telemetryTestAuth, initialized: true });
