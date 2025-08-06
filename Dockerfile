# Multi-stage build for WebRTC-HLS streaming platform

# Build stage for shared dependencies
FROM node:18-alpine AS shared-builder
WORKDIR /app/shared
COPY shared/package*.json ./
RUN npm ci --only=production
COPY shared/ .
RUN npm run build

# Build stage for server
FROM node:18-alpine AS server-builder
WORKDIR /app

# Install system dependencies for mediasoup
RUN apk add --no-cache python3 make g++

# Copy shared module first
COPY --from=shared-builder /app/shared ./shared

# Install server dependencies
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ .
RUN npm run build

# Build stage for client
FROM node:18-alpine AS client-builder
WORKDIR /app

# Copy shared module
COPY --from=shared-builder /app/shared ./shared

# Install client dependencies and build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --only=production
COPY client/ .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install system dependencies for mediasoup and FFmpeg
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    ffmpeg \
    postgresql-client \
    libc6-compat

WORKDIR /app

# Copy shared module
COPY --from=shared-builder /app/shared ./shared

# Copy built server
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/node_modules ./server/node_modules
COPY --from=server-builder /app/server/package*.json ./server/
COPY --from=server-builder /app/server/prisma ./server/prisma

# Copy built client
COPY --from=client-builder /app/client/.next ./client/.next
COPY --from=client-builder /app/client/public ./client/public
COPY --from=client-builder /app/client/package*.json ./client/
COPY --from=client-builder /app/client/next.config.ts ./client/
COPY --from=client-builder /app/client/node_modules ./client/node_modules

# Copy root package.json for scripts
COPY package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Create necessary directories with proper permissions
RUN mkdir -p /app/server/storage/hls /app/server/logs && \
    chown -R nextjs:nodejs /app

# Copy startup script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && \
    chown nextjs:nodejs /usr/local/bin/docker-entrypoint.sh

USER nextjs

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start applications
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
