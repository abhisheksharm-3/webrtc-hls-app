#!/bin/sh
set -e

echo "🚀 Starting WebRTC-HLS Application..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER 2>/dev/null; do
  echo "Database not ready, waiting..."
  sleep 2
done

echo "✅ Database is ready!"

# Navigate to server directory and setup database
cd /app/server

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma db push --accept-data-loss

echo "🎬 Starting applications..."

# Go back to root directory
cd /app

# Execute the command passed to the container
exec "$@"
