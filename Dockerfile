# Multi-stage build for WebRTC-HLS streaming platform

###############################################
# Build stage for shared package
###############################################
FROM node:20-alpine AS shared-builder
WORKDIR /app/shared

# Install build tools needed by dependencies that compile native modules
RUN apk add --no-cache python3 py3-pip make g++

COPY shared/package*.json ./
# Install full deps to build TypeScript
RUN npm ci
COPY shared/ .
RUN npm run build

# Build stage for server
FROM node:20-alpine AS server-builder
WORKDIR /app

# Install system dependencies for mediasoup
RUN apk add --no-cache python3 py3-pip make g++

# Copy shared module first
COPY --from=shared-builder /app/shared ./shared

# Install server dependencies (need dev deps to build with TypeScript)
WORKDIR /app/server
COPY server/package*.json ./
COPY server/prisma ./prisma
RUN npm ci
COPY server/ .

# Generate Prisma client after schema is present
RUN npx prisma generate

# Build server
RUN npm run build

# Build stage for client
FROM node:20-alpine AS client-builder
WORKDIR /app

# Copy shared module
COPY --from=shared-builder /app/shared ./shared

# Install client dependencies and build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .

# Allow overriding public runtime settings at build time
ARG NEXT_PUBLIC_SERVER_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_HLS_BASE_URL
ARG NEXT_PUBLIC_ICE_SERVERS

ENV NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL}
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
ENV NEXT_PUBLIC_HLS_BASE_URL=${NEXT_PUBLIC_HLS_BASE_URL}
ENV NEXT_PUBLIC_ICE_SERVERS=${NEXT_PUBLIC_ICE_SERVERS}

# Build and export static files
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install system dependencies for mediasoup and FFmpeg
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    ffmpeg \
    postgresql-client \
    libc6-compat \
    wget

WORKDIR /app

# Copy shared module
COPY --from=shared-builder /app/shared ./shared

# Copy built server
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/node_modules ./server/node_modules
COPY --from=server-builder /app/server/package*.json ./server/
COPY --from=server-builder /app/server/prisma ./server/prisma

# Copy built client (standalone mode)
COPY --from=client-builder /app/client/.next/standalone/client ./client
COPY --from=client-builder /app/client/.next/static ./client/.next/static
COPY --from=client-builder /app/client/public ./client/public

# Copy root package.json for reference
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
EXPOSE 3001
EXPOSE 40000-49999/udp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start applications
ENTRYPOINT ["docker-entrypoint.sh"]
