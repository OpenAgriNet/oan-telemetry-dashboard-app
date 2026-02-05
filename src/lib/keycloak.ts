import Keycloak from 'keycloak-js';

const KEYCLOAK_CONFIG = {
  url: (import.meta.env.VITE_KEYCLOAK_URL ?? '').replace(/\/$/, ''),
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? '',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? '',
};

export const isKeycloakConfigValid = (): boolean =>
  Boolean(KEYCLOAK_CONFIG.url && KEYCLOAK_CONFIG.realm && KEYCLOAK_CONFIG.clientId);

const keycloak = new Keycloak({
  url: KEYCLOAK_CONFIG.url,
  realm: KEYCLOAK_CONFIG.realm,
  clientId: KEYCLOAK_CONFIG.clientId,
});

export default keycloak;
