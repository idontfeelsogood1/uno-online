# Stage 1: Build the Vite app
FROM node:25.6.1-alpine as builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci
COPY . .

# Catch the argument from docker-compose
ARG VITE_API_URL
# Turn it into an environment variable for Vite to use during the build
ENV VITE_API_URL=$VITE_API_URL
# NODE_ENV default to prod
ENV VITE_NODE_ENV=production

# Build
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
