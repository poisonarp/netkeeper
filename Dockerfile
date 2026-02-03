# Stage 1: Build frontend
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
RUN npm install --loglevel verbose

# Copy source files and build
COPY . .
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine
RUN apk add --no-cache fping
WORKDIR /app

# Install production dependencies
COPY package.json ./
RUN npm install --omit=dev --loglevel verbose

# Copy built assets and server files
COPY --from=builder /app/dist ./dist
COPY server.js ./server.js
COPY types.ts ./types.ts
COPY metadata.json ./metadata.json

EXPOSE 3001
CMD ["node", "server.js"]
