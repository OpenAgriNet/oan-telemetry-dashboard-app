# Stage 1: Build
FROM node:22.17.1-alpine AS build
WORKDIR /usr/local/app
COPY ./ /usr/local/app/
RUN npm install
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Install gettext for envsubst (runtime config injection)
RUN apk add --no-cache gettext

# Copy built app
COPY --from=build /usr/local/app/dist .

# Copy config template for runtime injection
COPY --from=build /usr/local/app/public/config.template.js .

# Add nginx config for SPA routing
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy and setup entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8881

# Use entrypoint for runtime config injection
ENTRYPOINT ["/docker-entrypoint.sh"]
