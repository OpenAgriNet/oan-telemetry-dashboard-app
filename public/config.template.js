// Runtime configuration - injected at container startup via envsubst
// This template file is processed by docker-entrypoint.sh
window.__APP_CONFIG__ = {
    KEYCLOAK_URL: "${KEYCLOAK_URL}",
    KEYCLOAK_REALM: "${KEYCLOAK_REALM}",
    KEYCLOAK_CLIENT_ID: "${KEYCLOAK_CLIENT_ID}",
    API_SERVER_URL: "${API_SERVER_URL}",
    WATCHTOWER_BASE_URL: "${WATCHTOWER_BASE_URL}",
    WATCHTOWER_JWT: "${WATCHTOWER_JWT}",
};
