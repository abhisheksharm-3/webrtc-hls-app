import { Router, Request, Response } from 'express';
import { getWorkerStats } from '../mediasoup/worker';

const router = Router();

/**
 * A general health check endpoint to confirm the server is running.
 * @route GET /
 */
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'WebRTC-HLS Server is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * A specific health check endpoint for Mediasoup.
 * It returns the status and process ID (PID) of each running Mediasoup worker.
 * @route GET /mediasoup
 */
router.get('/mediasoup', (req: Request, res: Response) => {
  try {
    const workerStats = getWorkerStats();
    res.status(200).json({
      status: 'ok',
      message: `Mediasoup is healthy with ${workerStats.length} active worker(s).`,
      workers: workerStats,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve Mediasoup worker stats.',
    });
  }
});

export default router;