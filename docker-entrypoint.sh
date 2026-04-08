#!/bin/sh
set -e

# Check if ANY of the runtime configuration variables are set
# We check all of them to be robust, not just API_SERVER_URL
if [ -n "$KEYCLOAK_URL$KEYCLOAK_REALM$KEYCLOAK_CLIENT_ID$API_SERVER_URL$WATCHTOWER_BASE_URL$WATCHTOWER_JWT" ]; then
    echo "Runtime environment variables detected. Generating config.js from template..."
    envsubst < /usr/share/nginx/html/config.template.js > /usr/share/nginx/html/config.js
else
    if [ -f /usr/share/nginx/html/config.js ]; then
        echo "No runtime overrides provided. Using baked-in config.js..."
    else
        echo "No config.js found and no runtime overrides. Generating default config..."
        envsubst < /usr/share/nginx/html/config.template.js > /usr/share/nginx/html/config.js
    fi
fi

# Start nginx
exec nginx -g "daemon off;"
