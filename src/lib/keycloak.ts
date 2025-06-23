// src/lib/keycloak.ts
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'https://prodauthvistaar.mahapocra.gov.in/auth',
  realm: 'Vistaar',
  clientId: 'vistaar-ui',
});

// Configure Keycloak timeouts and optimization
keycloak.onReady = (authenticated) => {
  console.log('Keycloak ready, authenticated:', authenticated);
};

keycloak.onAuthSuccess = () => {
  console.log('Authentication successful');
};

keycloak.onAuthError = (errorData) => {
  console.error('Authentication error:', errorData);
};

keycloak.onAuthRefreshSuccess = () => {
  console.log('Token refresh successful');
};

keycloak.onAuthRefreshError = () => {
  console.warn('Token refresh failed - user will need to re-authenticate');
};

keycloak.onTokenExpired = () => {
  console.log('Token expired, refreshing...');
  keycloak.updateToken(30)
    .then((refreshed) => {
      if (refreshed) {
        console.log('Token refreshed successfully');
      } else {
        console.log('Token is still valid');
      }
    })
    .catch((error) => {
      console.error('Failed to refresh token:', error);
    });
};

export default keycloak;