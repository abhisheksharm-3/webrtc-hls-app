#!/bin/sh
set -e

# Defaults
: "${NODE_ENV:=production}"
: "${HLS_STORAGE_PATH:=/app/server/storage/hls}"
: "${FFMPEG_PATH:=/usr/bin/ffmpeg}"

# Ensure storage and logs exist
mkdir -p /app/server/storage/hls /app/server/logs

# Generate Prisma client if schema present
if [ -d "/app/server/prisma" ]; then
  (cd /app/server && npx prisma generate || true)
fi

# Start Express server on port 3002 (internal API server)
(cd /app/server && PORT=3002 node dist/index.js) &
SERVER_PID=$!

# Wait a moment for Express to start
sleep 5

# Start Next.js server on port 3001 (main public port with rewrites to Express)
(cd /app/client && PORT=3001 node server.js) &
NEXT_PID=$!

# Wait for both processes
wait $NEXT_PID $SERVER_PID
