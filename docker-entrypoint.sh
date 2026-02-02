#!/bin/sh
set -e

# Generate config.js from template using environment variables
# Empty env vars will result in empty strings in config, falling back to environment.ts defaults
envsubst < /usr/share/nginx/html/config.template.js > /usr/share/nginx/html/config.js

# Start nginx
exec nginx -g "daemon off;"
