import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../utils/logger';
import env from '../config/environment';
import { roomHandler } from './handlers/room';
import { webrtcHandler } from './handlers/webrtc';
import { hlsHandler } from './handlers/hls';
import { viewerHandler } from './handlers/viewer';

export function setupSocket(server: HttpServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: env.ALLOWED_ORIGINS.split(','),
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Attach handlers
    roomHandler(socket, io);
    webrtcHandler(socket, io);
    hlsHandler(socket, io);
    viewerHandler(socket, io);

    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  return io;
}
