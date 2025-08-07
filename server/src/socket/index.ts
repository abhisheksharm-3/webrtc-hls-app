/**
 * @file Initializes the Socket.IO server and registers all event handlers.
 */
import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../utils/logger';
import env from '../config/environment';
import { registerRoomHandlers } from './handlers/room';
import { registerWebRtcHandlers } from './handlers/webrtc';
import { registerHlsHandlers } from './handlers/hls';
import { registerViewerHandlers } from './handlers/viewer';

/**
 * Creates and configures the Socket.IO server, attaching it to the main HTTP server.
 * @param server The main HTTP server instance.
 * @returns The configured Socket.IO server instance.
 */
export function setupSocket(server: HttpServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: env.ALLOWED_ORIGINS.split(','), // Allow requests from specified frontend URLs
      credentials: true,
    },
    transports: ['websocket', 'polling'], // Standard transport options
  });

  // This runs for every single client that connects to the server
  io.on('connection', (socket) => {
    logger.info(`✅ Client connected: ${socket.id}`);

    // --- Register all the different event handlers for this specific socket ---
    registerRoomHandlers(io, socket);
    registerWebRtcHandlers(io, socket);
    registerHlsHandlers(io, socket);
    registerViewerHandlers(io, socket);

    // Note: The main 'disconnect' handler is now inside registerRoomHandlers
    // to ensure access to the participant's room state for cleanup.

    socket.on('error', (error) => {
      logger.error(`Socket error | socketId: ${socket.id}:`, error);
    });
  });

  logger.info('Socket.IO server initialized.');
  return io;
}