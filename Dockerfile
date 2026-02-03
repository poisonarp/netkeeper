# Stage 1: Build frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY server.js ./server.js
COPY types.ts ./types.ts
COPY metadata.json ./metadata.json
EXPOSE 3001
CMD ["node", "server.js"]
