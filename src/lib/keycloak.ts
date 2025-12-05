// src/lib/keycloak.ts
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url:  "https://prodauthvistaar.mahapocra.gov.in/auth",
  realm: 'Vistaar',
  clientId: 'vistaar-ui',
});

export default keycloak;