#!/bin/sh
set -e

# Defaults
: "${PORT:=3001}"
: "${NODE_ENV:=production}"
: "${HLS_STORAGE_PATH:=/app/server/storage/hls}"
: "${FFMPEG_PATH:=/usr/bin/ffmpeg}"

# Ensure storage and logs exist for both potential locations
mkdir -p /app/server/storage/hls /app/server/logs /app/storage/hls

# Generate Prisma client if schema present
if [ -d "/app/server/prisma" ]; then
  (cd /app/server && npx prisma generate || true)
fi

# Start server from its directory so process.cwd() is /app/server
(cd /app/server && node dist/index.js) &
SERVER_PID=$!

# Start client (bind to 0.0.0.0)
(cd /app/client && NODE_ENV=production npm run start -- -H 0.0.0.0 -p 3000) &
CLIENT_PID=$!

wait $SERVER_PID $CLIENT_PID
