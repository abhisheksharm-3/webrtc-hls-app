# WebRTC-HLS Server

This is the backend server for the WebRTC-HLS Streaming Platform. It is built with Express.js, Mediasoup, Prisma ORM, and supports scalable WebRTC streaming and HLS broadcasting.

## Features
- Mediasoup SFU for low-latency WebRTC streaming
- Socket.io for real-time signaling and room management
- FFmpeg integration for HLS transcoding
- PostgreSQL with Prisma ORM for persistent storage
- Redis for session management and caching
- RESTful and WebSocket APIs

## Project Structure

```
server/
├── src/
│   ├── config/         # Configuration files (database, mediasoup, environment)
│   ├── mediasoup/      # Mediasoup worker, router, producer, consumer, transport
│   ├── models/         # Prisma models (Participant, Room, Stream)
│   ├── routes/         # Express routes (health, hls, rooms)
│   ├── services/       # Business logic (HLSService, RoomService, etc.)
│   ├── socket/         # Socket.io handlers
│   └── utils/          # Helpers and logger
├── prisma/             # Prisma schema
├── logs/               # Winston log files
├── package.json        # Server dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## Development

1. Install dependencies:
   ```bash
   cd server
   npm install
   ```
2. Setup environment variables:
   ```bash
   cp .env.example .env
   # Edit .env as needed
   ```
3. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

## Production

- Build and start:
  ```bash
  npm run build
  npm start
  ```

## API
- REST endpoints: `/api/*`
- WebSocket: `/socket.io/`

## License
MIT
