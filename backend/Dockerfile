# Use a lightweight Node image
FROM node:25.6.1-alpine 
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci
COPY . .

# NODE_ENV default to prod
ENV NODE_ENV=production

# Build
RUN npm run build

# Expose your backend port 
EXPOSE 3000

# Start the server
CMD ["npm", "run", "start:prod"]