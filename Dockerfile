# Stage 1: Build the Angular application
FROM node:20-alpine AS builder

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --quiet

# Copy the rest of the application source code
COPY . .

# Build the Angular application for production
RUN npm run build -- --configuration production --output-path dist

# Stage 2: Serve the application using NGINX
FROM nginx:alpine

# Remove default NGINX configuration
RUN rm -rf /usr/share/nginx/html/*

# Copy the built Angular app from the builder stage to NGINX's serving directory
COPY --from=builder /app/dist/browser /usr/share/nginx/html

# Ensure correct file permissions
RUN chmod -R 755 /usr/share/nginx/html

# Copy custom NGINX configuration (optional)
COPY ./nginx.conf /etc/nginx/nginx.conf

# Expose port 80 for HTTP traffic
EXPOSE 80

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]