## WebRTC-HLS Server

Express API with Socket.IO signaling and Mediasoup for SFU. Prisma/PostgreSQL persists rooms/participants. FFmpeg generates HLS segments served from `/hls`.

### Key Features
- Mediasoup workers/routers/transports management
- WebRTC signaling via Socket.IO
- HLS broadcast with FFmpeg
- Validated environment via Zod
- Structured logging with Winston

### Environment
- NODE_ENV=development
- PORT=3001
- DATABASE_URL=postgresql://user:pass@localhost:5432/webrtc_hls
- ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
- MEDIASOUP_LISTEN_IP=127.0.0.1 (set 0.0.0.0 in production)
- MEDIASOUP_ANNOUNCED_IP=127.0.0.1 (public IP in prod)
- MEDIASOUP_MIN_PORT=40000
- MEDIASOUP_MAX_PORT=49999
- MEDIASOUP_FORCE_TCP= (optional truthy to force TCP)
- HLS_STORAGE_PATH=./storage/hls
- FFMPEG_PATH=/usr/bin/ffmpeg

### Scripts
- dev: tsx watch (NODE_ENV=development)
- build: tsc
- start: node dist (NODE_ENV=production)
- prisma helpers: db:generate, db:push, db:migrate

### REST API
- GET /api/health, GET /api/health/mediasoup
- GET /api/rooms, POST /api/rooms { id, name }, GET /api/rooms/:roomId, DELETE /api/rooms/:roomId
- GET /api/hls/streams, GET /api/hls/streams/:roomId

### Socket Events
- Client->Server: join-room, leave-room, create-transport, connect-transport, produce, consume, start-hls, stop-hls
- Server->Client: room-joined, new-participant, participant-left, new-producer, hls-started, hls-stopped, error

### Notes
- Set MEDIASOUP_LISTEN_IP=0.0.0.0 and MEDIASOUP_ANNOUNCED_IP to your public IP in production
- Ensure ffmpeg is installed and FFMPEG_PATH points to it
