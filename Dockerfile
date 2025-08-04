# Multi-stage build for WebRTC-HLS streaming platform

# Build stage for client
FROM node:18-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --only=production --legacy-peer-deps
COPY client/ .
RUN npm run build

# Build stage for server
FROM node:18-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install system dependencies for mediasoup and FFmpeg
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    ffmpeg \
    libc6-compat

WORKDIR /app

# Copy built applications
COPY --from=client-builder /app/client/.next ./client/.next
COPY --from=client-builder /app/client/public ./client/public
COPY --from=client-builder /app/client/package*.json ./client/
COPY --from=client-builder /app/client/next.config.js ./client/

COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/node_modules ./server/node_modules
COPY --from=server-builder /app/server/package*.json ./server/
COPY --from=server-builder /app/server/prisma ./server/prisma

# Copy shared types
COPY shared/ ./shared/

# Copy root package.json for scripts
COPY package*.json ./

# Install production dependencies for client
WORKDIR /app/client
RUN npm ci --only=production --legacy-peer-deps

# Set working directory back to root
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Create necessary directories with proper permissions
RUN mkdir -p /app/server/hls /app/server/recordings /app/server/uploads && \
    chown -R nextjs:nodejs /app

USER nextjs

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start both applications
CMD ["npm", "start"]
