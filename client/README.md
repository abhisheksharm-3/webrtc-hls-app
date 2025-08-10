## WebRTC-HLS Client

Next.js 15 app (App Router) for creating/joining streams and watching HLS broadcasts.

### Env
- NEXT_PUBLIC_SERVER_URL=http://localhost:3001
- NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
- NEXT_PUBLIC_HLS_BASE_URL=http://localhost:3001/hls
- NEXT_PUBLIC_ICE_SERVERS=[{"urls":"stun:stun.l.google.com:19302"}]

### Scripts
- dev: next dev -p 3000
- build: next build
- start: next start -p 3000

### Pages
- `/` landing
- `/stream/[roomId]` host/guest view
- `/watch/[roomId]` viewer (HLS)

### Notes
- Ensure server is running at NEXT_PUBLIC_SERVER_URL
- On Windows, allow microphone/camera permissions in browser
