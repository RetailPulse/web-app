# Stage 1: Build the Angular application
FROM node:22-alpine AS builder 

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (allow install scripts for esbuild)
RUN npm ci --quiet

# Copy the rest of the application source code
COPY src/ ./src/
COPY public/ ./public/
COPY angular.json .
COPY tsconfig*.json . 
COPY nginx.conf .

ARG BUILD_CONFIG=localk8s

# Build the Angular application for production
RUN npm run build -- --configuration "$BUILD_CONFIG" --aot --output-path dist

# Stage 2: Serve the application using NGINX
FROM nginx:alpine

RUN addgroup -g 1001 -S nginx-group && \
    adduser -u 1001 -S nginx-user -G nginx-group && \
    mkdir -p /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx && \
    chown -R nginx-user:nginx-group /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx && \
    chmod -R 755 /usr/share/nginx/html && \
    rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist/browser /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/nginx.conf

USER nginx-user

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
