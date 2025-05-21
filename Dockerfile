# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and bun.lockb
COPY package.json ./
COPY bun.lockb ./

# Install dependencies using bun
RUN npm install -g bun
RUN bun install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the application
RUN bun run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine AS server

# Copy the built application from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration if you have a custom one
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"] 