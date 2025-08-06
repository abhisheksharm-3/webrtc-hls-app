import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';

import env from './config/environment';
import { logger } from './utils/logger';
import { MediasoupWorker } from './mediasoup/worker';
import { setupSocket } from './socket';

// Import routes
import healthRoutes from './routes/health';
import roomRoutes from './routes/rooms';
import hlsRoutes from './routes/hls';

async function startServer() {
  try {
    // Initialize Express app
    const app = express();
    const server = createServer(app);

    // Middleware
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

    // Static files for HLS
    app.use('/hls', express.static(path.join(process.cwd(), env.HLS_STORAGE_PATH)));

    // Routes
    app.use('/api/health', healthRoutes);
    app.use('/health', healthRoutes); // Direct health endpoint for Docker
    app.use('/api/rooms', roomRoutes);
    app.use('/hls', hlsRoutes);

    // Initialize Mediasoup workers
    logger.info('Initializing Mediasoup workers...');
    await MediasoupWorker.getInstance().initialize();

    // Setup Socket.io
    logger.info('Setting up Socket.io...');
    const io = setupSocket(server);

    // Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Express error:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
      });
    });

    // 404 handler
    app.use('*', (req: express.Request, res: express.Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found',
      });
    });

    // Start server
    server.listen(env.PORT, () => {
      logger.info(`🚀 WebRTC-HLS Server running on port ${env.PORT}`);
      logger.info(`📡 Socket.io ready for connections`);
      logger.info(`🎥 HLS storage path: ${env.HLS_STORAGE_PATH}`);
      logger.info(`🌐 CORS origins: ${env.ALLOWED_ORIGINS}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      
      io.close();
      await MediasoupWorker.getInstance().close();
      
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      
      io.close();
      await MediasoupWorker.getInstance().close();
      
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
