# Stage 1: Build
FROM node:18-alpine AS build

# Set working directory
WORKDIR /usr/local/app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with fallback strategy
# Try npm ci first (faster), fallback to npm install if lock file is out of sync
RUN npm ci || npm install

# Copy source code
COPY . .

# Build the application with production optimizations
RUN npm run build

# Stage 2: Serve with optimized nginx
FROM nginx:alpine

# Install curl for health checks and nginx modules for compression
RUN apk add --no-cache curl nginx-mod-http-brotli

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from build stage
COPY --from=build /usr/local/app/dist /usr/share/nginx/html

# Create nginx user and set permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8881/health || exit 1

# Expose port
EXPOSE 8881

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
