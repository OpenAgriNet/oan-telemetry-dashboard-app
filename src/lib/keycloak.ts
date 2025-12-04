// src/lib/keycloak.ts
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url:  'https://auth-vistaar-dev.mahapocra.gov.in/',
  realm: 'Vistaar-dashboard',
  clientId: 'vistaar-ui',
});

export default keycloak;