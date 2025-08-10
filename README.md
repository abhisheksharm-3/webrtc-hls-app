# WebRTC-HLS Streaming Platform

A complete production-grade WebRTC to HLS streaming platform built with TypeScript, featuring real-time peer-to-peer communication and scalable HLS broadcasting.

## 🚀 Features

- **WebRTC Streaming**: Low-latency peer-to-peer video/audio streaming using Mediasoup SFU
- **HLS Broadcasting**: Automatic transcoding to HLS for unlimited viewers via FFmpeg
- **Multi-participant Rooms**: Support for multiple streamers in single rooms
- **Real-time Communication**: Socket.io for instant room management and signaling
- **Production Architecture**: Separated client/server with TypeScript compliance
- **Scalable Backend**: Express.js with Prisma ORM and PostgreSQL
- **Modern Frontend**: Next.js 15 with React 19 and Tailwind CSS
- **Docker Support**: Complete containerization for easy deployment

## 🏗️ Architecture

```
├── client/          # Next.js frontend application
├── server/          # Express.js backend with Mediasoup SFU
├── shared/          # Common TypeScript types and schemas
├── Dockerfile       # Production container setup
└── docker-compose.yml  # Complete infrastructure
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.4.5** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Socket.io Client** - Real-time communication
- **Mediasoup Client** - WebRTC client library
- **HLS.js** - HLS video playback

### Backend
- **Express.js** - Web server framework
- **Socket.io 4.7.2** - WebSocket communication
- **Mediasoup 3.12.9** - WebRTC SFU (Selective Forwarding Unit)
- **Prisma ORM** - Database abstraction
- **PostgreSQL** - Primary database
- **Redis** - Session management and caching
- **FFmpeg** - Video transcoding for HLS
- **Winston** - Logging

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **PostgreSQL 15** - Database
- **Redis 7** - Cache and session store

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker and Docker Compose
- FFmpeg (for HLS transcoding)

### Docker Deployment (Recommended)

1. **Clone and Setup**
```bash
git clone <repository-url>
cd webrtc-hls
cp .env.example .env
# Edit .env with your configuration
```

2. **Start with Docker Compose**
```bash
# Development environment
docker-compose up --build

# Production environment  
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

# Or use the Makefile for easier commands
make install  # First-time setup
make dev      # Development mode
make prod     # Production mode
```

3. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

For detailed Docker deployment instructions, see [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md).

### Development Setup (Monorepo)

1. **Clone and Install Dependencies**
```bash
git clone <repository-url>
cd webrtc-hls
npm run install:all
```

2. **Setup Database**
```bash
# Start PostgreSQL and Redis
docker-compose up postgres redis -d

# Setup database schema
npm run db:setup
```

3. **Start Development Servers**
```bash
# Build shared types and start both client and server in development mode
npm run dev
```

4. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database Studio: `npm run db:studio`

### Production Deployment

1. **Using Docker Compose**
```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

2. **Manual Production Build**
```bash
# Build both applications
npm run build

# Start production servers
npm start
```

## Architecture

- **Client**: Next.js 15 with TypeScript, Tailwind CSS, and Shadcn/ui
- **Server**: Express.js with Socket.io, Mediasoup SFU, and FFmpeg
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for session management
- **Storage**: Local file system for HLS segments

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- FFmpeg (for HLS transcoding)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd webrtc-hls
```

2. Install dependencies:
```bash
npm run install:all
```

3. Start infrastructure:
```bash
docker-compose up -d
```

4. Setup environment variables:
```bash
cp .env.example .env
# Update the .env file with your configuration
```

5. Setup database:
```bash
npm run db:setup
```

6. Start development servers:
```bash
npm run dev
```

### Access Points

- **Client Application**: http://localhost:3000
- **Server API**: http://localhost:3001
- **Database Studio**: `npm run db:studio`

## Usage

### Streaming (/stream)

1. Navigate to http://localhost:3000/stream
2. Allow camera and microphone permissions
3. Multiple users can join the same stream for multi-participant streaming

### Watching (/watch)

1. Navigate to http://localhost:3000/watch
2. View live HLS stream of all active streamers
3. No camera/microphone required - view-only mode

## Project Structure

```
webrtc-hls/
├── client/          # Next.js frontend application
├── server/          # Express.js backend with Mediasoup
├── shared/          # Shared types and utilities
├── docker-compose.yml
└── README.md
```

## Development Scripts

- `npm run dev` - Start both client and server in development mode
- `npm run build` - Build both applications for production
- `npm run start` - Start both applications in production mode
- `npm run db:setup` - Setup database and generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## Production Deployment

1. Build applications:
```bash
npm run build
```

2. Set production environment variables
3. Start applications:
```bash
npm run start
```

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, Socket.io, Mediasoup
- **Database**: PostgreSQL, Prisma ORM
- **Media**: FFmpeg, HLS.js
- **DevOps**: Docker, Docker Compose

## License

MIT License
