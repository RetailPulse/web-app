# Stage 1: Build the Angular application
FROM node:23-alpine3.21 AS builder

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --quiet --ignore-scripts

# Copy the rest of the application source code
COPY src/ ./src/
COPY public/ ./public/
COPY angular.json .
COPY tsconfig*.json . 
COPY nginx.conf .


ARG BUILD_CONFIG=production

# Build the Angular application for production
RUN npm run build -- --configuration "$BUILD_CONFIG" --aot --output-path dist

# Stage 2: Serve the application using NGINX
FROM nginx:alpine

# Create a non-root user and group and Remove default NGINX configuration
RUN addgroup -g 1001 -S nginx-group && \
    adduser -u 1001 -S nginx-user -G nginx-group && \
    mkdir -p /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx && \
    chown -R nginx-user:nginx-group /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx && \
    chmod -R 755 /usr/share/nginx/html && \
    rm -rf /usr/share/nginx/html/*

# Copy the built Angular app from the builder stage to NGINX's serving directory
COPY --from=builder /app/dist/browser /usr/share/nginx/html

# Copy custom NGINX configuration (optional)
COPY ./nginx.conf /etc/nginx/nginx.conf

# Switch to non-root user
USER nginx-user

# Expose port 80 for HTTP traffic
EXPOSE 8080

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]
