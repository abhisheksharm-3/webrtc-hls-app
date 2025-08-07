import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';

import env from './config/environment';
import { logger } from './utils/logger';
import { setupSocket } from './socket';

// Import API route handlers
import healthRoutes from './routes/health';
import roomRoutes from './routes/rooms';
import hlsRoutes from './routes/hls';
import { closeAllWorkers, initializeWorkers } from './mediasoup/worker';

/**
 * The main bootstrap function for the application.
 */
async function startServer() {
  try {
    // --- 1. Initialize Mediasoup Workers ---
    // This must be done first, as everything else depends on the workers.
    logger.info('Initializing Mediasoup workers...');
    await initializeWorkers();

    // --- 2. Setup Express Server and Middleware ---
    const app = express();
    const httpServer = createServer(app);

    // Standard security and CORS middleware
    app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false,
    }));
    app.use(cors({
      origin: env.ALLOWED_ORIGINS.split(','),
      credentials: true,
    }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // --- 3. Define Routes and Static File Serving ---
    // Serve the HLS (.m3u8, .ts) files statically
    app.use('/hls', express.static(path.resolve(process.cwd(), env.HLS_STORAGE_PATH)));

    // Register API routes
    app.use('/api/health', healthRoutes);
    app.use('/health', healthRoutes);
    app.use('/api/rooms', roomRoutes);
    // Note: The '/hls' route is used for both static files and potential API calls (like getting a playlist)

    // --- 4. Setup Socket.IO Server ---
    logger.info('Setting up Socket.IO...');
    const io = setupSocket(httpServer);

    // --- 5. Setup Error Handling ---
    // Generic error handler for express routes
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Express error:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred.',
      });
    });

    // --- 6. Start the Server ---
    httpServer.listen(env.PORT, () => {
      logger.info(`🚀 Server is live and listening on port ${env.PORT}`);
    });

    // --- 7. Configure Graceful Shutdown ---
    const shutdown = () => {
      logger.info('SIGTERM/SIGINT received, shutting down gracefully...');
      io.close();
      closeAllWorkers();
      httpServer.close(() => {
        logger.info('Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();